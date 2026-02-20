'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/useToast';

interface Category {
  id: number;
  name: string;
  section: string;
}

const SECTIONS = [
  { key: 'items', label: 'Estoque' },
  { key: 'sweets', label: 'Doces' },
  { key: 'designs', label: 'Design' },
  { key: 'themes', label: 'Temas' },
  { key: 'kits', label: 'Kits' },
];

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [newCategory, setNewCategory] = useState({ name: '', section: 'items' });
  const { showSuccess, showError } = useToast();

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const res = await fetch('/api/categories');
      if (res.ok) {
        const data = await res.json() as Category[];
        setCategories(data);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategory.name.trim()) return;

    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCategory),
      });
      if (res.ok) {
        await loadCategories();
        setNewCategory({ name: '', section: newCategory.section });
        showSuccess('Categoria criada com sucesso!');
      } else {
        showError('Erro ao criar categoria');
      }
    } catch (error) {
      showError('Erro ao criar categoria');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir esta categoria?')) return;
    try {
      const res = await fetch(`/api/categories?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        await loadCategories();
        showSuccess('Categoria excluída com sucesso!');
      } else {
        showError('Erro ao excluir categoria');
      }
    } catch (error) {
      showError('Erro ao excluir categoria');
    }
  };

  if (loading) return <div className="p-4">Carregando...</div>;

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Gerenciar Categorias</h2>

      {/* Form to create a new category */}
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h3 className="text-lg font-semibold mb-4">Nova Categoria</h3>
        <form onSubmit={handleCreate} className="flex gap-3 flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium mb-1">Nome</label>
            <input
              type="text"
              value={newCategory.name}
              onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
              required
              placeholder="Ex: Mesas, Cadeiras, Aniversário..."
              className="w-full px-3 py-2 border rounded"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Seção</label>
            <select
              value={newCategory.section}
              onChange={(e) => setNewCategory({ ...newCategory, section: e.target.value })}
              className="px-3 py-2 border rounded"
            >
              {SECTIONS.map((s) => (
                <option key={s.key} value={s.key}>{s.label}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              className="bg-brand-blue hover:bg-brand-blue-dark text-white font-bold py-2 px-4 rounded"
            >
              + Adicionar
            </button>
          </div>
        </form>
      </div>

      {/* Categories grouped by section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {SECTIONS.map((section) => {
          const sectionCats = categories.filter((c) => c.section === section.key);
          return (
            <div key={section.key} className="bg-white p-4 rounded-lg shadow">
              <h3 className="font-semibold text-lg mb-3 border-b pb-2">
                {section.label}
              </h3>
              {sectionCats.length === 0 ? (
                <p className="text-gray-400 text-sm">Nenhuma categoria cadastrada</p>
              ) : (
                <ul className="space-y-2">
                  {sectionCats.map((cat) => (
                    <li key={cat.id} className="flex justify-between items-center py-1">
                      <span className="text-sm">{cat.name}</span>
                      <button
                        onClick={() => handleDelete(cat.id)}
                        className="text-red-500 hover:text-red-700 text-xs"
                      >
                        🗑️
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
