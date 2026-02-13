/**
 * Utility functions for reservation request status handling
 */

export type ReservationRequestStatus = 'pending' | 'contacted' | 'approved' | 'rejected' | 'converted' | 'cancelled';

interface StatusInfo {
  label: string;
  color: string;
  description: string;
}

const STATUS_MAP: Record<ReservationRequestStatus, StatusInfo> = {
  pending: { 
    label: 'Aguardando Análise', 
    color: 'bg-yellow-100 text-yellow-800',
    description: 'Solicitação recebida e aguardando análise da equipe'
  },
  contacted: { 
    label: 'Em Contato', 
    color: 'bg-blue-100 text-blue-800',
    description: 'Cliente foi contatado e estamos em negociação'
  },
  approved: { 
    label: 'Aprovado', 
    color: 'bg-green-100 text-green-800',
    description: 'Solicitação aprovada - email automático enviado ao cliente'
  },
  rejected: { 
    label: 'Não Disponível', 
    color: 'bg-red-100 text-red-800',
    description: 'Sem disponibilidade - email automático enviado com alternativas'
  },
  converted: { 
    label: 'Reserva Confirmada', 
    color: 'bg-purple-100 text-purple-800',
    description: 'Cliente confirmou e reserva foi criada no sistema'
  },
  cancelled: { 
    label: 'Cancelado', 
    color: 'bg-gray-100 text-gray-800',
    description: 'Solicitação cancelada (pelo cliente ou admin)'
  },
};

/**
 * Returns the appropriate badge styling and label for a reservation request status
 */
export function getReservationRequestStatusInfo(status: string): StatusInfo {
  return STATUS_MAP[status as ReservationRequestStatus] || { 
    label: status, 
    color: 'bg-gray-100 text-gray-800',
    description: 'Status desconhecido'
  };
}

/**
 * Returns a JSX element with the status badge
 */
export function renderReservationRequestStatusBadge(status: string): JSX.Element {
  const statusInfo = getReservationRequestStatusInfo(status);
  return (
    <span className={`px-2 py-1 text-xs rounded font-semibold ${statusInfo.color}`}>
      {statusInfo.label}
    </span>
  );
}
