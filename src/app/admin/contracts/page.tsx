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

interface CatalogProduct {
  id: string;
  name: string;
  price: number;
  type: string;
}

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

  const paymentLabel = PAYMENT_METHODS.find((p) => p.value === ct.payment_method)?.label ?? ct.payment_method ?? '';

  const html = `<!DOCTYPE html><html lang="pt-BR"><head>
<meta charset="utf-8"/>
<title>Contrato ${formatContractId(ct.id)}</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: Arial, sans-serif; font-size: 12px; margin: 0; padding: 30px 35px; color: #1a1a1a; }
  h1 { text-align: center; font-size: 16px; font-weight: bold; text-transform: uppercase; margin: 0 0 6px; letter-spacing: 1px; }
  .sub { text-align: center; font-size: 11px; color: #555; margin-bottom: 6px; }
  .contract-id { text-align: center; font-size: 11px; color: #555; margin-bottom: 20px; }
  .party-block { margin-bottom: 16px; border: 1px solid #ccc; border-radius: 4px; }
  .party-block .party-title { background: #f0f0f0; font-weight: bold; font-size: 12px; padding: 5px 10px; border-bottom: 1px solid #ccc; text-transform: uppercase; border-radius: 4px 4px 0 0; }
  .party-grid { display: grid; grid-template-columns: max-content 1fr; gap: 4px 12px; padding: 8px 10px; font-size: 11.5px; }
  .party-grid .label { font-weight: bold; color: #333; white-space: nowrap; }
  .clause { margin-bottom: 14px; }
  .clause-title { font-weight: bold; font-size: 12px; text-transform: uppercase; margin-bottom: 6px; border-bottom: 1px solid #bbb; padding-bottom: 3px; }
  .clause p { margin: 4px 0; font-size: 11.5px; line-height: 1.6; }
  table.items { width: 100%; border-collapse: collapse; font-size: 11.5px; margin-bottom: 6px; }
  table.items th { background: #f0f0f0; padding: 5px 8px; text-align: left; border: 1px solid #ccc; font-size: 11px; font-weight: bold; }
  table.items td { padding: 5px 8px; border: 1px solid #ddd; vertical-align: top; }
  table.items .center { text-align: center; }
  table.items .right { text-align: right; }
  .totals-row { display: flex; justify-content: flex-end; gap: 30px; font-size: 12px; margin-top: 6px; }
  .totals-row .total-final { font-weight: bold; font-size: 13px; }
  .signature-block { margin-top: 50px; display: grid; grid-template-columns: 1fr 1fr; gap: 50px; }
  .sign-box { text-align: center; }
  .sign-box .sign-line { border-top: 1px solid #333; margin-bottom: 5px; }
  .sign-box .sign-label { font-size: 11px; }
  @media print {
    body { padding: 15px 20px; }
    button { display: none !important; }
  }
</style>
</head><body>

<h1>Contrato de Locação de Pegue e Monte</h1>
<div class="sub">Ax Festas &mdash; www.axfestas.com.br</div>
<div class="contract-id">Contrato Nº ${formatContractId(ct.id)}</div>

<div class="party-block">
  <div class="party-title">Locadore</div>
  <div class="party-grid">
    <span class="label">Nome</span><span>ALEX DOS SANTOS FRAGA</span>
    <span class="label">CNPJ/CPF</span><span>142.612.667-09</span>
    <span class="label">Endereço</span><span>Rua Jacintha de Paulo Ferreira, nº 12, Bairro André Carloni, Serra/ES, CEP: 29161-820</span>
  </div>
</div>

<div class="party-block">
  <div class="party-title">Locatário</div>
  <div class="party-grid">
    <span class="label">Nome</span><span>${ct.client_name}</span>
    ${ct.client_cpf ? `<span class="label">CNPJ/CPF</span><span>${ct.client_cpf}</span>` : ''}
    <span class="label">Telefone</span><span>${ct.client_phone}</span>
    ${ct.client_email ? `<span class="label">E-mail</span><span>${ct.client_email}</span>` : ''}
    ${ct.client_address ? `<span class="label">Endereço</span><span>${ct.client_address}${ct.client_city ? ', ' + ct.client_city : ''}${ct.client_state ? ' - ' + ct.client_state : ''}</span>` : ''}
    ${ct.event_location ? `<span class="label">Local</span><span>${ct.event_location}</span>` : ''}
    ${ct.pickup_date ? `<span class="label">Data Retirada</span><span>${fmtDate(ct.pickup_date)}</span>` : ''}
    ${ct.return_date ? `<span class="label">Data Entrega</span><span>${fmtDate(ct.return_date)}</span>` : ''}
    ${paymentLabel ? `<span class="label">Forma de Pagamento</span><span>${paymentLabel}</span>` : ''}
  </div>
</div>

<div class="clause">
  <div class="clause-title">01. Do Objeto da Locação</div>
  <p>A locadora Ax Festas disponibiliza a locação de mobiliário e objetos destinados à realização de festas e eventos em geral. Os itens especificados no pedido abaixo fazem parte deste contrato e foram solicitados no momento da contratação.</p>
  <table class="items">
    <thead>
      <tr>
        <th class="center" style="width:60px">Quant.</th>
        <th style="width:80px">Cód.</th>
        <th>Detalhes</th>
        <th class="right" style="width:100px">Valor</th>
      </tr>
    </thead>
    <tbody>
      ${items.map((it, idx) => `
      <tr>
        <td class="center">${it.quantity}</td>
        <td>${String(idx + 1).padStart(3, '0')}</td>
        <td>${it.description}</td>
        <td class="right">${BRL(it.total)}</td>
      </tr>`).join('')}
    </tbody>
  </table>
  <div class="totals-row">
    ${ct.discount > 0 ? `<span>Desconto: <strong>- ${BRL(ct.discount)}</strong></span>` : ''}
    <span class="total-final">Total: ${BRL(ct.total)}</span>
  </div>
</div>

${ct.notes ? `<div class="clause"><div class="clause-title">Observações</div><p>${ct.notes}</p></div>` : ''}

<div class="clause">
  <div class="clause-title">02. Das Retiradas e Devoluções</div>
  <p>2.1. As retiradas e devoluções dos itens locados deverão ser realizadas com 24 (vinte e quatro) horas de antecedência ou na data do evento, no endereço Rua Jacintha de Paulo Ferreira, nº 12, Bairro André Carloni, Serra/ES, CEP: 29161-820.</p>
  <p>2.2. Todo o material locado deve ser devolvido no mesmo local em que foram retirados.</p>
  <p>2.3. Os itens locados serão entregues limpos e sem avarias, devidamente embalados.</p>
  <p>2.4. No ato da recepção e devolução, os bens locados deverão ser conferidos pelo locatário e locador.</p>
  <p>2.5. Em caso de necessidade de reposição ou danos nos itens locados, será de responsabilidade do Locatário.</p>
</div>

<div class="clause">
  <div class="clause-title">03. Do Preço e Pagamento</div>
  <p>3.1. O Locatário pagará pelo valor descrito no pedido acima.</p>
  <p>3.2. Para garantir a reserva dos itens locados, aceitamos o parcelamento do valor da locação da seguinte forma: Pagamento de 50% (cinquenta por cento) do valor como sinal, realizado por meio de Pix, cartão de crédito ou cartão de débito e os outros 50% (cinquenta por cento) deverá ser quitado no momento da retirada dos itens locados. Caso o cliente prefira, poderá optar pelo pagamento integral (100%) no ato da reserva.</p>
  <p>3.3. Os pagamentos feitos via cartão estão sujeitos a taxa conforme o banco PagBank. Cartão de crédito com taxa de 3,14% e cartão de débito com taxa de 0,88%.</p>
  <p>3.4. A locação para a data contratada só será garantida mediante o pagamento de 100% do valor do pedido.</p>
  <p>3.5. Em caso de cancelamento, será restituído o equivalente a 80% (oitenta por cento) do valor total da locação, a título de reembolso.</p>
  <p>3.6. Não serão aceitos pagamentos após o evento ou na devolução de itens locados.</p>
</div>

<div class="clause">
  <div class="clause-title">04. Das Avarias de Itens Locados</div>
  <p>4.1. A Locadora se compromete a entregar o produto em bom estado de conservação (salvo desgaste natural da utilização), e o Locatário, no ato da retirada, confirma e presume o bom estado de conservação.</p>
  <p>4.2. No ato da devolução dos bens locados, estes deverão estar no mesmo estado da retirada (sem furos, traços de colagem, cola ou adesivos, marcas de grampeador ou grampos, trincos, arranhões, manchas, quebrados ou peças faltantes), tais como foram recebidos, respondendo o Locatário pelos danos causados.</p>
  <p>4.3. Após emissão do contrato, a solicitação da troca e/ou exclusão de itens poderá ocorrer no máximo dois dias antes da data do aluguel.</p>
</div>

<div class="clause">
  <div class="clause-title">05. Das Multas Contratuais</div>
  <p>5.1. No caso de peças com avarias, será cobrado o valor de reposição; em caso de indisponibilidade, será cobrado o valor de mercado.</p>
  <p>5.2. No caso de não devolução de peças individuais ou partes, serão cobrados o valor de reposição; em caso de indisponibilidade, será cobrado o valor de mercado.</p>
  <p>5.3. No caso de não devolução de itens locados dentro do prazo contratado, será cobrado 1% (um por cento) do valor do contrato por dia de atraso.</p>
  <p>5.4. A reforma em itens avariados e/ou compra para reposição de itens advindos dos casos acima citados é exclusiva da Ax Festas, cabendo ao locatário efetuar os devidos pagamentos ora descritos.</p>
</div>

<div class="clause">
  <div class="clause-title">06. Disposições Gerais</div>
  <p>06.1. As partes declaram estar de acordo com todas as cláusulas deste contrato, comprometendo-se a cumpri-las integralmente.</p>
</div>

<div class="signature-block">
  <div class="sign-box">
    <div class="sign-line"></div>
    <div class="sign-label">Locador(e): Alex dos Santos Fraga &mdash; Ax Festas</div>
  </div>
  <div class="sign-box">
    <div class="sign-line"></div>
    <div class="sign-label">Locatário(a): ${ct.client_name}</div>
  </div>
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
  const [catalogProducts, setCatalogProducts] = useState<CatalogProduct[]>([]);
  const [productSearches, setProductSearches] = useState<string[]>([]);
  const [productDropdowns, setProductDropdowns] = useState<boolean[]>([]);

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
    setProductSearches([]);
    setProductDropdowns([]);
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
    setProductSearches([]);
    setProductDropdowns([]);
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
                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-yellow"
              />
              {clientSearch && !selectedClientId && (
                <div className="absolute z-10 w-full bg-white border rounded-lg shadow-lg mt-1 max-h-48 overflow-y-auto">
                  {filteredClients.length === 0 ? (
                    <div className="p-3 text-gray-400 text-sm">Nenhum cliente encontrado</div>
                  ) : filteredClients.slice(0, 8).map((c) => (
                    <button key={c.id} type="button" onClick={() => handleClientSelect(c)}
                      className="w-full text-left px-4 py-2 hover:bg-yellow-50 text-sm">
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
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-yellow" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Local do Evento</label>
                <input type="text" value={formEventLocation} onChange={(e) => setFormEventLocation(e.target.value)}
                  placeholder="Salão, endereço..."
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-yellow" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Data de Retirada</label>
                <input type="date" value={formPickupDate} onChange={(e) => setFormPickupDate(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-yellow" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Data de Devolução</label>
                <input type="date" value={formReturnDate} onChange={(e) => setFormReturnDate(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-yellow" />
              </div>
            </div>
          </div>

          {/* Items */}
          <div className="bg-white rounded-lg shadow p-5">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-gray-700">Itens Locados</h3>
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
                  <input className="col-span-2 border rounded px-2 py-1.5 text-sm text-center focus:outline-none focus:ring-1 focus:ring-brand-yellow"
                    type="number" min="1" value={item.quantity}
                    onChange={(e) => updateItem(idx, 'quantity', e.target.value)} />
                  <input className="col-span-2 border rounded px-2 py-1.5 text-sm text-center focus:outline-none focus:ring-1 focus:ring-brand-yellow"
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
                  className="border rounded px-2 py-1 w-32 text-right text-sm focus:outline-none focus:ring-1 focus:ring-brand-yellow" />
              </div>
              <div className="flex justify-between font-bold text-base text-gray-900">
                <span>Total:</span><span className="text-brand-yellow">{BRL(formTotal)}</span>
              </div>
            </div>
          </div>

          {/* Payment + Status + Notes */}
          <div className="bg-white rounded-lg shadow p-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Forma de Pagamento</label>
                <select value={formPaymentMethod} onChange={(e) => setFormPaymentMethod(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-yellow">
                  {PAYMENT_METHODS.map((p) => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Status</label>
                <select value={formStatus} onChange={(e) => setFormStatus(e.target.value as ContractStatus)}
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-yellow">
                  {Object.entries(STATUS_LABELS).map(([v, l]) => (
                    <option key={v} value={v}>{l}</option>
                  ))}
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-600 mb-1">Observações</label>
                <textarea value={formNotes} onChange={(e) => setFormNotes(e.target.value)}
                  rows={3}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-yellow" />
              </div>
            </div>
          </div>

          <div className="flex gap-3 justify-end">
            <button type="button" onClick={() => { resetForm(); setView('list'); }}
              className="px-5 py-2 border rounded-lg hover:bg-gray-50 transition-colors">Cancelar</button>
            <button type="submit" disabled={saving}
              className="px-5 py-2 bg-brand-blue hover:bg-brand-blue-dark text-white font-bold rounded-lg transition-colors disabled:opacity-50">
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
              className="px-3 py-1.5 text-sm bg-brand-blue hover:bg-brand-blue-dark text-white font-bold rounded-lg">
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
                <span>Total</span><span className="text-brand-yellow">{BRL(detailContract.total)}</span>
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
          className="bg-brand-blue hover:bg-brand-blue-dark text-white font-bold px-4 py-2 rounded-lg transition-colors">
          + Novo Contrato
        </button>
      </div>

      <div className="flex gap-3 mb-5">
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por cliente ou ID..."
          className="border rounded-lg px-3 py-2 flex-1 focus:outline-none focus:ring-2 focus:ring-brand-yellow" />
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
          className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-yellow">
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
                    <td className="p-3 font-semibold text-sm text-brand-yellow">{BRL(c.total)}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLORS[c.status]}`}>
                        {STATUS_LABELS[c.status]}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex gap-1 flex-wrap">
                        <button onClick={() => openDetail(c)} className="text-xs bg-brand-blue hover:bg-brand-blue-dark text-white font-bold py-1 px-2 rounded">👁️ Ver</button>
                        <button onClick={() => openEdit(c)} className="text-xs bg-brand-blue hover:bg-brand-blue-dark text-white font-bold py-1 px-2 rounded">✏️ Editar</button>
                        <button onClick={() => printContract(c)} className="text-xs bg-brand-blue hover:bg-brand-blue-dark text-white font-bold py-1 px-2 rounded">🖨️ PDF</button>
                        <button onClick={() => handleWhatsApp(c)} className="text-xs bg-green-500 hover:bg-green-600 text-white font-bold py-1 px-2 rounded">📱 WA</button>
                        <button onClick={() => handleDelete(c.id)} className="text-xs bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-2 rounded">🗑️</button>
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
