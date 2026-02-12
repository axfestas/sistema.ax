'use client';

import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/useToast';

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

export default function ReservationRequestsPage() {
  const [requests, setRequests] = useState<ReservationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<ReservationRequest | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const { showSuccess, showError } = useToast();

  useEffect(() => {
    loadRequests();
  }, [filterStatus]);

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

  const updateStatus = async (requestId: number, newStatus: string) => {
    try {
      const response = await fetch(`/api/reservation-requests?id=${requestId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        showSuccess('Status atualizado com sucesso!');
        loadRequests();
        if (selectedRequest?.id === requestId) {
          setShowDetails(false);
          setSelectedRequest(null);
        }
      } else {
        showError('Erro ao atualizar status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      showError('Erro ao atualizar status');
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; color: string }> = {
      pending: { label: 'Pendente', color: 'bg-yellow-100 text-yellow-800' },
      contacted: { label: 'Contactado', color: 'bg-blue-100 text-blue-800' },
      converted: { label: 'Convertido', color: 'bg-green-100 text-green-800' },
      cancelled: { label: 'Cancelado', color: 'bg-red-100 text-red-800' },
    };
    const statusInfo = statusMap[status] || { label: status, color: 'bg-gray-100 text-gray-800' };
    return (
      <span className={`px-2 py-1 text-xs rounded font-semibold ${statusInfo.color}`}>
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
                <tr key={request.id} className="hover:bg-gray-50">
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
                      onClick={() => viewDetails(request)}
                      className="text-blue-600 hover:text-blue-800 font-medium text-sm"
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
                  <p className="mb-3">
                    <strong>Status Atual:</strong> {getStatusBadge(selectedRequest.status)}
                  </p>
                  <div className="flex gap-2 flex-wrap">
                    {selectedRequest.status !== 'contacted' && (
                      <button
                        onClick={() => updateStatus(selectedRequest.id, 'contacted')}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded text-sm"
                      >
                        Marcar como Contactado
                      </button>
                    )}
                    {selectedRequest.status !== 'converted' && (
                      <button
                        onClick={() => updateStatus(selectedRequest.id, 'converted')}
                        className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded text-sm"
                      >
                        Marcar como Convertido
                      </button>
                    )}
                    {selectedRequest.status !== 'cancelled' && (
                      <button
                        onClick={() => updateStatus(selectedRequest.id, 'cancelled')}
                        className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded text-sm"
                      >
                        Cancelar Solicitação
                      </button>
                    )}
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
    </div>
  );
}
