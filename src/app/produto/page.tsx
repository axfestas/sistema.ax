'use client'

import { useEffect, useState, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Suspense } from 'react'

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

interface SiteSettings {
  whatsapp_url?: string
  phone?: string
  company_name?: string
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
}

const TYPE_EMOJI: Record<string, string> = {
  kit: '🎉',
  sweet: '🍭',
  theme: '✨',
  item: '🎈',
}

function buildApiUrl(type: string, id: string): string {
  switch (type) {
    case 'kit': return `/api/kits?id=${id}`
    case 'sweet': return `/api/sweets?id=${id}`
    case 'theme': return `/api/themes?id=${id}`
    case 'item': return `/api/items?id=${id}`
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
  const [settings, setSettings] = useState<SiteSettings>({})
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

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

  useEffect(() => {
    fetch('/api/settings')
      .then(r => r.ok ? r.json() : {})
      .then((data: unknown) => setSettings((data as SiteSettings) || {}))
      .catch(() => {})
  }, [])

  const buildWhatsAppUrl = () => {
    if (!product) return '#'
    const base = settings.whatsapp_url || ''
    const phone = base.replace(/\D/g, '')
    const text = encodeURIComponent(
      `Olá! Gostaria de solicitar um orçamento para: ${product.name}`
    )
    if (phone) return `https://wa.me/${phone}?text=${text}`
    return `https://wa.me/?text=${text}`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-400" />
      </div>
    )
  }

  if (notFound || !product) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4">
        <p className="text-6xl mb-4">🔍</p>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Produto não encontrado</h1>
        <p className="text-gray-500 mb-6">O produto que você procura não existe ou foi removido.</p>
        <Link href="/#catalogo" className="bg-rose-500 hover:bg-rose-600 text-white font-bold px-6 py-3 rounded-full transition">
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
        <div className="max-w-6xl mx-auto px-4 py-3">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-rose-500 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Voltar
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-0">

            {/* ── Image ────────────────────────────────────────────── */}
            <div className="relative min-h-72 md:min-h-[480px] bg-gradient-to-br from-pink-50 to-rose-50">
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
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-yellow-400 text-gray-900 shadow">
                    🔥 Em destaque
                  </span>
                )}
                {showPromo && (
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-rose-500 text-white shadow">
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
                <span className="text-xs font-semibold uppercase tracking-widest text-rose-400">
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
              <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 leading-tight mb-4">
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
                      <span className="text-3xl font-extrabold text-rose-600">
                        {formatCurrency(product.price ?? 0)}
                      </span>
                    </div>
                  ) : (
                    <span className="text-3xl font-extrabold text-rose-600">
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
                  <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-2">
                    Descrição
                  </h2>
                  <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">
                    {product.description}
                  </p>
                </div>
              )}

              {/* Kit items list */}
              {type === 'kit' && product.items && product.items.length > 0 && (
                <div className="mb-6 p-4 bg-gray-50 rounded-xl">
                  <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
                    O que está incluído
                  </h2>
                  <ul className="space-y-1.5">
                    {product.items.map(kitItem => (
                      <li key={kitItem.id} className="flex items-center gap-2 text-sm text-gray-600">
                        <span className="w-5 h-5 bg-rose-100 text-rose-500 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
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
                <a
                  href={buildWhatsAppUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white font-bold py-3.5 px-6 rounded-full transition shadow-lg shadow-green-500/25 text-base"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                  Chamar no WhatsApp
                </a>
                <Link
                  href="/cart"
                  className="w-full flex items-center justify-center gap-2 border-2 border-rose-500 text-rose-500 hover:bg-rose-50 font-bold py-3.5 px-6 rounded-full transition text-base"
                >
                  📋 Solicitar orçamento
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Page wrapper (Suspense for useSearchParams) ──────────────────────────────

export default function ProductoPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-400" />
      </div>
    }>
      <ProductDetail />
    </Suspense>
  )
}
