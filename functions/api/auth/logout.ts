/**
 * POST /api/auth/logout
 * Faz logout deletando a sessão
 */

import { deleteSession, getSessionIdFromRequest } from '../../../src/lib/auth';

interface Env {
  DB: D1Database;
}

export async function onRequestPost(context: {
  request: Request;
  env: Env;
}) {
  try {
    const db = context.env.DB;
    const sessionId = getSessionIdFromRequest(context.request);

    if (sessionId) {
      await deleteSession(db, sessionId);
    }

    return new Response(
      JSON.stringify({ message: 'Logout bem-sucedido' }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Set-Cookie': 'session_id=; Path=/; HttpOnly; Max-Age=0',
        },
      }
    );
  } catch (error: any) {
    console.error('Error logging out:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to logout',
        message: error.message,
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
