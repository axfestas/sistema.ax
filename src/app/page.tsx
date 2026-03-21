'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'

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
  original_price?: number
  image_url?: string
  is_active?: number
  is_featured?: number
  is_promotion?: number
  created_at?: string
  type: 'kit' | 'sweet' | 'theme' | 'item'
}

interface Testimonial {
  id: number
  name: string
  comment: string
  stars: number
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CATALOG_PAGE_SIZE = 8

// ─── Star rating ──────────────────────────────────────────────────────────────

function Stars({ count, interactive = false, onChange = () => {} }: { count: number; interactive?: boolean; onChange?: (n: number) => void }) {
  const [hovered, setHovered] = useState(0)
  const display = interactive ? (hovered || count) : count
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <svg
          key={i}
          className={`w-5 h-5 ${i < display ? 'text-yellow-400' : 'text-gray-200'} ${interactive ? 'cursor-pointer' : ''}`}
          fill="currentColor"
          viewBox="0 0 20 20"
          onMouseEnter={() => interactive && setHovered(i + 1)}
          onMouseLeave={() => interactive && setHovered(0)}
          onClick={() => interactive && onChange(i + 1)}
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isNewItem(createdAt?: string): boolean {
  if (!createdAt) return false
  const created = new Date(
    typeof createdAt === 'string' && /^\d+$/.test(createdAt)
      ? Number(createdAt) * 1000
      : createdAt
  )
  if (isNaN(created.getTime())) return false
  return (Date.now() - created.getTime()) / (1000 * 60 * 60 * 24) <= 7
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

// ─── Product card ─────────────────────────────────────────────────────────────

function ProductCard({ item }: { item: CatalogItem }) {
  const showNew = isNewItem(item.created_at)
  const showFeatured = item.is_featured === 1
  const showPromo = item.is_promotion === 1 && item.original_price != null && item.original_price > item.price

  return (
    <Link
      href={`/produto?type=${item.type}&id=${item.id}`}
      className="block bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-200 group cursor-pointer"
    >
      {/* Image */}
      <div className="relative h-48 bg-gradient-to-br from-blue-50 to-indigo-50">
        {item.image_url ? (
          <Image
            src={item.image_url}
            alt={item.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-5xl">
            {item.type === 'kit' ? '🎉' : item.type === 'sweet' ? '🍭' : item.type === 'theme' ? '✨' : '🎈'}
          </div>
        )}

        {/* Tags */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {showFeatured && (
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-yellow-400 text-gray-900 shadow-sm">
              🔥 Em destaque
            </span>
          )}
          {showPromo && (
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-500 text-white shadow-sm">
              💸 Promoção
            </span>
          )}
          {showNew && !showFeatured && !showPromo && (
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-500 text-white shadow-sm">
              🆕 Novo
            </span>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="p-4">
        <h3 className="font-semibold text-gray-800 text-sm leading-snug line-clamp-2 mb-2">
          {item.name}
        </h3>
        <div>
          {showPromo && item.original_price != null ? (
            <div>
              <span className="text-gray-400 text-xs line-through block">
                {formatCurrency(item.original_price)}
              </span>
              <span className="text-blue-600 font-bold text-base">
                {formatCurrency(item.price)}
              </span>
            </div>
          ) : item.price > 0 ? (
            <span className="text-blue-600 font-bold text-base">
              {formatCurrency(item.price)}
            </span>
          ) : (
            <span className="text-gray-400 text-sm">Sob consulta</span>
          )}
        </div>
      </div>
    </Link>
  )
}

// Minimal shape we need from any catalog API response item
interface ApiItem {
  id: number
  name: string
  description?: string
  price?: number
  image_url?: string
  is_featured?: number
  is_promotion?: number
  original_price?: number
  created_at?: string
}

// ─── Review form modal ────────────────────────────────────────────────────────

function ReviewModal({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState('')
  const [stars, setStars] = useState(0)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (stars === 0) { setError('Selecione uma avaliação de 1 a 5 estrelas.'); return }
    if (!name.trim()) { setError('Informe seu nome.'); return }
    if (!comment.trim()) { setError('Escreva um comentário.'); return }

    setSubmitting(true)
    try {
      const res = await fetch('/api/testimonials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), stars, comment: comment.trim() }),
      })
      if (res.ok) {
        setSubmitted(true)
      } else {
        const data = await res.json() as { error?: string }
        setError(data.error || 'Erro ao enviar avaliação.')
      }
    } catch {
      setError('Erro de conexão. Tente novamente.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
        {submitted ? (
          <div className="text-center py-6">
            <p className="text-4xl mb-3">🎉</p>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Obrigado pela avaliação!</h3>
            <p className="text-gray-500 text-sm mb-5">Sua avaliação será analisada e publicada em breve.</p>
            <button onClick={onClose} className="bg-blue-500 hover:bg-blue-600 text-white font-bold px-6 py-2.5 rounded-full transition">Fechar</button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-xl font-bold text-gray-900">Deixar avaliação</h3>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none" aria-label="Fechar">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Nome *</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                  placeholder="Seu nome"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Avaliação *</label>
                <Stars count={stars} interactive onChange={setStars} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Comentário *</label>
                <textarea
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  rows={3}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none"
                  placeholder="Conte como foi sua experiência..."
                  required
                />
              </div>
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white font-bold py-3 rounded-full transition"
              >
                {submitting ? 'Enviando...' : 'Enviar avaliação'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function Home() {
  const [portfolioImages, setPortfolioImages] = useState<PortfolioImage[]>([])
  const [catalogItems, setCatalogItems] = useState<CatalogItem[]>([])
  const [testimonials, setTestimonials] = useState<Testimonial[]>([])
  const [loadingPortfolio, setLoadingPortfolio] = useState(true)
  const [loadingCatalog, setLoadingCatalog] = useState(true)
  const [lightbox, setLightbox] = useState<PortfolioImage | null>(null)
  const [catalogTab, setCatalogTab] = useState<'all' | 'kit' | 'sweet' | 'theme'>('all')
  const [portfolioLimit, setPortfolioLimit] = useState(8)
  const [catalogVisible, setCatalogVisible] = useState(CATALOG_PAGE_SIZE)
  const [showReviewModal, setShowReviewModal] = useState(false)
  const featuredCarouselRef = useRef<HTMLDivElement>(null)

  const closeLightbox = useCallback(() => setLightbox(null), [])

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

  // Load ALL catalog items (no per-type limit)
  useEffect(() => {
    const sources: Array<{ type: CatalogItem['type']; url: string }> = [
      { type: 'kit', url: '/api/kits?activeOnly=true' },
      { type: 'sweet', url: '/api/sweets?catalog=true' },
      { type: 'theme', url: '/api/themes?catalog=true' },
    ]

    Promise.allSettled(sources.map(s => fetch(s.url).then(r => r.ok ? r.json() : [])))
      .then(results => {
        const combined: CatalogItem[] = []
        results.forEach((result, idx) => {
          if (result.status !== 'fulfilled') return
          const items = Array.isArray(result.value) ? result.value : []
          items.forEach((item: ApiItem) => {
            combined.push({
              id: item.id,
              name: item.name,
              description: item.description,
              price: item.price ?? 0,
              original_price: item.original_price,
              image_url: item.image_url,
              type: sources[idx].type,
              is_featured: item.is_featured,
              is_promotion: item.is_promotion,
              created_at: item.created_at,
            })
          })
        })
        setCatalogItems(combined)
      })
      .finally(() => setLoadingCatalog(false))
  }, [])

  // Load approved testimonials
  useEffect(() => {
    fetch('/api/testimonials')
      .then(r => r.ok ? r.json() : [])
      .then((data: unknown) => setTestimonials(data as Testimonial[]))
      .catch(() => setTestimonials([]))
  }, [])

  const filteredCatalog = catalogTab === 'all'
    ? catalogItems
    : catalogItems.filter(i => i.type === catalogTab)

  const visibleCatalog = filteredCatalog.slice(0, catalogVisible)
  const hasMoreCatalog = filteredCatalog.length > catalogVisible

  // Featured items (manual flag)
  const featuredItems = catalogItems.filter(i => i.is_featured === 1)

  const scrollFeatured = (dir: 'left' | 'right') => {
    featuredCarouselRef.current?.scrollBy({ left: dir === 'right' ? 300 : -300, behavior: 'smooth' })
  }

  const displayedPortfolio = portfolioImages.slice(0, portfolioLimit)
  const hasMorePortfolio = portfolioImages.length > portfolioLimit

  // Reset visible count when tab changes
  const handleTabChange = (tab: typeof catalogTab) => {
    setCatalogTab(tab)
    setCatalogVisible(CATALOG_PAGE_SIZE)
  }

  return (
    <div className="min-h-screen bg-white">

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-500 to-violet-500 py-24 px-4">
        <div className="absolute -top-20 -left-20 w-96 h-96 rounded-full bg-white/10 pointer-events-none" />
        <div className="absolute -bottom-32 -right-20 w-[500px] h-[500px] rounded-full bg-white/10 pointer-events-none" />
        <div className="relative max-w-5xl mx-auto text-center">
          <span className="inline-block bg-white/20 backdrop-blur text-white text-sm font-semibold px-4 py-1 rounded-full mb-6">
            🎉 Kits personalizados para toda ocasião
          </span>
          <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-10 drop-shadow-sm leading-tight">
            Aqui seu sonho<br className="hidden md:block" /> vira realidade
          </h1>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="/#catalogo"
              className="inline-block bg-white text-blue-500 font-bold py-4 px-9 rounded-full hover:bg-blue-50 transition shadow-lg shadow-blue-700/20 text-base">
              Ver Catálogo
            </a>
            <a href="#portfolio"
              className="inline-block border-2 border-white text-white font-bold py-4 px-9 rounded-full hover:bg-white/10 transition text-base">
              Ver Portfólio
            </a>
          </div>
        </div>
      </section>

      {/* ── Catalog ──────────────────────────────────────────────────── */}
      <section id="catalogo" className="py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10">
            <span className="text-blue-400 font-semibold text-sm uppercase tracking-widest">Produtos</span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mt-2 mb-3">Catálogo de Produtos</h2>
            <p className="text-gray-500 max-w-xl mx-auto">Kits completos, doces personalizados e temas exclusivos para a sua festa</p>
          </div>

          {/* ── Featured sub-section ──────────────────────────────── */}
          {featuredItems.length > 0 && (
            <div className="mb-12">
              <div className="flex items-center gap-2 mb-5">
                <h3 className="text-xl font-extrabold text-gray-900">🔥 Em destaque</h3>
              </div>
              <div className="relative">
                <button onClick={() => scrollFeatured('left')}
                  className="hidden md:flex absolute -left-4 top-1/2 -translate-y-1/2 z-10 w-9 h-9 bg-white rounded-full shadow-md items-center justify-center hover:bg-gray-50 transition text-lg leading-none">
                  ‹
                </button>
                <div
                  ref={featuredCarouselRef}
                  className="flex gap-4 overflow-x-auto pb-2 scroll-smooth snap-x snap-mandatory"
                  style={{ scrollbarWidth: 'none' }}
                >
                  {featuredItems.map(item => (
                    <div key={`f-${item.type}-${item.id}`} className="snap-start flex-shrink-0 w-48 sm:w-56">
                      <ProductCard item={item} />
                    </div>
                  ))}
                </div>
                <button onClick={() => scrollFeatured('right')}
                  className="hidden md:flex absolute -right-4 top-1/2 -translate-y-1/2 z-10 w-9 h-9 bg-white rounded-full shadow-md items-center justify-center hover:bg-gray-50 transition text-lg leading-none">
                  ›
                </button>
              </div>
              <hr className="mt-10 border-gray-100" />
            </div>
          )}

          {/* Tab filters */}
          <div className="flex gap-2 justify-center flex-wrap mb-10">
            {([
              { key: 'all', label: 'Todos' },
              { key: 'kit', label: '🎉 Kits' },
              { key: 'sweet', label: '🍭 Doces' },
              { key: 'theme', label: '✨ Temas' },
            ] as const).map(tab => (
              <button key={tab.key} onClick={() => handleTabChange(tab.key)}
                className={`px-5 py-2 rounded-full text-sm font-semibold transition-colors ${
                  catalogTab === tab.key
                    ? 'bg-blue-500 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-blue-50 hover:text-blue-500'
                }`}>
                {tab.label}
              </button>
            ))}
          </div>

          {loadingCatalog ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-blue-400" />
            </div>
          ) : filteredCatalog.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <p className="text-5xl mb-4">��</p>
              <p>Nenhum produto encontrado nesta categoria</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {visibleCatalog.map(item => (
                  <ProductCard key={`${item.type}-${item.id}`} item={item} />
                ))}
              </div>

              {hasMoreCatalog && (
                <div className="text-center mt-10">
                  <button
                    onClick={() => setCatalogVisible(v => v + CATALOG_PAGE_SIZE)}
                    className="inline-block border-2 border-blue-400 text-blue-500 font-bold py-3 px-8 rounded-full hover:bg-blue-50 transition"
                  >
                    Ver mais produtos ({filteredCatalog.length - catalogVisible} restantes)
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* ── Portfolio ────────────────────────────────────────────────── */}
      <section id="portfolio" className="py-20 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-blue-400 font-semibold text-sm uppercase tracking-widest">Nosso trabalho</span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mt-2 mb-3">Portfólio</h2>
            <p className="text-gray-500 max-w-xl mx-auto">Veja fotos reais de festas que realizamos com amor e dedicação</p>
          </div>

          {loadingPortfolio ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-blue-400" />
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
                    className="inline-block border-2 border-blue-400 text-blue-500 font-bold py-3 px-8 rounded-full hover:bg-blue-50 transition">
                    Ver mais trabalhos
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* ── Testimonials ─────────────────────────────────────────────── */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-blue-400 font-semibold text-sm uppercase tracking-widest">❤️ Clientes satisfeitos</span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mt-2 mb-3">O que dizem sobre nós</h2>
          </div>

          {testimonials.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <p className="text-4xl mb-3">💬</p>
              <p>Seja o primeiro a avaliar!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
              {testimonials.map(t => (
                <div key={t.id} className="bg-gray-50 rounded-2xl p-6 border border-gray-100 hover:shadow-md transition-shadow">
                  <Stars count={t.stars} />
                  <p className="mt-3 text-gray-600 text-sm leading-relaxed">&ldquo;{t.comment}&rdquo;</p>
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <p className="font-bold text-gray-800 text-sm">{t.name}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="text-center mt-8">
            <button
              onClick={() => setShowReviewModal(true)}
              className="inline-block bg-blue-500 hover:bg-blue-600 text-white font-bold py-3.5 px-8 rounded-full transition shadow-lg shadow-blue-500/25"
            >
              💬 Deixar avaliação
            </button>
          </div>
        </div>
      </section>

      {/* ── Final CTA ────────────────────────────────────────────────── */}
      <section id="contato" className="py-20 px-4 bg-gradient-to-br from-blue-700 via-blue-600 to-violet-600">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-5">
            Pronto para montar sua festa?
          </h2>
          <p className="text-white/85 text-lg mb-8 max-w-xl mx-auto">
            Escolha entre nossos kits exclusivos, doces personalizados e temas encantadores
          </p>
          <a href="/#catalogo"
            className="inline-block bg-white text-blue-500 font-bold py-4 px-10 rounded-full hover:bg-blue-50 transition shadow-xl shadow-blue-700/25 text-base">
            Ver catálogo
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

      {/* ── Review modal ──────────────────────────────────────────────── */}
      {showReviewModal && <ReviewModal onClose={() => setShowReviewModal(false)} />}
    </div>
  )
}
