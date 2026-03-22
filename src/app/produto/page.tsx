'use client'

import { useEffect, useState, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Suspense } from 'react'
import { useCart } from '@/components/CartContext'
import { useToast } from '@/hooks/useToast'

// ─── Types ────────────────────────────────────────────────────────────────────

interface KitItem {
  id: number
  item_id: number
  item_name: string
  quantity: number
}

interface Product {
  id: number
  name: string
  description?: string
  price?: number
  original_price?: number
  image_url?: string
  category?: string
  is_featured?: number
  is_promotion?: number
  created_at?: string
  // kit-specific
  items?: KitItem[]
}

interface RelatedItem {
  id: number
  name: string
  price?: number
  image_url?: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isNewItem(createdAt?: string): boolean {
  if (!createdAt) return false
  const val = String(createdAt)
  const created = new Date(/^\d+$/.test(val) ? Number(val) * 1000 : val)
  if (isNaN(created.getTime())) return false
  return (Date.now() - created.getTime()) / (1000 * 60 * 60 * 24) <= 7
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

const TYPE_LABELS: Record<string, string> = {
  kit: 'Kit',
  sweet: 'Doce',
  theme: 'Tema',
  item: 'Item',
  design: 'Design',
}

const TYPE_EMOJI: Record<string, string> = {
  kit: '🎁',
  sweet: '🍰',
  theme: '🎭',
  item: '📦',
  design: '🎨',
}

function buildApiUrl(type: string, id: string): string {
  switch (type) {
    case 'kit': return `/api/kits?id=${id}`
    case 'sweet': return `/api/sweets?id=${id}`
    case 'theme': return `/api/themes?id=${id}`
    case 'item': return `/api/items?id=${id}`
    case 'design': return `/api/designs?id=${id}`
    default: return ''
  }
}

function buildListApiUrl(type: string): string {
  switch (type) {
    case 'kit': return `/api/kits?activeOnly=true`
    case 'sweet': return `/api/sweets?catalog=true`
    case 'theme': return `/api/themes?catalog=true`
    case 'item': return `/api/items?catalogOnly=true`
    case 'design': return `/api/designs?catalog=true`
    default: return ''
  }
}

// ─── Inner component (uses useSearchParams) ───────────────────────────────────

function ProductDetail() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const type = searchParams?.get('type') ?? ''
  const id = searchParams?.get('id') ?? ''

  const [product, setProduct] = useState<Product | null>(null)
  const [relatedItems, setRelatedItems] = useState<RelatedItem[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const { addItem } = useCart()
  const { showSuccess } = useToast()

  const fetchProduct = useCallback(async () => {
    if (!type || !id) { setNotFound(true); setLoading(false); return }
    const url = buildApiUrl(type, id)
    if (!url) { setNotFound(true); setLoading(false); return }

    try {
      const res = await fetch(url)
      if (!res.ok) { setNotFound(true); return }
      const data = await res.json() as Product
      if (!data || !data.id) { setNotFound(true); return }
      setProduct(data)
    } catch {
      setNotFound(true)
    } finally {
      setLoading(false)
    }
  }, [type, id])

  useEffect(() => { fetchProduct() }, [fetchProduct])

  // Load related items of the same type
  useEffect(() => {
    if (!type || !id) return
    const listUrl = buildListApiUrl(type)
    if (!listUrl) return
    fetch(listUrl)
      .then(r => r.ok ? r.json() : [])
      .then((data: unknown) => {
        const items = Array.isArray(data) ? (data as RelatedItem[]) : []
        setRelatedItems(items.filter(i => String(i.id) !== id).slice(0, 6))
      })
      .catch(() => {})
  }, [type, id])

  const handleAddToCart = () => {
    if (!product) return
    addItem({
      id: `${type}-${product.id}`,
      name: product.name,
      description: product.description || '',
      price: product.price ?? 0,
      image: product.image_url,
    })
    showSuccess(`${product.name} adicionado ao carrinho!`)
  }

  const handleShare = async () => {
    const url = window.location.href
    if (navigator.share) {
      try {
        await navigator.share({
          title: product?.name ?? 'Ax Festas',
          text: product?.description ?? '',
          url,
        })
      } catch {
        // user cancelled – no-op
      }
    } else {
      await navigator.clipboard.writeText(url)
      showSuccess('Link copiado!')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-yellow" />
      </div>
    )
  }

  if (notFound || !product) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4">
        <p className="text-6xl mb-4">🔍</p>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Produto não encontrado</h1>
        <p className="text-gray-500 mb-6">O produto que você procura não existe ou foi removido.</p>
        <Link href="/#catalogo" className="bg-brand-yellow hover:bg-yellow-400 text-brand-gray font-bold px-6 py-3 rounded-full transition">
          ← Voltar ao catálogo
        </Link>
      </div>
    )
  }

  const showNew = isNewItem(product.created_at)
  const showFeatured = product.is_featured === 1
  const showPromo = product.is_promotion === 1 && product.original_price != null && product.original_price > (product.price ?? 0)
  const typeLabel = TYPE_LABELS[type] || 'Produto'
  const typeEmoji = TYPE_EMOJI[type] || '🎁'
  const hasPrice = product.price != null && product.price > 0

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Back button */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-brand-yellow transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Voltar
          </button>
          {/* Share button */}
          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-brand-yellow transition-colors"
            title="Compartilhar"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            Compartilhar
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-0">

            {/* ── Image ────────────────────────────────────────────── */}
            <div className="relative min-h-72 md:min-h-[480px] bg-gradient-to-br from-yellow-50 to-amber-50">
              {product.image_url ? (
                <Image
                  src={product.image_url}
                  alt={product.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                  priority
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-8xl">{typeEmoji}</span>
                </div>
              )}

              {/* Tags */}
              <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                {showFeatured && (
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-brand-yellow text-brand-gray shadow">
                    🔥 Em destaque
                  </span>
                )}
                {showPromo && (
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-brand-blue text-white shadow">
                    💸 Promoção
                  </span>
                )}
                {showNew && (
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-500 text-white shadow">
                    🆕 Novo
                  </span>
                )}
              </div>
            </div>

            {/* ── Details ──────────────────────────────────────────── */}
            <div className="p-6 md:p-8 flex flex-col">
              {/* Category label */}
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs font-semibold uppercase tracking-widest text-brand-yellow">
                  {typeLabel}
                </span>
                {product.category && (
                  <>
                    <span className="text-gray-300">·</span>
                    <span className="text-xs text-gray-400">{product.category}</span>
                  </>
                )}
              </div>

              {/* Name */}
              <h1 className="text-2xl md:text-3xl font-extrabold text-brand-gray leading-tight mb-4">
                {product.name}
              </h1>

              {/* Price */}
              {hasPrice && (
                <div className="mb-5">
                  {showPromo && product.original_price != null ? (
                    <div>
                      <span className="text-gray-400 text-sm line-through block">
                        {formatCurrency(product.original_price)}
                      </span>
                      <span className="text-3xl font-extrabold text-brand-yellow">
                        {formatCurrency(product.price ?? 0)}
                      </span>
                    </div>
                  ) : (
                    <span className="text-3xl font-extrabold text-brand-yellow">
                      {formatCurrency(product.price ?? 0)}
                    </span>
                  )}
                </div>
              )}
              {!hasPrice && (
                <p className="text-gray-400 text-lg mb-5">Sob consulta</p>
              )}

              {/* Description */}
              {product.description && (
                <div className="mb-6">
                  <h2 className="text-sm font-semibold text-brand-gray uppercase tracking-wide mb-2">
                    Descrição
                  </h2>
                  <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">
                    {product.description}
                  </p>
                </div>
              )}

              {/* Kit items list */}
              {type === 'kit' && product.items && product.items.length > 0 && (
                <div className="mb-6 p-4 bg-yellow-50 rounded-xl border border-yellow-100">
                  <h2 className="text-sm font-semibold text-brand-gray uppercase tracking-wide mb-3">
                    O que está incluído
                  </h2>
                  <ul className="space-y-1.5">
                    {product.items.map(kitItem => (
                      <li key={kitItem.id} className="flex items-center gap-2 text-sm text-gray-600">
                        <span className="w-5 h-5 bg-brand-yellow/20 text-brand-yellow rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                          ✓
                        </span>
                        <span className="font-medium">{kitItem.quantity}×</span>
                        <span>{kitItem.item_name}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* CTAs */}
              <div className="mt-auto flex flex-col gap-3">
                <button
                  onClick={handleAddToCart}
                  className="w-full flex items-center justify-center gap-2 bg-brand-yellow hover:bg-yellow-400 text-brand-gray font-bold py-3.5 px-6 rounded-full transition shadow-lg shadow-yellow-500/25 text-base"
                >
                  🛒 Adicionar no carrinho
                </button>
                <Link
                  href="/cart"
                  className="w-full flex items-center justify-center gap-2 border-2 border-brand-blue text-brand-blue hover:bg-brand-blue/10 font-bold py-3.5 px-6 rounded-full transition text-base"
                >
                  📋 Solicitar orçamento
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* ── Related items ──────────────────────────────────────────── */}
        {relatedItems.length > 0 && (
          <div className="mt-10">
            <h2 className="text-xl font-extrabold text-brand-gray mb-5">
              Você também pode gostar
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {relatedItems.map(item => (
                <Link
                  key={item.id}
                  href={`/produto?type=${type}&id=${item.id}`}
                  className="block bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-200 group"
                >
                  <div className="relative h-32 bg-gradient-to-br from-yellow-50 to-amber-50">
                    {item.image_url ? (
                      <Image
                        src={item.image_url}
                        alt={item.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-3xl">
                        {TYPE_EMOJI[type] || '🎁'}
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="text-xs font-semibold text-gray-800 line-clamp-2 leading-snug">{item.name}</p>
                    {item.price != null && item.price > 0 && (
                      <p className="text-xs font-bold text-brand-yellow mt-1">{formatCurrency(item.price)}</p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Page wrapper (Suspense for useSearchParams) ──────────────────────────────

export default function ProductoPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-yellow" />
      </div>
    }>
      <ProductDetail />
    </Suspense>
  )
}
