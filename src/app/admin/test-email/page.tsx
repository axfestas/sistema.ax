'use client';

import { useState } from 'react';
import { useToast } from '@/hooks/useToast';

type EmailType =
  | 'reservation'
  | 'password-reset'
  | 'reservation-approval'
  | 'reservation-rejection'
  | 'cart-request-admin'
  | 'cart-request-customer';

interface TestResult {
  type: EmailType;
  success: boolean;
  message: string;
  details?: string;
}

const EMAIL_TYPE_LABELS: Record<EmailType, string> = {
  'reservation': '📅 Confirmação de Reserva',
  'password-reset': '🔑 Recuperação de Senha',
  'reservation-approval': '✅ Aprovação de Solicitação',
  'reservation-rejection': '❌ Sem Disponibilidade',
  'cart-request-admin': '🔔 Nova Solicitação (Admin)',
  'cart-request-customer': '🎉 Solicitação Recebida (Cliente)',
};

export default function TestEmailPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState<Record<EmailType, boolean>>({
    'reservation': false,
    'password-reset': false,
    'reservation-approval': false,
    'reservation-rejection': false,
    'cart-request-admin': false,
    'cart-request-customer': false,
  });
  const [results, setResults] = useState<TestResult[]>([]);
  const { showSuccess, showError } = useToast();

  const addResult = (result: TestResult) => {
    setResults((prev) => [result, ...prev]);
  };

  const setTypeLoading = (type: EmailType, value: boolean) => {
    setLoading((prev) => ({ ...prev, [type]: value }));
  };

  const sendTest = async (type: EmailType, endpoint: string, body: object) => {
    if (!email) {
      showError('Por favor, insira um email destinatário');
      return;
    }
    setTypeLoading(type, true);
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...body, to: email }),
      });
      const data = (await response.json()) as { success: boolean; message?: string; error?: string };
      if (data.success) {
        showSuccess(`${EMAIL_TYPE_LABELS[type]} enviado com sucesso!`);
        addResult({ type, success: true, message: `${EMAIL_TYPE_LABELS[type]} enviado com sucesso`, details: data.message });
      } else {
        showError(data.error || 'Erro ao enviar email');
        addResult({ type, success: false, message: `Falha ao enviar ${EMAIL_TYPE_LABELS[type]}`, details: data.error });
      }
    } catch (err: unknown) {
      showError('Erro ao conectar com o serviço de email');
      addResult({ type, success: false, message: 'Erro ao conectar com o serviço de email', details: err instanceof Error ? err.message : undefined });
    } finally {
      setTypeLoading(type, false);
    }
  };

  const testReservation = () =>
    sendTest('reservation', '/api/email/send-reservation-confirmation', {
      customerName: 'Cliente Teste',
      reservationId: 9999,
      status: 'confirmed',
      dateFrom: new Date().toISOString(),
      dateTo: new Date(Date.now() + 86400000).toISOString(),
      itemsList: '<p>Item de teste - 1 unidade</p>',
    });

  const testPasswordReset = () =>
    sendTest('password-reset', '/api/email/send-password-reset', {
      userName: 'Usuário Teste',
      resetLink: `${window.location.origin}/reset-password?token=test-token-exemplo`,
    });

  const testReservationApproval = () =>
    sendTest('reservation-approval', '/api/email/send-reservation-approval', {
      customerName: 'Cliente Teste',
      requestCustomId: 'SOL-A001',
      eventDate: new Date(Date.now() + 7 * 86400000).toISOString(),
      itemsList: '<tr><td>Balões Decorativos</td><td style="text-align:center">50</td><td style="text-align:right">R$ 150,00</td></tr>',
      total: 150,
    });

  const testReservationRejection = () =>
    sendTest('reservation-rejection', '/api/email/send-reservation-rejection', {
      customerName: 'Cliente Teste',
      requestCustomId: 'SOL-A002',
      eventDate: new Date(Date.now() + 7 * 86400000).toISOString(),
      reason: 'Itens indisponíveis para a data solicitada.',
    });

  const testCartRequestAdmin = () =>
    sendTest('cart-request-admin', '/api/email/send-cart-request-admin', {
      customerName: 'Cliente Teste',
      customerEmail: email,
      customerPhone: '(27) 99999-0000',
      eventDate: new Date(Date.now() + 14 * 86400000).toISOString(),
      message: 'Preciso de decoração para festa infantil.',
      itemsList: '<tr><td>Kit Festa</td><td style="text-align:center">1</td><td style="text-align:right">R$ 200,00</td><td style="text-align:right">R$ 200,00</td></tr>',
      total: 200,
    });

  const testCartRequestCustomer = () =>
    sendTest('cart-request-customer', '/api/email/send-cart-request-customer', {
      customerName: 'Cliente Teste',
      eventDate: new Date(Date.now() + 14 * 86400000).toISOString(),
      itemsList: '<tr><td>Kit Festa</td><td style="text-align:center">1</td><td style="text-align:right">R$ 200,00</td></tr>',
      total: 200,
    });

  const clearResults = () => setResults([]);

  const emailCards: { type: EmailType; title: string; description: string; handler: () => void; color: string }[] = [
    {
      type: 'reservation',
      title: 'Confirmação de Reserva',
      description: 'Email enviado ao cliente quando uma reserva é criada/confirmada no sistema.',
      handler: testReservation,
      color: 'blue',
    },
    {
      type: 'password-reset',
      title: 'Recuperação de Senha',
      description: 'Email com link seguro para o usuário redefinir sua senha.',
      handler: testPasswordReset,
      color: 'blue',
    },
    {
      type: 'reservation-approval',
      title: 'Aprovação de Solicitação',
      description: 'Email enviado ao cliente quando o admin aprova uma solicitação do carrinho.',
      handler: testReservationApproval,
      color: 'green',
    },
    {
      type: 'reservation-rejection',
      title: 'Sem Disponibilidade',
      description: 'Email enviado ao cliente quando não há disponibilidade para a data solicitada.',
      handler: testReservationRejection,
      color: 'amber',
    },
    {
      type: 'cart-request-admin',
      title: 'Nova Solicitação (Admin)',
      description: 'Email enviado ao admin quando um cliente envia uma nova solicitação pelo carrinho.',
      handler: testCartRequestAdmin,
      color: 'purple',
    },
    {
      type: 'cart-request-customer',
      title: 'Solicitação Recebida (Cliente)',
      description: 'Email de confirmação enviado ao cliente após ele enviar uma solicitação pelo carrinho.',
      handler: testCartRequestCustomer,
      color: 'teal',
    },
  ];

  const colorMap: Record<string, string> = {
    blue: 'bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300',
    green: 'bg-green-500 hover:bg-green-600 disabled:bg-green-300',
    amber: 'bg-amber-500 hover:bg-amber-600 disabled:bg-amber-300',
    purple: 'bg-purple-500 hover:bg-purple-600 disabled:bg-purple-300',
    teal: 'bg-teal-500 hover:bg-teal-600 disabled:bg-teal-300',
  };

  return (
    <div className="max-w-2xl">
      {/* Guia de uso */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-3">📋 Como usar</h2>
        <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
          <li>
            Digite o seu email (ex:{' '}
            <span className="font-medium">alex.fraga@axfestas.com.br</span>) no campo abaixo.
          </li>
          <li>
            Clique em <span className="font-medium">Enviar Teste</span> no tipo de email que quer
            verificar.
          </li>
          <li>Aguarde alguns segundos — o resultado aparecerá na tela.</li>
          <li>
            <span className="text-green-700 font-medium">✅ Sucesso</span> → abra sua caixa de
            entrada e confira o email recebido.
          </li>
          <li>
            <span className="text-red-700 font-medium">❌ Erro</span> → leia a mensagem de erro; o
            problema mais comum é a{' '}
            <code className="bg-gray-100 px-1 rounded">RESEND_API_KEY</code> não configurada no
            Cloudflare.
          </li>
        </ol>
        <p className="mt-3 text-xs text-gray-500">
          Os emails saem como{' '}
          <code className="bg-gray-100 px-1 rounded">noreply@axfestas.com.br</code> e chegam na
          caixa de entrada normal (verifique também o spam).
        </p>
      </div>

      {/* Formulário de teste */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Configuração do Teste</h2>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email Destinatário *
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="seu@email.com"
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-xs text-gray-500 mt-1">
            O email de teste será enviado para este endereço.
          </p>
        </div>

        <div className="space-y-3">
          {emailCards.map(({ type, title, description, handler, color }) => (
            <div key={type} className="p-4 border border-gray-200 rounded-lg">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-medium text-gray-800">{title}</h3>
                  <p className="text-sm text-gray-500 mt-1">{description}</p>
                </div>
                <button
                  onClick={handler}
                  disabled={loading[type]}
                  className={`shrink-0 px-4 py-2 text-white rounded text-sm font-medium ${colorMap[color]}`}
                >
                  {loading[type] ? 'Enviando...' : 'Enviar Teste'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Resultados */}
      {results.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Resultados</h2>
            <button onClick={clearResults} className="text-sm text-gray-500 hover:text-gray-700">
              Limpar
            </button>
          </div>

          <div className="space-y-3">
            {results.map((result, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border ${
                  result.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-xl">{result.success ? '✅' : '❌'}</span>
                  <div className="flex-1 min-w-0">
                    <p className={`font-medium ${result.success ? 'text-green-800' : 'text-red-800'}`}>
                      {EMAIL_TYPE_LABELS[result.type]}
                    </p>
                    <p className={`text-sm mt-1 ${result.success ? 'text-green-700' : 'text-red-700'}`}>
                      {result.message}
                    </p>
                    {result.details && (
                      <p className="text-xs text-gray-500 mt-1 break-all">{result.details}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Informações sobre configuração */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="font-medium text-blue-800 mb-2">ℹ️ Informações de Configuração</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>
            • Remetente: <code className="bg-blue-100 px-1 rounded">noreply@axfestas.com.br</code>
          </li>
          <li>• Serviço: Resend (domínio axfestas.com.br verificado)</li>
          <li>
            • Variável de ambiente necessária:{' '}
            <code className="bg-blue-100 px-1 rounded">RESEND_API_KEY</code>
          </li>
        </ul>
      </div>
    </div>
  );
}
