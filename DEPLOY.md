# Guia de Deploy - Cloudflare Pages

Este guia detalha como fazer o deploy do Sistema Ax Festas no Cloudflare Pages.

## 📋 Pré-requisitos

- Conta no Cloudflare (gratuita)
- Repositório GitHub com o código
- Node.js 18+ instalado localmente (para testes)

## 🚀 Método 1: Deploy via Dashboard (Recomendado)

### Passo 1: Conectar Repositório

1. Acesse [https://dash.cloudflare.com](https://dash.cloudflare.com)
2. No menu lateral, clique em **Workers & Pages**
3. Clique em **Create Application**
4. Selecione a aba **Pages**
5. Clique em **Connect to Git**
6. Autorize o Cloudflare a acessar seu GitHub
7. Selecione o repositório `sistema.ax`

### Passo 2: Configurar Build

Configure as seguintes opções:

- **Project name**: `sistema-ax-festas` (ou nome de sua preferência)
- **Production branch**: `main` (ou sua branch principal)
- **Framework preset**: `Next.js (Static HTML Export)`
- **Build command**: `npm run build`
- **Build output directory**: `out`

### Passo 3: Variáveis de Ambiente

Clique em **Add environment variable** e adicione:

```
NODE_VERSION = 18
```

### Passo 4: Deploy

1. Clique em **Save and Deploy**
2. Aguarde o build completar (leva ~2-3 minutos)
3. Seu site estará disponível em `https://sistema-ax-festas.pages.dev`

## 🔧 Método 2: Deploy via Wrangler CLI

### Instalação do Wrangler

```bash
npm install -g wrangler
```

### Login no Cloudflare

```bash
wrangler login
```

### Build Local

```bash
npm install
npm run build
```

### Deploy

```bash
wrangler pages deploy out --project-name=sistema-ax-festas
```

## 🗄️ Configuração do Banco de Dados D1

### 1. Criar Banco D1

```bash
# Via CLI
wrangler d1 create sistema-ax-festas

# Anote o database_id retornado
```

### 2. Executar Schema

```bash
wrangler d1 execute sistema-ax-festas --file=./schema.sql
```

### 3. Configurar Binding

No arquivo `wrangler.toml`, adicione:

```toml
[[d1_databases]]
binding = "DB"
database_name = "sistema-ax-festas"
database_id = "SEU_DATABASE_ID_AQUI"
```

### 4. Redeploy

```bash
npm run build
wrangler pages deploy out --project-name=sistema-ax-festas
```

## 📦 Configuração do Storage R2

### 1. Criar Bucket R2

```bash
# Via CLI
wrangler r2 bucket create sistema-ax-festas-storage
```

Ou pelo Dashboard:
1. Vá para **R2** no menu lateral
2. Clique em **Create bucket**
3. Nome: `sistema-ax-festas-storage`

### 2. Configurar Binding

No arquivo `wrangler.toml`, adicione:

```toml
[[r2_buckets]]
binding = "STORAGE"
bucket_name = "sistema-ax-festas-storage"
```

### 3. Redeploy

```bash
npm run build
wrangler pages deploy out --project-name=sistema-ax-festas
```

## 🌐 Configuração de Domínio Customizado

### Via Dashboard

1. Vá para seu projeto no Cloudflare Pages
2. Clique na aba **Custom domains**
3. Clique em **Set up a custom domain**
4. Digite seu domínio (ex: `sistema.ax`)
5. Siga as instruções para atualizar os DNS

### Domínios Sugeridos

- Produção: `sistema.ax` ou `www.sistema.ax`
- Staging: `staging.sistema.ax`

## 🔐 Variáveis de Ambiente

Para adicionar mais variáveis de ambiente:

### Via Dashboard

1. Vá para **Settings** > **Environment variables**
2. Adicione as variáveis necessárias
3. Separe por ambiente (Production/Preview)

### Via Wrangler

Edite `wrangler.toml`:

```toml
[vars]
NODE_VERSION = "18"
NEXT_PUBLIC_API_URL = "https://api.sistema.ax"
```

## 🔄 Deploys Automáticos

O Cloudflare Pages faz deploy automático quando você:

- Faz push para a branch principal → Deploy em produção
- Abre um Pull Request → Deploy de preview
- Faz push em outras branches → Deploy de preview

Cada PR terá uma URL única tipo:
`https://abc123.sistema-ax-festas.pages.dev`

## 📊 Monitoramento

### Logs e Analytics

1. Vá para seu projeto no Dashboard
2. Aba **Analytics** - métricas de tráfego
3. Aba **Deployments** - histórico de deploys
4. Aba **Functions** - logs de API (se usar)

## ⚠️ Troubleshooting

### Build Falha

**Erro**: `Cannot find module 'next'`
- **Solução**: Verifique se `package.json` está commitado

**Erro**: `Failed to fetch font from Google Fonts`
- **Solução**: Já corrigido! Usamos font-sans do Tailwind

**Erro**: `Output directory 'out' not found`
- **Solução**: Verifique se `next.config.js` tem `output: 'export'`

### Build Lento

- Builds normalmente levam 2-3 minutos
- Use cache de build (automático no Cloudflare)
- Reduza dependências desnecessárias

### Páginas 404

- Verifique se todas as rotas foram exportadas corretamente
- Rode `npm run build` localmente e verifique pasta `out/`
- Certifique-se que `pages_build_output_dir = "out"` no `wrangler.toml`

## 🎯 Próximos Passos

1. **Implementar Pages Functions** para APIs dinâmicas
2. **Configurar D1** para persistência de dados
3. **Configurar R2** para upload de imagens
4. **Adicionar autenticação** (Cloudflare Access ou custom)
5. **Configurar domínio** customizado

## 📚 Recursos Úteis

- [Documentação Cloudflare Pages](https://developers.cloudflare.com/pages/)
- [Next.js Static Export](https://nextjs.org/docs/app/building-your-application/deploying/static-exports)
- [Cloudflare D1](https://developers.cloudflare.com/d1/)
- [Cloudflare R2](https://developers.cloudflare.com/r2/)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/)

## 💡 Dicas

- Use **Preview Deployments** para testar mudanças
- Configure **Branch Deployments** para staging
- Ative **Web Analytics** gratuitamente
- Use **Edge Cache** para melhor performance
- Configure **Custom Headers** se necessário

## 🆘 Suporte

Se encontrar problemas:

1. Verifique os logs de build no Dashboard
2. Teste o build localmente: `npm run build`
3. Consulte a documentação do Cloudflare
4. Abra uma issue no repositório
