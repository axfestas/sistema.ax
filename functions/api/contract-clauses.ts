/**
 * Cloudflare Pages Function para gerenciar cláusulas de contratos
 *
 * Endpoints:
 * - GET    /api/contract-clauses        - Lista cláusulas ativas (ou todas com ?all=true)
 * - POST   /api/contract-clauses        - Cria nova cláusula (requer autenticação)
 * - PUT    /api/contract-clauses?id=N   - Atualiza cláusula (requer autenticação)
 * - DELETE /api/contract-clauses?id=N   - Exclui cláusula (requer autenticação)
 */

import type { D1Database } from '@cloudflare/workers-types';
import { getAuthenticatedUser } from '../../src/lib/auth';

interface Env {
  DB: D1Database;
}

export async function onRequestGet(context: { request: Request; env: Env }) {
  try {
    const url = new URL(context.request.url);
    const all = url.searchParams.get('all') === 'true';

    const query = all
      ? 'SELECT * FROM contract_clauses ORDER BY order_num ASC'
      : 'SELECT * FROM contract_clauses WHERE is_active = 1 ORDER BY order_num ASC';

    const result = await context.env.DB.prepare(query).all();
    return new Response(JSON.stringify(result.results), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: 'Erro ao buscar cláusulas', message: msg }), {
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
      order_num?: number;
      title?: string;
      content?: string;
      is_active?: number;
    };

    if (!body.title?.trim() || !body.content?.trim()) {
      return new Response(JSON.stringify({ error: 'Campos obrigatórios: title, content' }), {
        status: 400, headers: { 'Content-Type': 'application/json' },
      });
    }

    const result = await context.env.DB.prepare(
      'INSERT INTO contract_clauses (order_num, title, content, is_active) VALUES (?, ?, ?, ?) RETURNING *'
    )
      .bind(
        body.order_num ?? 0,
        body.title.trim(),
        body.content.trim(),
        body.is_active ?? 1,
      )
      .first();

    return new Response(JSON.stringify(result), {
      status: 201, headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: 'Erro ao criar cláusula', message: msg }), {
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
      return new Response(JSON.stringify({ error: 'Parâmetro id obrigatório' }), {
        status: 400, headers: { 'Content-Type': 'application/json' },
      });
    }

    const body = await context.request.json() as {
      order_num?: number;
      title?: string;
      content?: string;
      is_active?: number;
    };

    if (!body.title?.trim() || !body.content?.trim()) {
      return new Response(JSON.stringify({ error: 'Campos obrigatórios: title, content' }), {
        status: 400, headers: { 'Content-Type': 'application/json' },
      });
    }

    const updated = await context.env.DB.prepare(
      `UPDATE contract_clauses
       SET order_num = ?, title = ?, content = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ? RETURNING *`
    )
      .bind(
        body.order_num ?? 0,
        body.title.trim(),
        body.content.trim(),
        body.is_active ?? 1,
        Number(id),
      )
      .first();

    if (!updated) {
      return new Response(JSON.stringify({ error: 'Cláusula não encontrada' }), {
        status: 404, headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify(updated), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: 'Erro ao atualizar cláusula', message: msg }), {
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
      return new Response(JSON.stringify({ error: 'Parâmetro id obrigatório' }), {
        status: 400, headers: { 'Content-Type': 'application/json' },
      });
    }

    const info = await context.env.DB.prepare(
      'DELETE FROM contract_clauses WHERE id = ?'
    ).bind(Number(id)).run();

    if (!info.meta?.changes) {
      return new Response(JSON.stringify({ error: 'Cláusula não encontrada' }), {
        status: 404, headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ message: 'Cláusula excluída com sucesso' }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: 'Erro ao excluir cláusula', message: msg }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    });
  }
}
