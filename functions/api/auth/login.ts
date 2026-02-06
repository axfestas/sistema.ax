/**
 * Cloudflare Pages Function para login
 * 
 * Endpoint: /api/auth/login
 * 
 * POST /api/auth/login
 * Body: { username: string, password: string }
 */

import { getUserByUsername, AirtableConfig } from '../../../src/lib/airtable';
import { verifyPassword } from '../../../src/lib/auth';

interface Env {
  AIRTABLE_API_KEY: string;
  AIRTABLE_BASE_ID: string;
  AIRTABLE_USERS_TABLE?: string;
}

export async function onRequestPost(context: { request: Request; env: Env }) {
  try {
    const body = await context.request.json() as { username: string; password: string };
    
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

    // Criar configuração do Airtable
    const config: AirtableConfig = {
      apiKey: context.env.AIRTABLE_API_KEY,
      baseId: context.env.AIRTABLE_BASE_ID,
      tables: {
        users: context.env.AIRTABLE_USERS_TABLE,
      },
    };

    // Buscar usuário
    const user = await getUserByUsername(body.username, config);
    
    if (!user) {
      return new Response(JSON.stringify({ 
        error: 'Invalid username or password' 
      }), {
        status: 401,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }

    // Verificar senha
    const isValid = await verifyPassword(body.password, user.fields.password);
    
    if (!isValid) {
      return new Response(JSON.stringify({ 
        error: 'Invalid username or password' 
      }), {
        status: 401,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }

    // Retornar dados do usuário (sem a senha)
    const { password, ...userWithoutPassword } = user.fields;
    
    return new Response(JSON.stringify({
      success: true,
      user: {
        id: user.id,
        ...userWithoutPassword,
      },
    }), {
      headers: {
        'Content-Type': 'application/json',
      },
    });

  } catch (error: any) {
    console.error('Error during login:', error);
    
    return new Response(JSON.stringify({ 
      error: 'Login failed',
      message: error.message 
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}
