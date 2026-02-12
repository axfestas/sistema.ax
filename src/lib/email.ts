/**
 * Biblioteca helper para envio de emails usando Resend
 * 
 * Funções para processar templates e enviar emails
 */

import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * Carrega e processa um template de email
 */
export function loadEmailTemplate(templateName: string, variables: Record<string, string>): string {
  try {
    // Em produção, os templates estarão no diretório raiz
    const templatePath = join(process.cwd(), 'email-templates', `${templateName}.html`);
    let template = readFileSync(templatePath, 'utf-8');
    
    // Substituir variáveis no formato {{variableName}}
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`{{${key}}}`, 'g');
      template = template.replace(regex, value || '');
    }
    
    return template;
  } catch (error) {
    console.error('Error loading email template:', error);
    throw new Error(`Failed to load email template: ${templateName}`);
  }
}

/**
 * Formata data para exibição em português
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

/**
 * Formata status da reserva para português
 */
export function formatStatus(status: string): string {
  const statusMap: Record<string, string> = {
    'pending': 'Pendente',
    'confirmed': 'Confirmado',
    'completed': 'Concluído',
    'cancelled': 'Cancelado'
  };
  return statusMap[status] || status;
}

/**
 * Envia email de confirmação de reserva
 */
export async function sendReservationConfirmationEmail(params: {
  to: string;
  customerName: string;
  reservationId: number;
  status: string;
  dateFrom: string;
  dateTo: string;
  itemsList: string;
  resendApiKey: string;
}) {
  try {
    // Importar Resend dinamicamente para evitar erro em build
    const { Resend } = await import('resend');
    const resend = new Resend(params.resendApiKey);
    
    const html = loadEmailTemplate('reservation-confirmation', {
      customerName: params.customerName,
      reservationId: params.reservationId.toString(),
      status: formatStatus(params.status),
      dateFrom: formatDate(params.dateFrom),
      dateTo: formatDate(params.dateTo),
      itemsList: params.itemsList
    });
    
    const result = await resend.emails.send({
      from: 'Ax Festas <noreply@axfestas.com.br>',
      to: params.to,
      subject: `Confirmação de Reserva #${params.reservationId} - Ax Festas`,
      html: html
    });
    
    return { success: true, data: result };
  } catch (error: any) {
    console.error('Error sending reservation confirmation email:', error);
    return { 
      success: false, 
      error: error.message || 'Failed to send email' 
    };
  }
}

/**
 * Envia email de recuperação de senha
 */
export async function sendPasswordResetEmail(params: {
  to: string;
  userName: string;
  resetLink: string;
  resendApiKey: string;
}) {
  try {
    const { Resend } = await import('resend');
    const resend = new Resend(params.resendApiKey);
    
    const html = loadEmailTemplate('password-reset', {
      userName: params.userName,
      resetLink: params.resetLink
    });
    
    const result = await resend.emails.send({
      from: 'Ax Festas <noreply@axfestas.com.br>',
      to: params.to,
      subject: 'Recuperação de Senha - Ax Festas',
      html: html
    });
    
    return { success: true, data: result };
  } catch (error: any) {
    console.error('Error sending password reset email:', error);
    return { 
      success: false, 
      error: error.message || 'Failed to send email' 
    };
  }
}
