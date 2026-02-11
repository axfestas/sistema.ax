# 🚨 CORREÇÃO URGENTE: Database Não Inicializado

## ❌ Problema Atual

O sistema está apresentando o seguinte erro na produção:

```
Error: D1_ERROR: no such table: users: SQLITE_ERROR
```

Isso ocorre porque **o banco de dados D1 de produção não foi inicializado** com o schema.

## ✅ Solução Imediata

### Passo 1: Verificar Nome do Banco de Dados

No arquivo `wrangler.toml`, verifique o nome do banco:

```toml
[[d1_databases]]
binding = "DB"
database_name = "sistema"  # <-- Este é o nome
database_id = "a11b14f5-5d31-482f-ac32-4caf446944dd"
```

### Passo 2: Inicializar o Banco de Dados

Execute o seguinte comando para aplicar o schema completo:

```bash
wrangler d1 execute sistema --file=./schema.sql
```

**Nota:** Use `sistema` (o valor de `database_name` no wrangler.toml)

### Passo 3: Verificar se Funcionou

Execute este comando para verificar se as tabelas foram criadas:

```bash
wrangler d1 execute sistema --command="SELECT name FROM sqlite_master WHERE type='table';"
```

Você deve ver as seguintes tabelas:
- `users`
- `sessions`
- `items`
- `reservations`
- `maintenance`
- `financial_records`
- `portfolio_images`
- `site_settings`

### Passo 4: Testar o Login

Após inicializar o banco, teste o login com as credenciais padrão:
- **Email:** alex.fraga@axfestas.com.br
- **Senha:** Ax7866Nb@

⚠️ **IMPORTANTE:** Altere a senha imediatamente após o primeiro login!

## 🔍 Detalhes Técnicos

### O que o schema.sql faz?

O arquivo `schema.sql` cria:
1. **8 tabelas** necessárias para o sistema
2. **Usuário admin padrão** (alex.fraga@axfestas.com.br)
3. **Dados iniciais** (item de exemplo, configurações do site)

### Por que isso aconteceu?

O banco de dados D1 foi criado no Cloudflare, mas o schema SQL nunca foi aplicado. É como ter um banco de dados vazio sem estrutura.

## 📋 Comandos Úteis

### Verificar se o banco existe
```bash
wrangler d1 list
```

### Ver informações do banco
```bash
wrangler d1 info sistema
```

### Executar query SQL
```bash
wrangler d1 execute sistema --command="SELECT * FROM users;"
```

### Aplicar migrações individuais (alternativa)
```bash
wrangler d1 execute sistema --file=./migrations/001_add_kit_festa_completo.sql
wrangler d1 execute sistema --file=./migrations/002_add_portfolio_images.sql
wrangler d1 execute sistema --file=./migrations/003_add_default_admin_user.sql
```

## 🚀 Automatizar Inicialização

Criamos um script para facilitar a inicialização. Execute:

```bash
npm run db:init
```

Ou manualmente:

```bash
node scripts/init-database.js
```

## ⚠️ Para Desenvolvedores

### Checklist de Deploy

Sempre que fazer deploy em um novo ambiente:

- [ ] Criar banco D1 (`wrangler d1 create sistema`)
- [ ] **Aplicar schema** (`wrangler d1 execute sistema --file=./schema.sql`)
- [ ] Configurar binding no wrangler.toml
- [ ] Criar bucket R2 (se necessário)
- [ ] Fazer deploy da aplicação
- [ ] Testar login com credenciais padrão
- [ ] Alterar senha do admin

### Ambiente Local

Para desenvolvimento local com Wrangler:

```bash
# Criar banco local
wrangler d1 create sistema --local

# Aplicar schema local
wrangler d1 execute sistema --local --file=./schema.sql

# Testar localmente
npm run dev
```

## 🆘 Troubleshooting

### Erro: "No D1 database with the name 'sistema' exists"

O banco não foi criado ainda. Crie-o:

```bash
wrangler d1 create sistema
```

Depois atualize o `database_id` no wrangler.toml com o ID retornado.

### Erro: "table users already exists"

O schema já foi aplicado. Isso não é um problema, use `INSERT OR IGNORE` nas queries.

### Erro: "authentication failed"

Configure o Wrangler:

```bash
wrangler login
```

### Verificar se tabelas existem

```bash
wrangler d1 execute sistema --command=".tables"
```

## 📚 Referências

- [Documentação D1](https://developers.cloudflare.com/d1/)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/)
- Schema completo: `schema.sql`
- Migrações: `migrations/`

## 🎯 Próximos Passos

Após corrigir este erro:

1. ✅ Banco inicializado
2. ✅ Login funcionando
3. 🔄 Alterar senha padrão
4. 🔄 Configurar dados da empresa
5. 🔄 Adicionar itens ao catálogo
6. 🔄 Configurar R2 para imagens (se necessário)
