/**
 * Cloudflare Pages Function para gerenciar sugestões
 *
 * Endpoints:
 * - GET  /api/suggestions           - Lista sugestões (requer autenticação)
 * - POST /api/suggestions           - Cria nova sugestão (público)
 * - PUT  /api/suggestions?id=N      - Atualiza status (requer autenticação)
 * - DELETE /api/suggestions?id=N    - Deleta sugestão (requer autenticação)
 */

import type { D1Database } from '@cloudflare/workers-types';
import { getAuthenticatedUser } from '../../src/lib/auth';

interface Env {
  DB: D1Database;
}

export async function onRequestGet(context: { request: Request; env: Env }) {
  try {
    const user = await getAuthenticatedUser(context.env.DB, context.request);
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { 'Content-Type': 'application/json' },
      });
    }
    const url = new URL(context.request.url);
    const status = url.searchParams.get('status');
    let query = 'SELECT * FROM suggestions';
    const params: string[] = [];
    if (status && status !== 'all') {
      query += ' WHERE status = ?';
      params.push(status);
    }
    query += ' ORDER BY created_at DESC';
    const result = await context.env.DB.prepare(query).bind(...params).all();
    return new Response(JSON.stringify(result.results), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: 'Failed to fetch suggestions', message: msg }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    });
  }
}

export async function onRequestPost(context: { request: Request; env: Env }) {
  try {
    const body = await context.request.json() as { name?: string; email?: string; message?: string };
    if (!body.name || !body.message) {
      return new Response(JSON.stringify({ error: 'Campos obrigatórios: name, message' }), {
        status: 400, headers: { 'Content-Type': 'application/json' },
      });
    }
    const result = await context.env.DB.prepare(
      'INSERT INTO suggestions (name, email, message) VALUES (?, ?, ?) RETURNING *'
    ).bind(body.name.trim(), body.email?.trim() || null, body.message.trim()).first();
    return new Response(JSON.stringify(result), {
      status: 201, headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: 'Failed to create suggestion', message: msg }), {
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
    const body = await context.request.json() as { status?: string };
    const allowed = ['pending', 'read', 'archived'];
    if (!body.status || !allowed.includes(body.status)) {
      return new Response(JSON.stringify({ error: 'status inválido' }), {
        status: 400, headers: { 'Content-Type': 'application/json' },
      });
    }
    const updated = await context.env.DB.prepare(
      'UPDATE suggestions SET status = ? WHERE id = ? RETURNING *'
    ).bind(body.status, Number(id)).first();
    if (!updated) {
      return new Response(JSON.stringify({ error: 'Suggestion not found' }), {
        status: 404, headers: { 'Content-Type': 'application/json' },
      });
    }
    return new Response(JSON.stringify(updated), { headers: { 'Content-Type': 'application/json' } });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: 'Failed to update suggestion', message: msg }), {
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
    const info = await context.env.DB.prepare('DELETE FROM suggestions WHERE id = ?').bind(Number(id)).run();
    if (!info.meta?.changes) {
      return new Response(JSON.stringify({ error: 'Suggestion not found' }), {
        status: 404, headers: { 'Content-Type': 'application/json' },
      });
    }
    return new Response(JSON.stringify({ message: 'Suggestion deleted' }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: 'Failed to delete suggestion', message: msg }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    });
  }
}
