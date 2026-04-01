'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import ImageUpload from '@/components/ImageUpload';
import { useToast } from '@/hooks/useToast';

interface Arte {
  id: number;
  title: string;
  caption?: string;
  image_url?: string;
  suggested_date?: string;
  status: 'rascunho' | 'pronta' | 'publicada';
  created_at: number;
}

const STATUS_LABELS: Record<string, string> = {
  rascunho: 'Rascunho',
  pronta: 'Pronta',
  publicada: 'Publicada',
};

const STATUS_COLORS: Record<string, string> = {
  rascunho: 'bg-gray-100 text-gray-600',
  pronta: 'bg-yellow-100 text-yellow-700',
  publicada: 'bg-green-100 text-green-700',
};

export default function ArtesPage() {
  const { showSuccess, showError } = useToast();
  const [artes, setArtes] = useState<Arte[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingArte, setEditingArte] = useState<Arte | null>(null);
  const [filterStatus, setFilterStatus] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    caption: '',
    image_url: '',
    suggested_date: '',
    status: 'rascunho',
  });

  useEffect(() => {
    loadArtes();
  }, [filterStatus]);

  async function loadArtes() {
    setLoading(true);
    try {
      const params = filterStatus ? `?status=${filterStatus}` : '';
      const res = await fetch(`/api/artes${params}`);
      if (res.ok) {
        const data = await res.json() as Arte[];
        setArtes(data);
      }
    } catch {
      showError('Erro ao carregar artes');
    } finally {
      setLoading(false);
    }
  }

  const emptyForm = { title: '', caption: '', image_url: '', suggested_date: '', status: 'rascunho' };

  function openNew() {
    setEditingArte(null);
    setFormData(emptyForm);
    setShowForm(true);
  }

  function openEdit(arte: Arte) {
    setEditingArte(arte);
    setFormData({
      title: arte.title,
      caption: arte.caption || '',
      image_url: arte.image_url || '',
      suggested_date: arte.suggested_date || '',
      status: arte.status,
    });
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const method = editingArte ? 'PUT' : 'POST';
      const url = editingArte ? `/api/artes?id=${editingArte.id}` : '/api/artes';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          id: editingArte?.id,
        }),
      });
      if (!res.ok) throw new Error();
      showSuccess(editingArte ? 'Arte atualizada!' : 'Arte criada!');
      setShowForm(false);
      setEditingArte(null);
      loadArtes();
    } catch {
      showError('Erro ao salvar arte');
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Excluir esta arte?')) return;
    try {
      const res = await fetch(`/api/artes?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      showSuccess('Arte excluída!');
      loadArtes();
    } catch {
      showError('Erro ao excluir arte');
    }
  }

  async function setStatus(arte: Arte, status: Arte['status']) {
    try {
      const res = await fetch(`/api/artes?id=${arte.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...arte, status }),
      });
      if (!res.ok) throw new Error();
      showSuccess(`Status atualizado para "${STATUS_LABELS[status]}"`);
      loadArtes();
    } catch {
      showError('Erro ao atualizar status');
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-brand-gray">✏️ Artes Criadas</h2>
          <p className="text-gray-500 text-sm mt-1">
            Gerencie o conteúdo de marketing para publicação nas redes sociais
          </p>
        </div>
        <button
          onClick={openNew}
          className="bg-brand-blue hover:bg-brand-blue-dark text-white py-2 px-5 rounded-full transition-colors whitespace-nowrap"
        >
          + Nova Arte
        </button>
      </div>

      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        {[
          { value: '', label: 'Todas' },
          { value: 'rascunho', label: 'Rascunho' },
          { value: 'pronta', label: 'Pronta' },
          { value: 'publicada', label: 'Publicada' },
        ].map(f => (
          <button
            key={f.value}
            onClick={() => setFilterStatus(f.value)}
            className={`px-4 py-1.5 rounded-full text-sm transition-colors ${
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
            {editingArte ? 'Editar Arte' : 'Nova Arte'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Título *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
                  placeholder="Ex: Promoção de Páscoa"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Data sugerida de postagem
                </label>
                <input
                  type="date"
                  value={formData.suggested_date}
                  onChange={e => setFormData({ ...formData, suggested_date: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Legenda / Texto para publicação
              </label>
              <textarea
                value={formData.caption}
                onChange={e => setFormData({ ...formData, caption: e.target.value })}
                rows={4}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue resize-none"
                placeholder="Legenda completa para compartilhar junto com a arte..."
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Status</label>
              <select
                value={formData.status}
                onChange={e => setFormData({ ...formData, status: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
              >
                <option value="rascunho">Rascunho</option>
                <option value="pronta">Pronta</option>
                <option value="publicada">Publicada</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Imagem</label>
              <ImageUpload
                currentImage={formData.image_url}
                onUpload={url => setFormData({ ...formData, image_url: url })}
                folder="artes"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                className="bg-brand-blue hover:bg-brand-blue-dark text-white py-2 px-6 rounded-full transition-colors"
              >
                Salvar
              </button>
              <button
                type="button"
                onClick={() => { setShowForm(false); setEditingArte(null); }}
                className="bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 px-6 rounded-full transition-colors"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Cards */}
      {loading ? (
        <div className="text-center py-12 text-gray-400">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-brand-blue" />
        </div>
      ) : artes.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center text-gray-400">
          <p className="text-4xl mb-3">✏️</p>
          <p className="font-semibold">Nenhuma arte encontrada</p>
          <p className="text-sm mt-1">Clique em &ldquo;+ Nova Arte&rdquo; para começar</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {artes.map(arte => (
            <div key={arte.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              {/* Image */}
              <div className="relative h-48 bg-gradient-to-br from-brand-purple/20 to-brand-blue/20 flex items-center justify-center">
                {arte.image_url ? (
                  <Image src={arte.image_url} alt={arte.title} fill className="object-cover" />
                ) : (
                  <span className="text-5xl">🖼️</span>
                )}
                <span className={`absolute top-2 right-2 text-xs font-bold px-2 py-0.5 rounded-full ${STATUS_COLORS[arte.status]}`}>
                  {STATUS_LABELS[arte.status]}
                </span>
              </div>

              {/* Info */}
              <div className="p-4">
                <h3 className="font-bold text-brand-gray mb-1 line-clamp-1">{arte.title}</h3>
                {arte.suggested_date && (
                  <p className="text-xs text-gray-400 mb-1">
                    📅 {new Date(arte.suggested_date + 'T00:00:00').toLocaleDateString('pt-BR')}
                  </p>
                )}
                {arte.caption && (
                  <p className="text-xs text-gray-500 line-clamp-2 mb-3">{arte.caption}</p>
                )}

                {/* Status actions */}
                <div className="flex gap-1.5 mb-3 flex-wrap">
                  {(['rascunho', 'pronta', 'publicada'] as const).map(s => (
                    <button
                      key={s}
                      onClick={() => setStatus(arte, s)}
                      disabled={arte.status === s}
                      className={`text-xs px-2.5 py-1 rounded-full transition-colors ${
                        arte.status === s
                          ? `${STATUS_COLORS[s]} cursor-default`
                          : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                      }`}
                    >
                      {STATUS_LABELS[s]}
                    </button>
                  ))}
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => openEdit(arte)}
                    className="flex-1 bg-brand-blue hover:bg-brand-blue-dark text-white text-xs py-1.5 rounded-lg transition-colors"
                  >
                    ✏️ Editar
                  </button>
                  <button
                    onClick={() => handleDelete(arte.id)}
                    className="bg-red-100 hover:bg-red-200 text-red-600 text-xs py-1.5 px-3 rounded-lg transition-colors"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
