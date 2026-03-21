'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useToast } from '@/hooks/useToast';

interface Arte {
  id: number;
  title: string;
  image_url?: string;
  status: string;
}

interface Publicacao {
  id: number;
  arte_id?: number;
  arte_title?: string;
  arte_image_url?: string;
  platform: 'instagram' | 'whatsapp' | 'outros';
  publish_date?: string;
  status: 'agendado' | 'publicado';
  notes?: string;
  created_at: number;
}

const PLATFORM_LABELS: Record<string, string> = {
  instagram: '📸 Instagram',
  whatsapp: '💬 WhatsApp',
  outros: '🌐 Outros',
};

const STATUS_COLORS: Record<string, string> = {
  agendado: 'bg-yellow-100 text-yellow-700',
  publicado: 'bg-green-100 text-green-700',
};

export default function PublicacoesPage() {
  const { showSuccess, showError } = useToast();
  const [publicacoes, setPublicacoes] = useState<Publicacao[]>([]);
  const [artes, setArtes] = useState<Arte[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingPub, setEditingPub] = useState<Publicacao | null>(null);
  const [filterStatus, setFilterStatus] = useState('');
  const [formData, setFormData] = useState({
    arte_id: '',
    platform: 'instagram',
    publish_date: '',
    status: 'agendado',
    notes: '',
  });

  useEffect(() => {
    loadPublicacoes();
    loadArtes();
  }, [filterStatus]);

  async function loadPublicacoes() {
    setLoading(true);
    try {
      const params = filterStatus ? `?status=${filterStatus}` : '';
      const res = await fetch(`/api/publicacoes${params}`);
      if (res.ok) {
        const data = await res.json() as Publicacao[];
        setPublicacoes(data);
      }
    } catch {
      showError('Erro ao carregar publicações');
    } finally {
      setLoading(false);
    }
  }

  async function loadArtes() {
    try {
      const res = await fetch('/api/artes');
      if (res.ok) {
        const data = await res.json() as Arte[];
        setArtes(data);
      }
    } catch {
      // ignore
    }
  }

  function openNew() {
    setEditingPub(null);
    setFormData({ arte_id: '', platform: 'instagram', publish_date: '', status: 'agendado', notes: '' });
    setShowForm(true);
  }

  function openEdit(pub: Publicacao) {
    setEditingPub(pub);
    setFormData({
      arte_id: pub.arte_id ? String(pub.arte_id) : '',
      platform: pub.platform,
      publish_date: pub.publish_date || '',
      status: pub.status,
      notes: pub.notes || '',
    });
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const method = editingPub ? 'PUT' : 'POST';
      const url = editingPub ? `/api/publicacoes?id=${editingPub.id}` : '/api/publicacoes';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          arte_id: formData.arte_id ? Number(formData.arte_id) : null,
          id: editingPub?.id,
        }),
      });
      if (!res.ok) throw new Error();
      showSuccess(editingPub ? 'Publicação atualizada!' : 'Publicação criada!');
      setShowForm(false);
      setEditingPub(null);
      loadPublicacoes();
    } catch {
      showError('Erro ao salvar publicação');
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Excluir esta publicação?')) return;
    try {
      const res = await fetch(`/api/publicacoes?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      showSuccess('Publicação excluída!');
      loadPublicacoes();
    } catch {
      showError('Erro ao excluir publicação');
    }
  }

  async function markAsPublished(pub: Publicacao) {
    try {
      const res = await fetch(`/api/publicacoes?id=${pub.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          arte_id: pub.arte_id,
          platform: pub.platform,
          publish_date: pub.publish_date || new Date().toISOString().split('T')[0],
          status: 'publicado',
          notes: pub.notes,
        }),
      });
      if (!res.ok) throw new Error();
      showSuccess('Marcado como publicado!');
      loadPublicacoes();
    } catch {
      showError('Erro ao atualizar publicação');
    }
  }

  // Group by date for display
  const today = new Date().toISOString().split('T')[0];
  const scheduled = publicacoes.filter(p => p.status === 'agendado');
  const published = publicacoes.filter(p => p.status === 'publicado');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-brand-gray">📢 Controle de Publicações</h2>
          <p className="text-gray-500 text-sm mt-1">
            Gerencie e acompanhe publicações nas redes sociais
          </p>
        </div>
        <button
          onClick={openNew}
          className="bg-brand-blue hover:bg-brand-blue-dark text-white font-bold py-2 px-5 rounded-full transition-colors whitespace-nowrap"
        >
          + Nova Publicação
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center shadow-sm">
          <p className="text-2xl font-bold text-yellow-600">{scheduled.length}</p>
          <p className="text-sm text-gray-500 mt-1">Agendadas</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center shadow-sm">
          <p className="text-2xl font-bold text-green-600">{published.length}</p>
          <p className="text-sm text-gray-500 mt-1">Publicadas</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center shadow-sm col-span-2 sm:col-span-1">
          <p className="text-2xl font-bold text-brand-blue">
            {scheduled.filter(p => p.publish_date === today).length}
          </p>
          <p className="text-sm text-gray-500 mt-1">Para hoje</p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        {[
          { value: '', label: 'Todas' },
          { value: 'agendado', label: 'Agendadas' },
          { value: 'publicado', label: 'Publicadas' },
        ].map(f => (
          <button
            key={f.value}
            onClick={() => setFilterStatus(f.value)}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${
              filterStatus === f.value
                ? 'bg-brand-blue text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-brand-gray mb-4">
            {editingPub ? 'Editar Publicação' : 'Nova Publicação'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Arte vinculada
                </label>
                <select
                  value={formData.arte_id}
                  onChange={e => setFormData({ ...formData, arte_id: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
                >
                  <option value="">— Sem arte vinculada —</option>
                  {artes.map(a => (
                    <option key={a.id} value={a.id}>{a.title}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Plataforma *
                </label>
                <select
                  value={formData.platform}
                  onChange={e => setFormData({ ...formData, platform: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
                  required
                >
                  <option value="instagram">📸 Instagram</option>
                  <option value="whatsapp">💬 WhatsApp</option>
                  <option value="outros">🌐 Outros</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Data de publicação
                </label>
                <input
                  type="date"
                  value={formData.publish_date}
                  onChange={e => setFormData({ ...formData, publish_date: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Status</label>
                <select
                  value={formData.status}
                  onChange={e => setFormData({ ...formData, status: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
                >
                  <option value="agendado">Agendado</option>
                  <option value="publicado">Publicado</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Observações
              </label>
              <textarea
                value={formData.notes}
                onChange={e => setFormData({ ...formData, notes: e.target.value })}
                rows={2}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue resize-none"
                placeholder="Observações sobre esta publicação..."
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                className="bg-brand-blue hover:bg-brand-blue-dark text-white font-bold py-2 px-6 rounded-full transition-colors"
              >
                Salvar
              </button>
              <button
                type="button"
                onClick={() => { setShowForm(false); setEditingPub(null); }}
                className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-2 px-6 rounded-full transition-colors"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Publication list */}
      {loading ? (
        <div className="text-center py-12 text-gray-400">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-brand-blue" />
        </div>
      ) : publicacoes.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center text-gray-400">
          <p className="text-4xl mb-3">📢</p>
          <p className="font-semibold">Nenhuma publicação encontrada</p>
          <p className="text-sm mt-1">Clique em &ldquo;+ Nova Publicação&rdquo; para agendar</p>
        </div>
      ) : (
        <div className="space-y-3">
          {publicacoes.map(pub => (
            <div key={pub.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="flex items-start gap-4 p-4">
                {/* Arte thumbnail */}
                {pub.arte_image_url ? (
                  <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                    <Image src={pub.arte_image_url} alt={pub.arte_title || ''} fill className="object-cover" />
                  </div>
                ) : (
                  <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-brand-purple/20 to-brand-blue/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-2xl">🖼️</span>
                  </div>
                )}

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <div>
                      <span className="font-bold text-brand-gray text-sm">
                        {PLATFORM_LABELS[pub.platform]}
                      </span>
                      {pub.arte_title && (
                        <span className="text-xs text-gray-400 ml-2">→ {pub.arte_title}</span>
                      )}
                    </div>
                    <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${STATUS_COLORS[pub.status]}`}>
                      {pub.status === 'agendado' ? '📅 Agendado' : '✅ Publicado'}
                    </span>
                  </div>
                  {pub.publish_date && (
                    <p className="text-xs text-gray-500 mt-1">
                      {pub.publish_date === today
                        ? '📌 Hoje'
                        : new Date(pub.publish_date + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </p>
                  )}
                  {pub.notes && (
                    <p className="text-xs text-gray-400 mt-1 line-clamp-1">{pub.notes}</p>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 px-4 pb-4">
                {pub.status === 'agendado' && (
                  <button
                    onClick={() => markAsPublished(pub)}
                    className="flex-1 bg-green-500 hover:bg-green-600 text-white text-xs font-bold py-1.5 rounded-lg transition-colors"
                  >
                    ✅ Marcar como publicado
                  </button>
                )}
                <button
                  onClick={() => openEdit(pub)}
                  className="bg-brand-blue hover:bg-brand-blue-dark text-white text-xs font-bold py-1.5 px-3 rounded-lg transition-colors"
                >
                  ✏️
                </button>
                <button
                  onClick={() => handleDelete(pub.id)}
                  className="bg-red-100 hover:bg-red-200 text-red-600 text-xs font-bold py-1.5 px-3 rounded-lg transition-colors"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
