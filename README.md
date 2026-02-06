# Sistema Ax Festas

Sistema de controle de estoque, reservas e manutenção para Ax Festas - Aluguel de Itens para Festas.

## 🚀 Tecnologias

- **Next.js 14** - Framework React com App Router
- **TypeScript** - Tipagem estática
- **Tailwind CSS** - Estilização
- **Cloudflare Pages** - Hospedagem e deployment
- **Airtable** - Banco de dados e gestão de conteúdo

## 📋 Pré-requisitos

- Node.js 18 ou superior
- npm ou yarn
- Conta Cloudflare (para deployment)

## 🛠️ Instalação

```bash
# Instalar dependências
npm install
```

## 💻 Desenvolvimento

```bash
# Iniciar servidor de desenvolvimento
npm run dev
```

O aplicativo estará disponível em `http://localhost:3000`

## 🏗️ Build

```bash
# Gerar build de produção
npm run build
```

O build estático será gerado na pasta `out/`

## 🌐 Deploy no Cloudflare Pages

> **⚠️ Problema com API Token?** Veja o [Guia Rápido de Configuração](./CLOUDFLARE_TOKEN_SETUP.md) para resolver erros de autenticação.

### Método 1: Via Cloudflare Dashboard (Recomendado)

1. Acesse o [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Vá para **Pages** > **Create a project**
3. Conecte seu repositório GitHub
4. Configure:
   - **Build command**: `npm run build`
   - **Build output directory**: `out`
   - **Environment variables**: `NODE_VERSION = 18`
5. Clique em **Save and Deploy**

### Método 2: Via Wrangler CLI

**Importante**: Você precisa de um API Token com permissão "Cloudflare Pages - Edit". [Veja como configurar →](./CLOUDFLARE_TOKEN_SETUP.md)

```bash
# Instalar Wrangler (se ainda não tiver)
npm install -g wrangler

# Configurar API Token
export CLOUDFLARE_API_TOKEN="seu-token-aqui"
export CLOUDFLARE_ACCOUNT_ID="a39b043a2df362f77fc72e76b286e00c"

# Deploy
npm run pages:deploy
```

**Documentação Completa**: Veja [DEPLOY.md](./DEPLOY.md) para instruções detalhadas.

## 📁 Estrutura do Projeto

```
sistema.ax/
├── src/
│   ├── app/                    # Páginas Next.js (App Router)
│   │   ├── admin/             # Painel administrativo
│   │   │   ├── finance/       # Controle financeiro
│   │   │   ├── inventory/     # Controle de estoque
│   │   │   ├── maintenance/   # Controle de manutenção
│   │   │   └── reservations/  # Gerenciamento de reservas
│   │   ├── catalog/           # Catálogo público de itens
│   │   ├── layout.tsx         # Layout raiz
│   │   └── page.tsx           # Página inicial
│   └── lib/                    # Bibliotecas e utilitários
│       ├── db.ts              # Funções de banco de dados (D1)
│       └── storage.ts         # Funções de armazenamento (R2)
├── prisma/                     # Schema do Prisma (opcional)
├── schema.sql                  # Schema SQL para D1
├── next.config.js             # Configuração Next.js
├── wrangler.toml              # Configuração Cloudflare
└── package.json
```

## 🗄️ Banco de Dados

### Opção 1: Airtable (Recomendado)

O projeto agora suporta integração com Airtable! Para configurar:

1. **Veja o guia completo**: [AIRTABLE_SETUP.md](./AIRTABLE_SETUP.md)
2. Configure suas credenciais no `.env.local`
3. Use as APIs em `/functions/api/` para acessar os dados

**Vantagens do Airtable:**
- ✅ Interface visual para gerenciar dados
- ✅ Fácil de configurar e usar
- ✅ Colaboração em tempo real
- ✅ Views, filtros e ordenação nativos
- ✅ Não precisa de SQL

### Opção 2: Cloudflare D1 (SQLite serverless)

Alternativa para usar banco de dados SQL:

1. Crie um banco D1 no Cloudflare Dashboard
2. Execute o schema SQL:
```bash
wrangler d1 execute YOUR_DATABASE_NAME --file=./schema.sql
```
3. Configure a binding no `wrangler.toml`:
```toml
[[d1_databases]]
binding = "DB"
database_name = "sistema-ax-festas"
database_id = "seu-database-id"
```

## 📦 Armazenamento (R2)

Para armazenar imagens e arquivos:

1. Crie um bucket R2 no Cloudflare Dashboard
2. Configure a binding no `wrangler.toml`:
```toml
[[r2_buckets]]
binding = "STORAGE"
bucket_name = "sistema-ax-festas"
```

## ⚠️ Importante

- Este projeto usa **static export** do Next.js, o que significa que todas as páginas são pré-renderizadas como HTML
- Funcionalidades de servidor (D1, R2) só funcionam via **Cloudflare Pages Functions** (arquivos em `/functions`)
- Para usar banco de dados e storage, será necessário criar Pages Functions para APIs

## 📝 Funcionalidades

- ✅ Página inicial
- ✅ Catálogo de itens
- ✅ Painel administrativo
- ✅ Controle de estoque
- ✅ Gerenciamento de reservas
- ✅ Controle de manutenção
- ✅ Controle financeiro

## 🔧 Próximos Passos

1. Implementar Pages Functions para APIs
2. Conectar com D1 Database
3. Implementar upload de imagens no R2
4. Adicionar autenticação
5. Implementar CRUD completo para todas as entidades

## 📄 Licença

Projeto privado - Ax Festas
