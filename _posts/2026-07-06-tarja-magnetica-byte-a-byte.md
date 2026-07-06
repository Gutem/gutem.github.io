---
layout: post
title: "Do Magstripe ao Token (parte 2): a trilha byte a byte"
date: 2026-07-06 00:00:00
categories: [seguranca, hardware]
tags: [magstripe, tarja-magnetica, iso7813, f2f, lrc, javascript, msr]
description: "A codificação da tarja por dentro: F2F/Aiken biphase, HiCo vs LoCo, charsets de 5 e 7 bits com paridade, sentinelas e o LRC — com cálculo e um parser em JS. Mais o bug do circunflexo ABNT."
---

> **Série "Do Magstripe ao Token"** — parte 2.
> [1) A anatomia de um cartão](/posts/magstripe-emv-token-anatomia-do-cartao) · **2) A trilha byte a byte (este)** ·
> [3) Leitor com cabeçote de Walkman](/posts/tarja-magnetica-leitor-walkman) ·
> [4) Leitor com Arduino](/posts/tarja-magnetica-leitor-arduino) ·
> [5) Cartões de sócio](/posts/tarja-magnetica-cartoes-de-socio-hackerspace) ·
> [6) EMV, Token e as defesas](/posts/tarja-magnetica-ataques-e-defesas).

Na [parte 1](/posts/magstripe-emv-token-anatomia-do-cartao) vimos *o que* a tarja carrega — PAN, nome, service code. Agora abrimos o *como*, no nível do bit. É aqui que a tarja deixa de ser mágica e vira engenharia de gravação magnética dos anos 60. Sem entender isto, os leitores caseiros das partes 3 e 4 seriam caixas-pretas.

## A física: fita cassete no seu cartão

A tarja é **fita magnética** — a mesma da fita cassete. Partículas ferromagnéticas cuja polaridade é gravada em pontos ao longo da faixa. Duas variedades, pela **coercividade** (o quão difícil é (des)magnetizar):

| Tipo | Coercividade | Cor | Uso |
|:--|:--|:--|:--|
| **LoCo** | ~300 Oe | marrom | hotel, transporte — apaga fácil |
| **HiCo** | ~2750 Oe | preta | banco — resistente |

Isso importa na hora de **gravar** (parte 5): cartão de banco é HiCo justamente pra não desmagnetizar no bolso.

## F2F: o relógio embutido no dado

Os bits são gravados em **F2F** (*two-frequency coherent-phase*, ou Aiken biphase). A regra: há uma **inversão de fluxo no início de cada célula** de bit; se o bit é **1**, há uma inversão **extra no meio**.

```
0:  |‾‾‾‾‾‾‾‾‾‾‾|___________|      (uma inversão por célula)
1:  |‾‾‾‾‾|_____|‾‾‾‾‾|_____|      (duas — a do meio marca o "1")
```

O truque é que o **relógio está no próprio sinal**. O leitor mede o intervalo entre inversões: se um intervalo é ~metade do anterior, achou um `1`; se é "cheio", um `0`. Por isso funciona no swipe rápido e no lento — a informação está na *razão* entre intervalos, não na velocidade absoluta. Guarde essa ideia: é literalmente o algoritmo que vamos programar nas partes 3 e 4.

As densidades também diferem: **210 bpi** (bits por polegada) nas Trilhas 1 e 3, **75 bpi** na Trilha 2 — o que define quantos caracteres cabem em cada uma.

## Charsets: 5 bits e 7 bits

Cada trilha tem seu alfabeto:

| Trilha | Bits/char | Composição | Alfabeto |
|:--|:--|:--|:--|
| 1 | 7 | 6 dados + 1 paridade | 64 chars (ASCII `0x20`–`0x5F`) |
| 2 e 3 | 5 | 4 dados + 1 paridade | dígitos + `:;<=>?` |

Na Trilha 2, cada caractere é um **BCD de 4 bits** mais um bit de **paridade ímpar**, gravado **LSB primeiro**. Um exemplo concreto — o dígito `5`:

```
5 = 0101 (binário) → LSB primeiro: 1 0 1 0
   dois "1"s nos dados → paridade ímpar exige total ímpar → paridade = 1
   caractere na fita: 1 0 1 0 | 1
```

A paridade ímpar por caractere é a primeira rede de proteção contra leitura ruidosa.

## Sentinelas, separadores e o LRC

A estrutura completa de uma trilha:

```
[zeros de clock]  SS   dados…   ES   LRC   [zeros]
                   ;    PAN=…     ?    ⊕
```

- **SS/ES**: start (`;` na T2, `%` na T1) e end (`?`).
- **LRC** (*Longitudinal Redundancy Check*): um caractere de **paridade por coluna** — o XOR dos valores de todos os caracteres, de SS a ES inclusive.

Em JS, o LRC da Trilha 2 é literalmente isto:

```js
const T2 = '0123456789:;<=>?'   // índice = valor de 4 bits
function lrc(body) {            // body = de ';' até '?' (inclusive)
  let x = 0
  for (const c of body) x ^= T2.indexOf(c)
  return T2[x & 0x0f]
}
```

Um exemplo: para `;1234=?`, o XOR dá `11 ^ 1 ^ 2 ^ 3 ^ 4 ^ 13 ^ 15`. É esse caractere final que o leitor recalcula pra saber se a leitura veio limpa. Somando **LRC** (por coluna) com a **paridade** (por caractere), você tem detecção de erro em duas dimensões — necessária porque ler uma fita passada na mão é ruidoso. E note: nada disso é segurança; é só integridade.

## Lendo de verdade: o parser (e um cuidado)

Com um leitor USB *keyboard-wedge* (que "digita" a trilha e dá Enter), a captura é trivial — mas com um detalhe importante de segurança: capturar em **modo raw, sem eco**, pra o PAN não vazar na tela nem no histórico do terminal. Em Node:

```js
process.stdin.setRawMode(true)  // não ecoa o que o leitor "digita"
let buf = ''
process.stdin.on('data', chunk => {
  for (const ch of chunk) {
    if (ch === '\r' || ch === '\n') { parse(buf); buf = '' }
    else buf += ch
  }
})
```

O parser então separa Trilha 1/2 por regex, **recalcula o LRC**, valida o **Luhn** do PAN e interpreta o service code (parte 1).

## O bug mais brasileiro possível

Ao ler meu cartão, a Trilha 1 simplesmente não parseava. O culpado: o separador de campo da Trilha 1 é `^` (caret). Mas com **teclado ABNT**, `^` é **tecla morta** (dead key) — e o leitor entregava `ˆ` (U+02C6) no lugar de `^` (U+005E). O dado estava lá; o parser é que tropeçava no acento.

```js
// normaliza o circunflexo "morto" do ABNT antes de parsear
const norm = data.replace(/[\u02C6\u0302]/g, '^')
```

Uma linha resolveu. É o tipo de bug que só nasce quando hardware, layout de teclado e um padrão dos anos 60 se encontram no mesmo terminal.

Agora que dominamos o formato, na **[parte 3](/posts/tarja-magnetica-leitor-walkman)** largamos o leitor pronto e construímos o nosso — com o cabeçote de um Walkman e uma placa de som. O algoritmo F2F daqui vira código lá.
