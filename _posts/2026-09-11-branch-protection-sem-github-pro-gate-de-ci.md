---
layout: post
title: "Protegendo a main sem pagar GitHub Pro: o gate de CI que bloqueia push direto"
date: 2026-09-11 00:00:00
categories: [dev, devops, git]
tags: [github, gitflow, ci, branch-protection, github-actions, gitea]
description: "O GitHub cobra Pro para proteger branch em repositório privado. Antes de pagar, existe um caminho: um job de CI que reprova qualquer push direto na main que não seja promoção via PR. Funciona como um alarme de porta — não como uma fechadura. Aqui está como, quando usar e quando não usar."
---

Semana passada eu estava arrumando o fluxo de deploy de um projeto — o [Atti](https://atti.ia.br), uma ferramenta de auditoria jurídica que roda em produção com clientes pagantes. O modelo combinado era o clássico:

- `main` = produção. Protegida. Só aceita **promoção** via PR.
- `develop` = staging. Todo merge deploya sozinho.
- `feat/` e `fix/` saem de `develop` e voltam por PR.

Aí veio a parte do "protegida". Achei que era um clique no GitHub. Não é.

## O 403 que começa a história

```text
{
  "message": "Upgrade to GitHub Pro or make this repository public
   to enable this feature.",
  "status": "403"
}
```

Traduzindo: **branch protection (rulesets e status checks obrigatórios) não existe para repositório privado no plano grátis**. O GitHub quer US$ 4/mês — ou que o código vá a público. Para um sistema que processa processos judiciais de terceiros, "tornar público" está fora de questão. E pagar Pro para uma feature, quando o resto do plano grátis me serve, me incomodou o suficiente para procurar outro caminho.

O requisito era simples: **impedir que um `git push` direto na `main` entre sem passar por PR**. O bloqueio não precisa ser físico — precisa ser *vergonhoso* o suficiente para nunca acontecer duas vezes.

## O gate de CI

O GitHub Actions entrega de graça, em todo evento de `push`, o commit que chegou:

```text
github.event.head_commit.message
```

E aqui está o detalhe que resolve o problema: **todo merge de PR feito pela interface do GitHub produz um commit cuja mensagem começa com `Merge pull request`**. Um push direto, não — ele carrega a mensagem do commit original.

Então o "bypass" inteiro é um job de 15 linhas:

```yaml
# .github/workflows/ci.yml
name: Guard

on:
  push:
    branches: [main]

jobs:
  bloquear_push_direto:
    runs-on: ubuntu-latest
    steps:
      - name: Exigir promoção via PR
        run: |
          MSG="${{ github.event.head_commit.message }}"
          case "$MSG" in
            "Merge pull request"*)
              echo "Promoção via PR — ok."
              ;;
            *)
              echo "::error::PUSH DIRETO em main é proibido."
              echo "::error::main só aceita promoção via PR a partir de develop."
              exit 1
              ;;
          esac
```

Quem tentar `git push origin main` vê o job ficar **vermelho** na cara, com mensagem explícita, em segundos. O time inteiro percebe. E o costume de "empurrar pra main porque tava com pressa" morre na primeira semana.

## O caso do squash

O check acima assume merge commit. Se o seu time usa **squash merge**, a mensagem do commit na `main` vira o título do PR, seguido de `(#123)`. O prefixo `Merge pull request` não existe mais — e o gate passaria a reprovar até as promoções legítimas.

A versão robusta, que funciona com qualquer método de merge, é perguntar para a API: *este commit pertence a algum PR mergeado?*

```yaml
      - name: Commit pertence a um PR?
        run: |
          # retorna [] para push direto; retorna o PR quando é merge
          PRS=$(gh api "repos/${{ github.repository }}/commits/${{ github.sha }}/pulls" \
            -H "Accept: application/vnd.github+json" --jq 'length')
          if [ "$PRS" = "0" ]; then
            echo "::error::Push direto na main. Use promoção via PR."
            exit 1
          fi
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

O endpoint `commits/{sha}/pulls` associa o commit aos PRs mergeados que o contêm. Push direto → lista vazia → vermelho. Merge, squash ou rebase → passa. É o gate que uso em produção.

## O que esse "bypass" NÃO faz

Honestidade de quem roda isso em produção:

1. **Não é uma fechadura — é um alarme.** O commit do push direto *entra* na `main`. O job fica vermelho, mas o código está lá. Proteção nativa impede o push; gate de CI apenas denuncia. Se o seu modelo de ameaça é "alguém mal-intencionado com write access na main", isso não resolve.

2. **Sem status checks obrigatórios, o botão de merge do PR não fica bloqueado.** Um PR quebrado pode ser mergeado se alguém ignorar o CI. A disciplina continua sendo a camada final.

3. **Proteção nativa exige Pro.** Isso é um *workaround* de plano grátis, não uma reimplementação. Se um dia o repo crescer, pague os US$ 4 e ative a coisa de verdade.

Quer endurecer? Dá para botar um bot que escuta o push na `main`, aplica o mesmo teste e, no push direto, **abre uma issue + cria um revert automático**. Aí sim vira enforcement: o commit entra e sai na sequência, com registro público. Eu não fui tão longe — o alarme resolveu.

## Alternativas reais (sem gambiarra)

- **Gitea**: proteção de branch nativa, grátis, self-hosted. Se você já vive no Tailscale/homelab, é a resposta certa — e foi para onde eu empurrei o problema original depois.
- **GitHub Pro**: US$ 4/mês, rulesets de verdade.
- **Repo público**: só se o código for público mesmo.

## TL;DR

| | Proteção nativa | Gate de CI |
|---|---|---|
| Custo | GitHub Pro (privado) | Grátis |
| Bloqueia o push? | Sim | Não — denuncia |
| Funciona com squash/rebase? | Sim | Sim (via `commits/{sha}/pulls`) |
| Setup | UI/API | 15 linhas de YAML |

A lição que fica: **o plano grátis do GitHub vende o cadeado, mas não a porta**. O gate de CI é um alarme bom o suficiente para times que confiam uns nos outros — e um lembrete de que, no fim, ferramenta nenhuma substitui a combinação de fluxo definido + vergonha pública do CI vermelho.
