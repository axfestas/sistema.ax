/**
 * API para receber solicitações de reserva do carrinho
 * 
 * POST /api/reservation-request
 * 
 * Recebe dados do formulário de solicitação de reserva,
 * envia email para o admin e confirmação para o cliente
 */

import type { D1Database } from '@cloudflare/workers-types';
import { sendAdminNewRequestEmail, sendCustomerRequestReceivedEmail } from '../../src/lib/email';

interface Env {
  DB: D1Database;
  RESEND_API_KEY?: string;
  ADMIN_EMAIL?: string;
}

interface CartItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  quantity: number;
}

interface RequestBody {
  name: string;
  email: string;
  phone: string;
  eventDate: string;
  message?: string;
  items: CartItem[];
  total: number;
}

/**
 * Handler principal
 */
export async function onRequestPost(context: {
  request: Request;
  env: Env;
}) {
  try {
    const body = await context.request.json() as RequestBody;
    
    // Validar campos obrigatórios
    if (!body.name || !body.email || !body.phone || !body.eventDate || !body.items || body.items.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Campos obrigatórios faltando: name, email, phone, eventDate, items'
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Validar email
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    if (!emailRegex.test(body.email)) {
      return new Response(
        JSON.stringify({ success: false, error: 'Email inválido' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    const db = context.env.DB;
    
    // Salvar solicitação no banco de dados
    try {
      // Gerar custom_id para a solicitação
      const lastRequest = await db
        .prepare('SELECT custom_id FROM reservation_requests WHERE custom_id IS NOT NULL ORDER BY custom_id DESC LIMIT 1')
        .first<{ custom_id: string }>();
      
      let customId = 'SOL-A001';
      if (lastRequest?.custom_id) {
        const match = lastRequest.custom_id.match(/SOL-A(\d+)/);
        if (match) {
          const num = parseInt(match[1]) + 1;
          customId = `SOL-A${num.toString().padStart(3, '0')}`;
        }
      }
      
      // Inserir solicitação no banco
      await db
        .prepare(`
          INSERT INTO reservation_requests 
          (custom_id, customer_name, customer_email, customer_phone, event_date, message, items_json, total_amount, status)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')
        `)
        .bind(
          customId,
          body.name,
          body.email,
          body.phone,
          body.eventDate,
          body.message || null,
          JSON.stringify(body.items),
          body.total
        )
        .run();
      
      console.log(`Reservation request saved to database: ${customId}`);
    } catch (dbError: any) {
      console.error('Error saving to database:', dbError);
      // Continue even if database save fails - we still want to send emails
    }
    
    // Verificar se RESEND_API_KEY está configurado
    const resendApiKey = context.env.RESEND_API_KEY;
    if (!resendApiKey) {
      console.error('RESEND_API_KEY not configured');
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Serviço de email não configurado. Por favor, entre em contato diretamente pelo telefone ou WhatsApp.',
          code: 'EMAIL_SERVICE_UNAVAILABLE'
        }),
        { status: 503, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Email do admin (usar variável de ambiente ou fallback)
    const adminEmail = context.env.ADMIN_EMAIL || 'alex.fraga@axfestas.com.br';

    const adminItemsList = body.items
      .map(item => `
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.name}</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">R$ ${item.price.toFixed(2)}</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">R$ ${(item.price * item.quantity).toFixed(2)}</td>
        </tr>
      `)
      .join('');

    const customerItemsList = body.items
      .map(item => `
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.name}</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">R$ ${item.price.toFixed(2)}</td>
        </tr>
      `)
      .join('');
    
    // Enviar emails em paralelo
    const [adminResult, customerResult] = await Promise.allSettled([
      sendAdminNewRequestEmail({
        to: adminEmail,
        customerName: body.name,
        customerEmail: body.email,
        customerPhone: body.phone,
        eventDate: body.eventDate,
        message: body.message,
        itemsList: adminItemsList,
        total: body.total,
        resendApiKey,
      }),
      sendCustomerRequestReceivedEmail({
        to: body.email,
        customerName: body.name,
        eventDate: body.eventDate,
        itemsList: customerItemsList,
        total: body.total,
        resendApiKey,
      }),
    ]);
    
    // Verificar resultados
    const errors: string[] = [];
    
    if (adminResult.status === 'rejected' || (adminResult.status === 'fulfilled' && !adminResult.value.success)) {
      errors.push('Falha ao enviar notificação para admin');
      console.error('Admin email error:', adminResult);
    }
    
    if (customerResult.status === 'rejected' || (customerResult.status === 'fulfilled' && !customerResult.value.success)) {
      errors.push('Falha ao enviar confirmação para cliente');
      console.error('Customer email error:', customerResult);
    }
    
    // Se qualquer email falhou, retornar erro
    if (errors.length > 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Não foi possível processar sua solicitação. Por favor, tente novamente ou entre em contato diretamente.',
          details: errors
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Retornar sucesso apenas se ambos os emails foram enviados
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Solicitação de reserva recebida com sucesso! Verifique seu email para mais detalhes.'
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error in reservation-request API:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Erro interno do servidor' 
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
