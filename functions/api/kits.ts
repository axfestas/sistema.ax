/**
 * Cloudflare Pages Function para gerenciar kits
 * 
 * Endpoints:
 * - GET /api/kits - Lista todos os kits
 * - GET /api/kits?id=1 - Busca um kit específico (com itens)
 * - POST /api/kits - Cria novo kit
 * - PUT /api/kits?id=1 - Atualiza um kit
 * - DELETE /api/kits?id=1 - Deleta um kit
 */

import type { D1Database } from '@cloudflare/workers-types';
import {
  getKits,
  getKitById,
  getKitWithItems,
  getKitsWithItems,
  createKit,
  updateKit,
  deleteKit,
  addItemToKit,
  removeItemFromKit,
  updateKitItem,
  getKitItems,
  type KitInput,
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

    const kitId = url.searchParams.get('id');

    if (kitId) {
      const kit = await getKitWithItems(db, Number(kitId));

      if (!kit) {
        return new Response(JSON.stringify({ error: 'Kit not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify(kit), {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=60',
        },
      });
    }

    const activeOnly = url.searchParams.get('activeOnly') === 'true';
    const maxRecords = url.searchParams.get('maxRecords');

    // When activeOnly is true (used by catalog), return kits with their items
    const kits = activeOnly 
      ? await getKitsWithItems(db, {
          activeOnly,
          maxRecords: maxRecords ? Number(maxRecords) : undefined,
        })
      : await getKits(db, {
          activeOnly,
          maxRecords: maxRecords ? Number(maxRecords) : undefined,
        });

    return new Response(JSON.stringify(kits), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=60',
      },
    });
  } catch (error: any) {
    console.error('Error fetching kits:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to fetch kits',
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
    const body = (await context.request.json()) as KitInput;

    if (!body.name || !body.price) {
      return new Response(
        JSON.stringify({
          error: 'Missing required fields: name, price',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const newKit = await createKit(db, body);

    return new Response(JSON.stringify(newKit), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error creating kit:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to create kit',
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
    const kitId = url.searchParams.get('id');

    if (!kitId) {
      return new Response(
        JSON.stringify({ error: 'Missing kit ID in query params' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const body = (await context.request.json()) as Partial<KitInput>;
    const updatedKit = await updateKit(db, Number(kitId), body);

    if (!updatedKit) {
      return new Response(JSON.stringify({ error: 'Kit not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify(updatedKit), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error updating kit:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to update kit',
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
    const kitId = url.searchParams.get('id');

    if (!kitId) {
      return new Response(
        JSON.stringify({ error: 'Missing kit ID in query params' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const success = await deleteKit(db, Number(kitId));

    if (!success) {
      return new Response(JSON.stringify({ error: 'Kit not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error deleting kit:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to delete kit',
        message: error.message,
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
