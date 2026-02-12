/**
 * API endpoint for managing sweets
 * Path: /api/sweets
 * 
 * Supports:
 * - GET: List all sweets (with optional catalog filter)
 * - POST: Create new sweet
 * - PUT: Update sweet
 * - DELETE: Delete sweet
 */

interface Env {
  DB: D1Database;
}

export interface Sweet {
  id: number;
  name: string;
  description?: string;
  price: number;
  quantity: number;
  image_url?: string;
  category?: string;
  is_active: number;
  show_in_catalog: number;
  created_at: number;
}

export interface SweetInput {
  name: string;
  description?: string;
  price: number;
  quantity: number;
  image_url?: string;
  category?: string;
  show_in_catalog?: number;
}

// GET: List all sweets
export const onRequestGet: PagesFunction<Env> = async (context) => {
  const db = context.env.DB;
  const url = new URL(context.request.url);
  const catalogOnly = url.searchParams.get('catalog') === 'true';

  try {
    let query = 'SELECT * FROM sweets WHERE is_active = 1';
    
    if (catalogOnly) {
      query += ' AND show_in_catalog = 1';
    }
    
    query += ' ORDER BY created_at DESC';

    const { results } = await db.prepare(query).all();

    return new Response(JSON.stringify(results), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    console.error('Error fetching sweets:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch sweets' }), 
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

// POST: Create new sweet
export const onRequestPost: PagesFunction<Env> = async (context) => {
  const db = context.env.DB;

  try {
    const body = await context.request.json() as SweetInput;

    // Validate required fields
    if (!body.name || body.price === undefined || body.quantity === undefined) {
      return new Response(
        JSON.stringify({ error: 'Name, price, and quantity are required' }), 
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Insert new sweet
    const result = await db
      .prepare(`
        INSERT INTO sweets (name, description, price, quantity, image_url, category, show_in_catalog)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `)
      .bind(
        body.name,
        body.description || null,
        body.price,
        body.quantity,
        body.image_url || null,
        body.category || null,
        body.show_in_catalog !== undefined ? body.show_in_catalog : 1
      )
      .run();

    // Get the created sweet
    const { results } = await db
      .prepare('SELECT * FROM sweets WHERE id = ?')
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
    console.error('Error creating sweet:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to create sweet' }), 
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

// PUT: Update sweet
export const onRequestPut: PagesFunction<Env> = async (context) => {
  const db = context.env.DB;

  try {
    const body = await context.request.json() as Sweet;

    if (!body.id) {
      return new Response(
        JSON.stringify({ error: 'Sweet ID is required' }), 
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Update sweet
    await db
      .prepare(`
        UPDATE sweets 
        SET name = ?, description = ?, price = ?, quantity = ?, 
            image_url = ?, category = ?, show_in_catalog = ?
        WHERE id = ?
      `)
      .bind(
        body.name,
        body.description || null,
        body.price,
        body.quantity,
        body.image_url || null,
        body.category || null,
        body.show_in_catalog,
        body.id
      )
      .run();

    // Get the updated sweet
    const { results } = await db
      .prepare('SELECT * FROM sweets WHERE id = ?')
      .bind(body.id)
      .all();

    return new Response(
      JSON.stringify(results[0]), 
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error: unknown) {
    console.error('Error updating sweet:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to update sweet' }), 
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

// DELETE: Soft delete sweet
export const onRequestDelete: PagesFunction<Env> = async (context) => {
  const db = context.env.DB;
  const url = new URL(context.request.url);
  const id = url.searchParams.get('id');

  if (!id) {
    return new Response(
      JSON.stringify({ error: 'Sweet ID is required' }), 
      { 
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  try {
    // Soft delete (set is_active to 0)
    await db
      .prepare('UPDATE sweets SET is_active = 0 WHERE id = ?')
      .bind(id)
      .run();

    return new Response(
      JSON.stringify({ success: true }), 
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error: unknown) {
    console.error('Error deleting sweet:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to delete sweet' }), 
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
