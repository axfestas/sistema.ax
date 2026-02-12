/**
 * Cloudflare Pages Function para gerenciar itens
 * 
 * Endpoints:
 * - GET /api/items - Lista todos os itens
 * - GET /api/items?id=1 - Busca um item específico
 * - POST /api/items - Cria novo item
 * - PUT /api/items?id=1 - Atualiza um item
 * - DELETE /api/items?id=1 - Deleta um item
 */

import type { D1Database, R2Bucket } from '@cloudflare/workers-types';
import {
  getItems,
  getItemById,
  createItem,
  updateItem,
  deleteItem,
  type ItemInput,
  type Item,
} from '../../src/lib/db';

interface Env {
  DB: D1Database;
  STORAGE?: R2Bucket; // Optional for backward compatibility
}

export async function onRequestGet(context: {
  request: Request;
  env: Env;
}) {
  try {
    const url = new URL(context.request.url);
    const db = context.env.DB;

    const itemId = url.searchParams.get('id');

    if (itemId) {
      const item = await getItemById(db, Number(itemId));

      if (!item) {
        return new Response(JSON.stringify({ error: 'Item not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify(item), {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=60',
        },
      });
    }

    const status = url.searchParams.get('status') as
      | 'available'
      | 'reserved'
      | 'maintenance'
      | null;
    const catalogOnly = url.searchParams.get('catalogOnly') === 'true';
    const maxRecords = url.searchParams.get('maxRecords');

    const items = await getItems(db, {
      status: status || undefined,
      catalogOnly,
      maxRecords: maxRecords ? Number(maxRecords) : undefined,
    });

    return new Response(JSON.stringify(items), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=60',
      },
    });
  } catch (error: any) {
    console.error('Error fetching items:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to fetch items',
        message: error.message,
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

export async function onRequestPost(context: {
  request: Request;
  env: Env;
}) {
  try {
    const db = context.env.DB;
    const body = (await context.request.json()) as ItemInput;

    if (!body.name || body.price === undefined || body.quantity === undefined) {
      return new Response(
        JSON.stringify({
          error: 'Missing required fields: name, price, quantity',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const newItem = await createItem(db, body);

    return new Response(JSON.stringify(newItem), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error creating item:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to create item',
        message: error.message,
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

export async function onRequestPut(context: {
  request: Request;
  env: Env;
}) {
  try {
    const url = new URL(context.request.url);
    const db = context.env.DB;
    const itemId = url.searchParams.get('id');

    if (!itemId) {
      return new Response(
        JSON.stringify({ error: 'Missing item ID in query params' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const body = (await context.request.json()) as Partial<ItemInput>;
    const updatedItem = await updateItem(db, Number(itemId), body);

    if (!updatedItem) {
      return new Response(JSON.stringify({ error: 'Item not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify(updatedItem), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error updating item:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to update item',
        message: error.message,
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

export async function onRequestDelete(context: {
  request: Request;
  env: Env;
}) {
  try {
    const url = new URL(context.request.url);
    const db = context.env.DB;
    const itemId = url.searchParams.get('id');

    if (!itemId) {
      return new Response(
        JSON.stringify({ error: 'Missing item ID in query params' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const success = await deleteItem(db, Number(itemId));

    if (!success) {
      return new Response(JSON.stringify({ error: 'Item not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ message: 'Item deleted successfully' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error deleting item:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to delete item',
        message: error.message,
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
