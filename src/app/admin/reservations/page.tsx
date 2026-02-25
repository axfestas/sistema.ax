'use client';

import { useEffect, useMemo, useState } from 'react';
import { useToast } from '@/hooks/useToast';
import { formatReservationId } from '@/lib/formatId';
import ImageUpload from '@/components/ImageUpload';

/** An item available for selection (populates the dropdown). */
interface SelectableItem {
  id: number;
  name: string;
  type: 'item' | 'kit' | 'sweet' | 'design' | 'theme';
  displayName: string;
  stockQuantity?: number; // only set for 'item' type (from inventory)
}

/** An item that has been added to the current reservation form (with quantity). */
interface SelectedItemEntry {
  itemKey: string;      // e.g. "item:3", "kit:1"
  quantity: number;
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
  items_json?: string; // JSON array of SelectedItemEntry[]
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
  const [selectedItems, setSelectedItems] = useState<SelectedItemEntry[]>([]);
  const [newItemToAdd, setNewItemToAdd] = useState({ itemKey: '', quantity: '1' });
  const [itemSearch, setItemSearch] = useState('');
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [activeView, setActiveView] = useState<'list' | 'calendar'>('list');
  const [calendarDate, setCalendarDate] = useState(() => new Date());
  const [selectedCalendarDay, setSelectedCalendarDay] = useState<string | null>(null);
  const { showSuccess, showError } = useToast();

  const filteredSelectableItems = useMemo(
    () => !itemSearch.trim() ? allItems : allItems.filter((item) => item.displayName.toLowerCase().includes(itemSearch.toLowerCase())),
    [allItems, itemSearch]
  );

  const filteredReservations = reservations.filter((r) => {
    const matchesStatus = !filterStatus || r.status === filterStatus;
    if (!matchesStatus) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      r.customer_name.toLowerCase().includes(q) ||
      (r.customer_email && r.customer_email.toLowerCase().includes(q)) ||
      (r.customer_phone && r.customer_phone.includes(q))
    );
  });

  const upcomingDeliveries = useMemo(() => {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const fmt = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    const todStr = fmt(now);
    const in7 = new Date(now);
    in7.setDate(in7.getDate() + 7);
    const i7Str = fmt(in7);
    return reservations
      .filter(r => r.status !== 'cancelled' && r.date_to >= todStr && r.date_to <= i7Str)
      .sort((a, b) => a.date_to.localeCompare(b.date_to));
  }, [reservations]);

  useEffect(() => {
    loadReservations();
    loadAllItems();
    loadClients();
  }, []);

  const loadReservations = async () => {
    try {
      const response = await fetch('/api/reservations', { cache: 'no-store' });
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
        d.forEach(x => items.push({ id: x.id, name: x.name, type: 'item', displayName: `[Estoque] ${x.name}`, stockQuantity: x.quantity }));
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

  /** Validates qty against stock for inventory items. Returns clamped qty, or null to abort. */
  const validateAndClampQty = (item: SelectableItem, qty: number, abort: boolean): number | null => {
    if (item.type === 'item' && item.stockQuantity !== undefined && qty > item.stockQuantity) {
      showError(`Quantidade solicitada (${qty}) excede o estoque disponível (${item.stockQuantity}) para "${item.name}"`);
      if (abort) return null;
      return item.stockQuantity;
    }
    return qty;
  };

  const handleAddItem = () => {
    if (!newItemToAdd.itemKey) return;
    const qty = Math.max(1, parseInt(newItemToAdd.quantity) || 1);
    const found = allItems.find(x => `${x.type}:${x.id}` === newItemToAdd.itemKey);
    if (!found) return;
    const validQty = validateAndClampQty(found, qty, true);
    if (validQty === null) return;
    const existing = selectedItems.findIndex(x => x.itemKey === newItemToAdd.itemKey);
    if (existing >= 0) {
      const updated = [...selectedItems];
      updated[existing] = { ...updated[existing], quantity: validQty };
      setSelectedItems(updated);
    } else {
      setSelectedItems([...selectedItems, { itemKey: newItemToAdd.itemKey, quantity: validQty, displayName: found.displayName }]);
    }
    setNewItemToAdd({ itemKey: '', quantity: '1' });
    setItemSearch('');
  };

  const handleRemoveItem = (itemKey: string) => {
    setSelectedItems(selectedItems.filter(x => x.itemKey !== itemKey));
  };

  const handleItemQuantityChange = (itemKey: string, qty: number) => {
    const found = allItems.find(x => `${x.type}:${x.id}` === itemKey);
    const validQty = found ? (validateAndClampQty(found, qty, false) ?? qty) : qty;
    setSelectedItems(selectedItems.map(x => x.itemKey === itemKey ? { ...x, quantity: Math.max(1, validQty) } : x));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedItems.length === 0) {
      showError('Por favor, adicione pelo menos um item à reserva');
      return;
    }

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
      items: selectedItems,
    };

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
      setSelectedItems([]);
      showSuccess(editingReservation ? 'Reserva atualizada com sucesso!' : 'Reserva criada com sucesso!');
    } catch (error) {
      console.error('Error saving reservation:', error);
      showError('Erro ao salvar reserva');
    }
  };

  const handleEdit = (reservation: Reservation) => {
    setEditingReservation(reservation);
    // Populate selected items from items_json, or fall back to single-item backward compat
    if (reservation.items_json) {
      try {
        setSelectedItems(JSON.parse(reservation.items_json) as SelectedItemEntry[]);
      } catch {
        setSelectedItems([]);
      }
    } else {
      const fallbackItems: SelectedItemEntry[] = [];
      if (reservation.item_id) {
        const i = allItems.find(x => x.type === 'item' && x.id === reservation.item_id);
        fallbackItems.push({ itemKey: `item:${reservation.item_id}`, quantity: 1, displayName: i?.displayName || `Item #${reservation.item_id}` });
      } else if (reservation.kit_id) {
        const i = allItems.find(x => x.type === 'kit' && x.id === reservation.kit_id);
        fallbackItems.push({ itemKey: `kit:${reservation.kit_id}`, quantity: 1, displayName: i?.displayName || `Kit #${reservation.kit_id}` });
      } else if (reservation.sweet_id) {
        const i = allItems.find(x => x.type === 'sweet' && x.id === reservation.sweet_id);
        fallbackItems.push({ itemKey: `sweet:${reservation.sweet_id}`, quantity: 1, displayName: i?.displayName || `Doce #${reservation.sweet_id}` });
      } else if (reservation.design_id) {
        const i = allItems.find(x => x.type === 'design' && x.id === reservation.design_id);
        fallbackItems.push({ itemKey: `design:${reservation.design_id}`, quantity: 1, displayName: i?.displayName || `Design #${reservation.design_id}` });
      } else if (reservation.theme_id) {
        const i = allItems.find(x => x.type === 'theme' && x.id === reservation.theme_id);
        fallbackItems.push({ itemKey: `theme:${reservation.theme_id}`, quantity: 1, displayName: i?.displayName || `Tema #${reservation.theme_id}` });
      }
      setSelectedItems(fallbackItems);
    }
    setFormData({
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

  const getReservationItemsSummary = (reservation: Reservation): string => {
    // Use items_json when available (new multi-item format)
    if (reservation.items_json) {
      try {
        const items = JSON.parse(reservation.items_json) as SelectedItemEntry[];
        if (items.length === 0) return 'Sem itens';
        if (items.length === 1) return `${items[0].displayName} (x${items[0].quantity})`;
        return items.map(x => `${x.displayName} (x${x.quantity})`).join(', ');
      } catch { /* fall through to backward compat */ }
    }
    // Backward compat: single-item format
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

  const getReservationsForDay = (dateStr: string): Reservation[] =>
    reservations.filter(r => r.status !== 'cancelled' && r.date_from <= dateStr && r.date_to >= dateStr);

  const daysUntil = (dateStr: string): number => {
    const pad = (n: number) => String(n).padStart(2, '0');
    const now = new Date();
    const todStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
    const d = new Date(dateStr + 'T00:00:00');
    const t = new Date(todStr + 'T00:00:00');
    return Math.round((d.getTime() - t.getTime()) / 86400000);
  };

  const selectedNewItemRef = allItems.find(x => `${x.type}:${x.id}` === newItemToAdd.itemKey);
  const newItemMaxQty = selectedNewItemRef?.type === 'item' ? selectedNewItemRef.stockQuantity : undefined;

  if (loading) return <div className="p-4">Carregando...</div>;

  // Calendar locals
  const calYear = calendarDate.getFullYear();
  const calMonth = calendarDate.getMonth();
  const calPad = (n: number) => String(n).padStart(2, '0');
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${calPad(now.getMonth() + 1)}-${calPad(now.getDate())}`;
  const daysInCalMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const firstDayOfWeek = (new Date(calYear, calMonth, 1).getDay() + 6) % 7; // Mon=0
  const calCells: (number | null)[] = [
    ...Array(firstDayOfWeek).fill(null),
    ...Array.from({ length: daysInCalMonth }, (_, i) => i + 1),
  ];
  const DAY_LABELS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
  const MONTH_NAMES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
  const selectedDayReservations = selectedCalendarDay ? getReservationsForDay(selectedCalendarDay) : [];

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Gerenciamento de Reservas</h2>
        <button
          onClick={() => { setShowForm(true); setEditingReservation(null); setFormData({ ...emptyForm }); setSelectedItems([]); setNewItemToAdd({ itemKey: '', quantity: '1' }); setItemSearch(''); }}
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
            {/* Multi-item picker */}
            <div>
              <label className="block text-sm font-medium mb-1">Itens *</label>

              {/* Selected items list */}
              {selectedItems.length > 0 && (
                <ul className="mb-3 space-y-2">
                  {selectedItems.map((entry) => {
                    const itemRef = allItems.find(x => `${x.type}:${x.id}` === entry.itemKey);
                    const maxQty = itemRef?.type === 'item' ? itemRef.stockQuantity : undefined;
                    return (
                    <li key={entry.itemKey} className="flex items-center gap-2 p-2 bg-gray-50 rounded border">
                      <span className="flex-1 text-sm">{entry.displayName}</span>
                      {maxQty !== undefined && (
                        <span className="text-xs text-gray-400 whitespace-nowrap">estoque: {maxQty}</span>
                      )}
                      <label className="text-xs text-gray-500 whitespace-nowrap">Qtd:</label>
                      <input
                        type="number"
                        min="1"
                        max={maxQty}
                        value={entry.quantity}
                        onChange={(e) => handleItemQuantityChange(entry.itemKey, parseInt(e.target.value) || 1)}
                        className="w-16 px-2 py-1 border rounded text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(entry.itemKey)}
                        className="text-red-500 hover:text-red-700 text-sm font-bold px-2"
                      >
                        ✕
                      </button>
                    </li>
                    );
                  })}
                </ul>
              )}

              {/* Add item row */}
              <div className="flex gap-2 items-end p-3 bg-gray-50 rounded border border-dashed">
                <div className="flex-1">
                  <label className="block text-xs text-gray-500 mb-1">Selecione um item para adicionar</label>
                  <input
                    type="text"
                    value={itemSearch}
                    onChange={(e) => setItemSearch(e.target.value)}
                    placeholder="Pesquisar item..."
                    className="w-full px-3 py-2 border rounded text-sm mb-1"
                  />
                  <select
                    value={newItemToAdd.itemKey}
                    onChange={(e) => setNewItemToAdd({ ...newItemToAdd, itemKey: e.target.value })}
                    className="w-full px-3 py-2 border rounded text-sm"
                  >
                    <option value="">Escolha um item...</option>
                    {filteredSelectableItems.map((item) => (
                      <option key={`${item.type}:${item.id}`} value={`${item.type}:${item.id}`}>
                        {item.displayName}{item.type === 'item' && item.stockQuantity !== undefined ? ` (estoque: ${item.stockQuantity})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="w-24">
                  <label className="block text-xs text-gray-500 mb-1">Quantidade</label>
                  <input
                    type="number"
                    min="1"
                    max={newItemMaxQty}
                    value={newItemToAdd.quantity}
                    onChange={(e) => setNewItemToAdd({ ...newItemToAdd, quantity: e.target.value })}
                    className="w-full px-2 py-2 border rounded text-sm"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAddItem}
                  disabled={!newItemToAdd.itemKey}
                  className="px-3 py-2 bg-brand-blue hover:bg-brand-blue-dark text-white text-sm font-bold rounded disabled:bg-gray-300 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  + Adicionar
                </button>
              </div>
              {selectedItems.length === 0 && (
                <p className="text-xs text-red-500 mt-1">Adicione pelo menos um item.</p>
              )}
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
              <button type="button" onClick={() => { setShowForm(false); setEditingReservation(null); setSelectedItems([]); setItemSearch(''); }} className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded">Cancelar</button>
            </div>
          </form>
        </div>
      )}

      {!showForm && (
        <>
          {/* Upcoming deliveries — always visible, independent of the search/status filter */}
          {upcomingDeliveries.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
              <h3 className="text-base font-bold text-amber-800 mb-3 flex items-center gap-2">
                🚚 Próximas Entregas
                <span className="text-sm font-normal text-amber-600">(próximos 7 dias)</span>
              </h3>
              <ul className="space-y-2">
                {upcomingDeliveries.map(r => {
                  const days = daysUntil(r.date_to);
                  return (
                    <li key={r.id} className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 border border-amber-100 flex-wrap text-sm">
                      <span className={`font-bold px-2 py-0.5 rounded text-xs whitespace-nowrap ${
                        days === 0 ? 'bg-red-100 text-red-700' :
                        days === 1 ? 'bg-orange-100 text-orange-700' :
                        'bg-amber-100 text-amber-700'
                      }`}>
                        {days === 0 ? 'Hoje' : days === 1 ? 'Amanhã' : `em ${days} dias`}
                      </span>
                      <span className="font-mono text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded">{formatReservationId(r.id)}</span>
                      <span className="font-medium">{r.customer_name}</span>
                      <span className={`px-2 py-0.5 text-xs rounded ${getStatusColor(r.status)}`}>{getStatusLabel(r.status)}</span>
                      <span className="text-xs text-gray-500 truncate max-w-[200px]">{getReservationItemsSummary(r)}</span>
                      <span className="text-xs text-gray-400 ml-auto whitespace-nowrap">entrega: {r.date_to.split('-').reverse().join('/')}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {/* View toggle tabs */}
          <div className="flex gap-1 mb-4 border-b">
            <button
              onClick={() => setActiveView('list')}
              className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                activeView === 'list' ? 'border-brand-blue text-brand-blue' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              📋 Lista
            </button>
            <button
              onClick={() => { setActiveView('calendar'); setSelectedCalendarDay(null); }}
              className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                activeView === 'calendar' ? 'border-brand-blue text-brand-blue' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              📅 Calendário
            </button>
          </div>

          {/* ── LIST VIEW ── */}
          {activeView === 'list' && (
            <>
              <div className="flex gap-2 mb-4 flex-wrap">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar por nome, email ou telefone..."
                  className="px-3 py-2 border rounded flex-1 min-w-[200px]"
                />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-3 py-2 border rounded"
                >
                  <option value="">Todos os status</option>
                  <option value="pending">Pendente</option>
                  <option value="confirmed">Confirmada</option>
                  <option value="completed">Concluída</option>
                  <option value="cancelled">Cancelada</option>
                </select>
              </div>

              <div className="bg-white shadow overflow-hidden sm:rounded-md">
                {filteredReservations.length === 0 ? (
                  <div className="px-6 py-4"><p className="text-gray-500">{reservations.length === 0 ? 'Nenhuma reserva cadastrada' : 'Nenhuma reserva encontrada para os filtros aplicados.'}</p></div>
                ) : (
                  <ul role="list" className="divide-y divide-gray-200">
                    {filteredReservations.map((reservation) => (
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
                            <p className="text-sm text-gray-600">Itens: {getReservationItemsSummary(reservation)}</p>
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
            </>
          )}

          {/* ── CALENDAR VIEW ── */}
          {activeView === 'calendar' && (
            <div className="bg-white rounded-lg shadow p-4">
              {/* Month navigation */}
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={() => { setCalendarDate(new Date(calYear, calMonth - 1, 1)); setSelectedCalendarDay(null); }}
                  className="p-2 hover:bg-gray-100 rounded-lg font-bold text-xl leading-none"
                >
                  ‹
                </button>
                <span className="text-base font-bold">{MONTH_NAMES[calMonth]} {calYear}</span>
                <button
                  onClick={() => { setCalendarDate(new Date(calYear, calMonth + 1, 1)); setSelectedCalendarDay(null); }}
                  className="p-2 hover:bg-gray-100 rounded-lg font-bold text-xl leading-none"
                >
                  ›
                </button>
              </div>

              {/* Day-of-week headers */}
              <div className="grid grid-cols-7 gap-1 mb-1">
                {DAY_LABELS.map(d => (
                  <div key={d} className="text-center text-xs font-semibold text-gray-400 py-1">{d}</div>
                ))}
              </div>

              {/* Day cells */}
              <div className="grid grid-cols-7 gap-1">
                {calCells.map((day, i) => {
                  if (day === null) return <div key={`e${i}`} />;
                  const dateStr = `${calYear}-${calPad(calMonth + 1)}-${calPad(day)}`;
                  const dayRes = getReservationsForDay(dateStr);
                  const isToday = dateStr === todayStr;
                  const isSelected = dateStr === selectedCalendarDay;
                  return (
                    <button
                      key={dateStr}
                      onClick={() => setSelectedCalendarDay(isSelected ? null : dateStr)}
                      className={`flex flex-col items-center justify-start p-1 min-h-[44px] rounded-lg text-sm transition-colors border ${
                        isSelected
                          ? 'bg-brand-blue text-white border-brand-blue'
                          : isToday
                          ? 'bg-yellow-50 border-yellow-300 font-bold'
                          : dayRes.length > 0
                          ? 'bg-blue-50 border-blue-200 hover:bg-blue-100'
                          : 'border-transparent hover:bg-gray-50'
                      }`}
                    >
                      <span className="leading-none">{day}</span>
                      {dayRes.length > 0 && (
                        <span className={`mt-0.5 text-xs font-bold ${isSelected ? 'text-white' : 'text-brand-blue'}`}>
                          {dayRes.length}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Selected day details */}
              {selectedCalendarDay && (
                <div className="mt-4 border-t pt-4">
                  <h4 className="font-semibold text-sm text-gray-700 mb-2">
                    Reservas em {selectedCalendarDay.split('-').reverse().join('/')}
                    <span className="ml-2 text-gray-400 font-normal">({selectedDayReservations.length})</span>
                  </h4>
                  {selectedDayReservations.length === 0 ? (
                    <p className="text-sm text-gray-500">Nenhuma reserva ativa neste dia.</p>
                  ) : (
                    <ul className="space-y-2">
                      {selectedDayReservations.map(r => (
                        <li key={r.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded text-sm flex-wrap">
                          <span className="font-mono text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded">{formatReservationId(r.id)}</span>
                          <span className="font-medium">{r.customer_name}</span>
                          <span className={`px-2 py-0.5 text-xs rounded ${getStatusColor(r.status)}`}>{getStatusLabel(r.status)}</span>
                          <span className="text-xs text-gray-500 truncate max-w-[200px]">{getReservationItemsSummary(r)}</span>
                          <span className="text-xs text-gray-400 ml-auto whitespace-nowrap">{r.date_from} → {r.date_to}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              {/* Legend */}
              <div className="flex flex-wrap gap-4 mt-4 pt-3 border-t text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded bg-blue-50 border border-blue-200 inline-block" />
                  Tem reserva
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded bg-yellow-50 border border-yellow-300 inline-block" />
                  Hoje
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded bg-brand-blue inline-block" />
                  Selecionado
                </span>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
