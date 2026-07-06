---
layout: post
title: "Tarja magnética (parte 2): a trilha byte a byte"
date: 2026-07-06 00:00:00
categories: [seguranca, hardware]
tags: [magstripe, tarja-magnetica, iso7813, f2f, lrc, javascript, msr]
description: "A codificação da tarja por dentro: F2F/Aiken biphase, charsets de 5 e 7 bits, paridade, sentinelas e o LRC. Mais um parser em JS e o bug do circunflexo ABNT."
---

> **Série "Do Magstripe ao Token"** — parte 2.
> [1) A anatomia de um cartão](/posts/magstripe-emv-token-anatomia-do-cartao) · **2) Byte a byte (este)** ·
> [3) Leitor com cabeçote de Walkman](/posts/tarja-magnetica-leitor-walkman) ·
> [4) Leitor com Arduino](/posts/tarja-magnetica-leitor-arduino) ·
> [5) Cartões de sócio](/posts/tarja-magnetica-cartoes-de-socio-hackerspace).

Na parte 1 vimos *o que* uma tarja carrega. Agora vamos abrir o *como* — o nível de bit. É aqui que a tarja deixa de ser mágica e vira engenharia de rádio dos anos 60.

## F2F: relógio embutido no dado

A tarja usa **F2F** (*two-frequency coherent-phase*, ou Aiken biphase). Regra: há uma **inversão de fluxo no início de cada célula** de bit; se o bit é **1**, há uma inversão **extra no meio**.

```
0:  |‾‾‾‾‾‾|______|      (uma inversão por célula)
1:  |‾‾‾|___|‾‾‾|__|     (duas — a do meio marca o "1")
```

O truque genial: o **relógio está no próprio sinal**. O leitor não precisa saber a velocidade do swipe — ele mede o intervalo entre inversões e, se um intervalo é ~metade do anterior, achou um `1`. Por isso funciona no swipe rápido e no lento.

## Charsets: 5 bits e 7 bits

Cada trilha tem seu alfabeto:

| Trilha | Bits/char | Composição | Alfabeto |
|:--|:--|:--|:--|
| 1 | 7 | 6 dados + 1 paridade | 64 chars (ASCII `0x20`–`0x5F`) |
| 2 e 3 | 5 | 4 dados + 1 paridade | dígitos + `:;<=>?` |

Na Trilha 2, cada caractere é um **BCD de 4 bits** mais um bit de **paridade ímpar**. Os "controles" são o próprio alfabeto: `;`=start, `=`=separador, `?`=end. Detalhe crucial: os bits vão **LSB primeiro**.

## Sentinelas, separadores e o LRC

A estrutura de uma trilha:

```
[zeros de clock]  SS  dados…  ES  LRC  [zeros]
                   ;   PAN=…   ?   ⊕
```

- **SS/ES**: start (`;` ou `%`) e end (`?`).
- **LRC** (*Longitudinal Redundancy Check*): um caractere de **paridade par por coluna**. Você faz XOR dos valores de todos os caracteres, de SS a ES inclusive.

Em JS, o LRC da Trilha 2 é literalmente isto:

```js
const T2 = '0123456789:;<=>?'
function lrc(body) {           // body = de ';' até '?'
  let x = 0
  for (const c of body) x ^= T2.indexOf(c)
  return T2[x & 0x0f]
}
```

O LRC pega **erro de leitura**, não é segurança. Some a ele a paridade ímpar por caractere e você tem detecção de erro em duas dimensões — necessária porque ler uma fita passada na mão é ruidoso.

## Lendo de verdade: o parser

Com um leitor USB *keyboard-wedge* (que "digita" a trilha e dá Enter), capturar é trivial — mas com um cuidado: capturar em **modo raw**, sem eco, pra o dado não vazar na tela. O parser então separa Trilha 1/2, valida LRC e Luhn, e interpreta o service code.

## O bug mais brasileiro possível

Ao ler meu cartão, a Trilha 1 não parseava. O motivo: o separador de campo da Trilha 1 é `^` (caret). Mas com **teclado ABNT**, `^` é **tecla morta** (dead key) — e o leitor entregava `ˆ` (U+02C6) em vez de `^` (U+005E). O dado estava lá; o parser é que tropeçava no acento.

```js
// normaliza o circunflexo "morto" do ABNT antes de parsear
const norm = data.replace(/[\u02C6\u0302]/g, '^')
```

Uma linha resolveu. É o tipo de bug que só aparece quando hardware, layout de teclado e padrão dos anos 60 se encontram.

Na **[parte 3](/posts/tarja-magnetica-leitor-walkman)** largamos o leitor pronto e construímos o nosso — com o cabeçote de um Walkman e uma placa de som.
