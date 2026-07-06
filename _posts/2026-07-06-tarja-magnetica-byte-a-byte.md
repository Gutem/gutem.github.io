---
layout: post
title: "Do Magstripe ao Token (parte 2): a trilha byte a byte"
date: 2026-07-06 00:00:00
categories: [seguranca, hardware]
tags: [magstripe, tarja-magnetica, iso7813, f2f, lrc, javascript, msr]
description: "A codificação da tarja por dentro: a história do ferro de passar da IBM, F2F/Aiken biphase, HiCo vs LoCo, charsets de 5 e 7 bits com paridade, sentinelas e o LRC — com cálculo, um parser em JS e o bug do circunflexo ABNT."
---

> **Série "Do Magstripe ao Token"** — parte 2.
> [1) A anatomia de um cartão](/posts/magstripe-emv-token-anatomia-do-cartao) · **2) A trilha byte a byte (este)** ·
> [3) Construindo um leitor de tarja](/posts/tarja-magnetica-construindo-um-leitor) ·
> [4) Cartões de sócio](/posts/tarja-magnetica-cartoes-de-socio-hackerspace) ·
> [5) EMV, Token e as defesas](/posts/tarja-magnetica-ataques-e-defesas).

Na [parte 1](/posts/magstripe-emv-token-anatomia-do-cartao) vimos *o que* a tarja carrega — PAN, nome, service code. Agora abrimos o *como*, no nível do bit. É aqui que a tarja deixa de ser mágica e vira engenharia de gravação magnética dos anos 60. Sem entender isto, o leitor caseiro da [parte 3](/posts/tarja-magnetica-construindo-um-leitor) seria uma caixa-preta.

## Um ferro de passar e a IBM

A história de como a fita foi parar no cartão é boa demais pra não contar. No começo dos anos 1960, o engenheiro da **IBM Forrest Parry** trabalhava num crachá de identificação para a CIA e queria colar uma tira de fita magnética num cartão plástico. Cola dava bolha, deformava, não funcionava. Ele levou o problema pra casa frustrado. Sua esposa, **Dorothea Parry**, estava passando roupa e deu o pitaco que entrou pra lenda: *"por que você não passa o ferro pra derreter a fita e grudar?"*. Parry testou — e a fita fundiu-se perfeitamente ao plástico. Nascia o cartão de tarja magnética, mais tarde padronizado pela IBM e adotado pela indústria financeira.

A tarja é, então, **fita magnética** — a mesma tecnologia da fita cassete e do VHS. Herança direta da gravação magnética inventada pelo dinamarquês **Valdemar Poulsen** lá em 1898 (o *telegraphone*, que gravava som em arame de aço). O que muda no cartão é a densidade e o formato dos dados.

## HiCo e LoCo: a força do magnetismo

As partículas ferromagnéticas da tarja têm uma propriedade chamada **coercividade**: o quão "difícil" é magnetizá-las ou apagá-las. Ela é medida em **oersteds** (Oe) — unidade batizada em homenagem a **Hans Christian Ørsted**, o físico que em 1820 descobriu que corrente elétrica desvia uma bússola, fundando o eletromagnetismo.

| Tipo | Coercividade | Cor | Uso |
|:--|:--|:--|:--|
| **LoCo** | ~300 Oe | marrom | hotel, transporte — grava fácil, apaga fácil |
| **HiCo** | ~2750 Oe | preta | banco — resistente a desmagnetização |

Isso importa na hora de **gravar** (parte 4): cartão de banco é HiCo justamente pra não desmagnetizar no bolso, ao lado do celular. Cartão de hotel é LoCo — por isso a chave "desmagnetiza" com tanta facilidade.

## F2F: o relógio embutido no dado

Os bits são gravados em **F2F** (*two-frequency coherent-phase*), também chamado de **Aiken biphase**. A regra: há uma **inversão de fluxo magnético no início de cada célula** de bit; se o bit é **1**, há uma inversão **extra no meio** da célula.

```
0:  |‾‾‾‾‾‾‾‾‾‾‾|___________|      (uma inversão por célula)
1:  |‾‾‾‾‾|_____|‾‾‾‾‾|_____|      (duas — a do meio marca o "1")
```

A genialidade é que o **relógio está no próprio sinal**. O leitor mede o intervalo entre inversões: se um intervalo é ~metade do anterior, achou um `1`; se é "cheio", um `0`. Por isso a leitura funciona no swipe rápido **e** no lento — a informação está na *razão* entre intervalos, não na velocidade absoluta. Guarde essa ideia: é literalmente o algoritmo que vamos programar na parte 3, tanto no PC quanto no Arduino.

As densidades diferem por trilha: **210 bpi** (bits por polegada) nas Trilhas 1 e 3, **75 bpi** na Trilha 2 — o que define quantos caracteres cabem em cada uma.

## Três trilhas, três donos

Cada trilha da tarja foi definida por uma indústria diferente, e isso explica o formato de cada uma:

| Trilha | Definida por | Bits/char | Alfabeto | Máx |
|:--|:--|:--|:--|:--|
| 1 | **IATA** (aviação) | 7 (6 dados + paridade) | 64 chars (ASCII `0x20`–`0x5F`) | 79 |
| 2 | **ABA** (bancos) | 5 (4 dados + paridade) | dígitos + `:;<=>?` | 40 |
| 3 | **Thrift** (poupança) | 5 | numérico | 107 |

A Trilha 1 nasceu para reservas aéreas (por isso carrega o nome, legível). A Trilha 2, dos bancos, é o mínimo essencial — e virou a espinha dorsal de todo POS do planeta. A Trilha 3 era regravável (saldo no próprio cartão!), mas caiu em desuso.

## Bits, na unha

Na Trilha 2, cada caractere é um **BCD de 4 bits** mais um bit de **paridade ímpar**, gravado **LSB primeiro**. Um exemplo concreto — o dígito `5`:

```
5 = 0101 (binário) → LSB primeiro: 1 0 1 0
   dois "1"s nos dados → paridade ímpar exige total ímpar → paridade = 1
   caractere na fita: 1 0 1 0 | 1
```

A paridade ímpar por caractere é a primeira rede de proteção contra leitura ruidosa: se um bit "virar", a contagem de 1s fica par e o leitor sabe que algo deu errado.

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

Para `;1234=?`, o XOR dá `11 ^ 1 ^ 2 ^ 3 ^ 4 ^ 13 ^ 15`, e é esse caractere final que o leitor recalcula pra saber se a leitura veio limpa. Somando o **LRC** (por coluna) com a **paridade** (por caractere), você tem detecção de erro em duas dimensões — necessária porque ler uma fita passada na mão é ruidoso. E note: nada disso é segurança; é só **integridade**. Um cartão clonado tem LRC e paridade perfeitos.

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

O parser então separa Trilha 1/2 por regex, **recalcula o LRC**, valida o **Luhn** do PAN (parte 1) e interpreta o service code.

## O bug mais brasileiro possível

Ao ler meu cartão, a Trilha 1 simplesmente não parseava. O culpado: o separador de campo da Trilha 1 é `^` (caret). Mas com **teclado ABNT**, `^` é **tecla morta** (dead key) — e o leitor entregava `ˆ` (U+02C6, *modifier letter circumflex accent*) no lugar de `^` (U+005E). O dado estava lá; o parser é que tropeçava no acento que o layout brasileiro insere.

```js
// normaliza o circunflexo "morto" do ABNT antes de parsear
const norm = data.replace(/[\u02C6\u0302]/g, '^')
```

Uma linha resolveu. É o tipo de bug que só nasce quando hardware chinês genérico, layout de teclado brasileiro e um padrão americano dos anos 60 se encontram no mesmo terminal.

Agora que dominamos o formato, na **[parte 3](/posts/tarja-magnetica-construindo-um-leitor)** largamos o leitor pronto e construímos o nosso — primeiro com o cabeçote de um Walkman e uma placa de som, depois com um Arduino. O algoritmo F2F daqui vira código lá.

## Referências

- ISO/IEC 7811 (técnica de gravação) e 7813 (cartões de transação financeira).
- Wikipedia: [Magnetic stripe card](https://en.wikipedia.org/wiki/Magnetic_stripe_card), [Forrest Parry](https://en.wikipedia.org/wiki/Magnetic_stripe_card#History), [Coercivity](https://en.wikipedia.org/wiki/Coercivity), [Valdemar Poulsen](https://en.wikipedia.org/wiki/Valdemar_Poulsen).
- Hans Christian Ørsted — origem da unidade *oersted*.
- IATA (Trilha 1), ABA (Trilha 2), Thrift/POS (Trilha 3) — definições históricas das trilhas.
