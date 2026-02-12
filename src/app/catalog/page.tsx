'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { useCart } from '@/components/CartContext'

interface CatalogItem {
  id: number
  custom_id?: string
  name: string
  description?: string
  category?: string
  quantity: number
  price: number
  image_url?: string
  type?: 'item' | 'kit'
}

interface Kit {
  id: number
  custom_id?: string
  name: string
  description?: string
  price: number
  image_url?: string
  is_active: number
  items: Array<{
    id: number
    item_id: number
    item_name: string
    quantity: number
  }>
}

type TabType = 'kits' | 'units'

export default function CatalogPage() {
  const [items, setItems] = useState<CatalogItem[]>([])
  const [kits, setKits] = useState<Kit[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<TabType>('kits')
  const [quantities, setQuantities] = useState<{ [key: number]: number }>({})
  const { addItem } = useCart()

  useEffect(() => {
    loadCatalog()
  }, [])

  const loadCatalog = async () => {
    try {
      // Carregar apenas itens do catálogo (show_in_catalog=true)
      const itemsResponse = await fetch('/api/items?catalogOnly=true')
      if (itemsResponse.ok) {
        const itemsData = await itemsResponse.json() as CatalogItem[]
        itemsData.forEach(item => item.type = 'item')
        setItems(itemsData)
      }

      // Carregar kits ativos
      const kitsResponse = await fetch('/api/kits?activeOnly=true')
      if (kitsResponse.ok) {
        const kitsData = await kitsResponse.json() as Kit[]
        setKits(kitsData)
      }
    } catch (error) {
      console.error('Error loading catalog:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddToCart = (item: CatalogItem) => {
    const quantity = quantities[item.id] || 1
    // Add the item with the selected quantity
    for (let i = 0; i < quantity; i++) {
      addItem({
        id: item.type === 'kit' ? `kit-${item.id}` : item.id.toString(),
        name: item.name,
        description: item.description || '',
        price: item.price,
        image: item.image_url
      })
    }
    // Reset quantity to 1 after adding
    setQuantities({ ...quantities, [item.id]: 1 })
  }

  const handleAddKitToCart = (kit: Kit) => {
    const itemsDescription = kit.items.map(i => `${i.quantity}× ${i.item_name}`).join(', ')
    addItem({
      id: `kit-${kit.id}`,
      name: kit.name,
      description: kit.description || `Inclui: ${itemsDescription}`,
      price: kit.price,
      image: kit.image_url
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
            Confira itens e kits disponíveis para aluguel
          </p>
        </div>
      </section>

      {/* Tabs Section */}
      <section className="py-8 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          {/* Tabs */}
          <div className="flex justify-center mb-8 border-b border-gray-200">
            <button
              onClick={() => setActiveTab('kits')}
              className={`px-8 py-4 font-bold text-lg transition-all duration-300 ${
                activeTab === 'kits'
                  ? 'border-b-4 border-brand-yellow text-brand-yellow'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              🎁 Kits
            </button>
            <button
              onClick={() => setActiveTab('units')}
              className={`px-8 py-4 font-bold text-lg transition-all duration-300 ${
                activeTab === 'units'
                  ? 'border-b-4 border-brand-yellow text-brand-yellow'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              📦 Unidades
            </button>
          </div>

          {/* Loading State */}
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-brand-yellow"></div>
              <p className="mt-4 text-gray-600">Carregando catálogo...</p>
            </div>
          ) : (
            <>
              {/* Kits Tab Content */}
              {activeTab === 'kits' && (
                <div>
                  <div className="text-center mb-12">
                    <h2 className="text-3xl md:text-4xl font-bold text-brand-gray mb-4">
                      Kits Especiais
                    </h2>
                    <p className="text-lg text-gray-600">
                      Pacotes completos para sua festa
                    </p>
                  </div>

                  {kits.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-gray-600 text-lg">Nenhum kit disponível no momento.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                      {kits.map((kit) => (
                        <div key={kit.id} className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
                          {/* Kit Image */}
                          <div className="h-48 bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center relative overflow-hidden">
                            {kit.image_url ? (
                              <Image 
                                src={kit.image_url} 
                                alt={kit.name}
                                fill
                                className="object-cover"
                              />
                            ) : (
                              <span className="text-white text-8xl">🎁</span>
                            )}
                          </div>
                          
                          <div className="p-6">
                            {/* Custom ID Badge */}
                            {kit.custom_id && (
                              <div className="mb-2">
                                <span className="inline-block bg-brand-purple text-white text-xs font-bold px-2 py-1 rounded">
                                  {kit.custom_id}
                                </span>
                              </div>
                            )}
                            <h3 className="text-xl font-bold text-brand-gray mb-2">
                              {kit.name}
                            </h3>
                            {kit.description && (
                              <p className="text-gray-600 mb-4 text-sm">
                                {kit.description}
                              </p>
                            )}
                            
                            {/* Lista de itens do kit */}
                            <div className="mb-4 p-3 bg-gray-50 rounded">
                              <p className="text-xs font-semibold text-gray-700 mb-2">Inclui:</p>
                              <ul className="text-xs text-gray-600 space-y-1">
                                {kit.items.map((item) => (
                                  <li key={item.id}>
                                    • {item.quantity}× {item.item_name}
                                  </li>
                                ))}
                              </ul>
                            </div>

                            <div className="flex justify-between items-center">
                              <span className="text-2xl font-bold text-brand-yellow">
                                R$ {kit.price.toFixed(2)}
                              </span>
                              <button
                                onClick={() => handleAddKitToCart(kit)}
                                className="bg-brand-yellow hover:bg-brand-yellow/90 text-white font-bold py-2 px-4 rounded-full transition-colors"
                              >
                                Reservar
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Units Tab Content */}
              {activeTab === 'units' && (
                <div>
                  <div className="text-center mb-12">
                    <h2 className="text-3xl md:text-4xl font-bold text-brand-gray mb-4">
                      Itens Individuais
                    </h2>
                    <p className="text-lg text-gray-600">
                      Escolha itens avulsos para personalizar sua festa
                    </p>
                  </div>

                  {items.length === 0 ? (
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
                          <div className="h-64 bg-gradient-to-br from-brand-blue to-brand-purple flex items-center justify-center relative overflow-hidden">
                            {item.image_url ? (
                              <Image 
                                src={item.image_url} 
                                alt={item.name}
                                fill
                                className="object-cover"
                              />
                            ) : (
                              <span className="text-white text-6xl">📦</span>
                            )}
                          </div>
                          
                          <div className="p-6">
                            {/* Custom ID Badge */}
                            {item.custom_id && (
                              <div className="mb-2">
                                <span className="inline-block bg-brand-blue text-white text-xs font-bold px-2 py-1 rounded">
                                  {item.custom_id}
                                </span>
                              </div>
                            )}
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
                            
                            {/* Quantity Selector */}
                            <div className="mb-4">
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Quantidade
                              </label>
                              <input
                                type="number"
                                min="1"
                                max={item.quantity}
                                value={quantities[item.id] || 1}
                                onChange={(e) => setQuantities({ ...quantities, [item.id]: parseInt(e.target.value) || 1 })}
                                className="w-20 px-3 py-2 border border-gray-300 rounded-md text-center"
                                disabled={item.quantity === 0}
                              />
                            </div>

                            <div className="flex justify-between items-center">
                              <span className="text-2xl font-bold text-brand-yellow">
                                R$ {item.price.toFixed(2)}
                              </span>
                              <button
                                onClick={() => handleAddToCart(item)}
                                disabled={item.quantity === 0}
                                className={`font-bold py-2 px-4 rounded-full transition-colors duration-300 ${
                                  item.quantity > 0
                                    ? 'bg-brand-yellow hover:bg-brand-yellow/90 text-white'
                                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                }`}
                              >
                                {item.quantity > 0 ? 'Adicionar ao Carrinho' : 'Indisponível'}
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
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