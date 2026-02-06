'use client';

import { useEffect, useState } from 'react';

interface Item {
  id: string;
  fields: {
    name: string;
    description?: string;
    category?: string;
    price?: number;
    quantity?: number;
    status?: string;
    imageUrl?: string;
  };
}

export default function CatalogPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/items?status=available');
      
      if (!response.ok) {
        throw new Error('Failed to fetch items');
      }
      
      const data = await response.json();
      setItems(data);
      setError('');
    } catch (err: any) {
      console.error('Error fetching items:', err);
      setError('Erro ao carregar itens. Verifique se as variáveis de ambiente do Airtable estão configuradas.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold mb-6">Catálogo de Itens</h1>
        <p className="text-gray-600">Carregando itens...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold mb-6">Catálogo de Itens</h1>
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <p className="text-yellow-800">{error}</p>
          <p className="text-sm text-yellow-700 mt-2">
            Configure as variáveis de ambiente AIRTABLE_API_KEY e AIRTABLE_BASE_ID no Cloudflare Pages.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold mb-6">Catálogo de Itens</h1>
      
      {items.length === 0 ? (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <p className="text-blue-800">Nenhum item disponível no momento.</p>
          <p className="text-sm text-blue-700 mt-2">
            Adicione itens na tabela "Items" do Airtable para vê-los aqui.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item) => (
            <div key={item.id} className="bg-white shadow rounded-lg p-6">
              {item.fields.imageUrl && (
                <img 
                  src={item.fields.imageUrl} 
                  alt={item.fields.name}
                  className="w-full h-48 object-cover rounded mb-4"
                />
              )}
              <h2 className="text-xl font-semibold mb-2">{item.fields.name}</h2>
              {item.fields.description && (
                <p className="text-gray-600 mb-4">{item.fields.description}</p>
              )}
              {item.fields.category && (
                <p className="text-sm text-gray-500 mb-2">
                  Categoria: {item.fields.category}
                </p>
              )}
              {item.fields.price !== undefined && (
                <p className="text-lg font-bold mb-4">
                  R$ {item.fields.price.toFixed(2)}
                </p>
              )}
              {item.fields.quantity !== undefined && (
                <p className="text-sm text-gray-500 mb-4">
                  Disponível: {item.fields.quantity}
                </p>
              )}
              <button className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded w-full">
                Reservar
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}