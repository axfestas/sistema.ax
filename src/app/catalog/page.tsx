'use client'

import { useEffect, useState } from 'react'
import { useCart } from '@/components/CartContext'

interface CatalogItem {
  id: number
  name: string
  description?: string
  category?: string
  quantity: number
  price: number
  imageUrl?: string
}

export default function CatalogPage() {
  const [items, setItems] = useState<CatalogItem[]>([])
  const [loading, setLoading] = useState(true)
  const { addItem } = useCart()

  useEffect(() => {
    loadItems()
  }, [])

  const loadItems = async () => {
    try {
      const response = await fetch('/api/items')
      if (response.ok) {
        const data = await response.json()
        setItems(data)
      }
    } catch (error) {
      console.error('Error loading items:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddToCart = (item: CatalogItem) => {
    addItem({
      id: item.id.toString(),
      name: item.name,
      description: item.description || '',
      price: item.price,
      image: item.imageUrl
    })
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-brand-yellow via-brand-blue to-brand-purple py-20 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 drop-shadow-lg">
            Nosso Catálogo Completo
          </h1>
          <p className="text-xl md:text-2xl text-white/90 mb-8 drop-shadow">
            Confira todos os itens disponíveis para aluguel
          </p>
        </div>
      </section>

      {/* Catalog Items Section */}
      <section id="catalog" className="py-16 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-brand-gray mb-4">
              Itens Disponíveis
            </h2>
            <p className="text-lg text-gray-600">
              Explore nossa seleção completa de itens para sua festa
            </p>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-brand-yellow"></div>
              <p className="mt-4 text-gray-600">Carregando itens...</p>
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600 text-lg">Nenhum item disponível no momento.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {items.map((item) => (
                <div 
                  key={item.id} 
                  className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300"
                >
                  {/* Image */}
                  <div className="h-64 bg-gradient-to-br from-brand-blue to-brand-purple flex items-center justify-center">
                    {item.imageUrl ? (
                      <img 
                        src={item.imageUrl} 
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-white text-6xl">📦</span>
                    )}
                  </div>
                  
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-brand-gray mb-2">
                      {item.name}
                    </h3>
                    {item.description && (
                      <p className="text-gray-600 mb-4 text-sm">
                        {item.description}
                      </p>
                    )}
                    {item.category && (
                      <p className="text-xs text-gray-500 mb-2">
                        Categoria: {item.category}
                      </p>
                    )}
                    <p className="text-xs text-gray-500 mb-4">
                      {item.quantity > 0 ? `${item.quantity} disponível(is)` : 'Indisponível'}
                    </p>
                    <div className="flex justify-between items-center">
                      <span className="text-2xl font-bold text-brand-yellow">
                        R$ {item.price.toFixed(2)}
                      </span>
                      <button
                        onClick={() => handleAddToCart(item)}
                        disabled={item.quantity === 0}
                        className={`font-bold py-2 px-6 rounded-full transition-colors duration-300 ${
                          item.quantity > 0
                            ? 'bg-brand-yellow hover:bg-brand-yellow/90 text-white'
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`}
                      >
                        {item.quantity > 0 ? 'Adicionar' : 'Indisponível'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="py-16 px-4 bg-brand-gray text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Pronto para fazer sua reserva?
          </h2>
          <p className="text-xl mb-8 text-gray-300">
            Adicione os itens ao carrinho e solicite seu orçamento personalizado
          </p>
          <a 
            href="/cart" 
            className="inline-block bg-brand-yellow hover:bg-brand-yellow/90 text-brand-gray font-bold py-4 px-8 rounded-full transition-all duration-300"
          >
            Ver Carrinho e Solicitar Orçamento
          </a>
        </div>
      </section>
    </div>
  )
}