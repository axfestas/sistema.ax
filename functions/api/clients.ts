/**
 * API endpoint for managing clients
 * Path: /api/clients
 * 
 * Supports:
 * - GET: List all clients
 * - POST: Create new client
 * - PUT: Update client
 * - DELETE: Delete client
 */

interface Env {
  DB: D1Database;
}

export interface Client {
  id: number;
  name: string;
  email?: string;
  phone: string;
  cpf?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  notes?: string;
  is_active: number;
  created_at: number;
}

export interface ClientInput {
  name: string;
  email?: string;
  phone: string;
  cpf?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  notes?: string;
}

// GET: List all clients
export const onRequestGet: PagesFunction<Env> = async (context) => {
  const db = context.env.DB;

  try {
    const { results } = await db
      .prepare('SELECT * FROM clients WHERE is_active = 1 ORDER BY created_at DESC')
      .all();

    return new Response(JSON.stringify(results), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    console.error('Error fetching clients:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch clients' }), 
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

// POST: Create new client
export const onRequestPost: PagesFunction<Env> = async (context) => {
  const db = context.env.DB;

  try {
    const body = await context.request.json() as ClientInput;

    // Validate required fields
    if (!body.name || !body.phone) {
      return new Response(
        JSON.stringify({ error: 'Name and phone are required' }), 
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Insert new client
    const result = await db
      .prepare(`
        INSERT INTO clients (name, email, phone, cpf, address, city, state, zip_code, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .bind(
        body.name,
        body.email || null,
        body.phone,
        body.cpf || null,
        body.address || null,
        body.city || null,
        body.state || null,
        body.zip_code || null,
        body.notes || null
      )
      .run();

    // Get the created client
    const { results } = await db
      .prepare('SELECT * FROM clients WHERE id = ?')
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
    console.error('Error creating client:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to create client' }), 
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

// PUT: Update client
export const onRequestPut: PagesFunction<Env> = async (context) => {
  const db = context.env.DB;

  try {
    const body = await context.request.json() as Client;

    if (!body.id) {
      return new Response(
        JSON.stringify({ error: 'Client ID is required' }), 
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Update client
    await db
      .prepare(`
        UPDATE clients 
        SET name = ?, email = ?, phone = ?, cpf = ?, address = ?, 
            city = ?, state = ?, zip_code = ?, notes = ?
        WHERE id = ?
      `)
      .bind(
        body.name,
        body.email || null,
        body.phone,
        body.cpf || null,
        body.address || null,
        body.city || null,
        body.state || null,
        body.zip_code || null,
        body.notes || null,
        body.id
      )
      .run();

    // Get the updated client
    const { results } = await db
      .prepare('SELECT * FROM clients WHERE id = ?')
      .bind(body.id)
      .all();

    return new Response(
      JSON.stringify(results[0]), 
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error: unknown) {
    console.error('Error updating client:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to update client' }), 
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

// DELETE: Soft delete client
export const onRequestDelete: PagesFunction<Env> = async (context) => {
  const db = context.env.DB;
  const url = new URL(context.request.url);
  const id = url.searchParams.get('id');

  if (!id) {
    return new Response(
      JSON.stringify({ error: 'Client ID is required' }), 
      { 
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  try {
    // Soft delete (set is_active to 0)
    await db
      .prepare('UPDATE clients SET is_active = 0 WHERE id = ?')
      .bind(id)
      .run();

    return new Response(
      JSON.stringify({ success: true }), 
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error: unknown) {
    console.error('Error deleting client:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to delete client' }), 
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
