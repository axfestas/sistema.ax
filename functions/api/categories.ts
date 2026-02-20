/**
 * API endpoint for managing categories
 * Path: /api/categories
 * 
 * Supports:
 * - GET: List all categories (optional ?section filter)
 * - POST: Create new category
 * - DELETE: Delete category
 */

interface Env {
  DB: D1Database;
}

export interface Category {
  id: number;
  name: string;
  section: string;
}

// GET: List categories
export const onRequestGet: PagesFunction<Env> = async (context) => {
  const db = context.env.DB;
  const url = new URL(context.request.url);
  const section = url.searchParams.get('section');

  try {
    let query = 'SELECT * FROM categories';
    const params: string[] = [];
    if (section) {
      query += ' WHERE section = ?';
      params.push(section);
    }
    query += ' ORDER BY section, name';

    const { results } = params.length
      ? await db.prepare(query).bind(...params).all()
      : await db.prepare(query).all();

    return new Response(JSON.stringify(results), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    console.error('Error fetching categories:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch categories' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

// POST: Create new category
export const onRequestPost: PagesFunction<Env> = async (context) => {
  const db = context.env.DB;

  try {
    const body = await context.request.json() as { name: string; section: string };

    if (!body.name || !body.section) {
      return new Response(
        JSON.stringify({ error: 'Name and section are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    await db
      .prepare('INSERT OR IGNORE INTO categories (name, section) VALUES (?, ?)')
      .bind(body.name, body.section)
      .run();

    const { results } = await db
      .prepare('SELECT * FROM categories WHERE name = ? AND section = ?')
      .bind(body.name, body.section)
      .all();

    return new Response(JSON.stringify(results[0]), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    console.error('Error creating category:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to create category' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

// DELETE: Delete category
export const onRequestDelete: PagesFunction<Env> = async (context) => {
  const db = context.env.DB;
  const url = new URL(context.request.url);
  const id = url.searchParams.get('id');

  if (!id) {
    return new Response(
      JSON.stringify({ error: 'Category ID is required' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    await db.prepare('DELETE FROM categories WHERE id = ?').bind(id).run();
    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    console.error('Error deleting category:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to delete category' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
