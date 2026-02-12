/**
 * API para receber solicitações de reserva do carrinho
 * 
 * POST /api/reservation-request
 * 
 * Recebe dados do formulário de solicitação de reserva,
 * envia email para o admin e confirmação para o cliente
 */

import type { D1Database } from '@cloudflare/workers-types';

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
 * Envia email para o admin notificando sobre nova solicitação
 */
async function sendAdminNotification(params: {
  requestData: RequestBody;
  resendApiKey: string;
  adminEmail: string;
}) {
  try {
    const { Resend } = await import('resend');
    const resend = new Resend(params.resendApiKey);
    
    // Formatar lista de itens para o email
    const itemsList = params.requestData.items
      .map(item => `
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.name}</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">R$ ${item.price.toFixed(2)}</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">R$ ${(item.price * item.quantity).toFixed(2)}</td>
        </tr>
      `)
      .join('');
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #f59e0b; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background-color: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; }
          .info-item { margin-bottom: 15px; }
          .info-label { font-weight: bold; color: #374151; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; background: white; }
          th { background-color: #f3f4f6; padding: 12px 8px; text-align: left; }
          .total { font-size: 1.2em; font-weight: bold; color: #f59e0b; text-align: right; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Nova Solicitação de Reserva!</h1>
          </div>
          <div class="content">
            <h2>Informações do Cliente</h2>
            <div class="info-item">
              <span class="info-label">Nome:</span> ${params.requestData.name}
            </div>
            <div class="info-item">
              <span class="info-label">Email:</span> ${params.requestData.email}
            </div>
            <div class="info-item">
              <span class="info-label">Telefone:</span> ${params.requestData.phone}
            </div>
            <div class="info-item">
              <span class="info-label">Data do Evento:</span> ${new Date(params.requestData.eventDate).toLocaleDateString('pt-BR')}
            </div>
            ${params.requestData.message ? `
            <div class="info-item">
              <span class="info-label">Mensagem:</span><br>
              ${params.requestData.message}
            </div>
            ` : ''}
            
            <h2>Itens Solicitados</h2>
            <table>
              <thead>
                <tr>
                  <th>Item</th>
                  <th style="text-align: center;">Quantidade</th>
                  <th style="text-align: right;">Preço Unit.</th>
                  <th style="text-align: right;">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                ${itemsList}
              </tbody>
            </table>
            
            <div class="total">
              Total Estimado: R$ ${params.requestData.total.toFixed(2)}
            </div>
            
            <p style="margin-top: 30px; padding: 15px; background: white; border-left: 4px solid #f59e0b;">
              <strong>Próximos Passos:</strong> Entre em contato com o cliente para confirmar disponibilidade e finalizar a reserva.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;
    
    const result = await resend.emails.send({
      from: 'Ax Festas <noreply@axfestas.com.br>',
      to: params.adminEmail,
      subject: `Nova Solicitação de Reserva - ${params.requestData.name}`,
      html: html
    });
    
    return { success: true, data: result };
  } catch (error: any) {
    console.error('Error sending admin notification:', error);
    return { 
      success: false, 
      error: error.message || 'Failed to send admin notification' 
    };
  }
}

/**
 * Envia email de confirmação para o cliente
 */
async function sendCustomerConfirmation(params: {
  requestData: RequestBody;
  resendApiKey: string;
}) {
  try {
    const { Resend } = await import('resend');
    const resend = new Resend(params.resendApiKey);
    
    const itemsList = params.requestData.items
      .map(item => `
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.name}</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">R$ ${item.price.toFixed(2)}</td>
        </tr>
      `)
      .join('');
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #f59e0b; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background-color: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; background: white; }
          th { background-color: #f3f4f6; padding: 12px 8px; text-align: left; }
          .total { font-size: 1.2em; font-weight: bold; color: #f59e0b; text-align: right; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Solicitação Recebida!</h1>
          </div>
          <div class="content">
            <p>Olá <strong>${params.requestData.name}</strong>,</p>
            
            <p>Recebemos sua solicitação de reserva para o evento do dia <strong>${new Date(params.requestData.eventDate).toLocaleDateString('pt-BR')}</strong>.</p>
            
            <h2>Resumo da Solicitação</h2>
            <table>
              <thead>
                <tr>
                  <th>Item</th>
                  <th style="text-align: center;">Quantidade</th>
                  <th style="text-align: right;">Preço</th>
                </tr>
              </thead>
              <tbody>
                ${itemsList}
              </tbody>
            </table>
            
            <div class="total">
              Total Estimado: R$ ${params.requestData.total.toFixed(2)}
            </div>
            
            <p style="margin-top: 30px; padding: 15px; background: white; border-left: 4px solid #f59e0b;">
              <strong>Em breve entraremos em contato!</strong><br>
              Nossa equipe irá verificar a disponibilidade dos itens e retornar com a confirmação e detalhes finais da sua reserva.
            </p>
            
            <p>Se tiver alguma dúvida, entre em contato conosco.</p>
            
            <p>Atenciosamente,<br>
            <strong>Equipe Ax Festas</strong></p>
          </div>
        </div>
      </body>
      </html>
    `;
    
    const result = await resend.emails.send({
      from: 'Ax Festas <noreply@axfestas.com.br>',
      to: params.requestData.email,
      subject: 'Solicitação de Reserva Recebida - Ax Festas',
      html: html
    });
    
    return { success: true, data: result };
  } catch (error: any) {
    console.error('Error sending customer confirmation:', error);
    return { 
      success: false, 
      error: error.message || 'Failed to send customer confirmation' 
    };
  }
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
    const adminEmail = context.env.ADMIN_EMAIL || 'contato@axfestas.com.br';
    
    // Enviar emails em paralelo
    const [adminResult, customerResult] = await Promise.allSettled([
      sendAdminNotification({
        requestData: body,
        resendApiKey,
        adminEmail
      }),
      sendCustomerConfirmation({
        requestData: body,
        resendApiKey
      })
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
