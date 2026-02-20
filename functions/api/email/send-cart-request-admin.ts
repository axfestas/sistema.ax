/**
 * API para enviar email de notificação ao admin sobre nova solicitação de carrinho
 * 
 * POST /api/email/send-cart-request-admin
 */

import type { D1Database } from '@cloudflare/workers-types';
import { sendAdminNewRequestEmail } from '../../../src/lib/email';

interface Env {
  DB: D1Database;
  RESEND_API_KEY?: string;
  ADMIN_EMAIL?: string;
}

interface RequestBody {
  to: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  eventDate: string;
  message?: string;
  itemsList: string;
  total: number;
}

export async function onRequestPost(context: {
  request: Request;
  env: Env;
}) {
  try {
    const body = await context.request.json() as RequestBody;

    if (!body.to || !body.customerName || !body.customerEmail || !body.customerPhone || !body.eventDate) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Campos obrigatórios faltando: to, customerName, customerEmail, customerPhone, eventDate',
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

    const result = await sendAdminNewRequestEmail({
      to: body.to,
      customerName: body.customerName,
      customerEmail: body.customerEmail,
      customerPhone: body.customerPhone,
      eventDate: body.eventDate,
      message: body.message,
      itemsList: body.itemsList || '<tr><td>Item de teste</td><td style="text-align:center">1</td><td style="text-align:right">R$ 100,00</td><td style="text-align:right">R$ 100,00</td></tr>',
      total: body.total || 100,
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
    console.error('Error in send-cart-request-admin API:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
