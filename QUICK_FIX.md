# 🚨 CORREÇÃO RÁPIDA - Erro de Produção

## Problema
```
Error: D1_ERROR: no such table: users: SQLITE_ERROR
```

## Solução em 2 Comandos

```bash
# 1. Aplicar schema ao banco
wrangler d1 execute sistema --file=./schema.sql

# 2. Verificar que funcionou
wrangler d1 execute sistema --command="SELECT * FROM users WHERE role='admin';"
```

## Testar

1. Acesse: https://www.axfestas.com.br/login
2. Email: `alex.fraga@axfestas.com.br`
3. Senha: `Ax7866Nb@`

## Mais Detalhes

- **Guia Completo:** [DATABASE_INIT_FIX.md](./DATABASE_INIT_FIX.md)
- **Script Automatizado:** `npm run db:init`
- **Deploy:** [DEPLOY.md](./DEPLOY.md)

## Causa

O banco de dados D1 foi criado mas nunca foi inicializado com as tabelas.

## Próximos Passos

✅ Banco inicializado  
🔄 Testar login  
🔄 Alterar senha padrão  
🔄 Configurar dados da empresa  
