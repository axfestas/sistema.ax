'use client';

import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/useToast';
import { formatReservationId } from '@/lib/formatId';

interface SelectableItem {
  id: number;
  name: string;
  type: 'item' | 'kit' | 'sweet' | 'design';
  displayName: string;
}

interface Client {
  id: number;
  name: string;
  email?: string;
  phone: string;
}

interface Reservation {
  id: number;
  item_id?: number;
  kit_id?: number;
  sweet_id?: number;
  design_id?: number;
  client_id?: number;
  customer_name: string;
  customer_email?: string;
  date_from: string;
  date_to: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
}

export default function ReservationsPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [allItems, setAllItems] = useState<SelectableItem[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingReservation, setEditingReservation] = useState<Reservation | null>(null);
  const [formData, setFormData] = useState({
    selected_item: '', // formato: "type:id" ex: "item:1", "kit:2", "sweet:3", "design:4"
    client_id: '',
    customer_name: '',
    customer_email: '',
    date_from: '',
    date_to: '',
    status: 'pending' as 'pending' | 'confirmed' | 'completed' | 'cancelled',
  });
  const { showSuccess, showError } = useToast();

  useEffect(() => {
    loadReservations();
    loadAllItems();
    loadClients();
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

  const loadAllItems = async () => {
    try {
      const items: SelectableItem[] = [];
      
      // Load inventory items
      const itemsRes = await fetch('/api/items');
      if (itemsRes.ok) {
        const data: any[] = await itemsRes.json();
        data.forEach(item => items.push({
          id: item.id,
          name: item.name,
          type: 'item',
          displayName: `[Estoque] ${item.name}`
        }));
      }
      
      // Load kits
      const kitsRes = await fetch('/api/kits');
      if (kitsRes.ok) {
        const data: any[] = await kitsRes.json();
        data.forEach(kit => items.push({
          id: kit.id,
          name: kit.name,
          type: 'kit',
          displayName: `[Kit] ${kit.name}`
        }));
      }
      
      // Load sweets
      const sweetsRes = await fetch('/api/sweets');
      if (sweetsRes.ok) {
        const data: any[] = await sweetsRes.json();
        data.forEach(sweet => items.push({
          id: sweet.id,
          name: sweet.name,
          type: 'sweet',
          displayName: `[Doce] ${sweet.name}`
        }));
      }
      
      // Load designs
      const designsRes = await fetch('/api/designs');
      if (designsRes.ok) {
        const data: any[] = await designsRes.json();
        data.forEach(design => items.push({
          id: design.id,
          name: design.name,
          type: 'design',
          displayName: `[Design] ${design.name}`
        }));
      }
      
      setAllItems(items);
    } catch (error) {
      console.error('Error loading items:', error);
    }
  };

  const loadClients = async () => {
    try {
      const response = await fetch('/api/clients');
      if (response.ok) {
        const data: any = await response.json();
        setClients(data);
      }
    } catch (error) {
      console.error('Error loading clients:', error);
    }
  };

  const handleClientChange = (clientId: string) => {
    setFormData({ ...formData, client_id: clientId });
    
    if (clientId) {
      const client = clients.find(c => c.id.toString() === clientId);
      if (client) {
        setFormData({
          ...formData,
          client_id: clientId,
          customer_name: client.name,
          customer_email: client.email || '',
        });
      }
    } else {
      setFormData({
        ...formData,
        client_id: '',
        customer_name: '',
        customer_email: '',
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate selected_item format
    if (!formData.selected_item || !formData.selected_item.includes(':')) {
      showError('Por favor, selecione um item válido');
      return;
    }

    // Parse selected item
    const [itemType, itemIdStr] = formData.selected_item.split(':');
    const itemId = parseInt(itemIdStr);
    
    if (isNaN(itemId)) {
      showError('Item selecionado inválido');
      return;
    }

    const reservationData: any = {
      customer_name: formData.customer_name,
      customer_email: formData.customer_email || undefined,
      date_from: formData.date_from,
      date_to: formData.date_to,
      status: formData.status,
    };

    // Add the appropriate ID field based on type
    if (itemType === 'item') {
      reservationData.item_id = itemId;
    } else if (itemType === 'kit') {
      reservationData.kit_id = itemId;
    } else if (itemType === 'sweet') {
      reservationData.sweet_id = itemId;
    } else if (itemType === 'design') {
      reservationData.design_id = itemId;
    } else {
      showError('Tipo de item inválido');
      return;
    }

    // Add client_id if selected
    if (formData.client_id) {
      reservationData.client_id = parseInt(formData.client_id);
    }

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
          selected_item: '',
          client_id: '',
          customer_name: '',
          customer_email: '',
          date_from: '',
          date_to: '',
          status: 'pending',
        });
        showSuccess(editingReservation ? 'Reserva atualizada com sucesso!' : 'Reserva criada com sucesso!');
      } else {
        const error: any = await response.json();
        showError(error.error || 'Erro ao salvar reserva');
      }
    } catch (error) {
      console.error('Error saving reservation:', error);
      showError('Erro ao salvar reserva');
    }
  };

  const handleEdit = (reservation: Reservation) => {
    setEditingReservation(reservation);
    
    // Determine selected item type and create the composite ID
    let selectedItem = '';
    if (reservation.item_id) {
      selectedItem = `item:${reservation.item_id}`;
    } else if (reservation.kit_id) {
      selectedItem = `kit:${reservation.kit_id}`;
    } else if (reservation.sweet_id) {
      selectedItem = `sweet:${reservation.sweet_id}`;
    } else if (reservation.design_id) {
      selectedItem = `design:${reservation.design_id}`;
    }
    
    setFormData({
      selected_item: selectedItem,
      client_id: reservation.client_id?.toString() || '',
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
        showSuccess('Reserva deletada com sucesso!');
      } else {
        showError('Erro ao deletar reserva');
      }
    } catch (error) {
      console.error('Error deleting reservation:', error);
      showError('Erro ao deletar reserva');
    }
  };

  const getReservationItemName = (reservation: Reservation) => {
    if (reservation.item_id) {
      const item = allItems.find(i => i.type === 'item' && i.id === reservation.item_id);
      return item ? item.displayName : `Item #${reservation.item_id}`;
    } else if (reservation.kit_id) {
      const item = allItems.find(i => i.type === 'kit' && i.id === reservation.kit_id);
      return item ? item.displayName : `Kit #${reservation.kit_id}`;
    } else if (reservation.sweet_id) {
      const item = allItems.find(i => i.type === 'sweet' && i.id === reservation.sweet_id);
      return item ? item.displayName : `Doce #${reservation.sweet_id}`;
    } else if (reservation.design_id) {
      const item = allItems.find(i => i.type === 'design' && i.id === reservation.design_id);
      return item ? item.displayName : `Design #${reservation.design_id}`;
    }
    return 'Item não especificado';
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
              selected_item: '',
              client_id: '',
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
              <label className="block text-sm font-medium mb-1">Item *</label>
              <select
                value={formData.selected_item}
                onChange={(e) => setFormData({ ...formData, selected_item: e.target.value })}
                required
                className="w-full px-3 py-2 border rounded"
              >
                <option value="">Selecione um item</option>
                {allItems.map((item) => (
                  <option key={`${item.type}:${item.id}`} value={`${item.type}:${item.id}`}>
                    {item.displayName}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Selecione de Estoque, Kits, Doces ou Designs
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Cliente</label>
              <select
                value={formData.client_id}
                onChange={(e) => handleClientChange(e.target.value)}
                className="w-full px-3 py-2 border rounded"
              >
                <option value="">Selecione um cliente ou digite manualmente abaixo</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name} - {client.phone}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Ou preencha os dados manualmente abaixo
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Nome do Cliente *</label>
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
                      <span className="text-xs font-mono bg-green-100 text-green-800 px-2 py-1 rounded font-semibold">
                        {formatReservationId(reservation.id)}
                      </span>
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
                      Item: {getReservationItemName(reservation)}
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