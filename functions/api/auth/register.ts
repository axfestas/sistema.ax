/**
 * POST /api/auth/register
 * Registra novo usuário (APENAS ADMIN)
 */

import type { D1Database, R2Bucket } from '@cloudflare/workers-types';
import { registerUser, requireAdmin } from '../../../src/lib/auth';

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

    // Verifica se é admin antes de permitir registro
    try {
      await requireAdmin(db, context.request);
    } catch (error) {
      return new Response(
        JSON.stringify({
          error: 'Acesso negado. Apenas administradories podem criar usuáries.',
        }),
        {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const body = (await context.request.json()) as {
      email: string;
      password: string;
      name: string;
    };

    if (!body.email || !body.password || !body.name) {
      return new Response(
        JSON.stringify({
          error: 'Missing required fields: email, password, name',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const result = await registerUser(db, body);

    if ('error' in result) {
      return new Response(JSON.stringify({ error: result.error }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(
      JSON.stringify({
        message: 'Usuárie registrade com sucesso',
        user: result.user,
      }),
      {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Error registering user:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to register user',
        message: error.message,
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
