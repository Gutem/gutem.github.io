---
layout: post
title: "WiGLE: O Que as Corporações Não Sabem Que Você Sabe"
date: 2026-06-23 00:00:00 -0300
categories: [seguranca, osint, redes]
tags: [wigle, osint, wireless, wifi, bluetooth, wardriving, pentest, recon, mercadolivre]
description: "O que 20 anos de wardriving revelam sobre a infraestrutura de uma das maiores empresas da América Latina — e como 3 APs portáteis, MACs sequenciais e SSIDs padrão de fábrica contam histórias que ninguém pretendia contar."
---

> Algumas noites você não consegue dormir. Outras, você descobre que
> um dos maiores conglomerados da América Latina tem três Access Points
> triangulados na Avenida Paulista — MACs sequenciais, observações únicas,
> e o rastro de uma pessoa que nunca soube que estava sendo vista.
> Esta é a história da segunda noite.

---

## I. A Faísca

Era uma daquelas madrugadas em que o sono não vem. Você rola o feed, fecha, abre de novo. Mais uma notícia de vazamento. Mais uma corporação que "lamenta profundamente" e promete "reforçar protocolos". As mesmas palavras. O mesmo ciclo.

Você se pergunta: o que mais está exposto que ninguém está olhando?

Não falhas técnicas que scanners automatizados de bug bounty catalogam. Não falhas de regra de negócio que pagam bounty por formulário mal validado. **Falhas de gestão de ativos.** Dispositivos esquecidos. SSIDs que revelam a topologia da rede. APs que ninguém renomeou. Coisas que não aparecem no OWASP Top 10 mas estão transmitindo 24 horas por dia.

Você fecha o navegador. Abre o terminal.

---

## II. O Método

Existe um banco de dados que cataloga redes sem fio desde 2001. Chama-se **WiGLE** — Wireless Geographic Logging Engine. A premissa é simples: voluntários no mundo inteiro ligam o app no celular enquanto andam de carro, ônibus, bicicleta. O app detecta redes WiFi, dispositivos Bluetooth, torres de celular — e envia as coordenadas GPS.

Vinte anos depois: **1,2 bilhão de redes WiFi catalogadas.** Cada uma com localização. Cada uma com nome. Cada uma com o tipo de criptografia.

Ninguém pediu permissão para catalogar essas redes. Elas transmitem.
Estão no ar. São públicas por definição. O WiGLE só escuta.

A API é gratuita. O SDK é zero-dependências.

```bash
bun install wigle-sdk
```

Você cria uma conta em 30 segundos. Copia a API key. E começa com stats globais antes mesmo de pesquisar um alvo:

```js
import { createWiGLE } from 'wigle-sdk'
const w = createWiGLE(API_NAME, API_TOKEN)

// Top 10 fabricantes de roteador no mundo
const { top } = await w.getTopManufacturers(10)
// Cisco 48.6M, Netgear 39.7M, ARRIS 38.1M, TP-Link 30.6M...
// D-Link aparece 2x na API (D-Link International + D-Link Corporation).
// O SDK deduplica automaticamente → 17.9M combinados.

// Top 10 SSIDs globais
const { top: ssids } = await w.getSSIDStats(10)
// xfinitywifi 27M, XFINITY 10M, Spectrum Mobile 7M, iPhone 4.4M...

// Criptografia por país (Brasil)
const { breakdown } = await w.getEncryptionStats('BR')
// WPA2: 70%, Unknown: 23%, WEP: 4%, None: 2%, WPA: 1%
```

Dois segundos. Zero scraping. A WiGLE já computou essas agregações — a SDK só precisa pedir.

---

## III. O Que o Silêncio Revela

```js
import { createWiGLE } from 'wigle-sdk';
const wigle = createWiGLE(API_NAME, API_TOKEN);

const r = await wigle.wifiSearch({ ssidlike: '%MercadoLivre%' });
// → 61 redes Mercado Livre no Brasil
```

Sessenta e uma. A resposta veio antes do café terminar de passar.

Você começa a ler os SSIDs. Não são só nomes — são decisões organizacionais que alguém, em algum momento, tomou. E que agora estão expostas para quem quiser ver. (✅ = fato confirmado por `wifiDetail`. ❓ = inferência baseada em dados parciais.)

| SSID | O que o nome conta |
|------|-------------------|
| `MercadoLivre_CORP` | ✅ Fato: dois APs Cisco (`18:9C:5D`, `20:BB:C0`) em Alphaville/Barueri — Al. Rio Negro, 111. ❓ Inferência: `_CORP` diferencia rede de escritório (IT) das redes de operação; naming consistente com segregação IT/OT, mas sem acesso à rede interna não é possível confirmar. |
| `MERCADOLIVRE 13` ... `MERCADOLIVRE 34` | ✅ Fato: 7 APs em São João de Meriti/Duque de Caxias, RJ. Dispersão GPS de **4.225 m** na diagonal (1.744 m × 3.849 m) — incompatível com prédio comercial. Rodovia Presidente Dutra, Viaduto São João, Rua da Matriz: zona industrial. MAC `F8:5E:3C` = Shenzhen Zhibotong Electronics (OEM chinês). Observações de ago/2025 a fev/2026 — ativos e recentes. ❓ Inferência: numeração + dispersão geográfica + zona industrial + OEM chinês = consistente com rede operacional de centro de distribuição. |
| `PTP_NETMOGI_MERCADOLIVRE` | ❓ Inferência: `PTP` = Point-to-Point, `NETMOGI` sugere Mogi das Cruzes. Consistente com enlace de rádio entre unidades. Sem BSSID registrado para verificar fabricante de rádio (Ubiquiti AirMax? MikroTik?). |
| `SYSTEM_MERCADOLIVRE` | ❓ Inferência: "SYSTEM" no SSID sugere equipamento configurado com nome de sistema interno. Cidade: Caruaru, PE. Sem BSSID para verificar fabricante ou uptime. |
| `WIFI_MERCADOLIVRE` / `2G_MERCADOLIVRE` / `5G_MERCADOLIVRE` | Redes de operação local. Tatuí, Londrina, Santo André, Diadema. |

As cidades formam um mapa que nenhum relatório anual publica: **Barueri (Alphaville), São Paulo, Rio de Janeiro, Belo Horizonte, Curitiba, Londrina, Porto Velho, Caruaru, Tatuí, São João de Meriti, Nova Iguaçu, Nilópolis, Duque de Caxias, Santana de Parnaíba, Santo André, Diadema, Viana.**
Dezessete municípios. Infraestrutura física real. Tudo deduzido de nomes de rede WiFi.

E os Access Points `MercadoLivre_CORP` têm prefixo MAC `18:9C:5D` e `20:BB:C0`. Ambos são **Cisco**. APs enterprise. E Cisco enterprise tem um histórico de CVEs que exige atenção:

| CVE | CVSS | O quê |
|-----|------|-------|
| [CVE-2023-20198](https://nvd.nist.gov/vuln/detail/CVE-2023-20198) | **10.0** | IOS XE Web UI — auth bypass → privesc para root. Explorado ativamente por atores de estado-nação em 2023. |
| [CVE-2023-20273](https://nvd.nist.gov/vuln/detail/CVE-2023-20273) | **7.2** | IOS XE Web UI — injeção de comando com privilégio de root. |
| [CVE-2022-20821](https://nvd.nist.gov/vuln/detail/CVE-2022-20821) | **8.6** | IOS XE health monitoring — RCE via porta 80/443, sem autenticação. |

A WiGLE não expõe a versão do firmware. Mas expõe três campos de tempo: `firsttime` (primeira observação), `lasttime` (última observação) e `lastupdt` (atualização do registro no banco). O que esses campos revelam sobre os APs `MercadoLivre_CORP`:

| BSSID | firsttime | lasttime | Span |
|-------|-----------|----------|------|
| `18:9C:5D:50:C7:43` | 26/fev/2020 | 26/fev/2020 | 1 dia — **observação única** |
| `20:BB:C0:83:91:C3` | 26/fev/2020 | 16/mar/2020 | 18 dias |

**Seis anos sem novas observações.** Esses APs não estão "ativos" — são registros de fevereiro de 2020, pré-pandemia. O campo `lastupdt` mostra 2022, mas isso é quando o banco da WiGLE atualizou o registro, não quando alguém viu o sinal de novo.

Isso não invalida os CVEs. Um AP Cisco sem patch em 2020 estava vulnerável aos CVEs da época. E se o escritório de Alphaville ainda usa os mesmos APs — apenas com SSID renomeado — os CVEs de 2022-2023 se aplicam ao hardware que estava lá.

Mas a lição é: **`lastupdt` ≠ `lasttime`.** O primeiro é manutenção de banco. O segundo é a última vez que um wardriver passou perto. Seis anos de silêncio wireless podem significar três coisas: o escritório mudou, o SSID foi renomeado, ou ninguém passou wardrivando em Alphaville desde 2020.

Você expande:

```js
const latam = await wigle.wifiSearch({ ssidlike: '%MercadoLibre%' });
// → 92 redes em 7 países
```

| País | Redes |
|------|-------|
| Argentina | 45 |
| Colômbia | 29 |
| México | 4 |
| Venezuela | 4 |
| Equador | 3 |
| Chile | 2 |
| Uruguai | 1 |

Os SSIDs latino-americanos contam uma história paralela. `Oficina MercadoLibre` — dois APs no bairro de Floresta, Buenos Aires (Joaquín Victor González 821 e Avenida Gaona 4208), a 100 metros um do outro, provavelmente um centro de reparos ou ponto de serviço. `MercadoLibre-Client` — rede voltada ao consumidor? `INTERNET gratis MERCADOLIBRE.COM` — WiFi público com a marca da empresa cravada no SSID, como se convidasse: *"estamos aqui, nosso nome está no ar, e não estamos prestando atenção."*

Você passou 15 minutos nisso. Não saiu de casa.

---

## IV. O Silêncio Que Fala Mais Alto

Volte para os 61 resultados. Três APs compartilham o mesmo prefixo no SSID. Mesma raiz nos endereços MAC:

| BSSID | Localização | Observado em |
|-------|------------|-------------|
| `1A:EA:14:15:73:AC` | Av. Paulista, 1000 — Edifício Paulista Mil | 09/jan/2026 |
| `12:EA:14:15:73:AD` | Shopping Cidade São Paulo | 30/out/2025 |
| `16:EA:14:15:89:1F` | Alameda Santos, 1086 | 13/ago/2025 |

Três localizações. 200 metros entre os pontos mais distantes. MACs sequenciais (`:73:AC`, `:73:AD`). Única observação cada — capturados uma vez e nunca mais.

O prefixo `ACT-` nestes SSIDs pode ser **Agência de Correios e Telégrafos**.
Mas a correlação diz outra coisa. Não existe agência dos Correios na Alameda Santos 1086 — a AC mais próxima fica no número 2224, a 1,2 km dali. Também não há agência dentro do Shopping Cidade São Paulo.

Três MACs com a mesma raiz, localmente administrados (bit U/L = 1 no [IEEE 802 §8.2](https://standards.ieee.org/wp-content/uploads/import/documents/tutorials/macgrp.pdf), [RFC 7042 §2.1](https://datatracker.ietf.org/doc/html/rfc7042#section-2.1)), vistos em dias diferentes, em pontos diferentes, uma única vez cada.
**É um dispositivo portátil.** Um hotspot de celular. Um MiFi. Um roteador de bolso. Alguém configurou o SSID pessoal com o nome `ACT-MERCADOLIVRE` e passou por esses três endereços ao longo de seis meses.

Sobre o encryption: a API de busca retornou `none` para um dos APs, mas o endpoint de detalhe (`wifiDetail`) mostra `wep: "2"` — WPA2. O AP está protegido. O `none` da busca foi um falso positivo do campo de sumário.

Mas isso não diminui a história. **Aumenta.** Porque o que você acaba de fazer é correlacionar três observações independentes de wardriving — capturadas por pessoas diferentes, em dias diferentes — e deduzir:

1. **Dispositivo portátil.** MACs sequenciais + localmente administrados + observações únicas em pontos distintos.
2. **Rotina de trabalho.** O dono frequenta a Av. Paulista e arredores. Shopping, edifício comercial, rua de serviços. Não é turista.
3. **Vínculo profissional.** Ninguém nomeia o hotspot pessoal com `MERCADOLIVRE` por acaso. É funcionário, prestador de serviço,
   ou entregador terceirizado.
4. **Frequência esporádica.** Três visitas em seis meses. Não é rotina diária de escritório — é alguém que passa por esses endereços ocasionalmente.

Você não sabe o nome. Mas sabe **onde esteve**, **quando esteve**, e **com que frequência.** Tudo deduzido de três linhas num resultado de API gratuita.

Isso é OSINT. Não sobre a infraestrutura de uma empresa. Sobre o movimento de uma pessoa.

Essa informação está disponível publicamente. A WiGLE catalogou. A API entregou. Você não precisou de exploit, não precisou de engenharia social.

```js
const { scanOpenWifi } = extendClient(wigle);

// Cada AP aberto num raio de 1km do escritório (Alphaville, Barueri)
const open = await scanOpenWifi(
  -23.507, -23.497,
  -46.852, -46.842
);
```

Trinta segundos. O output é uma lista de redes — cafés, lojas, vizinhos — todas sem senha. Cada uma é um canal que não passa pelo firewall corporativo. Cada uma é um caminho livre para exfiltração. Talvez só precise de um adaptador WiFi com antena externa.

---

## V. A Escala

Você não precisa fazer isso manualmente. Vinte linhas bastam:

```js
const ENDERECOS = [
  'Barueri, SP',            // escritório (Alphaville, Al. Rio Negro 111)
  'São João de Meriti, RJ',
  'Cajamar, SP',
  'Betim, MG',
];

for (const addr of ENDERECOS) {
  const geo = await w.geocode(addr);
  const bbox = geo.results[0].boundingbox;

  const redes = await w.wifiSearch({
    latrange1: parseFloat(bbox[0]),
    latrange2: parseFloat(bbox[1]),
    longrange1: parseFloat(bbox[2]),
    longrange2: parseFloat(bbox[3]),
    ssidlike: '%Mercado%',
    resultsPerPage: 500,
  });

  const abertas = redes.results.filter(n => n.encryption === 'none');
  console.log(`${addr}: ${redes.totalResults} APs, ${abertas.length} abertos`);
}
```

O loop termina em segundos. E se o resultado tiver mais de 1000 APs, o SDK paginaria automaticamente:

```js
// Paginação automática via searchAfter — sem loop manual
const todas = await w.wifiSearchAll({
  country: 'BR',
  ssidlike: '%Mercado%',
});
// → todas.results: array completo, todas.pages: quantas páginas
```

E tem o Mercado Pago:

```js
const mp = await w.wifiSearch({ ssidlike: '%MercadoPago%' });
// → 18 redes. São Paulo. Salvador.
```

Não são terminais de pagamento — POS não tem Access Point próprio. Podem ser **escritórios, revendas e pontos de atendimento** do Mercado Pago. Cada um com seu próprio WiFi. Cada um visível no mapa.

E para escala continental — buscar por país em vez de coordenadas:

```js
const br = await w.wifiSearchByCountry('BR', { ssidlike: '%Mercado%' });
const ar = await w.wifiSearchByCountry('AR', { ssidlike: '%Mercado%' });
const co = await w.wifiSearchByCountry('CO', { ssidlike: '%Mercado%' });
// Sem geocoding, sem bbox manual. O SDK resolve.
```

---

## V-B. O Panorama Global

Antes de continuar no alvo específico, um passo atrás. O que a WiGLE revela sobre o mundo?

```js
// 25 métodos no SDK. Stats globais são 2 deles.

const { breakdown } = await w.getEncryptionStats();
// Global: WPA2 70%, Unknown 23%, WEP 4%, None 2%, WPA 1%
// Brasil é igual à média global. 2% de redes abertas = 689 mil APs sem senha no BR.

const { top } = await w.getTopManufacturers(10, true); // routersOnly
// Cisco 48.6M, Netgear 39.7M, ARRIS 38.1M, TP-Link 30.6M, Huawei 22.9M
// Sagemcom 20.3M, Linksys 18.3M, Ruckus 18.1M, D-Link 17.9M, Technicolor 15.9M
// D-Link aparece duplicado na API bruta (D-Link International + D-Link Corporation).
// O SDK mergeManufacturers() deduplica automaticamente.
```

Isso não é pesquisa. É um `GET` autenticado na API `/api/v2/stats/general`. A WiGLE mantém essas agregações pré-computadas desde 2001. O SDK só parseia o JSON — `mergeManufacturers` junta os sinônimos, `filterRouterBrands` separa roteadores de laptops.

O que isso significa para o security researcher: você sabe **quais fabricantes dominam o mercado global** antes de escolher um alvo. Cisco é #1. Netgear é #2. E D-Link + TP-Link + Huawei somam 71 milhões de APs catalogados. Cada um com CVEs públicas. Cada um geo-localizado.

---

## V-C. O Que os Nomes Padrão Revelam

Mas o verdadeiro vetor de hardware não está nos SSIDs com nome de empresa. Está nos dispositivos que **ninguém renomeou.**

A WiGLE cataloga tudo. Inclusive aparelhos que saíram da caixa, foram ligados, e permanecem com o SSID de fábrica. Impressoras. Roteadores. Smart TVs. Chromecasts. Cada um deles é um dispositivo identificável — e muitos têm vulnerabilidades conhecidas.

Agora a pergunta não é "o que o Mercado Livre tem". É "o que existe **no mesmo prédio** que o Mercado Livre". Geofence de 200 metros em cada AP que mapeamos:

| Local | HP Printer | HP Diret | NETGEAR | TP-LINK | Chromecast |
|-------|-----------|---------|---------|---------|------------|
| CORP Alphaville (Al. Rio Negro 111) | 17 | 17 | 1 | 11 | 1 |
| CORP Alphaville (Rod. Castelo) | 4 | 3 | 0 | 2 | 0 |
| CD AP34 (Est. Sendas) | 0 | 4 | 0 | 3 | 0 |
| CD APs 19/22/26/28 | 0 | 0 | 0 | 0 | 0 |
| ACT Av. Paulista 1000 | 0 | 0 | 0 | 0 | 0 |

Os APs do CD capturados na beira da rodovia (Dutra, Matriz, Viaduto) não têm nada em 200 m — sinal fraco de wardriving de carro, longe dos prédios. Mas o escritório corporativo em Alphaville: **17 impressoras HP, 11 roteadores TP-LINK e 1 Chromecast a 200 metros da porta.**

| CVE | Dispositivo | CVSS |
|-----|------------|------|
| [CVE-2022-28722](https://nvd.nist.gov/vuln/detail/CVE-2022-28722) | HP OfficeJet — RCE | 9.8 |
| [CVE-2023-1707](https://nvd.nist.gov/vuln/detail/CVE-2023-1707) | HP LaserJet — RCE | 9.8 |
| [CVE-2021-34916](https://nvd.nist.gov/vuln/detail/CVE-2021-34916) | NETGEAR router — RCE | 9.8 |
| [CVE-2023-1389](https://nvd.nist.gov/vuln/detail/CVE-2023-1389) | TP-LINK router — RCE | 8.8 |
| [CVE-2023-31272](https://nvd.nist.gov/vuln/detail/CVE-2023-31272) | Xerox printer | 9.1 |
| [CVE-2023-35318](https://nvd.nist.gov/vuln/detail/CVE-2023-35318) | Chromecast | 5.4 |

Esses dispositivos não são do Mercado Livre. São das empresas vizinhas. Dos apartamentos em volta. Dos escritórios no mesmo prédio. Mas estão no mesmo ar. E a WiGLE te dá a localização de cada um. O NVD te dá o exploit.

---

## V-D. A Camada Invisível: Bluetooth

Até agora falamos de WiFi. Mas a WiGLE também cataloga dispositivos Bluetooth — e a camada BLE revela coisas que o WiFi esconde.

O centro de distribuição em São João de Meriti tem 78 mil dispositivos BLE no raio de 3 km. A Avenida Paulista tem 188 mil em 1 km². A diferença não está na quantidade — está no **tipo** de dispositivo.

### O CD: Frota, Scanners, Refrigeração

Na zona industrial de São João de Meriti, os dispositivos BLE com nome contam uma história de operação logística:

| Categoria | Dispositivo | Quantidade | O que revela |
|-----------|------------|-----------|-------------|
| Scanners | `P71_*` (Zebra handheld) | 11 | Tamanho da equipe de picking |
| Scanners | `PH320` | 1 | Dispositivo isolado ou supervisor |
| Scanners | `TC506E-432S` | 1 | Outro modelo Zebra |
| HVAC | `Carel_0000010D61` | 1 | **Controlador de refrigeração/cold chain.** No Viaduto São João — exatamente onde estão os APs 26 e 27. |
| Veículos | VW Radio | 67 | Frota de entregas? VW Delivery/Constellation |
| Veículos | FIAT CONNECT | 29 | Veículos utilitários |
| Veículos | VolvoTrucks | 2 | Caminhões pesados |

O controlador Carel é o achado mais crítico. Carel fabrica controladores para câmaras frias, refrigeração industrial e cold chain. Um centro de distribuição do Mercado Livre que armazena alimentos perecíveis **precisa** de refrigeração. O controlador está transmitindo BLE com ID `0000010D61` — no mesmo viaduto onde os APs 26 e 27 foram capturados. Se esse modelo tem vulnerabilidade conhecida, você consegue mapear não só a localização do equipamento, mas potencialmente interferir na cadeia de frio.

E a frota de veículos: 67 VW, 29 FIAT, 2 VolvoTrucks. Caminhões e utilitários com infotainment broadcasting BLE. Cada um é um veículo que entra e sai do centro de distribuição. Padrão de frota de entregas.

---

## VI. A Assimetria

Há uma assimetria fundamental aqui. Corporações têm times de segurança, firewalls, SOC 24/7, orçamento de milhões. E ainda assim — três APs portáteis triangulados em 200m na Av. Paulista revelam a rotina de uma pessoa.

A WiGLE não discrimina. Ela cataloga a rede do banco e a rede da padaria. Do data center e da escola. Do hospital e do shopping. A mesma API. A mesma chave gratuita.

O que isso significa:

- **Transparência involuntária.** A infraestrutura física de qualquer organização que tem WiFi está mapeada. Com coordenadas. Com nome. Com status de segurança.
- **O SSID padrão é um CVE público.** `HP-Print-30-Officejet Pro 8610` não é só um nome — é um modelo. E cada modelo tem um histórico de CVEs. A WiGLE te dá a localização do dispositivo. O NVD te dá o exploit.
- **Responsabilidade assimétrica.** A empresa é responsável por proteger seus dados. Mas a ferramenta para verificar se ela está fazendo isso está disponível para qualquer pessoa. De graça.
- **O bug bounty do avesso.** Você não precisa achar uma vulnerabilidade no código. Precisa achar o dispositivo que ninguém configurou.

---

## VII. O Que Fazer Com Isso

Você pode usar essa informação de várias maneiras.

Pode verificar a empresa onde você trabalha. `wifiSearch({ ssidlike: '%NomeDaEmpresa%' })`. Se aparecer `encryption: none`, você acabou de encontrar um incidente de segurança. Antes do atacante.

Pode verificar a escola dos seus filhos. O hospital da sua cidade. O banco onde você tem conta. A informação está lá.

Pode documentar. Transparência é Defesa. O que está documentado não pode ser varrido para debaixo do tapete com um "lamentamos profundamente."

Pode ensinar. Compartilhe o método, não o alvo.

```js
import { createWiGLE } from 'wigle-sdk';
const w = createWiGLE(SUA_API_NAME, SEU_API_TOKEN);

// Busca rápida por SSID
const r = await w.wifiSearch({ ssidlike: '%QualquerNome%' });
for (const ap of r.results) {
  const alerta = ap.encryption === 'none' ? ' ABERTO!' : '';
  console.log(`${ap.ssid} | ${ap.city} | ${ap.encryption}${alerta}`);
}

// Top 5 marcas de roteador no Brasil (via CSV local + WiGLE API)
const { top } = await w.getTopManufacturers(5);
// [{name:"Cisco", count:48608613}, ...]

// Stats do Brasil: 34.5M observações WiFi, #8 global
const br = (await w.getCountryStats()).countries.find(c => c.country === 'BR');
// { country: "BR", wifiCount: 34473004, btCount: 43839731, cellCount: 531585 }

// SSIDs mais comuns globalmente
const { top: popular } = await w.getSSIDStats(5);
// xfinitywifi 27M, XFINITY 10M, Spectrum Mobile 7M...
```

Trinta segundos. Uma API key gratuita. Um terminal.

O que você faz com essa informação é com você.

---

**wiGLE SDK**: [npm](https://www.npmjs.com/package/wigle-sdk) · [GitHub](https://github.com/gutem/wigle-sdk) \
**SDK API**: `wifiSearch`, `wifiSearchByCountry`, `wifiSearchAll`, `wifiDetail`, `getTopManufacturers`, `getSSIDStats`, `getEncryptionStats`, `getCountryStats`, `btSearch`, `btSearchByBounds`, `cellSearch`, `wifiDensity`, `geocode` \
**WiGLE**: [wigle.net](https://wigle.net) \
**Mapa KML**: [wigle-mercadolivre.kml](/assets/wigle-mercadolivre.kml) (abrir no Google Earth)

**Mapas (Google Maps):**
- [CORP Alphaville — Al. Rio Negro 111](https://www.google.com/maps?q=-23.5039,-46.8476&z=18)
- [CORP Alphaville — Rod. Castelo Branco](https://www.google.com/maps?q=-23.5060,-46.8456&z=18)
- [CD — Viaduto S.João (APs 26+27 + Carel HVAC)](https://www.google.com/maps?q=-22.8000,-43.3538&z=18)
- [CD — Est. Arthur Sendas (AP34)](https://www.google.com/maps?q=-22.8001,-43.3455&z=18)
- [CD — Rod. Dutra (AP22)](https://www.google.com/maps?q=-22.7960,-43.3614&z=18)
- [CD — R. da Matriz (AP28)](https://www.google.com/maps?q=-22.7860,-43.3830&z=18)
- [ACT — Av. Paulista 1000](https://www.google.com/maps?q=-23.5649,-46.6520&z=18)
- [ACT — Shopping Cidade SP](https://www.google.com/maps?q=-23.5641,-46.6529&z=18)
- [ACT — Al. Santos 1086](https://www.google.com/maps?q=-23.5658,-46.6533&z=18)
- [Oficina MercadoLibre — Floresta, Buenos Aires](https://www.google.com/maps?q=-34.6245,-58.4829&z=18)

*Publicado em junho de 2026. Todos os dados são reais, obtidos via WiGLE API pública. 79 Access Points do Mercado Livre no Brasil, 92 MercadoLibre em 7 países da América Latina. Inclui 3 APs de dispositivo portátil com SSID `ACT-MERCADOLIVRE` (Agência de Correios e Telégrafos) triangulados na Av. Paulista — MACs sequenciais localmente administrados, observações únicas entre ago/2025 e jan/2026.*

*Este texto é um "Exercício de Criatividade" que usa dados reais como base da sua "Contação de História". Qualquer semelhança com [Deviant Ollam](https://deviating.net/) ou com a "[Vida Real](https://www.youtube.com/shorts/2QKDfb4kBpU)" é mera XNOR (ou fnord).*
