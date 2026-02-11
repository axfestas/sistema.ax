/**
 * POST /api/auth/login
 * Faz login com email e senha
 * Retorna session cookie
 */

import type { D1Database, R2Bucket } from '@cloudflare/workers-types';
import { loginUser, createSession } from '../../../src/lib/auth';

interface Env {
  DB: D1Database;
  STORAGE?: R2Bucket; // Optional for backward compatibility
}

export async function onRequestPost(context: {
  request: Request;
  env: Env;
}) {
  try {
    const db = context.env.DB;
    const body = (await context.request.json()) as {
      email: string;
      password: string;
    };

    if (!body.email || !body.password) {
      return new Response(
        JSON.stringify({
          error: 'Missing required fields: email, password',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Fazer login
    const loginResult = await loginUser(db, body);

    if ('error' in loginResult) {
      return new Response(JSON.stringify({ error: loginResult.error }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Criar sessão
    const session = await createSession(db, loginResult.user.id, 24);

    // Retornar com cookie
    return new Response(
      JSON.stringify({
        message: 'Login bem-sucedido',
        user: loginResult.user,
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Set-Cookie': `session_id=${session.id}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=86400`,
        },
      }
    );
  } catch (error: any) {
    console.error('Error logging in:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to login',
        message: error.message,
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
