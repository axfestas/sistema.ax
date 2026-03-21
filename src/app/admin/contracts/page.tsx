'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { formatContractId, formatQuoteId } from '@/lib/formatId';
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

interface ContractItem {
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
}

interface Contract {
  id: number;
  client_id: number;
  client_name: string;
  client_phone: string;
  client_email?: string;
  client_cpf?: string;
  client_address?: string;
  client_city?: string;
  client_state?: string;
  quote_id?: number;
  event_date?: string;
  event_location?: string;
  pickup_date?: string;
  return_date?: string;
  items_json: string;
  discount: number;
  total: number;
  payment_method?: string;
  status: 'pending' | 'sent' | 'signed' | 'completed';
  notes?: string;
  created_at: number;
}

interface QuoteRaw {
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
}

type ContractStatus = 'pending' | 'sent' | 'signed' | 'completed';

const STATUS_LABELS: Record<ContractStatus, string> = {
  pending: 'Pendente',
  sent: 'Enviado',
  signed: 'Assinado',
  completed: 'Finalizado',
};

const STATUS_COLORS: Record<ContractStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  sent: 'bg-blue-100 text-blue-800',
  signed: 'bg-green-100 text-green-800',
  completed: 'bg-purple-100 text-purple-800',
};

const PAYMENT_METHODS = [
  { value: '', label: 'Selecione...' },
  { value: 'pix', label: 'Pix' },
  { value: 'cartao_credito', label: 'Cartão de Crédito' },
  { value: 'cartao_debito', label: 'Cartão de Débito' },
  { value: 'dinheiro', label: 'Dinheiro' },
  { value: 'transferencia', label: 'Transferência Bancária' },
  { value: 'boleto', label: 'Boleto' },
];

const EMPTY_ITEM: ContractItem = { description: '', quantity: 1, unit_price: 0, total: 0 };

const BRL = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

function fmtDate(iso?: string) {
  if (!iso) return '';
  try { return new Date(iso + 'T00:00:00').toLocaleDateString('pt-BR'); } catch { return iso; }
}

// ─── Print contract in a new window ───────────────────────────────────────────

function printContract(ct: Contract) {
  let items: ContractItem[] = [];
  try { items = JSON.parse(ct.items_json) as ContractItem[]; } catch { /* ignore */ }

  const html = `<!DOCTYPE html><html lang="pt-BR"><head>
<meta charset="utf-8"/>
<title>Contrato ${formatContractId(ct.id)}</title>
<style>
  body { font-family: Arial, sans-serif; font-size: 13px; margin: 0; padding: 30px; color: #1a1a1a; }
  h1 { text-align: center; font-size: 18px; margin-bottom: 4px; }
  .sub { text-align: center; font-size: 12px; color: #555; margin-bottom: 20px; }
  .id-label { text-align: center; font-weight: bold; font-size: 14px; margin-bottom: 20px; }
  section { margin-bottom: 16px; }
  h2 { font-size: 13px; font-weight: bold; border-bottom: 1px solid #ccc; padding-bottom: 3px; margin-bottom: 8px; }
  .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 6px 16px; }
  .field { font-size: 12px; }
  .field span { color: #555; }
  table { width: 100%; border-collapse: collapse; font-size: 12px; }
  th { background: #f5f5f5; padding: 6px 8px; text-align: left; font-size: 11px; }
  td { padding: 6px 8px; border-top: 1px solid #eee; }
  .text-right { text-align: right; }
  .totals { margin-top: 8px; text-align: right; font-size: 13px; }
  .totals div { margin-top: 3px; }
  .total-final { font-weight: bold; font-size: 15px; color: #c026d3; }
  .signature { margin-top: 50px; display: grid; grid-template-columns: 1fr 1fr; gap: 40px; }
  .sign-box { border-top: 1px solid #333; padding-top: 6px; text-align: center; font-size: 11px; }
  @media print {
    body { padding: 15px; }
    button { display: none !important; }
  }
</style>
</head><body>
<h1>Ax Festas &mdash; Contrato de Locação</h1>
<div class="sub">www.axfestas.com.br</div>
<div class="id-label">${formatContractId(ct.id)}</div>

<section>
  <h2>LOCATÁRIO</h2>
  <div class="grid2">
    <div class="field"><span>Nome:</span> ${ct.client_name}</div>
    <div class="field"><span>Telefone:</span> ${ct.client_phone}</div>
    ${ct.client_email ? `<div class="field"><span>Email:</span> ${ct.client_email}</div>` : ''}
    ${ct.client_cpf ? `<div class="field"><span>CPF:</span> ${ct.client_cpf}</div>` : ''}
    ${ct.client_address ? `<div class="field" style="grid-column:1/-1"><span>Endereço:</span> ${ct.client_address}${ct.client_city ? ', ' + ct.client_city : ''}${ct.client_state ? ' - ' + ct.client_state : ''}</div>` : ''}
  </div>
</section>

${ct.event_date || ct.event_location || ct.pickup_date || ct.return_date ? `
<section>
  <h2>EVENTO / PERÍODO</h2>
  <div class="grid2">
    ${ct.event_date ? `<div class="field"><span>Data do evento:</span> ${fmtDate(ct.event_date)}</div>` : ''}
    ${ct.event_location ? `<div class="field"><span>Local:</span> ${ct.event_location}</div>` : ''}
    ${ct.pickup_date ? `<div class="field"><span>Retirada:</span> ${fmtDate(ct.pickup_date)}</div>` : ''}
    ${ct.return_date ? `<div class="field"><span>Devolução:</span> ${fmtDate(ct.return_date)}</div>` : ''}
  </div>
</section>` : ''}

<section>
  <h2>ITENS LOCADOS</h2>
  <table>
    <thead>
      <tr>
        <th>Descrição</th>
        <th style="text-align:center">Qtd</th>
        <th style="text-align:right">Valor Unit.</th>
        <th style="text-align:right">Total</th>
      </tr>
    </thead>
    <tbody>
      ${items.map((it) => `
      <tr>
        <td>${it.description}</td>
        <td style="text-align:center">${it.quantity}</td>
        <td style="text-align:right">${BRL(it.unit_price)}</td>
        <td style="text-align:right">${BRL(it.total)}</td>
      </tr>`).join('')}
    </tbody>
  </table>
  <div class="totals">
    <div>Subtotal: ${BRL(items.reduce((s, i) => s + i.total, 0))}</div>
    ${ct.discount > 0 ? `<div>Desconto: - ${BRL(ct.discount)}</div>` : ''}
    <div class="total-final">Total: ${BRL(ct.total)}</div>
  </div>
</section>

${ct.payment_method ? `
<section>
  <h2>FORMA DE PAGAMENTO</h2>
  <div class="field">${PAYMENT_METHODS.find((p) => p.value === ct.payment_method)?.label ?? ct.payment_method}</div>
</section>` : ''}

${ct.notes ? `<section><h2>OBSERVAÇÕES</h2><p style="font-size:12px">${ct.notes}</p></section>` : ''}

<p style="font-size:11px;color:#555;margin-top:16px">
  Este contrato está sujeito às cláusulas gerais de locação da Ax Festas.
  Em caso de dúvidas, entre em contato pelo WhatsApp.
</p>

<div class="signature">
  <div class="sign-box">Locador: Ax Festas</div>
  <div class="sign-box">Locatário: ${ct.client_name}</div>
</div>

<script>window.onload=function(){window.print();}</script>
</body></html>`;

  const w = window.open('', '_blank');
  if (w) { w.document.write(html); w.document.close(); }
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ContractsPage() {
  const params = useSearchParams();
  const { showSuccess, showError } = useToast();

  const [contracts, setContracts] = useState<Contract[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'list' | 'form' | 'detail'>('list');
  const [editingContract, setEditingContract] = useState<Contract | null>(null);
  const [detailContract, setDetailContract] = useState<Contract | null>(null);
  const [filterStatus, setFilterStatus] = useState('');
  const [search, setSearch] = useState('');
  const [clientSearch, setClientSearch] = useState('');

  // Form state
  const [selectedClientId, setSelectedClientId] = useState('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [formQuoteId, setFormQuoteId] = useState('');
  const [formEventDate, setFormEventDate] = useState('');
  const [formEventLocation, setFormEventLocation] = useState('');
  const [formPickupDate, setFormPickupDate] = useState('');
  const [formReturnDate, setFormReturnDate] = useState('');
  const [formItems, setFormItems] = useState<ContractItem[]>([{ ...EMPTY_ITEM }]);
  const [formDiscount, setFormDiscount] = useState(0);
  const [formPaymentMethod, setFormPaymentMethod] = useState('');
  const [formStatus, setFormStatus] = useState<ContractStatus>('pending');
  const [formNotes, setFormNotes] = useState('');
  const [saving, setSaving] = useState(false);

  // ── Load data ──────────────────────────────────────────────────────────────

  const loadContracts = useCallback(async () => {
    try {
      const res = await fetch('/api/contracts');
      if (res.ok) setContracts(await res.json() as Contract[]);
    } catch (err) {
      console.error('Error loading contracts:', err);
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
    loadContracts();
    loadClients();
  }, [loadContracts, loadClients]);

  // Pre-fill from quote when navigated from quotes page
  useEffect(() => {
    const fromQuote = params?.get('from_quote');
    if (!fromQuote || !clients.length) return;

    fetch(`/api/quotes?id=${fromQuote}`)
      .then((r) => r.ok ? r.json() : null)
      .then((q: unknown) => {
        const qt = q as QuoteRaw | null;
        if (!qt) return;
        const client = clients.find((c) => c.id === qt.client_id) || null;
        setSelectedClientId(String(qt.client_id));
        setSelectedClient(client);
        setClientSearch(qt.client_name);
        setFormQuoteId(String(qt.id));
        setFormEventDate(qt.event_date || '');
        setFormEventLocation(qt.event_location || '');
        try { setFormItems(JSON.parse(qt.items_json) as ContractItem[]); } catch { /* ignore */ }
        setFormDiscount(qt.discount);
        setView('form');
      })
      .catch(console.error);
  }, [params, clients]); // re-runs once clients load so autofill works

  // ── Derived ────────────────────────────────────────────────────────────────

  const filteredClients = clients.filter((c) => {
    if (!clientSearch.trim()) return true;
    const q = clientSearch.toLowerCase();
    return c.name.toLowerCase().includes(q) || c.phone.includes(q);
  });

  const itemsSubtotal = formItems.reduce((s, it) => s + it.total, 0);
  const formTotal = Math.max(0, itemsSubtotal - formDiscount);

  const filteredContracts = contracts.filter((c) => {
    if (filterStatus && c.status !== filterStatus) return false;
    if (!search.trim()) return true;
    const s = search.toLowerCase();
    return (
      c.client_name.toLowerCase().includes(s) ||
      formatContractId(c.id).toLowerCase().includes(s)
    );
  });

  // ── Form helpers ───────────────────────────────────────────────────────────

  function resetForm() {
    setSelectedClientId('');
    setSelectedClient(null);
    setClientSearch('');
    setFormQuoteId('');
    setFormEventDate('');
    setFormEventLocation('');
    setFormPickupDate('');
    setFormReturnDate('');
    setFormItems([{ ...EMPTY_ITEM }]);
    setFormDiscount(0);
    setFormPaymentMethod('');
    setFormStatus('pending');
    setFormNotes('');
    setEditingContract(null);
  }

  function openNew() {
    resetForm();
    setView('form');
  }

  function openEdit(c: Contract) {
    setEditingContract(c);
    const client = clients.find((cl) => cl.id === c.client_id) || null;
    setSelectedClientId(String(c.client_id));
    setSelectedClient(client);
    setClientSearch(c.client_name);
    setFormQuoteId(c.quote_id ? String(c.quote_id) : '');
    setFormEventDate(c.event_date || '');
    setFormEventLocation(c.event_location || '');
    setFormPickupDate(c.pickup_date || '');
    setFormReturnDate(c.return_date || '');
    try { setFormItems(JSON.parse(c.items_json) as ContractItem[]); } catch { setFormItems([{ ...EMPTY_ITEM }]); }
    setFormDiscount(c.discount);
    setFormPaymentMethod(c.payment_method || '');
    setFormStatus(c.status);
    setFormNotes(c.notes || '');
    setView('form');
  }

  function openDetail(c: Contract) {
    setDetailContract(c);
    setView('detail');
  }

  // ── Client selection ───────────────────────────────────────────────────────

  function handleClientSelect(client: Client) {
    setSelectedClientId(String(client.id));
    setSelectedClient(client);
    setClientSearch(client.name);
  }

  // ── Item management ────────────────────────────────────────────────────────

  function updateItem(idx: number, field: keyof ContractItem, value: string | number) {
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
  }

  function removeItem(idx: number) {
    setFormItems((prev) => prev.filter((_, i) => i !== idx));
  }

  // ── Save ───────────────────────────────────────────────────────────────────

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedClientId) { showError('Selecione um cliente'); return; }
    setSaving(true);
    try {
      const payload = {
        client_id: Number(selectedClientId),
        quote_id: formQuoteId ? Number(formQuoteId) : null,
        event_date: formEventDate || undefined,
        event_location: formEventLocation || undefined,
        pickup_date: formPickupDate || undefined,
        return_date: formReturnDate || undefined,
        items_json: formItems,
        discount: formDiscount,
        total: formTotal,
        payment_method: formPaymentMethod || undefined,
        status: formStatus,
        notes: formNotes || undefined,
      };

      const url = editingContract ? `/api/contracts?id=${editingContract.id}` : '/api/contracts';
      const method = editingContract ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      showSuccess(editingContract ? 'Contrato atualizado!' : 'Contrato criado!');
      resetForm();
      setView('list');
      loadContracts();
    } catch (err) {
      console.error('Error saving contract:', err);
      showError('Erro ao salvar contrato');
    } finally {
      setSaving(false);
    }
  }

  // ── Delete ─────────────────────────────────────────────────────────────────

  async function handleDelete(id: number) {
    if (!confirm('Excluir este contrato?')) return;
    try {
      const res = await fetch(`/api/contracts?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      showSuccess('Contrato excluído');
      if (view === 'detail') setView('list');
      loadContracts();
    } catch {
      showError('Erro ao excluir contrato');
    }
  }

  // ── WhatsApp share ─────────────────────────────────────────────────────────

  function handleWhatsApp(c: Contract) {
    let items: ContractItem[] = [];
    try { items = JSON.parse(c.items_json) as ContractItem[]; } catch { /* ignore */ }

    const itemLines = items.map((it) =>
      `  - ${it.quantity}x ${it.description}: ${BRL(it.total)}`
    ).join('\n');

    const msg = [
      `*${formatContractId(c.id)} - Contrato Ax Festas*`,
      '',
      `👤 Cliente: ${c.client_name}`,
      c.event_date ? `📅 Evento: ${fmtDate(c.event_date)}` : null,
      c.pickup_date ? `📦 Retirada: ${fmtDate(c.pickup_date)}` : null,
      c.return_date ? `🔙 Devolução: ${fmtDate(c.return_date)}` : null,
      '',
      '*Itens:*',
      itemLines || '  (sem itens)',
      '',
      c.discount > 0 ? `🏷️ Desconto: ${BRL(c.discount)}` : null,
      `💰 *Total: ${BRL(c.total)}*`,
      '',
      `Status: ${STATUS_LABELS[c.status]}`,
      '',
      'Para confirmar ou assinar o contrato, entre em contato! 🎉',
    ].filter(Boolean).join('\n');

    const phone = c.client_phone.replace(/\D/g, '');
    const url = `https://wa.me/55${phone}?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Render
  // ──────────────────────────────────────────────────────────────────────────

  if (view === 'form') {
    return (
      <div className="max-w-4xl">
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => { resetForm(); setView('list'); }}
            className="text-gray-500 hover:text-gray-800">← Voltar</button>
          <h2 className="text-xl font-bold">
            {editingContract ? `Editar ${formatContractId(editingContract.id)}` : 'Novo Contrato'}
          </h2>
          {formQuoteId && (
            <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-medium">
              Gerado a partir de {formatQuoteId(Number(formQuoteId))}
            </span>
          )}
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          {/* Client selector */}
          <div className="bg-white rounded-lg shadow p-5">
            <h3 className="font-semibold text-gray-700 mb-4">Locatário (Cliente)</h3>
            <div className="relative mb-3">
              <input
                type="text"
                placeholder="Buscar cliente pelo nome ou telefone..."
                value={clientSearch}
                onChange={(e) => {
                  setClientSearch(e.target.value);
                  if (!e.target.value) { setSelectedClientId(''); setSelectedClient(null); }
                }}
                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
              {clientSearch && !selectedClientId && (
                <div className="absolute z-10 w-full bg-white border rounded-lg shadow-lg mt-1 max-h-48 overflow-y-auto">
                  {filteredClients.length === 0 ? (
                    <div className="p-3 text-gray-400 text-sm">Nenhum cliente encontrado</div>
                  ) : filteredClients.slice(0, 8).map((c) => (
                    <button key={c.id} type="button" onClick={() => handleClientSelect(c)}
                      className="w-full text-left px-4 py-2 hover:bg-indigo-50 text-sm">
                      <span className="font-medium">{c.name}</span>
                      <span className="text-gray-400 ml-2">{c.phone}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            {selectedClient && (
              <div className="bg-indigo-50 rounded-lg p-4 grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-gray-500">Nome:</span> <strong>{selectedClient.name}</strong></div>
                <div><span className="text-gray-500">Telefone:</span> {selectedClient.phone}</div>
                {selectedClient.email && <div><span className="text-gray-500">Email:</span> {selectedClient.email}</div>}
                {selectedClient.cpf && <div><span className="text-gray-500">CPF:</span> {selectedClient.cpf}</div>}
                {selectedClient.address && (
                  <div className="col-span-2">
                    <span className="text-gray-500">Endereço:</span> {selectedClient.address}
                    {selectedClient.city ? `, ${selectedClient.city}` : ''}
                    {selectedClient.state ? ` - ${selectedClient.state}` : ''}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Dates */}
          <div className="bg-white rounded-lg shadow p-5">
            <h3 className="font-semibold text-gray-700 mb-4">Datas e Local</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Data do Evento</label>
                <input type="date" value={formEventDate} onChange={(e) => setFormEventDate(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Local do Evento</label>
                <input type="text" value={formEventLocation} onChange={(e) => setFormEventLocation(e.target.value)}
                  placeholder="Salão, endereço..."
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Data de Retirada</label>
                <input type="date" value={formPickupDate} onChange={(e) => setFormPickupDate(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Data de Devolução</label>
                <input type="date" value={formReturnDate} onChange={(e) => setFormReturnDate(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400" />
              </div>
            </div>
          </div>

          {/* Items */}
          <div className="bg-white rounded-lg shadow p-5">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-gray-700">Itens Locados</h3>
              <button type="button" onClick={addItem}
                className="text-sm text-indigo-600 hover:text-indigo-800 font-medium">
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
                  <input className="col-span-5 border rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-400"
                    placeholder="Descrição" value={item.description}
                    onChange={(e) => updateItem(idx, 'description', e.target.value)} />
                  <input className="col-span-2 border rounded px-2 py-1.5 text-sm text-center focus:outline-none focus:ring-1 focus:ring-indigo-400"
                    type="number" min="1" value={item.quantity}
                    onChange={(e) => updateItem(idx, 'quantity', e.target.value)} />
                  <input className="col-span-2 border rounded px-2 py-1.5 text-sm text-center focus:outline-none focus:ring-1 focus:ring-indigo-400"
                    type="number" min="0" step="0.01" value={item.unit_price}
                    onChange={(e) => updateItem(idx, 'unit_price', e.target.value)} />
                  <div className="col-span-2 text-sm text-center font-medium text-gray-700">{BRL(item.total)}</div>
                  <button type="button" onClick={() => removeItem(idx)}
                    className="col-span-1 text-red-400 hover:text-red-600 text-center" title="Remover">✕</button>
                </div>
              ))}
            </div>

            <div className="mt-4 border-t pt-4 space-y-2">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Subtotal:</span><span>{BRL(itemsSubtotal)}</span>
              </div>
              <div className="flex justify-between items-center text-sm text-gray-600">
                <span>Desconto:</span>
                <input type="number" min="0" step="0.01" value={formDiscount}
                  onChange={(e) => setFormDiscount(Number(e.target.value) || 0)}
                  className="border rounded px-2 py-1 w-32 text-right text-sm focus:outline-none focus:ring-1 focus:ring-indigo-400" />
              </div>
              <div className="flex justify-between font-bold text-base text-gray-900">
                <span>Total:</span><span className="text-indigo-600">{BRL(formTotal)}</span>
              </div>
            </div>
          </div>

          {/* Payment + Status + Notes */}
          <div className="bg-white rounded-lg shadow p-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Forma de Pagamento</label>
                <select value={formPaymentMethod} onChange={(e) => setFormPaymentMethod(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400">
                  {PAYMENT_METHODS.map((p) => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Status</label>
                <select value={formStatus} onChange={(e) => setFormStatus(e.target.value as ContractStatus)}
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400">
                  {Object.entries(STATUS_LABELS).map(([v, l]) => (
                    <option key={v} value={v}>{l}</option>
                  ))}
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-600 mb-1">Observações</label>
                <textarea value={formNotes} onChange={(e) => setFormNotes(e.target.value)}
                  rows={3}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
              </div>
            </div>
          </div>

          <div className="flex gap-3 justify-end">
            <button type="button" onClick={() => { resetForm(); setView('list'); }}
              className="px-5 py-2 border rounded-lg hover:bg-gray-50 transition-colors">Cancelar</button>
            <button type="submit" disabled={saving}
              className="px-5 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50">
              {saving ? 'Salvando...' : editingContract ? 'Salvar Alterações' : 'Criar Contrato'}
            </button>
          </div>
        </form>
      </div>
    );
  }

  if (view === 'detail' && detailContract) {
    let items: ContractItem[] = [];
    try { items = JSON.parse(detailContract.items_json) as ContractItem[]; } catch { /* ignore */ }

    return (
      <div className="max-w-3xl">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <button onClick={() => setView('list')} className="text-gray-500 hover:text-gray-800">← Voltar</button>
            <h2 className="text-xl font-bold">{formatContractId(detailContract.id)}</h2>
            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLORS[detailContract.status]}`}>
              {STATUS_LABELS[detailContract.status]}
            </span>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => openEdit(detailContract)}
              className="px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-50">✏️ Editar</button>
            <button onClick={() => handleWhatsApp(detailContract)}
              className="px-3 py-1.5 text-sm bg-green-500 text-white rounded-lg hover:bg-green-600">
              📱 WhatsApp
            </button>
            <button onClick={() => printContract(detailContract)}
              className="px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
              🖨️ Imprimir / PDF
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-6 space-y-6">
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Cliente</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div><span className="text-gray-500">Nome:</span> <strong>{detailContract.client_name}</strong></div>
              <div><span className="text-gray-500">Telefone:</span> {detailContract.client_phone}</div>
              {detailContract.client_email && <div><span className="text-gray-500">Email:</span> {detailContract.client_email}</div>}
              {detailContract.client_cpf && <div><span className="text-gray-500">CPF:</span> {detailContract.client_cpf}</div>}
            </div>
          </div>

          {(detailContract.event_date || detailContract.pickup_date || detailContract.return_date) && (
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Datas</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {detailContract.event_date && <div><span className="text-gray-500">Evento:</span> {fmtDate(detailContract.event_date)}</div>}
                {detailContract.event_location && <div><span className="text-gray-500">Local:</span> {detailContract.event_location}</div>}
                {detailContract.pickup_date && <div><span className="text-gray-500">Retirada:</span> {fmtDate(detailContract.pickup_date)}</div>}
                {detailContract.return_date && <div><span className="text-gray-500">Devolução:</span> {fmtDate(detailContract.return_date)}</div>}
              </div>
            </div>
          )}

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
              {detailContract.discount > 0 && (
                <div className="flex justify-between text-gray-500">
                  <span>Desconto</span><span>- {BRL(detailContract.discount)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-base">
                <span>Total</span><span className="text-indigo-600">{BRL(detailContract.total)}</span>
              </div>
            </div>
          </div>

          {detailContract.payment_method && (
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Pagamento</h3>
              <p className="text-sm">{PAYMENT_METHODS.find((p) => p.value === detailContract.payment_method)?.label ?? detailContract.payment_method}</p>
            </div>
          )}

          {detailContract.quote_id && (
            <div className="text-xs text-gray-400">
              Gerado a partir do orçamento {formatQuoteId(detailContract.quote_id)}
            </div>
          )}

          {detailContract.notes && (
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Observações</h3>
              <p className="text-sm text-gray-700">{detailContract.notes}</p>
            </div>
          )}
        </div>

        <div className="mt-4 flex justify-end">
          <button onClick={() => handleDelete(detailContract.id)}
            className="text-sm text-red-500 hover:text-red-700">🗑️ Excluir contrato</button>
        </div>
      </div>
    );
  }

  // ── List view ──────────────────────────────────────────────────────────────

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Contratos</h1>
        <button onClick={openNew}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors">
          + Novo Contrato
        </button>
      </div>

      <div className="flex gap-3 mb-5">
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por cliente ou ID..."
          className="border rounded-lg px-3 py-2 flex-1 focus:outline-none focus:ring-2 focus:ring-indigo-400" />
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
          className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400">
          <option value="">Todos os status</option>
          {Object.entries(STATUS_LABELS).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500" />
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-3 text-left text-xs font-semibold text-gray-500 uppercase">ID</th>
                  <th className="p-3 text-left text-xs font-semibold text-gray-500 uppercase">Cliente</th>
                  <th className="p-3 text-left text-xs font-semibold text-gray-500 uppercase">Retirada</th>
                  <th className="p-3 text-left text-xs font-semibold text-gray-500 uppercase">Devolução</th>
                  <th className="p-3 text-left text-xs font-semibold text-gray-500 uppercase">Total</th>
                  <th className="p-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                  <th className="p-3 text-left text-xs font-semibold text-gray-500 uppercase">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredContracts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-gray-400">
                      {contracts.length === 0 ? 'Nenhum contrato ainda. Crie o primeiro!' : 'Nenhum resultado encontrado.'}
                    </td>
                  </tr>
                ) : filteredContracts.map((c) => (
                  <tr key={c.id} className="border-t hover:bg-gray-50">
                    <td className="p-3 font-mono text-xs text-gray-500">{formatContractId(c.id)}</td>
                    <td className="p-3">
                      <div className="font-medium text-sm">{c.client_name}</div>
                      <div className="text-xs text-gray-400">{c.client_phone}</div>
                    </td>
                    <td className="p-3 text-sm text-gray-600">{c.pickup_date ? fmtDate(c.pickup_date) : <span className="text-gray-300">-</span>}</td>
                    <td className="p-3 text-sm text-gray-600">{c.return_date ? fmtDate(c.return_date) : <span className="text-gray-300">-</span>}</td>
                    <td className="p-3 font-semibold text-sm text-indigo-600">{BRL(c.total)}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLORS[c.status]}`}>
                        {STATUS_LABELS[c.status]}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex gap-2 flex-wrap">
                        <button onClick={() => openDetail(c)} className="text-xs text-blue-600 hover:underline">👁️ Ver</button>
                        <button onClick={() => openEdit(c)} className="text-xs text-gray-600 hover:underline">✏️ Editar</button>
                        <button onClick={() => printContract(c)} className="text-xs text-indigo-600 hover:underline">🖨️ PDF</button>
                        <button onClick={() => handleWhatsApp(c)} className="text-xs text-green-600 hover:underline">📱 WA</button>
                        <button onClick={() => handleDelete(c.id)} className="text-xs text-red-500 hover:underline">🗑️</button>
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
