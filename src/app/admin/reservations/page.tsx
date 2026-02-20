'use client';

import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/useToast';
import { formatReservationId } from '@/lib/formatId';
import ImageUpload from '@/components/ImageUpload';

interface SelectableItem {
  id: number;
  name: string;
  type: 'item' | 'kit' | 'sweet' | 'design' | 'theme';
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
  theme_id?: number;
  client_id?: number;
  customer_name: string;
  customer_email?: string;
  customer_phone?: string;
  date_from: string;
  date_to: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  total_amount?: number;
  payment_type?: string;
  payment_receipt_url?: string;
  contract_url?: string;
}

const PAYMENT_TYPES = [
  { value: '', label: 'Selecione o tipo' },
  { value: 'pix', label: 'Pix' },
  { value: 'cartao_credito', label: 'Cartão de Crédito' },
  { value: 'cartao_debito', label: 'Cartão de Débito' },
  { value: 'dinheiro', label: 'Dinheiro' },
  { value: 'transferencia', label: 'Transferência Bancária' },
  { value: 'cheque', label: 'Cheque' },
  { value: 'boleto', label: 'Boleto' },
];

const emptyForm = {
  selected_item: '',
  client_id: '',
  customer_name: '',
  customer_email: '',
  customer_phone: '',
  date_from: '',
  date_to: '',
  status: 'pending' as 'pending' | 'confirmed' | 'completed' | 'cancelled',
  total_amount: '',
  payment_type: '',
  payment_receipt_url: '',
  contract_url: '',
};

export default function ReservationsPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [allItems, setAllItems] = useState<SelectableItem[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingReservation, setEditingReservation] = useState<Reservation | null>(null);
  const [formData, setFormData] = useState({ ...emptyForm });
  const { showSuccess, showError } = useToast();

  useEffect(() => {
    loadReservations();
    loadAllItems();
    loadClients();
  }, []);

  const loadReservations = async () => {
    try {
      const response = await fetch('/api/reservations');
      if (!response.ok) throw new Error(`Erro HTTP: ${response.status}`);
      const data: any = await response.json();
      setReservations(data);
    } catch (error) {
      console.error('Error loading reservations:', error);
      setReservations([]);
    } finally {
      setLoading(false);
    }
  };

  const loadAllItems = async () => {
    try {
      const items: SelectableItem[] = [];
      const [itemsRes, kitsRes, sweetsRes, designsRes, themesRes] = await Promise.all([
        fetch('/api/items'),
        fetch('/api/kits'),
        fetch('/api/sweets'),
        fetch('/api/designs'),
        fetch('/api/themes'),
      ]);
      if (itemsRes.ok) {
        const d: any[] = await itemsRes.json();
        d.forEach(x => items.push({ id: x.id, name: x.name, type: 'item', displayName: `[Estoque] ${x.name}` }));
      }
      if (kitsRes.ok) {
        const d: any[] = await kitsRes.json();
        d.forEach(x => items.push({ id: x.id, name: x.name, type: 'kit', displayName: `[Kit] ${x.name}` }));
      }
      if (sweetsRes.ok) {
        const d: any[] = await sweetsRes.json();
        d.forEach(x => items.push({ id: x.id, name: x.name, type: 'sweet', displayName: `[Doce] ${x.name}` }));
      }
      if (designsRes.ok) {
        const d: any[] = await designsRes.json();
        d.forEach(x => items.push({ id: x.id, name: x.name, type: 'design', displayName: `[Design] ${x.name}` }));
      }
      if (themesRes.ok) {
        const d: any[] = await themesRes.json();
        d.forEach(x => items.push({ id: x.id, name: x.name, type: 'theme', displayName: `[Tema] ${x.name}` }));
      }
      setAllItems(items);
    } catch (error) {
      console.error('Error loading items:', error);
      setAllItems([]);
    }
  };

  const loadClients = async () => {
    try {
      const response = await fetch('/api/clients');
      if (!response.ok) throw new Error(`Erro HTTP: ${response.status}`);
      const data: any = await response.json();
      setClients(data);
    } catch (error) {
      console.error('Error loading clients:', error);
      setClients([]);
    }
  };

  const handleClientChange = (clientId: string) => {
    if (clientId) {
      const client = clients.find(c => c.id.toString() === clientId);
      if (client) {
        setFormData(prev => ({
          ...prev,
          client_id: clientId,
          customer_name: client.name,
          customer_email: client.email || '',
          customer_phone: client.phone || '',
        }));
        return;
      }
    }
    setFormData(prev => ({ ...prev, client_id: '', customer_name: '', customer_email: '', customer_phone: '' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.selected_item || !formData.selected_item.includes(':')) {
      showError('Por favor, selecione um item válido');
      return;
    }

    const [itemType, itemIdStr] = formData.selected_item.split(':');
    const itemId = parseInt(itemIdStr);
    if (isNaN(itemId)) { showError('Item selecionado inválido'); return; }

    const reservationData: any = {
      customer_name: formData.customer_name,
      customer_email: formData.customer_email || undefined,
      customer_phone: formData.customer_phone || undefined,
      date_from: formData.date_from,
      date_to: formData.date_to,
      status: formData.status,
      total_amount: formData.total_amount ? parseFloat(formData.total_amount) : undefined,
      payment_type: formData.payment_type || undefined,
      payment_receipt_url: formData.payment_receipt_url || undefined,
      contract_url: formData.contract_url || undefined,
    };

    if (itemType === 'item') reservationData.item_id = itemId;
    else if (itemType === 'kit') reservationData.kit_id = itemId;
    else if (itemType === 'sweet') reservationData.sweet_id = itemId;
    else if (itemType === 'design') reservationData.design_id = itemId;
    else if (itemType === 'theme') reservationData.theme_id = itemId;
    else { showError('Tipo de item inválido'); return; }

    if (formData.client_id) reservationData.client_id = parseInt(formData.client_id);

    try {
      const url = editingReservation ? `/api/reservations?id=${editingReservation.id}` : '/api/reservations';
      const method = editingReservation ? 'PUT' : 'POST';
      const response = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(reservationData) });

      if (!response.ok) throw new Error(`Erro HTTP: ${response.status}`);

      await loadReservations();
      setShowForm(false);
      setEditingReservation(null);
      setFormData({ ...emptyForm });
      showSuccess(editingReservation ? 'Reserva atualizada com sucesso!' : 'Reserva criada com sucesso!');
    } catch (error) {
      console.error('Error saving reservation:', error);
      showError('Erro ao salvar reserva');
    }
  };

  const handleEdit = (reservation: Reservation) => {
    setEditingReservation(reservation);
    let selectedItem = '';
    if (reservation.item_id) selectedItem = `item:${reservation.item_id}`;
    else if (reservation.kit_id) selectedItem = `kit:${reservation.kit_id}`;
    else if (reservation.sweet_id) selectedItem = `sweet:${reservation.sweet_id}`;
    else if (reservation.design_id) selectedItem = `design:${reservation.design_id}`;
    else if (reservation.theme_id) selectedItem = `theme:${reservation.theme_id}`;
    setFormData({
      selected_item: selectedItem,
      client_id: reservation.client_id?.toString() || '',
      customer_name: reservation.customer_name,
      customer_email: reservation.customer_email || '',
      customer_phone: reservation.customer_phone || '',
      date_from: reservation.date_from,
      date_to: reservation.date_to,
      status: reservation.status,
      total_amount: reservation.total_amount?.toString() || '',
      payment_type: reservation.payment_type || '',
      payment_receipt_url: reservation.payment_receipt_url || '',
      contract_url: reservation.contract_url || '',
    });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Tem certeza que deseja deletar esta reserva?')) return;
    try {
      const response = await fetch(`/api/reservations?id=${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error(`Erro HTTP: ${response.status}`);
      await loadReservations();
      showSuccess('Reserva deletada com sucesso!');
    } catch (error) {
      console.error('Error deleting reservation:', error);
      showError('Erro ao deletar reserva');
    }
  };

  const getReservationItemName = (reservation: Reservation) => {
    if (reservation.item_id) {
      const i = allItems.find(x => x.type === 'item' && x.id === reservation.item_id);
      return i ? i.displayName : `Item #${reservation.item_id}`;
    }
    if (reservation.kit_id) {
      const i = allItems.find(x => x.type === 'kit' && x.id === reservation.kit_id);
      return i ? i.displayName : `Kit #${reservation.kit_id}`;
    }
    if (reservation.sweet_id) {
      const i = allItems.find(x => x.type === 'sweet' && x.id === reservation.sweet_id);
      return i ? i.displayName : `Doce #${reservation.sweet_id}`;
    }
    if (reservation.design_id) {
      const i = allItems.find(x => x.type === 'design' && x.id === reservation.design_id);
      return i ? i.displayName : `Design #${reservation.design_id}`;
    }
    if (reservation.theme_id) {
      const i = allItems.find(x => x.type === 'theme' && x.id === reservation.theme_id);
      return i ? i.displayName : `Tema #${reservation.theme_id}`;
    }
    return 'Item não especificado';
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: 'Pendente',
      confirmed: 'Confirmada',
      completed: 'Concluída',
      cancelled: 'Cancelada',
    };
    return labels[status] || status;
  };
  const getPaymentTypeLabel = (type?: string) => PAYMENT_TYPES.find(p => p.value === type)?.label || type || '';

  if (loading) return <div className="p-4">Carregando...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Gerenciamento de Reservas</h2>
        <button
          onClick={() => { setShowForm(true); setEditingReservation(null); setFormData({ ...emptyForm }); }}
          className="bg-brand-blue hover:bg-brand-blue-dark text-white font-bold py-2 px-4 rounded"
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
            {/* Item */}
            <div>
              <label className="block text-sm font-medium mb-1">Item *</label>
              <select value={formData.selected_item} onChange={(e) => setFormData({ ...formData, selected_item: e.target.value })} required className="w-full px-3 py-2 border rounded">
                <option value="">Selecione um item</option>
                {allItems.map((item) => (
                  <option key={`${item.type}:${item.id}`} value={`${item.type}:${item.id}`}>{item.displayName}</option>
                ))}
              </select>
            </div>
            {/* Client */}
            <div>
              <label className="block text-sm font-medium mb-1">Cliente</label>
              <select value={formData.client_id} onChange={(e) => handleClientChange(e.target.value)} className="w-full px-3 py-2 border rounded">
                <option value="">Selecione um cliente ou preencha abaixo</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>{client.name} - {client.phone}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Nome do Cliente *</label>
              <input type="text" value={formData.customer_name} onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })} required className="w-full px-3 py-2 border rounded" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input type="email" value={formData.customer_email} onChange={(e) => setFormData({ ...formData, customer_email: e.target.value })} className="w-full px-3 py-2 border rounded" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Telefone</label>
                <input type="tel" value={formData.customer_phone} onChange={(e) => setFormData({ ...formData, customer_phone: e.target.value })} className="w-full px-3 py-2 border rounded" placeholder="(00) 00000-0000" />
              </div>
            </div>
            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Data Início *</label>
                <input type="date" value={formData.date_from} onChange={(e) => setFormData({ ...formData, date_from: e.target.value })} required className="w-full px-3 py-2 border rounded" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Data Fim *</label>
                <input type="date" value={formData.date_to} onChange={(e) => setFormData({ ...formData, date_to: e.target.value })} required className="w-full px-3 py-2 border rounded" />
              </div>
            </div>
            {/* Status */}
            <div>
              <label className="block text-sm font-medium mb-1">Status</label>
              <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value as any })} className="w-full px-3 py-2 border rounded">
                <option value="pending">Pendente</option>
                <option value="confirmed">Confirmada</option>
                <option value="completed">Concluída</option>
                <option value="cancelled">Cancelada</option>
              </select>
            </div>

            {/* Payment section */}
            <div className="border-t pt-4 mt-4">
              <h4 className="font-semibold text-gray-700 mb-3">💳 Pagamento</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Valor da Reserva (R$)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.total_amount}
                    onChange={(e) => setFormData({ ...formData, total_amount: e.target.value })}
                    className="w-full px-3 py-2 border rounded"
                    placeholder="0,00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Tipo de Pagamento</label>
                  <select value={formData.payment_type} onChange={(e) => setFormData({ ...formData, payment_type: e.target.value })} className="w-full px-3 py-2 border rounded">
                    {PAYMENT_TYPES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                  </select>
                </div>
              </div>
              <div className="mt-4">
                <ImageUpload
                  currentImage={formData.payment_receipt_url}
                  onUpload={(url) => setFormData({ ...formData, payment_receipt_url: url })}
                  folder="receipts"
                  label="Comprovante de Pagamento"
                />
              </div>
              <div className="mt-4">
                <ImageUpload
                  currentImage={formData.contract_url}
                  onUpload={(url) => setFormData({ ...formData, contract_url: url })}
                  folder="contracts"
                  label="Contrato (imagem/PDF como imagem)"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button type="submit" className="bg-brand-blue hover:bg-brand-blue-dark text-white font-bold py-2 px-4 rounded">Salvar</button>
              <button type="button" onClick={() => { setShowForm(false); setEditingReservation(null); }} className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded">Cancelar</button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        {reservations.length === 0 ? (
          <div className="px-6 py-4"><p className="text-gray-500">Nenhuma reserva cadastrada</p></div>
        ) : (
          <ul role="list" className="divide-y divide-gray-200">
            {reservations.map((reservation) => (
              <li key={reservation.id} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-mono bg-green-100 text-green-800 px-2 py-1 rounded font-semibold">
                        {formatReservationId(reservation.id)}
                      </span>
                      <h3 className="text-lg font-semibold">{reservation.customer_name}</h3>
                      <span className={`px-2 py-1 text-xs rounded ${getStatusColor(reservation.status)}`}>
                        {getStatusLabel(reservation.status)}
                      </span>
                      {reservation.total_amount != null && (
                        <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded font-semibold">
                          R$ {reservation.total_amount.toFixed(2)}
                        </span>
                      )}
                      {reservation.payment_type && (
                        <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded">
                          {getPaymentTypeLabel(reservation.payment_type)}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">Item: {getReservationItemName(reservation)}</p>
                    {reservation.customer_email && <p className="text-sm text-gray-600">Email: {reservation.customer_email}</p>}
                    {reservation.customer_phone && <p className="text-sm text-gray-600">Telefone: {reservation.customer_phone}</p>}
                    <p className="text-sm text-gray-600 mt-1">{reservation.date_from} até {reservation.date_to}</p>
                    <div className="flex gap-3 mt-1">
                      {reservation.payment_receipt_url && (
                        <a href={reservation.payment_receipt_url} target="_blank" rel="noreferrer" className="text-xs text-brand-blue hover:underline">
                          📄 Comprovante
                        </a>
                      )}
                      {reservation.contract_url && (
                        <a href={reservation.contract_url} target="_blank" rel="noreferrer" className="text-xs text-brand-blue hover:underline">
                          📝 Contrato
                        </a>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleEdit(reservation)} className="bg-brand-blue hover:bg-brand-blue-dark text-white font-bold py-1 px-3 rounded text-sm">Editar</button>
                    <button onClick={() => handleDelete(reservation.id)} className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-3 rounded text-sm">Deletar</button>
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
