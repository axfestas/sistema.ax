/**
 * Cloudflare Pages Function para gerenciar registros financeiros
 * 
 * Endpoints:
 * - GET /api/finance - Lista todos os registros financeiros
 * - GET /api/finance?id=1 - Busca um registro específico
 * - POST /api/finance - Cria novo registro financeiro
 * - PUT /api/finance?id=1 - Atualiza um registro
 * - DELETE /api/finance?id=1 - Deleta um registro
 */

import type { D1Database, R2Bucket } from '@cloudflare/workers-types';
import {
  getFinancial,
  getFinancialById,
  createFinancial,
  updateFinancial,
  deleteFinancial,
  type FinancialInput,
} from '../../src/lib/db';

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

    const recordId = url.searchParams.get('id');

    if (recordId) {
      const record = await getFinancialById(db, Number(recordId));

      if (!record) {
        return new Response(
          JSON.stringify({ error: 'Financial record not found' }),
          {
            status: 404,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      return new Response(JSON.stringify(record), {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=30',
        },
      });
    }

    const maxRecords = url.searchParams.get('maxRecords');

    const records = await getFinancial(db, {
      maxRecords: maxRecords ? Number(maxRecords) : undefined,
    });

    return new Response(JSON.stringify(records), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=30',
      },
    });
  } catch (error: any) {
    console.error('Error fetching financial records:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to fetch financial records',
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
    const body = (await context.request.json()) as FinancialInput;

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

export async function onRequestPut(context: {
  request: Request;
  env: Env;
}) {
  try {
    const url = new URL(context.request.url);
    const db = context.env.DB;
    const recordId = url.searchParams.get('id');

    if (!recordId) {
      return new Response(
        JSON.stringify({ error: 'Missing record ID in query params' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const body = (await context.request.json()) as Partial<FinancialInput>;
    const updatedRecord = await updateFinancial(
      db,
      Number(recordId),
      body
    );

    if (!updatedRecord) {
      return new Response(
        JSON.stringify({ error: 'Financial record not found' }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(JSON.stringify(updatedRecord), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error updating financial record:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to update financial record',
        message: error.message,
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

export async function onRequestDelete(context: {
  request: Request;
  env: Env;
}) {
  try {
    const url = new URL(context.request.url);
    const db = context.env.DB;
    const recordId = url.searchParams.get('id');

    if (!recordId) {
      return new Response(
        JSON.stringify({ error: 'Missing record ID in query params' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const success = await deleteFinancial(db, Number(recordId));

    if (!success) {
      return new Response(
        JSON.stringify({ error: 'Financial record not found' }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(
      JSON.stringify({ message: 'Financial record deleted successfully' }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Error deleting financial record:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to delete financial record',
        message: error.message,
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
