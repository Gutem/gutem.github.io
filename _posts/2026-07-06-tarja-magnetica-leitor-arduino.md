---
layout: post
title: "Do Magstripe ao Token (parte 4): um leitor com Arduino"
date: 2026-07-06 00:00:00
categories: [seguranca, hardware, diy]
tags: [magstripe, tarja-magnetica, arduino, embarcados, f2f, diy, esp32]
description: "O mesmo leitor de tarja, sem PC: cabeçote → pré-amp → comparador → interrupção no Arduino, com F2F no firmware e saída serial. Do sinal de milivolts ao relé que abre a porta."
---

> **Série "Do Magstripe ao Token"** — parte 4.
> [1](/posts/magstripe-emv-token-anatomia-do-cartao) · [2](/posts/tarja-magnetica-byte-a-byte) ·
> [3](/posts/tarja-magnetica-leitor-walkman) · **4) Arduino (este)** ·
> [5) Cartões de sócio](/posts/tarja-magnetica-cartoes-de-socio-hackerspace) ·
> [6) EMV, Token e as defesas](/posts/tarja-magnetica-ataques-e-defesas).

Na [parte 3](/posts/tarja-magnetica-leitor-walkman) usamos a placa de som do PC como conversor A/D. Agora deixamos isso autônomo: um **Arduino** lendo o cabeçote direto. É o passo natural rumo a um controlador de porta que não depende de computador nenhum — o que a gente vai usar na parte 5.

## O problema: o sinal do cabeçote é minúsculo

A saída do cabeçote é da ordem de **milivolts** e **bipolar** (picos positivos e negativos, lembra da parte 3 — é dΦ/dt). Jogar isso no ADC de 10 bits do Arduino direto é sofrível: o sinal se perde no ruído de quantização. A solução clássica não é amostrar o sinal analógico e sim transformá-lo em **bordas digitais limpas** antes de entrar no microcontrolador.

## Front-end analógico: pré-amp + comparador

```
              +ganho ~100          histerese
cabeçote ──▶ pré-amp (LM358) ──▶ comparador (LM393) ──▶ D2 (INT0)
  ~mV            ~V                borda a cada             │
                                  inversão de fluxo        ▼
                                                      interrupção
```

- O **pré-amp** (LM358) leva os milivolts pra um nível utilizável.
- O **comparador** (LM393) "quadra" o sinal: cada pico vira uma **transição** (borda de subida/descida) — idealmente com um pouco de **histerese** pra não oscilar no ruído.

Agora o Arduino não precisa "enxergar" a forma de onda: só precisa **cronometrar as bordas**. Todo o trabalho analógico virou uma sequência de instantes.

### Lista de materiais

| Item | Papel |
|:--|:--|
| Arduino Uno/Nano (ou ESP32) | cronometra bordas, decodifica, aciona a porta |
| Cabeçote de cassete | o sensor (parte 3) |
| LM358 (op-amp) | pré-amplificador (~mV → ~V) |
| LM393 (comparador) | quadra o sinal em bordas digitais |
| Resistores | divisor da referência + histerese |
| Relé/servo | destrava a fechadura |

Tudo por menos que um leitor comercial — e você entende cada estágio.

## Cronometrando na interrupção

A ISR (rotina de interrupção) apenas guarda o timestamp de cada borda num buffer — rápido e sem processar nada dentro dela:

```c
volatile uint32_t edges[MAX_EDGES];
volatile uint16_t nEdges = 0;
volatile uint32_t lastEdgeUs = 0;

void onEdge() {
  uint32_t now = micros();
  if (nEdges < MAX_EDGES) edges[nEdges++] = now;
  lastEdgeUs = now;
}

void setup() {
  Serial.begin(115200);
  pinMode(2, INPUT);
  attachInterrupt(digitalPinToInterrupt(2), onEdge, CHANGE);
}
```

O fim do swipe é detectado por **silêncio**: passou ~20 ms sem nenhuma borda nova? Então o cartão terminou de passar — hora de decodificar o buffer.

## F2F no firmware

É o mesmo algoritmo da parte 3, agora em C, com o clock adaptativo em `float`:

```c
uint32_t d = edges[i] - edges[i-1];
if (d > 0.75 * T) { bits[nb++] = 0; T = 0.7*T + 0.3*d;          i += 1; }  // "0"
else              { bits[nb++] = 1; T = 0.7*T + 0.3*(d + d2);   i += 2; }  // "1"
```

Depois, a montagem dos caracteres — deslizar até a sentinela `;`, ler grupos de 5 bits (LSB primeiro), validar a paridade ímpar, parar no `?`:

```c
uint8_t v = bits[p] | (bits[p+1]<<1) | (bits[p+2]<<2) | (bits[p+3]<<3);
char c = "0123456789:;<=>?"[v];
```

E a trilha decodificada sai pela serial:

```
Track2: ;509431••••••5929=...?
```

## De leitor a fechadura

Com a trilha na serial, o resto é lógica de aplicação — a mesma da [parte 5](/posts/tarja-magnetica-cartoes-de-socio-hackerspace): extrai a conta do PAN, consulta a lista de sócios e, se liberar, aciona um **relé** num GPIO que destrava a porta. Num **ESP32** dá pra fechar o ciclo com Wi-Fi: sincronizar a lista de sócios pela rede e registrar um **log de acesso** (quem entrou, quando) — que, como veremos na parte 6, vale mais que a "força" do cartão.

## Onde isso costuma travar

- **O front-end é o ponto delicado.** Sem o pré-amp/comparador bem ajustado, o Arduino não enxerga o cabeçote. Comece validando as bordas num osciloscópio ou no próprio serial (conte quantas bordas chegam por swipe).
- **Histerese** no comparador evita bordas espúrias no ruído — sem ela, o `nEdges` estoura de lixo.
- **Atalho legítimo**: existem **módulos leitores TTL** prontos (saída Data/Strobe/Card-Present) que plugam direto no Arduino. Somem a graça de ler o cabeçote cru, mas resolvem o analógico num instante — bom pra quem quer focar na porta, não no sinal.

O sketch completo (`arduino/magstripe_reader.ino`) está no repositório. Na **[parte 5](/posts/tarja-magnetica-cartoes-de-socio-hackerspace)** paramos de só *ler* e passamos a *gravar*: cartões de sócio pro hackerspace.
