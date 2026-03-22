'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { formatQuoteId } from '@/lib/formatId';
import { useToast } from '@/components/ToastProvider';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Client {
  id: number;
  name: string;
  email?: string;
  phone: string;
  cpf?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
}

interface QuoteItem {
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
}

interface Quote {
  id: number;
  client_id: number;
  client_name: string;
  client_phone: string;
  client_email?: string;
  event_date?: string;
  event_location?: string;
  items_json: string;
  discount: number;
  total: number;
  status: 'pending' | 'sent' | 'approved' | 'rejected';
  notes?: string;
  created_at: number;
}

type QuoteStatus = 'pending' | 'sent' | 'approved' | 'rejected';

const STATUS_LABELS: Record<QuoteStatus, string> = {
  pending: 'Pendente',
  sent: 'Enviado',
  approved: 'Aprovado',
  rejected: 'Recusado',
};

const STATUS_COLORS: Record<QuoteStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  sent: 'bg-blue-100 text-blue-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
};

const PAYMENT_TYPES = [
  { value: '', label: 'Selecione...' },
  { value: 'pix', label: 'Pix' },
  { value: 'cartao_credito', label: 'Cartão de Crédito' },
  { value: 'cartao_debito', label: 'Cartão de Débito' },
  { value: 'dinheiro', label: 'Dinheiro' },
  { value: 'transferencia', label: 'Transferência Bancária' },
  { value: 'boleto', label: 'Boleto' },
];

const EMPTY_ITEM: QuoteItem = { description: '', quantity: 1, unit_price: 0, total: 0 };

interface CatalogProduct {
  id: string;
  name: string;
  price: number;
  type: string;
}

const BRL = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

// ─── Component ────────────────────────────────────────────────────────────────

export default function QuotesPage() {
  const router = useRouter();
  const { showSuccess, showError } = useToast();

  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'list' | 'form' | 'detail'>('list');
  const [editingQuote, setEditingQuote] = useState<Quote | null>(null);
  const [detailQuote, setDetailQuote] = useState<Quote | null>(null);
  const [filterStatus, setFilterStatus] = useState('');
  const [search, setSearch] = useState('');
  const [clientSearch, setClientSearch] = useState('');

  // Form state
  const [selectedClientId, setSelectedClientId] = useState('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [formEventDate, setFormEventDate] = useState('');
  const [formEventLocation, setFormEventLocation] = useState('');
  const [formItems, setFormItems] = useState<QuoteItem[]>([{ ...EMPTY_ITEM }]);
  const [formDiscount, setFormDiscount] = useState(0);
  const [formStatus, setFormStatus] = useState<QuoteStatus>('pending');
  const [formNotes, setFormNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [catalogProducts, setCatalogProducts] = useState<CatalogProduct[]>([]);
  const [productSearches, setProductSearches] = useState<string[]>([]);
  const [productDropdowns, setProductDropdowns] = useState<boolean[]>([]);

  // ── Load data ──────────────────────────────────────────────────────────────

  const loadQuotes = useCallback(async () => {
    try {
      const res = await fetch('/api/quotes');
      if (res.ok) setQuotes(await res.json() as Quote[]);
    } catch (err) {
      console.error('Error loading quotes:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadClients = useCallback(async () => {
    try {
      const res = await fetch('/api/clients');
      if (res.ok) setClients(await res.json() as Client[]);
    } catch (err) {
      console.error('Error loading clients:', err);
    }
  }, []);

  useEffect(() => {
    loadQuotes();
    loadClients();
  }, [loadQuotes, loadClients]);

  useEffect(() => {
    if (view !== 'form') return;
    Promise.all([
      fetch('/api/items?catalogOnly=true').then(r => r.ok ? r.json() : []),
      fetch('/api/kits').then(r => r.ok ? r.json() : []),
      fetch('/api/sweets?catalog=true').then(r => r.ok ? r.json() : []),
      fetch('/api/designs?catalog=true').then(r => r.ok ? r.json() : []),
      fetch('/api/themes?catalog=true').then(r => r.ok ? r.json() : []),
    ]).then(([items, kits, sweets, designs, themes]) => {
      const all: CatalogProduct[] = [
        ...(Array.isArray(items) ? items : []).map((i: {id:number,name:string,price?:number}) => ({ id: `item-${i.id}`, name: i.name, price: i.price ?? 0, type: 'Item' })),
        ...(Array.isArray(kits) ? kits : []).map((i: {id:number,name:string,price?:number}) => ({ id: `kit-${i.id}`, name: i.name, price: i.price ?? 0, type: 'Kit' })),
        ...(Array.isArray(sweets) ? sweets : []).map((i: {id:number,name:string,price?:number}) => ({ id: `sweet-${i.id}`, name: i.name, price: i.price ?? 0, type: 'Doce' })),
        ...(Array.isArray(designs) ? designs : []).map((i: {id:number,name:string,price?:number}) => ({ id: `design-${i.id}`, name: i.name, price: i.price ?? 0, type: 'Design' })),
        ...(Array.isArray(themes) ? themes : []).map((i: {id:number,name:string,price?:number}) => ({ id: `theme-${i.id}`, name: i.name, price: i.price ?? 0, type: 'Tema' })),
      ];
      setCatalogProducts(all);
    }).catch(() => {});
  }, [view]);

  // ── Derived values ─────────────────────────────────────────────────────────

  const filteredClients = clients.filter((c) => {
    if (!clientSearch.trim()) return true;
    const q = clientSearch.toLowerCase();
    return c.name.toLowerCase().includes(q) || c.phone.includes(q);
  });

  const itemsSubtotal = formItems.reduce((s, it) => s + it.total, 0);
  const formTotal = Math.max(0, itemsSubtotal - formDiscount);

  const filteredQuotes = quotes.filter((q) => {
    if (filterStatus && q.status !== filterStatus) return false;
    if (!search.trim()) return true;
    const s = search.toLowerCase();
    return (
      q.client_name.toLowerCase().includes(s) ||
      formatQuoteId(q.id).toLowerCase().includes(s)
    );
  });

  // ── Form helpers ───────────────────────────────────────────────────────────

  function resetForm() {
    setSelectedClientId('');
    setSelectedClient(null);
    setClientSearch('');
    setFormEventDate('');
    setFormEventLocation('');
    setFormItems([{ ...EMPTY_ITEM }]);
    setFormDiscount(0);
    setFormStatus('pending');
    setFormNotes('');
    setEditingQuote(null);
    setProductSearches([]);
    setProductDropdowns([]);
  }

  function openNew() {
    resetForm();
    setView('form');
  }

  function openEdit(q: Quote) {
    setEditingQuote(q);
    const client = clients.find((c) => c.id === q.client_id) || null;
    setSelectedClientId(String(q.client_id));
    setSelectedClient(client);
    setClientSearch(q.client_name);
    setFormEventDate(q.event_date || '');
    setFormEventLocation(q.event_location || '');
    try {
      setFormItems(JSON.parse(q.items_json) as QuoteItem[]);
    } catch {
      setFormItems([{ ...EMPTY_ITEM }]);
    }
    setFormDiscount(q.discount);
    setFormStatus(q.status);
    setFormNotes(q.notes || '');
    setProductSearches([]);
    setProductDropdowns([]);
    setView('form');
  }

  function openDetail(q: Quote) {
    setDetailQuote(q);
    setView('detail');
  }

  // ── Client selection ───────────────────────────────────────────────────────

  function handleClientSelect(client: Client) {
    setSelectedClientId(String(client.id));
    setSelectedClient(client);
    setClientSearch(client.name);
  }

  // ── Item management ────────────────────────────────────────────────────────

  function updateItem(idx: number, field: keyof QuoteItem, value: string | number) {
    setFormItems((prev) => {
      const updated = [...prev];
      const item = { ...updated[idx] };
      if (field === 'description') {
        item.description = value as string;
      } else if (field === 'quantity') {
        item.quantity = Number(value) || 0;
        item.total = item.quantity * item.unit_price;
      } else if (field === 'unit_price') {
        item.unit_price = Number(value) || 0;
        item.total = item.quantity * item.unit_price;
      } else if (field === 'total') {
        item.total = Number(value) || 0;
      }
      updated[idx] = item;
      return updated;
    });
  }

  function addItem() {
    setFormItems((prev) => [...prev, { ...EMPTY_ITEM }]);
    setProductSearches(prev => [...prev, '']);
    setProductDropdowns(prev => [...prev, false]);
  }

  function removeItem(idx: number) {
    setFormItems((prev) => prev.filter((_, i) => i !== idx));
    setProductSearches(prev => prev.filter((_, i) => i !== idx));
    setProductDropdowns(prev => prev.filter((_, i) => i !== idx));
  }

  // ── Save ───────────────────────────────────────────────────────────────────

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedClientId) {
      showError('Selecione um cliente');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        client_id: Number(selectedClientId),
        event_date: formEventDate || undefined,
        event_location: formEventLocation || undefined,
        items_json: formItems,
        discount: formDiscount,
        total: formTotal,
        status: formStatus,
        notes: formNotes || undefined,
      };

      const url = editingQuote ? `/api/quotes?id=${editingQuote.id}` : '/api/quotes';
      const method = editingQuote ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      showSuccess(editingQuote ? 'Orçamento atualizado!' : 'Orçamento criado!');
      resetForm();
      setView('list');
      loadQuotes();
    } catch (err) {
      console.error('Error saving quote:', err);
      showError('Erro ao salvar orçamento');
    } finally {
      setSaving(false);
    }
  }

  // ── Delete ─────────────────────────────────────────────────────────────────

  async function handleDelete(id: number) {
    if (!confirm('Excluir este orçamento?')) return;
    try {
      const res = await fetch(`/api/quotes?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      showSuccess('Orçamento excluído');
      if (view === 'detail') setView('list');
      loadQuotes();
    } catch {
      showError('Erro ao excluir orçamento');
    }
  }

  // ── WhatsApp share ─────────────────────────────────────────────────────────

  function handleWhatsApp(q: Quote) {
    let items: QuoteItem[] = [];
    try { items = JSON.parse(q.items_json) as QuoteItem[]; } catch { /* ignore */ }

    const itemLines = items.map((it) =>
      `  - ${it.quantity}x ${it.description}: ${BRL(it.total)}`
    ).join('\n');

    const dateStr = q.event_date
      ? new Date(q.event_date + 'T00:00:00').toLocaleDateString('pt-BR')
      : 'A definir';

    const msg = [
      `*${formatQuoteId(q.id)} - Orçamento Ax Festas*`,
      ``,
      `👤 Cliente: ${q.client_name}`,
      q.event_date ? `📅 Evento: ${dateStr}` : null,
      q.event_location ? `📍 Local: ${q.event_location}` : null,
      ``,
      `*Itens:*`,
      itemLines || '  (sem itens)',
      ``,
      q.discount > 0 ? `🏷️ Desconto: ${BRL(q.discount)}` : null,
      `💰 *Total: ${BRL(q.total)}*`,
      ``,
      `Status: ${STATUS_LABELS[q.status]}`,
      ``,
      `Entre em contato para confirmar! 🎉`,
    ].filter(Boolean).join('\n');

    const phone = q.client_phone.replace(/\D/g, '');
    const url = `https://wa.me/55${phone}?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  }

  // ── Convert to contract ────────────────────────────────────────────────────

  function handleConvertToContract(q: Quote) {
    router.push(`/admin/contracts?from_quote=${q.id}`);
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Render
  // ──────────────────────────────────────────────────────────────────────────

  if (view === 'form') {
    return (
      <div className="max-w-4xl">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => { resetForm(); setView('list'); }}
            className="text-gray-500 hover:text-gray-800"
          >
            ← Voltar
          </button>
          <h2 className="text-xl font-bold">
            {editingQuote ? `Editar ${formatQuoteId(editingQuote.id)}` : 'Novo Orçamento'}
          </h2>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          {/* Client selector */}
          <div className="bg-white rounded-lg shadow p-5">
            <h3 className="font-semibold text-gray-700 mb-4">Cliente</h3>
            <div className="relative mb-3">
              <input
                type="text"
                placeholder="Buscar cliente pelo nome ou telefone..."
                value={clientSearch}
                onChange={(e) => {
                  setClientSearch(e.target.value);
                  if (!e.target.value) { setSelectedClientId(''); setSelectedClient(null); }
                }}
                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-yellow"
              />
              {clientSearch && !selectedClientId && (
                <div className="absolute z-10 w-full bg-white border rounded-lg shadow-lg mt-1 max-h-48 overflow-y-auto">
                  {filteredClients.length === 0 ? (
                    <div className="p-3 text-gray-400 text-sm">Nenhum cliente encontrado</div>
                  ) : filteredClients.slice(0, 8).map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => handleClientSelect(c)}
                      className="w-full text-left px-4 py-2 hover:bg-yellow-50 text-sm"
                    >
                      <span className="font-medium">{c.name}</span>
                      <span className="text-gray-400 ml-2">{c.phone}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {selectedClient && (
              <div className="bg-yellow-50 rounded-lg p-4 grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-gray-500">Nome:</span> <strong>{selectedClient.name}</strong></div>
                <div><span className="text-gray-500">Telefone:</span> {selectedClient.phone}</div>
                {selectedClient.email && <div><span className="text-gray-500">Email:</span> {selectedClient.email}</div>}
                {selectedClient.cpf && <div><span className="text-gray-500">CPF:</span> {selectedClient.cpf}</div>}
                {selectedClient.address && <div className="col-span-2"><span className="text-gray-500">Endereço:</span> {selectedClient.address}{selectedClient.city ? `, ${selectedClient.city}` : ''}</div>}
              </div>
            )}
          </div>

          {/* Event info */}
          <div className="bg-white rounded-lg shadow p-5">
            <h3 className="font-semibold text-gray-700 mb-4">Dados do Evento</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Data do Evento</label>
                <input
                  type="date"
                  value={formEventDate}
                  onChange={(e) => setFormEventDate(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-yellow"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Local do Evento</label>
                <input
                  type="text"
                  value={formEventLocation}
                  onChange={(e) => setFormEventLocation(e.target.value)}
                  placeholder="Ex: Salão do Clube, Residência..."
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-yellow"
                />
              </div>
            </div>
          </div>

          {/* Items */}
          <div className="bg-white rounded-lg shadow p-5">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-gray-700">Itens do Orçamento</h3>
              <button type="button" onClick={addItem}
                className="text-sm text-brand-yellow hover:text-yellow-600 font-medium">
                + Adicionar item
              </button>
            </div>

            <div className="space-y-2">
              <div className="grid grid-cols-12 gap-2 text-xs font-semibold text-gray-500 uppercase px-1">
                <div className="col-span-5">Descrição</div>
                <div className="col-span-2 text-center">Qtd</div>
                <div className="col-span-2 text-center">Valor Unit.</div>
                <div className="col-span-2 text-center">Total</div>
                <div className="col-span-1"></div>
              </div>

              {formItems.map((item, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                  <div className="col-span-5 relative">
                    <input
                      className="w-full border rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-brand-yellow"
                      placeholder="Buscar ou digitar produto..."
                      value={productSearches[idx] !== undefined ? productSearches[idx] : item.description}
                      onFocus={() => {
                        const s = [...productSearches];
                        s[idx] = item.description;
                        setProductSearches(s);
                        const d = [...productDropdowns];
                        d[idx] = true;
                        setProductDropdowns(d);
                      }}
                      onChange={(e) => {
                        updateItem(idx, 'description', e.target.value);
                        const s = [...productSearches];
                        s[idx] = e.target.value;
                        setProductSearches(s);
                        const d = [...productDropdowns];
                        d[idx] = true;
                        setProductDropdowns(d);
                      }}
                      onBlur={() => {
                        setTimeout(() => {
                          const d = [...productDropdowns];
                          d[idx] = false;
                          setProductDropdowns(d);
                        }, 150);
                      }}
                    />
                    {productDropdowns[idx] && productSearches[idx] && (
                      <div className="absolute z-20 left-0 right-0 top-full mt-0.5 bg-white border rounded-lg shadow-lg max-h-40 overflow-y-auto">
                        {catalogProducts
                          .filter(p => p.name.toLowerCase().includes((productSearches[idx] || '').toLowerCase()))
                          .slice(0, 8)
                          .map(p => (
                            <button
                              key={p.id}
                              type="button"
                              className="w-full text-left px-3 py-1.5 text-sm hover:bg-yellow-50 flex justify-between"
                              onMouseDown={() => {
                                updateItem(idx, 'description', p.name);
                                updateItem(idx, 'unit_price', p.price);
                                const s = [...productSearches];
                                s[idx] = '';
                                setProductSearches(s);
                                const d = [...productDropdowns];
                                d[idx] = false;
                                setProductDropdowns(d);
                              }}
                            >
                              <span>{p.name} <span className="text-gray-400 text-xs">({p.type})</span></span>
                              {p.price > 0 && <span className="text-brand-yellow font-medium text-xs">{new Intl.NumberFormat('pt-BR', {style:'currency',currency:'BRL'}).format(p.price)}</span>}
                            </button>
                          ))}
                        {catalogProducts.filter(p => p.name.toLowerCase().includes((productSearches[idx] || '').toLowerCase())).length === 0 && (
                          <div className="px-3 py-2 text-gray-400 text-sm">Nenhum produto encontrado</div>
                        )}
                      </div>
                    )}
                  </div>
                  <input
                    className="col-span-2 border rounded px-2 py-1.5 text-sm text-center focus:outline-none focus:ring-1 focus:ring-brand-yellow"
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => updateItem(idx, 'quantity', e.target.value)}
                  />
                  <input
                    className="col-span-2 border rounded px-2 py-1.5 text-sm text-center focus:outline-none focus:ring-1 focus:ring-brand-yellow"
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.unit_price}
                    onChange={(e) => updateItem(idx, 'unit_price', e.target.value)}
                  />
                  <div className="col-span-2 text-sm text-center font-medium text-gray-700">
                    {BRL(item.total)}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeItem(idx)}
                    className="col-span-1 text-red-400 hover:text-red-600 text-center"
                    title="Remover"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="mt-4 border-t pt-4 space-y-2">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Subtotal:</span><span>{BRL(itemsSubtotal)}</span>
              </div>
              <div className="flex justify-between items-center text-sm text-gray-600">
                <span>Desconto:</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formDiscount}
                  onChange={(e) => setFormDiscount(Number(e.target.value) || 0)}
                  className="border rounded px-2 py-1 w-32 text-right text-sm focus:outline-none focus:ring-1 focus:ring-brand-yellow"
                />
              </div>
              <div className="flex justify-between font-bold text-base text-gray-900">
                <span>Total:</span><span className="text-brand-yellow">{BRL(formTotal)}</span>
              </div>
            </div>
          </div>

          {/* Status & notes */}
          <div className="bg-white rounded-lg shadow p-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Status</label>
                <select
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value as QuoteStatus)}
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-yellow"
                >
                  {Object.entries(STATUS_LABELS).map(([v, l]) => (
                    <option key={v} value={v}>{l}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Observações</label>
                <textarea
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  rows={2}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-yellow"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-3 justify-end">
            <button type="button" onClick={() => { resetForm(); setView('list'); }}
              className="px-5 py-2 border rounded-lg hover:bg-gray-50 transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={saving}
              className="px-5 py-2 bg-brand-blue hover:bg-brand-blue-dark text-white font-bold rounded-lg transition-colors disabled:opacity-50">
              {saving ? 'Salvando...' : editingQuote ? 'Salvar Alterações' : 'Criar Orçamento'}
            </button>
          </div>
        </form>
      </div>
    );
  }

  if (view === 'detail' && detailQuote) {
    let items: QuoteItem[] = [];
    try { items = JSON.parse(detailQuote.items_json) as QuoteItem[]; } catch { /* ignore */ }

    return (
      <div className="max-w-3xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button onClick={() => setView('list')} className="text-gray-500 hover:text-gray-800">← Voltar</button>
            <h2 className="text-xl font-bold">{formatQuoteId(detailQuote.id)}</h2>
            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLORS[detailQuote.status]}`}>
              {STATUS_LABELS[detailQuote.status]}
            </span>
          </div>
          <div className="flex gap-2">
            <button onClick={() => openEdit(detailQuote)}
              className="px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-50">✏️ Editar</button>
            <button onClick={() => handleWhatsApp(detailQuote)}
              className="px-3 py-1.5 text-sm bg-green-500 text-white rounded-lg hover:bg-green-600">
              📱 WhatsApp
            </button>
            <button onClick={() => handleConvertToContract(detailQuote)}
              className="px-3 py-1.5 text-sm bg-brand-blue hover:bg-brand-blue-dark text-white font-bold rounded-lg">
              📄 Converter em Contrato
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-6 space-y-6">
          {/* Client */}
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Cliente</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div><span className="text-gray-500">Nome:</span> <strong>{detailQuote.client_name}</strong></div>
              <div><span className="text-gray-500">Telefone:</span> {detailQuote.client_phone}</div>
              {detailQuote.client_email && <div><span className="text-gray-500">Email:</span> {detailQuote.client_email}</div>}
            </div>
          </div>

          {/* Event */}
          {(detailQuote.event_date || detailQuote.event_location) && (
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Evento</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {detailQuote.event_date && (
                  <div><span className="text-gray-500">Data:</span> {new Date(detailQuote.event_date + 'T00:00:00').toLocaleDateString('pt-BR')}</div>
                )}
                {detailQuote.event_location && (
                  <div><span className="text-gray-500">Local:</span> {detailQuote.event_location}</div>
                )}
              </div>
            </div>
          )}

          {/* Items */}
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Itens</h3>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-gray-500 text-xs uppercase">
                  <th className="py-2 px-3 text-left">Descrição</th>
                  <th className="py-2 px-3 text-center">Qtd</th>
                  <th className="py-2 px-3 text-right">Valor Unit.</th>
                  <th className="py-2 px-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {items.map((it, i) => (
                  <tr key={i} className="border-t">
                    <td className="py-2 px-3">{it.description}</td>
                    <td className="py-2 px-3 text-center">{it.quantity}</td>
                    <td className="py-2 px-3 text-right">{BRL(it.unit_price)}</td>
                    <td className="py-2 px-3 text-right font-medium">{BRL(it.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-3 border-t pt-3 space-y-1 text-sm">
              <div className="flex justify-between text-gray-500">
                <span>Subtotal</span><span>{BRL(items.reduce((s, i) => s + i.total, 0))}</span>
              </div>
              {detailQuote.discount > 0 && (
                <div className="flex justify-between text-gray-500">
                  <span>Desconto</span><span>- {BRL(detailQuote.discount)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-base">
                <span>Total</span><span className="text-brand-yellow">{BRL(detailQuote.total)}</span>
              </div>
            </div>
          </div>

          {detailQuote.notes && (
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Observações</h3>
              <p className="text-sm text-gray-700">{detailQuote.notes}</p>
            </div>
          )}
        </div>

        <div className="mt-4 flex justify-end">
          <button onClick={() => handleDelete(detailQuote.id)}
            className="text-sm text-red-500 hover:text-red-700">🗑️ Excluir orçamento</button>
        </div>
      </div>
    );
  }

  // ── List view ──────────────────────────────────────────────────────────────

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Orçamentos</h1>
        <button onClick={openNew}
          className="bg-brand-blue hover:bg-brand-blue-dark text-white font-bold px-4 py-2 rounded-lg transition-colors">
          + Novo Orçamento
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-5">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por cliente ou ID..."
          className="border rounded-lg px-3 py-2 flex-1 focus:outline-none focus:ring-2 focus:ring-brand-yellow"
        />
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-yellow"
        >
          <option value="">Todos os status</option>
          {Object.entries(STATUS_LABELS).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-brand-yellow" />
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-3 text-left text-xs font-semibold text-gray-500 uppercase">ID</th>
                  <th className="p-3 text-left text-xs font-semibold text-gray-500 uppercase">Cliente</th>
                  <th className="p-3 text-left text-xs font-semibold text-gray-500 uppercase">Evento</th>
                  <th className="p-3 text-left text-xs font-semibold text-gray-500 uppercase">Total</th>
                  <th className="p-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                  <th className="p-3 text-left text-xs font-semibold text-gray-500 uppercase">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredQuotes.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-gray-400">
                      {quotes.length === 0 ? 'Nenhum orçamento ainda. Crie o primeiro!' : 'Nenhum resultado encontrado.'}
                    </td>
                  </tr>
                ) : filteredQuotes.map((q) => (
                  <tr key={q.id} className="border-t hover:bg-gray-50">
                    <td className="p-3 font-mono text-xs text-gray-500">{formatQuoteId(q.id)}</td>
                    <td className="p-3">
                      <div className="font-medium text-sm">{q.client_name}</div>
                      <div className="text-xs text-gray-400">{q.client_phone}</div>
                    </td>
                    <td className="p-3 text-sm text-gray-600">
                      {q.event_date
                        ? new Date(q.event_date + 'T00:00:00').toLocaleDateString('pt-BR')
                        : <span className="text-gray-300">-</span>}
                    </td>
                    <td className="p-3 font-semibold text-sm text-brand-yellow">{BRL(q.total)}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLORS[q.status]}`}>
                        {STATUS_LABELS[q.status]}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex gap-1 flex-wrap">
                        <button onClick={() => openDetail(q)}
                          className="text-xs bg-brand-blue hover:bg-brand-blue-dark text-white font-bold py-1 px-2 rounded">👁️ Ver</button>
                        <button onClick={() => openEdit(q)}
                          className="text-xs bg-brand-blue hover:bg-brand-blue-dark text-white font-bold py-1 px-2 rounded">✏️ Editar</button>
                        <button onClick={() => handleWhatsApp(q)}
                          className="text-xs bg-green-500 hover:bg-green-600 text-white font-bold py-1 px-2 rounded">📱 WA</button>
                        <button onClick={() => handleConvertToContract(q)}
                          className="text-xs bg-brand-blue hover:bg-brand-blue-dark text-white font-bold py-1 px-2 rounded">📄 Contrato</button>
                        <button onClick={() => handleDelete(q.id)}
                          className="text-xs bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-2 rounded">🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
