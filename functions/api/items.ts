/**
 * Cloudflare Pages Function para buscar itens do Airtable
 * 
 * Endpoint: /api/items
 * 
 * Exemplos:
 * - GET /api/items - Lista todos os itens
 * - GET /api/items?status=available - Filtra itens disponíveis
 * - GET /api/items?maxRecords=10 - Limita a 10 registros
 */

import { getItems, getItemById } from '../../src/lib/airtable';

interface Env {
  AIRTABLE_API_KEY: string;
  AIRTABLE_BASE_ID: string;
  AIRTABLE_ITEMS_TABLE?: string;
}

export async function onRequestGet(context: { request: Request; env: Env }) {
  try {
    // Configurar variáveis de ambiente para o módulo airtable
    process.env.AIRTABLE_API_KEY = context.env.AIRTABLE_API_KEY;
    process.env.AIRTABLE_BASE_ID = context.env.AIRTABLE_BASE_ID;
    if (context.env.AIRTABLE_ITEMS_TABLE) {
      process.env.AIRTABLE_ITEMS_TABLE = context.env.AIRTABLE_ITEMS_TABLE;
    }

    const url = new URL(context.request.url);
    const itemId = url.searchParams.get('id');

    // Se um ID foi fornecido, buscar item específico
    if (itemId) {
      const item = await getItemById(itemId);
      
      if (!item) {
        return new Response(JSON.stringify({ error: 'Item not found' }), {
          status: 404,
          headers: {
            'Content-Type': 'application/json',
          },
        });
      }

      return new Response(JSON.stringify(item), {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=60', // Cache por 1 minuto
        },
      });
    }

    // Construir opções de filtro
    const options: any = {};
    
    const maxRecords = url.searchParams.get('maxRecords');
    if (maxRecords) {
      options.maxRecords = parseInt(maxRecords, 10);
    }

    const view = url.searchParams.get('view');
    if (view) {
      options.view = view;
    }

    const status = url.searchParams.get('status');
    if (status) {
      options.filterByFormula = `{status} = '${status}'`;
    }

    const category = url.searchParams.get('category');
    if (category) {
      const formula = `{category} = '${category}'`;
      options.filterByFormula = options.filterByFormula 
        ? `AND(${options.filterByFormula}, ${formula})`
        : formula;
    }

    // Buscar itens
    const items = await getItems(options);

    return new Response(JSON.stringify(items), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=60', // Cache por 1 minuto
      },
    });

  } catch (error: any) {
    console.error('Error fetching items:', error);
    
    return new Response(JSON.stringify({ 
      error: 'Failed to fetch items',
      message: error.message 
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}
