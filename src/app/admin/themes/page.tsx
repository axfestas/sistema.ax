'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import ImageUpload from '@/components/ImageUpload';

interface Theme {
  id: number;
  name: string;
  description?: string;
  price: number;
  image_url?: string;
  category?: string;
  is_active: number;
  show_in_catalog: number;
  created_at: number;
}

interface FormData {
  name: string;
  description: string;
  price: string;
  image_url: string;
  category: string;
  show_in_catalog: boolean;
}

export default function ThemesPage() {
  const [themes, setThemes] = useState<Theme[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingTheme, setEditingTheme] = useState<Theme | null>(null);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<string[]>([]);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    price: '',
    image_url: '',
    category: '',
    show_in_catalog: true,
  });

  useEffect(() => {
    loadThemes();
    loadCategories();
  }, []);

  async function loadThemes() {
    try {
      const res = await fetch('/api/themes');
      if (!res.ok) throw new Error(`Erro HTTP: ${res.status}`);
      const data = await res.json() as Theme[];
      setThemes(data);
    } catch (error) {
      console.error('Error loading themes:', error);
      setThemes([]);
    } finally {
      setLoading(false);
    }
  }

  async function loadCategories() {
    try {
      const res = await fetch('/api/categories?section=themes');
      if (res.ok) {
        const data = await res.json() as { id: number; name: string; section: string }[];
        setCategories(data.map((c) => c.name));
      }
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    try {
      const method = editingTheme ? 'PUT' : 'POST';
      const body = editingTheme
        ? { ...formData, id: editingTheme.id, price: parseFloat(formData.price), show_in_catalog: formData.show_in_catalog ? 1 : 0 }
        : { ...formData, price: parseFloat(formData.price), show_in_catalog: formData.show_in_catalog ? 1 : 0 };

      const res = await fetch('/api/themes', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error(`Erro HTTP: ${res.status}`);

      setShowForm(false);
      setEditingTheme(null);
      resetForm();
      loadThemes();
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  }

  function resetForm() {
    setFormData({
      name: '',
      description: '',
      price: '',
      image_url: '',
      category: '',
      show_in_catalog: true,
    });
  }

  function handleEdit(theme: Theme) {
    setEditingTheme(theme);
    setFormData({
      name: theme.name,
      description: theme.description || '',
      price: theme.price.toString(),
      image_url: theme.image_url || '',
      category: theme.category || '',
      show_in_catalog: theme.show_in_catalog === 1,
    });
    setShowForm(true);
  }

  async function handleDelete(id: number) {
    if (!confirm('Tem certeza que deseja excluir este tema?')) return;

    try {
      const res = await fetch(`/api/themes?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(`Erro HTTP: ${res.status}`);
      loadThemes();
    } catch (error) {
      console.error('Error deleting theme:', error);
    }
  }

  function handleNewTheme() {
    setEditingTheme(null);
    resetForm();
    setShowForm(true);
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Gerenciar Temas</h1>
        <button
          onClick={handleNewTheme}
          className="bg-brand-blue text-white px-4 py-2 rounded hover:bg-brand-blue-dark transition-colors"
        >
          + Novo Tema
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600"></div>
          <p className="mt-4 text-gray-600">Carregando temas...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {themes.length === 0 ? (
            <div className="col-span-full text-center py-12 text-gray-500">
              Nenhum tema cadastrado
            </div>
          ) : (
            themes.map((theme) => (
              <div key={theme.id} className="bg-white rounded-lg shadow overflow-hidden hover:shadow-lg transition-shadow">
                <div className="aspect-square bg-gray-200 relative">
                  {theme.image_url ? (
                    <Image src={theme.image_url} alt={theme.name} fill className="object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-6xl">
                      🎭
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <span className="inline-block bg-pink-100 text-pink-800 text-xs font-bold px-2 py-1 rounded">
                      #{theme.id}
                    </span>
                    {theme.show_in_catalog === 1 && (
                      <span className="inline-block bg-green-100 text-green-800 text-xs font-bold px-2 py-1 rounded">
                        Catálogo
                      </span>
                    )}
                  </div>
                  <h3 className="font-bold text-lg mb-2">{theme.name}</h3>
                  {theme.description && (
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">{theme.description}</p>
                  )}
                  {theme.category && (
                    <p className="text-xs text-gray-500 mb-2">Categoria: {theme.category}</p>
                  )}
                  <div className="mb-3">
                    <span className="text-xl font-bold text-pink-600">
                      R$ {theme.price.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(theme)}
                      className="flex-1 bg-brand-blue text-white px-3 py-2 rounded text-sm hover:bg-brand-blue-dark transition-colors"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(theme.id)}
                      className="flex-1 bg-red-600 text-white px-3 py-2 rounded text-sm hover:bg-red-700 transition-colors"
                    >
                      Excluir
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Modal de Formulário */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">
              {editingTheme ? 'Editar Tema' : 'Novo Tema'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">Nome *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">Descrição</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
                    rows={3}
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">Preço (R$) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
                  />
                </div>
                <div className="col-span-2">
                  <ImageUpload
                    currentImage={formData.image_url}
                    onUpload={(url) => setFormData({ ...formData, image_url: url })}
                    folder="themes"
                    label="Imagem do Tema"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Categoria</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
                  >
                    <option value="">Sem categoria</option>
                    {categories.length === 0 ? (
                      <option disabled>Nenhuma categoria cadastrada</option>
                    ) : (
                      categories.map((cat, idx) => (
                        <option key={idx} value={cat}>{cat}</option>
                      ))
                    )}
                  </select>
                </div>
                <div className="flex items-center">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.show_in_catalog}
                      onChange={(e) => setFormData({ ...formData, show_in_catalog: e.target.checked })}
                      className="mr-2 h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300 rounded"
                    />
                    <span className="text-sm font-medium">Exibir no Catálogo</span>
                  </label>
                </div>
              </div>
              <div className="flex gap-3 justify-end pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingTheme(null);
                    resetForm();
                  }}
                  className="px-4 py-2 border rounded hover:bg-gray-100 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-brand-blue text-white rounded hover:bg-brand-blue-dark transition-colors"
                >
                  {editingTheme ? 'Salvar Alterações' : 'Criar Tema'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
