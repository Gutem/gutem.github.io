---
layout: post
title: "Tarja magnética (parte 4): um leitor com Arduino"
date: 2026-07-06 00:00:00
categories: [seguranca, hardware, diy]
tags: [magstripe, tarja-magnetica, arduino, embarcados, f2f, diy]
description: "O mesmo leitor de tarja, agora sem PC: cabeçote → pré-amp → comparador → interrupção no Arduino, com F2F decodificado no firmware e saída pela serial."
---

> **Série "Do Magstripe ao Token"** — parte 4.
> [1](/posts/magstripe-emv-token-anatomia-do-cartao) · [2](/posts/tarja-magnetica-byte-a-byte) ·
> [3](/posts/tarja-magnetica-leitor-walkman) · **4) Arduino (este)** ·
> [5) Cartões de sócio](/posts/tarja-magnetica-cartoes-de-socio-hackerspace).

Na parte 3 usamos a placa de som do PC como ADC. Agora vamos deixar isso autônomo: um **Arduino** lendo o cabeçote direto. É o passo natural rumo a um controlador de porta que não depende de computador.

## O problema: o sinal do cabeçote é minúsculo

A saída do cabeçote é da ordem de **milivolts** e bipolar. Jogar isso no ADC do Arduino direto é sofrível. A solução clássica é um front-end analógico simples que transforma os picos em **bordas digitais limpas**:

```
cabeçote ──▶ pré-amp (LM358, ganho ~100) ──▶ comparador (LM393) ──▶ D2 (INT0)
                                                                      │
                                          borda a cada inversão de fluxo
```

O comparador "quadra" o sinal: cada inversão de fluxo vira uma **transição** (borda de subida/descida) num pino de interrupção. Agora o Arduino só precisa **cronometrar bordas**.

## Cronometrando na interrupção

A ISR guarda o timestamp (`micros()`) de cada borda num buffer:

```c
volatile uint32_t edges[MAX_EDGES];
volatile uint16_t nEdges = 0;

void onEdge() {
  if (nEdges < MAX_EDGES) edges[nEdges++] = micros();
  lastEdgeUs = micros();
}

void setup() {
  attachInterrupt(digitalPinToInterrupt(2), onEdge, CHANGE);
}
```

Quando passa ~20 ms sem nenhuma borda, o swipe acabou — hora de decodificar.

## F2F no firmware

O mesmo algoritmo da parte 3, agora em C, com clock adaptativo em `float`:

```c
uint32_t d = edges[i] - edges[i-1];
if (d > 0.75 * T) { bits[nb++] = 0; T = 0.7*T + 0.3*d;          i += 1; }  // "0"
else              { bits[nb++] = 1; T = 0.7*T + 0.3*(d + d2);   i += 2; }  // "1"
```

Depois: agrupar em caracteres de 5 bits (LSB primeiro), checar paridade ímpar, alinhar em `;`, parar em `?`. A trilha decodificada sai pela serial:

```
Track2: ;9000000000000019=2812101?1
```

## De leitor a fechadura

Com a trilha na serial, o resto é lógica de aplicação — a mesma da [parte 5](/posts/tarja-magnetica-cartoes-de-socio-hackerspace): extrai a conta do PAN, consulta a lista de sócios, e se libera, aciona um **relé** num GPIO. Um ESP32 fecha o ciclo com Wi-Fi (log de acesso, sincronizar a lista de sócios pela rede).

> **Nota de bancada:** o ponto delicado é o front-end analógico. Sem o pré-amp/comparador, o Arduino não enxerga o cabeçote. Se quiser pular essa parte, existem **módulos leitores TTL** prontos (saída Data/Strobe/CardPresent) que plugam direto no Arduino — mas aí some a graça de ler o cabeçote cru.

O sketch completo (`arduino/magstripe_reader.ino`) está no repositório. Na **[parte 6](/posts/tarja-magnetica-ataques-e-defesas)**, fechamos a série voltando à segurança: por que tudo isso que construímos é, ao mesmo tempo, educativo e inofensivo — e onde estaria o crime.
