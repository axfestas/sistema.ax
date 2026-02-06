/**
 * Cloudflare Pages Function para resumo financeiro
 * 
 * Endpoint: /api/finance/summary
 * 
 * Exemplos:
 * - GET /api/finance/summary - Resumo de todas as transações
 * - GET /api/finance/summary?startDate=2026-01-01&endDate=2026-12-31 - Período específico
 */

import { getFinanceSummary } from '../../../src/lib/airtable';

interface Env {
  AIRTABLE_API_KEY: string;
  AIRTABLE_BASE_ID: string;
  AIRTABLE_FINANCE_TABLE?: string;
}

export async function onRequestGet(context: { request: Request; env: Env }) {
  try {
    // Configurar variáveis de ambiente
    process.env.AIRTABLE_API_KEY = context.env.AIRTABLE_API_KEY;
    process.env.AIRTABLE_BASE_ID = context.env.AIRTABLE_BASE_ID;
    if (context.env.AIRTABLE_FINANCE_TABLE) {
      process.env.AIRTABLE_FINANCE_TABLE = context.env.AIRTABLE_FINANCE_TABLE;
    }

    const url = new URL(context.request.url);
    const startDate = url.searchParams.get('startDate') || undefined;
    const endDate = url.searchParams.get('endDate') || undefined;

    const summary = await getFinanceSummary(startDate, endDate);

    return new Response(JSON.stringify(summary), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300', // Cache por 5 minutos
      },
    });

  } catch (error: any) {
    console.error('Error fetching finance summary:', error);
    
    return new Response(JSON.stringify({ 
      error: 'Failed to fetch finance summary',
      message: error.message 
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}
