import items from './items.json' assert { type: 'json' };

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const pathname = url.pathname.replace(/\/$/, ''); // trim trailing slash

    // GET /items
    if (request.method === 'GET' && (pathname === '/items' || pathname === '/')) {
      return new Response(JSON.stringify(items), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // GET /items/:id_or_slug
    const itemMatch = pathname.match(/^\/items\/(.+)$/);
    if (request.method === 'GET' && itemMatch) {
      const idOrSlug = decodeURIComponent(itemMatch[1]);
      const item = items.find(i => String(i.id) === idOrSlug || i.slug === idOrSlug);
      if (!item) return new Response(JSON.stringify({ error: 'Item not found' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
      return new Response(JSON.stringify(item), { headers: { 'Content-Type': 'application/json' } });
    }

    // POST /reservations -> protótipo (não persistente)
    if (request.method === 'POST' && pathname === '/reservations') {
      try {
        const body = await request.json();
        // validação mínima
        if (!body.itemId || !body.startDate || !body.endDate || !body.customerName) {
          return new Response(JSON.stringify({ error: 'Missing fields (itemId, startDate, endDate, customerName required)' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
        }

        const reservation = {
          id: Date.now(),
          itemId: body.itemId,
          startDate: body.startDate,
          endDate: body.endDate,
          customerName: body.customerName,
          status: 'PENDING',
          createdAt: new Date().toISOString()
        };

        // Se desejar persistir, configure um KV namespace e vincule como RESERVATIONS no wrangler.toml
        // Exemplo (não obrigatório): await env.RESERVATIONS.put(String(reservation.id), JSON.stringify(reservation));

        return new Response(JSON.stringify(reservation), { status: 201, headers: { 'Content-Type': 'application/json' } });
      } catch (err) {
        return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
      }
    }

    return new Response('Not Found', { status: 404 });
  }
};
