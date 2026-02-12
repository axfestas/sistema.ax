/**
 * Cloudflare Pages Function para verificar disponibilidade de itens
 * 
 * Endpoint:
 * - POST /api/availability - Verifica disponibilidade de um item em um período
 * 
 * Body:
 * {
 *   "item_id": 1,
 *   "date_from": "2026-03-10",
 *   "date_to": "2026-03-12",
 *   "quantity": 2
 * }
 * 
 * Response:
 * {
 *   "available": true,
 *   "quantity_available": 3,
 *   "quantity_blocked": 2,
 *   "total_stock": 5
 * }
 */

import type { D1Database } from '@cloudflare/workers-types';

interface Env {
  DB: D1Database;
}

interface AvailabilityRequest {
  item_id: number;
  date_from: string;
  date_to: string;
  quantity: number;
}

/**
 * POST - Verifica disponibilidade de um item
 */
export async function onRequestPost(context: {
  request: Request;
  env: Env;
}) {
  try {
    const db = context.env.DB;
    const body = (await context.request.json()) as AvailabilityRequest;
    
    // Validar campos obrigatórios
    if (!body.item_id || !body.date_from || !body.date_to || !body.quantity) {
      return new Response(
        JSON.stringify({
          error: 'Campos obrigatórios: item_id, date_from, date_to, quantity',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
    
    // Buscar informações do item
    const item = await db
      .prepare('SELECT id, name, quantity FROM items WHERE id = ?')
      .bind(body.item_id)
      .first();
    
    if (!item) {
      return new Response(
        JSON.stringify({ error: 'Item não encontrado' }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
    
    const totalStock = (item as any).quantity;
    
    // Buscar todas as reservation_items que se sobrepõem ao período solicitado
    // Duas reservas se sobrepõem se:
    // - A nova reserva começa antes da existente terminar E
    // - A nova reserva termina depois da existente começar
    const overlappingReservations = await db
      .prepare(`
        SELECT SUM(ri.quantity) as blocked_quantity
        FROM reservation_items ri
        JOIN reservations r ON ri.reservation_id = r.id
        WHERE ri.item_id = ?
          AND r.status != 'cancelled'
          AND (
            (ri.date_from <= ? AND ri.date_to >= ?)
            OR (ri.date_from <= ? AND ri.date_to >= ?)
            OR (ri.date_from >= ? AND ri.date_to <= ?)
          )
      `)
      .bind(
        body.item_id,
        body.date_to, body.date_from,    // Reserva existente começa antes e termina depois do início
        body.date_to, body.date_to,      // Reserva existente começa antes do fim
        body.date_from, body.date_to     // Reserva existente está completamente dentro do período
      )
      .first();
    
    const blockedQuantity = (overlappingReservations as any)?.blocked_quantity || 0;
    const availableQuantity = totalStock - blockedQuantity;
    const available = availableQuantity >= body.quantity;
    
    return new Response(
      JSON.stringify({
        available,
        quantity_available: availableQuantity,
        quantity_blocked: blockedQuantity,
        total_stock: totalStock,
        item_name: (item as any).name,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Error checking availability:', error);
    return new Response(
      JSON.stringify({
        error: 'Falha ao verificar disponibilidade',
        message: error.message,
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

/**
 * GET - Verifica disponibilidade de um item (query params)
 */
export async function onRequestGet(context: {
  request: Request;
  env: Env;
}) {
  try {
    const db = context.env.DB;
    const url = new URL(context.request.url);
    
    const itemId = url.searchParams.get('item_id');
    const dateFrom = url.searchParams.get('date_from');
    const dateTo = url.searchParams.get('date_to');
    const quantity = url.searchParams.get('quantity');
    
    if (!itemId || !dateFrom || !dateTo || !quantity) {
      return new Response(
        JSON.stringify({
          error: 'Parâmetros obrigatórios: item_id, date_from, date_to, quantity',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
    
    // Reutilizar a lógica do POST
    const body = {
      item_id: parseInt(itemId),
      date_from: dateFrom,
      date_to: dateTo,
      quantity: parseInt(quantity),
    };
    
    // Create a new request with the body
    const newRequest = new Request(context.request, {
      method: 'POST',
      body: JSON.stringify(body),
    });
    
    return onRequestPost({ request: newRequest, env: context.env });
  } catch (error: any) {
    console.error('Error checking availability:', error);
    return new Response(
      JSON.stringify({
        error: 'Falha ao verificar disponibilidade',
        message: error.message,
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
