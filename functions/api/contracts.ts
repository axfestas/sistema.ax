/**
 * API endpoint for managing contracts (contratos)
 *
 * GET    /api/contracts             — list all
 * GET    /api/contracts?id=N        — single record
 * GET    /api/contracts?client_id=N — by client
 * POST   /api/contracts             — create
 * PUT    /api/contracts?id=N        — update
 * DELETE /api/contracts?id=N        — delete
 */

interface Env {
  DB: D1Database;
}

interface ContractItem {
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
}

interface ContractBody {
  id?: number;
  client_id: number;
  quote_id?: number | null;
  event_date?: string;
  event_location?: string;
  pickup_date?: string;
  return_date?: string;
  items_json: ContractItem[];
  discount: number;
  total: number;
  payment_method?: string;
  status: 'pending' | 'sent' | 'signed' | 'completed';
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
          `SELECT ct.*, c.name AS client_name, c.phone AS client_phone, c.email AS client_email,
                  c.cpf AS client_cpf, c.address AS client_address, c.city AS client_city,
                  c.state AS client_state
           FROM contracts ct
           JOIN clients c ON c.id = ct.client_id
           WHERE ct.id = ?`
        )
        .bind(id)
        .all();
      if (!results.length) return jsonErr('Contract not found', 404);
      return new Response(JSON.stringify(results[0]), { headers: JSON_HEADERS });
    }

    let stmt = db.prepare(
      `SELECT ct.*, c.name AS client_name, c.phone AS client_phone, c.email AS client_email
       FROM contracts ct
       JOIN clients c ON c.id = ct.client_id
       ${clientId ? 'WHERE ct.client_id = ?' : ''}
       ORDER BY ct.created_at DESC`
    );
    if (clientId) stmt = stmt.bind(clientId);
    const { results } = await stmt.all();
    return new Response(JSON.stringify(results), { headers: JSON_HEADERS });
  } catch (err) {
    console.error('contracts GET error:', err);
    return jsonErr('Failed to fetch contracts', 500);
  }
};

// POST
export const onRequestPost: PagesFunction<Env> = async (context) => {
  const db = context.env.DB;
  try {
    const body = await context.request.json() as ContractBody;
    if (!body.client_id) return jsonErr('client_id is required');

    const itemsStr = JSON.stringify(body.items_json ?? []);
    const result = await db
      .prepare(
        `INSERT INTO contracts (client_id, quote_id, event_date, event_location, pickup_date, return_date,
                               items_json, discount, total, payment_method, status, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        body.client_id,
        body.quote_id || null,
        body.event_date || null,
        body.event_location || null,
        body.pickup_date || null,
        body.return_date || null,
        itemsStr,
        body.discount ?? 0,
        body.total ?? 0,
        body.payment_method || null,
        body.status ?? 'pending',
        body.notes || null
      )
      .run();

    const { results } = await db
      .prepare(
        `SELECT ct.*, c.name AS client_name, c.phone AS client_phone, c.email AS client_email,
                c.cpf AS client_cpf, c.address AS client_address, c.city AS client_city,
                c.state AS client_state
         FROM contracts ct JOIN clients c ON c.id = ct.client_id WHERE ct.id = ?`
      )
      .bind(result.meta.last_row_id)
      .all();

    return new Response(JSON.stringify(results[0]), { status: 201, headers: JSON_HEADERS });
  } catch (err) {
    console.error('contracts POST error:', err);
    return jsonErr('Failed to create contract', 500);
  }
};

// PUT
export const onRequestPut: PagesFunction<Env> = async (context) => {
  const db = context.env.DB;
  const url = new URL(context.request.url);
  const id = url.searchParams.get('id');
  if (!id) return jsonErr('id is required');

  try {
    const body = await context.request.json() as ContractBody;
    const itemsStr = JSON.stringify(body.items_json ?? []);

    await db
      .prepare(
        `UPDATE contracts SET client_id=?, quote_id=?, event_date=?, event_location=?,
         pickup_date=?, return_date=?, items_json=?, discount=?, total=?,
         payment_method=?, status=?, notes=? WHERE id=?`
      )
      .bind(
        body.client_id,
        body.quote_id || null,
        body.event_date || null,
        body.event_location || null,
        body.pickup_date || null,
        body.return_date || null,
        itemsStr,
        body.discount ?? 0,
        body.total ?? 0,
        body.payment_method || null,
        body.status ?? 'pending',
        body.notes || null,
        id
      )
      .run();

    const { results } = await db
      .prepare(
        `SELECT ct.*, c.name AS client_name, c.phone AS client_phone, c.email AS client_email,
                c.cpf AS client_cpf, c.address AS client_address, c.city AS client_city,
                c.state AS client_state
         FROM contracts ct JOIN clients c ON c.id = ct.client_id WHERE ct.id = ?`
      )
      .bind(id)
      .all();

    return new Response(JSON.stringify(results[0]), { headers: JSON_HEADERS });
  } catch (err) {
    console.error('contracts PUT error:', err);
    return jsonErr('Failed to update contract', 500);
  }
};

// DELETE
export const onRequestDelete: PagesFunction<Env> = async (context) => {
  const db = context.env.DB;
  const url = new URL(context.request.url);
  const id = url.searchParams.get('id');
  if (!id) return jsonErr('id is required');

  try {
    await db.prepare('DELETE FROM contracts WHERE id = ?').bind(id).run();
    return new Response(JSON.stringify({ success: true }), { headers: JSON_HEADERS });
  } catch (err) {
    console.error('contracts DELETE error:', err);
    return jsonErr('Failed to delete contract', 500);
  }
};
