Ax Festas - Workers

Protótipo de API usando Cloudflare Workers.

Localização: `workers/items`

Rotas suportadas (protótipo):
- GET /items
- GET /items/:id_or_slug
- POST /reservations

Para deploy automático via GitHub Actions, adicione os secrets no GitHub:
- `CF_ACCOUNT_ID` - seu Cloudflare Account ID
- `CF_API_TOKEN` - token com permissões para Workers (escrever/publish) e, se necessário, D1/KV

Depois faça push na branch `main`.

Para persistência, configure um KV namespace no painel Cloudflare e adicione o binding no `workers/wrangler.toml`.
