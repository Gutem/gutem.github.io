---
layout: post
title: "Do Magstripe ao Token (parte 5): EMV, Token e as defesas"
date: 2026-07-06 00:00:00
categories: [seguranca, pagamentos]
tags: [emv, tokenizacao, magstripe, fraude, seguranca, skimming, nfc]
description: "O fim da série: as camadas que aposentaram a tarja. A invenção do chip por Roland Moreno, o EMV (dado dinâmico), a tokenização (número substituído), os ataques de Cambridge e por que skimming, clonagem e downgrade de service code já não funcionam."
---

> **Série "Do Magstripe ao Token"** — parte 5 (final).
> [1](/posts/magstripe-emv-token-anatomia-do-cartao) · [2](/posts/tarja-magnetica-byte-a-byte) ·
> [3](/posts/tarja-magnetica-construindo-um-leitor) · [4](/posts/tarja-magnetica-cartoes-de-socio-hackerspace) ·
> **5) EMV, Token e as defesas (este)**.

As quatro primeiras partes foram sobre a **tarja** — a camada de **dado estático**. A gente leu, decodificou, construiu leitores e até gravou cartões de sócio. Ao longo disso ficou uma pergunta martelando: **se ler tarja é tão fácil, por que o mundo não desabou em fraude?** Porque a tarja foi cercada por duas camadas novas — e é delas que este post final trata. Uma frase resume tudo o que vem a seguir:

> **Dado estático pode ser copiado, mas não pode ser forjado numa transação dinâmica válida.**

## O francês que colocou um cérebro no cartão

A camada dinâmica começa com um nome pouco lembrado: **Roland Moreno**. Jornalista e inventor francês, ele patenteou em **1974–1975** a *carte à puce* — o **cartão com chip**, um microprocessador embutido no plástico. A França foi pioneira: os cartões *Carte Bleue* já traziam chip no fim dos anos 1980, muito antes do resto do mundo. A ideia de Moreno era simples e revolucionária: se o cartão tem um **computador** dentro, ele pode **guardar um segredo e fazer contas** — em vez de só *apresentar* um dado copiável como a tarja.

Duas décadas depois, esse conceito virou padrão global. Em **1994–1996**, Europay, Mastercard e Visa publicaram a especificação **EMV** (as iniciais das três); em **1999** fundaram a **EMVCo** pra governá-la (hoje com Amex, Discover, JCB e UnionPay). O Reino Unido fez seu grande *rollout* nacional de **"Chip and PIN" em 2004–2006**; o Brasil migrou cedo, ainda nos anos 2000; e os EUA, atrasadíssimos, só se mexeram com o **liability shift de 1º de outubro de 2015**.

## EMV: o dado que vira prova viva

A ideia central do chip, em uma frase: em vez de *apresentar* um segredo estático, o cartão **assina criptograficamente cada transação**. Quando você o insere, começa um diálogo:

1. **Seleção de aplicação (AID)** — o chip lista suas "apps" (crédito, débito). Cada bandeira tem um AID (Visa `A0000000031010`, **Elo** `A0000005241010`).
2. **Autenticação do cartão** — via SDA/DDA/CDA (assinaturas RSA que provam que o chip é legítimo, não um clone).
3. **Verificação do portador (CVM)** — PIN online/offline, assinatura, ou nada (contactless de baixo valor).
4. **Criptograma** — o coração.

No auge da compra, o chip gera o **ARQC** (*Authorization Request Cryptogram*): um MAC sobre os dados da transação (valor, moeda, data, um número imprevisível do terminal…) com uma **chave derivada** exclusiva do cartão. O ingrediente mágico é o **ATC** (*Application Transaction Counter*), que **incrementa a cada transação**:

```
ARQC = MAC( chave_do_cartão , valor ‖ moeda ‖ data ‖ ATC ‖ nonce_terminal ‖ … )
```

Como o ATC entra na conta, **dois criptogramas nunca são iguais** — mesmo comprando o mesmo café, no mesmo valor, na mesma máquina. O emissor recalcula, confere, responde com **ARPC** (autoriza), e o cartão finaliza com **TC** (aprovado) ou **AAC** (negado). A tarja era uma **foto** (copiável); o EMV é uma **assinatura ao vivo, com número de série**.

### O EMV é perfeito? Cambridge disse que não

Vale a honestidade: o EMV **não é inquebrável**, e quem mais o cutucou foi o grupo de segurança da **Universidade de Cambridge**. Em **2010**, Steven Murdoch, Saar Drimer, Ross Anderson e Mike Bond publicaram *"Chip and PIN is Broken"* (IEEE S&P), mostrando um ataque *man-in-the-middle* que fazia o terminal aceitar **qualquer PIN** — o cartão achava que era assinatura, o terminal achava que era PIN. Em **2014**, o mesmo grupo publicou o *pre-play attack* (*"Chip and Skim"*), explorando **números "imprevisíveis" que eram previsíveis** em certos caixas. As bandeiras corrigiram implementações ao longo do tempo, mas a lição fica: **a segurança está tanto no protocolo quanto na implementação**.

### iCVV, contactless e o dCVV

Dois detalhes fecham o EMV. O chip carrega uma cópia da Trilha 2 pra compatibilidade — **mas com um CVV diferente, o iCVV**. Se alguém copiar essa trilha *de dentro do chip* pra uma tarja, o iCVV **não bate** com o CVV1 que o emissor espera. E no **contactless** (NFC), a mesma criptografia roda por aproximação, gerando um **dCVV / criptograma dinâmico** por toque — capturar o sinal de uma aproximação não permite reusá-lo.

## Token: o número substituído

O EMV blindou o presencial. Mas e o **e-commerce**, onde você só digita PAN + validade + CVV2 — dado estático de novo? A resposta é a **tokenização**, formalizada pela EMVCo em **2014** (a *Payment Tokenisation Specification*) e catapultada pelo **Apple Pay**, lançado em **outubro de 2014**.

A ideia: nunca deixe o PAN real circular.

- **FPAN** (*Funding PAN*) — o número real (`509431…5929`).
- **DPAN** (*Device PAN*) — um **token** que parece um cartão (passa em Luhn, tem BIN), mas é um alias inútil fora do seu contexto.

Quem faz a troca é um **TSP** (*Token Service Provider*) — as próprias bandeiras (Visa VTS, Mastercard MDES). O superpoder é o **domain restriction**: o token pode ser amarrado a um **dispositivo**, a um **comerciante** ou a um **canal**. Se o banco de dados de uma loja vazar, os tokens são **inúteis** em qualquer outro lugar.

No **Apple/Google Pay**, o PAN real vira um DPAN guardado no *Secure Element* do telefone (o número real nunca fica no aparelho nem nos servidores da Apple), e cada pagamento gera um **criptograma dinâmico** — tokenização **+** a filosofia do ARQC, juntas. Pro checkout web, o **3-D Secure** (criado pela Visa por volta de 2001 como *"Verified by Visa"*, hoje na versão 2) adiciona autenticação forte no emissor. E, de bônus, como o lojista só lida com tokens, o **escopo do PCI-DSS** (a norma de 2004 que rege dados de cartão) despenca.

## Os quatro "CVVs" (não confunda)

| Nome | Onde vive | Estático? | Serve pra |
|:--|:--|:--:|:--|
| **CVV1** | na **tarja** | sim | validar a tarja no POS |
| **CVV2** | **impresso** no verso | sim | e-commerce (**não** está na tarja!) |
| **iCVV** | no **chip** | sim (≠ CVV1) | detectar chip "rebaixado" pra tarja |
| **dCVV** | contactless / token | **não** | pagamento por aproximação/wallet |

É por isso que o leitor da série **nunca** revelou um CVV2: ele não está na tarja. De lá só sai o CVV1, inútil sozinho no checkout online.

## Os ataques clássicos — e por que falham hoje

- **Skimming** (copiar as trilhas): ainda é "fácil" — é o que nossos leitores caseiros fazem. A defesa não é impedir a cópia, é **tornar o copiado inútil** (abaixo).
- **Clonagem de tarja**: derrubada pelo **iCVV ≠ CVV1**, pela **autorização online** e pela **checagem do service code** — o emissor sabe que o cartão é "de chip".
- **Downgrade de service code** (forçar fallback pra tarja, sem criptograma): o EMV **antecipou** esse ataque. O emissor compara o service code com o que gravou; bandeiras monitoram e **recusam fallback anômalo**; e o **liability shift** faz quem usou a tecnologia fraca pagar a conta.
- **Shimming** (interceptar o chip): captura um **ARQC** de uso único — replay não funciona, porque o próximo exige um criptograma novo com o ATC seguinte.

## Onde é inofensivo e onde é crime

Isto amarra a série. Gravamos cartões copiando o **formato ISO 7813** — o mesmo do banco. Por que isso é ok?

| Ação | Status |
|:--|:--|
| Ler **o seu** cartão pra entender o formato | ✅ legítimo (é o que um POS faz) |
| Gravar crachá com **BIN privado (MII 9)** | ✅ legítimo (auto-emissão, não é pagamento) |
| Construir leitor/gravador de bancada | ✅ legítimo (ferramenta) |
| Ler/clonar cartão de **terceiro** | ⛔ crime |
| Gravar **PAN real de outra pessoa** | ⛔ crime |
| Manipular service code pra fraudar | ⛔ crime |

A diferença nunca é a **técnica** — é o **dado** e a **autorização**. Copiar a *forma* de um cartão pra abrir a porta do hackerspace é como imitar o layout de uma nota fiscal pra organizar recibos: a estrutura é pública, o conteúdo é seu. Copiar o *conteúdo* de um cartão alheio pra pagar com ele é falsificação.

## O arco completo

- **Magstripe** (partes 1–4): dado **estático**, copiável — cercado de defesas externas.
- **EMV**: transformou cada compra numa assinatura viva (ARQC/ATC) — matou a clonagem presencial.
- **Token**: trocou o número por um alias restrito — matou o valor do PAN vazado.

Cada camada assume que a anterior *vai* vazar, e projeta pra que o vazamento seja inútil. Entender isso a fundo — a ponto de construir o sensor da tarja com um cabeçote de Walkman — é o que separa quem **usa** o sistema de quem **entende** o sistema. E entender é, sempre, o lado certo da força.

## Referências

- Roland Moreno — patente do cartão com chip (*carte à puce*), 1974–1975.
- EMVCo — especificação EMV (1996) e a organização (1999); *Payment Tokenisation Specification* (2014).
- S. Murdoch, S. Drimer, R. Anderson, M. Bond, *"Chip and PIN is Broken"*, IEEE Symposium on Security and Privacy, 2010.
- M. Bond et al., *"Chip and Skim: Cloning EMV Cards with the Pre-play Attack"*, 2014.
- Wikipedia: [EMV](https://en.wikipedia.org/wiki/EMV), [Roland Moreno](https://en.wikipedia.org/wiki/Roland_Moreno), [Tokenization (data security)](https://en.wikipedia.org/wiki/Tokenization_(data_security)), [3-D Secure](https://en.wikipedia.org/wiki/3-D_Secure).

> **Ética:** toda a série foi feita com cartões próprios, leitores próprios e **BIN de uso privado** nos crachás. Ler, copiar ou clonar cartões de terceiros é crime. O material é educacional — sobre *como* o sistema funciona e *por que* ele é (hoje) difícil de fraudar.
