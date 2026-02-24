'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { useCart } from '@/components/CartContext'
import { useToast } from '@/components/ToastProvider'

const ShareIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
  </svg>
)

interface ShareModalProps {
  url: string
  name: string
  text: string
  onClose: () => void
}

const ShareModal = ({ url, name, text, onClose }: ShareModalProps) => {
  const { showSuccess } = useToast()
  const [hasNativeShare, setHasNativeShare] = useState(false)

  useEffect(() => {
    setHasNativeShare('share' in navigator)
  }, [])

  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`${text}\n${url}`)}`

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url)
      showSuccess('Link copiado para a área de transferência!')
    } catch {
      // fallback: show the url
    }
    onClose()
  }

  const handleOtherApps = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: name, text, url })
      } catch {
        // user cancelled or error
      }
    }
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-t-2xl w-full max-w-lg p-6 shadow-2xl animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* drag handle */}
        <div className="flex justify-center mb-4" aria-hidden="true">
          <div className="w-10 h-1 rounded-full bg-gray-300" />
        </div>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-gray-800">Compartilhar com...</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Fechar"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="flex flex-col gap-3 pb-2">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={onClose}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl bg-green-50 hover:bg-green-100 transition-colors text-green-700 font-medium"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            Compartilhar no WhatsApp
          </a>
          <button
            onClick={handleCopyLink}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors text-gray-700 font-medium"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            Copiar link
          </button>
          {hasNativeShare && (
            <button
              onClick={handleOtherApps}
              className="flex items-center gap-3 w-full px-4 py-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors text-gray-700 font-medium"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              Outro aplicativo
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

interface CatalogItem {
  id: number
  custom_id?: string
  name: string
  description?: string
  category?: string
  quantity: number
  price: number
  image_url?: string
  type?: 'item' | 'kit' | 'sweet' | 'design'
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

interface Sweet {
  id: number
  name: string
  description?: string
  price: number
  quantity: number
  image_url?: string
  category?: string
}

interface Design {
  id: number
  name: string
  description?: string
  price: number
  image_url?: string
  category?: string
}

interface Theme {
  id: number
  name: string
  description?: string
  image_url?: string
  category?: string
  price?: number
}

type TabType = 'items' | 'kits' | 'sweets' | 'designs' | 'themes'

const HIGHLIGHT_DURATION_MS = 10000
const TAB_SWITCH_DELAY_MS = 300

export default function CatalogPage() {
  const [items, setItems] = useState<CatalogItem[]>([])
  const [kits, setKits] = useState<Kit[]>([])
  const [sweets, setSweets] = useState<Sweet[]>([])
  const [designs, setDesigns] = useState<Design[]>([])
  const [themes, setThemes] = useState<Theme[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<TabType>('kits')
  const [quantities, setQuantities] = useState<{ [key: number]: number }>({})
  const [search, setSearch] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [highlightedItem, setHighlightedItem] = useState<string | null>(null)
  const [shareModal, setShareModal] = useState<{ url: string; name: string; text: string } | null>(null)
  const { addItem } = useCart()

  // Reset search and category when switching tabs
  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab)
    setSearch('')
    setFilterCategory('')
  }

  // Derive all categories for the active tab
  const availableCategories = (() => {
    const getCats = (arr: { category?: string }[]) =>
      Array.from(new Set(arr.map((x) => x.category).filter(Boolean) as string[])).sort()
    if (activeTab === 'items') return getCats(items)
    if (activeTab === 'sweets') return getCats(sweets)
    if (activeTab === 'designs') return getCats(designs)
    if (activeTab === 'themes') return getCats(themes)
    return []
  })()

  const filterFn = <T extends { name: string; description?: string }>(arr: T[]): T[] => {
    return arr.filter((x) => {
      const cat = (x as any).category as string | undefined
      const matchesCat = !filterCategory || cat === filterCategory
      if (!matchesCat) return false
      if (!search.trim()) return true
      const q = search.toLowerCase()
      return (
        x.name.toLowerCase().includes(q) ||
        (x.description && x.description.toLowerCase().includes(q)) ||
        (cat && cat.toLowerCase().includes(q))
      )
    })
  }

  const filteredItems = filterFn(items)
  const filteredKits = filterFn(kits)
  const filteredSweets = filterFn(sweets)
  const filteredDesigns = filterFn(designs)
  const filteredThemes = filterFn(themes)

  useEffect(() => {
    loadCatalog()
  }, [])

  const loadCatalog = async () => {
    try {
      // Carregar todos os dados em paralelo
      const [itemsResponse, kitsResponse, sweetsResponse, designsResponse, themesResponse] = await Promise.all([
        fetch('/api/items?catalogOnly=true'),
        fetch('/api/kits?activeOnly=true'),
        fetch('/api/sweets?catalog=true'),
        fetch('/api/designs?catalog=true'),
        fetch('/api/themes?catalog=true'),
      ])

      if (itemsResponse.ok) {
        const itemsData = await itemsResponse.json() as CatalogItem[]
        itemsData.forEach(item => item.type = 'item')
        setItems(itemsData)
      }

      if (kitsResponse.ok) {
        const kitsData = await kitsResponse.json() as Kit[]
        setKits(kitsData)
      }

      if (sweetsResponse.ok) {
        const sweetsData = await sweetsResponse.json() as Sweet[]
        setSweets(sweetsData)
      }

      if (designsResponse.ok) {
        const designsData = await designsResponse.json() as Design[]
        setDesigns(designsData)
      }

      if (themesResponse.ok) {
        const themesData = await themesResponse.json() as Theme[]
        setThemes(themesData)
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

  const handleShare = (type: string, id: number, name: string, description?: string) => {
    const url = `${window.location.origin}/item/${type}/${id}`
    const text = description ? `${name} - ${description}` : name
    setShareModal({ url, name, text })
  }

  // Highlight item when navigating via a shared link (hash in URL)
  useEffect(() => {
    if (loading) return
    const hash = window.location.hash
    if (!hash) return
    const anchor = hash.slice(1)
    if (anchor.startsWith('kit-')) setActiveTab('kits')
    else if (anchor.startsWith('item-')) setActiveTab('items')
    else if (anchor.startsWith('sweet-')) setActiveTab('sweets')
    else if (anchor.startsWith('design-')) setActiveTab('designs')
    else if (anchor.startsWith('theme-')) setActiveTab('themes')
    setTimeout(() => {
      const el = document.getElementById(anchor)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' })
        setHighlightedItem(anchor)
        setTimeout(() => setHighlightedItem(null), HIGHLIGHT_DURATION_MS)
      }
    }, TAB_SWITCH_DELAY_MS)
  // setActiveTab is stable (from useState) so omitting it from deps is safe
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading])

  return (
    <div className="min-h-screen bg-white">
      {shareModal && (
        <ShareModal
          url={shareModal.url}
          name={shareModal.name}
          text={shareModal.text}
          onClose={() => setShareModal(null)}
        />
      )}
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
          <div className="flex justify-center mb-8 border-b border-gray-200 flex-wrap">
            <button
              onClick={() => handleTabChange('kits')}
              className={`px-6 py-4 font-bold text-base md:text-lg transition-all duration-300 ${
                activeTab === 'kits'
                  ? 'border-b-4 border-brand-yellow text-brand-yellow'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              🎁 Kits ({kits.length})
            </button>
            <button
              onClick={() => handleTabChange('items')}
              className={`px-6 py-4 font-bold text-base md:text-lg transition-all duration-300 ${
                activeTab === 'items'
                  ? 'border-b-4 border-brand-yellow text-brand-yellow'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              📦 Estoque ({items.length})
            </button>
            <button
              onClick={() => handleTabChange('sweets')}
              className={`px-6 py-4 font-bold text-base md:text-lg transition-all duration-300 ${
                activeTab === 'sweets'
                  ? 'border-b-4 border-brand-yellow text-brand-yellow'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              🍰 Doces ({sweets.length})
            </button>
            <button
              onClick={() => handleTabChange('designs')}
              className={`px-6 py-4 font-bold text-base md:text-lg transition-all duration-300 ${
                activeTab === 'designs'
                  ? 'border-b-4 border-brand-yellow text-brand-yellow'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              🎨 Design ({designs.length})
            </button>
            <button
              onClick={() => handleTabChange('themes')}
              className={`px-6 py-4 font-bold text-base md:text-lg transition-all duration-300 ${
                activeTab === 'themes'
                  ? 'border-b-4 border-brand-yellow text-brand-yellow'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              🎭 Temas ({themes.length})
            </button>
          </div>

          {/* Search and Filter Bar */}
          {!loading && (
            <div className="flex gap-2 mb-8 flex-wrap justify-center">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por nome ou descrição..."
                className="px-4 py-2 border border-gray-300 rounded-lg flex-1 max-w-md"
              />
              {availableCategories.length > 0 && (
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="">Todas as categorias</option>
                  {availableCategories.map((cat, i) => (
                    <option key={i} value={cat}>{cat}</option>
                  ))}
                </select>
              )}
            </div>
          )}

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
                  ) : filteredKits.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-gray-600 text-lg">Nenhum kit encontrado para a busca.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                      {filteredKits.map((kit) => (
                        <div key={kit.id} id={`kit-${kit.id}`} className={`bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300${highlightedItem === `kit-${kit.id}` ? ' ring-4 ring-black' : ''}`}>
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
                            <button
                              onClick={() => handleShare('kit', kit.id, kit.name, kit.description)}
                              title="Compartilhar"
                              aria-label="Compartilhar"
                              className="absolute top-2 right-2 z-10 p-2 rounded-full bg-white/80 hover:bg-white transition-colors text-gray-600 shadow"
                            >
                              <ShareIcon />
                            </button>
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
                                Adicionar ao Carrinho
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
              {activeTab === 'items' && (
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
                  ) : filteredItems.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-gray-600 text-lg">Nenhum item encontrado para a busca.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                      {filteredItems.map((item) => (
                        <div 
                          key={item.id}
                          id={`item-${item.id}`}
                          className={`bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-all duration-300${highlightedItem === `item-${item.id}` ? ' ring-4 ring-black' : ''}`}
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
                            <button
                              onClick={() => handleShare('item', item.id, item.name, item.description)}
                              title="Compartilhar"
                              aria-label="Compartilhar"
                              className="absolute top-2 right-2 z-10 p-2 rounded-full bg-white/80 hover:bg-white transition-colors text-gray-600 shadow"
                            >
                              <ShareIcon />
                            </button>
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

              {/* Sweets Tab Content */}
              {activeTab === 'sweets' && (
                <div>
                  <div className="text-center mb-12">
                    <h2 className="text-3xl md:text-4xl font-bold text-brand-gray mb-4">
                      Doces e Sobremesas
                    </h2>
                    <p className="text-lg text-gray-600">
                      Deliciosos doces para adoçar sua festa
                    </p>
                  </div>

                  {sweets.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-gray-600 text-lg">Nenhum doce disponível no momento.</p>
                    </div>
                  ) : filteredSweets.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-gray-600 text-lg">Nenhum doce encontrado para a busca.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                      {filteredSweets.map((sweet) => (
                        <div 
                          key={sweet.id}
                          id={`sweet-${sweet.id}`}
                          className={`bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-all duration-300${highlightedItem === `sweet-${sweet.id}` ? ' ring-4 ring-black' : ''}`}
                        >
                          {/* Image */}
                          <div className="h-64 bg-gradient-to-br from-pink-300 to-purple-400 flex items-center justify-center relative overflow-hidden">
                            {sweet.image_url ? (
                              <Image 
                                src={sweet.image_url} 
                                alt={sweet.name}
                                fill
                                className="object-cover"
                              />
                            ) : (
                              <span className="text-white text-6xl">🍰</span>
                            )}
                            <button
                              onClick={() => handleShare('sweet', sweet.id, sweet.name, sweet.description)}
                              title="Compartilhar"
                              aria-label="Compartilhar"
                              className="absolute top-2 right-2 z-10 p-2 rounded-full bg-white/80 hover:bg-white transition-colors text-gray-600 shadow"
                            >
                              <ShareIcon />
                            </button>
                          </div>
                          
                          <div className="p-6">
                            <h3 className="text-xl font-bold text-brand-gray mb-2">
                              {sweet.name}
                            </h3>
                            {sweet.description && (
                              <p className="text-gray-600 mb-4 text-sm">
                                {sweet.description}
                              </p>
                            )}
                            {sweet.category && (
                              <p className="text-xs text-gray-500 mb-2">
                                Categoria: {sweet.category}
                              </p>
                            )}
                            <p className="text-xs text-gray-500 mb-4">
                              {sweet.quantity > 0 ? `Quantidade: ${sweet.quantity}` : 'Indisponível'}
                            </p>
                            
                            <div className="flex justify-between items-center">
                              <span className="text-2xl font-bold text-brand-yellow">
                                R$ {sweet.price.toFixed(2)}
                              </span>
                              <button
                                onClick={() => addItem({
                                  id: `sweet-${sweet.id}`,
                                  name: sweet.name,
                                  description: sweet.description || '',
                                  price: sweet.price,
                                  image: sweet.image_url
                                })}
                                disabled={sweet.quantity === 0}
                                className={`font-bold py-2 px-4 rounded-full transition-colors duration-300 ${
                                  sweet.quantity > 0
                                    ? 'bg-brand-yellow hover:bg-brand-yellow/90 text-white'
                                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                }`}
                              >
                                {sweet.quantity > 0 ? 'Adicionar ao Carrinho' : 'Indisponível'}
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Designs Tab Content */}
              {activeTab === 'designs' && (
                <div>
                  <div className="text-center mb-12">
                    <h2 className="text-3xl md:text-4xl font-bold text-brand-gray mb-4">
                      Design e Decoração
                    </h2>
                    <p className="text-lg text-gray-600">
                      Designs exclusivos para tornar sua festa única
                    </p>
                  </div>

                  {designs.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-gray-600 text-lg">Nenhum design disponível no momento.</p>
                    </div>
                  ) : filteredDesigns.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-gray-600 text-lg">Nenhum design encontrado para a busca.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                      {filteredDesigns.map((design) => (
                        <div 
                          key={design.id}
                          id={`design-${design.id}`}
                          className={`bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-all duration-300${highlightedItem === `design-${design.id}` ? ' ring-4 ring-black' : ''}`}
                        >
                          {/* Image */}
                          <div className="h-64 bg-gradient-to-br from-purple-400 to-indigo-500 flex items-center justify-center relative overflow-hidden">
                            {design.image_url ? (
                              <Image 
                                src={design.image_url} 
                                alt={design.name}
                                fill
                                className="object-cover"
                              />
                            ) : (
                              <span className="text-white text-6xl">🎨</span>
                            )}
                            <button
                              onClick={() => handleShare('design', design.id, design.name, design.description)}
                              title="Compartilhar"
                              aria-label="Compartilhar"
                              className="absolute top-2 right-2 z-10 p-2 rounded-full bg-white/80 hover:bg-white transition-colors text-gray-600 shadow"
                            >
                              <ShareIcon />
                            </button>
                          </div>
                          
                          <div className="p-6">
                            <h3 className="text-xl font-bold text-brand-gray mb-2">
                              {design.name}
                            </h3>
                            {design.description && (
                              <p className="text-gray-600 mb-4 text-sm">
                                {design.description}
                              </p>
                            )}
                            {design.category && (
                              <p className="text-xs text-gray-500 mb-4">
                                Categoria: {design.category}
                              </p>
                            )}
                            
                            <div className="flex justify-between items-center">
                              <span className="text-2xl font-bold text-brand-yellow">
                                R$ {design.price.toFixed(2)}
                              </span>
                              <button
                                onClick={() => addItem({
                                  id: `design-${design.id}`,
                                  name: design.name,
                                  description: design.description || '',
                                  price: design.price,
                                  image: design.image_url
                                })}
                                className="bg-brand-yellow hover:bg-brand-yellow/90 text-white font-bold py-2 px-4 rounded-full transition-colors duration-300"
                              >
                                Adicionar ao Carrinho
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Themes Tab Content */}
              {activeTab === 'themes' && (
                <div>
                  <div className="text-center mb-12">
                    <h2 className="text-3xl md:text-4xl font-bold text-brand-gray mb-4">
                      Temas para Festa
                    </h2>
                    <p className="text-lg text-gray-600">
                      Temas exclusivos para tornar sua festa inesquecível
                    </p>
                  </div>

                  {themes.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-gray-600 text-lg">Nenhum tema disponível no momento.</p>
                    </div>
                  ) : filteredThemes.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-gray-600 text-lg">Nenhum tema encontrado para a busca.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                      {filteredThemes.map((theme) => (
                        <div
                          key={theme.id}
                          id={`theme-${theme.id}`}
                          className={`bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-all duration-300${highlightedItem === `theme-${theme.id}` ? ' ring-4 ring-black' : ''}`}
                        >
                          <div className="h-64 bg-gradient-to-br from-pink-400 to-red-500 flex items-center justify-center relative overflow-hidden">
                            {theme.image_url ? (
                              <Image
                                src={theme.image_url}
                                alt={theme.name}
                                fill
                                className="object-cover"
                              />
                            ) : (
                              <span className="text-white text-6xl">🎭</span>
                            )}
                            <button
                              onClick={() => handleShare('theme', theme.id, theme.name, theme.description)}
                              title="Compartilhar"
                              aria-label="Compartilhar"
                              className="absolute top-2 right-2 z-10 p-2 rounded-full bg-white/80 hover:bg-white transition-colors text-gray-600 shadow"
                            >
                              <ShareIcon />
                            </button>
                          </div>

                          <div className="p-6">
                            <h3 className="text-xl font-bold text-brand-gray mb-2">
                              {theme.name}
                            </h3>
                            {theme.description && (
                              <p className="text-gray-600 mb-4 text-sm">
                                {theme.description}
                              </p>
                            )}
                            {theme.category && (
                              <p className="text-xs text-gray-500 mb-4">
                                Categoria: {theme.category}
                              </p>
                            )}
                            <div className="flex flex-col items-end gap-1">
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => addItem({
                                    id: `theme-${theme.id}`,
                                    name: theme.name,
                                    description: theme.description || '',
                                    price: theme.price || 0,
                                    image: theme.image_url
                                  })}
                                  className="bg-brand-yellow hover:bg-brand-yellow/90 text-white font-bold py-2 px-4 rounded-full transition-colors duration-300"
                                >
                                  Adicionar ao Carrinho
                                </button>
                              </div>
                              <span className="text-xs text-gray-400">Preço sob consulta</span>
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