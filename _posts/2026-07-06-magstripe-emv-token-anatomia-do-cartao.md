---
layout: post
title: "Do Magstripe ao Token: a anatomia de um cartão de pagamento"
date: 2026-07-06 00:00:00
categories: [seguranca, pagamentos, hardware]
tags: [emv, magstripe, tarja-magnetica, tokenizacao, cartao, iso7813, nfc, pci-dss, msr]
description: "Como um cartão realmente funciona por dentro — da tarja magnética estática ao criptograma dinâmico do EMV e à tokenização. Trilhas ISO 7813, service code, ARQC, iCVV, DPAN e por que cada camada existe."
---

Semana passada plugei um leitor de tarja magnética USB — um módulo genérico **MEGAHUNT**, desses que se disfarçam de teclado — e passei o meu próprio cartão só pra ver o que sai. Saiu isto (mascarado):

```
%B509431••••••5929^SOBRENOME/NOME               ^3012606000101...?
;509431••••••5929=30126060431010000000?
```

Duas linhas de texto ASCII. É *literalmente* o seu cartão de débito falando em voz alta — sem senha, sem criptografia, sem nada. Aquilo me fez querer escrever este post: **por que um cartão consegue ser, ao mesmo tempo, tão inseguro (a tarja) e tão seguro (o chip)?** A resposta é uma bela história de engenharia em três atos — **magstripe → EMV → token** — em que cada camada existe pra consertar o buraco deixada pela anterior.

Vamos abrir o cartão em três dimensões: o dado **estático** (tarja), o dado **dinâmico** (EMV) e o dado **substituído** (tokenização).

## Ato 1 — A tarja magnética: dado estático colado nas costas

### Um pedaço de fita cassete no seu cartão

A tarja é, fisicamente, **fita magnética** — a mesma tecnologia de fita cassete/VHS. A lenda conta que, em 1960, o engenheiro da IBM **Forrest Parry** estava tentando colar um pedaço de fita magnética num cartão de identidade da CIA e não conseguia. A esposa dele, passando roupa, sugeriu: *"por que você não passa o ferro pra derreter e grudar?"*. Funcionou. Nasceu o magstripe.

A tarja tem partículas **ferromagnéticas** cuja polaridade pode ser gravada. Dois tipos, pela **coercividade** (o quão "difícil" é magnetizar/desmagnetizar):

- **LoCo** (Low Coercivity, ~300 Oe) — tarja **marrom**, barata, mais fácil de apagar (cartão de hotel, transporte).
- **HiCo** (High Coercivity, ~2750 Oe) — tarja **preta**, resistente, usada em cartões bancários.

### Como bits viram magnetismo: F2F (Aiken biphase)

Os dados são gravados com codificação **F2F** (*two-frequency coherent-phase*, ou Aiken biphase). A ideia é elegante e **auto-sincronizada**: existe uma inversão de fluxo magnético no **início de cada célula** de bit. Se o bit é **1**, há uma inversão **extra no meio** da célula; se é **0**, não há.

```
0:  |‾‾‾‾‾‾|______|      (uma inversão por célula)
1:  |‾‾‾|___|‾‾‾|__|     (duas — a do meio marca o "1")
```

Como o clock está embutido no próprio sinal, o leitor **não precisa saber a velocidade** com que você passou o cartão — por isso funciona tanto num swipe rápido quanto lento. É a mesma razão pela qual leitores baratos conseguem ler.

### As três trilhas (ISO/IEC 7811 e 7813)

A tarja tem espaço para **três trilhas** paralelas:

| Trilha | Padrão | Densidade | Charset | Máx | Uso |
|:--|:--|:--|:--|:--|:--|
| **1** | IATA | 210 bpi | alfanumérico (7 bits: 6 + paridade) | 79 chars | Nome + dados (legível por humano) |
| **2** | ABA | 75 bpi | numérico (5 bits: 4 + paridade) | 40 chars | O mínimo pro POS |
| **3** | THRIFT | 210 bpi | numérico | 107 chars | Regravável, quase morta |

Na prática, o mundo bancário roda em cima da **Trilha 2**. A Trilha 1 é "luxo" (tem o nome). A Trilha 3 quase ninguém usa.

### Dissecando as trilhas do meu cartão

Voltando ao que o leitor cuspiu. **Trilha 1**:

```
%B 509431••••••5929 ^ SOBRENOME/NOME ^ 3012 606 000101... ?
│  │                  │               │    │   │           │
│  │ PAN              │ nome          │exp  │svc discri.   │ fim (?)
│  └ Format Code "B" (cartão financeiro)    │
└ start sentinel (%)                        └ YYMM = 12/2030
```

**Trilha 2** (a que importa):

```
; 509431••••••5929 = 3012 606 0431010000000 ?
│ │                │ │    │   │             │
│ │ PAN            │ │exp │svc discricionário│ fim
│ └ start (;)       └ separador de campo (=) │
```

Cada trilha termina com um **LRC** (*Longitudinal Redundancy Check*) — um byte de paridade que valida a leitura inteira. Além disso, cada caractere tem **paridade ímpar**. É correção de erro de leitura, **não** segurança.

> **Puxadinho de campo:** quando li com o script, a Trilha 1 não parseava. O motivo era hilário e brasileiro: o leitor manda o separador `^` (caret), mas com **layout de teclado ABNT** o `^` é uma **tecla morta** (dead key) e chegava como `ˆ` (U+02C6). Uma linha de normalização `ˆ → ^` resolveu.

### Os dígitos que contam uma história

Dois campos merecem destaque, porque reaparecem no EMV:

**O PAN e o dígito de Luhn.** O número `509431••••••5929` se divide em:

- **BIN/IIN** `509431` — *Issuer Identification Number*. A faixa `509xxx` é da bandeira **Elo** (doméstica brasileira). O BIN identifica **bandeira + emissor**.
- **conta** — o identificador do portador dentro do emissor.
- **último dígito** — o **checksum de Luhn**. Dobra dígitos alternados, soma, e o total tem que ser múltiplo de 10. Pega erro de digitação; **não é segurança** (qualquer um calcula).

**O service code** — os 3 dígitos (`606` no meu caso) que dizem ao terminal *como* o cartão deve ser usado:

| Dígito | Meu valor | Significado |
|:--:|:--:|:--|
| 1º (tecnologia) | **6** | Nacional, **com chip** (prefira o ICC) |
| 2º (autorização) | **0** | Normal |
| 3º (serviços) | **6** | Bens e serviços, **PIN quando possível** |

Repare no primeiro dígito: **`6` manda o terminal preferir o chip à tarja**. Esse detalhezinho é o cavalo de Troia que o EMV usa pra se impor — falaremos disso já já.

### Por que a tarja é indefensável

Tudo que você viu acima é **estático**. O dado gravado hoje é idêntico ao de amanhã. Consequência:

- **Skimming**: um leitor escondido (chupa-cabra no caixa eletrônico, ou um garçom com um leitor de bolso) copia as trilhas em segundos.
- **Clonagem**: com as trilhas, grava-se um cartão em branco (`MSR206` e afins) e pronto — um clone perfeito, porque o POS de tarja não tem como distinguir o original da cópia.

A tarja **não autentica nada**. Ela só *apresenta* um dado que qualquer um pode copiar. Isso motivou o segundo ato.

## Ato 2 — EMV: transformando o dado estático em prova viva

**EMV** (de **E**uropay, **M**astercard, **V**isa — hoje governado pela **EMVCo**, que inclui Amex, Discover, JCB e UnionPay) é o chip dourado. A ideia central, em uma frase:

> Em vez de *apresentar* um segredo estático, o cartão **assina criptograficamente cada transação** com um dado que nunca se repete.

### O terminal e o chip conversam

Quando você insere o cartão, começa um diálogo (padrão EMV, dados em **BER-TLV** — tags do tipo `9F26`, `82`, `95`…):

1. **Seleção de aplicação (AID).** O chip lista suas "apps". Cada bandeira/produto tem um **AID**: Visa `A0000000031010`, Mastercard `A0000000041010`, **Elo** `A0000005241010`. Um mesmo cartão pode ter crédito e débito como AIDs distintos — é por isso que a maquininha às vezes pergunta.
2. **Leitura + autenticação do cartão.** Via **SDA / DDA / CDA** — assinaturas RSA que provam que aquele chip foi emitido por um emissor legítimo e **não é um clone**. (SDA é estático e fraco; DDA/CDA usam um par de chaves no próprio chip.)
3. **Verificação do portador (CVM).** A "CVM list" define a ordem: **PIN online**, **PIN offline**, assinatura, ou *No CVM* (contactless de baixo valor).
4. **Decisão de risco + criptograma.**

### O coração: o criptograma ARQC

No auge da transação, o chip gera o **ARQC** (*Authorization Request Cryptogram*): um MAC calculado sobre os dados da compra (valor, moeda, data, um **número imprevisível** gerado pelo terminal…) usando uma **chave derivada** exclusiva do cartão.

O ingrediente mágico é o **ATC** (*Application Transaction Counter*): um contador que **incrementa a cada transação**. Como o ATC entra no cálculo, **dois criptogramas nunca são iguais** — mesmo comprando o mesmo café, no mesmo valor, na mesma máquina.

```
ARQC = MAC( chave_do_cartão , valor ‖ moeda ‖ data ‖ ATC ‖ nonce_terminal ‖ … )
```

O fluxo de resposta:

- O emissor recebe o ARQC, **recalcula** com a chave do cartão e confere. Se bater, é o cartão de verdade e a transação é fresca (não é replay).
- O emissor responde com o **ARPC** (*Authorization Response Cryptogram*) — ele também se autentica pro cartão.
- O cartão finaliza com **TC** (*Transaction Certificate*, aprovado) ou **AAC** (recusado).

Traduzindo: a tarja era uma **foto** (copiável); o EMV é uma **assinatura ao vivo, com data e número de série** (irreproduzível). Clonar o chip exigiria extrair a chave privada de dentro do *secure element* — que é justamente o que ele é feito pra impedir.

### iCVV: o detalhe que mata o "shimming"

O chip carrega uma cópia da Trilha 2 pra compatibilidade — **mas com um CVV diferente**, o **iCVV**. Se um fraudador copiar a Trilha 2 *de dentro do chip* e gravar numa tarja, o iCVV **não bate** com o CVV1 que o emissor espera de uma tarja de verdade. É uma armadilha proposital contra quem tenta "rebaixar" o chip pra tarja.

### Contactless e o dCVV

No **contactless** (NFC), a mesma criptografia roda por aproximação. O cartão gera um **dCVV / criptograma dinâmico** por toque. Por isso capturar o sinal de uma aproximação não permite reusá-lo: o próximo exigiria um novo criptograma válido, com o ATC seguinte.

### O "liability shift": como forçaram o mundo a adotar

EMV não venceu por bondade — venceu por **contrato**. As bandeiras instituíram o **liability shift**: numa fraude, **quem estiver com a tecnologia mais fraca paga a conta**. Se o cartão tinha chip mas o lojista só aceitou tarja, o **lojista** absorve o prejuízo. Isso, somado ao service code que diz "prefira o chip", empurrou terminais e emissores pro EMV no mundo todo (nos EUA, o marco foi **outubro de 2015**; o Brasil migrou antes).

### Onde a tarja ainda respira

Se o EMV é tão superior, por que meu cartão ainda tem tarja legível? **Compatibilidade e *fallback*.** Máquina velha, catraca, alguns países. Mas repare: o service code `6••` sinaliza "sou de chip", então um terminal moderno que aceite tarja num cartão de chip vira alvo de suspeita/recusa. A tarja é um apêndice em extinção.

### Uma volta rápida pelos bastidores: quem paga quem

O EMV acontece dentro do **modelo de quatro partes**:

| Player | Papel |
|:--|:--|
| **Portador** | dono do cartão |
| **Emissor** (issuer) | banco que emitiu o cartão e assume o risco |
| **Adquirente** (acquirer/credenciadora) | credencia o lojista e captura a transação (Cielo, Rede, Getnet, Stone) |
| **Bandeira** (Visa, MC, **Elo**) | os trilhos e regras entre emissor e adquirente |

E a transação vive em três tempos: **autorização** (segundos, dinheiro *reservado*), **clearing** (conciliação em lote) e **settlement** (o dinheiro de fato se move, D+1 em diante). Em cada salto há taxa: *interchange*, *scheme fee*, MDR.

## Ato 3 — Tokenização: e se o número não fosse o número?

O EMV blindou o **presencial**. Mas e o **e-commerce**, onde não há chip pra gerar criptograma? Você só digita PAN + validade + CVV2 — dado **estático** de novo. E cada loja que guarda seu PAN é mais um vazamento esperando pra acontecer. A resposta é a **tokenização**.

### PAN vs Token

A ideia: **nunca deixe o PAN real circular ou repousar**. Substitua-o por um **token** — um número que *parece* um cartão (passa em Luhn, tem BIN), mas é um alias inútil fora do seu contexto.

- **FPAN** (*Funding PAN*) — o número real, `509431…5929`.
- **DPAN** (*Device/Digital PAN*) — o token que o comerciante/dispositivo enxerga.

Quem faz a troca é um **TSP** (*Token Service Provider*) — as próprias bandeiras: **Visa VTS**, **Mastercard MDES**. O padrão é o **EMVCo Payment Tokenisation**.

### O superpoder: *domain restriction*

Um token pode ser **amarrado a um domínio**:

- um **dispositivo** específico (o iPhone X do fulano),
- um **comerciante** específico (o token da Amazon só funciona na Amazon),
- um **canal** (só e-commerce).

Se o banco de dados da loja vazar, os tokens são **inúteis** em qualquer outro lugar. É a diferença entre vazar sua chave de casa e vazar uma chave que só abre *aquela* fechadura, *naquele* dia.

### Apple Pay / Google Pay por dentro

Quando você cadastra um cartão no Apple Pay:

1. O PAN real vai ao TSP e volta um **DPAN**, guardado no **Secure Element** do telefone — o FPAN **nunca** fica no aparelho nem nos servidores da Apple.
2. Cada pagamento gera um **criptograma dinâmico** (mesma filosofia do ARQC do EMV, agora no NFC do celular).

Ou seja: tokenização + criptograma junta o melhor dos dois mundos — o número é substituído **e** cada uso é assinado. Mesmo que alguém intercepte um pagamento, não consegue reusá-lo (dinâmico) nem usá-lo noutro lugar (domain-restricted).

### 3-D Secure: o EMV do e-commerce

Pro checkout web, o **3-D Secure 2** (o "Verified by Visa / Mastercard ID Check" moderno) adiciona uma camada de autenticação baseada em risco entre os **três domínios** (emissor, adquirente e a interoperabilidade da bandeira), às vezes pedindo biometria/OTP. É a tentativa de trazer a força do EMV pro ambiente sem cartão presente.

### Bônus de conformidade: PCI-DSS encolhe

Como o comerciante passa a lidar só com **tokens**, o **escopo do PCI-DSS** (a norma que rege armazenar/transmitir dado de cartão) despenca. Menos PAN real no ambiente = menos superfície de auditoria e de vazamento.

## Os "CVVs" — o quadro que resolve toda a confusão

Quatro coisas chamadas "CVV" que **não** são a mesma:

| Nome | Onde vive | Estático? | Serve pra |
|:--|:--|:--:|:--|
| **CVV1 / CVC1** | na **tarja** | sim | validar a tarja no POS presencial |
| **CVV2 / CVC2** | **impresso** no verso | sim | e-commerce (**não** está na tarja!) |
| **iCVV** | no **chip** | sim (mas ≠ CVV1) | detectar chip "rebaixado" pra tarja |
| **dCVV / criptograma** | contactless / token | **não** (muda por transação) | pagamento por aproximação/wallet |

É por isso que o meu leitor de tarja **nunca** vai revelar o CVV2: ele simplesmente não está lá. Da tarja só sai o CVV1, que sozinho é inútil no checkout online.

## O arco completo: estático → dinâmico → substituído

Recapitulando a evolução, que é a espinha dorsal deste post:

| Camada | Natureza do dado | Ataque que resolve | Ataque que ainda sobra |
|:--|:--|:--|:--|
| **Magstripe** | estático, copiável | — | skimming/clonagem |
| **EMV** | dinâmico (ARQC/ATC) | clonagem presencial | e-commerce (dado ainda digitado) |
| **Token** | substituído + dinâmico | vazamento de PAN, reuso | engenharia social, phishing |

Cada camada não *substituiu* a anterior de imediato — elas **coexistem** no mesmo cartão de plástico que você tem no bolso. O seu Elo tem tarja (Ato 1), chip (Ato 2) e, se estiver no seu celular, um DPAN (Ato 3). Três gerações de segurança empilhadas, cada uma consertando o pecado da outra.

E tudo isso ficou visível porque plugei um leitorzinho de US$ 10 na USB e passei o meu próprio cartão. A tarja te conta tudo sem pestanejar — e é exatamente por isso que o resto do sistema teve que ficar tão esperto.

## Glossário rápido

- **PAN** — *Primary Account Number*, o número do cartão.
- **BIN/IIN** — prefixo que identifica bandeira + emissor.
- **Luhn** — checksum anti-erro de digitação.
- **Service code** — 3 dígitos que dizem *como* usar o cartão.
- **ARQC/ARPC/TC/AAC** — criptogramas do diálogo EMV.
- **ATC** — contador de transação que torna cada criptograma único.
- **AID** — identificador da aplicação/bandeira no chip.
- **iCVV/CVV1/CVV2/dCVV** — os quatro "CVVs" (veja o quadro).
- **FPAN/DPAN** — número real vs token.
- **TSP** — *Token Service Provider* (VTS, MDES).
- **Liability shift** — regra que empurra o custo da fraude pra tecnologia mais fraca.

> **Aviso legal e ético:** todo o experimento foi feito com **o meu próprio cartão**, num leitor meu, e o número aparece **mascarado**. Ler, copiar ou clonar cartões de terceiros é crime. Este material é educacional — sobre *como* o sistema funciona e *por que* ele é (hoje) difícil de fraudar.
