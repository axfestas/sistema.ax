/**
 * API para enviar email de rejeição de solicitação de reserva
 * 
 * POST /api/email/send-reservation-rejection
 */

import type { D1Database } from '@cloudflare/workers-types';
import { sendReservationRejectionEmail } from '../../../src/lib/email';

interface Env {
  DB: D1Database;
  RESEND_API_KEY?: string;
  SITE_URL?: string;
  ADMIN_EMAIL?: string;
}

interface RequestBody {
  to: string;
  customerName: string;
  requestCustomId: string;
  eventDate: string;
  reason?: string;
}

export async function onRequestPost(context: {
  request: Request;
  env: Env;
}) {
  try {
    const body = await context.request.json() as RequestBody;

    if (!body.to || !body.customerName || !body.requestCustomId || !body.eventDate) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Campos obrigatórios faltando: to, customerName, requestCustomId, eventDate',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.to)) {
      return new Response(
        JSON.stringify({ success: false, error: 'Email inválido' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const resendApiKey = context.env.RESEND_API_KEY;
    if (!resendApiKey) {
      console.error('RESEND_API_KEY not configured');
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Email service not configured. Please set RESEND_API_KEY in Cloudflare Dashboard.',
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const result = await sendReservationRejectionEmail({
      to: body.to,
      customerName: body.customerName,
      requestCustomId: body.requestCustomId,
      eventDate: body.eventDate,
      reason: body.reason,
      siteUrl: context.env.SITE_URL || 'https://axfestas.com.br',
      adminEmail: context.env.ADMIN_EMAIL || 'alex.fraga@axfestas.com.br',
      resendApiKey,
    });

    if (!result.success) {
      return new Response(
        JSON.stringify({ success: false, error: result.error || 'Failed to send email' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Email enviado com sucesso', data: result.data }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error in send-reservation-rejection API:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
