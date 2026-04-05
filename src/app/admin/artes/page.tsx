'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import ImageUpload from '@/components/ImageUpload';
import { useToast } from '@/hooks/useToast';

interface Arte {
  id: number;
  title: string;
  image_url?: string;
  created_at: number;
}

export default function ArtesPage() {
  const { showSuccess, showError } = useToast();
  const [artes, setArtes] = useState<Arte[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingArte, setEditingArte] = useState<Arte | null>(null);
  const [formData, setFormData] = useState({ title: '', image_url: '' });

  useEffect(() => {
    loadArtes();
  }, []);

  async function loadArtes() {
    setLoading(true);
    try {
      const res = await fetch('/api/artes');
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

  function openNew() {
    setEditingArte(null);
    setFormData({ title: '', image_url: '' });
    setShowForm(true);
  }

  function openEdit(arte: Arte) {
    setEditingArte(arte);
    setFormData({ title: arte.title, image_url: arte.image_url || '' });
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
        body: JSON.stringify({ ...formData, id: editingArte?.id }),
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
          className="bg-brand-blue hover:bg-brand-blue-dark text-white py-2 px-5 rounded transition-colors whitespace-nowrap"
        >
          + Nova Arte
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-brand-gray mb-4">
            {editingArte ? 'Editar Arte' : 'Nova Arte'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Título *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
                placeholder="Ex: Promoção de Páscoa"
                required
              />
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
                className="bg-brand-blue hover:bg-brand-blue-dark text-white py-2 px-6 rounded transition-colors"
              >
                Salvar
              </button>
              <button
                type="button"
                onClick={() => { setShowForm(false); setEditingArte(null); }}
                className="border rounded hover:bg-gray-100 py-2 px-6 transition-colors"
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
              </div>

              {/* Info */}
              <div className="p-4">
                <h3 className="font-bold text-brand-gray mb-3 line-clamp-1">{arte.title}</h3>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => openEdit(arte)}
                    className="flex-1 bg-brand-blue hover:bg-brand-blue-dark text-white text-xs py-1.5 rounded transition-colors"
                  >
                    ✏️ Editar
                  </button>
                  <button
                    onClick={() => handleDelete(arte.id)}
                    className="bg-red-600 hover:bg-red-700 text-white text-xs py-1.5 px-3 rounded transition-colors"
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
