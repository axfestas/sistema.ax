# Database Migrations

This directory contains SQL migration files for the D1 database.

## How to apply migrations

### Produção (Cloudflare D1)

```bash
# Aplicar migration específica
wrangler d1 execute DB --file=./migrations/014_add_active_column_to_users.sql

# Ou aplicar todas as migrations pendentes
for file in migrations/*.sql; do
  echo "Aplicando $file..."
  wrangler d1 execute DB --file="$file"
done
```

Replace `DB` with your actual database name from `wrangler.toml`.

### Local (desenvolvimento)

```bash
# Aplicar em banco local
wrangler d1 execute DB --local --file=./migrations/014_add_active_column_to_users.sql
```

### Verificar se a coluna existe

```bash
# Produção
wrangler d1 execute DB --command "PRAGMA table_info(users);"

# Local
wrangler d1 execute DB --local --command "PRAGMA table_info(users);"
```

## Migrations

- `001_add_kit_festa_completo.sql` - Adds the "Kit Festa Completo" catalog item
- `002_add_portfolio_images.sql` - Adds portfolio_images table
- `003_add_default_admin_user.sql` - Adds default admin user (alex.fraga@axfestas.com.br)
- `004_add_kits_system.sql` - Adds kits system tables
- `005_add_catalog_and_kit_reservations.sql` - Adds catalog and kit reservation support
- `006_add_user_management_fields.sql` - Adds user management fields
- `007_add_custom_id_columns.sql` - Adds custom ID columns
- `008_add_portfolio_image_size.sql` - Adds portfolio image size field
- `009_add_maintenance_custom_id.sql` - Adds maintenance custom ID
- `010_add_item_category.sql` - Adds item category support
- `011_add_reservation_client_and_item_types.sql` - Adds reservation client and item types
- `012_add_reservation_requests_table.sql` - Adds reservation requests table
- `013_add_approved_rejected_statuses.sql` - Adds approved and rejected statuses
- `014_add_active_column_to_users.sql` - **[CRITICAL]** Adds active column to users table

## Migration 014: Add active column

**Status**: Pendente aplicação em produção  
**Data**: 2026-02-13  
**Motivo**: Sincronizar banco com schema.sql  
**Prioridade**: 🔴 **CRÍTICA** - Bloqueando criação/edição de usuários

### O que faz:
- Adiciona coluna `active INTEGER DEFAULT 1` na tabela `users`
- Define valor padrão 1 (ativo) para usuários existentes
- **Nota**: Se executado novamente quando a coluna já existe, retornará erro "duplicate column name", mas isso não afeta os dados e é comportamento esperado

### Como verificar se precisa ser aplicada:

```bash
wrangler d1 execute DB --command "SELECT sql FROM sqlite_master WHERE type='table' AND name='users';"
```

Se a saída NÃO incluir `active INTEGER`, a migration precisa ser aplicada.

### Como aplicar:

```bash
# Produção
wrangler d1 execute DB --file=./migrations/014_add_active_column_to_users.sql

# Local
wrangler d1 execute DB --local --file=./migrations/014_add_active_column_to_users.sql
```

### Validação após aplicação:

```bash
# Verificar estrutura da tabela
wrangler d1 execute DB --command "PRAGMA table_info(users);"

# Verificar dados (deve mostrar coluna active)
wrangler d1 execute DB --command "SELECT id, email, name, active FROM users LIMIT 5;"
```
