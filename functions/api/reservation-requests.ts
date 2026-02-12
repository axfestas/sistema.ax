/**
 * API para gerenciar solicitações de reserva do carrinho
 * 
 * GET /api/reservation-requests - Lista todas as solicitações
 * GET /api/reservation-requests?id=1 - Busca uma solicitação específica
 * PUT /api/reservation-requests?id=1 - Atualiza status de uma solicitação
 */

import type { D1Database } from '@cloudflare/workers-types';

interface Env {
  DB: D1Database;
}

interface ReservationRequest {
  id: number;
  custom_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  event_date: string;
  message?: string;
  items_json: string;
  total_amount: number;
  status: string;
  created_at: string;
  updated_at: string;
}

/**
 * GET - Lista todas as solicitações ou busca uma específica
 */
export async function onRequestGet(context: {
  request: Request;
  env: Env;
}) {
  try {
    const url = new URL(context.request.url);
    const db = context.env.DB;
    const requestId = url.searchParams.get('id');
    const status = url.searchParams.get('status');
    const limit = url.searchParams.get('limit');

    if (requestId) {
      // Buscar solicitação específica
      const result = await db
        .prepare('SELECT * FROM reservation_requests WHERE id = ?')
        .bind(requestId)
        .first();

      if (!result) {
        return new Response(
          JSON.stringify({ error: 'Solicitação não encontrada' }),
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        );
      }

      return new Response(JSON.stringify(result), {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=30',
        },
      });
    }

    // Listar todas as solicitações
    let query = 'SELECT * FROM reservation_requests';
    const params: any[] = [];

    if (status) {
      query += ' WHERE status = ?';
      params.push(status);
    }

    query += ' ORDER BY created_at DESC';

    if (limit) {
      query += ' LIMIT ?';
      params.push(parseInt(limit));
    }

    const { results } = await db.prepare(query).bind(...params).all();

    return new Response(JSON.stringify(results), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=30',
      },
    });
  } catch (error: any) {
    console.error('Error fetching reservation requests:', error);
    return new Response(
      JSON.stringify({
        error: 'Erro ao buscar solicitações',
        message: error.message,
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * PUT - Atualiza status de uma solicitação
 */
export async function onRequestPut(context: {
  request: Request;
  env: Env;
}) {
  try {
    const url = new URL(context.request.url);
    const db = context.env.DB;
    const requestId = url.searchParams.get('id');

    if (!requestId) {
      return new Response(
        JSON.stringify({ error: 'ID da solicitação é obrigatório' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const body = await context.request.json() as { status: string };

    if (!body.status) {
      return new Response(
        JSON.stringify({ error: 'Status é obrigatório' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validar status
    const validStatuses = ['pending', 'contacted', 'converted', 'cancelled'];
    if (!validStatuses.includes(body.status)) {
      return new Response(
        JSON.stringify({ error: 'Status inválido' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Atualizar solicitação
    const result = await db
      .prepare(
        'UPDATE reservation_requests SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? RETURNING *'
      )
      .bind(body.status, requestId)
      .first();

    if (!result) {
      return new Response(
        JSON.stringify({ error: 'Solicitação não encontrada' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error updating reservation request:', error);
    return new Response(
      JSON.stringify({
        error: 'Erro ao atualizar solicitação',
        message: error.message,
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
