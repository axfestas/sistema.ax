# Database Migrations

This directory contains SQL migration files for the D1 database.

## How to apply migrations

For Cloudflare D1 database, run migrations using wrangler:

```bash
wrangler d1 execute DB --file=./migrations/001_add_kit_festa_completo.sql
```

Replace `DB` with your actual database name from `wrangler.toml`.

## Migrations

- `001_add_kit_festa_completo.sql` - Adds the "Kit Festa Completo" catalog item
