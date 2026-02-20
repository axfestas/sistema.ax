/**
 * Biblioteca helper para envio de emails usando Resend
 * 
 * Funções para processar templates e enviar emails
 */

const EMAIL_TEMPLATES: Record<string, string> = {
  'reservation-confirmation': `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Confirmação de Reserva - Ax Festas</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #4A4A4A;
            background: linear-gradient(135deg, #88A9C3 0%, #C08ADC 100%);
            padding: 40px 20px;
        }
        .email-container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
        }
        .header {
            background: linear-gradient(135deg, #FFC107 0%, #FFD54F 100%);
            padding: 40px 30px;
            text-align: center;
            position: relative;
        }
        .logo {
            width: 120px;
            height: auto;
            margin-bottom: 20px;
        }
        .header h1 {
            color: #4A4A4A;
            font-size: 28px;
            font-weight: 700;
            margin: 0;
            text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        .header-icon {
            font-size: 64px;
            display: block;
            margin-bottom: 10px;
        }
        .success-badge {
            display: inline-block;
            background: rgba(76, 175, 80, 0.1);
            color: #4CAF50;
            padding: 8px 20px;
            border-radius: 50px;
            font-size: 14px;
            font-weight: 600;
            margin-top: 15px;
            border: 2px solid #4CAF50;
        }
        .content {
            padding: 40px 30px;
            background-color: #ffffff;
        }
        .greeting {
            font-size: 20px;
            color: #4A4A4A;
            margin-bottom: 20px;
            font-weight: 600;
        }
        .greeting strong {
            color: #FFC107;
        }
        .message {
            font-size: 16px;
            color: #666;
            margin-bottom: 25px;
            line-height: 1.8;
        }
        .info-card {
            background: linear-gradient(135deg, #F5F5F5 0%, #FAFAFA 100%);
            border-left: 4px solid #FFC107;
            border-radius: 12px;
            padding: 25px;
            margin: 25px 0;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
        }
        .info-card h3 {
            margin: 0 0 20px 0;
            color: #4A4A4A;
            font-size: 18px;
            font-weight: 700;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        .info-card-icon {
            font-size: 24px;
        }
        .info-row {
            display: flex;
            justify-content: space-between;
            padding: 12px 0;
            border-bottom: 1px solid #E0E0E0;
        }
        .info-row:last-child {
            border-bottom: none;
        }
        .info-label {
            color: #888;
            font-weight: 600;
            font-size: 14px;
        }
        .info-value {
            color: #4A4A4A;
            font-weight: 700;
            font-size: 14px;
            text-align: right;
        }
        .reservation-id {
            background: linear-gradient(135deg, #FFC107 0%, #FFD54F 100%);
            color: #4A4A4A;
            padding: 8px 16px;
            border-radius: 20px;
            font-weight: 700;
            display: inline-block;
        }
        .status-badge {
            background: linear-gradient(135deg, #4CAF50 0%, #66BB6A 100%);
            color: #ffffff;
            padding: 6px 16px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 700;
            display: inline-block;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .items-container {
            background-color: #ffffff;
            padding: 15px;
            border-radius: 8px;
            border: 1px solid #E0E0E0;
        }
        .next-steps {
            background: linear-gradient(135deg, #E3F2FD 0%, #BBDEFB 100%);
            border-radius: 12px;
            padding: 25px;
            margin: 25px 0;
        }
        .next-steps h3 {
            color: #1976D2;
            font-size: 18px;
            margin-bottom: 15px;
            font-weight: 700;
        }
        .steps-list {
            list-style: none;
            padding: 0;
        }
        .steps-list li {
            padding: 10px 0;
            padding-left: 35px;
            position: relative;
            color: #4A4A4A;
            line-height: 1.6;
        }
        .steps-list li:before {
            content: "✓";
            position: absolute;
            left: 0;
            top: 10px;
            background: #1976D2;
            color: white;
            width: 24px;
            height: 24px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            font-size: 14px;
        }
        .divider {
            height: 1px;
            background: linear-gradient(90deg, transparent, #E0E0E0, transparent);
            margin: 30px 0;
        }
        .footer {
            background: linear-gradient(135deg, #4A4A4A 0%, #333 100%);
            color: #ffffff;
            padding: 30px;
            text-align: center;
        }
        .footer-logo {
            font-size: 24px;
            font-weight: 700;
            margin-bottom: 15px;
            color: #FFC107;
        }
        .footer-content {
            font-size: 14px;
            line-height: 1.8;
            opacity: 0.9;
        }
        .footer-content a {
            color: #FFC107;
            text-decoration: none;
        }
        .contact-info {
            display: flex;
            justify-content: center;
            gap: 20px;
            margin-top: 15px;
            flex-wrap: wrap;
        }
        .contact-item {
            display: flex;
            align-items: center;
            gap: 5px;
        }
        @media only screen and (max-width: 600px) {
            body {
                padding: 20px 10px;
            }
            .content {
                padding: 30px 20px;
            }
            .header h1 {
                font-size: 24px;
            }
            .greeting {
                font-size: 18px;
            }
            .info-row {
                flex-direction: column;
                gap: 5px;
            }
            .info-value {
                text-align: left;
            }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <span class="header-icon">🎉</span>
            <h1>Reserva Confirmada!</h1>
            <div class="success-badge">✓ Confirmado com Sucesso</div>
        </div>
        
        <div class="content">
            <p class="greeting">Olá, <strong>{{customerName}}</strong>!</p>
            
            <p class="message">Que ótima notícia! Sua reserva foi confirmada com sucesso na <strong>Ax Festas</strong>. Estamos muito felizes em fazer parte do seu evento especial!</p>
            
            <div class="info-card">
                <h3>
                    <span class="info-card-icon">📋</span>
                    Detalhes da Reserva
                </h3>
                <div class="info-row">
                    <span class="info-label">ID da Reserva</span>
                    <span class="info-value"><span class="reservation-id">#{{reservationId}}</span></span>
                </div>
                <div class="info-row">
                    <span class="info-label">Status</span>
                    <span class="info-value"><span class="status-badge">{{status}}</span></span>
                </div>
                <div class="info-row">
                    <span class="info-label">Data de Retirada</span>
                    <span class="info-value">{{dateFrom}}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Data de Devolução</span>
                    <span class="info-value">{{dateTo}}</span>
                </div>
            </div>
            
            <div class="info-card">
                <h3>
                    <span class="info-card-icon">📦</span>
                    Itens Reservados
                </h3>
                <div class="items-container">
                    {{itemsList}}
                </div>
            </div>
            
            <div class="next-steps">
                <h3>📌 Próximos Passos</h3>
                <ul class="steps-list">
                    <li>Guarde o ID da sua reserva (<strong>#{{reservationId}}</strong>) para referência futura</li>
                    <li>Confirme as datas de retirada (<strong>{{dateFrom}}</strong>) e devolução (<strong>{{dateTo}}</strong>)</li>
                    <li>Entre em contato conosco caso precise de alguma alteração ou esclarecimento</li>
                    <li>Prepare-se para criar momentos inesquecíveis!</li>
                </ul>
            </div>
            
            <div class="divider"></div>
            
            <p class="message" style="text-align: center; font-size: 14px;">
                Dúvidas? Nossa equipe está pronta para ajudar você!
            </p>
        </div>
        
        <div class="footer">
            <div class="footer-logo">Ax Festas</div>
            <div class="footer-content">
                <p>Transformando momentos em memórias inesquecíveis</p>
                <div class="contact-info">
                    <div class="contact-item">
                        <span>📧</span>
                        <a href="mailto:contato@axfestas.com.br">contato@axfestas.com.br</a>
                    </div>
                    <div class="contact-item">
                        <span>📱</span>
                        <span>(00) 00000-0000</span>
                    </div>
                </div>
            </div>
        </div>
    </div>
</body>
</html>`,

  'password-reset': `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Recuperação de Senha - Ax Festas</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #4A4A4A;
            background: linear-gradient(135deg, #88A9C3 0%, #C08ADC 100%);
            padding: 40px 20px;
        }
        .email-container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
        }
        .header {
            background: linear-gradient(135deg, #FFC107 0%, #FFD54F 100%);
            padding: 40px 30px;
            text-align: center;
            position: relative;
        }
        .logo {
            width: 120px;
            height: auto;
            margin-bottom: 20px;
        }
        .header h1 {
            color: #4A4A4A;
            font-size: 28px;
            font-weight: 700;
            margin: 0;
            text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        .header-icon {
            font-size: 48px;
            display: block;
            margin-bottom: 10px;
        }
        .content {
            padding: 40px 30px;
            background-color: #ffffff;
        }
        .greeting {
            font-size: 20px;
            color: #4A4A4A;
            margin-bottom: 20px;
            font-weight: 600;
        }
        .greeting strong {
            color: #FFC107;
        }
        .message {
            font-size: 16px;
            color: #666;
            margin-bottom: 15px;
            line-height: 1.8;
        }
        .button-container {
            text-align: center;
            margin: 35px 0;
        }
        .button {
            display: inline-block;
            padding: 16px 40px;
            background: linear-gradient(135deg, #FFC107 0%, #FFD54F 100%);
            color: #4A4A4A;
            text-decoration: none;
            border-radius: 50px;
            font-weight: 700;
            font-size: 16px;
            box-shadow: 0 4px 15px rgba(255, 193, 7, 0.4);
            transition: all 0.3s ease;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .button:hover {
            box-shadow: 0 6px 20px rgba(255, 193, 7, 0.6);
            transform: translateY(-2px);
        }
        .link-box {
            background-color: #F5F5F5;
            padding: 15px;
            border-radius: 8px;
            word-break: break-all;
            font-size: 14px;
            color: #666;
            border: 1px solid #E0E0E0;
            margin: 20px 0;
        }
        .warning {
            background: linear-gradient(135deg, #FFF3E0 0%, #FFE0B2 100%);
            border-left: 4px solid #FFC107;
            padding: 20px;
            margin: 25px 0;
            border-radius: 8px;
        }
        .warning-title {
            font-size: 16px;
            font-weight: 700;
            color: #4A4A4A;
            margin-bottom: 10px;
            display: flex;
            align-items: center;
        }
        .warning-icon {
            font-size: 20px;
            margin-right: 8px;
        }
        .warning ul {
            margin-left: 20px;
            color: #666;
        }
        .warning li {
            margin-bottom: 8px;
        }
        .divider {
            height: 1px;
            background: linear-gradient(90deg, transparent, #E0E0E0, transparent);
            margin: 30px 0;
        }
        .footer {
            background: linear-gradient(135deg, #4A4A4A 0%, #333 100%);
            color: #ffffff;
            padding: 30px;
            text-align: center;
        }
        .footer-logo {
            font-size: 24px;
            font-weight: 700;
            margin-bottom: 15px;
            color: #FFC107;
        }
        .footer-content {
            font-size: 14px;
            line-height: 1.8;
            opacity: 0.9;
        }
        .footer-content a {
            color: #FFC107;
            text-decoration: none;
        }
        .contact-info {
            display: flex;
            justify-content: center;
            gap: 20px;
            margin-top: 15px;
            flex-wrap: wrap;
        }
        .contact-item {
            display: flex;
            align-items: center;
            gap: 5px;
        }
        @media only screen and (max-width: 600px) {
            body {
                padding: 20px 10px;
            }
            .content {
                padding: 30px 20px;
            }
            .header h1 {
                font-size: 24px;
            }
            .greeting {
                font-size: 18px;
            }
            .button {
                padding: 14px 30px;
                font-size: 14px;
            }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <span class="header-icon">🔐</span>
            <h1>Recuperação de Senha</h1>
        </div>
        
        <div class="content">
            <p class="greeting">Olá, <strong>{{userName}}</strong>!</p>
            
            <p class="message">Recebemos uma solicitação para redefinir a senha da sua conta na <strong>Ax Festas</strong>.</p>
            
            <p class="message">Clique no botão abaixo para criar uma nova senha de forma segura:</p>
            
            <div class="button-container">
                <a href="{{resetLink}}" class="button">Redefinir Minha Senha</a>
            </div>
            
            <div class="divider"></div>
            
            <p class="message" style="font-size: 14px; color: #888;">Se o botão não funcionar, copie e cole este link no seu navegador:</p>
            <div class="link-box">{{resetLink}}</div>
            
            <div class="warning">
                <div class="warning-title">
                    <span class="warning-icon">⚠️</span>
                    Informações Importantes
                </div>
                <ul>
                    <li>Este link é válido por <strong>1 hora</strong> a partir do momento do envio</li>
                    <li>Se você não solicitou esta redefinição, ignore este email com segurança</li>
                    <li>Nunca compartilhe este link com outras pessoas</li>
                    <li>Por segurança, este link pode ser usado apenas uma vez</li>
                </ul>
            </div>
            
            <div class="divider"></div>
            
            <p class="message" style="text-align: center; font-size: 14px;">
                Precisa de ajuda? Nossa equipe está pronta para atendê-lo!
            </p>
        </div>
        
        <div class="footer">
            <div class="footer-logo">Ax Festas</div>
            <div class="footer-content">
                <p>Transformando momentos em memórias inesquecíveis</p>
                <div class="contact-info">
                    <div class="contact-item">
                        <span>📧</span>
                        <a href="mailto:contato@axfestas.com.br">contato@axfestas.com.br</a>
                    </div>
                    <div class="contact-item">
                        <span>📱</span>
                        <span>(00) 00000-0000</span>
                    </div>
                </div>
            </div>
        </div>
    </div>
</body>
</html>`,
};

/**
 * Carrega e processa um template de email
 */
export function loadEmailTemplate(templateName: string, variables: Record<string, string>): string {
  const template = EMAIL_TEMPLATES[templateName];
  if (!template) {
    console.error('Error loading email template:', `Template not found: ${templateName}`);
    throw new Error(`Failed to load email template: ${templateName}`);
  }

  // Substituir variáveis no formato {{variableName}}
  return Object.entries(variables).reduce((result, [key, value]) => {
    const regex = new RegExp(`{{${key}}}`, 'g');
    return result.replace(regex, value || '');
  }, template);
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
