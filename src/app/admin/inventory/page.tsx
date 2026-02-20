'use client';

import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/useToast';
import ImageUpload from '@/components/ImageUpload';
import { formatItemId } from '@/lib/formatId';

interface Item {
  id: number;
  name: string;
  description?: string;
  price: number;
  quantity: number;
  image_url?: string;
  category?: string;
  show_in_catalog?: number; // 1 = show, 0 = hide
}

export default function InventoryPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [inventoryCategories, setInventoryCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    quantity: '',
    image_url: '',
    category: '',
    show_in_catalog: 1, // Default to showing in catalog
  });
  const { showSuccess, showError } = useToast();

  useEffect(() => {
    loadItems();
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const res = await fetch('/api/categories?section=items');
      if (res.ok) {
        const data = await res.json() as any[];
        setInventoryCategories(data.map((c) => c.name));
      }
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadItems = async () => {
    try {
      const response = await fetch('/api/items');
      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`);
      }
      if (response.ok) {
        const data: any = await response.json();
        setItems(data);
      }
    } catch (error) {
      console.error('Error loading items:', error);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const itemData = {
      name: formData.name,
      description: formData.description || undefined,
      price: parseFloat(formData.price),
      quantity: parseInt(formData.quantity),
      image_url: formData.image_url || undefined,
      category: formData.category || undefined,
      show_in_catalog: formData.show_in_catalog,
    };

    try {
      const url = editingItem 
        ? `/api/items?id=${editingItem.id}` 
        : '/api/items';
      const method = editingItem ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(itemData),
      });

      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`);
      }

      if (response.ok) {
        await loadItems();
        setShowForm(false);
        setEditingItem(null);
        setFormData({ name: '', description: '', price: '', quantity: '', image_url: '', category: '', show_in_catalog: 1 });
        showSuccess(editingItem ? 'Item atualizado com sucesso!' : 'Item salvo com sucesso!');
      } else {
        const error: any = await response.json();
        showError(error.error || 'Erro ao salvar item');
      }
    } catch (error) {
      console.error('Error saving item:', error);
      showError('Erro ao salvar item');
    }
  };

  const handleEdit = (item: Item) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      description: item.description || '',
      price: item.price.toString(),
      quantity: item.quantity.toString(),
      image_url: item.image_url || '',
      category: item.category || '',
      show_in_catalog: item.show_in_catalog !== undefined ? item.show_in_catalog : 1,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Tem certeza que deseja deletar este item?')) return;

    try {
      const response = await fetch(`/api/items?id=${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`);
      }

      if (response.ok) {
        await loadItems();
        showSuccess('Item deletade com sucesso!');
      } else {
        showError('Erro ao deletar item');
      }
    } catch (error) {
      console.error('Error deleting item:', error);
      showError('Erro ao deletar item');
    }
  };

  if (loading) {
    return <div className="p-4">Carregando...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Controle de Estoque</h2>
        <button
          onClick={() => {
            setShowForm(true);
            setEditingItem(null);
            setFormData({ name: '', description: '', price: '', quantity: '', image_url: '', category: '', show_in_catalog: 1 });
          }}
          className="bg-brand-blue hover:bg-brand-blue-dark text-white font-bold py-2 px-4 rounded"
        >
          + Adicionar Item
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h3 className="text-xl font-bold mb-4">
            {editingItem ? 'Editar Item' : 'Novo Item'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Nome</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="w-full px-3 py-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Descrição</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border rounded"
                rows={3}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Categoria</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 border rounded"
              >
                <option value="">Sem categoria</option>
                {inventoryCategories.map((cat, idx) => (
                  <option key={idx} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <ImageUpload
              currentImage={formData.image_url}
              onUpload={(url) => setFormData({ ...formData, image_url: url })}
              folder="items"
              label="Imagem do Item"
            />
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Preço (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  required
                  className="w-full px-3 py-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Quantidade</label>
                <input
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  required
                  className="w-full px-3 py-2 border rounded"
                />
              </div>
            </div>
            <div className="flex items-center p-3 bg-blue-50 rounded">
              <input
                type="checkbox"
                id="show_in_catalog"
                checked={formData.show_in_catalog === 1}
                onChange={(e) => setFormData({ ...formData, show_in_catalog: e.target.checked ? 1 : 0 })}
                className="mr-3 w-4 h-4"
              />
              <div>
                <label htmlFor="show_in_catalog" className="text-sm font-semibold text-blue-900 cursor-pointer">
                  Mostrar no Catálogo Público
                </label>
                <p className="text-xs text-blue-700">
                  Se marcado, este item aparecerá no catálogo para os clientes
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="bg-brand-blue hover:bg-brand-blue-dark text-white font-bold py-2 px-4 rounded"
              >
                Salvar
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingItem(null);
                  setFormData({ name: '', description: '', price: '', quantity: '', image_url: '', category: '', show_in_catalog: 1 });
                }}
                className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        {items.length === 0 ? (
          <div className="px-6 py-4">
            <p className="text-gray-500">Nenhum item cadastrado</p>
          </div>
        ) : (
          <ul role="list" className="divide-y divide-gray-200">
            {items.map((item) => (
              <li key={item.id} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono bg-blue-100 text-blue-800 px-2 py-1 rounded font-semibold">
                        {formatItemId(item.id)}
                      </span>
                      <h3 className="text-lg font-semibold">{item.name}</h3>
                      {item.show_in_catalog === 1 ? (
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded font-semibold">
                          No Catálogo
                        </span>
                      ) : (
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                          Só Estoque
                        </span>
                      )}
                    </div>
                    {item.description && (
                      <p className="text-sm text-gray-600">{item.description}</p>
                    )}
                    {item.category && (
                      <p className="text-xs text-gray-500 mt-1">Categoria: {item.category}</p>
                    )}
                    <div className="mt-2 flex gap-4 text-sm">
                      <span className="text-green-600 font-semibold">
                        R$ {item.price.toFixed(2)}
                      </span>
                      <span className="text-gray-600">
                        Quantidade: {item.quantity}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(item)}
                      className="bg-brand-blue hover:bg-brand-blue-dark text-white font-bold py-1 px-3 rounded text-sm"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-3 rounded text-sm"
                    >
                      Deletar
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}