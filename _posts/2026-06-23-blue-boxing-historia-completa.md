---
layout: post
title: "Blue Boxing — História Completa: do Apito do Captain Crunch ao CPqD"
date: 2026-06-23 00:00:00
categories: [seguranca, historia, telefonia]
tags: [phreaking, blue-boxing, telefonia, brasil, in-band-signaling, r2d]
description: "Como um apito de cereal de $0.25, um tom de 2600 Hz e uma central telefônica que confiava no que ouvia criaram a primeira subcultura hacker — e como o Brasil escapou dela por 4 decisões de engenharia."
---

O [Fernando Guisso](https://www.linkedin.com/in/fernandoguisso/), algum tempo atrás, escreveu um post sobre [Phone Phreaking](https://guisso.dev/blog/phone-phreaking/). Ele me pediu para ler e dar um feedback. Assim o fiz. Como o assunto era Phreaking, conversamos por "Ligação de Voz", que em uma outra Era foi chamada de "Ligação Telefônica". Conversamos um bocado e sempre tem perguntas "com o gravador desligado".

Como isso aconteceu antes dos anos 2000, já prescreveu, então podemos falar sem Problemas Legais.

Na edição 2026 da BSides-ES, Titio [Nelson "T50" Brito](https://www.linkedin.com/in/nbrito/), keynote do Evento, fez uma Timeline da Internet Brasileira e momentos nostálgicos foram citados, como as "zines" que circulavam em BBS, listas de e-mails, canais de IRC, Fóruns, Disquetes de 1.44 MB...
Com isso vieram também os comentários sobre os "hoax" — boatos — que essas zines propagavam sobre Phreaking, sendo o principal deles: "Blue Boxing não funcionava no Brasil".

Nesse momento eu disse "Eu truco!" ao nosso Keynote.

"Blue Boxing funcionava no Brasil?"

Lê o Texto aí e, se no final você não tiver entendido meu ponto, ele fica de brinde na Conclusão.

---

## 1. O Que Era Blue Boxing

**Blue box**: dispositivo eletrônico que gerava tons de áudio para enganar centrais telefônicas analógicas, permitindo fazer ligações de longa distância gratuitamente. O princípio explorava uma falha fundamental da arquitetura telefônica dos anos 1950-1980: **in-band signaling** — a sinalização de controle trafegava no mesmo canal de voz que o usuário escutava.

### 1.1 In-Band vs Out-of-Band

```
IN-BAND (AT&T, pré-1985):
  Central A ── voz + comandos de controle ──→ Central B
  (usuário TEM acesso ao canal, pode gerar tons falsos)

OUT-OF-BAND (SS7, pós-1985):
  Central A ── voz ──→ Central B
  Central A ── SS7 ──→ Central B  (canal SEPARADO, usuário nunca acessa)
```

### 1.2 O Ataque

1 Discar um número TOLL-FREE (1-800, 0800) no país-alvo  
2 Tocar 2600 Hz na linha — a central interpreta como "trunk liberado"  
3 Discar o destino real usando tons MF (Multi-Frequency, não DTMF)  
4 Central completa a chamada. Billing registra só os 2s do toll-free  


### 1.3 Os Tons Envolvidos

**Line signaling (supervisão do tronco)**:

| Tom | Frequência | Significado |
|:--|:--|:--|
| **2600 Hz** | 2600 Hz | Tronco ocioso. Remover = ocupar. Aplicar = liberar |
| 2400 + 2600 Hz | 2VF | Versão tardia para links de satélite (SS5) |

**Register signaling (discagem entre centrais — MF, não DTMF)**:

| Sinal | Frequências (Hz) |
|:--:|:--|
| **KP** (iniciar) | 1100 + 1700 |
| **ST** (finalizar) | 1500 + 1700 |
| 1 | 700 + 900 |
| 5 | 900 + 1300 |
| 0 | 1300 + 1500 |

Seis frequências base (700, 900, 1100, 1300, 1500, 1700) combinadas em pares.
Totalmente diferente do DTMF do seu telefone residencial.

**DTMF (seu telefone)** vs **MF (centrais)** — não confunda:

```
       SEU TELEFONE (DTMF)            CENTRAIS (MF — Blue Box)

     Grupo das frequências altas      
        1209   1336   1447               Tons por par (15 combinações):
      ┌──────┬──────┬──────┐         
  697 │  1   │  2   │  3   │         KP  = 1100 + 1700  (iniciar)
      ├──────┼──────┼──────┤         ST  = 1500 + 1700  (finalizar)
  770 │  4   │  5   │  6   │         1   = 700 + 900
      ├──────┼──────┼──────┤         5   = 900 + 1300
  852 │  7   │  8   │  9   │         0   = 1300 + 1500
      ├──────┼──────┼──────┤         
  941 │  *   │  0   │  #   │         Base: 700, 900, 1100,
      └──────┴──────┴──────┘                1300, 1500, 1700 Hz
```

---

## 2. A História Global

### 2.1 Joe Engressia — O Pioneiro (1957)

Cego de nascença, Joe Engressia descobriu aos 7 anos que podia **assobiar** perfeitamente em 2600 Hz. Aos 11 anos, fazia ligações gratuitas assobiando para o telefone. Foi o primeiro phone phreak documentado. A AT&T o contratou como consultor de segurança aos 22 anos. Ele tinha ouvido absoluto — ouvia uma frequência e sabia exatamente qual era.

### 2.2 Captain Crunch — O Apito (1971)

John Draper, veterano do Vietnã e engenheiro eletrônico, descobriu que o **apito de brinde do cereal Cap'n Crunch** produzia exatamente 2600 Hz. Usando o apito + um gravador de fita, construiu a primeira blue box funcional.

### 2.3 A Revista Esquire (1971)

*Secrets of the Little Blue Box* (Ron Rosenbaum, Esquire, outubro 1971) foi o marco zero da cultura phreak. Leitores fundaram o **YIPL/TAP**, o primeiro zine hacker, que publicava esquemas de blue boxes.

### 2.4 Wozniak & Jobs — O Negócio (1972)

Steve Wozniak leu sobre o apito na revista *Esquire* e construiu sua própria blue box digital. Steve Jobs transformou em negócio: $40 de peças, vendida a $150 nos dormitórios de Berkeley.

Wozniak usou a blue box para ligar para o **Papa Paulo VI** no Vaticano, fingindo ser Henry Kissinger. Quase conseguiu. Jobs diria depois: *"Se não fosse pela blue box, não existiria Apple."*


---

## 3. O Vetor de Entrada — Números Toll-Free

O primeiro passo do blue boxing era sempre o mesmo: ligar para um número gratuito no país-alvo. A chamada era gratuita, sempre completava, e uma vez conectado ao tronco internacional, o tom de 2600 Hz sequestrava a linha.

### 3.1 Números Reais Usados

| Número | País | Empresa | Por que Era Bom |
|:--|:--|:--|:--|
| 1-800-225-5288 | EUA | AT&T (suporte) | O padrão ouro — a própria AT&T |
| 1-877-777-4778 | EUA | IRS (receita) | **45 min de fila** — silêncio infinito |
| 1-800-221-1212 | EUA | Delta Airlines | 24h, nunca ocupado |
| 0800 800 150 | Reino Unido | BT | Equivalente britânico |
| 0800 906 188 | Hong Kong | Turismo HK | Gateway asiático |
| 01-800-123-4567 | México | Telmex | Crossbar AT&T |
| 0800 012 3456 | Costa Rica | ICE | Último da AL, in-band até 1995 |
| 1800 10 888 1717 | Filipinas | PLDT | Último da Ásia, até 1998 |

### 3.2 Estratégia de Seleção

Os melhores vetores eram serviços **24h com fila longa**:
- **Companhias aéreas** (reservas, madrugada): tempo de espera ideal
- **Suporte técnico** (Microsoft, AT&T): sempre ativo
- **Receita federal** (IRS, Receita): fila de 30-45 minutos — ninguém atendia
- **Hotéis** (Marriott, Sheraton): central de reservas, staff reduzido de noite

---

## 4. Call-Through Internacional — O Vetor +800

Na década de 1990, surgiu o **+800 UIFN** (Universal International Freephone
Number, padrão ITU-T E.169). Um número só, gratuito de **qualquer país do mundo**.

### 4.1 Como Funcionava

1 Você disca o +800 (gratuito, de qualquer país  
2 Cai na central estrangeira (ex: Dansk Telekom, Copenhagen  
3 Ouve "Velkommen til Dansk Telekom"  
4 Digita o número de destino  
5 Chamada completada, cobrada no cartão de crédito  

Para blue boxing (antes da digitalização):  
3a Antes da mensagem, injetar 2600 Hz  
4a Tronco internacional aberto → discar destino real  
5a Custo: ZERO (o +800 pagou a perna internacional)


### 4.2 Serviços +800 da Época

| País | Operadora | Janela |
|:--|:--|:--:|
| **Dinamarca** | Dansk Telekom/TDC | 1993-1997 |
| **Hong Kong** | Cable & Wireless | 1990-1997 |
| Suécia | Telia | 1994-1998 |
| Noruega | Telenor | 1994-1999 |
| Finlândia | Sonera | 1995-2000 |

Ainda lembro da voz da atendente automática dizendo "Velkommen til Dansk Telekom"...

### 4.3 Acesso do Brasil — Prefixo 000

O código de acesso internacional pré-Embratel era **000** (Telebrás).
Os números exatos, documentados pelo zine brasileiro PhreaKhaoS (2000):

| Código | País |
|:--|:--|
| 000-8045 | Dinamarca (Dansk Telekom) |
| 000-8085-212 | Hong Kong (Cable & Wireless) |
| 000-8037 | México (Telmex) |
| 000-8033 | França (France Télécom) |
| 000-3315-17-18 | Finlândia (Sonera) |
| 000-8035 | Portugal |

---

## 5. Frequências de Trunk — O Manual Técnico

2600 Hz era o tom da AT&T. Mas cada país e cada fabricante usava frequências **diferentes**. Uma blue box calibrada para os EUA não funcionava na França.

### 5.1 R1 — Padrão Americano (Bell System)

- **Line signaling**: 2600 Hz SF (single-frequency). Presente = idle.
  Versão 2VF: 2400 + 2600 Hz, tone-off idle.
- **Register signaling (MF)**: 6 frequências (700-1700 Hz), 15 pares de tons
- **KP**: 1100+1700 (iniciar). **ST**: 1500+1700 (finalizar)
- **Sequência**: KP + código do país + área + número + ST

### 5.2 R2 — Padrão Europeu (CCITT)

O R2 europeu era **diferente na raiz**: usava sinalização **compelida** — cada dígito era confirmado por um tom de resposta antes do próximo.

```
   ORIGEM                           DESTINO
  ┌──────┐                         ┌──────┐
  │      │── 1380+1500 ("1") ─────→│      │
  │      │←─ 1140+1020 ("OK") ─────│      │
  │      │── 1500+1740 ("5") ─────→│      │
  │      │←─ 1140+1020 ("OK") ─────│      │
  │      │── 1740+1860 ("0") ─────→│      │
  │      │←─ 1140+1020 ("OK") ─────│      │
  │      │── 1380+1980 ("fim") ───→│      │
  │      │←─  660+540  ("OK") ─────│      │
  └──────┘                         └──────┘
```
Cada dígito CONFIRMADO antes do próximo.  
Handshake completo. Zero confiança.  

Forward tones:  1380, 1500, 1620, 1740, 1860, 1980 Hz  
Backward tones: 1140, 1020, 900, 780, 660, 540 Hz  

Handshake:  
  Origem: 1380+1500 ("dígito 1")  
  Destino: 1140+1020 ("recebido, envie próximo")  
  Origem: 1500+1740 ("dígito 5")  
  Destino: 1140+1020 ("recebido, próximo")  
  ...  

O R2 Digital (Brasil) substituía os tons por **bits A/B/C/D no timeslot 16 do E1** — zero tom audível. Imune a blue boxing.

### 5.3 Frequências de Line Signaling por País

| País / Sistema | Frequência | Fonte |
|:--|:--|:--|
| EUA / Canadá (R1) | **2600 Hz** | Bell Labs 1954 |
| EUA-Europa (SS5) | 2400 + 2600 Hz | ITU-T Q.140 |
| **México** | **2650 Hz** + 2600 Hz | PhreaKhaoS Zine #1 |
| **França** | **2415 Hz** + 2620 Hz | PhreaKhaoS Zine #1 |
| Reino Unido (BT) | **2280 Hz** | textfiles.com |
| Alemanha Oc. | **2400 Hz** | CCC Datenschleuder |
| Itália (SIP) | **2500 Hz** | Phrack Magazine |
| URSS / Rússia | **2100 Hz** / 1200 Hz | textfiles.com |
| Austrália, Suécia, Holanda | 2600 Hz | textfiles.com |
| **Brasil** | — | **R2 Digital — imune** |
| SS4 (intercontinental) | 2040 / 2400 Hz | ITU-T Q.120 |

### 5.4 Variações por Fabricante

| Fabricante | Frequência | Países Exportados |
|:--|:--|:--|
| Western Electric / AT&T | 2600 Hz | EUA, Porto Rico, Filipinas, Panamá, Libéria |
| Siemens | 2400 Hz | Alemanha, Áustria, Grécia, Colômbia, Nigéria |
| Ericsson | variantes R2 | Suécia, Costa Rica, México (parcial) |
| ITT | variantes R2 | Argentina, Chile, Espanha |
| CIT-Alcatel | ~2415 Hz | França, Marrocos, Egito |
| GEC/Plessey | 2280 Hz | Reino Unido, Hong Kong, Índia, Jamaica |
| Soviético (Quasar) | 2100/1200 Hz | URSS, Cuba, Coreia do Norte |

### 5.5 Parâmetros de Software

A PhreaKhaoS publicou trunks reais no formato Blue Beep/Scavenger:

México (000-8037):  
  TONE 1: F1=2650 V1=63 F2=2405 V2=51 Len=351 Pause=6  
  TONE 2: F1=2600 V1=63 F2=2407 V2=63 Len=620 Pause=5  

França (000-8033):  
  TONE 1: F1=2415 V1=63 F2=2620 V2=63 Len=170 Pause=65  
  TONE 2: F1=2415 V1=63 F2=0    V2=0  Len=600 Pause=0  

---

## 6. A Morte do Blue Boxing — Timeline Global

A morte não veio por leis ou prisões. Veio por **arquitetura**.
Cada país migrou para sinalização digital em seu próprio ritmo:

| País | Morreu em | Tecnologia |
|:--|:--:|:--|
| EUA / Canadá / **Porto Rico** | **1985** | SS7 + 5ESS/DMS-100 |
| Suécia | 1985 | AXE digital (Ericsson) |
| França | 1988 | E10 digital |
| Japão | 1988 | D70 digital (NEC) |
| Reino Unido | 1990 | System X |
| Alemanha Oc. | 1990 | EWSD digital (Siemens) |
| Holanda | 1991 | 5ESS-PRX |
| México | 1992 | Privatização Telmex |
| Argentina | 1992 | Privatização ENTel |
| **Hong Kong** | **1993** | Pré-devolução à China |
| **Dinamarca** | **1993** | Jutland digital |
| Itália | 1993 | SIP modernizado |
| Venezuela | 1994 | Privatização CANTV |
| **Costa Rica** | **1995** | ICE (finalmente) |
| **Filipinas** | **1998** | PLDT, último da Ásia |
| **Índia** | **2000** | BSNL crossbar legado |
| Nigéria / Cuba | **2000+** | Caos / embargo |
| **Brasil** | **—** | **Nunca vulnerável (R2D)** |

**Importante**:  
Em 1995, blue boxing estava praticamente morto nos países desenvolvidos. EUA, Porto Rico, UK, Alemanha, Japão, Dinamarca, Hong Kong — todos digitais. O "horário nobre" foi **1957-1985**: os 30 anos entre Joe Engressia e o SS7. Depois disso, só Filipinas (até 98), Índia (até 2000) e Nigéria/Cuba (até 2000+) ainda tinham trunks analógicos.

---

## 7. Brasil — Por que Nunca Funcionou

O Brasil não se protegeu por lei — se protegeu por **engenharia**.

### 7.1 R2 Digital em Vez de In-Band

Enquanto os EUA usavam tons no canal de voz, o Brasil adotou o padrão **R2 Digital** (ITU-T Q.421-Q.442) desde os anos 1970:

EUA (AT&T):
```
  Central A ── voz + tons de controle ──→ Central B
  (usuário OUVE os tons e pode GERAR tons falsos)
```

Brasil (Telebrás):
```
  Central A ── voz ──→ Central B
  Central A ── R2D ──→ Central B (bits no timeslot 16 do E1)
  (usuário NUNCA acessa o canal de sinalização)
```

O R2 Digital usa bits A, B, C, D no canal 16 do PCM (E1) — bits que o assinante não consegue manipular. Mesmo que um phreak gerasse 2600 Hz na linha, a central simplesmente **ignorava** — aquele tom não significava nada no protocolo R2D.

A Cisco documentou a variante brasileira: *"R2 digital line signaling uses A, B, C, and D bits in time slot 16 of an E1 frame. The Brazilian variant is a specific configuration for line seizure, answer, clear-forward, and clear-back."* (E1 R2 Signaling Theory, 2006)

### 7.2 CPqD Trópico — Nacionalização com Design Seguro

Enquanto os EUA compravam centrais Western Electric da AT&T (compatíveis com in-band por inércia histórica), o Brasil desenvolveu tecnologia própria:

| Ano | Evento |
|:--:|:--|
| 1972 | **Telebrás** criada (Lei 5.792) |
| 1976 | **CPqD** (Centro de Pesquisa e Desenvolvimento), Campinas |
| 1980 | **Trópico** — central CPA 100% brasileira |
| 1982 | **Trópico RA** — primeira central digital brasileira |

O paper de Ménard & Costa (2000) documenta: *"A central Trópico RA representou um salto tecnológico: o Brasil passou diretamente de centrais analógicas importadas para uma central digital própria, sem a fase intermediária de centrais crossbar com sinalização in-band."*

A FAPESP confirmou que a decisão de **separar sinalização de voz desde o primeiro dia** foi deliberada: a equipe do CPqD conhecia o problema do in-band e projetou o Trópico para evitá-lo.

### 7.3 Brasil Pulou a Fase Vulnerável

EUA:
```
         Passo-a-passo → Crossbar → ESS → Digital
         └── in-band por ~30 anos ──┘
```
Brasil:  
```
         Passo-a-passo → CPqD Trópico → Digital
         └── janela de vulnerabilidade: ZERO ──┘
```

### 7.4 O Chipping — O Phreaking Nativo Brasileiro

Ironicamente, enquanto o blue boxing era impossível, o Brasil desenvolveu sua própria técnica: **chipping**.

Orelhões brasileiros usavam **pulsos de 12 kHz** enviados pela central durante a chamada para debitar créditos. Um chip injetava pulsos falsos, zerando o contador:

```
EUA (blue boxing):                        Brasil (chipping):

  ┌──────┐   2600 Hz    ┌────────┐         ┌────────┐   12 kHz   ┌───────┐
  │ Phone│─────────────→│ Central│         │ Central│───────────→│Orelhão│
  │Phreak│   "desliga"  │  AT&T  │         │Telebrás│   "pulso"  │  azul │
  └──────┘              └────────┘         └────────┘            └──┬────┘
      │                      │                                      │
      │←── tronco livre ─────│             ┌────┐   12 kHz fake     │
      │                      │             │Chip│──────────────────→│
      └── disca destino ────→              └────┘   "crédito ∞"     │
                                                                    │
  Engana a CENTRAL                         Engana o ORELHÃO
```

A principal fonte primária é o fanzine **Barata Elétrica** (Derneval Cunha, anos 1990), que documentava chipping, centrais CPA e cartões indutivos.
Arquivo completo em [absoluta.org/barata/](absoluta.org/barata/).

### 7.5 Brasil vs EUA — Resumo

| Aspecto | EUA | Brasil |
|:--|:--|:--|
| Sinalização | In-band (2600 Hz) | R2 Digital (bits no E1) |
| Central padrão | Western Electric crossbar | CPqD Trópico digital |
| Janela vulnerável | ~30 anos (1955-1985) | **Zero** |
| Phreaking nativo | Blue/red/black boxing | Chipping (orelhões) |
| Subcultura | 2600 Magazine, DEF CON | Barata Elétrica, #phreak Brasnet |

---

## 8. Evidência de Campo — PhreaKhaoS Zine (2000)

Em julho de 2000, o grupo brasileiro PhreaKhaoS (Phroide & Di4lt0n3) publicou uma compilação de seus textos sobre phreaking. O zine é a **fonte primária mais importante** sobre blue boxing a partir do Brasil.

**Trechos-chave**:

> "E outra besteira falar que Blue Box nao funciona no Brasil. E claro que funciona, mas usando os trunks de outros paises."

> "Blue Box funciona pelo simples fato de nao usar o sistema Telefonico Brasileiro."

Isso confirma exatamente nossa conclusão: blue boxing **do** Brasil funciona (atacando trunks estrangeiros), mas blue boxing **no** Brasil é impossível (o sistema brasileiro é R2 Digital, imune).

O zine também confirma que a **Red Box não funcionava** no Brasil (os orelhões brasileiros não usavam tons de moeda como os americanos) e publicou os trunks reais do México (2650 Hz) e França (2415 Hz).

---

## 9. Outras Técnicas de Phreaking

| Caixa | Função | Funcionava no Brasil? |
|:--|:--|:--:|
| **Blue** | Ligação gratuita via in-band | De saída ✅ / De entrada ❌ |
| **Red** | Simular moeda em orelhão | ❌ (sistema diferente) |
| **Black** | Caller ID falso | ✅ (tensão na linha) |
| **Beige** | Grampo de linha (modo reparo) | ✅ |
| **Silver** | Gerar tons DTMF | ✅ |
| **Gold** | Ponte entre chamadas | ✅ (centrais antigas) |

---

## 10. Legado

Blue boxing morreu tecnicamente, mas seu legado é imenso:

1 **Cultura hacker**: a primeira subcultura a explorar sistemas por curiosidade intelectual, não por lucro  
2 **Apple**: Wozniak e Jobs começaram vendendo blue boxes   
3 **Segurança de redes**: provou que in-band signaling é intrinsecamente inseguro — todo protocolo moderno separa controle de dados  
4 **SS7**: a transição para out-of-band foi acelerada pelos phreaks  
5 **Brasil**: por acaso ou design, o CPqD acertou onde a AT&T errou — separou sinalização de voz desde o primeiro dia

---

## 11. Conclusão

Esses boatos, na sua maioria (até onde tive contato), vinham das zines brasileiras.

Tive pouco contato com zines gringas naquela época especializadas em Phreaking fora dos EUA, mas tinha algum material Europeu já disponível, só que difícil de fazer o networking.

Quando no IRC, sempre fui muito mais de frequentar canais gringos do que nacionais (exceção era o #deface na BrasNET).

Acho que isso, majoritariamente, aconteceu primeiro por traduções de zines gringas — principalmente americanas — que eram as que chegavam por aqui quando alguém arriscava ir atrás de algo. E aqui nem estou falando de BBS no sentido de discar diretamente para um modem, mas sim por intermédio de um "Provedor de Acesso à Internet", ainda Internet discada, antes da "Internet Comercial".

Por outro lado, o custo caro dos equipamentos de Telefonia na época inviabilizava "iniciativas independentes de Pesquisa". Logo, propagava-se o que vinha de fora como verdadeiro, já que relatos não faltavam, mesmo ninguém conseguindo replicar.

Os pouquíssimos sortudos que tiveram acesso a conteúdo Europeu entenderam que a falha existia em lugares diferentes, de formas diferentes.

Enquanto americanos ligavam para um número gratuito, geralmente local mas às vezes intermunicipal, abusavam do trunk e pivotavam para o destino final, alguns phreakers Europeus precisavam ligar para outro país para fazer isso — às vezes para ligar para uma BBS na Cidade Vizinha (grátis é mais barato que uma ligação intermunicipal com desconto).

Em anos recentes tive contato com outros materiais LATAM que replicavam o mesmo boato, creio que pelos mesmos motivos brasileiros.

Um outro fenômeno que a internet discada proporcionou foi o "War Dialing". Muitas vezes nem era para tentar invadir uma empresa como mostrado no filme de 1995 *Hackers* (que no Brasil recebeu o subtítulo de "Piratas de Computador"), mas para ter acesso gratuito à internet. Existiam canais na BrasNET e BrasIRC chamados "di grátis", que compartilhavam números de ISP que tinham 0800.

![BlueBEEP](/images/0194e24b-3fc5-7448-977f-0d68ee82b2c1.png)

Interface do [BlueBEEP](https://github.com/Jimvin/BlueBEEP), programa que usávamos para fazer Blue Boxing.

Esse texto compila, com ajuda de IA, muito dos meus anos de "Don't learn to Hack. Hack to Learn."  
(Quem sabe, sabe. Mas qualquer hora eu escrevo quando eu puxei 170m de Fio Telefônico do Orelhão para a Casa dos meus pais para acessar Internet de Tarde.)---

## Referências

### Geral / Histórica
- Rosenbaum, R. (1971): *Secrets of the Little Blue Box*. Esquire Magazine
- Lapsley, P. (2013): *Exploding the Phone*. Grove Press. ISBN: 978-0-8021-2061-8
- Sterling, B. (1992): *The Hacker Crackdown*. Bantam. ISBN: 978-0-553-56370-8

### Técnica / Sinalização
- Weaver, A. & Newell, N. A. (1954): *In-Band Single-Frequency Signaling*. Bell System Technical Journal. DOI: `10.1002/j.1538-7305.1954.tb03758.x`
- Breen, C. & Dahlbom, C. A. (1960): *Signaling Systems for Control of Telephone Switching*. BSTJ. DOI: `10.1002/j.1538-7305.1960.tb03947.x`
- ITU-T Q.400-Q.490: *Specifications of Signalling System R2*
- ITU-T Q.441 (1988): *Signalling Code for R2 MFC*
- Cisco (2006): *E1 R2 Signaling Theory*. Document ID 5717

### Brasil / CPqD
- Ménard, M. & Costa, M. C. (2000): *Reforma do Estado e pesquisa nas telecomunicações no Brasil: um estudo sobre o CPqD*
- FAPESP: *Pioneirismo na telefonia*. https://revistapesquisa.fapesp.br/pioneirismo-na-telefonia/
- CPqD: Patente PI8106322 — *Central de Telecomunicações Trópico*
- Brasil (1972): Lei 5.792 — Criação da Telebrás

### Phreaking / Fontes Primárias
- PhreaKhaoS Zine #1 (14/07/2000): Compilação de Phroide & Di4lt0n3.
- Cunha, D. (c. 1990): *Barata Elétrica* (fanzine).
- Phrack Magazine #25 (1989): *CCITT Signalling*.
- 2600 Magazine (1984-2000): Diversas edições
- Chaos Computer Club: *Die Datenschleuder* — trunks alemães
