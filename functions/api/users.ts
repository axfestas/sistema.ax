/**
 * Cloudflare Pages Function para gerenciar usuáries
 * 
 * Endpoints:
 * - GET /api/users - Lista todos usuáries (ADMIN ONLY)
 * - GET /api/users?id=1 - Busca usuárie específique (ADMIN ONLY)
 * - POST /api/users - Cria novo usuárie (ADMIN ONLY)
 * - PUT /api/users?id=1 - Atualiza usuárie (ADMIN ONLY)
 * - DELETE /api/users?id=1 - Deleta usuárie (ADMIN ONLY)
 */

import type { D1Database } from '@cloudflare/workers-types';
import { requireAdmin, hashPassword, getUserById } from '../../src/lib/auth';

interface Env {
  DB: D1Database;
}

interface UserInput {
  email: string;
  name: string;
  password?: string;
  role?: 'admin' | 'user';
  active?: number;
  phone?: string;
}

/**
 * GET - Lista todos usuáries ou um específique
 */
export async function onRequestGet(context: {
  request: Request;
  env: Env;
}) {
  try {
    const db = context.env.DB;
    
    // Verificar se é admin
    await requireAdmin(db, context.request);
    
    const url = new URL(context.request.url);
    const userId = url.searchParams.get('id');
    
    if (userId) {
      // Buscar usuárie específique
      const user = await getUserById(db, Number(userId));
      
      if (!user) {
        return new Response(
          JSON.stringify({ error: 'Usuárie não encontrade' }),
          {
            status: 404,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }
      
      return new Response(JSON.stringify(user), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    // Listar todos usuáries
    const result = await db
      .prepare('SELECT id, email, name, role, active, phone, created_at, updated_at FROM users ORDER BY created_at DESC')
      .all();
    
    return new Response(JSON.stringify(result.results || []), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error fetching users:', error);
    
    if (error.message?.includes('Forbidden') || error.message?.includes('Unauthorized')) {
      return new Response(
        JSON.stringify({
          error: 'Acesso negado. Apenas administradories podem gerenciar usuáries.',
        }),
        {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
    
    return new Response(
      JSON.stringify({
        error: 'Falha ao buscar usuáries',
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
 * POST - Cria novo usuárie
 */
export async function onRequestPost(context: {
  request: Request;
  env: Env;
}) {
  try {
    const db = context.env.DB;
    
    // Verificar se é admin
    await requireAdmin(db, context.request);
    
    const body = (await context.request.json()) as UserInput;
    
    // Validar campos obrigatórios
    if (!body.email || !body.password || !body.name) {
      return new Response(
        JSON.stringify({
          error: 'Campos obrigatórios: email, password, name',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
    
    // Validar email
    if (!body.email.includes('@')) {
      return new Response(
        JSON.stringify({ error: 'Email inválido' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
    
    // Validar senha
    if (body.password.length < 6) {
      return new Response(
        JSON.stringify({ error: 'Senha deve ter mínimo 6 caracteres' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
    
    // Verificar se email já existe
    const existingUser = await db
      .prepare('SELECT id FROM users WHERE email = ?')
      .bind(body.email.toLowerCase())
      .first();
    
    if (existingUser) {
      return new Response(
        JSON.stringify({ error: 'Email já em uso' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
    
    // Hash da senha
    const { hash, salt } = hashPassword(body.password);
    const passwordHash = `${salt}:${hash}`;
    
    // Criar usuárie
    const role = body.role || 'user';
    const active = body.active !== undefined ? body.active : 1;
    
    const result = await db
      .prepare(
        'INSERT INTO users (email, password_hash, name, role, active, phone) VALUES (?, ?, ?, ?, ?, ?) RETURNING id, email, name, role, active, phone, created_at'
      )
      .bind(
        body.email.toLowerCase(),
        passwordHash,
        body.name,
        role,
        active,
        body.phone || null
      )
      .first();
    
    return new Response(
      JSON.stringify({
        message: 'Usuárie criado com sucesso',
        user: result,
      }),
      {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Error creating user:', error);
    
    if (error.message?.includes('Forbidden') || error.message?.includes('Unauthorized')) {
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
    
    return new Response(
      JSON.stringify({
        error: 'Falha ao criar usuárie',
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
 * PUT - Atualiza usuárie existente
 */
export async function onRequestPut(context: {
  request: Request;
  env: Env;
}) {
  try {
    const db = context.env.DB;
    
    // Verificar se é admin
    await requireAdmin(db, context.request);
    
    const url = new URL(context.request.url);
    const userId = url.searchParams.get('id');
    
    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'ID do usuárie não fornecido' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
    
    const body = (await context.request.json()) as Partial<UserInput>;
    
    // Verificar se usuárie existe
    const existingUser = await getUserById(db, Number(userId));
    if (!existingUser) {
      return new Response(
        JSON.stringify({ error: 'Usuárie não encontrade' }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
    
    // Construir query de atualização dinamicamente
    const updates: string[] = [];
    const values: any[] = [];
    
    if (body.name) {
      updates.push('name = ?');
      values.push(body.name);
    }
    
    if (body.email) {
      if (!body.email.includes('@')) {
        return new Response(
          JSON.stringify({ error: 'Email inválido' }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }
      updates.push('email = ?');
      values.push(body.email.toLowerCase());
    }
    
    if (body.role) {
      if (body.role !== 'admin' && body.role !== 'user') {
        return new Response(
          JSON.stringify({ error: 'Role inválido' }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }
      updates.push('role = ?');
      values.push(body.role);
    }
    
    if (body.active !== undefined) {
      updates.push('active = ?');
      values.push(body.active);
    }
    
    if (body.phone !== undefined) {
      updates.push('phone = ?');
      values.push(body.phone || null);
    }
    
    if (body.password) {
      if (body.password.length < 6) {
        return new Response(
          JSON.stringify({ error: 'Senha deve ter mínimo 6 caracteres' }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }
      const { hash, salt } = hashPassword(body.password);
      updates.push('password_hash = ?');
      values.push(`${salt}:${hash}`);
    }
    
    if (updates.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Nenhum campo para atualizar' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
    
    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(userId);
    
    const query = `UPDATE users SET ${updates.join(', ')} WHERE id = ?`;
    await db.prepare(query).bind(...values).run();
    
    // Buscar usuárie atualizade
    const updatedUser = await getUserById(db, Number(userId));
    
    return new Response(
      JSON.stringify({
        message: 'Usuárie atualizade com sucesso',
        user: updatedUser,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Error updating user:', error);
    
    if (error.message?.includes('Forbidden') || error.message?.includes('Unauthorized')) {
      return new Response(
        JSON.stringify({
          error: 'Acesso negado. Apenas administradories podem atualizar usuáries.',
        }),
        {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
    
    return new Response(
      JSON.stringify({
        error: 'Falha ao atualizar usuárie',
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
 * DELETE - Deleta usuárie
 */
export async function onRequestDelete(context: {
  request: Request;
  env: Env;
}) {
  try {
    const db = context.env.DB;
    
    // Verificar se é admin
    await requireAdmin(db, context.request);
    
    const url = new URL(context.request.url);
    const userId = url.searchParams.get('id');
    
    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'ID do usuárie não fornecido' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
    
    // Verificar se usuárie existe
    const existingUser = await getUserById(db, Number(userId));
    if (!existingUser) {
      return new Response(
        JSON.stringify({ error: 'Usuárie não encontrade' }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
    
    // Não permitir deletar o último admin
    if (existingUser.role === 'admin') {
      const adminCount = await db
        .prepare("SELECT COUNT(*) as count FROM users WHERE role = 'admin'")
        .first();
      
      if ((adminCount as any)?.count <= 1) {
        return new Response(
          JSON.stringify({
            error: 'Não é possível deletar o último admin',
          }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }
    }
    
    // Deletar usuárie
    await db
      .prepare('DELETE FROM users WHERE id = ?')
      .bind(userId)
      .run();
    
    return new Response(
      JSON.stringify({
        message: 'Usuárie deletade com sucesso',
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Error deleting user:', error);
    
    if (error.message?.includes('Forbidden') || error.message?.includes('Unauthorized')) {
      return new Response(
        JSON.stringify({
          error: 'Acesso negado. Apenas administradories podem deletar usuáries.',
        }),
        {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
    
    return new Response(
      JSON.stringify({
        error: 'Falha ao deletar usuárie',
        message: error.message,
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
