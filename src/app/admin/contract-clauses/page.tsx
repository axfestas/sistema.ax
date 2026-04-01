'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ToastProvider';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ContractClause {
  id: number;
  order_num: number;
  title: string;
  content: string;
  is_active: number;
  created_at: string;
  updated_at: string;
}

interface LocadorData {
  locador_name: string;
  locador_cpf: string;
  locador_address: string;
}

const EMPTY_FORM = {
  order_num: 1,
  title: '',
  content: '',
  is_active: 1,
};

const DEFAULT_LOCADOR: LocadorData = {
  locador_name: 'ALEX DOS SANTOS FRAGA',
  locador_cpf: '142.612.667-09',
  locador_address: 'Rua Jacintha de Paulo Ferreira, nº 12, Bairro André Carloni, Serra/ES, CEP: 29161-820',
};

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ContractClausesPage() {
  const router = useRouter();
  const { showSuccess, showError } = useToast();

  const [clauses, setClauses] = useState<ContractClause[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Which clause is being edited (null = none / 0 = new)
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });

  // Locador data
  const [locador, setLocador] = useState<LocadorData>({ ...DEFAULT_LOCADOR });
  const [savingLocador, setSavingLocador] = useState(false);
  const [showLocadorEditor, setShowLocadorEditor] = useState(false);

  // ── Auth check ─────────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/auth/user');
        if (!res.ok) throw new Error();
        const data = await res.json() as { authenticated: boolean };
        if (!data.authenticated) router.push('/login');
      } catch {
        router.push('/login');
      }
    })();
  }, [router]);

  // ── Load clauses ───────────────────────────────────────────────────────────
  const loadClauses = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/contract-clauses?all=true');
      if (res.ok) {
        setClauses(await res.json() as ContractClause[]);
      } else {
        showError('Erro ao carregar cláusulas. Verifique se as migrações foram aplicadas.');
      }
    } catch {
      showError('Erro ao carregar cláusulas.');
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Load locador settings ──────────────────────────────────────────────────
  const loadLocador = useCallback(async () => {
    try {
      const res = await fetch('/api/settings');
      if (res.ok) {
        const data = await res.json() as Partial<LocadorData>;
        setLocador({
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
    loadClauses();
    loadLocador();
  }, [loadClauses, loadLocador]);

  // ── Save locador data ──────────────────────────────────────────────────────
  const handleSaveLocador = async () => {
    setSavingLocador(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(locador),
      });
      if (res.ok) {
        showSuccess('Dados do locador atualizados com sucesso!');
        setShowLocadorEditor(false);
      } else {
        showError('Erro ao salvar dados do locador.');
      }
    } catch {
      showError('Erro de conexão.');
    } finally {
      setSavingLocador(false);
    }
  };

  // ── Open form for new clause ───────────────────────────────────────────────
  const openNew = () => {
    const nextOrder = clauses.length > 0
      ? Math.max(...clauses.map(c => c.order_num)) + 1
      : 1;
    setForm({ ...EMPTY_FORM, order_num: nextOrder });
    setEditingId(0);
  };

  // ── Open form for existing clause ─────────────────────────────────────────
  const openEdit = (clause: ContractClause) => {
    setForm({
      order_num: clause.order_num,
      title: clause.title,
      content: clause.content,
      is_active: clause.is_active,
    });
    setEditingId(clause.id);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm({ ...EMPTY_FORM });
  };

  // ── Save (create or update) ────────────────────────────────────────────────
  const handleSave = async () => {
    if (!form.title.trim() || !form.content.trim()) {
      showError('Título e conteúdo são obrigatórios.');
      return;
    }
    setSaving(true);
    try {
      const isNew = editingId === 0;
      const url = isNew ? '/api/contract-clauses' : `/api/contract-clauses?id=${editingId}`;
      const method = isNew ? 'POST' : 'PUT';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        showSuccess(isNew ? 'Cláusula criada com sucesso!' : 'Cláusula atualizada com sucesso!');
        cancelEdit();
        await loadClauses();
      } else {
        const err = await res.json() as { error?: string };
        showError(err.error ?? 'Erro ao salvar cláusula.');
      }
    } catch {
      showError('Erro de conexão.');
    } finally {
      setSaving(false);
    }
  };

  // ── Toggle active ──────────────────────────────────────────────────────────
  const handleToggleActive = async (clause: ContractClause) => {
    try {
      const res = await fetch(`/api/contract-clauses?id=${clause.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_num: clause.order_num,
          title: clause.title,
          content: clause.content,
          is_active: clause.is_active === 1 ? 0 : 1,
        }),
      });
      if (res.ok) {
        showSuccess(clause.is_active === 1 ? 'Cláusula desativada.' : 'Cláusula ativada.');
        await loadClauses();
      } else {
        showError('Erro ao atualizar cláusula.');
      }
    } catch {
      showError('Erro de conexão.');
    }
  };

  // ── Delete ─────────────────────────────────────────────────────────────────
  const handleDelete = async (id: number) => {
    if (!confirm('Excluir esta cláusula? Esta ação não pode ser desfeita.')) return;
    try {
      const res = await fetch(`/api/contract-clauses?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        showSuccess('Cláusula excluída com sucesso.');
        if (editingId === id) cancelEdit();
        await loadClauses();
      } else {
        showError('Erro ao excluir cláusula.');
      }
    } catch {
      showError('Erro de conexão.');
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dados do Contrato</h1>
          <p className="text-gray-500 text-sm mt-1">
            Gerencie os dados do locador e as cláusulas usadas nos contratos de locação
          </p>
        </div>
        {editingId === null && (
          <button
            onClick={openNew}
            className="flex items-center gap-2 px-5 py-2.5 bg-brand-yellow hover:bg-yellow-400 text-brand-gray rounded-xl shadow transition"
          >
            <span className="text-lg">+</span> Nova Cláusula
          </button>
        )}
      </div>

      {/* Locador Data Section */}
      <div className="bg-white rounded-2xl border shadow-sm mb-6">
        <div className="p-5">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h2 className="font-bold text-gray-800 text-base">🏢 Dados do Locador</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Informações do locador exibidas no contrato impresso
              </p>
            </div>
            <button
              onClick={() => setShowLocadorEditor(!showLocadorEditor)}
              className="text-sm text-brand-yellow hover:text-yellow-600 font-medium"
            >
              {showLocadorEditor ? '▲ Ocultar' : '✏️ Editar'}
            </button>
          </div>

          {!showLocadorEditor && (
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
              <div>
                <span className="text-xs font-semibold text-gray-500 uppercase">Nome</span>
                <p className="text-gray-800 mt-0.5">{locador.locador_name}</p>
              </div>
              <div>
                <span className="text-xs font-semibold text-gray-500 uppercase">CPF/CNPJ</span>
                <p className="text-gray-800 mt-0.5">{locador.locador_cpf}</p>
              </div>
              <div>
                <span className="text-xs font-semibold text-gray-500 uppercase">Endereço</span>
                <p className="text-gray-800 mt-0.5">{locador.locador_address}</p>
              </div>
            </div>
          )}

          {showLocadorEditor && (
            <div className="mt-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    Nome do Locador <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={locador.locador_name}
                    onChange={e => setLocador(l => ({ ...l, locador_name: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-yellow"
                    placeholder="ALEX DOS SANTOS FRAGA"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    CPF / CNPJ <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={locador.locador_cpf}
                    onChange={e => setLocador(l => ({ ...l, locador_cpf: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-yellow"
                    placeholder="000.000.000-00"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Endereço Completo <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={locador.locador_address}
                  onChange={e => setLocador(l => ({ ...l, locador_address: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-yellow"
                  placeholder="Rua Exemplo, nº 00, Bairro, Cidade/UF, CEP: 00000-000"
                />
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowLocadorEditor(false)}
                  className="px-5 py-2 rounded-xl border border-gray-300 text-gray-600 text-sm hover:bg-gray-50 transition"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveLocador}
                  disabled={savingLocador}
                  className="px-5 py-2 rounded-xl bg-brand-yellow hover:bg-yellow-400 disabled:bg-gray-300 text-brand-gray text-sm transition"
                >
                  {savingLocador ? 'Salvando…' : 'Salvar Dados do Locador'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Inline form (new or edit) */}
      {editingId !== null && (
        <div className="bg-white rounded-2xl border-2 border-brand-yellow shadow-sm p-6 mb-6">
          <h2 className="text-lg font-bold text-brand-gray mb-4">
            {editingId === 0 ? '➕ Nova Cláusula' : '✏️ Editar Cláusula'}
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Ordem</label>
              <input
                type="number"
                min={1}
                value={form.order_num}
                onChange={e => setForm(f => ({ ...f, order_num: Number(e.target.value) }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-yellow"
              />
            </div>
            <div className="sm:col-span-3">
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                Título <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Ex: 01. Do Objeto da Locação"
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-yellow"
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              Conteúdo <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={8}
              placeholder="Texto da cláusula. Use Enter para separar parágrafos ou sub-itens."
              value={form.content}
              onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-yellow resize-y font-mono"
            />
          </div>

          <div className="flex items-center gap-3 mb-4">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={form.is_active === 1}
                onChange={e => setForm(f => ({ ...f, is_active: e.target.checked ? 1 : 0 }))}
                className="w-4 h-4 accent-brand-yellow"
              />
              <span className="text-sm font-medium text-gray-700">Cláusula ativa</span>
            </label>
          </div>

          <div className="flex gap-3 justify-end">
            <button
              onClick={cancelEdit}
              className="px-5 py-2 rounded-xl border border-gray-300 text-gray-600 text-sm hover:bg-gray-50 transition"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-5 py-2 rounded-xl bg-brand-yellow hover:bg-yellow-400 disabled:bg-gray-300 text-brand-gray text-sm transition"
            >
              {saving ? 'Salvando…' : editingId === 0 ? 'Criar Cláusula' : 'Salvar Alterações'}
            </button>
          </div>
        </div>
      )}

      {/* Clauses section header */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-bold text-gray-700">📋 Cláusulas do Contrato</h2>
      </div>

      {/* Clause list */}
      {loading ? (
        <div className="flex items-center justify-center min-h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-yellow" />
        </div>
      ) : clauses.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-5xl mb-4">📋</p>
          <p className="font-medium">Nenhuma cláusula cadastrada.</p>
          <p className="text-sm mt-1">Clique em &quot;Nova Cláusula&quot; para começar, ou execute as migrações nas <a href="/admin/settings" className="text-brand-yellow underline">Configurações</a> para carregar as cláusulas padrão.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {clauses.map(clause => (
            <div
              key={clause.id}
              className={`bg-white rounded-2xl border shadow-sm transition ${
                clause.is_active ? 'border-gray-100' : 'border-gray-200 opacity-60'
              }`}
            >
              <div className="p-5">
                {/* Clause header */}
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-xs font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                      #{clause.order_num}
                    </span>
                    <span className="font-bold text-gray-900 text-sm">{clause.title}</span>
                    {clause.is_active ? (
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                        Ativa
                      </span>
                    ) : (
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                        Inativa
                      </span>
                    )}
                  </div>

                  {/* Action buttons */}
                  <div className="flex gap-2 flex-shrink-0 flex-wrap">
                    <button
                      onClick={() => openEdit(clause)}
                      disabled={editingId !== null}
                      className="px-3 py-1.5 bg-brand-yellow hover:bg-yellow-400 disabled:bg-gray-200 disabled:text-gray-400 text-brand-gray text-xs rounded-lg transition"
                    >
                      ✏️ Editar
                    </button>
                    <button
                      onClick={() => handleToggleActive(clause)}
                      disabled={editingId !== null}
                      className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 text-gray-700 text-xs rounded-lg transition"
                    >
                      {clause.is_active ? '🔕 Desativar' : '✅ Ativar'}
                    </button>
                    <button
                      onClick={() => handleDelete(clause.id)}
                      disabled={editingId !== null}
                      className="px-3 py-1.5 bg-red-100 hover:bg-red-200 disabled:opacity-50 text-red-700 text-xs rounded-lg transition"
                    >
                      🗑 Excluir
                    </button>
                  </div>
                </div>

                {/* Clause content preview */}
                <div className="mt-3 text-gray-600 text-xs leading-relaxed whitespace-pre-line line-clamp-4 border-t border-gray-50 pt-3">
                  {clause.content}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Info footer */}
      {clauses.length > 0 && (
        <p className="text-xs text-gray-400 text-center mt-6">
          {clauses.filter(c => c.is_active).length} cláusula(s) ativa(s) · {clauses.length} no total
          <span className="ml-2">— Cláusulas ativas são usadas na impressão dos contratos.</span>
        </p>
      )}
    </div>
  );
}
