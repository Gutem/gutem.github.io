---
layout: post
title: "Do Magstripe ao Token (parte 6): EMV, Token e as defesas"
date: 2026-07-06 00:00:00
categories: [seguranca, pagamentos]
tags: [emv, tokenizacao, magstripe, fraude, seguranca, skimming, nfc]
description: "O fim da série: as camadas que aposentaram a tarja. EMV (o dado dinâmico), tokenização (o número substituído) e por que skimming, clonagem, downgrade de service code e shimming já não funcionam."
---

> **Série "Do Magstripe ao Token"** — parte 6 (final).
> [1](/posts/magstripe-emv-token-anatomia-do-cartao) · [2](/posts/tarja-magnetica-byte-a-byte) ·
> [3](/posts/tarja-magnetica-leitor-walkman) · [4](/posts/tarja-magnetica-leitor-arduino) ·
> [5](/posts/tarja-magnetica-cartoes-de-socio-hackerspace) · **6) EMV, Token e as defesas (este)**.

As cinco primeiras partes foram sobre a **tarja** — a camada de **dado estático**. A gente leu, decodificou, construiu leitores e até gravou cartões de sócio. Ao longo disso ficou uma pergunta martelando: **se ler tarja é tão fácil, por que o mundo não desabou em fraude?** Porque a tarja foi cercada por duas camadas novas — e é delas que este post final trata. Uma frase resume tudo o que vem a seguir:

> **Dado estático pode ser copiado, mas não pode ser forjado numa transação dinâmica válida.**

## EMV: o dado que vira prova viva

O chip dourado (**EMV** — Europay/Mastercard/Visa, hoje governado pela EMVCo) resolve o pecado da tarja com uma ideia só: em vez de *apresentar* um segredo estático, o cartão **assina criptograficamente cada transação**.

Quando você insere o cartão, começa um diálogo:

1. **Seleção de aplicação (AID)** — o chip lista suas "apps" (crédito, débito). Cada bandeira tem um AID (Visa `A0000000031010`, **Elo** `A0000005241010`).
2. **Autenticação do cartão** — via SDA/DDA/CDA (assinaturas RSA que provam que o chip é legítimo, não um clone).
3. **Verificação do portador (CVM)** — PIN online/offline, assinatura, ou nada (contactless de baixo valor).
4. **Criptograma** — o coração.

No auge da compra, o chip gera o **ARQC** (*Authorization Request Cryptogram*): um MAC sobre os dados da transação (valor, moeda, data, um número imprevisível do terminal…) com uma **chave derivada** exclusiva do cartão. O ingrediente mágico é o **ATC** (*Application Transaction Counter*), que **incrementa a cada transação**:

```
ARQC = MAC( chave_do_cartão , valor ‖ moeda ‖ data ‖ ATC ‖ nonce_terminal ‖ … )
```

Como o ATC entra na conta, **dois criptogramas nunca são iguais** — mesmo comprando o mesmo café, no mesmo valor, na mesma máquina. O emissor recalcula, confere, responde com **ARPC** (autoriza) e o cartão finaliza com **TC** (aprovado) ou **AAC** (negado).

A tarja era uma **foto** (copiável); o EMV é uma **assinatura ao vivo, com número de série**. Clonar exigiria extrair a chave de dentro do *secure element* — que é exatamente o que ele existe pra impedir.

## Token: o número substituído

O EMV blindou o presencial. Mas e o **e-commerce**, onde você só digita PAN + validade + CVV2 — dado estático de novo? A resposta é a **tokenização**: nunca deixe o PAN real circular.

- **FPAN** (*Funding PAN*) — o número real (`509431…5929`).
- **DPAN** (*Device PAN*) — um **token** que parece um cartão (passa em Luhn, tem BIN), mas é um alias inútil fora do seu contexto.

Quem faz a troca é um **TSP** (*Token Service Provider*) — as próprias bandeiras (Visa VTS, Mastercard MDES). O superpoder é o **domain restriction**: o token pode ser amarrado a um **dispositivo**, a um **comerciante** ou a um **canal**. Se o banco de dados de uma loja vazar, os tokens são **inúteis** em qualquer outro lugar.

No **Apple/Google Pay**, o PAN real vira um DPAN guardado no Secure Element do telefone (o número real nunca fica no aparelho), e cada pagamento gera um **criptograma dinâmico** — tokenização **+** a filosofia do ARQC, juntas. Pro checkout web, o **3-D Secure 2** adiciona autenticação forte no emissor. E, de bônus, como o lojista só lida com tokens, o **escopo do PCI-DSS** despenca.

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

A diferença nunca é a **técnica** — é o **dado** e a **autorização**. Copiar a *forma* de um cartão pra abrir a porta do hackerspace é como imitar o layout de uma nota fiscal pra organizar recibos: a estrutura é pública, o conteúdo é seu.

## O arco completo

- **Magstripe** (partes 1–5): dado **estático**, copiável — cercado de defesas externas.
- **EMV**: transformou cada compra numa assinatura viva (ARQC/ATC) — matou a clonagem presencial.
- **Token**: trocou o número por um alias restrito — matou o valor do PAN vazado.

Cada camada assume que a anterior *vai* vazar, e projeta pra que o vazamento seja inútil. Entender isso a fundo — a ponto de construir o sensor da tarja com um cabeçote de Walkman — é o que separa quem **usa** o sistema de quem **entende** o sistema. E entender é, sempre, o lado certo da força.

> **Ética:** toda a série foi feita com cartões próprios, leitores próprios e **BIN de uso privado** nos crachás. Ler, copiar ou clonar cartões de terceiros é crime. O material é educacional — sobre *como* o sistema funciona e *por que* ele é (hoje) difícil de fraudar.
