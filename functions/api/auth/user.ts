/**
 * GET /api/auth/user
 * Retorna dados do usuário autenticado
 */

import type { D1Database } from '@cloudflare/workers-types';
import { getAuthenticatedUser } from '../../../src/lib/auth';

interface Env {
  DB: D1Database;
}

export async function onRequestGet(context: {
  request: Request;
  env: Env;
}) {
  try {
    const db = context.env.DB;
    const user = await getAuthenticatedUser(db, context.request);

    if (!user) {
      return new Response(
        JSON.stringify({
          authenticated: false,
          user: null,
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(
      JSON.stringify({
        authenticated: true,
        user,
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
        },
      }
    );
  } catch (error: any) {
    console.error('Error getting user:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to get user',
        message: error.message,
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
