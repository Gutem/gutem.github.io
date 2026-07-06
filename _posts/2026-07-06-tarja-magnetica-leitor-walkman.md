---
layout: post
title: "Tarja magnética (parte 3): um leitor com o cabeçote de um Walkman"
date: 2026-07-06 00:00:00
categories: [seguranca, hardware, diy]
tags: [magstripe, tarja-magnetica, diy, walkman, f2f, javascript, audio]
description: "Construindo um leitor de tarja com o cabeçote de um toca-fitas e uma placa de som — captura o swipe como áudio e decodifica F2F em JavaScript puro."
---

> **Série "Do Magstripe ao Token"** — parte 3.
> [1](/posts/magstripe-emv-token-anatomia-do-cartao) · [2](/posts/tarja-magnetica-byte-a-byte) · **3) Leitor com Walkman (este)** ·
> [4) Arduino](/posts/tarja-magnetica-leitor-arduino) · [5) Cartões de sócio](/posts/tarja-magnetica-cartoes-de-socio-hackerspace).

Você não precisa de um leitor comercial pra ler uma tarja. Precisa de uma bobina que sinta campo magnético — e é exatamente isso que o **cabeçote de um toca-fitas** é. Um Walkman morto vira um leitor de bancada por quase zero real.

## Por que funciona: o cabeçote é um microfone de magnetismo

O cabeçote é uma bobina num núcleo com um entreferro. Quando um campo magnético variável passa na frente dele, induz uma tensão (Faraday) proporcional à **taxa de variação do fluxo**. Na tarja, cada **inversão de fluxo** vira um **pico de tensão**. O cabeçote não "vê" bits — vê os **cliques** entre eles. E como o F2F é auto-sincronizado (parte 2), os *intervalos* entre cliques carregam a informação.

## Lista de materiais

| Item | Nota |
|:--|:--|
| Cabeçote de cassete | de qualquer Walkman/deck morto |
| Plugue P2 (3,5 mm) | entra no **line-in/mic** do PC |
| Fio blindado curto | reduz zumbido de 60 Hz |
| Um trilho/guia | pra deslizar o cartão em altura constante |

## Caminho de sinal

```
cabeçote ──▶ (pré-amp op-amp opcional) ──▶ P2 ──▶ line-in
   │                                                 │
   └─ alinhe o gap na altura da Trilha 2 (~5,66 mm da borda)
```

1. Solde os fios do cabeçote no P2 (use a malha no terra).
2. Alinhe o gap na faixa da **Trilha 2** (a mais fácil: 5 bits, numérica).
3. Faça um guia reto pro cartão deslizar encostado.
4. Grave o swipe no Audacity (mono, 44,1 kHz) → `swipe.wav`.

## Decodificando em JS puro

O `wav-decode.mjs` faz WAV → picos → F2F adaptativo → bits → caracteres. O coração é a detecção de picos (cada inversão de fluxo) e o F2F com **clock adaptativo** (o T vai variando conforme sua mão acelera):

```js
export function f2fBits(peaks) {
  const iv = peaks.slice(1).map((p, i) => p - peaks[i])   // intervalos
  const head = iv.slice(0, 16).slice().sort((a, b) => a - b)
  let T = head[head.length >> 1]                          // clock inicial (mediana)

  const bits = []
  for (let i = 0; i < iv.length; ) {
    const d = iv[i]
    if (d > 0.75 * T) { bits.push(0); T = 0.7 * T + 0.3 * d; i += 1 }        // "0"
    else              { bits.push(1); T = 0.7 * T + 0.3 * (d + iv[i+1]); i += 2 } // "1"
  }
  return bits
}
```

Depois é só agrupar em caracteres de 5 bits (LSB primeiro), checar paridade, achar `;`, ler até `?` e validar o LRC (parte 2). Se não decodificar, **inverta a sequência** e tente de novo — você pode ter passado o cartão ao contrário.

## Testando sem swipe real

Como validar o decodificador sem um recording perfeito? **Sintetizando** o sinal: pegamos uma trilha conhecida, geramos os picos F2F que um cabeçote produziria, embrulhamos num WAV e mandamos pro decodificador. Se sair a mesma trilha, a lógica está certa. É exatamente um dos testes do repositório — e ele passa:

```
sintetiza e decodifica de volta a mesma trilha ✓
```

A saída (`;9000000000000019=2812101?1`) é a **mesma** string que um leitor comercial cospe — então cai direto no parser da parte 2 e no controle de acesso da parte 5.

## Dicas de bancada

- **Zumbido de 60 Hz**: blindagem no terra + cabo curto.
- **Velocidade**: movimento contínuo importa mais que rapidez; o F2F odeia *parar no meio*.
- **Só Trilha 2**: com um cabeçote de canal único, lê-se uma faixa por vez.

Na **[parte 4](/posts/tarja-magnetica-leitor-arduino)** tiramos o PC da jogada: o mesmo F2F, agora rodando num Arduino.
