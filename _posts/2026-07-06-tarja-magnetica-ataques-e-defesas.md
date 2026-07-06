---
layout: post
title: "Tarja magnética (parte 6): ataques, defesas e onde mora o crime"
date: 2026-07-06 00:00:00
categories: [seguranca, pagamentos]
tags: [magstripe, emv, tokenizacao, fraude, seguranca, skimming]
description: "Fechando a série: skimming, clonagem, downgrade de service code e shimming — e por que quase todos falham hoje. Onde copiar o formato é inofensivo e onde vira crime."
---

> **Série "Do Magstripe ao Token"** — parte 6 (final).
> [1](/posts/magstripe-emv-token-anatomia-do-cartao) · [2](/posts/tarja-magnetica-byte-a-byte) ·
> [3](/posts/tarja-magnetica-leitor-walkman) · [4](/posts/tarja-magnetica-leitor-arduino) ·
> [5](/posts/tarja-magnetica-cartoes-de-socio-hackerspace) · **6) Ataques e defesas (este)**.

Construímos leitores, decodificamos trilhas e gravamos cartões de sócio. Fecho a série com a pergunta que importa: **se ler tarja é tão fácil, por que o mundo não desabou em fraude?** Porque a tarja foi cercada de defesas — e quase todo ataque clássico **já não funciona**.

## O princípio único

> **Dado estático pode ser copiado, mas não pode ser forjado numa transação dinâmica válida.**

Guarde essa frase. Ela explica cada defesa abaixo.

## As classes de ataque (e por que morreram)

### Skimming — a captura

Um leitor clandestino copia as trilhas, porque o dado é **estático**. É o passo que ainda é "fácil" — é o mesmo que nossos leitores caseiros fazem. A defesa não é impedir a captura, é **tornar o capturado inútil** (itens abaixo) e blindar terminais (P2PE, *tamper-evident*).

### Clonagem de tarja — falha hoje

Gravar as trilhas num cartão virgem já bastou um dia. Quebrou por camadas simultâneas:

- **iCVV ≠ CVV1**: o chip carrega uma cópia da Trilha 2 com um CVV **diferente**; um clone feito do chip não bate com o CVV1 que o emissor espera de uma tarja.
- **Autorização online**: o emissor confere CVV, service code e risco em tempo real.
- **Verificação do service code**: o emissor sabe que o cartão é "de chip" — uma tarja num cartão de chip já nasce suspeita.

### Downgrade de service code — o ataque que o EMV antecipou

A ideia (documentada na literatura acadêmica de EMV): como o service code diz "prefira o chip", o fraudador tentava **forçar a transação pra tarja** (fallback), onde não há criptograma. Não vou detalhar a manipulação — e nem precisa, porque ela **não cola mais**:

- o **emissor compara** o service code apresentado com o que ele gravou → divergência = fraude óbvia;
- bandeiras **monitoram e recusam** fallback anômalo; muitos emissores **bloqueiam fallback** por padrão;
- **liability shift**: quem aceitou a tecnologia fraca paga a conta;
- e o **iCVV** já derrubou o clone antes disso.

É redundância proposital: o EMV foi desenhado prevendo esse ataque.

### Shimming — o skimmer do chip

Um *shim* no slot intercepta a comunicação. Mas o que ele captura é um **ARQC** — criptograma de **uso único**, amarrado ao contador **ATC**. Reproduzir exige um criptograma novo e válido, que só o chip genuíno gera. Replay não funciona.

### E-commerce — a fronteira que sobrou

Onde ainda há dado estático (digitar PAN+CVV2), a defesa migrou pra **tokenização** (o número real nem circula) e **3-D Secure** (autenticação forte no emissor). Roubar PAN de um banco de dados vale cada vez menos.

## Onde é inofensivo e onde é crime

Isto amarra a série toda. Ao longo dela, gravamos cartões copiando o **formato ISO 7813** — o mesmo do cartão de banco. Por que isso é ok?

| Ação | Status |
|:--|:--|
| Ler **o seu** cartão pra entender o formato | ✅ legítimo (é o que um POS faz) |
| Gravar crachá de sócio com **BIN privado (MII 9)** | ✅ legítimo (auto-emissão; não é meio de pagamento) |
| Construir leitor/gravador pra bancada | ✅ legítimo (ferramenta) |
| Ler/clonar cartão de **terceiro** | ⛔ crime |
| Gravar **PAN real de outra pessoa** num cartão | ⛔ crime |
| Manipular service code pra fraudar fallback | ⛔ crime |

A diferença nunca é a **técnica** — é o **dado** e a **autorização**. Copiar a *forma* de um cartão pra abrir a porta do seu hackerspace é como imitar o formato de uma nota fiscal pra organizar seus recibos: a estrutura é pública, o conteúdo é seu. Copiar o *conteúdo* de um cartão alheio pra pagar com ele é falsificação.

## O arco da série

- **Magstripe**: dado estático, copiável — e por isso cercado de defesas externas.
- **EMV**: transformou cada compra numa assinatura viva (ARQC/ATC) — matou a clonagem presencial.
- **Token**: trocou o próprio número por um alias restrito — matou o valor do PAN vazado.

Cada camada assume que a anterior *vai* vazar, e projeta pra que o vazamento seja inútil. Entender isso a fundo — a ponto de construir o sensor da tarja com um cabeçote de Walkman — é o que separa quem **usa** o sistema de quem **entende** o sistema. E entender é, sempre, o lado certo da força.

> **Ética:** toda a série foi feita com cartões próprios, leitores próprios e **BIN de uso privado** nos crachás. Ler, copiar ou clonar cartões de terceiros é crime. O material é educacional — sobre *como* o sistema funciona e *por que* ele é (hoje) difícil de fraudar.
