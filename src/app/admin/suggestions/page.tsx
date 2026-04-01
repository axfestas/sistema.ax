'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ToastProvider'

interface Suggestion {
  id: number
  name: string
  email?: string
  message: string
  status: 'pending' | 'read' | 'archived'
  created_at: string
}

const STATUS_LABEL: Record<string, string> = {
  pending: 'Nova',
  read: 'Lida',
  archived: 'Arquivada',
}

const STATUS_STYLE: Record<string, string> = {
  pending: 'bg-brand-yellow/20 text-yellow-800',
  read: 'bg-green-100 text-green-800',
  archived: 'bg-gray-100 text-gray-600',
}

export default function SuggestionsPage() {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'read' | 'archived'>('all')
  const [updating, setUpdating] = useState<number | null>(null)
  const router = useRouter()
  const { showSuccess, showError } = useToast()

  useEffect(() => {
    checkAuth()
  }, [])

  useEffect(() => {
    loadSuggestions()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter])

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/auth/user')
      if (!res.ok) throw new Error('Não autenticado')
      const data = await res.json() as { authenticated: boolean }
      if (!data.authenticated) router.push('/login')
    } catch {
      router.push('/login')
    }
  }

  const loadSuggestions = async () => {
    setLoading(true)
    try {
      const url = filter === 'all' ? '/api/suggestions' : `/api/suggestions?status=${filter}`
      const res = await fetch(url)
      if (res.ok) setSuggestions(await res.json() as Suggestion[])
    } catch {
      setSuggestions([])
    } finally {
      setLoading(false)
    }
  }

  const handleStatus = async (id: number, status: string) => {
    setUpdating(id)
    try {
      const res = await fetch(`/api/suggestions?id=${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (res.ok) {
        showSuccess('Status atualizado!')
        loadSuggestions()
      } else {
        showError('Erro ao atualizar.')
      }
    } catch {
      showError('Erro de conexão.')
    } finally {
      setUpdating(null)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Excluir esta sugestão?')) return
    try {
      const res = await fetch(`/api/suggestions?id=${id}`, { method: 'DELETE' })
      if (res.ok) {
        showSuccess('Sugestão excluída.')
        loadSuggestions()
      } else {
        showError('Erro ao excluir.')
      }
    } catch {
      showError('Erro de conexão.')
    }
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Sugestões</h1>
        <p className="text-gray-500 text-sm mt-1">Sugestões enviadas pelos visitantes do site</p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {(['all', 'pending', 'read', 'archived'] as const).map(f => (
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

      {loading ? (
        <div className="flex items-center justify-center min-h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-yellow" />
        </div>
      ) : suggestions.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-5xl mb-4">💡</p>
          <p>Nenhuma sugestão encontrada.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {suggestions.map(s => (
            <div key={s.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <span className="font-bold text-gray-900">{s.name}</span>
                    {s.email && <span className="text-xs text-gray-500">{s.email}</span>}
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_STYLE[s.status]}`}>
                      {STATUS_LABEL[s.status]}
                    </span>
                    <span className="text-xs text-gray-400">
                      {new Date(s.created_at).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm leading-relaxed">{s.message}</p>
                </div>
                <div className="flex gap-2 flex-shrink-0 flex-wrap">
                  {s.status !== 'read' && (
                    <button
                      onClick={() => handleStatus(s.id, 'read')}
                      disabled={updating === s.id}
                      className="px-3 py-1.5 bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white text-xs rounded transition"
                    >
                      ✓ Marcar como lida
                    </button>
                  )}
                  {s.status !== 'archived' && (
                    <button
                      onClick={() => handleStatus(s.id, 'archived')}
                      disabled={updating === s.id}
                      className="px-3 py-1.5 bg-gray-400 hover:bg-gray-500 disabled:bg-gray-300 text-white text-xs rounded transition"
                    >
                      📦 Arquivar
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(s.id)}
                    className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-xs rounded transition"
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
