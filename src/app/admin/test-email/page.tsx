'use client';

import { useState } from 'react';
import { useToast } from '@/hooks/useToast';

interface TestResult {
  type: 'reservation' | 'password-reset';
  success: boolean;
  message: string;
  details?: string;
}

export default function TestEmailPage() {
  const [email, setEmail] = useState('');
  const [loadingReservation, setLoadingReservation] = useState(false);
  const [loadingPasswordReset, setLoadingPasswordReset] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);
  const { showSuccess, showError } = useToast();

  const addResult = (result: TestResult) => {
    setResults((prev) => [result, ...prev]);
  };

  const handleTestReservationEmail = async () => {
    if (!email) {
      showError('Por favor, insira um email destinatário');
      return;
    }

    setLoadingReservation(true);
    try {
      const response = await fetch('/api/email/send-reservation-confirmation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: email,
          customerName: 'Cliente Teste',
          reservationId: 9999,
          status: 'confirmed',
          dateFrom: new Date().toISOString(),
          dateTo: new Date(Date.now() + 86400000).toISOString(),
          itemsList: '<p>Item de teste - 1 unidade</p>',
        }),
      });

      const data = (await response.json()) as { success: boolean; message?: string; error?: string };

      if (data.success) {
        showSuccess('Email de confirmação de reserva enviado com sucesso!');
        addResult({
          type: 'reservation',
          success: true,
          message: 'Email de confirmação de reserva enviado com sucesso',
          details: data.message,
        });
      } else {
        showError(data.error || 'Erro ao enviar email');
        addResult({
          type: 'reservation',
          success: false,
          message: 'Falha ao enviar email de confirmação de reserva',
          details: data.error,
        });
      }
    } catch (err: unknown) {
      showError('Erro ao conectar com o serviço de email');
      addResult({
        type: 'reservation',
        success: false,
        message: 'Erro ao conectar com o serviço de email',
        details: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setLoadingReservation(false);
    }
  };

  const handleTestPasswordResetEmail = async () => {
    if (!email) {
      showError('Por favor, insira um email destinatário');
      return;
    }

    setLoadingPasswordReset(true);
    try {
      const response = await fetch('/api/email/send-password-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: email,
          userName: 'Usuário Teste',
          resetLink: `${window.location.origin}/reset-password?token=test-token-exemplo`,
        }),
      });

      const data = (await response.json()) as { success: boolean; message?: string; error?: string };

      if (data.success) {
        showSuccess('Email de recuperação de senha enviado com sucesso!');
        addResult({
          type: 'password-reset',
          success: true,
          message: 'Email de recuperação de senha enviado com sucesso',
          details: data.message,
        });
      } else {
        showError(data.error || 'Erro ao enviar email');
        addResult({
          type: 'password-reset',
          success: false,
          message: 'Falha ao enviar email de recuperação de senha',
          details: data.error,
        });
      }
    } catch (err: unknown) {
      showError('Erro ao conectar com o serviço de email');
      addResult({
        type: 'password-reset',
        success: false,
        message: 'Erro ao conectar com o serviço de email',
        details: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setLoadingPasswordReset(false);
    }
  };

  const clearResults = () => setResults([]);

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
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-pink-500"
          />
          <p className="text-xs text-gray-500 mt-1">
            O email de teste será enviado para este endereço.
          </p>
        </div>

        <div className="space-y-3">
          <div className="p-4 border border-gray-200 rounded-lg">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-medium text-gray-800">Confirmação de Reserva</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Envia um email simulando a confirmação de uma reserva (#9999).
                </p>
              </div>
              <button
                onClick={handleTestReservationEmail}
                disabled={loadingReservation}
                className="shrink-0 px-4 py-2 bg-pink-500 text-white rounded hover:bg-pink-600 disabled:bg-pink-300 text-sm font-medium"
              >
                {loadingReservation ? 'Enviando...' : 'Enviar Teste'}
              </button>
            </div>
          </div>

          <div className="p-4 border border-gray-200 rounded-lg">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-medium text-gray-800">Recuperação de Senha</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Envia um email simulando a recuperação de senha com link de exemplo.
                </p>
              </div>
              <button
                onClick={handleTestPasswordResetEmail}
                disabled={loadingPasswordReset}
                className="shrink-0 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-blue-300 text-sm font-medium"
              >
                {loadingPasswordReset ? 'Enviando...' : 'Enviar Teste'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Resultados */}
      {results.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Resultados</h2>
            <button
              onClick={clearResults}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Limpar
            </button>
          </div>

          <div className="space-y-3">
            {results.map((result, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border ${
                  result.success
                    ? 'bg-green-50 border-green-200'
                    : 'bg-red-50 border-red-200'
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-xl">{result.success ? '✅' : '❌'}</span>
                  <div className="flex-1 min-w-0">
                    <p
                      className={`font-medium ${
                        result.success ? 'text-green-800' : 'text-red-800'
                      }`}
                    >
                      {result.type === 'reservation'
                        ? '📅 Confirmação de Reserva'
                        : '🔑 Recuperação de Senha'}
                    </p>
                    <p
                      className={`text-sm mt-1 ${
                        result.success ? 'text-green-700' : 'text-red-700'
                      }`}
                    >
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
