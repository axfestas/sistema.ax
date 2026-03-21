/**
 * API endpoint for managing publicacoes (social media publications)
 * Path: /api/publicacoes
 *
 * Supports:
 * - GET: List publications (optional ?status= or ?arte_id= filter)
 * - GET ?id=N: Get single publication
 * - POST: Create publication
 * - PUT: Update publication
 * - DELETE: Delete publication
 */

interface Env {
  DB: D1Database;
}

export interface Publicacao {
  id: number;
  arte_id?: number;
  arte_title?: string;
  arte_image_url?: string;
  platform: 'instagram' | 'whatsapp' | 'outros';
  publish_date?: string;
  status: 'agendado' | 'publicado';
  notes?: string;
  created_at: number;
}

export interface PublicacaoInput {
  arte_id?: number;
  platform: string;
  publish_date?: string;
  status?: string;
  notes?: string;
}

const BASE_SELECT = `SELECT p.*, a.title AS arte_title, a.image_url AS arte_image_url
                   FROM publicacoes p
                   LEFT JOIN artes_criadas a ON p.arte_id = a.id`;

// GET: List publications
export const onRequestGet: PagesFunction<Env> = async (context) => {
  const db = context.env.DB;
  const url = new URL(context.request.url);
  const id = url.searchParams.get('id');
  const status = url.searchParams.get('status');
  const arteId = url.searchParams.get('arte_id');

  try {
    if (id) {
      const pub = await db.prepare(
        `${BASE_SELECT} WHERE p.id = ?`
      ).bind(Number(id)).first();
      if (!pub) {
        return new Response(JSON.stringify({ error: 'Publicacao not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      return new Response(JSON.stringify(pub), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const conditions: string[] = [];
    const params: (string | number)[] = [];

    if (status) {
      conditions.push('p.status = ?');
      params.push(status);
    }
    if (arteId) {
      conditions.push('p.arte_id = ?');
      params.push(Number(arteId));
    }

    const where = conditions.length ? ` WHERE ${conditions.join(' AND ')}` : '';
    const query = `${BASE_SELECT}${where}
                   ORDER BY COALESCE(p.publish_date, '') DESC, p.created_at DESC`;

    const { results } = params.length
      ? await db.prepare(query).bind(...params).all()
      : await db.prepare(query).all();

    return new Response(JSON.stringify(results), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    console.error('Error fetching publicacoes:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch publicacoes' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

// POST: Create publication
export const onRequestPost: PagesFunction<Env> = async (context) => {
  const db = context.env.DB;

  try {
    const body = await context.request.json() as PublicacaoInput;

    if (!body.platform) {
      return new Response(JSON.stringify({ error: 'Platform is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const result = await db.prepare(
      `INSERT INTO publicacoes (arte_id, platform, publish_date, status, notes)
       VALUES (?, ?, ?, ?, ?)
       RETURNING *`
    )
      .bind(
        body.arte_id || null,
        body.platform,
        body.publish_date || null,
        body.status || 'agendado',
        body.notes || null
      )
      .first();

    return new Response(JSON.stringify(result), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    console.error('Error creating publicacao:', error);
    return new Response(JSON.stringify({ error: 'Failed to create publicacao' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

// PUT: Update publication
export const onRequestPut: PagesFunction<Env> = async (context) => {
  const db = context.env.DB;
  const url = new URL(context.request.url);
  const id = url.searchParams.get('id');

  try {
    const body = await context.request.json() as PublicacaoInput & { id?: number };
    const pubId = id ? Number(id) : body.id;

    if (!pubId) {
      return new Response(JSON.stringify({ error: 'ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const result = await db.prepare(
      `UPDATE publicacoes
       SET arte_id = ?, platform = ?, publish_date = ?, status = ?, notes = ?
       WHERE id = ?
       RETURNING *`
    )
      .bind(
        body.arte_id || null,
        body.platform,
        body.publish_date || null,
        body.status || 'agendado',
        body.notes || null,
        pubId
      )
      .first();

    if (!result) {
      return new Response(JSON.stringify({ error: 'Publicacao not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    console.error('Error updating publicacao:', error);
    return new Response(JSON.stringify({ error: 'Failed to update publicacao' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

// DELETE: Delete publication
export const onRequestDelete: PagesFunction<Env> = async (context) => {
  const db = context.env.DB;
  const url = new URL(context.request.url);
  const id = url.searchParams.get('id');

  if (!id) {
    return new Response(JSON.stringify({ error: 'ID is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    await db.prepare('DELETE FROM publicacoes WHERE id = ?').bind(Number(id)).run();
    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    console.error('Error deleting publicacao:', error);
    return new Response(JSON.stringify({ error: 'Failed to delete publicacao' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
