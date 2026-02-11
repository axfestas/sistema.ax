/**
 * Cloudflare Pages Function para gerenciar reservas
 * 
 * Endpoints:
 * - GET /api/reservations - Lista todas as reservas
 * - GET /api/reservations?id=1 - Busca uma reserva específica
 * - POST /api/reservations - Cria nova reserva
 * - PUT /api/reservations?id=1 - Atualiza uma reserva
 * - DELETE /api/reservations?id=1 - Deleta uma reserva
 */

import type { D1Database } from '@cloudflare/workers-types';
import {
  getReservations,
  getReservationById,
  createReservation,
  updateReservation,
  deleteReservation,
  type ReservationInput,
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

    const reservationId = url.searchParams.get('id');

    if (reservationId) {
      const reservation = await getReservationById(db, Number(reservationId));

      if (!reservation) {
        return new Response(
          JSON.stringify({ error: 'Reservation not found' }),
          {
            status: 404,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      return new Response(JSON.stringify(reservation), {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=30',
        },
      });
    }

    const status = url.searchParams.get('status') as
      | 'pending'
      | 'confirmed'
      | 'completed'
      | 'cancelled'
      | null;
    const maxRecords = url.searchParams.get('maxRecords');

    const reservations = await getReservations(db, {
      status: status || undefined,
      maxRecords: maxRecords ? Number(maxRecords) : undefined,
    });

    return new Response(JSON.stringify(reservations), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=30',
      },
    });
  } catch (error: any) {
    console.error('Error fetching reservations:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to fetch reservations',
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
    const body = (await context.request.json()) as ReservationInput;

    if (
      !body.item_id ||
      !body.customer_name ||
      !body.date_from ||
      !body.date_to
    ) {
      return new Response(
        JSON.stringify({
          error:
            'Missing required fields: item_id, customer_name, date_from, date_to',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const newReservation = await createReservation(db, body);

    return new Response(JSON.stringify(newReservation), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error creating reservation:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to create reservation',
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
    const reservationId = url.searchParams.get('id');

    if (!reservationId) {
      return new Response(
        JSON.stringify({ error: 'Missing reservation ID in query params' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const body = (await context.request.json()) as Partial<ReservationInput>;
    const updatedReservation = await updateReservation(
      db,
      Number(reservationId),
      body
    );

    if (!updatedReservation) {
      return new Response(
        JSON.stringify({ error: 'Reservation not found' }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(JSON.stringify(updatedReservation), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error updating reservation:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to update reservation',
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
    const reservationId = url.searchParams.get('id');

    if (!reservationId) {
      return new Response(
        JSON.stringify({ error: 'Missing reservation ID in query params' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const success = await deleteReservation(db, Number(reservationId));

    if (!success) {
      return new Response(
        JSON.stringify({ error: 'Reservation not found' }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(
      JSON.stringify({ message: 'Reservation deleted successfully' }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Error deleting reservation:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to delete reservation',
        message: error.message,
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
