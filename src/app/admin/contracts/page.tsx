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

interface ContractClause {
  id: string;
  title: string;
  content: string;
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

const DEFAULT_CLAUSES: ContractClause[] = [
  {
    id: '01',
    title: '01. Do Objeto da Locação',
    content: 'A locadora Ax Festas disponibiliza a locação de mobiliário e objetos destinados à realização de festas e eventos em geral. Os itens especificados no pedido abaixo fazem parte deste contrato e foram solicitados no momento da contratação.',
  },
  {
    id: '02',
    title: '02. Das Retiradas e Devoluções',
    content: '2.1. As retiradas e devoluções dos itens locados deverão ser realizadas com 24 (vinte e quatro) horas de antecedência ou na data do evento, no endereço Rua Jacintha de Paulo Ferreira, nº 12, Bairro André Carloni, Serra/ES, CEP: 29161-820.\n2.2. Todo o material locado deve ser devolvido no mesmo local em que foram retirados.\n2.3. Os itens locados serão entregues limpos e sem avarias, devidamente embalados.\n2.4. No ato da recepção e devolução, os bens locados deverão ser conferidos pelo Locatário(a/e) e Locador(a/e).\n2.5. Em caso de necessidade de reposição ou danos nos itens locados, será de responsabilidade do Locatário(a/e).',
  },
  {
    id: '03',
    title: '03. Do Preço e Pagamento',
    content: '3.1. O Locatário(a/e) pagará pelo valor descrito no pedido acima.\n3.2. Para garantir a reserva dos itens locados, aceitamos o parcelamento do valor da locação da seguinte forma: Pagamento de 50% (cinquenta por cento) do valor como sinal, realizado por meio de Pix, cartão de crédito ou cartão de débito e os outros 50% (cinquenta por cento) deverá ser quitado no momento da retirada dos itens locados. Caso o cliente prefira, poderá optar pelo pagamento integral (100%) no ato da reserva.\n3.3. Os pagamentos feitos via cartão estão sujeitos a taxa conforme o banco PagBank. Cartão de crédito com taxa de 3,14% e cartão de débito com taxa de 0,88%.\n3.4. A locação para a data contratada só será garantida mediante o pagamento de 100% do valor do pedido.\n3.5. Em caso de cancelamento, será restituído o equivalente a 80% (oitenta por cento) do valor total da locação, a título de reembolso.\n3.6. Não serão aceitos pagamentos após o evento ou na devolução de itens locados.',
  },
  {
    id: '04',
    title: '04. Das Avarias de Itens Locados',
    content: '4.1. O Locador(a/e) se compromete a entregar o produto em bom estado de conservação (salvo desgaste natural da utilização), e o Locatário(a/e), no ato da retirada, confirma e presume o bom estado de conservação.\n4.2. No ato da devolução dos bens locados, estes deverão estar no mesmo estado da retirada (sem furos, traços de colagem, cola ou adesivos, marcas de grampeador ou grampos, trincos, arranhões, manchas, quebrados ou peças faltantes), tais como foram recebidos, respondendo o Locatário(a/e) pelos danos causados.\n4.3. Após emissão do contrato, a solicitação da troca e/ou exclusão de itens poderá ocorrer no máximo dois dias antes da data do aluguel.',
  },
  {
    id: '05',
    title: '05. Das Multas Contratuais',
    content: '5.1. No caso de peças com avarias, será cobrado o valor de reposição; em caso de indisponibilidade, será cobrado o valor de mercado.\n5.2. No caso de não devolução de peças individuais ou partes, serão cobrados o valor de reposição; em caso de indisponibilidade, será cobrado o valor de mercado.\n5.3. No caso de não devolução de itens locados dentro do prazo contratado, será cobrado 1% (um por cento) do valor do contrato por dia de atraso.\n5.4. A reforma em itens avariados e/ou compra para reposição de itens advindos dos casos acima citados é exclusiva da Ax Festas, cabendo ao Locatário(a/e) efetuar os devidos pagamentos ora descritos.',
  },
  {
    id: '06',
    title: '06. Disposições Gerais',
    content: '06.1. As partes declaram estar de acordo com todas as cláusulas deste contrato, comprometendo-se a cumpri-las integralmente.',
  },
];

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

interface LocadorSettings {
  locador_name: string;
  locador_cpf: string;
  locador_address: string;
}

const DEFAULT_LOCADOR: LocadorSettings = {
  locador_name: 'ALEX DOS SANTOS FRAGA',
  locador_cpf: '142.612.667-09',
  locador_address: 'Rua Jacintha de Paulo Ferreira, nº 12, Bairro André Carloni, Serra/ES, CEP: 29161-820',
};

function printContract(ct: Contract, clauses: ContractClause[] = DEFAULT_CLAUSES, locador: LocadorSettings = DEFAULT_LOCADOR) {
  let items: ContractItem[] = [];
  try { items = JSON.parse(ct.items_json) as ContractItem[]; } catch { /* ignore */ }

  const paymentLabel = PAYMENT_METHODS.find((p) => p.value === ct.payment_method)?.label ?? ct.payment_method ?? '';
  const logoUrl = `${window.location.origin}/1.png`;
  const subtotal = items.reduce((s, i) => s + i.total, 0);

  const clauseParagraphs = (content: string) =>
    content.split('\n').map(p => p.trim()).filter(Boolean).map(p => `<p>${p}</p>`).join('');

  const clause01 = clauses.find(c => c.id === '01') ?? DEFAULT_CLAUSES[0];
  const otherClauses = clauses.filter(c => c.id !== '01');

  const hasEventInfo = ct.event_date || ct.event_location || ct.pickup_date || ct.return_date || paymentLabel;

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Contrato ${formatContractId(ct.id)}</title>
<style>
  /* ── Reset ── */
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  /* ── App shell — Google Docs style ── */
  body {
    background: #525659;
    font-family: Arial, Helvetica, sans-serif;
    padding-top: 56px;
    min-height: 100vh;
  }

  /* ── Top toolbar ── */
  #toolbar {
    position: fixed;
    top: 0; left: 0; right: 0;
    height: 56px;
    background: #404040;
    display: flex;
    align-items: center;
    padding: 0 20px;
    gap: 14px;
    z-index: 9999;
    box-shadow: 0 2px 8px rgba(0,0,0,0.5);
  }
  #toolbar .tb-icon { font-size: 22px; line-height: 1; }
  #toolbar .tb-info { flex: 1; overflow: hidden; }
  #toolbar .tb-title { color: #fff; font-size: 15px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  #toolbar .tb-sub { color: #aaa; font-size: 11px; margin-top: 1px; }
  #toolbar .btn-print {
    background: #1a73e8;
    color: #fff;
    border: none;
    padding: 8px 18px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 13px;
    font-weight: 600;
    white-space: nowrap;
    display: flex;
    align-items: center;
    gap: 6px;
    transition: background 0.15s;
  }
  #toolbar .btn-print:hover { background: #1558b0; }
  #toolbar .btn-close {
    background: transparent;
    color: #bbb;
    border: 1px solid #666;
    padding: 7px 12px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 13px;
    transition: background 0.15s, color 0.15s;
  }
  #toolbar .btn-close:hover { background: rgba(255,255,255,0.1); color: #fff; }

  /* ── Page area ── */
  #page-area {
    padding: 32px 24px 60px;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  /* ── White A4 paper ── */
  .page {
    width: 794px;
    min-height: 1122px;
    background: #fff;
    padding: 68px 80px 72px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.3), 0 4px 16px rgba(0,0,0,0.25);
    font-family: 'Times New Roman', Times, serif;
    font-size: 11pt;
    color: #111;
    line-height: 1.5;
  }

  /* ── Document header ── */
  .doc-header {
    text-align: center;
    padding-bottom: 16px;
    margin-bottom: 22px;
    border-bottom: 2px solid #111;
  }
  .doc-header img { height: 64px; width: auto; display: block; margin: 0 auto 10px; }
  .doc-header .doc-title {
    font-size: 15pt;
    font-weight: bold;
    text-transform: uppercase;
    letter-spacing: 2.5px;
    margin-bottom: 4px;
  }
  .doc-header .doc-id { font-size: 10pt; color: #555; }

  /* ── Party boxes ── */
  .parties { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 14px; }
  .party-box { border: 1px solid #999; }
  .party-box.full { grid-column: 1 / -1; }
  .party-header {
    background: #e6e6e6;
    font-family: Arial, Helvetica, sans-serif;
    font-weight: bold;
    font-size: 8.5pt;
    text-transform: uppercase;
    letter-spacing: 0.8px;
    padding: 5px 10px;
    border-bottom: 1px solid #999;
    color: #333;
  }
  .party-body { padding: 7px 10px; }
  .prow { display: flex; gap: 6px; margin-bottom: 3px; font-size: 9.5pt; line-height: 1.4; }
  .prow:last-child { margin-bottom: 0; }
  .plabel { font-weight: bold; white-space: nowrap; min-width: 120px; color: #333; }
  .event-grid { display: grid; grid-template-columns: 1fr 1fr; }

  /* ── Section spacer ── */
  .spacer { margin-bottom: 20px; }

  /* ── Clauses ── */
  .clause { margin-bottom: 18px; page-break-inside: avoid; }
  .clause-title {
    font-family: Arial, Helvetica, sans-serif;
    font-size: 10pt;
    font-weight: bold;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 7px;
    padding-bottom: 3px;
    border-bottom: 1px solid #ccc;
    color: #111;
  }
  .clause p { font-size: 10.5pt; line-height: 1.65; margin-bottom: 4px; text-align: justify; }

  /* ── Items table ── */
  table.items {
    width: 100%;
    border-collapse: collapse;
    margin: 12px 0 8px;
    font-size: 10pt;
    font-family: Arial, Helvetica, sans-serif;
  }
  table.items thead tr { background: #e6e6e6; }
  table.items th {
    padding: 6px 9px;
    border: 1px solid #999;
    font-weight: bold;
    font-size: 9pt;
    text-transform: uppercase;
    letter-spacing: 0.3px;
  }
  table.items td { padding: 6px 9px; border: 1px solid #ccc; vertical-align: top; }
  table.items tbody tr:nth-child(even) td { background: #f7f7f7; }
  .tc { text-align: center; }
  .tr { text-align: right; }

  /* ── Totals ── */
  .totals-block {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 3px;
    margin-top: 6px;
    font-family: Arial, Helvetica, sans-serif;
  }
  .trow { display: flex; gap: 24px; font-size: 10pt; color: #444; }
  .tval { min-width: 110px; text-align: right; }
  .trow.grand {
    font-weight: bold;
    font-size: 11.5pt;
    color: #111;
    border-top: 2px solid #333;
    padding-top: 4px;
    margin-top: 3px;
  }

  /* ── Signature ── */
  .sig-section { margin-top: 56px; page-break-inside: avoid; }
  .sig-date { font-size: 10pt; margin-bottom: 44px; }
  .sig-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 64px; }
  .sig-box { text-align: center; }
  .sig-line { border-top: 1px solid #111; margin-bottom: 6px; }
  .sig-name { font-size: 10.5pt; font-weight: bold; }
  .sig-role { font-size: 9.5pt; color: #555; }
  .sig-cpf { font-size: 9pt; color: #666; margin-top: 1px; }

  /* ── Print overrides ── */
  @media print {
    body { background: #fff; padding-top: 0; }
    #toolbar { display: none !important; }
    #page-area { padding: 0; }
    .page { width: 100%; min-height: auto; box-shadow: none; padding: 18mm 22mm; }
  }
</style>
</head>
<body>

<div id="toolbar">
  <span class="tb-icon">📄</span>
  <div class="tb-info">
    <div class="tb-title">Contrato de Locação — ${ct.client_name}</div>
    <div class="tb-sub">${formatContractId(ct.id)}${ct.event_date ? ' · Evento: ' + fmtDate(ct.event_date) : ''}</div>
  </div>
  <button class="btn-print" onclick="window.print()">🖨️ Imprimir / Salvar PDF</button>
  <button class="btn-close" onclick="window.close()" aria-label="Fechar janela">✕ Fechar</button>
</div>

<div id="page-area">
<div class="page">

  <div class="doc-header">
    <img src="${logoUrl}" onerror="this.style.display='none'" alt="Ax Festas"/>
    <div class="doc-title">Contrato de Locação</div>
    <div class="doc-id">Nº ${formatContractId(ct.id)}</div>
  </div>

  <div class="parties">
    <div class="party-box">
      <div class="party-header">Locador(a/e)</div>
      <div class="party-body">
        <div class="prow"><span class="plabel">Nome:</span><span>${locador.locador_name}</span></div>
        <div class="prow"><span class="plabel">CNPJ/CPF:</span><span>${locador.locador_cpf}</span></div>
        <div class="prow"><span class="plabel">Endereço:</span><span>${locador.locador_address}</span></div>
      </div>
    </div>
    <div class="party-box">
      <div class="party-header">Locatário(a/e)</div>
      <div class="party-body">
        <div class="prow"><span class="plabel">Nome:</span><span>${ct.client_name}</span></div>
        ${ct.client_cpf ? `<div class="prow"><span class="plabel">CNPJ/CPF:</span><span>${ct.client_cpf}</span></div>` : ''}
        <div class="prow"><span class="plabel">Telefone:</span><span>${ct.client_phone}</span></div>
        ${ct.client_email ? `<div class="prow"><span class="plabel">E-mail:</span><span>${ct.client_email}</span></div>` : ''}
        ${ct.client_address ? `<div class="prow"><span class="plabel">Endereço:</span><span>${ct.client_address}${ct.client_city ? ', ' + ct.client_city : ''}${ct.client_state ? ' - ' + ct.client_state : ''}</span></div>` : ''}
      </div>
    </div>
  </div>

  ${hasEventInfo ? `
  <div class="party-box full spacer">
    <div class="party-header">Dados do Evento</div>
    <div class="party-body event-grid">
      ${ct.event_date ? `<div class="prow"><span class="plabel">Data do Evento:</span><span>${fmtDate(ct.event_date)}</span></div>` : ''}
      ${ct.event_location ? `<div class="prow"><span class="plabel">Local do Evento:</span><span>${ct.event_location}</span></div>` : ''}
      ${ct.pickup_date ? `<div class="prow"><span class="plabel">Data de Retirada:</span><span>${fmtDate(ct.pickup_date)}</span></div>` : ''}
      ${ct.return_date ? `<div class="prow"><span class="plabel">Data de Devolução:</span><span>${fmtDate(ct.return_date)}</span></div>` : ''}
      ${paymentLabel ? `<div class="prow"><span class="plabel">Forma de Pagamento:</span><span>${paymentLabel}</span></div>` : ''}
    </div>
  </div>` : '<div class="spacer"></div>'}

  <div class="clause">
    <div class="clause-title">${clause01.title}</div>
    ${clauseParagraphs(clause01.content)}
    <table class="items">
      <thead>
        <tr>
          <th class="tc" style="width:56px">Qtd.</th>
          <th style="width:60px">Cód.</th>
          <th>Descrição</th>
          <th class="tr" style="width:110px">Valor Total</th>
        </tr>
      </thead>
      <tbody>
        ${items.map((it, idx) => `
        <tr>
          <td class="tc">${it.quantity}</td>
          <td>${String(idx + 1).padStart(3, '0')}</td>
          <td>${it.description}</td>
          <td class="tr">${BRL(it.total)}</td>
        </tr>`).join('')}
      </tbody>
    </table>
    <div class="totals-block">
      ${ct.discount > 0 ? `
      <div class="trow"><span>Subtotal:</span><span class="tval">${BRL(subtotal)}</span></div>
      <div class="trow"><span>Desconto:</span><span class="tval">-&nbsp;${BRL(ct.discount)}</span></div>` : ''}
      <div class="trow grand"><span>TOTAL:</span><span class="tval">${BRL(ct.total)}</span></div>
    </div>
  </div>

  ${ct.notes ? `
  <div class="clause">
    <div class="clause-title">Observações</div>
    <p>${ct.notes}</p>
  </div>` : ''}

  ${otherClauses.map(c => `
  <div class="clause">
    <div class="clause-title">${c.title}</div>
    ${clauseParagraphs(c.content)}
  </div>`).join('')}

  <div class="sig-section">
    <div class="sig-date">Serra/ES, _____ de ________________________ de _________.</div>
    <div class="sig-grid">
      <div class="sig-box">
        <div class="sig-line"></div>
        <div class="sig-name">${locador.locador_name}</div>
        <div class="sig-role">Locador(a/e)</div>
        <div class="sig-cpf">CPF: ${locador.locador_cpf}</div>
      </div>
      <div class="sig-box">
        <div class="sig-line"></div>
        <div class="sig-name">${ct.client_name}</div>
        <div class="sig-role">Locatário(a/e)</div>
        ${ct.client_cpf ? `<div class="sig-cpf">CPF: ${ct.client_cpf}</div>` : ''}
      </div>
    </div>
  </div>

</div>
</div>

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
  const [editClauses, setEditClauses] = useState<ContractClause[]>(DEFAULT_CLAUSES.map(c => ({ ...c })));
  const [showClausesEditor, setShowClausesEditor] = useState(false);
  const [baseClauses, setBaseClauses] = useState<ContractClause[]>(DEFAULT_CLAUSES.map(c => ({ ...c })));
  const [locadorSettings, setLocadorSettings] = useState<LocadorSettings>({ ...DEFAULT_LOCADOR });

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

  const loadClauses = useCallback(async () => {
    try {
      const res = await fetch('/api/contract-clauses');
      if (!res.ok) return;
      const data = await res.json() as Array<{ id: number; order_num: number; title: string; content: string }>;
      if (!data.length) return;
      const mapped: ContractClause[] = data.map(c => ({
        id: String(c.order_num).padStart(2, '0'),
        title: c.title,
        content: c.content,
      }));
      setBaseClauses(mapped);
      setEditClauses(mapped.map(c => ({ ...c })));
    } catch {
      /* use DEFAULT_CLAUSES */
    }
  }, []);

  const loadLocadorSettings = useCallback(async () => {
    try {
      const res = await fetch('/api/settings');
      if (res.ok) {
        const data = await res.json() as Partial<LocadorSettings>;
        setLocadorSettings({
          locador_name: data.locador_name || DEFAULT_LOCADOR.locador_name,
          locador_cpf: data.locador_cpf || DEFAULT_LOCADOR.locador_cpf,
          locador_address: data.locador_address || DEFAULT_LOCADOR.locador_address,
        });
      }
    } catch {
      /* use defaults */
    }
  }, []);

  useEffect(() => {
    loadContracts();
    loadClients();
    loadClauses();
    loadLocadorSettings();
  }, [loadContracts, loadClients, loadClauses, loadLocadorSettings]);

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
    setEditClauses(baseClauses.map(c => ({ ...c })));
    setShowClausesEditor(false);
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
    setEditClauses(baseClauses.map(cl => ({ ...cl })));
    setShowClausesEditor(false);
    setView('detail');
  }

  // ── Client selection ───────────────────────────────────────────────────────

  function handleClientSelect(client: Client) {
    setSelectedClientId(String(client.id));
    setSelectedClient(client);
    setClientSearch(client.name);
  }

  function updateClause(idx: number, value: string) {
    setEditClauses(prev => prev.map((c, i) => i === idx ? { ...c, content: value } : c));
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
                className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-blue"
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
                  className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-blue" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Local do Evento</label>
                <input type="text" value={formEventLocation} onChange={(e) => setFormEventLocation(e.target.value)}
                  placeholder="Salão, endereço..."
                  className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-blue" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Data de Retirada</label>
                <input type="date" value={formPickupDate} onChange={(e) => setFormPickupDate(e.target.value)}
                  className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-blue" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Data de Devolução</label>
                <input type="date" value={formReturnDate} onChange={(e) => setFormReturnDate(e.target.value)}
                  className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-blue" />
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
                  className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-blue">
                  {PAYMENT_METHODS.map((p) => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Status</label>
                <select value={formStatus} onChange={(e) => setFormStatus(e.target.value as ContractStatus)}
                  className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-blue">
                  {Object.entries(STATUS_LABELS).map(([v, l]) => (
                    <option key={v} value={v}>{l}</option>
                  ))}
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-600 mb-1">Observações</label>
                <textarea value={formNotes} onChange={(e) => setFormNotes(e.target.value)}
                  rows={3}
                  className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue" />
              </div>
            </div>
          </div>

          {/* Contract Clauses */}
          <div className="bg-white rounded-lg shadow p-5">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-gray-700">Cláusulas do Contrato</h3>
              <button type="button" onClick={() => setShowClausesEditor(!showClausesEditor)}
                className="text-sm text-brand-yellow hover:text-yellow-600 font-medium">
                {showClausesEditor ? '▲ Ocultar' : '▼ Visualizar / Editar'}
              </button>
            </div>
            {showClausesEditor && (
              <div className="mt-4 space-y-5">
                <p className="text-xs text-gray-400">As cláusulas abaixo serão usadas ao imprimir o contrato. Edite conforme necessário.</p>
                {editClauses.map((clause, idx) => (
                  <div key={clause.id}>
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">{clause.title}</label>
                    <textarea
                      value={clause.content}
                      onChange={(e) => updateClause(idx, e.target.value)}
                      rows={clause.id === '01' ? 3 : 6}
                      className="w-full border rounded px-3 py-2 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-blue font-mono"
                    />
                  </div>
                ))}
                <button type="button" onClick={() => setEditClauses(baseClauses.map(c => ({ ...c })))}
                  className="text-xs text-red-400 hover:text-red-600">
                  ↺ Restaurar cláusulas padrão
                </button>
              </div>
            )}
          </div>

          <div className="flex gap-3 justify-end">
            <button type="button" onClick={() => { resetForm(); setView('list'); }}
              className="px-5 py-2 border rounded hover:bg-gray-50 transition-colors">Cancelar</button>
            <button type="submit" disabled={saving}
              className="px-5 py-2 bg-brand-blue hover:bg-brand-blue-dark text-white rounded transition-colors disabled:opacity-50">
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
              className="px-3 py-1.5 text-sm border rounded hover:bg-gray-50">✏️ Editar</button>
            <button onClick={() => handleWhatsApp(detailContract)}
              className="px-3 py-1.5 text-sm bg-green-500 text-white rounded hover:bg-green-600">
              📱 WhatsApp
            </button>
            <button onClick={() => printContract(detailContract, editClauses, locadorSettings)}
              className="px-3 py-1.5 text-sm bg-brand-blue hover:bg-brand-blue-dark text-white rounded">
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

        {/* Clauses editor */}
        <div className="mt-4 bg-white rounded-xl shadow p-6">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-semibold text-gray-500 uppercase">Cláusulas do Contrato</h3>
            <button onClick={() => setShowClausesEditor(!showClausesEditor)}
              className="text-sm text-brand-yellow hover:text-yellow-600 font-medium">
              {showClausesEditor ? '▲ Ocultar' : '▼ Revisar / Editar Cláusulas'}
            </button>
          </div>
          {showClausesEditor && (
            <div className="mt-4 space-y-5">
              <p className="text-xs text-gray-400">Edite as cláusulas abaixo se necessário. As alterações serão usadas no PDF ao clicar em &quot;Imprimir / PDF&quot;.</p>
              {editClauses.map((clause, idx) => (
                <div key={clause.id}>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">{clause.title}</label>
                  <textarea
                    value={clause.content}
                    onChange={(e) => updateClause(idx, e.target.value)}
                    rows={clause.id === '01' ? 3 : 6}
                    className="w-full border rounded px-3 py-2 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-blue font-mono"
                  />
                </div>
              ))}
              <button onClick={() => setEditClauses(baseClauses.map(c => ({ ...c })))}
                className="text-xs text-red-400 hover:text-red-600">
                ↺ Restaurar cláusulas padrão
              </button>
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
          className="bg-brand-blue hover:bg-brand-blue-dark text-white px-4 py-2 rounded transition-colors">
          + Novo Contrato
        </button>
      </div>

      <div className="flex gap-3 mb-5">
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por cliente ou ID..."
          className="border rounded px-3 py-2 flex-1 focus:outline-none focus:ring-2 focus:ring-brand-blue" />
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
          className="border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-blue">
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
                        <button onClick={() => openDetail(c)} className="text-xs bg-brand-blue hover:bg-brand-blue-dark text-white py-1 px-2 rounded">👁️ Ver</button>
                        <button onClick={() => openEdit(c)} className="text-xs bg-brand-blue hover:bg-brand-blue-dark text-white py-1 px-2 rounded">✏️ Editar</button>
                        <button onClick={() => printContract(c, DEFAULT_CLAUSES, locadorSettings)} className="text-xs bg-brand-blue hover:bg-brand-blue-dark text-white py-1 px-2 rounded">🖨️ PDF</button>
                        <button onClick={() => handleWhatsApp(c)} className="text-xs bg-green-500 hover:bg-green-600 text-white py-1 px-2 rounded">📱 WA</button>
                        <button onClick={() => handleDelete(c.id)} className="text-xs bg-red-500 hover:bg-red-700 text-white py-1 px-2 rounded">🗑️</button>
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
