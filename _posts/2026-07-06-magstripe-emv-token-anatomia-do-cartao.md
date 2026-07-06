---
layout: post
title: "Do Magstripe ao Token (parte 1): a anatomia de um cartão"
date: 2026-07-06 00:00:00
categories: [seguranca, pagamentos, hardware]
tags: [emv, magstripe, tarja-magnetica, tokenizacao, cartao, iso7813, msr]
description: "O que um cartão carrega por dentro: trilhas, PAN, BIN, dígito de Luhn e service code — lidos de um cartão real com um leitor de US$ 10. E o mapa da série: estático, dinâmico e substituído."
---

> **Série "Do Magstripe ao Token"** — parte 1 (abertura).
> **1) A anatomia de um cartão (este)** ·
> [2) A trilha byte a byte](/posts/tarja-magnetica-byte-a-byte) ·
> [3) Leitor com cabeçote de Walkman](/posts/tarja-magnetica-leitor-walkman) ·
> [4) Leitor com Arduino](/posts/tarja-magnetica-leitor-arduino) ·
> [5) Cartões de sócio](/posts/tarja-magnetica-cartoes-de-socio-hackerspace) ·
> [6) EMV, Token e as defesas](/posts/tarja-magnetica-ataques-e-defesas).

Plugei um leitor de tarja USB — um módulo genérico **MEGAHUNT**, desses que se disfarçam de teclado — e passei o meu próprio cartão só pra ver o que sai. Saiu isto (mascarado):

```
%B509431••••••5929^SOBRENOME/NOME               ^3012606000101...?
;509431••••••5929=30126060431010000000?
```

Duas linhas de texto ASCII. É *literalmente* o seu cartão de débito falando em voz alta — sem senha, sem criptografia, nada. Isso me levou a uma pergunta que virou uma série inteira: **por que um cartão consegue ser, ao mesmo tempo, tão inseguro (a tarja) e tão seguro (o chip)?**

A resposta é uma bela história de engenharia em **três camadas** — estático, dinâmico e substituído — em que cada uma existe pra tapar o buraco da anterior. Neste post a gente abre o cartão e entende a primeira camada: o **dado estático**. As próximas partes constroem em cima disso — inclusive um leitor feito com sucata.

## O que a tarja carrega

Aquelas duas linhas são as **trilhas** magnéticas (padrão ISO/IEC 7811/7813). Um cartão tem espaço pra três, mas o mundo bancário roda em duas:

- **Trilha 1** — alfanumérica, guarda o **nome** (`%B...^NOME^...?`).
- **Trilha 2** — numérica, o mínimo pro terminal (`;...=...?`). É a que todo POS lê.

Vamos dissecar a Trilha 2 do meu cartão:

```
; 509431••••••5929 = 3012 606 0431010000000 ?
│ │                │ │    │   │             │
│ │ PAN            │ │exp  │svc discricionário│ fim
│ └ start (;)       └ separador (=)          │
```

### PAN, BIN e o dígito de Luhn

O **PAN** (*Primary Account Number*) — o "número do cartão" — se decompõe em:

| Parte | Meu caso | O que é |
|:--|:--|:--|
| **BIN/IIN** | `509431` | identifica **bandeira + emissor**. A faixa `509xxx` é da **Elo** (doméstica BR). |
| **conta** | `••••••` | o identificador do portador dentro do emissor |
| **Luhn** | `9` | dígito verificador (checksum) |

O **Luhn** dobra dígitos alternados, soma e exige total múltiplo de 10. Ele pega **erro de digitação** — e **não é segurança**: qualquer um calcula. Guarde isso, porque a gente vai reusar o Luhn nos cartões que a série grava (parte 5).

### O service code: 3 dígitos que mandam no terminal

O campo `606` logo depois da validade é o **service code** — ele diz *como* o cartão deve ser usado:

| Dígito | Meu valor | Significado |
|:--:|:--:|:--|
| 1º (tecnologia) | **6** | Nacional, **com chip** (prefira o ICC) |
| 2º (autorização) | **0** | Normal |
| 3º (serviços) | **6** | Bens e serviços, **PIN quando possível** |

O detalhe que vale ouro: o **primeiro dígito `6` manda o terminal preferir o chip à tarja**. Esse é o mecanismo pelo qual o mundo empurrou o EMV — e o alvo de um ataque clássico que veremos na parte 6.

## Por que a tarja é a camada frágil

Repare: **tudo** que você viu é **estático**. O dado gravado hoje é idêntico ao de amanhã. Consequência direta:

- **Skimming**: um leitor escondido copia as trilhas em segundos.
- **Clonagem**: com as trilhas, grava-se um cartão em branco — e o POS de tarja não distingue o original da cópia.

A tarja **não autentica nada**; ela apenas *apresenta* um segredo copiável. É por isso que ela é, hoje, a parte que está sendo aposentada — e é justamente por ser tão simples e aberta que ela é perfeita pra **aprender** (e pra construir leitores caseiros).

## O mapa da série: estático → dinâmico → substituído

O cartão no seu bolso empilha três gerações de segurança:

| Camada | Natureza | Onde entra na série |
|:--|:--|:--|
| **Magstripe** | dado **estático**, copiável | partes 1–5 (esta camada) |
| **EMV (chip)** | dado **dinâmico** (assina cada compra) | parte 6 |
| **Token** | número **substituído** por um alias | parte 6 |

Cada camada assume que a anterior *vai* vazar — e projeta pra que o vazamento seja inútil. Nas próximas partes a gente mergulha fundo na tarja: o [byte a byte da trilha](/posts/tarja-magnetica-byte-a-byte) (parte 2), depois **construímos** dois leitores — um com o [cabeçote de um Walkman](/posts/tarja-magnetica-leitor-walkman) (parte 3) e outro com [Arduino](/posts/tarja-magnetica-leitor-arduino) (parte 4) — e usamos tudo pra gravar [cartões de sócio de um hackerspace](/posts/tarja-magnetica-cartoes-de-socio-hackerspace) (parte 5). Só então, na [parte 6](/posts/tarja-magnetica-ataques-e-defesas), voltamos pro "porquê é seguro": EMV, tokenização e as defesas que mataram a fraude.

Tudo isso ficou visível porque plugei um leitor de US$ 10 na USB e passei o meu próprio cartão. A tarja te conta tudo sem pestanejar — e é exatamente por isso que o resto do sistema teve que ficar tão esperto.

> **Aviso:** todo o experimento foi feito com **o meu próprio cartão**, e o número aparece **mascarado**. Ler, copiar ou clonar cartões de terceiros é crime. A série é educacional — sobre *como* o sistema funciona e *por que* ele é (hoje) difícil de fraudar.
