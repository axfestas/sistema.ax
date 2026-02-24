/**
 * Cloudflare Pages Function para páginas de compartilhamento de itens.
 *
 * Rota: /item/{type}/{id}  (ex: /item/item/5, /item/kit/3, /item/sweet/2)
 *
 * Retorna uma página HTML mínima com as meta tags og:image corretas para que
 * redes sociais e aplicativos de mensagens exibam a foto do item ao
 * compartilhar o link. Após carregar, o visitante é redirecionado para a
 * página do catálogo com o hash correto.
 */

interface Env {
  DB: D1Database;
  SITE_URL?: string;
}

interface CatalogItem {
  id: number;
  name: string;
  description?: string;
  image_url?: string;
}

async function fetchItem(env: Env, type: string, id: number): Promise<CatalogItem | null> {
  const db = env.DB;
  try {
    let result: Record<string, unknown> | null = null;
    switch (type) {
      case 'item':
        result = await db.prepare('SELECT id, name, description, image_url FROM items WHERE id = ? LIMIT 1').bind(id).first();
        break;
      case 'kit':
        result = await db.prepare('SELECT id, name, description, image_url FROM kits WHERE id = ? LIMIT 1').bind(id).first();
        break;
      case 'sweet':
        result = await db.prepare('SELECT id, name, description, image_url FROM sweets WHERE id = ? LIMIT 1').bind(id).first();
        break;
      case 'design':
        result = await db.prepare('SELECT id, name, description, image_url FROM designs WHERE id = ? LIMIT 1').bind(id).first();
        break;
      case 'theme':
        result = await db.prepare('SELECT id, name, description, image_url FROM themes WHERE id = ? LIMIT 1').bind(id).first();
        break;
      default:
        return null;
    }
    if (!result) return null;
    return {
      id: result.id as number,
      name: result.name as string,
      description: result.description as string | undefined,
      image_url: result.image_url as string | undefined,
    };
  } catch {
    return null;
  }
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const url = new URL(context.request.url);
  const siteUrl = context.env.SITE_URL || url.origin;

  // path params: ['type', 'id']  (e.g. ['item', '5'])
  const segments = (context.params.path as string[]) ?? [];
  const type = segments[0];
  const idStr = segments[1];
  const id = Number(idStr);

  const validTypes = ['item', 'kit', 'sweet', 'design', 'theme'];
  if (!type || !validTypes.includes(type) || !idStr || isNaN(id)) {
    return Response.redirect(`${siteUrl}/catalog`, 302);
  }

  const item = await fetchItem(context.env, type, id);

  const catalogUrl = `${siteUrl}/catalog#${type}-${id}`;

  if (!item) {
    return Response.redirect(catalogUrl, 302);
  }

  const title = item.name;
  const description = item.description || title;
  const imageUrl = item.image_url
    ? item.image_url.startsWith('http')
      ? item.image_url
      : `${siteUrl}${item.image_url}`
    : `${siteUrl}/logotipo.svg`;

  const html = `<!DOCTYPE html>
<html lang="pt-br">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}" />

  <!-- Open Graph -->
  <meta property="og:type" content="product" />
  <meta property="og:title" content="${escapeHtml(title)}" />
  <meta property="og:description" content="${escapeHtml(description)}" />
  <meta property="og:image" content="${escapeHtml(imageUrl)}" />
  <meta property="og:image:alt" content="${escapeHtml(title)}" />
  <meta property="og:url" content="${escapeHtml(catalogUrl)}" />
  <meta property="og:site_name" content="Ax Festas" />

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeHtml(title)}" />
  <meta name="twitter:description" content="${escapeHtml(description)}" />
  <meta name="twitter:image" content="${escapeHtml(imageUrl)}" />

  <meta http-equiv="refresh" content="0; url=${escapeHtml(catalogUrl)}" />
  <link rel="canonical" href="${escapeHtml(catalogUrl)}" />
</head>
<body>
  <script>window.location.replace(${JSON.stringify(catalogUrl)});</script>
  <noscript>
    <p>Redirecionando… <a href="${escapeHtml(catalogUrl)}">Clique aqui</a> se não for redirecionado.</p>
  </noscript>
</body>
</html>`;

  return new Response(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=300',
    },
  });
};

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
