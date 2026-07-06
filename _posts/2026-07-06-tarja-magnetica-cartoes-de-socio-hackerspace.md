---
layout: post
title: "Do Magstripe ao Token (parte 4): cartões de sócio para o seu hackerspace"
date: 2026-07-06 00:00:00
categories: [seguranca, hardware, diy]
tags: [magstripe, tarja-magnetica, hackerspace, controle-de-acesso, arduino, javascript, iso7813, msr]
description: "Como um hackerspace grava os próprios cartões de sócio por tarja — copiando o formato do cartão bancário (ISO 7813), que era a única documentação disponível, mas com um BIN de uso privado. Com a história do movimento hackerspace e o script JS de leitura/escrita."
---

> **Série "Do Magstripe ao Token"** — parte 4.
> [1) A anatomia de um cartão](/posts/magstripe-emv-token-anatomia-do-cartao) ·
> [2) A trilha byte a byte](/posts/tarja-magnetica-byte-a-byte) ·
> [3) Construindo um leitor de tarja](/posts/tarja-magnetica-construindo-um-leitor) ·
> **4) Cartões de sócio (este)** ·
> [5) EMV, Token e as defesas](/posts/tarja-magnetica-ataques-e-defesas).

Nas partes anteriores a gente leu, decodificou e construiu leitores de tarja. Agora vem o lado divertido e **legítimo**: gravar os **nossos próprios** cartões. O caso de uso perfeito é o **controle de acesso de um hackerspace** — cada sócio ganha um cartão que abre a porta.

## Um pouco da cultura que inventou esse problema

Controle de acesso por cartão é, historicamente, um dos **primeiros projetos** que quase todo hackerspace toca — quase um rito de passagem. E o movimento hackerspace tem uma história bonita. Os alemães abriram caminho: o **Chaos Computer Club** (fundado em **1981**) e espaços como o **c-base**, aberto em Berlim em **1995**, mostraram que um lugar físico com ferramentas compartilhadas podia ser a base de uma comunidade técnica.

O boom global veio depois de **2007**. Naquele ano, num evento que ficou conhecido como *"Hackers on a Plane"*, um grupo de hackers americanos visitou espaços europeus no Congresso do CCC — e voltou inspirado. No mesmo **24C3** (2007), a palestra **"Building Hacker Spaces Everywhere: Your Excuses are Invalid"** e os célebres **"Hackerspace Design Patterns"** (de Jens Ohlig, Lars Weiler e Nick Farr) viraram manual. Dali saíram o **NYC Resistor**, o **HacDC** e o **Noisebridge** (San Francisco), e o wiki **hackerspaces.org** catalogou centenas de espaços mundo afora. A porta que só abre pra sócio é parte desse DNA: comunitária, mas com um mínimo de controle.

E aqui vale contar como isso realmente acontece: **ninguém inventa um formato do zero.** A única documentação de trilha magnética que a gente tinha à mão era... um cartão de banco. Foi lendo um cartão financeiro de verdade (o mesmo exercício da [parte 1](/posts/magstripe-emv-token-anatomia-do-cartao)) que aprendemos o formato. Então o cartão de sócio nasceu como uma **cópia do formato ISO/IEC 7813** — o mesmo dos cartões de crédito/débito. Aprendemos com o que existia.

## Copiar o formato, com uma diferença crucial

A tarja é um meio burro: grava o que você mandar. Então reusamos **exatamente** a estrutura do cartão financeiro:

```
Trilha 1:  %B <PAN> ^ <SOBRENOME/NOME> ^ <validade YYMM><service code><discricionário> ?  LRC
Trilha 2:  ;    <PAN> = <validade YYMM><service code><discricionário> ?  LRC
```

O PAN é montado igual a um cartão de verdade (ISO 7812): **BIN + número da conta + dígito de Luhn**. A diferença que **importa** está no BIN:

> Usamos um **BIN de uso privado** — o primeiro dígito (MII) igual a **9**, que a ISO/IEC 7812 reserva para **uso nacional/privado**. Assim o PAN **não colide** com nenhuma bandeira real e o cartão é inequivocamente **não** um meio de pagamento.

Ou seja: copiamos a *forma* do cartão bancário (porque era a documentação disponível), mas o **conteúdo** é claramente auto-emitido. Um sócio vira `9000000000000019`: BIN `900000`, conta `1`, Luhn `9`.

## O núcleo em JS: LRC, Luhn e o PAN

Três peças. Os **charsets** (5 bits na Trilha 2, 6 na Trilha 1), o **LRC** (XOR de todos os caracteres, de `;`/`%` até `?`) e o **Luhn** do PAN — idêntico ao do cartão financeiro da parte 1:

```js
const T2 = '0123456789:;<=>?'
const lrc = body => { let x = 0; for (const c of body) x ^= T2.indexOf(c); return T2[x & 0x0f] }

// PAN no esquema ISO 7812: BIN + conta + dígito de Luhn
function buildPAN(bin, account, length = 16) {
  const body = bin + String(account).padStart(length - bin.length - 1, '0')
  return body + luhnDigit(body)
}

// Trilha 2 no formato financeiro: ;PAN=YYMM + service + discricionário ? LRC
function encodeTrack2({ pan, expiry, service = '101' }) {
  const body = `;${pan}=${expiry}${service}?`
  return body + lrc(body)
}
```

Decodificar é o inverso: casa o formato ISO 7813 por regex, **recalcula o LRC** e valida o **Luhn do PAN**. Se qualquer um falhar, a leitura foi corrompida (ou o cartão é forjado):

```js
function decodeTrack2(track) {
  const m = track.match(/^;(\d{1,19})=(\d{4})(\d{3})(\d*)\?(.)$/)
  if (!m) return { ok: false, error: 'formato inválido' }
  const [, pan, expiry, service, , lrcChar] = m
  if (lrc(track.slice(0, -1)) !== lrcChar) return { ok: false, error: 'LRC não confere' }
  if (!luhnValid(pan))                      return { ok: false, error: 'Luhn não confere' }
  return { ok: true, pan, expiry, service }
}
```

## Modo escrita: cadastrando um sócio

O comando `enroll` monta o PAN, gera as duas trilhas e guarda o sócio num `members.json`:

```bash
$ node card.mjs enroll --id 1 --name "CARVALHO/GUTEMBERG" --expiry 2812

Sócio #1 — CARVALHO/GUTEMBERG — PAN 9000000000000019 — validade 2812

Grave estas trilhas no cartão (gravador MSR):
  Track 1: %B9000000000000019^CARVALHO/GUTEMBERG^2812101??
  Track 2: ;9000000000000019=2812101?1
```

Repare: **é a cara de um cartão de banco** — `%B`, PAN, nome, validade, service code `101`. Só o BIN `9…` denuncia que é auto-emitido. Essas strings vão para um **gravador MSR** (MSR605/606) — o mesmo aparelho que grava chave de hotel:

```
ESC 'w' ESC 's' ESC '1' <trilha1> ESC '2' <trilha2> '?' FS
```

Use **cartões HiCo** (tarja preta) — não apagam no bolso, como vimos na [parte 2](/posts/tarja-magnetica-byte-a-byte).

## Modo leitura: a porta

Na porta, um leitor *keyboard-wedge* (ou o seu leitor de Arduino da [parte 3](/posts/tarja-magnetica-construindo-um-leitor)) alimenta o `read`. O script captura o swipe em **modo raw** (sem eco), decodifica e decide o acesso: extrai a conta do PAN, procura o sócio, checa ativo e validade.

```js
function checkAccess(track2) {
  const dec = decodeTrack2(track2)
  if (!dec.ok) return { granted: false, reason: dec.error }

  const memberId = accountOf(dec.pan)             // tira BIN e Luhn
  const m = members.find(x => String(x.id) === memberId)
  if (!m)                       return { granted: false, reason: 'não cadastrado' }
  if (!m.active)                return { granted: false, reason: 'sócio inativo' }
  if (!notExpired(dec.expiry))  return { granted: false, reason: 'cartão vencido' }
  return { granted: true, member: m }
}
```

Na prática:

```bash
$ node card.mjs read
✅ ACESSO LIBERADO — #1 CARVALHO/GUTEMBERG (val. 2812)
```

E as recusas, todas cobertas por teste:

```
⛔ ACESSO NEGADO — cartão vencido
⛔ ACESSO NEGADO — sócio inativo
⛔ ACESSO NEGADO — LRC não confere
⛔ ACESSO NEGADO — Luhn não confere
```

Ligue a saída "liberado" a um relé e você tem a fechadura. Um ESP32 rodando o `read` com um relé no GPIO já é um controlador de porta completo — e sincroniza a lista de sócios pela rede.

## Modelo de ameaça: seja honesto sobre o que isso é

Aqui a lição de segurança — e o motivo de copiar o formato do banco ser inofensivo:

> **A tarja é clonável.** Copiar o formato do cartão financeiro **não** herda a segurança dele. A segurança do cartão de banco moderno está no **chip (EMV)**, não na tarja — como veremos na [parte 5](/posts/tarja-magnetica-ataques-e-defesas). Copiamos a tarja, que é justamente a parte *insegura*.

E tudo bem — porque o **modelo de ameaça de um hackerspace é baixo**. O cartão resolve "quem é sócio ativo" com conveniência e custo quase zero, não "barrar um adversário determinado". Se precisar de mais:

- **Segundo fator**: tarja + PIN.
- **Log de acesso**: registre cada swipe (id, hora) — vale mais que a "força" do cartão.
- **Revogação**: `active:false` mata o cartão na hora; a validade `YYMM` limita o estrago de um perdido.
- **Subir o nível**: troque por **NFC com cripto**. Mas cuidado — nem todo NFC é seguro: o **MIFARE Classic** (da NXP, ex-Philips, de 1994) usava a cifra proprietária *Crypto-1*, que **Karsten Nohl e Henryk Plötz quebraram em 2008**. O caminho certo hoje é **MIFARE DESFire EV2/EV3** com **AES** e *challenge-response* — o equivalente ao salto tarja→EMV que veremos na próxima parte.

Reconhecer isso é o oposto de vender falsa segurança. A tarja é a fechadura de banheiro: mantém honesto quem já é honesto — e pra um hackerspace, é exatamente o suficiente.

## Rodando

Tudo no repositório, com testes (`bun test` — roundtrip encode/decode, LRC, Luhn e um **WAV F2F sintetizado e decodificado de volta**):

```bash
git clone https://github.com/Gutem/msr-reader
cd msr-reader && bun test
node card.mjs enroll --id 99 --name "FULANO/DE TAL"
node card.mjs read
```

Na **[parte 5](/posts/tarja-magnetica-ataques-e-defesas)** fechamos a série: **EMV, tokenização e as defesas** — por que a tarja morreu, como o chip a aposentou, e por que copiar o formato do banco num crachá é inofensivo (mas copiar num meio de pagamento é crime).

## Referências

- Movimento hackerspace: Chaos Computer Club (1981), c-base (Berlim, 1995), *Hackerspace Design Patterns* (24C3, 2007).
- ISO/IEC 7812 — o MII `9` reservado para uso privado.
- Karsten Nohl & Henryk Plötz, quebra do MIFARE Classic / Crypto-1 (2008).
- Wikipedia: [Hackerspace](https://en.wikipedia.org/wiki/Hackerspace), [MIFARE](https://en.wikipedia.org/wiki/MIFARE), [Access control](https://en.wikipedia.org/wiki/Access_control).
- Repositório: `Gutem/msr-reader`.

> **Ética:** grave e leia apenas **os seus** cartões e os que o seu espaço emitir, sempre com **BIN de uso privado**. O código é educacional — controle de acesso próprio, não ferramenta para cartões de terceiros.
