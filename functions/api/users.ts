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
  ENVIRONMENT?: string; // 'production' | 'staging' | 'development'
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
  const timestamp = new Date().toISOString();
  console.log('[API Users] GET request received', { timestamp, url: context.request.url });
  
  try {
    const db = context.env.DB;
    const isProduction = context.env.ENVIRONMENT === 'production';
    
    // Testar conexão com o banco (útil para debugging - pode ser removido em produção se causar latência)
    try {
      await db.prepare('SELECT 1').first();
      console.log('[API Users] Database connection successful');
    } catch (dbError: any) {
      console.error('[API Users] Database connection failed:', {
        message: dbError.message,
        stack: dbError.stack,
        name: dbError.name
      });
      return new Response(
        JSON.stringify({
          error: 'Erro de conexão com banco de dados',
          message: dbError.message,
          ...(isProduction ? {} : { details: dbError.stack }),
          timestamp
        }),
        { 
          status: 503, 
          headers: { 
            'Content-Type': 'application/json',
            'X-Debug-Timestamp': timestamp,
            'X-Debug-Handler': 'users-get'
          } 
        }
      );
    }
    
    // Verificar se é admin
    let user;
    try {
      user = await requireAdmin(db, context.request);
      console.log('[API Users] Admin verification passed', { userId: user.id, userEmail: user.email, userRole: user.role });
    } catch (authError: any) {
      console.error('[API Users] Auth failed:', {
        message: authError.message,
        stack: authError.stack,
        name: authError.name
      });
      return new Response(
        JSON.stringify({
          error: 'Autenticação falhou',
          message: authError.message,
          authenticated: false,
          timestamp
        }),
        { 
          status: authError.message?.includes('Forbidden') ? 403 : 401,
          headers: { 
            'Content-Type': 'application/json',
            'X-Debug-Timestamp': timestamp,
            'X-Debug-Handler': 'users-get'
          } 
        }
      );
    }
    
    const url = new URL(context.request.url);
    const userId = url.searchParams.get('id');
    
    if (userId) {
      console.log('[API Users] Fetching specific user:', { userId });
      // Buscar usuárie específique
      const user = await getUserById(db, Number(userId));
      
      if (!user) {
        console.log('[API Users] User not found:', { userId });
        return new Response(
          JSON.stringify({ 
            error: 'Usuárie não encontrade',
            timestamp
          }),
          {
            status: 404,
            headers: { 
              'Content-Type': 'application/json',
              'X-Debug-Timestamp': timestamp,
              'X-Debug-Handler': 'users-get'
            },
          }
        );
      }
      
      console.log('[API Users] User found:', { userId: user.id, userEmail: user.email });
      return new Response(JSON.stringify(user), {
        status: 200,
        headers: { 
          'Content-Type': 'application/json',
          'X-Debug-Timestamp': timestamp,
          'X-Debug-Handler': 'users-get'
        },
      });
    }
    
    // Listar todos usuáries
    console.log('[API Users] Fetching all users');
    const result = await db
      .prepare('SELECT id, email, name, role, active, phone, created_at, updated_at FROM users ORDER BY created_at DESC')
      .all();
    
    console.log('[API Users] Query result:', { 
      success: result.success,
      count: result.results?.length || 0 
    });
    console.log('[API Users] Number of users found:', result.results?.length || 0);
    
    return new Response(JSON.stringify(result.results || []), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'X-Debug-Timestamp': timestamp,
        'X-Debug-Handler': 'users-get'
      },
    });
  } catch (error: any) {
    console.error('[API Users] Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      timestamp
    });
    
    if (error.message?.includes('Forbidden') || error.message?.includes('Unauthorized')) {
      return new Response(
        JSON.stringify({
          error: 'Acesso negado. Apenas administradories podem gerenciar usuáries.',
          message: error.message,
          timestamp
        }),
        {
          status: 403,
          headers: { 
            'Content-Type': 'application/json',
            'X-Debug-Timestamp': timestamp,
            'X-Debug-Handler': 'users-get'
          },
        }
      );
    }
    
    return new Response(
      JSON.stringify({
        error: 'Falha ao buscar usuáries',
        message: error.message,
        ...(isProduction ? {} : { details: error.stack }),
        timestamp
      }),
      {
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          'X-Debug-Timestamp': timestamp,
          'X-Debug-Handler': 'users-get'
        },
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
  const timestamp = new Date().toISOString();
  console.log('[API Users] POST request received', { timestamp, url: context.request.url });
  
  try {
    const db = context.env.DB;
    const isProduction = context.env.ENVIRONMENT === 'production';
    
    // Testar conexão com o banco (útil para debugging - pode ser removido em produção se causar latência)
    try {
      await db.prepare('SELECT 1').first();
      console.log('[API Users] Database connection successful');
    } catch (dbError: any) {
      console.error('[API Users] Database connection failed:', {
        message: dbError.message,
        stack: dbError.stack,
        name: dbError.name
      });
      return new Response(
        JSON.stringify({
          error: 'Erro de conexão com banco de dados',
          message: dbError.message,
          ...(isProduction ? {} : { details: dbError.stack }),
          timestamp
        }),
        { 
          status: 503, 
          headers: { 
            'Content-Type': 'application/json',
            'X-Debug-Timestamp': timestamp,
            'X-Debug-Handler': 'users-post'
          } 
        }
      );
    }
    
    // Verificar se é admin
    let user;
    try {
      user = await requireAdmin(db, context.request);
      console.log('[API Users] Admin verification passed', { userId: user.id, userEmail: user.email, userRole: user.role });
    } catch (authError: any) {
      console.error('[API Users] Auth failed:', {
        message: authError.message,
        stack: authError.stack,
        name: authError.name
      });
      return new Response(
        JSON.stringify({
          error: 'Autenticação falhou',
          message: authError.message,
          authenticated: false,
          timestamp
        }),
        { 
          status: authError.message?.includes('Forbidden') ? 403 : 401,
          headers: { 
            'Content-Type': 'application/json',
            'X-Debug-Timestamp': timestamp,
            'X-Debug-Handler': 'users-post'
          } 
        }
      );
    }
    
    const body = (await context.request.json()) as UserInput;
    console.log('[API Users] Request body received:', { 
      email: body.email, 
      name: body.name, 
      role: body.role,
      hasPassword: !!body.password 
    });
    
    // Validar campos obrigatórios
    if (!body.email || !body.password || !body.name) {
      console.log('[API Users] Validation failed: missing required fields');
      return new Response(
        JSON.stringify({
          error: 'Campos obrigatórios: email, password, name',
          timestamp
        }),
        {
          status: 400,
          headers: { 
            'Content-Type': 'application/json',
            'X-Debug-Timestamp': timestamp,
            'X-Debug-Handler': 'users-post'
          },
        }
      );
    }
    
    // Validar email
    if (!body.email.includes('@')) {
      console.log('[API Users] Validation failed: invalid email');
      return new Response(
        JSON.stringify({ 
          error: 'Email inválido',
          timestamp
        }),
        {
          status: 400,
          headers: { 
            'Content-Type': 'application/json',
            'X-Debug-Timestamp': timestamp,
            'X-Debug-Handler': 'users-post'
          },
        }
      );
    }
    
    // Validar senha
    if (body.password.length < 6) {
      console.log('[API Users] Validation failed: password too short');
      return new Response(
        JSON.stringify({ 
          error: 'Senha deve ter mínimo 6 caracteres',
          timestamp
        }),
        {
          status: 400,
          headers: { 
            'Content-Type': 'application/json',
            'X-Debug-Timestamp': timestamp,
            'X-Debug-Handler': 'users-post'
          },
        }
      );
    }
    
    // Verificar se email já existe
    console.log('[API Users] Checking if email already exists:', { email: body.email });
    const existingUser = await db
      .prepare('SELECT id FROM users WHERE email = ?')
      .bind(body.email.toLowerCase())
      .first();
    
    if (existingUser) {
      console.log('[API Users] Email already in use:', { email: body.email });
      return new Response(
        JSON.stringify({ 
          error: 'Email já em uso',
          timestamp
        }),
        {
          status: 400,
          headers: { 
            'Content-Type': 'application/json',
            'X-Debug-Timestamp': timestamp,
            'X-Debug-Handler': 'users-post'
          },
        }
      );
    }
    
    // Hash da senha
    console.log('[API Users] Hashing password');
    const { hash, salt } = hashPassword(body.password);
    const passwordHash = `${salt}:${hash}`;
    
    // Criar usuárie
    const role = body.role || 'user';
    const active = body.active !== undefined ? body.active : 1;
    
    console.log('[API Users] Creating user:', { email: body.email, name: body.name, role });
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
    
    console.log('[API Users] User created successfully:', { userId: (result as any)?.id, email: (result as any)?.email });
    
    return new Response(
      JSON.stringify({
        message: 'Usuárie criado com sucesso',
        user: result,
      }),
      {
        status: 201,
        headers: { 
          'Content-Type': 'application/json',
          'X-Debug-Timestamp': timestamp,
          'X-Debug-Handler': 'users-post'
        },
      }
    );
  } catch (error: any) {
    console.error('[API Users] Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      timestamp
    });
    
    if (error.message?.includes('Forbidden') || error.message?.includes('Unauthorized')) {
      return new Response(
        JSON.stringify({
          error: 'Acesso negado. Apenas administradories podem criar usuáries.',
          message: error.message,
          timestamp
        }),
        {
          status: 403,
          headers: { 
            'Content-Type': 'application/json',
            'X-Debug-Timestamp': timestamp,
            'X-Debug-Handler': 'users-post'
          },
        }
      );
    }
    
    return new Response(
      JSON.stringify({
        error: 'Falha ao criar usuárie',
        message: error.message,
        ...(isProduction ? {} : { details: error.stack }),
        timestamp
      }),
      {
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          'X-Debug-Timestamp': timestamp,
          'X-Debug-Handler': 'users-post'
        },
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
  const timestamp = new Date().toISOString();
  console.log('[API Users] PUT request received', { timestamp, url: context.request.url });
  
  try {
    const db = context.env.DB;
    const isProduction = context.env.ENVIRONMENT === 'production';
    
    // Testar conexão com o banco (útil para debugging - pode ser removido em produção se causar latência)
    try {
      await db.prepare('SELECT 1').first();
      console.log('[API Users] Database connection successful');
    } catch (dbError: any) {
      console.error('[API Users] Database connection failed:', {
        message: dbError.message,
        stack: dbError.stack,
        name: dbError.name
      });
      return new Response(
        JSON.stringify({
          error: 'Erro de conexão com banco de dados',
          message: dbError.message,
          ...(isProduction ? {} : { details: dbError.stack }),
          timestamp
        }),
        { 
          status: 503, 
          headers: { 
            'Content-Type': 'application/json',
            'X-Debug-Timestamp': timestamp,
            'X-Debug-Handler': 'users-put'
          } 
        }
      );
    }
    
    // Verificar se é admin
    let user;
    try {
      user = await requireAdmin(db, context.request);
      console.log('[API Users] Admin verification passed', { userId: user.id, userEmail: user.email, userRole: user.role });
    } catch (authError: any) {
      console.error('[API Users] Auth failed:', {
        message: authError.message,
        stack: authError.stack,
        name: authError.name
      });
      return new Response(
        JSON.stringify({
          error: 'Autenticação falhou',
          message: authError.message,
          authenticated: false,
          timestamp
        }),
        { 
          status: authError.message?.includes('Forbidden') ? 403 : 401,
          headers: { 
            'Content-Type': 'application/json',
            'X-Debug-Timestamp': timestamp,
            'X-Debug-Handler': 'users-put'
          } 
        }
      );
    }
    
    const url = new URL(context.request.url);
    const userId = url.searchParams.get('id');
    
    if (!userId) {
      console.log('[API Users] Validation failed: user ID not provided');
      return new Response(
        JSON.stringify({ 
          error: 'ID do usuárie não fornecido',
          timestamp
        }),
        {
          status: 400,
          headers: { 
            'Content-Type': 'application/json',
            'X-Debug-Timestamp': timestamp,
            'X-Debug-Handler': 'users-put'
          },
        }
      );
    }
    
    console.log('[API Users] Updating user:', { userId });
    const body = (await context.request.json()) as Partial<UserInput>;
    console.log('[API Users] Update fields:', { 
      hasName: !!body.name,
      hasEmail: !!body.email,
      hasRole: !!body.role,
      hasPassword: !!body.password,
      hasActive: body.active !== undefined,
      hasPhone: body.phone !== undefined
    });
    
    // Verificar se usuárie existe
    console.log('[API Users] Checking if user exists:', { userId });
    const existingUser = await getUserById(db, Number(userId));
    if (!existingUser) {
      console.log('[API Users] User not found:', { userId });
      return new Response(
        JSON.stringify({ 
          error: 'Usuárie não encontrade',
          timestamp
        }),
        {
          status: 404,
          headers: { 
            'Content-Type': 'application/json',
            'X-Debug-Timestamp': timestamp,
            'X-Debug-Handler': 'users-put'
          },
        }
      );
    }
    
    console.log('[API Users] User found:', { userId: existingUser.id, email: existingUser.email });
    
    // Construir query de atualização dinamicamente
    const updates: string[] = [];
    const values: any[] = [];
    
    if (body.name) {
      updates.push('name = ?');
      values.push(body.name);
    }
    
    if (body.email) {
      if (!body.email.includes('@')) {
        console.log('[API Users] Validation failed: invalid email');
        return new Response(
          JSON.stringify({ 
            error: 'Email inválido',
            timestamp
          }),
          {
            status: 400,
            headers: { 
              'Content-Type': 'application/json',
              'X-Debug-Timestamp': timestamp,
              'X-Debug-Handler': 'users-put'
            },
          }
        );
      }
      updates.push('email = ?');
      values.push(body.email.toLowerCase());
    }
    
    if (body.role) {
      if (body.role !== 'admin' && body.role !== 'user') {
        console.log('[API Users] Validation failed: invalid role');
        return new Response(
          JSON.stringify({ 
            error: 'Role inválido',
            timestamp
          }),
          {
            status: 400,
            headers: { 
              'Content-Type': 'application/json',
              'X-Debug-Timestamp': timestamp,
              'X-Debug-Handler': 'users-put'
            },
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
        console.log('[API Users] Validation failed: password too short');
        return new Response(
          JSON.stringify({ 
            error: 'Senha deve ter mínimo 6 caracteres',
            timestamp
          }),
          {
            status: 400,
            headers: { 
              'Content-Type': 'application/json',
              'X-Debug-Timestamp': timestamp,
              'X-Debug-Handler': 'users-put'
            },
          }
        );
      }
      console.log('[API Users] Hashing new password');
      const { hash, salt } = hashPassword(body.password);
      updates.push('password_hash = ?');
      values.push(`${salt}:${hash}`);
    }
    
    if (updates.length === 0) {
      console.log('[API Users] No fields to update');
      return new Response(
        JSON.stringify({ 
          error: 'Nenhum campo para atualizar',
          timestamp
        }),
        {
          status: 400,
          headers: { 
            'Content-Type': 'application/json',
            'X-Debug-Timestamp': timestamp,
            'X-Debug-Handler': 'users-put'
          },
        }
      );
    }
    
    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(userId);
    
    const query = `UPDATE users SET ${updates.join(', ')} WHERE id = ?`;
    console.log('[API Users] Executing update query:', { fieldsCount: updates.length });
    await db.prepare(query).bind(...values).run();
    
    // Buscar usuárie atualizade
    const updatedUser = await getUserById(db, Number(userId));
    console.log('[API Users] User updated successfully:', { userId: updatedUser?.id, email: updatedUser?.email });
    
    return new Response(
      JSON.stringify({
        message: 'Usuárie atualizade com sucesso',
        user: updatedUser,
      }),
      {
        status: 200,
        headers: { 
          'Content-Type': 'application/json',
          'X-Debug-Timestamp': timestamp,
          'X-Debug-Handler': 'users-put'
        },
      }
    );
  } catch (error: any) {
    console.error('[API Users] Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      timestamp
    });
    
    if (error.message?.includes('Forbidden') || error.message?.includes('Unauthorized')) {
      return new Response(
        JSON.stringify({
          error: 'Acesso negado. Apenas administradories podem atualizar usuáries.',
          message: error.message,
          timestamp
        }),
        {
          status: 403,
          headers: { 
            'Content-Type': 'application/json',
            'X-Debug-Timestamp': timestamp,
            'X-Debug-Handler': 'users-put'
          },
        }
      );
    }
    
    return new Response(
      JSON.stringify({
        error: 'Falha ao atualizar usuárie',
        message: error.message,
        ...(isProduction ? {} : { details: error.stack }),
        timestamp
      }),
      {
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          'X-Debug-Timestamp': timestamp,
          'X-Debug-Handler': 'users-put'
        },
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
  const timestamp = new Date().toISOString();
  console.log('[API Users] DELETE request received', { timestamp, url: context.request.url });
  
  try {
    const db = context.env.DB;
    const isProduction = context.env.ENVIRONMENT === 'production';
    
    // Testar conexão com o banco (útil para debugging - pode ser removido em produção se causar latência)
    try {
      await db.prepare('SELECT 1').first();
      console.log('[API Users] Database connection successful');
    } catch (dbError: any) {
      console.error('[API Users] Database connection failed:', {
        message: dbError.message,
        stack: dbError.stack,
        name: dbError.name
      });
      return new Response(
        JSON.stringify({
          error: 'Erro de conexão com banco de dados',
          message: dbError.message,
          ...(isProduction ? {} : { details: dbError.stack }),
          timestamp
        }),
        { 
          status: 503, 
          headers: { 
            'Content-Type': 'application/json',
            'X-Debug-Timestamp': timestamp,
            'X-Debug-Handler': 'users-delete'
          } 
        }
      );
    }
    
    // Verificar se é admin
    let user;
    try {
      user = await requireAdmin(db, context.request);
      console.log('[API Users] Admin verification passed', { userId: user.id, userEmail: user.email, userRole: user.role });
    } catch (authError: any) {
      console.error('[API Users] Auth failed:', {
        message: authError.message,
        stack: authError.stack,
        name: authError.name
      });
      return new Response(
        JSON.stringify({
          error: 'Autenticação falhou',
          message: authError.message,
          authenticated: false,
          timestamp
        }),
        { 
          status: authError.message?.includes('Forbidden') ? 403 : 401,
          headers: { 
            'Content-Type': 'application/json',
            'X-Debug-Timestamp': timestamp,
            'X-Debug-Handler': 'users-delete'
          } 
        }
      );
    }
    
    const url = new URL(context.request.url);
    const userId = url.searchParams.get('id');
    
    if (!userId) {
      console.log('[API Users] Validation failed: user ID not provided');
      return new Response(
        JSON.stringify({ 
          error: 'ID do usuárie não fornecido',
          timestamp
        }),
        {
          status: 400,
          headers: { 
            'Content-Type': 'application/json',
            'X-Debug-Timestamp': timestamp,
            'X-Debug-Handler': 'users-delete'
          },
        }
      );
    }
    
    console.log('[API Users] Deleting user:', { userId });
    
    // Verificar se usuárie existe
    console.log('[API Users] Checking if user exists:', { userId });
    const existingUser = await getUserById(db, Number(userId));
    if (!existingUser) {
      console.log('[API Users] User not found:', { userId });
      return new Response(
        JSON.stringify({ 
          error: 'Usuárie não encontrade',
          timestamp
        }),
        {
          status: 404,
          headers: { 
            'Content-Type': 'application/json',
            'X-Debug-Timestamp': timestamp,
            'X-Debug-Handler': 'users-delete'
          },
        }
      );
    }
    
    console.log('[API Users] User found:', { userId: existingUser.id, email: existingUser.email, role: existingUser.role });
    
    // Não permitir deletar o último admin
    if (existingUser.role === 'admin') {
      console.log('[API Users] User is admin, checking admin count');
      const adminCount = await db
        .prepare("SELECT COUNT(*) as count FROM users WHERE role = 'admin'")
        .first();
      
      console.log('[API Users] Admin count:', { count: (adminCount as any)?.count });
      if ((adminCount as any)?.count <= 1) {
        console.log('[API Users] Cannot delete last admin');
        return new Response(
          JSON.stringify({
            error: 'Não é possível deletar o último admin',
            timestamp
          }),
          {
            status: 400,
            headers: { 
              'Content-Type': 'application/json',
              'X-Debug-Timestamp': timestamp,
              'X-Debug-Handler': 'users-delete'
            },
          }
        );
      }
    }
    
    // Deletar usuárie
    console.log('[API Users] Executing delete query:', { userId });
    await db
      .prepare('DELETE FROM users WHERE id = ?')
      .bind(userId)
      .run();
    
    console.log('[API Users] User deleted successfully:', { userId });
    
    return new Response(
      JSON.stringify({
        message: 'Usuárie deletade com sucesso',
      }),
      {
        status: 200,
        headers: { 
          'Content-Type': 'application/json',
          'X-Debug-Timestamp': timestamp,
          'X-Debug-Handler': 'users-delete'
        },
      }
    );
  } catch (error: any) {
    console.error('[API Users] Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      timestamp
    });
    
    if (error.message?.includes('Forbidden') || error.message?.includes('Unauthorized')) {
      return new Response(
        JSON.stringify({
          error: 'Acesso negado. Apenas administradories podem deletar usuáries.',
          message: error.message,
          timestamp
        }),
        {
          status: 403,
          headers: { 
            'Content-Type': 'application/json',
            'X-Debug-Timestamp': timestamp,
            'X-Debug-Handler': 'users-delete'
          },
        }
      );
    }
    
    return new Response(
      JSON.stringify({
        error: 'Falha ao deletar usuárie',
        message: error.message,
        ...(isProduction ? {} : { details: error.stack }),
        timestamp
      }),
      {
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          'X-Debug-Timestamp': timestamp,
          'X-Debug-Handler': 'users-delete'
        },
      }
    );
  }
}
