'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import LogoutButton from '@/components/LogoutButton';
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
}

export default function AdminPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<ReservationRequest[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetch('/api/auth/user')
      .then((res) => {
        if (!res.ok) {
          throw new Error('Erro ao verificar autenticação');
        }
        return res.json();
      })
      .then((data: any) => {
        if (data.authenticated) {
          setUser(data.user);
        } else {
          router.push('/login');
        }
        setLoading(false);
      })
      .catch((error) => {
        console.error('Error loading user:', error);
        setLoading(false);
        router.push('/login');
      });
  }, [router]);

  useEffect(() => {
    // Carregar solicitações de reserva recentes
    if (user) {
      fetch('/api/reservation-requests?limit=5')
        .then((res) => {
          if (!res.ok) {
            throw new Error(`Erro HTTP: ${res.status}`);
          }
          return res.json();
        })
        .then((data) => {
          setRequests(data as ReservationRequest[]);
          setLoadingRequests(false);
        })
        .catch((error) => {
          console.error('Error loading reservation requests:', error);
          setRequests([]);
          setLoadingRequests(false);
        });
    }
  }, [user]);

  const getStatusBadge = (status: string) => {
    const statusInfo = getReservationRequestStatusInfo(status);
    return (
      <span className={`px-2 py-1 text-xs rounded font-semibold ${statusInfo.color}`}>
        {statusInfo.label}
      </span>
    );
  };

  if (loading) {
    return <div className="p-8">Carregando...</div>;
  }

  if (!user) {
    return <div className="p-8">Acesso negado. Faça login primeiro.</div>;
  }

  return (
    <>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Painel Administrativo</h1>
        <LogoutButton />
      </div>

      <div className="bg-white p-6 rounded-lg shadow mb-8">
        <p className="text-lg">
          Bem-vinde, <strong>{user.name}</strong>! ({user.email})
        </p>
        <p className="text-sm text-gray-600 mt-2">
          Cargo: <strong>{user.role}</strong>
        </p>
      </div>

      {/* Solicitações de Reserva Recentes */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">📋 Solicitações de Reserva Recentes</h2>
          <a
            href="/admin/reservation-requests"
            className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
          >
            Ver todas →
          </a>
        </div>

        {loadingRequests ? (
          <div className="text-center py-8 text-gray-500">Carregando solicitações...</div>
        ) : requests.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            Nenhuma solicitação de reserva ainda.
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map((request) => {
              let items: any[] = [];
              try {
                items = JSON.parse(request.items_json);
              } catch (e) {
                console.error('Error parsing items_json:', e);
              }

              return (
                <div
                  key={request.id}
                  className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono bg-green-100 text-green-800 px-2 py-1 rounded font-semibold">
                          {request.custom_id}
                        </span>
                        {getStatusBadge(request.status)}
                      </div>
                      <h3 className="font-bold text-lg mt-2">{request.customer_name}</h3>
                      <div className="text-sm text-gray-600 space-y-1 mt-1">
                        <p>📧 {request.customer_email}</p>
                        <p>📱 {request.customer_phone}</p>
                        <p>📅 Evento: {new Date(request.event_date).toLocaleDateString('pt-BR')}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">
                        {new Date(request.created_at).toLocaleDateString('pt-BR')}{' '}
                        {new Date(request.created_at).toLocaleTimeString('pt-BR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                      <p className="text-lg font-bold text-green-600 mt-1">
                        R$ {request.total_amount.toFixed(2)}
                      </p>
                    </div>
                  </div>

                  {items.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <p className="text-sm font-semibold mb-2">Itens ({items.length}):</p>
                      <div className="flex flex-wrap gap-2">
                        {items.slice(0, 3).map((item, idx) => (
                          <span
                            key={idx}
                            className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded"
                          >
                            {item.quantity}x {item.name}
                          </span>
                        ))}
                        {items.length > 3 && (
                          <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                            +{items.length - 3} mais
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {request.message && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <p className="text-sm text-gray-600">
                        <span className="font-semibold">Mensagem:</span> {request.message}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
