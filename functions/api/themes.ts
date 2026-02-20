/**
 * API endpoint for managing themes
 * Path: /api/themes
 * 
 * Supports:
 * - GET: List all themes (with optional catalog filter)
 * - POST: Create new theme
 * - PUT: Update theme
 * - DELETE: Soft delete theme
 */

interface Env {
  DB: D1Database;
}

export interface Theme {
  id: number;
  name: string;
  description?: string;
  image_url?: string;
  category?: string;
  is_active: number;
  show_in_catalog: number;
  created_at: number;
}

export interface ThemeInput {
  name: string;
  description?: string;
  image_url?: string;
  category?: string;
  show_in_catalog?: number;
}

// GET: List all themes
export const onRequestGet: PagesFunction<Env> = async (context) => {
  const db = context.env.DB;
  const url = new URL(context.request.url);
  const catalogOnly = url.searchParams.get('catalog') === 'true';

  try {
    let query = 'SELECT * FROM themes WHERE is_active = 1';

    if (catalogOnly) {
      query += ' AND show_in_catalog = 1';
    }

    query += ' ORDER BY created_at DESC';

    const { results } = await db.prepare(query).all();

    return new Response(JSON.stringify(results), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    console.error('Error fetching themes:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch themes' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

// POST: Create new theme
export const onRequestPost: PagesFunction<Env> = async (context) => {
  const db = context.env.DB;

  try {
    const body = await context.request.json() as ThemeInput;

    if (!body.name) {
      return new Response(
        JSON.stringify({ error: 'Name is required' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const result = await db
      .prepare(`
        INSERT INTO themes (name, description, image_url, category, show_in_catalog)
        VALUES (?, ?, ?, ?, ?)
      `)
      .bind(
        body.name,
        body.description || null,
        body.image_url || null,
        body.category || null,
        body.show_in_catalog !== undefined ? body.show_in_catalog : 1
      )
      .run();

    const { results } = await db
      .prepare('SELECT * FROM themes WHERE id = ?')
      .bind(result.meta.last_row_id)
      .all();

    return new Response(
      JSON.stringify(results[0]),
      {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error: unknown) {
    console.error('Error creating theme:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to create theme' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

// PUT: Update theme
export const onRequestPut: PagesFunction<Env> = async (context) => {
  const db = context.env.DB;

  try {
    const body = await context.request.json() as Theme;

    if (!body.id) {
      return new Response(
        JSON.stringify({ error: 'Theme ID is required' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    await db
      .prepare(`
        UPDATE themes
        SET name = ?, description = ?,
            image_url = ?, category = ?, show_in_catalog = ?
        WHERE id = ?
      `)
      .bind(
        body.name,
        body.description || null,
        body.image_url || null,
        body.category || null,
        body.show_in_catalog,
        body.id
      )
      .run();

    const { results } = await db
      .prepare('SELECT * FROM themes WHERE id = ?')
      .bind(body.id)
      .all();

    return new Response(
      JSON.stringify(results[0]),
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error: unknown) {
    console.error('Error updating theme:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to update theme' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

// DELETE: Soft delete theme
export const onRequestDelete: PagesFunction<Env> = async (context) => {
  const db = context.env.DB;
  const url = new URL(context.request.url);
  const id = url.searchParams.get('id');

  if (!id) {
    return new Response(
      JSON.stringify({ error: 'Theme ID is required' }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  try {
    await db
      .prepare('UPDATE themes SET is_active = 0 WHERE id = ?')
      .bind(id)
      .run();

    return new Response(
      JSON.stringify({ success: true }),
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error: unknown) {
    console.error('Error deleting theme:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to delete theme' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
