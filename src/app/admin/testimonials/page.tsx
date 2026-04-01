'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/hooks/useToast'

interface Testimonial {
  id: number
  name: string
  stars: number
  comment: string
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
}

interface User {
  id: number
  name: string
  email: string
  role: string
}

interface AuthResponse {
  authenticated: boolean
  user?: User
}

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

const STATUS_LABEL: Record<string, string> = {
  pending: 'Pendente',
  approved: 'Aprovado',
  rejected: 'Rejeitado',
}

const STATUS_STYLE: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
}

export default function AdminTestimonialsPage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [testimonials, setTestimonials] = useState<Testimonial[]>([])
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all')
  const [updating, setUpdating] = useState<number | null>(null)
  const router = useRouter()
  const { showSuccess, showError } = useToast()

  useEffect(() => {
    checkAuth()
  }, [])

  useEffect(() => {
    if (user) loadTestimonials()
  }, [user, filter])

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/auth/user')
      if (!res.ok) throw new Error(`Erro HTTP: ${res.status}`)
      const data = await res.json() as AuthResponse
      if (data.authenticated && data.user) {
        setUser(data.user)
      } else {
        router.push('/login')
      }
    } catch {
      router.push('/login')
    } finally {
      setLoading(false)
    }
  }

  const loadTestimonials = async () => {
    try {
      const url = filter === 'all' ? '/api/testimonials?status=all' : `/api/testimonials?status=${filter}`
      const res = await fetch(url)
      if (res.ok) {
        const data = await res.json() as Testimonial[]
        setTestimonials(data)
      }
    } catch {
      setTestimonials([])
    }
  }

  const handleStatus = async (id: number, status: 'approved' | 'rejected') => {
    setUpdating(id)
    try {
      const res = await fetch(`/api/testimonials?id=${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (res.ok) {
        showSuccess(status === 'approved' ? 'Avaliação aprovada!' : 'Avaliação rejeitada.')
        loadTestimonials()
      } else {
        showError('Erro ao atualizar avaliação.')
      }
    } catch {
      showError('Erro de conexão.')
    } finally {
      setUpdating(null)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir esta avaliação?')) return
    try {
      const res = await fetch(`/api/testimonials?id=${id}`, { method: 'DELETE' })
      if (res.ok) {
        showSuccess('Avaliação excluída.')
        loadTestimonials()
      } else {
        showError('Erro ao excluir avaliação.')
      }
    } catch {
      showError('Erro de conexão.')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-yellow" />
      </div>
    )
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Avaliações</h1>
        <p className="text-gray-500 text-sm mt-1">Gerencie as avaliações enviadas pelos clientes</p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {(['all', 'pending', 'approved', 'rejected'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-full text-sm transition-colors ${
              filter === f ? 'bg-brand-yellow text-brand-gray' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {f === 'all' ? 'Todas' : STATUS_LABEL[f]}
          </button>
        ))}
      </div>

      {testimonials.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-5xl mb-4">💬</p>
          <p>Nenhuma avaliação encontrada.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {testimonials.map(t => (
            <div key={t.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <span className="font-bold text-gray-900">{t.name}</span>
                    <Stars count={t.stars} />
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_STYLE[t.status]}`}>
                      {STATUS_LABEL[t.status]}
                    </span>
                    <span className="text-xs text-gray-400">
                      {new Date(t.created_at).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm leading-relaxed">{t.comment}</p>
                </div>
                <div className="flex gap-2 flex-shrink-0 flex-wrap">
                  {t.status !== 'approved' && (
                    <button
                      onClick={() => handleStatus(t.id, 'approved')}
                      disabled={updating === t.id}
                      className="px-3 py-1.5 bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white text-xs rounded-lg transition"
                    >
                      ✓ Aprovar
                    </button>
                  )}
                  {t.status !== 'rejected' && (
                    <button
                      onClick={() => handleStatus(t.id, 'rejected')}
                      disabled={updating === t.id}
                      className="px-3 py-1.5 bg-yellow-500 hover:bg-yellow-600 disabled:bg-gray-300 text-white text-xs rounded-lg transition"
                    >
                      ✗ Rejeitar
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(t.id)}
                    className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-xs rounded-lg transition"
                  >
                    🗑 Excluir
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
