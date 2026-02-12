/**
 * Cloudflare Pages Function para gerenciar configurações do site
 * 
 * Endpoints:
 * - GET /api/settings - Busca as configurações do site
 * - PUT /api/settings - Atualiza as configurações do site (ADMIN ONLY)
 */

import type { D1Database, R2Bucket } from '@cloudflare/workers-types';
import {
  getSiteSettings,
  updateSiteSettings,
  type SiteSettingsInput,
} from '../../src/lib/db';
import { requireAdmin } from '../../src/lib/auth';

interface Env {
  DB: D1Database;
  STORAGE?: R2Bucket; // Optional for backward compatibility
}

export async function onRequestGet(context: {
  request: Request;
  env: Env;
}) {
  try {
    const db = context.env.DB;
    const settings = await getSiteSettings(db);
    
    if (!settings) {
      return new Response(
        JSON.stringify({
          error: 'Settings not found',
        }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
    
    return new Response(JSON.stringify(settings), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error fetching settings:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to fetch settings',
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
    const db = context.env.DB;
    
    // Verificar se é admin
    try {
      await requireAdmin(db, context.request);
    } catch (error) {
      return new Response(
        JSON.stringify({
          error: 'Acesso negado. Apenas administradories podem atualizar configurações.',
        }),
        {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
    
    const body = (await context.request.json()) as SiteSettingsInput;
    
    const updatedSettings = await updateSiteSettings(db, body);
    
    if (!updatedSettings) {
      return new Response(
        JSON.stringify({
          error: 'Failed to update settings',
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
    
    return new Response(JSON.stringify(updatedSettings), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error updating settings:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to update settings',
        message: error.message,
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
