# GitHub Workflows

Este diretório contém os workflows do GitHub Actions para CI/CD.

## Workflows Ativos

### ci.yml
- **Trigger**: Push e Pull Request para `main`
- **Função**: Validação de build e testes
- **Features**:
  - Verifica se package.json existe antes de rodar npm
  - Instala dependências com `npm ci`
  - Executa build se disponível
  - Executa testes se disponíveis

### pages-deploy.yml
- **Trigger**: Push para `main`
- **Função**: Deploy do Next.js para Cloudflare Pages
- **Features**:
  - Build do projeto Next.js
  - Deploy automático para Cloudflare Pages
  - Requer secrets: `CF_PAGES_API_TOKEN`, `CF_ACCOUNT_ID`, `CF_PAGES_PROJECT_NAME`

## Workflows Desabilitados

### workers-deploy.yml.disabled
- Workflow para Cloudflare Workers (não aplicável a este projeto)
- Este projeto usa Cloudflare Pages, não Workers

### deploy-wrangler.yml.disabled
- Workflow alternativo para Workers (não aplicável)
- Este projeto usa Cloudflare Pages com Pages Functions

## Estrutura do Projeto

Este é um projeto **Next.js** com:
- Static export para Cloudflare Pages (`/out`)
- Cloudflare Pages Functions para APIs (`/functions`)
- Integração com Airtable para dados

Para mais informações sobre deploy, veja:
- [DEPLOY.md](../../DEPLOY.md)
- [AIRTABLE_SETUP.md](../../AIRTABLE_SETUP.md)
