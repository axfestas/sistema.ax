/**
 * API endpoint for managing quotes (orçamentos)
 *
 * GET    /api/quotes             — list all
 * GET    /api/quotes?id=N        — single record
 * POST   /api/quotes             — create
 * PUT    /api/quotes?id=N        — update
 * DELETE /api/quotes?id=N        — delete
 */

interface Env {
  DB: D1Database;
}

interface QuoteItem {
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
}

interface QuoteBody {
  id?: number;
  client_id?: number;
  client_name?: string;
  client_phone?: string;
  event_date?: string;
  event_location?: string;
  items_json: QuoteItem[];
  discount: number;
  total: number;
  status: 'pending' | 'sent' | 'approved' | 'rejected';
  notes?: string;
}

const JSON_HEADERS = { 'Content-Type': 'application/json' };

function jsonErr(msg: string, status = 400) {
  return new Response(JSON.stringify({ error: msg }), { status, headers: JSON_HEADERS });
}

// GET
export const onRequestGet: PagesFunction<Env> = async (context) => {
  const db = context.env.DB;
  const url = new URL(context.request.url);
  const id = url.searchParams.get('id');
  const clientId = url.searchParams.get('client_id');

  try {
    if (id) {
      const { results } = await db
        .prepare(
          `SELECT q.*,
                  COALESCE(q.client_name, c.name) AS client_name,
                  COALESCE(q.client_phone, c.phone) AS client_phone,
                  c.email AS client_email
           FROM quotes q
           LEFT JOIN clients c ON c.id = q.client_id
           WHERE q.id = ?`
        )
        .bind(id)
        .all();
      if (!results.length) return jsonErr('Quote not found', 404);
      return new Response(JSON.stringify(results[0]), { headers: JSON_HEADERS });
    }

    let stmt = db.prepare(
      `SELECT q.*,
              COALESCE(q.client_name, c.name) AS client_name,
              COALESCE(q.client_phone, c.phone) AS client_phone,
              c.email AS client_email
       FROM quotes q
       LEFT JOIN clients c ON c.id = q.client_id
       ${clientId ? 'WHERE q.client_id = ?' : ''}
       ORDER BY q.created_at DESC`
    );
    if (clientId) stmt = stmt.bind(clientId);
    const { results } = await stmt.all();
    return new Response(JSON.stringify(results), { headers: JSON_HEADERS });
  } catch (err) {
    console.error('quotes GET error:', err);
    return jsonErr('Failed to fetch quotes', 500);
  }
};

// POST
export const onRequestPost: PagesFunction<Env> = async (context) => {
  const db = context.env.DB;
  try {
    const body = await context.request.json() as QuoteBody;
    if (!body.client_name?.trim()) return jsonErr('client_name is required');

    const itemsStr = JSON.stringify(body.items_json ?? []);
    const result = await db
      .prepare(
        `INSERT INTO quotes (client_id, client_name, client_phone, event_date, event_location, items_json, discount, total, status, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        body.client_id || null,
        body.client_name.trim(),
        body.client_phone?.trim() || null,
        body.event_date || null,
        body.event_location || null,
        itemsStr,
        body.discount ?? 0,
        body.total ?? 0,
        body.status ?? 'pending',
        body.notes || null
      )
      .run();

    const { results } = await db
      .prepare(
        `SELECT q.*,
                COALESCE(q.client_name, c.name) AS client_name,
                COALESCE(q.client_phone, c.phone) AS client_phone,
                c.email AS client_email
         FROM quotes q LEFT JOIN clients c ON c.id = q.client_id WHERE q.id = ?`
      )
      .bind(result.meta.last_row_id)
      .all();

    return new Response(JSON.stringify(results[0]), { status: 201, headers: JSON_HEADERS });
  } catch (err) {
    console.error('quotes POST error:', err);
    return jsonErr('Failed to create quote', 500);
  }
};

// PUT
export const onRequestPut: PagesFunction<Env> = async (context) => {
  const db = context.env.DB;
  const url = new URL(context.request.url);
  const id = url.searchParams.get('id');
  if (!id) return jsonErr('id is required');

  try {
    const body = await context.request.json() as QuoteBody;
    if (!body.client_name?.trim()) return jsonErr('client_name is required');
    const itemsStr = JSON.stringify(body.items_json ?? []);

    await db
      .prepare(
        `UPDATE quotes SET client_id=?, client_name=?, client_phone=?, event_date=?, event_location=?, items_json=?,
         discount=?, total=?, status=?, notes=? WHERE id=?`
      )
      .bind(
        body.client_id || null,
        body.client_name?.trim() || null,
        body.client_phone?.trim() || null,
        body.event_date || null,
        body.event_location || null,
        itemsStr,
        body.discount ?? 0,
        body.total ?? 0,
        body.status ?? 'pending',
        body.notes || null,
        id
      )
      .run();

    const { results } = await db
      .prepare(
        `SELECT q.*,
                COALESCE(q.client_name, c.name) AS client_name,
                COALESCE(q.client_phone, c.phone) AS client_phone,
                c.email AS client_email
         FROM quotes q LEFT JOIN clients c ON c.id = q.client_id WHERE q.id = ?`
      )
      .bind(id)
      .all();

    return new Response(JSON.stringify(results[0]), { headers: JSON_HEADERS });
  } catch (err) {
    console.error('quotes PUT error:', err);
    return jsonErr('Failed to update quote', 500);
  }
};

// DELETE
export const onRequestDelete: PagesFunction<Env> = async (context) => {
  const db = context.env.DB;
  const url = new URL(context.request.url);
  const id = url.searchParams.get('id');
  if (!id) return jsonErr('id is required');

  try {
    await db.prepare('DELETE FROM quotes WHERE id = ?').bind(id).run();
    return new Response(JSON.stringify({ success: true }), { headers: JSON_HEADERS });
  } catch (err) {
    console.error('quotes DELETE error:', err);
    return jsonErr('Failed to delete quote', 500);
  }
};
