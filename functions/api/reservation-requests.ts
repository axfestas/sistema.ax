/**
 * API para gerenciar solicitações de reserva do carrinho
 * 
 * GET /api/reservation-requests - Lista todas as solicitações
 * GET /api/reservation-requests?id=1 - Busca uma solicitação específica
 * PUT /api/reservation-requests?id=1 - Atualiza status de uma solicitação
 */

import type { D1Database } from '@cloudflare/workers-types';

interface Env {
  DB: D1Database;
  RESEND_API_KEY?: string;
  SITE_URL?: string;
}

interface ReservationRequest {
  id: number;
  custom_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  event_date: string;
  message?: string;
  items_json: string;
  total_amount: number;
  status: string;
  created_at: string;
  updated_at: string;
}

/**
 * GET - Lista todas as solicitações ou busca uma específica
 */
export async function onRequestGet(context: {
  request: Request;
  env: Env;
}) {
  try {
    const url = new URL(context.request.url);
    const db = context.env.DB;
    const requestId = url.searchParams.get('id');
    const status = url.searchParams.get('status');
    const limit = url.searchParams.get('limit');

    if (requestId) {
      // Buscar solicitação específica
      const result = await db
        .prepare('SELECT * FROM reservation_requests WHERE id = ?')
        .bind(requestId)
        .first();

      if (!result) {
        return new Response(
          JSON.stringify({ error: 'Solicitação não encontrada' }),
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        );
      }

      return new Response(JSON.stringify(result), {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=30',
        },
      });
    }

    // Listar todas as solicitações
    let query = 'SELECT * FROM reservation_requests';
    const params: any[] = [];

    if (status) {
      query += ' WHERE status = ?';
      params.push(status);
    }

    query += ' ORDER BY created_at DESC';

    if (limit) {
      query += ' LIMIT ?';
      params.push(parseInt(limit));
    }

    const { results } = await db.prepare(query).bind(...params).all();

    return new Response(JSON.stringify(results), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=30',
      },
    });
  } catch (error: any) {
    console.error('Error fetching reservation requests:', error);
    return new Response(
      JSON.stringify({
        error: 'Erro ao buscar solicitações',
        message: error.message,
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * Envia email de aprovação para o cliente
 */
async function sendApprovalEmail(params: {
  request: ReservationRequest;
  resendApiKey: string;
  siteUrl: string;
}) {
  try {
    const { Resend } = await import('resend');
    const resend = new Resend(params.resendApiKey);

    const items = JSON.parse(params.request.items_json);
    const itemsList = items
      .map(
        (item: any) => `
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.name}</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">R$ ${(item.price * item.quantity).toFixed(2)}</td>
        </tr>
      `
      )
      .join('');

    await resend.emails.send({
      from: 'AX Festas <noreply@axfestas.com.br>',
      to: params.request.customer_email,
      subject: `✅ Solicitação Aprovada - ${params.request.custom_id}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #10b981;">✅ Solicitação Aprovada!</h2>
          
          <p>Olá ${params.request.customer_name},</p>
          
          <p>Temos o prazer de informar que sua solicitação de reserva foi <strong>aprovada</strong>!</p>
          
          <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>ID da Solicitação:</strong> ${params.request.custom_id}</p>
            <p style="margin: 5px 0;"><strong>Data do Evento:</strong> ${new Date(params.request.event_date).toLocaleDateString('pt-BR')}</p>
          </div>
          
          <h3>Itens Aprovados:</h3>
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <thead>
              <tr style="background: #f3f4f6;">
                <th style="padding: 8px; text-align: left;">Item</th>
                <th style="padding: 8px; text-align: center;">Quantidade</th>
                <th style="padding: 8px; text-align: right;">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              ${itemsList}
            </tbody>
            <tfoot>
              <tr style="background: #f3f4f6; font-weight: bold;">
                <td colspan="2" style="padding: 8px; text-align: right;">Total:</td>
                <td style="padding: 8px; text-align: right; color: #10b981;">R$ ${params.request.total_amount.toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>
          
          <p><strong>Próximos passos:</strong></p>
          <ul>
            <li>Entraremos em contato em breve para confirmar os detalhes finais</li>
            <li>Faremos o agendamento oficial da reserva</li>
            <li>Enviaremos informações sobre pagamento e contrato</li>
          </ul>
          
          <p>Se tiver alguma dúvida, não hesite em nos contatar!</p>
          
          <p>Atenciosamente,<br><strong>Equipe AX Festas</strong></p>
        </div>
      `,
    });

    return { success: true };
  } catch (error) {
    console.error('Error sending approval email:', error);
    return { success: false, error };
  }
}

/**
 * Envia email de rejeição para o cliente
 */
async function sendRejectionEmail(params: {
  request: ReservationRequest;
  resendApiKey: string;
  siteUrl: string;
  reason?: string;
}) {
  try {
    const { Resend } = await import('resend');
    const resend = new Resend(params.resendApiKey);

    await resend.emails.send({
      from: 'AX Festas <noreply@axfestas.com.br>',
      to: params.request.customer_email,
      subject: `Solicitação ${params.request.custom_id} - Vamos encontrar alternativas!`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #f59e0b;">Sobre sua Solicitação</h2>
          
          <p>Olá ${params.request.customer_name},</p>
          
          <p>Agradecemos muito pelo seu interesse em nossos serviços!</p>
          
          <p>Infelizmente, para a data solicitada (<strong>${new Date(params.request.event_date).toLocaleDateString('pt-BR')}</strong>), 
          não temos disponibilidade completa dos itens que você escolheu.</p>
          
          ${params.reason ? `<div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
            <p style="margin: 0;"><strong>Observação:</strong> ${params.reason}</p>
          </div>` : ''}
          
          <p><strong>Mas não se preocupe! Podemos ajudar de várias formas:</strong></p>
          <ul>
            <li>💬 Verificar disponibilidade em datas próximas</li>
            <li>🎨 Sugerir temas e itens alternativos que temos disponíveis</li>
            <li>🎉 Montar um pacote personalizado para você</li>
            <li>📅 Criar uma solução sob medida para seu evento</li>
          </ul>
          
          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
            <p style="margin-bottom: 15px;"><strong>Vamos conversar?</strong></p>
            <p style="margin: 10px 0;">
              <a href="${params.siteUrl}/contato" 
                 style="display: inline-block; background: #ec4899; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                Entre em Contato
              </a>
            </p>
            <p style="margin: 10px 0; font-size: 14px; color: #666;">
              Ou responda este email diretamente!
            </p>
          </div>
          
          <p>Estamos ansiosos para tornar seu evento especial! 🎈</p>
          
          <p>Atenciosamente,<br><strong>Equipe AX Festas</strong></p>
        </div>
      `,
    });

    return { success: true };
  } catch (error) {
    console.error('Error sending rejection email:', error);
    return { success: false, error };
  }
}

/**
 * PUT - Atualiza status de uma solicitação
 */
export async function onRequestPut(context: {
  request: Request;
  env: Env;
}) {
  try {
    const url = new URL(context.request.url);
    const db = context.env.DB;
    const requestId = url.searchParams.get('id');

    if (!requestId) {
      return new Response(
        JSON.stringify({ error: 'ID da solicitação é obrigatório' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const body = await context.request.json() as { 
      status: string;
      reason?: string; // Motivo da rejeição (opcional)
    };

    if (!body.status) {
      return new Response(
        JSON.stringify({ error: 'Status é obrigatório' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validar status - ATUALIZADO com novos status
    const validStatuses = ['pending', 'contacted', 'approved', 'rejected', 'converted', 'cancelled'];
    if (!validStatuses.includes(body.status)) {
      return new Response(
        JSON.stringify({ error: 'Status inválido' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Buscar solicitação antes de atualizar
    const existingRequest = await db
      .prepare('SELECT * FROM reservation_requests WHERE id = ?')
      .bind(requestId)
      .first() as ReservationRequest | null;

    if (!existingRequest) {
      return new Response(
        JSON.stringify({ error: 'Solicitação não encontrada' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Atualizar solicitação
    const result = await db
      .prepare(
        'UPDATE reservation_requests SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? RETURNING *'
      )
      .bind(body.status, requestId)
      .first() as ReservationRequest;

    // Enviar email se status foi alterado para approved ou rejected
    const resendApiKey = context.env.RESEND_API_KEY;
    const siteUrl = context.env.SITE_URL || 'https://axfestas.com.br';
    
    if (resendApiKey && existingRequest.status !== body.status) {
      if (body.status === 'approved') {
        await sendApprovalEmail({
          request: result,
          resendApiKey,
          siteUrl,
        });
      } else if (body.status === 'rejected') {
        await sendRejectionEmail({
          request: result,
          resendApiKey,
          siteUrl,
          reason: body.reason,
        });
      }
    }

    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error updating reservation request:', error);
    return new Response(
      JSON.stringify({
        error: 'Erro ao atualizar solicitação',
        message: error.message,
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
