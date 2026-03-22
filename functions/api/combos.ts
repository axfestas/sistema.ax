/**
 * Cloudflare Pages Function para gerenciar combos promocionais
 *
 * Endpoints:
 * - GET  /api/combos           - Lista combos (público para ativos; admin para todos)
 * - POST /api/combos           - Cria novo combo (requer autenticação)
 * - PUT  /api/combos?id=N      - Atualiza combo (requer autenticação)
 * - DELETE /api/combos?id=N    - Deleta combo (requer autenticação)
 */

import type { D1Database } from '@cloudflare/workers-types';
import { getAuthenticatedUser } from '../../src/lib/auth';

interface Env {
  DB: D1Database;
}

export interface ComboItem {
  id?: number;
  combo_id?: number;
  product_type: 'item' | 'kit' | 'sweet' | 'design' | 'theme';
  product_id: number;
  product_name?: string;
  required_quantity: number;
}

export interface ComboCategory {
  id?: number;
  combo_id?: number;
  category_name: string;
  product_section: 'items' | 'sweets' | 'designs' | 'themes';
}

export interface Combo {
  id: number;
  name: string;
  type: 'products' | 'category' | 'mixed';
  discount_type: 'fixed_price' | 'percentage' | 'fixed_amount';
  discount_value: number;
  min_quantity: number;
  priority: number;
  is_active: number;
  created_at: string;
  updated_at: string;
  items?: ComboItem[];
  categories?: ComboCategory[];
}

async function getComboWithRelations(db: D1Database, comboId: number): Promise<Combo | null> {
  const combo = await db.prepare('SELECT * FROM combos WHERE id = ?').bind(comboId).first() as Combo | null;
  if (!combo) return null;

  const items = await db.prepare('SELECT * FROM combo_items WHERE combo_id = ?').bind(comboId).all();
  const categories = await db.prepare('SELECT * FROM combo_categories WHERE combo_id = ?').bind(comboId).all();

  return {
    ...combo,
    items: (items.results as unknown as ComboItem[]) || [],
    categories: (categories.results as unknown as ComboCategory[]) || [],
  };
}

export async function onRequestGet(context: { request: Request; env: Env }) {
  try {
    const url = new URL(context.request.url);
    const onlyActive = url.searchParams.get('active') === 'true';
    const id = url.searchParams.get('id');

    if (id) {
      const combo = await getComboWithRelations(context.env.DB, Number(id));
      if (!combo) {
        return new Response(JSON.stringify({ error: 'Combo not found' }), {
          status: 404, headers: { 'Content-Type': 'application/json' },
        });
      }
      return new Response(JSON.stringify(combo), { headers: { 'Content-Type': 'application/json' } });
    }

    let query = 'SELECT * FROM combos';
    if (onlyActive) query += ' WHERE is_active = 1';
    query += ' ORDER BY priority DESC, name ASC';

    const combosResult = await context.env.DB.prepare(query).all();
    const combos = combosResult.results as unknown as Combo[];

    // Attach items and categories to each combo
    const enriched = await Promise.all(
      combos.map(async (combo) => {
        const items = await context.env.DB.prepare('SELECT * FROM combo_items WHERE combo_id = ?').bind(combo.id).all();
        const categories = await context.env.DB.prepare('SELECT * FROM combo_categories WHERE combo_id = ?').bind(combo.id).all();
        return {
          ...combo,
          items: (items.results as unknown as ComboItem[]) || [],
          categories: (categories.results as unknown as ComboCategory[]) || [],
        };
      })
    );

    return new Response(JSON.stringify(enriched), { headers: { 'Content-Type': 'application/json' } });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: 'Failed to fetch combos', message: msg }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    });
  }
}

export async function onRequestPost(context: { request: Request; env: Env }) {
  try {
    const user = await getAuthenticatedUser(context.env.DB, context.request);
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { 'Content-Type': 'application/json' },
      });
    }

    const body = await context.request.json() as {
      name?: string;
      type?: string;
      discount_type?: string;
      discount_value?: number;
      min_quantity?: number;
      priority?: number;
      is_active?: number;
      items?: ComboItem[];
      categories?: ComboCategory[];
    };

    if (!body.name || !body.type || !body.discount_type) {
      return new Response(JSON.stringify({ error: 'Campos obrigatórios: name, type, discount_type' }), {
        status: 400, headers: { 'Content-Type': 'application/json' },
      });
    }

    const validTypes = ['products', 'category', 'mixed'];
    const validDiscountTypes = ['fixed_price', 'percentage', 'fixed_amount'];
    if (!validTypes.includes(body.type) || !validDiscountTypes.includes(body.discount_type)) {
      return new Response(JSON.stringify({ error: 'Tipo inválido' }), {
        status: 400, headers: { 'Content-Type': 'application/json' },
      });
    }

    const result = await context.env.DB.prepare(
      `INSERT INTO combos (name, type, discount_type, discount_value, min_quantity, priority, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING *`
    ).bind(
      body.name.trim(),
      body.type,
      body.discount_type,
      body.discount_value ?? 0,
      body.min_quantity ?? 1,
      body.priority ?? 0,
      body.is_active ?? 1
    ).first() as Combo | null;

    if (!result) {
      return new Response(JSON.stringify({ error: 'Failed to create combo' }), {
        status: 500, headers: { 'Content-Type': 'application/json' },
      });
    }

    const comboId = result.id;

    // Insert combo items
    if (body.items && body.items.length > 0) {
      for (const item of body.items) {
        await context.env.DB.prepare(
          'INSERT INTO combo_items (combo_id, product_type, product_id, product_name, required_quantity) VALUES (?, ?, ?, ?, ?)'
        ).bind(comboId, item.product_type, item.product_id, item.product_name || null, item.required_quantity || 1).run();
      }
    }

    // Insert combo categories
    if (body.categories && body.categories.length > 0) {
      for (const cat of body.categories) {
        await context.env.DB.prepare(
          'INSERT INTO combo_categories (combo_id, category_name, product_section) VALUES (?, ?, ?)'
        ).bind(comboId, cat.category_name, cat.product_section || 'items').run();
      }
    }

    const created = await getComboWithRelations(context.env.DB, comboId);
    return new Response(JSON.stringify(created), {
      status: 201, headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: 'Failed to create combo', message: msg }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    });
  }
}

export async function onRequestPut(context: { request: Request; env: Env }) {
  try {
    const user = await getAuthenticatedUser(context.env.DB, context.request);
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { 'Content-Type': 'application/json' },
      });
    }

    const url = new URL(context.request.url);
    const id = url.searchParams.get('id');
    if (!id) {
      return new Response(JSON.stringify({ error: 'Missing id parameter' }), {
        status: 400, headers: { 'Content-Type': 'application/json' },
      });
    }

    const body = await context.request.json() as {
      name?: string;
      type?: string;
      discount_type?: string;
      discount_value?: number;
      min_quantity?: number;
      priority?: number;
      is_active?: number;
      items?: ComboItem[];
      categories?: ComboCategory[];
    };

    const existing = await context.env.DB.prepare('SELECT * FROM combos WHERE id = ?').bind(Number(id)).first() as Combo | null;
    if (!existing) {
      return new Response(JSON.stringify({ error: 'Combo not found' }), {
        status: 404, headers: { 'Content-Type': 'application/json' },
      });
    }

    await context.env.DB.prepare(
      `UPDATE combos SET name = ?, type = ?, discount_type = ?, discount_value = ?,
       min_quantity = ?, priority = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`
    ).bind(
      body.name ?? existing.name,
      body.type ?? existing.type,
      body.discount_type ?? existing.discount_type,
      body.discount_value ?? existing.discount_value,
      body.min_quantity ?? existing.min_quantity,
      body.priority ?? existing.priority,
      body.is_active ?? existing.is_active,
      Number(id)
    ).run();

    // Replace items if provided
    if (body.items !== undefined) {
      await context.env.DB.prepare('DELETE FROM combo_items WHERE combo_id = ?').bind(Number(id)).run();
      for (const item of body.items) {
        await context.env.DB.prepare(
          'INSERT INTO combo_items (combo_id, product_type, product_id, product_name, required_quantity) VALUES (?, ?, ?, ?, ?)'
        ).bind(Number(id), item.product_type, item.product_id, item.product_name || null, item.required_quantity || 1).run();
      }
    }

    // Replace categories if provided
    if (body.categories !== undefined) {
      await context.env.DB.prepare('DELETE FROM combo_categories WHERE combo_id = ?').bind(Number(id)).run();
      for (const cat of body.categories) {
        await context.env.DB.prepare(
          'INSERT INTO combo_categories (combo_id, category_name, product_section) VALUES (?, ?, ?)'
        ).bind(Number(id), cat.category_name, cat.product_section || 'items').run();
      }
    }

    const updated = await getComboWithRelations(context.env.DB, Number(id));
    return new Response(JSON.stringify(updated), { headers: { 'Content-Type': 'application/json' } });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: 'Failed to update combo', message: msg }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    });
  }
}

export async function onRequestDelete(context: { request: Request; env: Env }) {
  try {
    const user = await getAuthenticatedUser(context.env.DB, context.request);
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { 'Content-Type': 'application/json' },
      });
    }

    const url = new URL(context.request.url);
    const id = url.searchParams.get('id');
    if (!id) {
      return new Response(JSON.stringify({ error: 'Missing id parameter' }), {
        status: 400, headers: { 'Content-Type': 'application/json' },
      });
    }

    const info = await context.env.DB.prepare('DELETE FROM combos WHERE id = ?').bind(Number(id)).run();
    if (!info.meta?.changes) {
      return new Response(JSON.stringify({ error: 'Combo not found' }), {
        status: 404, headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ message: 'Combo deleted' }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: 'Failed to delete combo', message: msg }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    });
  }
}
