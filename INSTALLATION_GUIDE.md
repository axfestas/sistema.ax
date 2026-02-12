# 🚀 Guia de Instalação - Sistema Completo

Este guia detalha como executar a migração do banco de dados para adicionar as novas funcionalidades: **Clientes**, **Doces**, **Designs** e sistema de **Reservas Melhorado**.

## 📋 Pré-requisitos

- Acesso ao Console do Cloudflare D1
- Projeto configurado no Cloudflare Pages
- Wrangler CLI instalado (opcional, mas recomendado)

---

## 🗄️ Passo 1: Executar Migração do Banco de Dados

### Opção A: Via Console do Cloudflare

1. Acesse o [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Vá para **Workers & Pages** → Seu projeto → **D1 Database**
3. Selecione o banco de dados `sistema`
4. Clique em **Console**
5. **Copie e cole o SQL abaixo** no console e execute:

```sql
-- Tabela de Clientes
CREATE TABLE IF NOT EXISTS clients (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT NOT NULL,
  cpf TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  notes TEXT,
  is_active INTEGER DEFAULT 1,
  created_at INTEGER DEFAULT (strftime('%s', 'now'))
);

-- Tabela de Doces
CREATE TABLE IF NOT EXISTS sweets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  price REAL NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 0,
  image_url TEXT,
  category TEXT,
  is_active INTEGER DEFAULT 1,
  show_in_catalog INTEGER DEFAULT 1,
  created_at INTEGER DEFAULT (strftime('%s', 'now'))
);

-- Tabela de Design/Decoração
CREATE TABLE IF NOT EXISTS designs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  price REAL NOT NULL,
  image_url TEXT,
  category TEXT,
  is_active INTEGER DEFAULT 1,
  show_in_catalog INTEGER DEFAULT 1,
  created_at INTEGER DEFAULT (strftime('%s', 'now'))
);

-- Tabela de Itens da Reserva (relacionamento)
CREATE TABLE IF NOT EXISTS reservation_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  reservation_id INTEGER NOT NULL,
  item_type TEXT NOT NULL, -- 'item', 'kit', 'sweet', 'design'
  item_id INTEGER NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price REAL NOT NULL,
  subtotal REAL NOT NULL,
  FOREIGN KEY (reservation_id) REFERENCES reservations(id) ON DELETE CASCADE
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_clients_phone ON clients(phone);
CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email);
CREATE INDEX IF NOT EXISTS idx_reservation_items_reservation ON reservation_items(reservation_id);
CREATE INDEX IF NOT EXISTS idx_sweets_catalog ON sweets(show_in_catalog, is_active);
CREATE INDEX IF NOT EXISTS idx_designs_catalog ON designs(show_in_catalog, is_active);
```

### Opção B: Via Wrangler CLI

Se você tiver o Wrangler instalado:

```bash
# Navegar para o diretório do projeto
cd /caminho/do/projeto

# Executar a migração
wrangler d1 execute sistema --file=./migrations/add_new_tables.sql
```

---

## 🔍 Passo 2: Verificar as Tabelas Criadas

Execute o seguinte comando para verificar se as tabelas foram criadas:

```sql
-- Listar todas as tabelas
SELECT name FROM sqlite_master WHERE type='table';

-- Verificar estrutura da tabela clients
PRAGMA table_info(clients);

-- Verificar estrutura da tabela sweets
PRAGMA table_info(sweets);

-- Verificar estrutura da tabela designs
PRAGMA table_info(designs);

-- Verificar estrutura da tabela reservation_items
PRAGMA table_info(reservation_items);
```

Você deverá ver as seguintes tabelas no resultado:
- ✅ `clients`
- ✅ `sweets`
- ✅ `designs`
- ✅ `reservation_items`

---

## 🧪 Passo 3: Testar a Aplicação

### 1. Iniciar o servidor de desenvolvimento

```bash
npm run dev
```

### 2. Acessar o Painel Admin

1. Faça login em: `http://localhost:3000/login`
2. Acesse o dashboard: `http://localhost:3000/admin`

### 3. Testar as novas funcionalidades

#### A. Gerenciar Clientes
- Acesse: `/admin/clients`
- Clique em **"+ Novo Cliente"**
- Preencha os dados:
  - Nome: João Silva
  - Telefone: (11) 98765-4321
  - Email: joao@example.com
  - Cidade: São Paulo
- Clique em **"Criar Cliente"**
- Verifique se o ID formatado aparece como `CLI-A001` ✅

#### B. Gerenciar Doces
- Acesse: `/admin/sweets`
- Clique em **"+ Novo Doce"**
- Preencha os dados:
  - Nome: Brigadeiro Gourmet
  - Preço: 2.50
  - Quantidade: 100
  - Categoria: Docinhos
  - ✅ Exibir no Catálogo
- Clique em **"Criar Doce"**
- Verifique se o ID formatado aparece como `DOC-A001` ✅

#### C. Gerenciar Designs
- Acesse: `/admin/designs`
- Clique em **"+ Novo Design"**
- Preencha os dados:
  - Nome: Painel de Flores
  - Preço: 350.00
  - Categoria: Painéis
  - ✅ Exibir no Catálogo
- Clique em **"Criar Design"**
- Verifique se o ID formatado aparece como `DES-A001` ✅

#### D. Verificar Catálogo Público
- Acesse: `http://localhost:3000/catalog`
- Você deverá ver **4 abas**:
  - 🎁 Kits
  - 📦 Estoque
  - 🍰 Doces
  - 🎨 Design
- Clique em cada aba e verifique se os itens aparecem corretamente ✅

---

## 🆔 Sistema de IDs Formatados

Os IDs formatados seguem o padrão: `[PREFIXO]-A[NÚMERO]`

| Tipo | Prefixo | Exemplo |
|------|---------|---------|
| **Clientes** | `CLI-A` | `CLI-A001` |
| **Estoque** | `EST-A` | `EST-A001` |
| **Kits** | `KIT-A` | `KIT-A001` |
| **Doces** | `DOC-A` | `DOC-A001` |
| **Design** | `DES-A` | `DES-A001` |
| **Reservas** | `RES-A` | `RES-A001` |

---

## 📁 Estrutura de Arquivos Criados/Modificados

### Novos Arquivos Criados

```
migrations/
└── add_new_tables.sql         # Script SQL de migração

functions/api/
├── clients.ts                 # API de Clientes
├── sweets.ts                  # API de Doces
└── designs.ts                 # API de Designs

src/lib/
└── formatId.ts                # Biblioteca de formatação de IDs

src/app/admin/
├── clients/
│   └── page.tsx              # Gerenciar Clientes
├── sweets/
│   └── page.tsx              # Gerenciar Doces
└── designs/
    └── page.tsx              # Gerenciar Designs
```

### Arquivos Modificados

```
src/app/admin/
├── layout.tsx                # Sidebar de navegação
├── page.tsx                  # Dashboard atualizado
└── catalog/
    └── page.tsx              # Catálogo com 4 abas
```

---

## 🚨 Troubleshooting

### Problema: "Table already exists"
Se você receber este erro, significa que as tabelas já foram criadas. Você pode:
1. Ignorar o erro (está tudo ok!)
2. Ou dropar as tabelas e recriar:
```sql
DROP TABLE IF EXISTS clients;
DROP TABLE IF EXISTS sweets;
DROP TABLE IF EXISTS designs;
DROP TABLE IF EXISTS reservation_items;
-- Depois execute o script de criação novamente
```

### Problema: API retorna erro 500
1. Verifique se as tabelas foram criadas corretamente
2. Verifique o console do navegador para detalhes do erro
3. Verifique se o binding do D1 está configurado corretamente no `wrangler.toml`

### Problema: IDs não aparecem formatados
1. Verifique se o arquivo `src/lib/formatId.ts` foi criado
2. Verifique se as páginas estão importando as funções corretamente:
```typescript
import { formatClientId, formatSweetId, formatDesignId } from '@/lib/formatId';
```

---

## 📞 Suporte

Se encontrar problemas, verifique:
1. Console do navegador (F12) para erros de JavaScript
2. Logs do Cloudflare Workers para erros de API
3. Estrutura das tabelas no D1 Console

---

## ✅ Checklist de Verificação

Após a instalação, verifique se:

- [ ] As 4 novas tabelas foram criadas (clients, sweets, designs, reservation_items)
- [ ] Os índices foram criados corretamente
- [ ] A página `/admin/clients` está acessível
- [ ] A página `/admin/sweets` está acessível
- [ ] A página `/admin/designs` está acessível
- [ ] O catálogo (`/catalog`) mostra as 4 abas
- [ ] Você consegue criar um novo cliente e ver o ID `CLI-A001`
- [ ] Você consegue criar um novo doce e ver o ID `DOC-A001`
- [ ] Você consegue criar um novo design e ver o ID `DES-A001`
- [ ] Os itens com `show_in_catalog = 1` aparecem no catálogo público

---

**Pronto! 🎉 Seu sistema está completo com todas as novas funcionalidades!**
