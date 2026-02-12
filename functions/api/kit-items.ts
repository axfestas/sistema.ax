/**
 * Cloudflare Pages Function para gerenciar itens de kits
 * 
 * Endpoints:
 * - GET /api/kit-items?kit_id=1 - Lista itens de um kit
 * - POST /api/kit-items - Adiciona um item a um kit
 * - PUT /api/kit-items?id=1 - Atualiza quantidade de um item no kit
 * - DELETE /api/kit-items?id=1 - Remove um item de um kit
 */

import type { D1Database } from '@cloudflare/workers-types';
import {
  getKitItems,
  addItemToKit,
  updateKitItem,
  removeItemFromKit,
  type KitItemInput,
} from '../../src/lib/db';

interface Env {
  DB: D1Database;
}

export async function onRequestGet(context: {
  request: Request;
  env: Env;
}) {
  try {
    const url = new URL(context.request.url);
    const db = context.env.DB;
    const kitId = url.searchParams.get('kit_id');

    if (!kitId) {
      return new Response(
        JSON.stringify({ error: 'Missing kit_id parameter' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const items = await getKitItems(db, Number(kitId));

    return new Response(JSON.stringify(items), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=60',
      },
    });
  } catch (error: any) {
    console.error('Error fetching kit items:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to fetch kit items',
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
    const body = (await context.request.json()) as KitItemInput;

    if (!body.kit_id || !body.item_id || !body.quantity) {
      return new Response(
        JSON.stringify({
          error: 'Missing required fields: kit_id, item_id, quantity',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const newKitItem = await addItemToKit(db, body);

    return new Response(JSON.stringify(newKitItem), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error adding item to kit:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to add item to kit',
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
    const kitItemId = url.searchParams.get('id');

    if (!kitItemId) {
      return new Response(
        JSON.stringify({ error: 'Missing kit item ID in query params' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const body = (await context.request.json()) as { quantity: number };

    if (!body.quantity) {
      return new Response(
        JSON.stringify({ error: 'Missing quantity field' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const updatedKitItem = await updateKitItem(
      db,
      Number(kitItemId),
      body.quantity
    );

    if (!updatedKitItem) {
      return new Response(JSON.stringify({ error: 'Kit item not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify(updatedKitItem), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error updating kit item:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to update kit item',
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
    const kitItemId = url.searchParams.get('id');

    if (!kitItemId) {
      return new Response(
        JSON.stringify({ error: 'Missing kit item ID in query params' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const success = await removeItemFromKit(db, Number(kitItemId));

    if (!success) {
      return new Response(JSON.stringify({ error: 'Kit item not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error deleting kit item:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to delete kit item',
        message: error.message,
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
