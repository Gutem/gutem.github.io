---
layout: post
title: "Do Magstripe ao Token (parte 1): a anatomia de um cartão"
date: 2026-07-06 00:00:00
categories: [seguranca, pagamentos, hardware]
tags: [emv, magstripe, tarja-magnetica, tokenizacao, cartao, iso7813, msr]
description: "O que um cartão carrega por dentro: trilhas, PAN, BIN, dígito de Luhn e service code — lidos de um cartão real com um leitor de US$ 10. Com a história de como o plástico virou dinheiro e o mapa da série."
---

> **Série "Do Magstripe ao Token"** — parte 1 (abertura).
> **1) A anatomia de um cartão (este)** ·
> [2) A trilha byte a byte](/posts/tarja-magnetica-byte-a-byte) ·
> [3) Construindo um leitor de tarja](/posts/tarja-magnetica-construindo-um-leitor) ·
> [4) Cartões de sócio](/posts/tarja-magnetica-cartoes-de-socio-hackerspace) ·
> [5) EMV, Token e as defesas](/posts/tarja-magnetica-ataques-e-defesas).

Plugei um leitor de tarja USB — um módulo genérico **MEGAHUNT**, desses que se disfarçam de teclado — e passei o meu próprio cartão só pra ver o que sai. Saiu isto (mascarado):

```
%B509431••••••5929^SOBRENOME/NOME               ^3012606000101...?
;509431••••••5929=30126060431010000000?
```

Duas linhas de texto ASCII. É *literalmente* o seu cartão de débito falando em voz alta — sem senha, sem criptografia, nada. Isso me levou a uma pergunta que virou uma série inteira: **por que um cartão consegue ser, ao mesmo tempo, tão inseguro (a tarja) e tão seguro (o chip)?**

A resposta é uma bela história de engenharia em **três camadas** — estático, dinâmico e substituído — em que cada uma existe pra tapar o buraco da anterior. Mas antes de abrir o cartão, vale entender como aquele pedaço de plástico virou dinheiro.

## Um jantar esquecido e o nascimento do cartão

A lenda fundadora é de 1949. O empresário **Frank McNamara** teria ido jantar no *Major's Cabin Grill*, em Nova York, e descoberto na hora da conta que esqueceu a carteira. O episódio (que ele mesmo apelidou de *"the First Supper"*) o inspirou a criar, em **1950**, o **Diners Club** — o primeiro cartão de crédito de uso geral, feito de papelão, aceito em um punhado de restaurantes. Em **1958** o Bank of America lançou o **BankAmericard** (que viraria a **Visa**) com o famoso *Fresno Drop*: 60 mil cartões despachados sem pedir, de uma vez, pra cidade de Fresno, na Califórnia.

Naquela época, "processar" um cartão era gravar o relevo dele num papel-carbono com aquela máquina de rolo (a *zip-zap*). Funcional, mas lento e fraudável. Faltava um jeito de a **máquina** ler o cartão. Esse elo — que a gente vai dissecar na [parte 2](/posts/tarja-magnetica-byte-a-byte) — foi a **tarja magnética**, colada nas costas do plástico no começo dos anos 1960. É ela que aquele leitor de US$ 10 lê até hoje.

## O que a tarja carrega

Aquelas duas linhas são as **trilhas** magnéticas, padronizadas pela **ISO/IEC 7811** (como gravar) e **ISO/IEC 7813** (o que gravar, no caso de cartões financeiros). Um cartão tem espaço pra três trilhas, mas o mundo bancário roda em duas:

- **Trilha 1** — alfanumérica, guarda o **nome** (`%B...^NOME^...?`). Foi definida pela **IATA**, a associação das companhias aéreas, para reservas.
- **Trilha 2** — numérica, o mínimo pro terminal (`;...=...?`). Foi definida pela **ABA** (*American Bankers Association*) e é a que todo POS lê. É a espinha dorsal do sistema.

Vamos dissecar a Trilha 2 do meu cartão:

```
; 509431••••••5929 = 3012 606 0431010000000 ?
│ │                │ │    │   │             │
│ │ PAN            │ │exp  │svc discricionário│ fim
│ └ start (;)       └ separador (=)          │
```

### PAN, BIN e o dígito de Luhn

O **PAN** (*Primary Account Number*) — o "número do cartão" — segue a **ISO/IEC 7812** e se decompõe em:

| Parte | Meu caso | O que é |
|:--|:--|:--|
| **BIN/IIN** | `509431` | identifica **bandeira + emissor**. A faixa `509xxx` é da **Elo**. |
| **conta** | `••••••` | o identificador do portador dentro do emissor |
| **Luhn** | `9` | dígito verificador (checksum) |

O primeiro dígito do PAN é o **MII** (*Major Industry Identifier*): `4` é Visa, `5` Mastercard, `3` Amex/Diners, e o `9` — guarde isso — é reservado para **uso nacional/privado** (vamos abusar dele na [parte 4](/posts/tarja-magnetica-cartoes-de-socio-hackerspace)).

O **dígito de Luhn** tem nome e sobrenome: foi criado por **Hans Peter Luhn**, um engenheiro alemão da IBM (o mesmo que cunhou o conceito de *KWIC index* e é considerado um dos pais da recuperação da informação). Ele patenteou o algoritmo em **1960** (US Patent 2.950.048). A regra é boba: dobra dígitos alternados, soma, e o total tem que ser múltiplo de 10. Ela pega **erro de digitação** — e **não é segurança**: qualquer um calcula em dez linhas de código. Guarde esse detalhe, porque a gente vai reusar o Luhn nos cartões que a série grava.

> **Curiosidade:** o BIN nasceu com 6 dígitos, mas as faixas se esgotaram — desde **2022** as bandeiras migraram para o **BIN de 8 dígitos**. Seu cartão pode ser de qualquer uma das duas eras.

### O service code: 3 dígitos que mandam no terminal

O campo `606` logo depois da validade é o **service code** — ele diz *como* o cartão deve ser usado:

| Dígito | Meu valor | Significado |
|:--:|:--:|:--|
| 1º (tecnologia) | **6** | Nacional, **com chip** (prefira o ICC) |
| 2º (autorização) | **0** | Normal |
| 3º (serviços) | **6** | Bens e serviços, **PIN quando possível** |

O detalhe que vale ouro: o **primeiro dígito `6` manda o terminal preferir o chip à tarja**. Esse é o mecanismo pelo qual o mundo empurrou o EMV — e o alvo de um ataque clássico que veremos na [parte 5](/posts/tarja-magnetica-ataques-e-defesas). Já o `6` significando "nacional" combina com a **Elo** ser uma bandeira **doméstica** — criada em **2011** por Banco do Brasil, Bradesco e Caixa justamente pra não depender das bandeiras internacionais.

## Por que a tarja é a camada frágil

Repare: **tudo** que você viu é **estático**. O dado gravado hoje é idêntico ao de amanhã, ao de daqui a um ano. Consequência direta:

- **Skimming**: um leitor escondido (o "chupa-cabra" no caixa eletrônico, um *overlay* na maquininha, ou um garçom com um leitor de bolso) copia as trilhas em segundos.
- **Clonagem**: com as trilhas, grava-se um cartão em branco — e o POS de tarja não distingue o original da cópia.

A tarja **não autentica nada**; ela apenas *apresenta* um segredo copiável. É por isso que ela é, hoje, a parte que está sendo aposentada — a Mastercard, inclusive, anunciou que vai **remover a tarja** dos cartões novos de forma gradual até **2033**. Mas é justamente por ser tão simples e aberta que ela é perfeita pra **aprender** — e pra construir leitores caseiros, que é aonde esta série vai.

## O mapa da série: estático → dinâmico → substituído

O cartão no seu bolso empilha três gerações de segurança, e cada uma nasceu pra consertar o pecado da anterior:

| Camada | Natureza | Onde entra na série |
|:--|:--|:--|
| **Magstripe** | dado **estático**, copiável | partes 1–4 (esta camada) |
| **EMV (chip)** | dado **dinâmico** (assina cada compra) | parte 5 |
| **Token** | número **substituído** por um alias | parte 5 |

Nas próximas partes a gente mergulha fundo na tarja: o [byte a byte da trilha](/posts/tarja-magnetica-byte-a-byte) (parte 2), depois **construímos um leitor de tarja** (parte 3) — do [cabeçote de um Walkman à placa de som até o Arduino](/posts/tarja-magnetica-construindo-um-leitor) — e usamos tudo pra gravar [cartões de sócio de um hackerspace](/posts/tarja-magnetica-cartoes-de-socio-hackerspace) (parte 4). Só então, na [parte 5](/posts/tarja-magnetica-ataques-e-defesas), voltamos pro "porquê é seguro": EMV, tokenização e as defesas que mataram a fraude.

Tudo isso ficou visível porque plugei um leitor de US$ 10 na USB e passei o meu próprio cartão. A tarja te conta tudo sem pestanejar — e é exatamente por isso que o resto do sistema teve que ficar tão esperto.

## Referências

- ISO/IEC 7810, 7811, 7812, 7813 — cartões de identificação e transação financeira.
- Hans Peter Luhn, *Computer for Verifying Numbers*, US Patent 2.950.048 (1960).
- Wikipedia: [Magnetic stripe card](https://en.wikipedia.org/wiki/Magnetic_stripe_card), [Payment card number](https://en.wikipedia.org/wiki/Payment_card_number), [Luhn algorithm](https://en.wikipedia.org/wiki/Luhn_algorithm), [Diners Club](https://en.wikipedia.org/wiki/Diners_Club_International).
- Elo — bandeira brasileira (Banco do Brasil, Bradesco, Caixa), 2011.

> **Aviso:** todo o experimento foi feito com **o meu próprio cartão**, e o número aparece **mascarado**. Ler, copiar ou clonar cartões de terceiros é crime. A série é educacional — sobre *como* o sistema funciona e *por que* ele é (hoje) difícil de fraudar.
