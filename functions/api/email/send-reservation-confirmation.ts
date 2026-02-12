/**
 * API para enviar email de confirmação de reserva
 * 
 * POST /api/email/send-reservation-confirmation
 */

import type { D1Database } from '@cloudflare/workers-types';
import { sendReservationConfirmationEmail } from '../../../src/lib/email';

interface Env {
  DB: D1Database;
  RESEND_API_KEY?: string;
}

interface RequestBody {
  to: string;
  customerName: string;
  reservationId: number;
  status: string;
  dateFrom: string;
  dateTo: string;
  itemsList: string;
}

export async function onRequestPost(context: {
  request: Request;
  env: Env;
}) {
  try {
    const body = await context.request.json() as RequestBody;
    
    if (!body.to || !body.customerName || !body.reservationId || !body.dateFrom || !body.dateTo) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Campos obrigatórios faltando: to, customerName, reservationId, dateFrom, dateTo'
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
          error: 'Email service not configured. Please set RESEND_API_KEY in Cloudflare Dashboard.'
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    const result = await sendReservationConfirmationEmail({
      to: body.to,
      customerName: body.customerName,
      reservationId: body.reservationId,
      status: body.status || 'pending',
      dateFrom: body.dateFrom,
      dateTo: body.dateTo,
      itemsList: body.itemsList || '<p>Sem itens especificados</p>',
      resendApiKey: resendApiKey
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
    console.error('Error in send-reservation-confirmation API:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
