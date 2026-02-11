/**
 * Cloudflare Pages Function para resumo financeiro
 * 
 * Endpoints:
 * - GET /api/finance/summary - Resumo de todas as transações
 * - GET /api/finance/summary?startDate=2026-01-01&endDate=2026-12-31 - Período específico
 */

import type { D1Database, R2Bucket } from '@cloudflare/workers-types';
import { getFinancialSummary } from '../../../src/lib/db';

interface Env {
  DB: D1Database;
  STORAGE?: R2Bucket; // Optional for backward compatibility
}

export async function onRequestGet(context: {
  request: Request;
  env: Env;
}) {
  try {
    const url = new URL(context.request.url);
    const db = context.env.DB;

    const startDate = url.searchParams.get('startDate') || undefined;
    const endDate = url.searchParams.get('endDate') || undefined;

    const summary = await getFinancialSummary(db, startDate, endDate);

    return new Response(JSON.stringify(summary), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300',
      },
    });
  } catch (error: any) {
    console.error('Error fetching finance summary:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to fetch finance summary',
        message: error.message,
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

export async function onRequestPost(context: {
  request: Request;
  env: Env;
}) {
  try {
    const db = context.env.DB;
    const body = (await context.request.json()) as {
      type: 'income' | 'expense';
      description: string;
      amount: number;
      date: string;
    };

    if (!body.type || !body.description || !body.amount || !body.date) {
      return new Response(
        JSON.stringify({
          error: 'Missing required fields: type, description, amount, date',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Importar createFinancial apenas quando necessário
    const { createFinancial } = await import('../../../src/lib/db');
    const newRecord = await createFinancial(db, body);

    return new Response(JSON.stringify(newRecord), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error creating financial record:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to create financial record',
        message: error.message,
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
