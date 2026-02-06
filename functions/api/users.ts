/**
 * Cloudflare Pages Function para gerenciamento de usuários
 * 
 * Endpoint: /api/users
 * 
 * GET /api/users - Lista todos os usuários (apenas admin)
 * POST /api/users - Cria novo usuário (apenas admin)
 * PUT /api/users?id=xxx - Atualiza usuário (apenas admin)
 * DELETE /api/users?id=xxx - Deleta usuário (apenas admin)
 */

import { getUsers, createUser, updateUser, deleteUser, AirtableConfig } from '../../src/lib/airtable';
import { hashPassword } from '../../src/lib/auth';

interface Env {
  AIRTABLE_API_KEY: string;
  AIRTABLE_BASE_ID: string;
  AIRTABLE_USERS_TABLE?: string;
}

function getConfig(env: Env): AirtableConfig {
  return {
    apiKey: env.AIRTABLE_API_KEY,
    baseId: env.AIRTABLE_BASE_ID,
    tables: {
      users: env.AIRTABLE_USERS_TABLE,
    },
  };
}

// GET - Listar usuários
export async function onRequestGet(context: { request: Request; env: Env }) {
  try {
    const config = getConfig(context.env);
    const users = await getUsers({ config });
    
    // Remover senhas dos resultados
    const usersWithoutPasswords = users.map(user => ({
      id: user.id,
      fields: {
        ...user.fields,
        password: undefined,
      },
      createdTime: user.createdTime,
    }));

    return new Response(JSON.stringify(usersWithoutPasswords), {
      headers: {
        'Content-Type': 'application/json',
      },
    });

  } catch (error: any) {
    console.error('Error fetching users:', error);
    
    return new Response(JSON.stringify({ 
      error: 'Failed to fetch users',
      message: error.message 
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}

// POST - Criar novo usuário
export async function onRequestPost(context: { request: Request; env: Env }) {
  try {
    const body = await context.request.json() as {
      username: string;
      password: string;
      role: 'admin' | 'user';
      name?: string;
      email?: string;
    };
    
    if (!body.username || !body.password) {
      return new Response(JSON.stringify({ 
        error: 'Username and password are required' 
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }

    const config = getConfig(context.env);
    
    // Hash da senha
    const hashedPassword = await hashPassword(body.password);
    
    // Criar usuário
    const user = await createUser({
      username: body.username,
      password: hashedPassword,
      role: body.role || 'user',
      name: body.name,
      email: body.email,
      createdAt: new Date().toISOString(),
    }, config);

    // Retornar sem a senha
    const { password, ...userWithoutPassword } = user.fields;
    
    return new Response(JSON.stringify({
      id: user.id,
      fields: userWithoutPassword,
      createdTime: user.createdTime,
    }), {
      status: 201,
      headers: {
        'Content-Type': 'application/json',
      },
    });

  } catch (error: any) {
    console.error('Error creating user:', error);
    
    return new Response(JSON.stringify({ 
      error: 'Failed to create user',
      message: error.message 
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}

// PUT - Atualizar usuário
export async function onRequestPut(context: { request: Request; env: Env }) {
  try {
    const url = new URL(context.request.url);
    const id = url.searchParams.get('id');
    
    if (!id) {
      return new Response(JSON.stringify({ 
        error: 'User ID is required' 
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }

    const body = await context.request.json() as {
      username?: string;
      password?: string;
      role?: 'admin' | 'user';
      name?: string;
      email?: string;
    };
    
    const config = getConfig(context.env);
    const updates: any = { ...body };
    
    // Se a senha está sendo atualizada, fazer hash
    if (updates.password) {
      updates.password = await hashPassword(updates.password);
    }
    
    // Atualizar usuário
    const user = await updateUser(id, updates, config);

    // Retornar sem a senha
    const { password, ...userWithoutPassword } = user.fields;
    
    return new Response(JSON.stringify({
      id: user.id,
      fields: userWithoutPassword,
      createdTime: user.createdTime,
    }), {
      headers: {
        'Content-Type': 'application/json',
      },
    });

  } catch (error: any) {
    console.error('Error updating user:', error);
    
    return new Response(JSON.stringify({ 
      error: 'Failed to update user',
      message: error.message 
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}

// DELETE - Deletar usuário
export async function onRequestDelete(context: { request: Request; env: Env }) {
  try {
    const url = new URL(context.request.url);
    const id = url.searchParams.get('id');
    
    if (!id) {
      return new Response(JSON.stringify({ 
        error: 'User ID is required' 
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }

    const config = getConfig(context.env);
    const success = await deleteUser(id, config);
    
    if (success) {
      return new Response(JSON.stringify({ success: true }), {
        headers: {
          'Content-Type': 'application/json',
        },
      });
    } else {
      return new Response(JSON.stringify({ 
        error: 'Failed to delete user' 
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }

  } catch (error: any) {
    console.error('Error deleting user:', error);
    
    return new Response(JSON.stringify({ 
      error: 'Failed to delete user',
      message: error.message 
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}
