'use client';

import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/useToast';
import { getReservationRequestStatusInfo } from '@/lib/reservationRequestUtils';

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

interface SiteSettings {
  phone: string;
  email: string;
  whatsapp_url?: string;
}

export default function ReservationRequestsPage() {
  const [requests, setRequests] = useState<ReservationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<ReservationRequest | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const { showSuccess, showError } = useToast();

  useEffect(() => {
    loadRequests();
    loadSettings();
  }, [filterStatus]);

  const loadSettings = async () => {
    try {
      const response = await fetch('/api/settings');
      if (response.ok) {
        const data = await response.json() as SiteSettings;
        setSettings(data);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const loadRequests = async () => {
    setLoading(true);
    try {
      const url = filterStatus === 'all' 
        ? '/api/reservation-requests'
        : `/api/reservation-requests?status=${filterStatus}`;
      
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setRequests(data as ReservationRequest[]);
      }
    } catch (error) {
      console.error('Error loading requests:', error);
      showError('Erro ao carregar solicitações');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (requestId: number, newStatus: string, reason?: string) => {
    try {
      const response = await fetch(`/api/reservation-requests?id=${requestId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, reason }),
      });

      if (response.ok) {
        const updatedRequest = await response.json() as ReservationRequest;
        showSuccess('Status atualizado com sucesso!');
        loadRequests();
        if (selectedRequest?.id === requestId) {
          setSelectedRequest(updatedRequest);
        }
      } else {
        showError('Erro ao atualizar status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      showError('Erro ao atualizar status');
    }
  };

  const handleApprove = (requestId: number) => {
    if (confirm('Confirma a aprovação desta solicitação? Um email será enviado ao cliente.')) {
      updateStatus(requestId, 'approved');
    }
  };

  const handleReject = (requestId: number) => {
    setShowRejectDialog(true);
  };

  const confirmReject = () => {
    if (selectedRequest) {
      updateStatus(selectedRequest.id, 'rejected', rejectReason);
      setShowRejectDialog(false);
      setRejectReason('');
    }
  };

  const getWhatsAppLink = (request: ReservationRequest) => {
    const phone = request.customer_phone.replace(/\D/g, '');
    const message = `Olá ${request.customer_name}! Agradecemos pela sua solicitação (${request.custom_id}). Gostaria de conversar sobre seu evento do dia ${new Date(request.event_date).toLocaleDateString('pt-BR')}. Podemos discutir alternativas de data ou opções disponíveis?`;
    return `https://wa.me/55${phone}?text=${encodeURIComponent(message)}`;
  };

  const getEmailLink = (request: ReservationRequest) => {
    const subject = `Sobre sua solicitação ${request.custom_id} - AX Festas`;
    const body = `Olá ${request.customer_name},\n\nAgradecemos pela sua solicitação de reserva (${request.custom_id}).\n\nGostaria de conversar sobre seu evento do dia ${new Date(request.event_date).toLocaleDateString('pt-BR')}.\n\nPodemos discutir alternativas de data ou opções que temos disponíveis?\n\nAguardo seu retorno.\n\nAtenciosamente,\nEquipe AX Festas`;
    return `mailto:${request.customer_email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const getStatusBadge = (status: string) => {
    const statusInfo = getReservationRequestStatusInfo(status);
    return (
      <span 
        className={`px-2 py-1 text-xs rounded font-semibold ${statusInfo.color}`}
        title={statusInfo.description}
      >
        {statusInfo.label}
      </span>
    );
  };

  const viewDetails = (request: ReservationRequest) => {
    setSelectedRequest(request);
    setShowDetails(true);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Solicitações de Reserva</h1>
        <div className="flex gap-2">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg"
          >
            <option value="all">Todas</option>
            <option value="pending">Pendente</option>
            <option value="contacted">Contactado</option>
            <option value="approved">Aprovado</option>
            <option value="rejected">Rejeitado</option>
            <option value="converted">Convertido</option>
            <option value="cancelled">Cancelado</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="bg-white p-8 rounded-lg shadow text-center">
          <p className="text-gray-500">Carregando solicitações...</p>
        </div>
      ) : requests.length === 0 ? (
        <div className="bg-white p-8 rounded-lg shadow text-center">
          <p className="text-gray-500">
            {filterStatus === 'all' 
              ? 'Nenhuma solicitação de reserva encontrada.'
              : `Nenhuma solicitação com status "${filterStatus}" encontrada.`}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contato</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data Evento</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Criado em</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {requests.map((request) => (
                <tr 
                  key={request.id} 
                  onClick={() => viewDetails(request)}
                  className="hover:bg-gray-100 cursor-pointer transition-colors"
                  title="Clique para ver detalhes"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-xs font-mono bg-green-100 text-green-800 px-2 py-1 rounded font-semibold">
                      {request.custom_id}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium">{request.customer_name}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-600">
                      <div>{request.customer_email}</div>
                      <div>{request.customer_phone}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {new Date(request.event_date).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="font-bold text-green-600">
                      R$ {request.total_amount.toFixed(2)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(request.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(request.created_at).toLocaleDateString('pt-BR')}<br />
                    {new Date(request.created_at).toLocaleTimeString('pt-BR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent row click event
                        viewDetails(request);
                      }}
                      className="text-blue-600 hover:text-blue-800 font-medium text-sm hover:underline"
                    >
                      Ver Detalhes
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal de Detalhes */}
      {showDetails && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <h2 className="text-2xl font-bold">
                Solicitação {selectedRequest.custom_id}
              </h2>
              <button
                onClick={() => setShowDetails(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="p-6">
              {/* Informações do Cliente */}
              <div className="mb-6">
                <h3 className="text-lg font-bold mb-3">Informações do Cliente</h3>
                <div className="bg-gray-50 p-4 rounded space-y-2">
                  <p><strong>Nome:</strong> {selectedRequest.customer_name}</p>
                  <p><strong>Email:</strong> {selectedRequest.customer_email}</p>
                  <p><strong>Telefone:</strong> {selectedRequest.customer_phone}</p>
                  <p><strong>Data do Evento:</strong> {new Date(selectedRequest.event_date).toLocaleDateString('pt-BR')}</p>
                  {selectedRequest.message && (
                    <p><strong>Mensagem:</strong> {selectedRequest.message}</p>
                  )}
                </div>
              </div>

              {/* Itens Solicitados */}
              <div className="mb-6">
                <h3 className="text-lg font-bold mb-3">Itens Solicitados</h3>
                <table className="w-full border border-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left">Item</th>
                      <th className="px-4 py-2 text-center">Qtd</th>
                      <th className="px-4 py-2 text-right">Preço Unit.</th>
                      <th className="px-4 py-2 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {(() => {
                      try {
                        const items = JSON.parse(selectedRequest.items_json);
                        return items.map((item: any, idx: number) => (
                          <tr key={idx}>
                            <td className="px-4 py-2">
                              <div className="font-medium">{item.name}</div>
                              {item.description && (
                                <div className="text-sm text-gray-500">{item.description}</div>
                              )}
                            </td>
                            <td className="px-4 py-2 text-center">{item.quantity}</td>
                            <td className="px-4 py-2 text-right">R$ {item.price.toFixed(2)}</td>
                            <td className="px-4 py-2 text-right">
                              R$ {(item.price * item.quantity).toFixed(2)}
                            </td>
                          </tr>
                        ));
                      } catch (e) {
                        return (
                          <tr>
                            <td colSpan={4} className="px-4 py-2 text-center text-red-500">
                              Erro ao carregar itens
                            </td>
                          </tr>
                        );
                      }
                    })()}
                  </tbody>
                  <tfoot className="bg-gray-50">
                    <tr>
                      <td colSpan={3} className="px-4 py-2 text-right font-bold">Total:</td>
                      <td className="px-4 py-2 text-right font-bold text-green-600">
                        R$ {selectedRequest.total_amount.toFixed(2)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Status e Ações */}
              <div className="mb-6">
                <h3 className="text-lg font-bold mb-3">Status e Ações</h3>
                <div className="bg-gray-50 p-4 rounded">
                  <div className="mb-4 p-3 bg-white border border-gray-200 rounded">
                    <p className="mb-2">
                      <strong>Status Atual:</strong> {getStatusBadge(selectedRequest.status)}
                    </p>
                    <p className="text-xs text-gray-600 italic">
                      {getReservationRequestStatusInfo(selectedRequest.status).description}
                    </p>
                  </div>
                  
                  {/* Botões de Aprovação/Rejeição */}
                  {selectedRequest.status === 'pending' && (
                    <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
                      <p className="text-sm font-semibold mb-2 text-blue-900">📋 Análise da Solicitação:</p>
                      <p className="text-xs text-gray-700 mb-3">Após analisar a disponibilidade dos itens:</p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleApprove(selectedRequest.id)}
                          className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded text-sm font-semibold flex items-center gap-2"
                          title="Itens disponíveis - email automático será enviado"
                        >
                          ✓ Aprovar Solicitação
                        </button>
                        <button
                          onClick={() => handleReject(selectedRequest.id)}
                          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded text-sm font-semibold flex items-center gap-2"
                          title="Sem disponibilidade - email automático será enviado"
                        >
                          ✗ Sem Disponibilidade
                        </button>
                      </div>
                      <p className="text-xs text-gray-600 mt-2 flex items-center gap-1">
                        <span>✉️</span> Email automático será enviado ao cliente informando a decisão
                      </p>
                    </div>
                  )}

                  {/* Botões de Contato */}
                  <div className="mb-4 p-3 bg-purple-50 border border-purple-200 rounded">
                    <p className="text-sm font-semibold mb-2 text-purple-900">💬 Contato Direto com Cliente:</p>
                    <div className="flex gap-2 flex-wrap">
                      <a
                        href={getEmailLink(selectedRequest)}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded text-sm flex items-center gap-2"
                        title="Abrir cliente de email com mensagem pré-preenchida"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                          <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                        </svg>
                        Enviar Email
                      </a>
                      <a
                        href={getWhatsAppLink(selectedRequest)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded text-sm flex items-center gap-2"
                        title="Abrir WhatsApp com mensagem pré-preenchida"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                        </svg>
                        WhatsApp
                      </a>
                    </div>
                    <p className="text-xs text-gray-600 mt-2">Para negociar datas, discutir opções ou esclarecer dúvidas</p>
                  </div>

                  {/* Outros Botões de Status */}
                  <div className="mb-3">
                    <p className="text-sm font-semibold mb-2">🔄 Atualizar Status:</p>
                    <div className="flex gap-2 flex-wrap">
                      {selectedRequest.status !== 'contacted' && selectedRequest.status !== 'approved' && selectedRequest.status !== 'rejected' && (
                        <button
                          onClick={() => updateStatus(selectedRequest.id, 'contacted')}
                          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded text-sm"
                          title="Cliente foi contatado e estamos em negociação"
                        >
                          📞 Em Contato
                        </button>
                      )}
                      {['contacted', 'approved'].includes(selectedRequest.status) && (
                        <button
                          onClick={() => updateStatus(selectedRequest.id, 'converted')}
                          className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded text-sm"
                          title="Cliente confirmou e reserva foi criada no sistema"
                        >
                          ✅ Reserva Confirmada
                        </button>
                      )}
                      {selectedRequest.status !== 'cancelled' && selectedRequest.status !== 'rejected' && (
                        <button
                          onClick={() => updateStatus(selectedRequest.id, 'cancelled')}
                          className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded text-sm"
                          title="Cancelar esta solicitação"
                        >
                          ✖ Cancelar
                        </button>
                      )}
                    </div>
                  </div>
                  
                  {/* Explicação do fluxo */}
                  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
                    <p className="text-xs font-semibold text-blue-900 mb-1">💡 Fluxo Recomendado:</p>
                    <ol className="text-xs text-gray-700 space-y-1 list-decimal list-inside">
                      <li><strong>Aguardando Análise</strong> → Verificar disponibilidade</li>
                      <li><strong>Aprovar</strong> ou <strong>Sem Disponibilidade</strong> → Email automático enviado</li>
                      <li><strong>Em Contato</strong> → Negociar com cliente via WhatsApp/Email</li>
                      <li><strong>Reserva Confirmada</strong> → Cliente aceitou e reserva foi criada</li>
                    </ol>
                  </div>
                </div>
              </div>

              {/* Informações Adicionais */}
              <div className="text-sm text-gray-500">
                <p>Criado em: {new Date(selectedRequest.created_at).toLocaleString('pt-BR')}</p>
                <p>Atualizado em: {new Date(selectedRequest.updated_at).toLocaleString('pt-BR')}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Rejeição */}
      {showRejectDialog && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4">Rejeitar Solicitação</h2>
            <p className="text-gray-600 mb-4">
              Deseja rejeitar a solicitação <strong>{selectedRequest.custom_id}</strong>?
            </p>
            <p className="text-sm text-gray-500 mb-4">
              Um email será enviado ao cliente sugerindo alternativas.
            </p>
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">
                Motivo da rejeição (opcional)
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                rows={3}
                placeholder="Ex: Itens não disponíveis na data solicitada..."
              />
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowRejectDialog(false);
                  setRejectReason('');
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100"
              >
                Cancelar
              </button>
              <button
                onClick={confirmReject}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg"
              >
                Confirmar Rejeição
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
