# Cloudflare D1 / R2 — notas e próximos passos

Você informou os seguintes recursos já criados no Cloudflare:

- **D1 database name**: `sistema`
- **D1 database id**: `a11b14f5-5d31-482f-ac32-4caf446944dd`
- **Account ID**: `a39b043a2df362f77fc72e76b286e00c`
- **R2 (S3 API)**: `https://a39b043a2df362f77fc72e76b286e00c.r2.cloudflarestorage.com`

O repositório já foi atualizado com o `account_id` e `database_id` no arquivo `workers/wrangler.toml`.

Próximos passos recomendados:
1. No painel Cloudflare → D1 → abra o database `sistema` e na aba **SQL** execute o SQL em `workers/d1/schema.sql` para criar as tabelas (items, reservations, users etc.).
2. Crie um token no Cloudflare com permissões mínimas (Workers: Edit/Publish; Pages: Deploy se usar; D1: Edit se necessário; R2: Edit/Write se usar R2) e adicione-o como **Secret** no GitHub (Settings → Secrets → Actions):
   - `CF_API_TOKEN` — token de API gerado
   - `CF_ACCOUNT_ID` — `a39b043a2df362f77fc72e76b286e00c` (já conhecido)
   - `CF_PAGES_PROJECT_NAME` — nome do Pages project (ex.: `axfestas-pages`)
3. Após adicionar o token, faça um push em `main` (ou acione o workflow manualmente) para publicar o Worker via `.github/workflows/workers-deploy.yml`.
4. Se quiser usar R2 para armazenamento de imagens, crie um bucket R2 no painel e me diga para eu adicionar o binding `AX_R2` no `wrangler.toml` e incluir exemplos de upload no Worker.

Se preferir, eu posso executar esses passos por você se você me fornecer o token `CF_API_TOKEN` (adicione-o em Secrets) — ou podemos fazer isso juntos (guiado) pelo painel do Cloudflare.
