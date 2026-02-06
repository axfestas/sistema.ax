/**
 * Cloudflare Pages Function para buscar reservas do Airtable
 * 
 * Endpoint: /api/reservations
 * 
 * Exemplos:
 * - GET /api/reservations - Lista todas as reservas
 * - GET /api/reservations?status=confirmed - Filtra reservas confirmadas
 * - GET /api/reservations?maxRecords=20 - Limita a 20 registros
 */

import { getReservations, AirtableConfig } from '../../src/lib/airtable';

interface Env {
  AIRTABLE_API_KEY: string;
  AIRTABLE_BASE_ID: string;
  AIRTABLE_RESERVATIONS_TABLE?: string;
}

export async function onRequestGet(context: { request: Request; env: Env }) {
  try {
    // Criar configuração do Airtable a partir das variáveis de ambiente
    const config: AirtableConfig = {
      apiKey: context.env.AIRTABLE_API_KEY,
      baseId: context.env.AIRTABLE_BASE_ID,
      tables: {
        reservations: context.env.AIRTABLE_RESERVATIONS_TABLE,
      },
    };

    const url = new URL(context.request.url);
    const options: any = { config };
    
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

    const reservations = await getReservations(options);

    return new Response(JSON.stringify(reservations), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=30',
      },
    });

  } catch (error: any) {
    console.error('Error fetching reservations:', error);
    
    return new Response(JSON.stringify({ 
      error: 'Failed to fetch reservations',
      message: error.message 
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}
