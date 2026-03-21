'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import Image from 'next/image'

// ─── Types ────────────────────────────────────────────────────────────────────

interface PortfolioImage {
  id: number
  title: string
  description?: string
  image_url: string
  display_order: number
  image_size?: string
}

interface CatalogItem {
  id: number
  name: string
  description?: string
  price: number
  image_url?: string
  is_active?: number
  type: 'kit' | 'sweet' | 'theme' | 'item'
  badge?: 'Mais vendido' | 'Promoção' | 'Novo'
}

interface Testimonial {
  id: number
  name: string
  comment: string
  stars: number
  theme?: string
}

// ─── Static testimonials ──────────────────────────────────────────────────────

const TESTIMONIALS: Testimonial[] = [
  { id: 1, name: 'Ana Carla', stars: 5, theme: 'Tema Unicórnio', comment: 'A festa da minha filha ficou incrível! Os detalhes eram lindos e a equipe super atenciosa. Já indico para todas as amigas!' },
  { id: 2, name: 'Rodrigo Melo', stars: 5, theme: 'Festa Safari', comment: 'Superou todas as expectativas. Os kits chegaram perfeitos e a montagem foi rápida. Profissionalismo de primeira!' },
  { id: 3, name: 'Fernanda Lima', stars: 5, theme: 'Tema Barbie', comment: 'Minha sobrinha amou cada detalhe! As cores combinaram perfeitamente e os doces personalizados foram os mais elogiados.' },
  { id: 4, name: 'Juliana Costa', stars: 5, theme: 'Festa Junina', comment: 'Atendimento incrível desde o primeiro contato. Prazo cumprido e qualidade impecável. Com certeza voltarei!' },
]

// ─── Star rating ──────────────────────────────────────────────────────────────

function Stars({ count }: { count: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <svg key={i} className={`w-4 h-4 ${i < count ? 'text-yellow-400' : 'text-gray-200'}`} fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  )
}

// ─── Product card ─────────────────────────────────────────────────────────────

function ProductCard({ item }: { item: CatalogItem }) {
  const BADGE_STYLES: Record<string, string> = {
    'Mais vendido': 'bg-rose-500 text-white',
    'Promoção': 'bg-amber-400 text-white',
    'Novo': 'bg-emerald-500 text-white',
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow group">
      <div className="relative h-48 bg-gradient-to-br from-pink-50 to-rose-50">
        {item.image_url ? (
          <Image src={item.image_url} alt={item.name} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-5xl">
            {item.type === 'kit' ? '🎉' : item.type === 'sweet' ? '🍭' : item.type === 'theme' ? '✨' : '🎈'}
          </div>
        )}
        {item.badge && (
          <span className={`absolute top-2 left-2 text-xs font-bold px-2 py-0.5 rounded-full ${BADGE_STYLES[item.badge] ?? 'bg-gray-500 text-white'}`}>
            {item.badge}
          </span>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-gray-800 text-sm leading-snug line-clamp-2 mb-1">{item.name}</h3>
        {item.description && (
          <p className="text-xs text-gray-500 line-clamp-2 mb-2">{item.description}</p>
        )}
        <div className="flex items-center justify-between mt-3">
          {item.price > 0 ? (
            <span className="text-rose-600 font-bold text-base">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.price)}
            </span>
          ) : (
            <span className="text-gray-400 text-sm">Sob consulta</span>
          )}
          <a href="/catalog" className="text-xs font-semibold bg-rose-500 hover:bg-rose-600 text-white px-3 py-1.5 rounded-lg transition-colors">
            Ver detalhes
          </a>
        </div>
      </div>
    </div>
  )
}

// Minimal shape we need from any catalog API response item
interface ApiItem {
  id: number
  name: string
  description?: string
  price?: number
  image_url?: string
}


export default function Home() {
  const [portfolioImages, setPortfolioImages] = useState<PortfolioImage[]>([])
  const [catalogItems, setCatalogItems] = useState<CatalogItem[]>([])
  const [loadingPortfolio, setLoadingPortfolio] = useState(true)
  const [loadingCatalog, setLoadingCatalog] = useState(true)
  const [lightbox, setLightbox] = useState<PortfolioImage | null>(null)
  const [catalogTab, setCatalogTab] = useState<'all' | 'kit' | 'sweet' | 'theme'>('all')
  const [portfolioLimit, setPortfolioLimit] = useState(8)
  const carouselRef = useRef<HTMLDivElement>(null)

  const closeLightbox = useCallback(() => setLightbox(null), [])

  // Close lightbox on Escape
  useEffect(() => {
    if (!lightbox) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeLightbox() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [lightbox, closeLightbox])

  // Load portfolio
  useEffect(() => {
    fetch('/api/portfolio?activeOnly=true')
      .then(r => r.ok ? r.json() : [])
      .then((data: unknown) => setPortfolioImages(data as PortfolioImage[]))
      .catch(() => setPortfolioImages([]))
      .finally(() => setLoadingPortfolio(false))
  }, [])

  // Load catalog (kits + sweets + themes)
  useEffect(() => {
    const assigns: Array<{ type: CatalogItem['type'], badges?: string[] }> = [
      { type: 'kit', badges: ['Mais vendido'] },
      { type: 'sweet', badges: ['Promoção'] },
      { type: 'theme', badges: ['Novo'] },
    ]
    const urls = [
      '/api/kits?activeOnly=true',
      '/api/sweets?catalog=true',
      '/api/themes?catalog=true',
    ]

    Promise.allSettled(urls.map(u => fetch(u).then(r => r.ok ? r.json() : [])))
      .then(results => {
        const combined: CatalogItem[] = []
        results.forEach((result, idx) => {
          if (result.status !== 'fulfilled') return
          const items = Array.isArray(result.value) ? result.value : []
          items.slice(0, 12).forEach((item: ApiItem, i: number) => {
            combined.push({
              id: item.id,
              name: item.name,
              description: item.description,
              price: item.price ?? 0,
              image_url: item.image_url,
              type: assigns[idx].type,
              badge: i < 2 ? assigns[idx].badges?.[0] as CatalogItem['badge'] : undefined,
            })
          })
        })
        setCatalogItems(combined)
      })
      .finally(() => setLoadingCatalog(false))
  }, [])

  const filteredCatalog = catalogTab === 'all'
    ? catalogItems
    : catalogItems.filter(i => i.type === catalogTab)

  // "Mais pedidos" = items with a badge
  const highlighted = catalogItems.filter(i => i.badge)

  const scrollCarousel = (dir: 'left' | 'right') => {
    carouselRef.current?.scrollBy({ left: dir === 'right' ? 300 : -300, behavior: 'smooth' })
  }

  const displayedPortfolio = portfolioImages.slice(0, portfolioLimit)
  const hasMorePortfolio = portfolioImages.length > portfolioLimit

  return (
    <div className="min-h-screen bg-white">

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-rose-400 via-pink-400 to-amber-300 py-24 px-4">
        {/* decorative circles */}
        <div className="absolute -top-20 -left-20 w-96 h-96 rounded-full bg-white/10 pointer-events-none" />
        <div className="absolute -bottom-32 -right-20 w-[500px] h-[500px] rounded-full bg-white/10 pointer-events-none" />
        <div className="relative max-w-5xl mx-auto text-center">
          <span className="inline-block bg-white/20 backdrop-blur text-white text-sm font-semibold px-4 py-1 rounded-full mb-6">
            🎉 Kits personalizados para toda ocasião
          </span>
          <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-5 drop-shadow-sm leading-tight">
            Sua festa pronta,<br className="hidden md:block" /> sem dor de cabeça
          </h1>
          <p className="text-lg md:text-2xl text-white/90 mb-10 max-w-2xl mx-auto">
            Kits personalizados, doces e temas para qualquer ocasião
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="/catalog"
              className="inline-block bg-white text-rose-500 font-bold py-4 px-9 rounded-full hover:bg-rose-50 transition shadow-lg shadow-rose-700/20 text-base">
              Ver Catálogo
            </a>
            <a href="#portfolio"
              className="inline-block border-2 border-white text-white font-bold py-4 px-9 rounded-full hover:bg-white/10 transition text-base">
              Ver Portfólio
            </a>
          </div>
        </div>
      </section>

      {/* ── Portfolio ────────────────────────────────────────────────── */}
      <section id="portfolio" className="py-20 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-rose-400 font-semibold text-sm uppercase tracking-widest">Nosso trabalho</span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mt-2 mb-3">Portfólio</h2>
            <p className="text-gray-500 max-w-xl mx-auto">Veja fotos reais de festas que realizamos com amor e dedicação</p>
          </div>

          {loadingPortfolio ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-rose-400" />
            </div>
          ) : portfolioImages.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <p className="text-5xl mb-4">📷</p>
              <p>Em breve adicionaremos fotos dos nossos trabalhos!</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {displayedPortfolio.map(image => (
                  <div key={image.id}
                    className="relative aspect-square rounded-2xl overflow-hidden cursor-pointer group shadow-sm hover:shadow-lg transition-shadow"
                    onClick={() => setLightbox(image)}
                  >
                    <Image src={image.image_url} alt={image.title} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                      <p className="text-white text-sm font-semibold line-clamp-2">{image.title}</p>
                    </div>
                  </div>
                ))}
              </div>
              {hasMorePortfolio && (
                <div className="text-center mt-10">
                  <button onClick={() => setPortfolioLimit(p => p + 8)}
                    className="inline-block border-2 border-rose-400 text-rose-500 font-bold py-3 px-8 rounded-full hover:bg-rose-50 transition">
                    Ver mais trabalhos
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* ── Catalog ──────────────────────────────────────────────────── */}
      <section id="catalogo" className="py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10">
            <span className="text-rose-400 font-semibold text-sm uppercase tracking-widest">Produtos</span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mt-2 mb-3">Catálogo de Produtos</h2>
            <p className="text-gray-500 max-w-xl mx-auto">Kits completos, doces personalizados e temas exclusivos para a sua festa</p>
          </div>

          {/* Tab filters */}
          <div className="flex gap-2 justify-center flex-wrap mb-10">
            {([
              { key: 'all', label: 'Todos' },
              { key: 'kit', label: '🎉 Kits' },
              { key: 'sweet', label: '🍭 Doces' },
              { key: 'theme', label: '✨ Temas' },
            ] as const).map(tab => (
              <button key={tab.key} onClick={() => setCatalogTab(tab.key)}
                className={`px-5 py-2 rounded-full text-sm font-semibold transition-colors ${
                  catalogTab === tab.key
                    ? 'bg-rose-500 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-rose-50 hover:text-rose-500'
                }`}>
                {tab.label}
              </button>
            ))}
          </div>

          {loadingCatalog ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-rose-400" />
            </div>
          ) : filteredCatalog.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <p className="text-5xl mb-4">🎈</p>
              <p>Nenhum produto encontrado nesta categoria</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredCatalog.map(item => (
                <ProductCard key={`${item.type}-${item.id}`} item={item} />
              ))}
            </div>
          )}

          <div className="text-center mt-10">
            <a href="/catalog"
              className="inline-block bg-rose-500 hover:bg-rose-600 text-white font-bold py-3.5 px-10 rounded-full transition shadow-lg shadow-rose-500/25">
              Ver catálogo completo
            </a>
          </div>
        </div>
      </section>

      {/* ── Highlights carousel ───────────────────────────────────────── */}
      {highlighted.length > 0 && (
        <section className="py-20 px-4 bg-gradient-to-br from-rose-50 to-pink-50">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-10">
              <span className="text-rose-400 font-semibold text-sm uppercase tracking-widest">🔥 Em destaque</span>
              <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mt-2 mb-3">Mais pedidos</h2>
            </div>
            <div className="relative">
              <button onClick={() => scrollCarousel('left')}
                className="hidden md:flex absolute -left-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white rounded-full shadow-md items-center justify-center hover:bg-gray-50 transition">
                ‹
              </button>
              <div ref={carouselRef} className="flex gap-4 overflow-x-auto pb-2 scroll-smooth snap-x snap-mandatory" style={{ scrollbarWidth: 'none' }}>
                {highlighted.map(item => (
                  <div key={`h-${item.type}-${item.id}`} className="snap-start flex-shrink-0 w-56 sm:w-64">
                    <ProductCard item={item} />
                  </div>
                ))}
              </div>
              <button onClick={() => scrollCarousel('right')}
                className="hidden md:flex absolute -right-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white rounded-full shadow-md items-center justify-center hover:bg-gray-50 transition">
                ›
              </button>
            </div>
          </div>
        </section>
      )}

      {/* ── Testimonials ─────────────────────────────────────────────── */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-rose-400 font-semibold text-sm uppercase tracking-widest">❤️ Clientes satisfeitos</span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mt-2 mb-3">O que dizem sobre nós</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {TESTIMONIALS.map(t => (
              <div key={t.id} className="bg-gray-50 rounded-2xl p-6 border border-gray-100 hover:shadow-md transition-shadow">
                <Stars count={t.stars} />
                <p className="mt-3 text-gray-600 text-sm leading-relaxed">&ldquo;{t.comment}&rdquo;</p>
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="font-bold text-gray-800 text-sm">{t.name}</p>
                  {t.theme && <p className="text-xs text-rose-400 mt-0.5">{t.theme}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ────────────────────────────────────────────────── */}
      <section id="contato" className="py-20 px-4 bg-gradient-to-br from-rose-500 via-pink-500 to-amber-400">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-5">
            Pronto para montar sua festa?
          </h2>
          <p className="text-white/85 text-lg mb-8 max-w-xl mx-auto">
            Escolha entre nossos kits exclusivos, doces personalizados e temas encantadores
          </p>
          <a href="/catalog"
            className="inline-block bg-white text-rose-500 font-bold py-4 px-10 rounded-full hover:bg-rose-50 transition shadow-xl shadow-rose-700/25 text-base">
            Ver catálogo completo
          </a>
        </div>
      </section>

      {/* ── Lightbox ─────────────────────────────────────────────────── */}
      {lightbox && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onClick={closeLightbox}>
          <div className="relative max-w-4xl w-full max-h-[90vh]" onClick={e => e.stopPropagation()}>
            <button onClick={closeLightbox}
              className="absolute -top-10 right-0 text-white text-3xl leading-none hover:text-gray-300 transition-colors" aria-label="Fechar">
              ✕
            </button>
            <div className="relative w-full" style={{ aspectRatio: '4/3' }}>
              <Image src={lightbox.image_url} alt={lightbox.title} fill className="object-contain rounded-2xl" sizes="(max-width: 896px) 100vw, 896px" />
            </div>
            {(lightbox.title || lightbox.description) && (
              <div className="bg-white rounded-b-2xl px-6 py-4">
                <h3 className="text-lg font-bold text-gray-900">{lightbox.title}</h3>
                {lightbox.description && <p className="text-gray-500 text-sm mt-1">{lightbox.description}</p>}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
