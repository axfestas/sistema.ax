/**
 * API endpoint for managing artes_criadas (marketing arts)
 * Path: /api/artes
 *
 * Supports:
 * - GET: List all arts (optional ?status= filter)
 * - GET ?id=N: Get single art
 * - POST: Create new art
 * - PUT: Update art
 * - DELETE: Delete art
 */

interface Env {
  DB: D1Database;
}

export interface Arte {
  id: number;
  title: string;
  caption?: string;
  image_url?: string;
  suggested_date?: string;
  status: 'rascunho' | 'pronta' | 'publicada';
  created_at: number;
}

export interface ArteInput {
  title: string;
  caption?: string;
  image_url?: string;
  suggested_date?: string;
  status?: string;
}

// GET: List arts
export const onRequestGet: PagesFunction<Env> = async (context) => {
  const db = context.env.DB;
  const url = new URL(context.request.url);
  const id = url.searchParams.get('id');
  const status = url.searchParams.get('status');

  try {
    if (id) {
      const art = await db.prepare('SELECT * FROM artes_criadas WHERE id = ?').bind(Number(id)).first();
      if (!art) {
        return new Response(JSON.stringify({ error: 'Arte not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      return new Response(JSON.stringify(art), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    let query = 'SELECT * FROM artes_criadas';
    const params: (string | number)[] = [];
    if (status) {
      query += ' WHERE status = ?';
      params.push(status);
    }
    query += ' ORDER BY created_at DESC';

    const { results } = params.length
      ? await db.prepare(query).bind(...params).all()
      : await db.prepare(query).all();

    return new Response(JSON.stringify(results), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    console.error('Error fetching artes:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch artes' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

// POST: Create art
export const onRequestPost: PagesFunction<Env> = async (context) => {
  const db = context.env.DB;

  try {
    const body = await context.request.json() as ArteInput;

    if (!body.title) {
      return new Response(JSON.stringify({ error: 'Title is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const result = await db.prepare(
      `INSERT INTO artes_criadas (title, caption, image_url, suggested_date, status)
       VALUES (?, ?, ?, ?, ?)
       RETURNING *`
    )
      .bind(
        body.title,
        body.caption || null,
        body.image_url || null,
        body.suggested_date || null,
        body.status || 'rascunho'
      )
      .first();

    return new Response(JSON.stringify(result), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    console.error('Error creating arte:', error);
    return new Response(JSON.stringify({ error: 'Failed to create arte' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

// PUT: Update art
export const onRequestPut: PagesFunction<Env> = async (context) => {
  const db = context.env.DB;
  const url = new URL(context.request.url);
  const id = url.searchParams.get('id');

  try {
    const body = await context.request.json() as ArteInput & { id?: number };
    const artId = id ? Number(id) : body.id;

    if (!artId) {
      return new Response(JSON.stringify({ error: 'ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const result = await db.prepare(
      `UPDATE artes_criadas
       SET title = ?, caption = ?, image_url = ?, suggested_date = ?, status = ?
       WHERE id = ?
       RETURNING *`
    )
      .bind(
        body.title,
        body.caption || null,
        body.image_url || null,
        body.suggested_date || null,
        body.status || 'rascunho',
        artId
      )
      .first();

    if (!result) {
      return new Response(JSON.stringify({ error: 'Arte not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    console.error('Error updating arte:', error);
    return new Response(JSON.stringify({ error: 'Failed to update arte' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

// DELETE: Delete art
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
    await db.prepare('DELETE FROM artes_criadas WHERE id = ?').bind(Number(id)).run();
    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    console.error('Error deleting arte:', error);
    return new Response(JSON.stringify({ error: 'Failed to delete arte' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
