---
layout: post
title: "Do Magstripe ao Token (parte 3): um leitor com o cabeçote de um Walkman"
date: 2026-07-06 00:00:00
categories: [seguranca, hardware, diy]
tags: [magstripe, tarja-magnetica, diy, walkman, f2f, javascript, audio]
description: "Construindo um leitor de tarja com o cabeçote de um toca-fitas e uma placa de som: captura o swipe como áudio e decodifica F2F em JavaScript puro — detecção de picos, clock adaptativo e um teste por síntese."
---

> **Série "Do Magstripe ao Token"** — parte 3.
> [1](/posts/magstripe-emv-token-anatomia-do-cartao) · [2](/posts/tarja-magnetica-byte-a-byte) · **3) Leitor com Walkman (este)** ·
> [4) Arduino](/posts/tarja-magnetica-leitor-arduino) · [5) Cartões de sócio](/posts/tarja-magnetica-cartoes-de-socio-hackerspace) ·
> [6) EMV, Token e as defesas](/posts/tarja-magnetica-ataques-e-defesas).

Nas partes 1 e 2 entendemos *o que* a tarja carrega e *como* ela codifica bits (F2F). Hora de provar que entendemos: **construindo o leitor**. E não precisa de um leitor comercial — precisa de uma bobina que sinta campo magnético. É exatamente isso que o **cabeçote de um toca-fitas** é. Um Walkman morto vira um leitor de bancada por quase zero real.

## Por que funciona: o cabeçote é um microfone de magnetismo

Um cabeçote de fita é uma **bobina num núcleo com um entreferro** (o gap). Quando um campo magnético variável passa na frente do gap, ele **induz uma tensão** (lei de Faraday) proporcional à **taxa de variação do fluxo** (dΦ/dt).

Traduzindo pra tarja: cada **inversão de fluxo** gravada (as tais transições F2F da parte 2) vira um **pico de tensão** quando passa pelo cabeçote. O cabeçote não "vê" os bits — ele vê os **cliques** entre eles. E como o F2F é auto-sincronizado, os *intervalos* entre cliques carregam toda a informação. Nosso trabalho em software é: achar os picos, medir os intervalos, decidir 0 ou 1.

## Lista de materiais

| Item | Nota |
|:--|:--|
| Cabeçote de cassete | de qualquer Walkman/deck morto (o bloquinho prateado) |
| Plugue P2 (3,5 mm) | entra no **line-in/mic** do PC |
| Fio blindado curto | reduz zumbido de 60 Hz |
| Guia/trilho | pra deslizar o cartão em altura constante |
| (opcional) op-amp | LM358 como pré-amp se a entrada tiver ganho baixo |

## Caminho de sinal

```
cabeçote ──▶ (pré-amp op-amp, opcional) ──▶ P2 ──▶ line-in do PC
   │
   └─ alinhe o gap na altura da Trilha 2 (~5,66 mm da borda de referência)
```

1. Solde os dois fios do cabeçote no P2, com a **malha blindada** no terra.
2. Alinhe o gap na faixa da **Trilha 2** — a mais fácil (5 bits, numérica).
3. Faça um guia reto pro cartão deslizar encostado no gap.
4. Grave o swipe no Audacity (mono, 44,1 kHz) → `swipe.wav`.

Um swipe manual gera frequências bem dentro do áudio, então 44,1 kHz sobra. Se o sinal vier fraco, aumente o ganho de entrada ou meta o pré-amp op-amp (ganho ~100).

## Decodificando: de picos a bits

O `wav-decode.mjs` faz WAV → picos → F2F → bits → caracteres. Duas etapas merecem código.

**1) Detecção de picos.** Como o cabeçote entrega dΦ/dt, cada inversão é um extremo local. Achamos os extremos acima de um limiar (fração do pico máximo, pra ignorar ruído):

```js
export function detectPeaks(samples, thr = 0.15) {
  let max = 0
  for (const s of samples) max = Math.max(max, Math.abs(s))
  const peaks = []
  for (let i = 1; i < samples.length - 1; i++) {
    const a = samples[i]
    const ext = (a > samples[i-1] && a >= samples[i+1]) || (a < samples[i-1] && a <= samples[i+1])
    if (ext && Math.abs(a) >= thr * max) peaks.push(i)
  }
  return peaks
}
```

**2) F2F com clock adaptativo.** O `T` (duração de célula) varia conforme sua mão acelera, então ele é reestimado a cada bit:

```js
export function f2fBits(peaks) {
  const iv = peaks.slice(1).map((p, i) => p - peaks[i])          // intervalos
  const head = iv.slice(0, 16).slice().sort((a, b) => a - b)
  let T = head[head.length >> 1]                                 // clock inicial (mediana dos zeros de sync)

  const bits = []
  for (let i = 0; i < iv.length; ) {
    const d = iv[i]
    if (d > 0.75 * T) { bits.push(0); T = 0.7*T + 0.3*d;            i += 1 }  // "0": célula cheia
    else              { bits.push(1); T = 0.7*T + 0.3*(d + iv[i+1]); i += 2 }  // "1": duas meias-células
  }
  return bits
}
```

Depois é só agrupar em caracteres de 5 bits (LSB primeiro), checar a paridade ímpar, achar a sentinela `;`, ler até `?` e validar o LRC — exatamente a mecânica da [parte 2](/posts/tarja-magnetica-byte-a-byte). Se não decodificar, **inverta a sequência** e tente de novo: você pode ter passado o cartão ao contrário.

## Como testar sem um swipe perfeito

Recording de cabeçote caseiro é ruidoso — como saber se o bug está no hardware ou no código? **Sintetizando** o sinal. Pegamos uma trilha conhecida, geramos os picos F2F que um cabeçote *produziria*, embrulhamos num WAV e mandamos pro decodificador. Se sair a mesma trilha, a lógica está provada. É um dos testes do repositório, e passa:

```
sintetiza e decodifica de volta a mesma trilha ✓
```

Isso separa o problema em dois: se a síntese decodifica mas o recording real não, o problema é **analógico** (ganho, ruído, alinhamento) — não o algoritmo.

## Dicas de bancada

- **Zumbido de 60 Hz**: blindagem no terra + cabo curto resolvem 90%.
- **Velocidade**: movimento contínuo importa mais que rapidez; o F2F odeia *parar no meio* do swipe.
- **Só Trilha 2**: com um cabeçote de canal único, lê-se uma faixa por vez. Pra Trilha 1, reposicione o gap (~2,79 mm da borda).

A saída (`;509431...=...?`) é a **mesma** string que um leitor comercial cospe — então cai direto no parser da parte 2 e no controle de acesso da parte 5. Na **[parte 4](/posts/tarja-magnetica-leitor-arduino)** tiramos o PC da jogada: o mesmo F2F, agora rodando num microcontrolador.
