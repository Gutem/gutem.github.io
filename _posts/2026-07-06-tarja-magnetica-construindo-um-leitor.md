---
layout: post
title: "Do Magstripe ao Token (parte 3): construindo um leitor de tarja"
date: 2026-07-06 00:00:00
categories: [seguranca, hardware, diy]
tags: [magstripe, tarja-magnetica, diy, walkman, arduino, f2f, javascript, esp32]
description: "Dois leitores de tarja do zero: um com o cabeçote de um Walkman + placa de som (decodificando F2F em JavaScript), outro autônomo com Arduino (pré-amp, comparador e F2F no firmware). Da lei de Faraday ao relé que abre a porta."
---

> **Série "Do Magstripe ao Token"** — parte 3.
> [1](/posts/magstripe-emv-token-anatomia-do-cartao) · [2](/posts/tarja-magnetica-byte-a-byte) · **3) Construindo um leitor (este)** ·
> [4) Cartões de sócio](/posts/tarja-magnetica-cartoes-de-socio-hackerspace) ·
> [5) EMV, Token e as defesas](/posts/tarja-magnetica-ataques-e-defesas).

Nas partes 1 e 2 entendemos *o que* a tarja carrega e *como* ela codifica bits (F2F). Hora de provar que entendemos: **construindo o leitor**. E não precisa de um leitor comercial — precisa de uma bobina que sinta campo magnético. Vamos fazer isso de duas formas, do mais simples ao mais autônomo: primeiro ligando um **cabeçote de Walkman na placa de som** do PC, depois montando um leitor **stand-alone com Arduino**. As duas rodam **o mesmo algoritmo F2F** — muda só onde ele executa.

## O sensor: por que um cabeçote de fita lê uma tarja

Antes das duas abordagens, o coração comum: o **cabeçote**. Ele é uma **bobina em torno de um núcleo com um entreferro** (o *gap*). Quando um campo magnético variável passa na frente do gap, ele **induz uma tensão** na bobina. Isso é a **lei de indução de Faraday**, que **Michael Faraday** descreveu em **1831**: a tensão induzida é proporcional à **taxa de variação do fluxo** magnético (dΦ/dt).

Traduzindo pra tarja: cada **inversão de fluxo** gravada (as transições F2F da [parte 2](/posts/tarja-magnetica-byte-a-byte)) vira um **pico de tensão** quando passa pelo gap. O cabeçote não "vê" bits — ele vê os **cliques** entre eles. E como o F2F é auto-sincronizado, os *intervalos* entre cliques carregam toda a informação. Nosso trabalho, em qualquer implementação, é sempre o mesmo: **achar os picos, medir os intervalos, decidir 0 ou 1**.

Um cabeçote serve porque é *exatamente* o mesmo componente que lia sua fita cassete — herança da gravação magnética de Valdemar Poulsen (1898). Um Walkman morto na gaveta é um sensor de tarja esperando pra nascer.

---

## Caminho 1 — Cabeçote + placa de som (o mais barato)

A placa de som do PC já é um **conversor analógico-digital** de ótima qualidade. Por que não usá-la?

### Lista de materiais

| Item | Nota |
|:--|:--|
| Cabeçote de cassete | de qualquer Walkman/deck morto (o bloquinho prateado) |
| Plugue P2 (3,5 mm) | entra no **line-in/mic** do PC |
| Fio blindado curto | reduz zumbido de 60 Hz |
| Guia/trilho | pra deslizar o cartão em altura constante |

### Caminho de sinal

```
cabeçote ──▶ P2 ──▶ line-in do PC ──▶ Audacity (grava WAV)
   │
   └─ alinhe o gap na altura da Trilha 2 (~5,66 mm da borda de referência)
```

1. Solde os dois fios do cabeçote no P2, com a **malha blindada** no terra.
2. Alinhe o gap na faixa da **Trilha 2** — a mais fácil (5 bits, numérica).
3. Faça um guia reto pro cartão deslizar encostado no gap.
4. Grave o swipe no Audacity (mono, 44,1 kHz) → `swipe.wav`.

Um swipe manual gera frequências bem dentro do áudio, então 44,1 kHz sobra. Se o sinal vier fraco, aumente o ganho de entrada.

### Decodificando: de picos a bits

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

Depois é só agrupar em caracteres de 5 bits (LSB primeiro), checar a paridade ímpar, achar a sentinela `;`, ler até `?` e validar o LRC — a mecânica da [parte 2](/posts/tarja-magnetica-byte-a-byte). Se não decodificar, **inverta a sequência** e tente de novo: você pode ter passado o cartão ao contrário.

### Testar sem um swipe perfeito

Recording de cabeçote caseiro é ruidoso — como saber se o bug está no hardware ou no código? **Sintetizando** o sinal. Pegamos uma trilha conhecida, geramos os picos F2F que um cabeçote *produziria*, embrulhamos num WAV e mandamos pro decodificador. Se sair a mesma trilha, a lógica está provada — é um dos testes do repositório, e passa. Isso separa o problema: se a síntese decodifica mas o recording real não, o problema é **analógico** (ganho, ruído, alinhamento), não o algoritmo.

---

## Caminho 2 — Um leitor autônomo com Arduino

A placa de som é ótima pra bancada, mas amarra o leitor a um PC. Pra um controlador de porta (parte 4), queremos algo **stand-alone**. Entra o **Arduino** — a plaquinha nascida em **2005** no *Interaction Design Institute* de Ivrea, na Itália (o nome vem de um bar da cidade, o *Bar di Re Arduino*), criada por Massimo Banzi e companhia pra baratear a prototipagem física.

### O problema: o sinal é minúsculo

A saída do cabeçote é da ordem de **milivolts** e **bipolar**. Jogar isso no ADC de 10 bits do Arduino direto é sofrível: o sinal se perde no ruído de quantização. A solução clássica não é amostrar a forma de onda e sim transformá-la em **bordas digitais limpas** antes de entrar no microcontrolador.

### Front-end analógico: pré-amp + comparador

```
              +ganho ~100          histerese
cabeçote ──▶ pré-amp (LM358) ──▶ comparador (LM393) ──▶ D2 (INT0)
  ~mV            ~V                borda a cada             │
                                  inversão de fluxo        ▼
                                                      interrupção
```

- O **pré-amp** (um LM358, filho da linhagem de amplificadores operacionais que **Bob Widlar** popularizou na Fairchild nos anos 60) leva os milivolts pra um nível utilizável.
- O **comparador** (LM393) "quadra" o sinal: cada pico vira uma **transição** limpa. Idealmente com um pouco de **histerese** — a ideia do *gatilho de Schmitt*, inventado por **Otto Schmitt** em **1934**, quando ele era estudante estudando os nervos da lula e precisava transformar sinais analógicos ruidosos em pulsos limpos.

### Lista de materiais

| Item | Papel |
|:--|:--|
| Arduino Uno/Nano (ou ESP32) | cronometra bordas, decodifica, aciona a porta |
| Cabeçote de cassete | o sensor |
| LM358 (op-amp) | pré-amplificador (~mV → ~V) |
| LM393 (comparador) | quadra o sinal em bordas digitais |
| Resistores | divisor da referência + histerese |
| Relé/servo | destrava a fechadura |

### Cronometrando na interrupção

A ISR (rotina de interrupção) só guarda o timestamp de cada borda — rápido, sem processar nada dentro dela:

```c
volatile uint32_t edges[MAX_EDGES];
volatile uint16_t nEdges = 0;

void onEdge() {
  if (nEdges < MAX_EDGES) edges[nEdges++] = micros();
}

void setup() {
  attachInterrupt(digitalPinToInterrupt(2), onEdge, CHANGE);
}
```

O fim do swipe é detectado por **silêncio**: passou ~20 ms sem nenhuma borda? O cartão terminou de passar — hora de decodificar o buffer.

### O mesmo F2F, agora em C

```c
uint32_t d = edges[i] - edges[i-1];
if (d > 0.75 * T) { bits[nb++] = 0; T = 0.7*T + 0.3*d;          i += 1; }  // "0"
else              { bits[nb++] = 1; T = 0.7*T + 0.3*(d + d2);   i += 2; }  // "1"
```

Depois, a montagem dos caracteres (deslizar até `;`, ler grupos de 5 bits LSB primeiro, validar paridade, parar em `?`) e a trilha sai pela serial:

```
Track2: ;509431••••••5929=...?
```

Com a trilha na serial, o resto é lógica de aplicação (parte 4): consulta a lista de sócios e, se libera, aciona um **relé** num GPIO. Num **ESP32** dá pra fechar o ciclo com Wi-Fi — sincronizar a lista pela rede e registrar um **log de acesso**.

## PC ou Arduino?

| | Placa de som | Arduino |
|:--|:--|:--|
| Custo/esforço | mínimo (só o cabeçote) | precisa do front-end analógico |
| Autônomo | não (amarra num PC) | **sim** |
| Melhor pra | aprender, depurar, bancada | controle de acesso na porta |
| Onde o F2F roda | JavaScript no PC | firmware C |

A saída (`;509431...=...?`) é idêntica nas duas — então cai direto no parser da parte 2 e no controle de acesso da parte 4.

## Onde costuma travar

- **Zumbido de 60 Hz** (placa de som): blindagem no terra + cabo curto.
- **Front-end** (Arduino): sem o pré-amp/comparador bem ajustado, o Arduino não enxerga o cabeçote. Comece contando quantas bordas chegam por swipe. **Histerese** evita bordas espúrias.
- **Velocidade**: movimento contínuo importa mais que rapidez; o F2F odeia *parar no meio* do swipe.
- **Atalho legítimo**: existem **módulos leitores TTL** prontos (saída Data/Strobe/Card-Present) que plugam direto no Arduino — resolvem o analógico num instante, se você quer focar na porta e não no sinal.

Na **[parte 4](/posts/tarja-magnetica-cartoes-de-socio-hackerspace)** paramos de só *ler* e passamos a *gravar*: cartões de sócio pro hackerspace.

## Referências

- Michael Faraday, lei da indução eletromagnética (1831).
- Otto H. Schmitt, o *trigger* de Schmitt (1934).
- Arduino — Interaction Design Institute Ivrea (2005).
- Wikipedia: [Tape head](https://en.wikipedia.org/wiki/Tape_head), [Electromagnetic induction](https://en.wikipedia.org/wiki/Electromagnetic_induction), [Schmitt trigger](https://en.wikipedia.org/wiki/Schmitt_trigger), [Operational amplifier](https://en.wikipedia.org/wiki/Operational_amplifier).
- Projeto *Stripe Snoop* e a longa tradição de leitores de tarja caseiros na cultura maker/2600.
