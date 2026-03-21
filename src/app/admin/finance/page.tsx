'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useToast } from '@/hooks/useToast';

// --- Types ---

interface FinancialRecord {
  id: number;
  type: 'income' | 'expense' | 'purchase';
  description: string;
  amount: number;
  date: string;
  category?: string;
  payment_method?: string;
  status: 'paid' | 'pending';
  receipt_url?: string;
}

interface FinancialSummary {
  totalIncome: number;
  totalExpense: number;
  totalPurchase: number;
  balance: number;
  period: { startDate?: string; endDate?: string };
}

interface RecordFormData {
  type: 'income' | 'expense' | 'purchase';
  description: string;
  amount: string;
  date: string;
  category: string;
  payment_method: string;
  status: 'paid' | 'pending';
  receipt_url: string;
}

// --- Constants ---

const TYPE_LABELS: Record<string, string> = {
  income: 'Receita',
  expense: 'Despesa',
  purchase: 'Compra',
};

const TYPE_COLORS: Record<string, string> = {
  income: 'bg-emerald-100 text-emerald-800',
  expense: 'bg-red-100 text-red-800',
  purchase: 'bg-blue-100 text-blue-800',
};

const STATUS_LABELS: Record<string, string> = { paid: 'Pago', pending: 'Pendente' };

const CATEGORIES: Record<string, string[]> = {
  income: ['Aluguel de Kit', 'Aluguel de Decoração', 'Serviços', 'Outros'],
  expense: ['Manutenção', 'Transporte', 'Marketing', 'Aluguel', 'Salários', 'Utilidades', 'Outros'],
  purchase: ['Itens de Estoque', 'Equipamentos', 'Materiais', 'Outros'],
};

const PAYMENT_METHODS = [
  'PIX', 'Dinheiro', 'Cartão de Crédito', 'Cartão de Débito', 'Transferência', 'Boleto',
];

const CHART_COLORS = [
  '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ef4444', '#14b8a6', '#f97316',
];

// --- Helpers ---

function formatCurrency(v: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
}

function formatDate(s: string) {
  return new Date(s + 'T00:00:00').toLocaleDateString('pt-BR');
}

function formatMonthLabel(m: string) {
  const [y, mo] = m.split('-');
  return new Date(parseInt(y), parseInt(mo) - 1).toLocaleDateString('pt-BR', {
    year: 'numeric',
    month: 'long',
  });
}

function defaultForm(): RecordFormData {
  return {
    type: 'income',
    description: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    category: '',
    payment_method: '',
    status: 'paid',
    receipt_url: '',
  };
}

// --- SVG Chart components ---

function EmptyChart({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center h-full text-gray-400 text-sm">{label}</div>
  );
}

function BarChart({ records }: { records: FinancialRecord[] }) {
  const months = useMemo(() => {
    const map: Record<string, { income: number; expense: number; purchase: number }> = {};
    records.forEach((r) => {
      const month = r.date.substring(0, 7);
      if (!map[month]) map[month] = { income: 0, expense: 0, purchase: 0 };
      map[month][r.type] += r.amount;
    });
    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6);
  }, [records]);

  if (months.length === 0) return <EmptyChart label="Sem dados para o período" />;

  const maxVal = Math.max(...months.flatMap(([, v]) => [v.income, v.expense, v.purchase]), 1);
  const W = 500, H = 220, PL = 50, PR = 10, PT = 10, PB = 40;
  const chartW = W - PL - PR;
  const chartH = H - PT - PB;
  const groupW = chartW / months.length;
  const barW = Math.min((groupW - 12) / 3, 22);

  const fmtM = (m: string) => {
    const [y, mo] = m.split('-');
    return new Date(parseInt(y), parseInt(mo) - 1).toLocaleDateString('pt-BR', { month: 'short' });
  };

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full">
      {[0, 1, 2, 3, 4].map((i) => {
        const y = PT + (chartH / 4) * i;
        const val = maxVal * (1 - i / 4);
        return (
          <g key={i}>
            <line x1={PL} y1={y} x2={W - PR} y2={y} stroke="#f0f0f0" strokeWidth="1" />
            <text x={PL - 4} y={y + 4} textAnchor="end" fontSize="9" fill="#9ca3af">
              {val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val.toFixed(0)}
            </text>
          </g>
        );
      })}
      {months.map(([month, vals], gi) => {
        const gx = PL + gi * groupW + (groupW - barW * 3 - 4) / 2;
        return (
          <g key={month}>
            {(['income', 'expense', 'purchase'] as const).map((type, ti) => {
              const val = vals[type];
              const bh = (val / maxVal) * chartH;
              const x = gx + ti * (barW + 2);
              const y = PT + chartH - bh;
              const color = type === 'income' ? '#10b981' : type === 'expense' ? '#ef4444' : '#3b82f6';
              return (
                <rect key={type} x={x} y={y} width={barW} height={bh} fill={color} rx="2" opacity="0.85">
                  <title>{TYPE_LABELS[type]}: R$ {val.toFixed(2)}</title>
                </rect>
              );
            })}
            <text x={gx + barW * 1.5 + 2} y={H - PB + 12} textAnchor="middle" fontSize="9" fill="#6b7280">
              {fmtM(month)}
            </text>
          </g>
        );
      })}
      {[['#10b981', 'Receita'], ['#ef4444', 'Despesa'], ['#3b82f6', 'Compra']].map(([color, label], i) => (
        <g key={label} transform={`translate(${PL + i * 90}, ${H - 8})`}>
          <rect width="8" height="8" fill={color} rx="1" />
          <text x="11" y="8" fontSize="9" fill="#6b7280">{label}</text>
        </g>
      ))}
    </svg>
  );
}

function LineChart({ records }: { records: FinancialRecord[] }) {
  const months = useMemo(() => {
    const map: Record<string, { income: number; expense: number; purchase: number }> = {};
    records.forEach((r) => {
      const month = r.date.substring(0, 7);
      if (!map[month]) map[month] = { income: 0, expense: 0, purchase: 0 };
      map[month][r.type] += r.amount;
    });
    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-8);
  }, [records]);

  if (months.length < 2) return <EmptyChart label="Dados insuficientes (mín. 2 meses)" />;

  const maxVal = Math.max(...months.flatMap(([, v]) => [v.income, v.expense, v.purchase]), 1);
  const W = 500, H = 220, PL = 50, PR = 10, PT = 10, PB = 40;
  const chartW = W - PL - PR;
  const chartH = H - PT - PB;

  const px = (i: number) => PL + (i / (months.length - 1)) * chartW;
  const py = (val: number) => PT + chartH - (val / maxVal) * chartH;
  const pts = (k: 'income' | 'expense' | 'purchase') =>
    months.map(([, v], i) => `${px(i)},${py(v[k])}`).join(' ');

  const fmtM = (m: string) => {
    const [y, mo] = m.split('-');
    return new Date(parseInt(y), parseInt(mo) - 1).toLocaleDateString('pt-BR', { month: 'short' });
  };

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full">
      {[0, 0.25, 0.5, 0.75, 1].map((t, i) => {
        const y = PT + chartH * t;
        const val = maxVal * (1 - t);
        return (
          <g key={i}>
            <line x1={PL} y1={y} x2={W - PR} y2={y} stroke="#f0f0f0" strokeWidth="1" />
            <text x={PL - 4} y={y + 4} textAnchor="end" fontSize="9" fill="#9ca3af">
              {val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val.toFixed(0)}
            </text>
          </g>
        );
      })}
      <polyline points={pts('income')} fill="none" stroke="#10b981" strokeWidth="2" strokeLinejoin="round" />
      <polyline points={pts('expense')} fill="none" stroke="#ef4444" strokeWidth="2" strokeLinejoin="round" />
      <polyline points={pts('purchase')} fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinejoin="round" />
      {months.map(([month, v], i) => (
        <g key={month}>
          <circle cx={px(i)} cy={py(v.income)} r="3" fill="#10b981" />
          <circle cx={px(i)} cy={py(v.expense)} r="3" fill="#ef4444" />
          <circle cx={px(i)} cy={py(v.purchase)} r="3" fill="#3b82f6" />
          <text x={px(i)} y={H - PB + 12} textAnchor="middle" fontSize="9" fill="#6b7280">
            {fmtM(month)}
          </text>
        </g>
      ))}
      {[['#10b981', 'Receita'], ['#ef4444', 'Despesa'], ['#3b82f6', 'Compra']].map(([color, label], i) => (
        <g key={label} transform={`translate(${PL + i * 90}, ${H - 8})`}>
          <rect width="8" height="8" fill={color} rx="1" />
          <text x="11" y="8" fontSize="9" fill="#6b7280">{label}</text>
        </g>
      ))}
    </svg>
  );
}

function PieChart({ records }: { records: FinancialRecord[] }) {
  const slices = useMemo(() => {
    const map: Record<string, number> = {};
    records
      .filter((r) => r.type === 'expense' || r.type === 'purchase')
      .forEach((r) => {
        const cat = r.category || 'Outros';
        map[cat] = (map[cat] || 0) + r.amount;
      });
    const total = Object.values(map).reduce((a, b) => a + b, 0);
    if (total === 0) return [];
    return Object.entries(map)
      .sort(([, a], [, b]) => b - a)
      .map(([cat, val], i) => ({
        cat,
        val,
        pct: val / total,
        color: CHART_COLORS[i % CHART_COLORS.length],
      }));
  }, [records]);

  if (slices.length === 0) return <EmptyChart label="Sem despesas/compras registradas" />;

  const W = 300, H = 230, R = 78, cx = 105, cy = 108;
  let startAngle = -Math.PI / 2;

  const arc = (r: number, sa: number, ea: number) => {
    const x1 = cx + r * Math.cos(sa);
    const y1 = cy + r * Math.sin(sa);
    const x2 = cx + r * Math.cos(ea);
    const y2 = cy + r * Math.sin(ea);
    const large = ea - sa > Math.PI ? 1 : 0;
    return `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`;
  };

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full">
      {slices.map((s) => {
        const angle = s.pct * 2 * Math.PI;
        const ea = startAngle + angle;
        const d = arc(R, startAngle, ea);
        startAngle = ea;
        return (
          <path key={s.cat} d={d} fill={s.color} stroke="white" strokeWidth="2">
            <title>{s.cat}: R$ {s.val.toFixed(2)} ({(s.pct * 100).toFixed(1)}%)</title>
          </path>
        );
      })}
      <circle cx={cx} cy={cy} r={R * 0.48} fill="white" />
      <text x={cx} y={cy - 6} textAnchor="middle" fontSize="10" fill="#6b7280">Despesas</text>
      <text x={cx} y={cy + 8} textAnchor="middle" fontSize="10" fill="#6b7280">por cat.</text>
      {slices.slice(0, 7).map((s, i) => (
        <g key={s.cat} transform={`translate(218, ${10 + i * 18})`}>
          <rect width="10" height="10" fill={s.color} rx="2" />
          <text x="14" y="9" fontSize="9" fill="#374151">
            {s.cat.length > 11 ? s.cat.slice(0, 11) + '…' : s.cat}
          </text>
        </g>
      ))}
    </svg>
  );
}

// --- KPI Card ---

function KpiCard({ label, value, color, icon }: { label: string; value: number; color: string; icon: string }) {
  const bg: Record<string, string> = {
    emerald: 'bg-emerald-50 text-emerald-600',
    red: 'bg-red-50 text-red-600',
    blue: 'bg-blue-50 text-blue-600',
    purple: 'bg-purple-50 text-purple-600',
  };
  const baseText: Record<string, string> = {
    emerald: 'text-emerald-700',
    red: 'text-red-700',
    blue: 'text-blue-700',
    purple: 'text-purple-700',
  };
  const textCls = color === 'blue' && value < 0 ? 'text-red-700' : (baseText[color] ?? 'text-gray-900');
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 ${bg[color]}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</p>
        <p className={`text-xl font-bold mt-0.5 ${textCls}`}>{formatCurrency(value)}</p>
      </div>
    </div>
  );
}

// --- Main Page ---

export default function FinancePage() {
  const [allRecords, setAllRecords] = useState<FinancialRecord[]>([]);
  const [summary, setSummary] = useState<FinancialSummary>({
    totalIncome: 0, totalExpense: 0, totalPurchase: 0, balance: 0, period: {},
  });
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState<FinancialRecord | null>(null);
  const [formData, setFormData] = useState<RecordFormData>(defaultForm());
  const [uploadingReceipt, setUploadingReceipt] = useState(false);
  const [activeTab, setActiveTab] = useState<'list' | 'charts'>('list');
  const [filterMonth, setFilterMonth] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const { showSuccess, showError } = useToast();

  const loadAll = useCallback(async () => {
    try {
      setLoading(true);
      const [recRes, sumRes] = await Promise.all([
        fetch('/api/finance'),
        fetch('/api/finance/summary'),
      ]);
      if (!recRes.ok || !sumRes.ok) throw new Error('Erro ao carregar dados');
      const [records, sum] = await Promise.all([recRes.json(), sumRes.json()]);
      setAllRecords(records as FinancialRecord[]);
      setSummary(sum as FinancialSummary);
    } catch {
      showError('Erro ao carregar registros financeiros');
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => { loadAll(); }, [loadAll]);

  const filteredRecords = useMemo(() => allRecords.filter((r) => {
    if (filterMonth && r.date.substring(0, 7) !== filterMonth) return false;
    if (filterType && r.type !== filterType) return false;
    if (filterCategory && r.category !== filterCategory) return false;
    if (filterStatus && r.status !== filterStatus) return false;
    return true;
  }), [allRecords, filterMonth, filterType, filterCategory, filterStatus]);

  const availableMonths = useMemo(() => {
    const months = new Set<string>(allRecords.map((r) => r.date.substring(0, 7)));
    return Array.from(months).sort().reverse();
  }, [allRecords]);

  const allCategories = useMemo(() => {
    const cats = new Set<string>(allRecords.map((r) => r.category).filter(Boolean) as string[]);
    return Array.from(cats).sort();
  }, [allRecords]);

  const pendingCount = useMemo(() => allRecords.filter((r) => r.status === 'pending').length, [allRecords]);
  const pendingTotal = useMemo(() =>
    allRecords.filter((r) => r.status === 'pending').reduce((s, r) => s + r.amount, 0),
    [allRecords]
  );

  const handleReceiptUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('file', file);
    fd.append('folder', 'receipts');
    setUploadingReceipt(true);
    try {
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      if (!res.ok) throw new Error('Upload falhou');
      const data = await res.json() as Record<string, unknown>;
      if (typeof data.url !== 'string') throw new Error('URL inválida');
      setFormData((prev) => ({ ...prev, receipt_url: data.url as string }));
      showSuccess('Comprovante enviado!');
    } catch {
      showError('Erro ao fazer upload do comprovante');
    } finally {
      setUploadingReceipt(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.description.trim()) { showError('Título é obrigatório'); return; }
    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) { showError('Valor deve ser maior que zero'); return; }
    if (!formData.date) { showError('Data é obrigatória'); return; }
    const payload = {
      type: formData.type,
      description: formData.description,
      amount,
      date: formData.date,
      category: formData.category || null,
      payment_method: formData.payment_method || null,
      status: formData.status,
      receipt_url: formData.receipt_url || null,
    };
    try {
      const url = editingRecord ? `/api/finance?id=${editingRecord.id}` : '/api/finance';
      const method = editingRecord ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!res.ok) throw new Error(`Erro HTTP: ${res.status}`);
      await loadAll();
      setShowForm(false);
      setEditingRecord(null);
      setFormData(defaultForm());
      showSuccess(editingRecord ? 'Registro atualizado!' : 'Registro criado!');
    } catch {
      showError('Erro ao salvar registro financeiro');
    }
  };

  const handleEdit = (record: FinancialRecord) => {
    setEditingRecord(record);
    setFormData({
      type: record.type,
      description: record.description,
      amount: record.amount.toString(),
      date: record.date,
      category: record.category || '',
      payment_method: record.payment_method || '',
      status: record.status,
      receipt_url: record.receipt_url || '',
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir este registro?')) return;
    try {
      const res = await fetch(`/api/finance?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(`Erro HTTP: ${res.status}`);
      await loadAll();
      showSuccess('Registro excluído!');
    } catch {
      showError('Erro ao excluir registro financeiro');
    }
  };

  const handleExportCSV = () => {
    const headers = ['Data', 'Tipo', 'Título', 'Categoria', 'Pagamento', 'Status', 'Valor'];
    const rows = filteredRecords.map((r) => [
      formatDate(r.date),
      TYPE_LABELS[r.type],
      `"${r.description.replace(/"/g, '""')}"`,
      r.category || '',
      r.payment_method || '',
      STATUS_LABELS[r.status],
      r.amount.toFixed(2),
    ]);
    rows.push([]);
    rows.push(['', '', 'Total Receitas', '', '', '', summary.totalIncome.toFixed(2)]);
    rows.push(['', '', 'Total Despesas', '', '', '', summary.totalExpense.toFixed(2)]);
    rows.push(['', '', 'Total Compras', '', '', '', summary.totalPurchase.toFixed(2)]);
    rows.push(['', '', 'Saldo', '', '', '', summary.balance.toFixed(2)]);
    const csv = '\uFEFF' + [headers, ...rows].map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `financeiro${filterMonth ? `-${filterMonth}` : ''}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
    showSuccess('CSV exportado!');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-pink-500 mx-auto mb-3" />
          <p className="text-gray-500">Carregando dados financeiros…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Painel Financeiro</h2>
          <p className="text-sm text-gray-500 mt-0.5">Controle completo de receitas, despesas e compras</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => { setShowForm(!showForm); setEditingRecord(null); setFormData(defaultForm()); }}
            className="inline-flex items-center gap-1.5 bg-pink-600 hover:bg-pink-700 text-white font-semibold py-2 px-4 rounded-lg text-sm transition-colors"
          >
            <span className="text-base leading-none">＋</span> Novo Registro
          </button>
          <button
            onClick={handleExportCSV}
            disabled={filteredRecords.length === 0}
            className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2 px-4 rounded-lg text-sm transition-colors disabled:opacity-50"
          >
            📥 Excel / CSV
          </button>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 bg-gray-700 hover:bg-gray-800 text-white font-semibold py-2 px-4 rounded-lg text-sm transition-colors"
          >
            🖨️ PDF
          </button>
        </div>
      </div>

      {/* Pending alert */}
      {pendingCount > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 flex items-start gap-3">
          <span className="text-amber-500 text-lg mt-0.5">⚠️</span>
          <div>
            <p className="text-sm font-semibold text-amber-800">
              {pendingCount} pagamento{pendingCount > 1 ? 's' : ''} pendente{pendingCount > 1 ? 's' : ''}
            </p>
            <p className="text-xs text-amber-600">Total em aberto: {formatCurrency(pendingTotal)}</p>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Receita Total" value={summary.totalIncome} color="emerald" icon="📈" />
        <KpiCard label="Despesas" value={summary.totalExpense} color="red" icon="📉" />
        <KpiCard label="Saldo Líquido" value={summary.balance} color={summary.balance >= 0 ? 'blue' : 'red'} icon="💰" />
        <KpiCard label="Total Compras" value={summary.totalPurchase} color="purple" icon="🛒" />
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-5">
            {editingRecord ? '✏️ Editar Registro' : '＋ Novo Registro'}
          </h3>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">Tipo *</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as RecordFormData['type'], category: '' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
                >
                  <option value="income">Receita</option>
                  <option value="expense">Despesa</option>
                  <option value="purchase">Compra</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">Título *</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Ex: Aluguel Kit Princesa, Manutenção Trailer…"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">Valor (R$) *</label>
                <input
                  type="number" step="0.01" min="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="0,00"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">Data *</label>
                <input
                  type="date" value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">Categoria</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
                >
                  <option value="">Selecione…</option>
                  {CATEGORIES[formData.type].map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">Forma de Pagamento</label>
                <select
                  value={formData.payment_method}
                  onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
                >
                  <option value="">Selecione…</option>
                  {PAYMENT_METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">Status *</label>
                <div className="flex gap-4 mt-2">
                  {(['paid', 'pending'] as const).map((s) => (
                    <label key={s} className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="status" value={s} checked={formData.status === s}
                        onChange={() => setFormData({ ...formData, status: s })} className="accent-pink-500" />
                      <span className="text-sm text-gray-700">{STATUS_LABELS[s]}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">Comprovante</label>
                <div className="flex gap-2 items-center flex-wrap">
                  <label className="cursor-pointer inline-flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium px-3 py-2 rounded-lg transition-colors">
                    <input type="file" accept="image/*,application/pdf" onChange={handleReceiptUpload} className="hidden" />
                    {uploadingReceipt ? '⏳ Enviando…' : '📎 Enviar arquivo'}
                  </label>
                  {formData.receipt_url && (
                    <a href={formData.receipt_url} target="_blank" rel="noreferrer"
                      className="text-blue-600 hover:underline text-sm">
                      📄 Ver comprovante
                    </a>
                  )}
                </div>
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <button type="submit"
                className="bg-pink-600 hover:bg-pink-700 text-white font-semibold py-2 px-5 rounded-lg text-sm transition-colors">
                {editingRecord ? 'Atualizar' : 'Salvar'}
              </button>
              <button type="button" onClick={() => { setShowForm(false); setEditingRecord(null); }}
                className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-2 px-5 rounded-lg text-sm transition-colors">
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Filtros</h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Período</label>
            <select value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)}
              className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-pink-400">
              <option value="">Todos os períodos</option>
              {availableMonths.map((m) => <option key={m} value={m}>{formatMonthLabel(m)}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Tipo</label>
            <select value={filterType} onChange={(e) => setFilterType(e.target.value)}
              className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-pink-400">
              <option value="">Todos</option>
              <option value="income">Receita</option>
              <option value="expense">Despesa</option>
              <option value="purchase">Compra</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Categoria</label>
            <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-pink-400">
              <option value="">Todas</option>
              {allCategories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Status</label>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-pink-400">
              <option value="">Todos</option>
              <option value="paid">Pago</option>
              <option value="pending">Pendente</option>
            </select>
          </div>
        </div>
        {(filterMonth || filterType || filterCategory || filterStatus) && (
          <button
            onClick={() => { setFilterMonth(''); setFilterType(''); setFilterCategory(''); setFilterStatus(''); }}
            className="mt-2 text-xs text-pink-600 hover:text-pink-800 font-medium">
            ✕ Limpar filtros
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1">
        {(['list', 'charts'] as const).map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              activeTab === tab ? 'bg-pink-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}>
            {tab === 'list' ? '📋 Registros' : '📊 Gráficos'}
          </button>
        ))}
        <span className="ml-auto text-xs text-gray-400">
          {filteredRecords.length} registro{filteredRecords.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Charts */}
      {activeTab === 'charts' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Comparação Mensal</h4>
            <div className="h-52"><BarChart records={allRecords} /></div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Despesas por Categoria</h4>
            <div className="h-52"><PieChart records={allRecords} /></div>
          </div>
          <div className="lg:col-span-3 bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Evolução Financeira</h4>
            <div className="h-52"><LineChart records={allRecords} /></div>
          </div>
        </div>
      )}

      {/* Records Table */}
      {activeTab === 'list' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {filteredRecords.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="text-4xl mb-3">📭</p>
              <p className="text-gray-500">Nenhum registro encontrado para os filtros selecionados</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-left">
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Tipo</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Título</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Categoria</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Data</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Pagamento</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide text-right">Valor</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredRecords.map((r) => (
                    <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${TYPE_COLORS[r.type]}`}>
                          {TYPE_LABELS[r.type]}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-900 max-w-xs truncate">
                        {r.description}
                        {r.receipt_url && (
                          <a href={r.receipt_url} target="_blank" rel="noreferrer"
                            className="ml-2 text-blue-500 hover:text-blue-700 text-xs" title="Ver comprovante">
                            📎
                          </a>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{r.category || '—'}</td>
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{formatDate(r.date)}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{r.payment_method || '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                          r.status === 'paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                          {STATUS_LABELS[r.status]}
                        </span>
                      </td>
                      <td className={`px-4 py-3 font-semibold text-right whitespace-nowrap ${
                        r.type === 'income' ? 'text-emerald-600' : 'text-red-600'
                      }`}>
                        {r.type === 'income' ? '+' : '-'} {formatCurrency(r.amount)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-1">
                          <button onClick={() => handleEdit(r)}
                            className="text-xs px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 hover:bg-blue-100 font-medium transition-colors">
                            Editar
                          </button>
                          <button onClick={() => handleDelete(r.id)}
                            className="text-xs px-2.5 py-1 rounded-md bg-red-50 text-red-700 hover:bg-red-100 font-medium transition-colors">
                            Excluir
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-50 border-t-2 border-gray-300 font-semibold">
                    <td colSpan={6} className="px-4 py-3 text-sm text-gray-600">
                      Total ({filteredRecords.length} registros)
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-gray-900">
                      {formatCurrency(filteredRecords.reduce((s, r) =>
                        r.type === 'income' ? s + r.amount :
                        (r.type === 'expense' || r.type === 'purchase') ? s - r.amount : s,
                        0
                      ))}
                    </td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
