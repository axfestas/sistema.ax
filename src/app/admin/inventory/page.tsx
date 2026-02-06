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

export default function InventoryPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/items');
      
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
      <div>
        <h2 className="text-2xl font-bold mb-4">Controle de Estoque</h2>
        <p className="text-gray-600">Carregando itens...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <h2 className="text-2xl font-bold mb-4">Controle de Estoque</h2>
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
    <div>
      <h2 className="text-2xl font-bold mb-4">Controle de Estoque</h2>
      
      {items.length === 0 ? (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-4">
          <p className="text-blue-800">Nenhum item encontrado.</p>
          <p className="text-sm text-blue-700 mt-2">
            Adicione itens na tabela "Items" do Airtable para vê-los aqui.
          </p>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md mb-4">
          <ul role="list" className="divide-y divide-gray-200">
            {items.map((item) => (
              <li key={item.id} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      {item.fields.imageUrl && (
                        <img 
                          src={item.fields.imageUrl} 
                          alt={item.fields.name}
                          className="w-16 h-16 object-cover rounded"
                        />
                      )}
                      <div>
                        <p className="text-lg font-medium text-gray-900">{item.fields.name}</p>
                        {item.fields.description && (
                          <p className="text-sm text-gray-600">{item.fields.description}</p>
                        )}
                        <div className="flex gap-4 mt-1">
                          {item.fields.category && (
                            <span className="text-sm text-gray-500">
                              Categoria: {item.fields.category}
                            </span>
                          )}
                          {item.fields.price !== undefined && (
                            <span className="text-sm text-gray-500">
                              Preço: R$ {item.fields.price.toFixed(2)}
                            </span>
                          )}
                          {item.fields.quantity !== undefined && (
                            <span className="text-sm text-gray-500">
                              Quantidade: {item.fields.quantity}
                            </span>
                          )}
                          {item.fields.status && (
                            <span className={`text-sm px-2 py-1 rounded ${
                              item.fields.status === 'available' 
                                ? 'bg-green-100 text-green-800'
                                : item.fields.status === 'reserved'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {item.fields.status}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
      
      <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
        <p className="text-sm text-blue-800">
          💡 Para adicionar ou editar itens, acesse seu Airtable diretamente.
        </p>
      </div>
    </div>
  );
}