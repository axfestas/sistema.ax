/**
 * Cloudflare Pages Function para gerenciar manutenções
 * 
 * Endpoints:
 * - GET /api/maintenance - Lista todas as manutenções
 * - GET /api/maintenance?id=1 - Busca uma manutenção específica
 * - POST /api/maintenance - Cria nova manutenção
 * - PUT /api/maintenance?id=1 - Atualiza uma manutenção
 * - DELETE /api/maintenance?id=1 - Deleta uma manutenção
 */

import type { D1Database, R2Bucket } from '@cloudflare/workers-types';
import {
  getMaintenance,
  getMaintenanceById,
  createMaintenance,
  updateMaintenance,
  deleteMaintenance,
  type MaintenanceInput,
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

    const maintenanceId = url.searchParams.get('id');

    if (maintenanceId) {
      const maintenance = await getMaintenanceById(db, Number(maintenanceId));

      if (!maintenance) {
        return new Response(
          JSON.stringify({ error: 'Maintenance record not found' }),
          {
            status: 404,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      return new Response(JSON.stringify(maintenance), {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=30',
        },
      });
    }

    const maxRecords = url.searchParams.get('maxRecords');

    const maintenance = await getMaintenance(db, {
      maxRecords: maxRecords ? Number(maxRecords) : undefined,
    });

    return new Response(JSON.stringify(maintenance), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=30',
      },
    });
  } catch (error: any) {
    console.error('Error fetching maintenance:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to fetch maintenance records',
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
    const body = (await context.request.json()) as MaintenanceInput;

    if (!body.item_id || !body.description || !body.date) {
      return new Response(
        JSON.stringify({
          error: 'Missing required fields: item_id, description, date',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const newMaintenance = await createMaintenance(db, body);

    return new Response(JSON.stringify(newMaintenance), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error creating maintenance:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to create maintenance record',
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
    const maintenanceId = url.searchParams.get('id');

    if (!maintenanceId) {
      return new Response(
        JSON.stringify({ error: 'Missing maintenance ID in query params' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const body = (await context.request.json()) as Partial<MaintenanceInput>;
    const updatedMaintenance = await updateMaintenance(
      db,
      Number(maintenanceId),
      body
    );

    if (!updatedMaintenance) {
      return new Response(
        JSON.stringify({ error: 'Maintenance record not found' }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(JSON.stringify(updatedMaintenance), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error updating maintenance:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to update maintenance record',
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
    const maintenanceId = url.searchParams.get('id');

    if (!maintenanceId) {
      return new Response(
        JSON.stringify({ error: 'Missing maintenance ID in query params' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const success = await deleteMaintenance(db, Number(maintenanceId));

    if (!success) {
      return new Response(
        JSON.stringify({ error: 'Maintenance record not found' }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(
      JSON.stringify({ message: 'Maintenance record deleted successfully' }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Error deleting maintenance:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to delete maintenance record',
        message: error.message,
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
