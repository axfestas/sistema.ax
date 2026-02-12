/**
 * API endpoint for managing designs
 * Path: /api/designs
 * 
 * Supports:
 * - GET: List all designs (with optional catalog filter)
 * - POST: Create new design
 * - PUT: Update design
 * - DELETE: Delete design
 */

interface Env {
  DB: D1Database;
}

export interface Design {
  id: number;
  name: string;
  description?: string;
  price: number;
  image_url?: string;
  category?: string;
  is_active: number;
  show_in_catalog: number;
  created_at: number;
}

export interface DesignInput {
  name: string;
  description?: string;
  price: number;
  image_url?: string;
  category?: string;
  show_in_catalog?: number;
}

// GET: List all designs
export const onRequestGet: PagesFunction<Env> = async (context) => {
  const db = context.env.DB;
  const url = new URL(context.request.url);
  const catalogOnly = url.searchParams.get('catalog') === 'true';

  try {
    let query = 'SELECT * FROM designs WHERE is_active = 1';
    
    if (catalogOnly) {
      query += ' AND show_in_catalog = 1';
    }
    
    query += ' ORDER BY created_at DESC';

    const { results } = await db.prepare(query).all();

    return new Response(JSON.stringify(results), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    console.error('Error fetching designs:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch designs' }), 
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

// POST: Create new design
export const onRequestPost: PagesFunction<Env> = async (context) => {
  const db = context.env.DB;

  try {
    const body = await context.request.json() as DesignInput;

    // Validate required fields
    if (!body.name || body.price === undefined) {
      return new Response(
        JSON.stringify({ error: 'Name and price are required' }), 
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Insert new design
    const result = await db
      .prepare(`
        INSERT INTO designs (name, description, price, image_url, category, show_in_catalog)
        VALUES (?, ?, ?, ?, ?, ?)
      `)
      .bind(
        body.name,
        body.description || null,
        body.price,
        body.image_url || null,
        body.category || null,
        body.show_in_catalog !== undefined ? body.show_in_catalog : 1
      )
      .run();

    // Get the created design
    const { results } = await db
      .prepare('SELECT * FROM designs WHERE id = ?')
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
    console.error('Error creating design:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to create design' }), 
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

// PUT: Update design
export const onRequestPut: PagesFunction<Env> = async (context) => {
  const db = context.env.DB;

  try {
    const body = await context.request.json() as Design;

    if (!body.id) {
      return new Response(
        JSON.stringify({ error: 'Design ID is required' }), 
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Update design
    await db
      .prepare(`
        UPDATE designs 
        SET name = ?, description = ?, price = ?, image_url = ?, 
            category = ?, show_in_catalog = ?
        WHERE id = ?
      `)
      .bind(
        body.name,
        body.description || null,
        body.price,
        body.image_url || null,
        body.category || null,
        body.show_in_catalog,
        body.id
      )
      .run();

    // Get the updated design
    const { results } = await db
      .prepare('SELECT * FROM designs WHERE id = ?')
      .bind(body.id)
      .all();

    return new Response(
      JSON.stringify(results[0]), 
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error: unknown) {
    console.error('Error updating design:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to update design' }), 
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

// DELETE: Soft delete design
export const onRequestDelete: PagesFunction<Env> = async (context) => {
  const db = context.env.DB;
  const url = new URL(context.request.url);
  const id = url.searchParams.get('id');

  if (!id) {
    return new Response(
      JSON.stringify({ error: 'Design ID is required' }), 
      { 
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  try {
    // Soft delete (set is_active to 0)
    await db
      .prepare('UPDATE designs SET is_active = 0 WHERE id = ?')
      .bind(id)
      .run();

    return new Response(
      JSON.stringify({ success: true }), 
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error: unknown) {
    console.error('Error deleting design:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to delete design' }), 
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
