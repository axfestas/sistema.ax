# Cloudflare - configuração para Ax Festas

Este documento orienta sobre como conectar o repositório ao **Cloudflare Pages** e preparar o deploy automático.

## Requisitos
- Conta Cloudflare com permissão para criar Pages projects
- Token de API com escopo `Pages` (Create / Deploy)
- `CF_PAGES_API_TOKEN`, `CF_ACCOUNT_ID`, `CF_PAGES_PROJECT_NAME` adicionados como Secrets no GitHub

## Passos (resumo)
1. No GitHub, vá em Settings → Secrets and variables → Actions e crie os secrets:
   - `CF_PAGES_API_TOKEN` = token criado no painel Cloudflare
   - `CF_ACCOUNT_ID` = seu Cloudflare Account ID
   - `CF_PAGES_PROJECT_NAME` = nome do projeto (ex.: `axfestas-pages`)

2. No painel do Cloudflare Pages, crie um novo projeto e conecte ao repositório `axfestas/sistema.ax` (ou permita que o workflow faça o deploy automático usando a action já no repo).

3. Build command (usamos export estático por ora):
   - Build command: `npm run build:export`
   - Root/Publish directory: `./apps/frontend/out`

4. Variáveis de ambiente (adicionar no painel do Pages se precisar):
   - `NEXT_PUBLIC_API_URL` — URL pública do seu backend (Workers ou URL externa)
   - `NODE_ENV=production`

## Observações
- Para projetos Next.js com SSR/Edge Functions, considere usar Cloudflare Workers (ou Pages + Functions) no futuro.
- Para upload de imagens use Cloudflare R2 e configure permissões de upload via Workers.
- Se preferir deploy via painel (GUI), ainda é necessário configurar as mesmas variáveis e o comando de build.

## Deploy manual via GitHub Action
Há uma workflow em `.github/workflows/pages-deploy.yml` que executa `npm ci`, `npm run build && npm run export` e usa `cloudflare/pages-action@v1` para publicar o conteúdo de `apps/frontend/out`.
