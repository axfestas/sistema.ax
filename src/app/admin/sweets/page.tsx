'use client';

import { useState, useEffect } from 'react';
import { formatSweetId } from '@/lib/formatId';
import Image from 'next/image';
import ImageUpload from '@/components/ImageUpload';

interface Sweet {
  id: number;
  name: string;
  description?: string;
  price: number;
  quantity: number;
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
  quantity: string;
  image_url: string;
  category: string;
  show_in_catalog: boolean;
}

export default function SweetsPage() {
  const [sweets, setSweets] = useState<Sweet[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingSweet, setEditingSweet] = useState<Sweet | null>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    price: '',
    quantity: '',
    image_url: '',
    category: '',
    show_in_catalog: true,
  });

  useEffect(() => {
    loadSweets();
  }, []);

  async function loadSweets() {
    try {
      const res = await fetch('/api/sweets');
      if (res.ok) {
        const data = await res.json() as Sweet[];
        setSweets(data);
      }
    } catch (error) {
      console.error('Error loading sweets:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    try {
      const method = editingSweet ? 'PUT' : 'POST';
      const body = editingSweet 
        ? { ...formData, id: editingSweet.id, price: parseFloat(formData.price), quantity: parseInt(formData.quantity), show_in_catalog: formData.show_in_catalog ? 1 : 0 }
        : { ...formData, price: parseFloat(formData.price), quantity: parseInt(formData.quantity), show_in_catalog: formData.show_in_catalog ? 1 : 0 };

      const res = await fetch('/api/sweets', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        setShowForm(false);
        setEditingSweet(null);
        resetForm();
        loadSweets();
      }
    } catch (error) {
      console.error('Error saving sweet:', error);
    }
  }

  function resetForm() {
    setFormData({
      name: '',
      description: '',
      price: '',
      quantity: '',
      image_url: '',
      category: '',
      show_in_catalog: true,
    });
  }

  function handleEdit(sweet: Sweet) {
    setEditingSweet(sweet);
    setFormData({
      name: sweet.name,
      description: sweet.description || '',
      price: sweet.price.toString(),
      quantity: sweet.quantity.toString(),
      image_url: sweet.image_url || '',
      category: sweet.category || '',
      show_in_catalog: sweet.show_in_catalog === 1,
    });
    setShowForm(true);
  }

  async function handleDelete(id: number) {
    if (!confirm('Tem certeza que deseja excluir este doce?')) {
      return;
    }

    try {
      const res = await fetch(`/api/sweets?id=${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        loadSweets();
      }
    } catch (error) {
      console.error('Error deleting sweet:', error);
    }
  }

  function handleNewSweet() {
    setEditingSweet(null);
    resetForm();
    setShowForm(true);
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Gerenciar Doces</h1>
        <button
          onClick={handleNewSweet}
          className="bg-pink-600 text-white px-4 py-2 rounded hover:bg-pink-700 transition-colors"
        >
          + Novo Doce
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600"></div>
          <p className="mt-4 text-gray-600">Carregando doces...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sweets.length === 0 ? (
            <div className="col-span-full text-center py-12 text-gray-500">
              Nenhum doce cadastrado
            </div>
          ) : (
            sweets.map(sweet => (
              <div key={sweet.id} className="bg-white rounded-lg shadow overflow-hidden hover:shadow-lg transition-shadow">
                <div className="aspect-square bg-gray-200 relative">
                  {sweet.image_url ? (
                    <Image src={sweet.image_url} alt={sweet.name} fill className="object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-6xl">
                      🍰
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <span className="inline-block bg-pink-100 text-pink-800 text-xs font-bold px-2 py-1 rounded">
                      {formatSweetId(sweet.id)}
                    </span>
                    {sweet.show_in_catalog === 1 && (
                      <span className="inline-block bg-green-100 text-green-800 text-xs font-bold px-2 py-1 rounded">
                        Catálogo
                      </span>
                    )}
                  </div>
                  <h3 className="font-bold text-lg mb-2">{sweet.name}</h3>
                  {sweet.description && (
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">{sweet.description}</p>
                  )}
                  {sweet.category && (
                    <p className="text-xs text-gray-500 mb-2">Categoria: {sweet.category}</p>
                  )}
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xl font-bold text-pink-600">
                      R$ {sweet.price.toFixed(2)}
                    </span>
                    <span className="text-sm text-gray-600">
                      Qtd: {sweet.quantity}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleEdit(sweet)}
                      className="flex-1 bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700 transition-colors"
                    >
                      Editar
                    </button>
                    <button 
                      onClick={() => handleDelete(sweet.id)}
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
              {editingSweet ? 'Editar Doce' : 'Novo Doce'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">Nome *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">Descrição</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Preço (R$) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={formData.price}
                    onChange={(e) => setFormData({...formData, price: e.target.value})}
                    className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Quantidade *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.quantity}
                    onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                    className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
                  />
                </div>
                <div className="col-span-2">
                  <ImageUpload
                    currentImage={formData.image_url}
                    onUpload={(url) => setFormData({...formData, image_url: url})}
                    folder="sweets"
                    label="Imagem do Doce"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Categoria</label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
                    placeholder="Ex: Bolos, Docinhos, etc."
                  />
                </div>
                <div className="flex items-center">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.show_in_catalog}
                      onChange={(e) => setFormData({...formData, show_in_catalog: e.target.checked})}
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
                    setEditingSweet(null);
                    resetForm();
                  }}
                  className="px-4 py-2 border rounded hover:bg-gray-100 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-pink-600 text-white rounded hover:bg-pink-700 transition-colors"
                >
                  {editingSweet ? 'Salvar Alterações' : 'Criar Doce'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
