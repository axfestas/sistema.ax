/**
 * POST /api/auth/create-first-admin
 * Endpoint especial para criar o primeiro admin
 * 
 * SEGURANÇA:
 * - Só funciona se não houver nenhum admin no banco
 * - Requer uma chave secreta configurada em variável de ambiente
 * - Deve ser deletado após criar o primeiro admin
 */

import type { D1Database } from '@cloudflare/workers-types';
import { registerUser, getUserByEmail } from '../../../src/lib/auth';

interface Env {
  DB: D1Database;
  FIRST_ADMIN_SECRET?: string;
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
      name: string;
      secret: string;
    };

    // Verificar se a chave secreta foi fornecida
    if (!body.secret) {
      return new Response(
        JSON.stringify({
          error: 'Secret key is required',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Verificar se a chave secreta está configurada no ambiente
    const envSecret = context.env.FIRST_ADMIN_SECRET;
    if (!envSecret) {
      return new Response(
        JSON.stringify({
          error: 'FIRST_ADMIN_SECRET not configured in environment',
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Verificar se a chave secreta está correta
    if (body.secret !== envSecret) {
      return new Response(
        JSON.stringify({
          error: 'Invalid secret key',
        }),
        {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Verificar se já existe algum admin no banco
    const existingAdmins = await db
      .prepare("SELECT COUNT(*) as count FROM users WHERE role = 'admin'")
      .first();

    const adminCount = (existingAdmins as any)?.count || 0;

    if (adminCount > 0) {
      return new Response(
        JSON.stringify({
          error: 'Admin user already exists. This endpoint can only be used once.',
          adminCount,
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Validar campos obrigatórios
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

    // Criar o usuário admin
    const result = await registerUser(db, {
      email: body.email,
      password: body.password,
      name: body.name,
    });

    if ('error' in result) {
      return new Response(JSON.stringify({ error: result.error }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Atualizar o role para admin
    await db
      .prepare('UPDATE users SET role = ? WHERE id = ?')
      .bind('admin', result.user.id)
      .run();

    // Buscar usuário atualizado
    const adminUser = await getUserByEmail(db, body.email);

    return new Response(
      JSON.stringify({
        message: 'Primeiro admin criado com sucesso',
        user: adminUser,
        warning: 'IMPORTANTE: Delete este endpoint (/api/auth/create-first-admin) após criar o primeiro admin!',
      }),
      {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Error creating first admin:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to create first admin',
        message: error.message,
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
