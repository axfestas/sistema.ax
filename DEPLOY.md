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
- **Build command**: `npm install && npm run build`
- **Build output directory**: `out`

⚠️ **IMPORTANTE**: O comando `npm install && npm run build` é necessário para que as Pages Functions possam usar pacotes npm como 'airtable'. Se você usar apenas `npm run build`, as Functions não conseguirão resolver as dependências.

### Passo 3: Variáveis de Ambiente

Clique em **Add environment variable** e adicione:

```
NODE_VERSION = 18
```

### Passo 4: Deploy

1. Clique em **Save and Deploy**
2. Aguarde o build completar (leva ~2-3 minutos)
3. Seu site estará disponível em `https://sistema-ax-festas.pages.dev`

### ⚠️ Importante: Configuração do wrangler.toml

O arquivo `wrangler.toml` **NÃO** deve conter uma seção `[build]` para projetos Pages. Essa seção é apenas para Workers.

**❌ Incorreto (causa erro):**
```toml
[build]
command = "npm run build"
```

**✅ Correto:**
```toml
name = "sistema-ax-festas"
pages_build_output_dir = "out"

[vars]
NODE_VERSION = "18"
```

O comando de build deve ser configurado **apenas no Dashboard do Cloudflare** (conforme Passo 2 acima) ou via GitHub Actions (ver mais abaixo).

## 🔧 Método 2: Deploy via Wrangler CLI

### Instalação do Wrangler

```bash
npm install -g wrangler
```

### Configuração do API Token (IMPORTANTE)

Para usar o Wrangler CLI ou CI/CD, você precisa criar um API Token com as permissões corretas.

#### Passo 1: Criar API Token

1. Acesse [https://dash.cloudflare.com/profile/api-tokens](https://dash.cloudflare.com/profile/api-tokens)
2. Clique em **Create Token**
3. Clique em **Use template** ao lado de **Custom token** (ou role até o final e clique em **Create Custom Token**)

#### Passo 2: Configurar Permissões

Configure as seguintes permissões:

**Permissions:**
- **Account** → **Cloudflare Pages** → **Edit**

**Account Resources:**
- Include → **Specific account** → Selecione sua conta (ex: Ax Festas)

#### Passo 3: Finalizar

1. Clique em **Continue to summary**
2. Revise as permissões
3. Clique em **Create Token**
4. **IMPORTANTE**: Copie o token imediatamente e guarde em um local seguro (você não poderá vê-lo novamente!)

#### Passo 4: Configurar o Token

**Opção A: Variável de Ambiente (Recomendado)**

```bash
export CLOUDFLARE_API_TOKEN="seu-token-aqui"
export CLOUDFLARE_ACCOUNT_ID="a39b043a2df362f77fc72e76b286e00c"
```

Adicione ao seu `.bashrc` ou `.zshrc` para tornar permanente:

```bash
echo 'export CLOUDFLARE_API_TOKEN="seu-token-aqui"' >> ~/.bashrc
echo 'export CLOUDFLARE_ACCOUNT_ID="a39b043a2df362f77fc72e76b286e00c"' >> ~/.bashrc
source ~/.bashrc
```

**Opção B: Login Interativo**

```bash
wrangler login
```

**Nota**: O login interativo pode não funcionar em ambientes de CI/CD. Use a Opção A para automação.

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

### ⚠️ CRÍTICO: Este passo é OBRIGATÓRIO antes do primeiro uso!

**Sem executar estes passos, o sistema vai falhar com erro "no such table: users"**

### 1. Criar Banco D1

```bash
# Via CLI
wrangler d1 create sistema

# Anote o database_id retornado
```

### 2. Executar Schema (OBRIGATÓRIO!)

**Opção A: Usando script automatizado (Recomendado)**

```bash
npm run db:init
```

Este script irá:
- ✅ Verificar se o banco existe
- ✅ Aplicar o schema completo
- ✅ Criar todas as tabelas necessárias
- ✅ Criar usuário admin padrão
- ✅ Inserir dados iniciais

**Opção B: Manualmente**

```bash
wrangler d1 execute sistema --file=./schema.sql
```

### 3. Verificar Inicialização

Confirme que as tabelas foram criadas:

```bash
npm run db:check
```

Ou manualmente:

```bash
wrangler d1 execute sistema --command="SELECT name FROM sqlite_master WHERE type='table';"
```

Você deve ver 8 tabelas:
- users
- sessions
- items
- reservations
- maintenance
- financial_records
- portfolio_images
- site_settings

### 4. Configurar Binding

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

## 📦 Configuração do Storage R2 (OBRIGATÓRIO!)

### ⚠️ CRÍTICO: Criar Bucket ANTES do Deploy!

**O deploy falhará se o bucket R2 não existir!** Você DEVE criar o bucket antes de fazer deploy.

### 1. Criar Bucket R2

**Nome do bucket:** `sistema-ax-festas` (conforme wrangler.toml)

#### Via CLI (Recomendado)

```bash
# Criar bucket
wrangler r2 bucket create sistema-ax-festas

# Verificar se foi criado
wrangler r2 bucket list
```

#### Via Dashboard

1. Acesse [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Vá para **R2** no menu lateral
3. Clique em **Create bucket**
4. Nome: `sistema-ax-festas` (exatamente este nome!)
5. Clique em **Create bucket**

### 2. Verificar Binding

O binding já está configurado em `wrangler.toml`:

```toml
[[r2_buckets]]
binding = "STORAGE"
bucket_name = "sistema-ax-festas"
```

**Importante:** NÃO mude o nome do bucket sem atualizar o wrangler.toml!

### 3. Configurar Acesso Público (Opcional)

Para permitir acesso público aos arquivos:

1. No Dashboard, vá para **R2** > `sistema-ax-festas`
2. Vá para a aba **Settings**
3. Em **Public Access**, clique em **Allow Access**
4. Um domínio público será gerado (ex: pub-xxxxx.r2.dev)

### 4. Deploy

Após criar o bucket, o deploy funcionará normalmente:

```bash
npm run build
npm run pages:deploy
# Ou simplesmente git push (se configurado no GitHub)
```

### 🚨 Erro: "Failed to publish your Function"

Se você ver este erro durante o deploy:
```
Error: Failed to publish your Function. Got error: Unknown internal error occurred.
```

**Causa:** O bucket R2 não existe!

**Solução:** Veja [R2_DEPLOY_FIX.md](./R2_DEPLOY_FIX.md) para instruções detalhadas.

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

### Via Cloudflare Dashboard (Recomendado)

O Cloudflare Pages faz deploy automático quando você conecta seu repositório GitHub:

- Faz push para a branch principal → Deploy em produção
- Abre um Pull Request → Deploy de preview
- Faz push em outras branches → Deploy de preview

Cada PR terá uma URL única tipo:
`https://abc123.sistema-ax-festas.pages.dev`

### Via GitHub Actions (Opcional)

Para ter mais controle sobre o processo de deploy, você pode usar GitHub Actions com Wrangler.

#### Passo 1: Adicionar Secrets ao GitHub

1. Vá para seu repositório no GitHub
2. Clique em **Settings** → **Secrets and variables** → **Actions**
3. Clique em **New repository secret**
4. Adicione os seguintes secrets:

   - **Nome**: `CLOUDFLARE_API_TOKEN`
   - **Valor**: Seu API token com permissão "Cloudflare Pages - Edit"
   
   - **Nome**: `CLOUDFLARE_ACCOUNT_ID`
   - **Valor**: `a39b043a2df362f77fc72e76b286e00c`

#### Passo 2: Criar Workflow

Crie o arquivo `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Cloudflare Pages

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      deployments: write
    name: Deploy to Cloudflare Pages
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build

      - name: Deploy to Cloudflare Pages
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          command: pages deploy out --project-name=sistema-ax-festas
```

#### Verificar Permissões do Token

Se você encontrar erros de autenticação no GitHub Actions, verifique:

1. Os secrets estão configurados corretamente
2. O API token tem a permissão "Cloudflare Pages - Edit"
3. O Account ID está correto
4. O nome do projeto (`sistema-ax-festas`) está correto

## 📊 Monitoramento

### Logs e Analytics

1. Vá para seu projeto no Dashboard
2. Aba **Analytics** - métricas de tráfego
3. Aba **Deployments** - histórico de deploys
4. Aba **Functions** - logs de API (se usar)

## ⚠️ Troubleshooting

### Erro: "Configuration file does not support 'build'"

**Erro completo:**
```
✘ [ERROR] Running configuration file validation for Pages:
    - Configuration file for Pages projects does not support "build"
```

**Causa**: O arquivo `wrangler.toml` contém uma seção `[build]` que não é suportada para projetos Pages.

**Solução**:

1. **Remova a seção `[build]` do wrangler.toml**
   
   O `wrangler.toml` deve conter apenas:
   ```toml
   name = "sistema-ax-festas"
   compatibility_date = "2024-01-01"
   pages_build_output_dir = "out"
   
   [vars]
   NODE_VERSION = "18"
   ```

2. **Configure o build no Dashboard do Cloudflare**
   
   Vá para **Settings** → **Builds & deployments** e configure:
   - **Build command**: `npm run build`
   - **Build output directory**: `out`

**Importante**: A seção `[build]` é exclusiva para **Workers**, não para **Pages**. Pages usa configuração via Dashboard ou GitHub Actions.

### Erro: "Could not resolve 'airtable'" (Pages Functions)

**Erro completo:**
```
✘ [ERROR] Build failed with 1 error:
✘ [ERROR] Could not resolve "airtable"
    ../src/lib/airtable.ts:1:21:
    1 │ import Airtable from 'airtable';
```

**Causa**: As Pages Functions estão tentando usar pacotes npm (como 'airtable'), mas o processo de build não instalou as dependências antes de fazer o bundle das Functions.

**Solução**:

1. **Configure o build command correto no Dashboard do Cloudflare**
   
   Vá para **Settings** → **Builds & deployments** e configure:
   - **Build command**: `npm install && npm run build`
   - **Build output directory**: `out`
   
   ⚠️ **IMPORTANTE**: Use `npm install && npm run build` (não apenas `npm run build`). O `npm install` é necessário para que as Pages Functions possam resolver pacotes npm durante o bundle.

2. **Verifique o wrangler.toml**
   
   Certifique-se de que o arquivo contém a flag de compatibilidade Node.js:
   ```toml
   compatibility_flags = ["nodejs_compat"]
   ```
   
   Esta flag permite que as Pages Functions usem APIs e pacotes Node.js.

3. **Para deploy via GitHub Actions**
   
   O workflow já está configurado corretamente em `.github/workflows/pages-deploy.yml`:
   ```yaml
   - name: Install dependencies
     run: npm ci
   - name: Build
     run: npm run build
   ```

**Nota**: Este erro aparece apenas quando você faz deploy direto via Dashboard do Cloudflare. Deploys via GitHub Actions funcionam corretamente pois o workflow já inclui a instalação de dependências.

### Erro de Autenticação (Authentication error [code: 10000])

Este é o erro mais comum ao tentar fazer deploy com o Wrangler. Acontece quando o API Token não tem as permissões corretas.

**Erro completo:**
```
✘ [ERROR] A request to the Cloudflare API (/accounts/.../pages/projects/...) failed.
Authentication error [code: 10000]
```

**Causa**: O API Token não possui a permissão "Cloudflare Pages - Edit"

**Solução**:

1. **Verifique o Token Atual**
   ```bash
   wrangler whoami
   ```
   Isso mostrará suas permissões. Você deve ver "Cloudflare Pages - Edit" na lista.

2. **Crie um Novo Token com Permissões Corretas**
   - Acesse: [https://dash.cloudflare.com/profile/api-tokens](https://dash.cloudflare.com/profile/api-tokens)
   - Clique em **Create Token** → **Custom token**
   - Adicione permissão: **Account** → **Cloudflare Pages** → **Edit**
   - Em **Account Resources**: Selecione sua conta específica
   - Clique em **Create Token** e copie o token

3. **Configure o Novo Token**
   ```bash
   export CLOUDFLARE_API_TOKEN="seu-novo-token-aqui"
   export CLOUDFLARE_ACCOUNT_ID="a39b043a2df362f77fc72e76b286e00c"
   ```

4. **Teste o Deploy Novamente**
   ```bash
   npm run build
   wrangler pages deploy out --project-name=sistema-ax-festas
   ```

**Importante**: 
- ❌ Não use o "Global API Key" - ele não é adequado para Wrangler
- ❌ Não use tokens com apenas "Workers - Edit" - Pages precisa de permissão específica
- ✅ Use "Cloudflare Pages - Edit" ao nível da conta
- ✅ Para CI/CD, armazene como secrets: `CLOUDFLARE_API_TOKEN` e `CLOUDFLARE_ACCOUNT_ID`

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

### 🚨 Erro: "D1_ERROR: no such table: users"

**Este é o erro mais comum em produção!**

**Causa:** O banco de dados D1 existe mas o schema nunca foi aplicado.

**Solução Rápida:**

```bash
# Inicializar banco automaticamente
npm run db:init
```

Ou manualmente:

```bash
# Aplicar schema
wrangler d1 execute sistema --file=./schema.sql

# Verificar tabelas
wrangler d1 execute sistema --command="SELECT name FROM sqlite_master WHERE type='table';"
```

**Verificação:**
- Você deve ver 8 tabelas (users, sessions, items, etc.)
- Usuário admin deve existir: alex.fraga@axfestas.com.br

**Documentação completa:** Veja [DATABASE_INIT_FIX.md](./DATABASE_INIT_FIX.md)

### Erro: "Wrangler not found"

Instale globalmente:
```bash
npm install -g wrangler
```

Ou use npx:
```bash
npx wrangler d1 execute sistema --file=./schema.sql
```

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
