/**
 * Utility functions for reservation request status handling
 */

export type ReservationRequestStatus = 'pending' | 'contacted' | 'converted' | 'cancelled';

interface StatusInfo {
  label: string;
  color: string;
}

const STATUS_MAP: Record<ReservationRequestStatus, StatusInfo> = {
  pending: { label: 'Pendente', color: 'bg-yellow-100 text-yellow-800' },
  contacted: { label: 'Contactado', color: 'bg-blue-100 text-blue-800' },
  converted: { label: 'Convertido', color: 'bg-green-100 text-green-800' },
  cancelled: { label: 'Cancelado', color: 'bg-red-100 text-red-800' },
};

/**
 * Returns the appropriate badge styling and label for a reservation request status
 */
export function getReservationRequestStatusInfo(status: string): StatusInfo {
  return STATUS_MAP[status as ReservationRequestStatus] || { 
    label: status, 
    color: 'bg-gray-100 text-gray-800' 
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
