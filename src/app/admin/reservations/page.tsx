'use client';

import { useEffect, useState } from 'react';

interface Item {
  id: number;
  name: string;
}

interface Reservation {
  id: number;
  item_id: number;
  customer_name: string;
  customer_email?: string;
  date_from: string;
  date_to: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
}

export default function ReservationsPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingReservation, setEditingReservation] = useState<Reservation | null>(null);
  const [formData, setFormData] = useState({
    item_id: '',
    customer_name: '',
    customer_email: '',
    date_from: '',
    date_to: '',
    status: 'pending' as 'pending' | 'confirmed' | 'completed' | 'cancelled',
  });

  useEffect(() => {
    loadReservations();
    loadItems();
  }, []);

  const loadReservations = async () => {
    try {
      const response = await fetch('/api/reservations');
      if (response.ok) {
        const data: any = await response.json();
        setReservations(data);
      }
    } catch (error) {
      console.error('Error loading reservations:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadItems = async () => {
    try {
      const response = await fetch('/api/items');
      if (response.ok) {
        const data: any = await response.json();
        setItems(data);
      }
    } catch (error) {
      console.error('Error loading items:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const reservationData = {
      item_id: parseInt(formData.item_id),
      customer_name: formData.customer_name,
      customer_email: formData.customer_email || undefined,
      date_from: formData.date_from,
      date_to: formData.date_to,
      status: formData.status,
    };

    try {
      const url = editingReservation
        ? `/api/reservations?id=${editingReservation.id}`
        : '/api/reservations';
      const method = editingReservation ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reservationData),
      });

      if (response.ok) {
        await loadReservations();
        setShowForm(false);
        setEditingReservation(null);
        setFormData({
          item_id: '',
          customer_name: '',
          customer_email: '',
          date_from: '',
          date_to: '',
          status: 'pending',
        });
      } else {
        const error: any = await response.json();
        alert('Erro: ' + (error.error || 'Falha ao salvar reserva'));
      }
    } catch (error) {
      console.error('Error saving reservation:', error);
      alert('Erro ao salvar reserva');
    }
  };

  const handleEdit = (reservation: Reservation) => {
    setEditingReservation(reservation);
    setFormData({
      item_id: reservation.item_id.toString(),
      customer_name: reservation.customer_name,
      customer_email: reservation.customer_email || '',
      date_from: reservation.date_from,
      date_to: reservation.date_to,
      status: reservation.status,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Tem certeza que deseja deletar esta reserva?')) return;

    try {
      const response = await fetch(`/api/reservations?id=${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await loadReservations();
      } else {
        alert('Erro ao deletar reserva');
      }
    } catch (error) {
      console.error('Error deleting reservation:', error);
      alert('Erro ao deletar reserva');
    }
  };

  const getItemName = (itemId: number) => {
    const item = items.find((i) => i.id === itemId);
    return item ? item.name : `Item #${itemId}`;
  };

  const getStatusColor = (status: string) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      pending: 'Pendente',
      confirmed: 'Confirmada',
      completed: 'Concluída',
      cancelled: 'Cancelada',
    };
    return labels[status as keyof typeof labels] || status;
  };

  if (loading) {
    return <div className="p-4">Carregando...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Gerenciamento de Reservas</h2>
        <button
          onClick={() => {
            setShowForm(true);
            setEditingReservation(null);
            setFormData({
              item_id: '',
              customer_name: '',
              customer_email: '',
              date_from: '',
              date_to: '',
              status: 'pending',
            });
          }}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          + Nova Reserva
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h3 className="text-xl font-bold mb-4">
            {editingReservation ? 'Editar Reserva' : 'Nova Reserva'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Item</label>
              <select
                value={formData.item_id}
                onChange={(e) => setFormData({ ...formData, item_id: e.target.value })}
                required
                className="w-full px-3 py-2 border rounded"
              >
                <option value="">Selecione um item</option>
                {items.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Nome do Cliente</label>
              <input
                type="text"
                value={formData.customer_name}
                onChange={(e) =>
                  setFormData({ ...formData, customer_name: e.target.value })
                }
                required
                className="w-full px-3 py-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Email do Cliente</label>
              <input
                type="email"
                value={formData.customer_email}
                onChange={(e) =>
                  setFormData({ ...formData, customer_email: e.target.value })
                }
                className="w-full px-3 py-2 border rounded"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Data Início</label>
                <input
                  type="date"
                  value={formData.date_from}
                  onChange={(e) =>
                    setFormData({ ...formData, date_from: e.target.value })
                  }
                  required
                  className="w-full px-3 py-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Data Fim</label>
                <input
                  type="date"
                  value={formData.date_to}
                  onChange={(e) => setFormData({ ...formData, date_to: e.target.value })}
                  required
                  className="w-full px-3 py-2 border rounded"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Status</label>
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    status: e.target.value as any,
                  })
                }
                className="w-full px-3 py-2 border rounded"
              >
                <option value="pending">Pendente</option>
                <option value="confirmed">Confirmada</option>
                <option value="completed">Concluída</option>
                <option value="cancelled">Cancelada</option>
              </select>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
              >
                Salvar
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingReservation(null);
                }}
                className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        {reservations.length === 0 ? (
          <div className="px-6 py-4">
            <p className="text-gray-500">Nenhuma reserva cadastrada</p>
          </div>
        ) : (
          <ul role="list" className="divide-y divide-gray-200">
            {reservations.map((reservation) => (
              <li key={reservation.id} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold">
                        {reservation.customer_name}
                      </h3>
                      <span
                        className={`px-2 py-1 text-xs rounded ${getStatusColor(
                          reservation.status
                        )}`}
                      >
                        {getStatusLabel(reservation.status)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      Item: {getItemName(reservation.item_id)}
                    </p>
                    {reservation.customer_email && (
                      <p className="text-sm text-gray-600">
                        Email: {reservation.customer_email}
                      </p>
                    )}
                    <p className="text-sm text-gray-600 mt-1">
                      {reservation.date_from} até {reservation.date_to}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(reservation)}
                      className="bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-1 px-3 rounded text-sm"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(reservation.id)}
                      className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-3 rounded text-sm"
                    >
                      Deletar
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}