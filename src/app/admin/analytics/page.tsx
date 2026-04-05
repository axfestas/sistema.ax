'use client'

import { useEffect, useState, useCallback } from 'react'

// ─── Types ─────────────────────────────────────────────────────────────────

interface OverviewData {
  total: number
  period: number
  unique_sessions: number
  top_pages: Array<{ path: string; views: number }>
  days: number
}

interface DailyEntry {
  day: string
  views: number
  sessions: number
}

interface SessionsData {
  total_views: number
  unique_sessions: number
  avg_pages_per_session: number
  by_hour: Array<{ hour: number; views: number }>
  days: number
}

interface ProductEntry {
  path: string
  views: number
  sessions: number
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function parsePath(path: string): string {
  try {
    const params = new URLSearchParams(path.includes('?') ? path.split('?')[1] : '')
    const type = params.get('type')
    const id = params.get('id')
    if (type && id) return `${capitalize(type)} #${id}`
  } catch {
    // ignore
  }
  return path
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function pageLabel(path: string): string {
  if (path === '/') return '🏠 Início'
  if (path.startsWith('/produto')) return '📦 ' + parsePath(path)
  if (path.startsWith('/cart')) return '🛒 Carrinho'
  if (path.startsWith('/register')) return '📝 Cadastro'
  if (path.startsWith('/login')) return '🔑 Login'
  return path
}

function bar(value: number, max: number, color = 'bg-brand-yellow') {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0
  return (
    <div className="w-full bg-gray-100 rounded-full h-2">
      <div className={`${color} h-2 rounded-full`} style={{ width: `${pct}%` }} />
    </div>
  )
}

const DAYS_OPTIONS = [7, 14, 30, 90]

// ─── Stat card ───────────────────────────────────────────────────────────────

function StatCard({ icon, label, value }: { icon: string; label: string; value: string | number }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex items-center gap-4">
      <span className="text-3xl">{icon}</span>
      <div>
        <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{label}</p>
        <p className="text-2xl font-bold text-brand-gray">{value}</p>
      </div>
    </div>
  )
}

// ─── Tab: Geral ──────────────────────────────────────────────────────────────

function GeralTab({ days }: { days: number }) {
  const [overview, setOverview] = useState<OverviewData | null>(null)
  const [daily, setDaily] = useState<DailyEntry[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [ov, dy] = await Promise.all([
        fetch(`/api/analytics?type=overview&days=${days}`).then(r => r.json()),
        fetch(`/api/analytics?type=daily&days=${days}`).then(r => r.json()),
      ])
      setOverview(ov as OverviewData)
      setDaily(Array.isArray(dy) ? (dy as DailyEntry[]) : [])
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [days])

  useEffect(() => { load() }, [load])

  if (loading) {
    return <div className="py-12 text-center text-gray-400">Carregando...</div>
  }

  if (!overview) {
    return <div className="py-12 text-center text-gray-400">Erro ao carregar dados.</div>
  }

  const maxViews = daily.length > 0 ? Math.max(...daily.map(d => d.views)) : 1

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard icon="📈" label={`Acessos (últimos ${days} dias)`} value={overview.period.toLocaleString('pt-BR')} />
        <StatCard icon="🌐" label="Total histórico" value={overview.total.toLocaleString('pt-BR')} />
        <StatCard icon="👥" label="Sessões únicas" value={overview.unique_sessions.toLocaleString('pt-BR')} />
      </div>

      {/* Daily chart */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-base font-semibold text-brand-gray mb-4">Acessos diários</h3>
        {daily.length === 0 ? (
          <p className="text-gray-400 text-sm">Nenhum dado disponível.</p>
        ) : (
          <div className="space-y-2.5">
            {daily.map(d => (
              <div key={d.day} className="flex items-center gap-3 text-sm">
                <span className="w-24 text-gray-500 flex-shrink-0 text-xs">
                  {new Date(d.day + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                </span>
                <div className="flex-1">{bar(d.views, maxViews)}</div>
                <span className="w-10 text-right font-semibold text-brand-gray">{d.views}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Top pages */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-base font-semibold text-brand-gray mb-4">Páginas mais visitadas</h3>
        {overview.top_pages.length === 0 ? (
          <p className="text-gray-400 text-sm">Nenhum dado disponível.</p>
        ) : (
          <ul className="divide-y divide-gray-50">
            {overview.top_pages.map(p => (
              <li key={p.path} className="py-2.5 flex items-center gap-3 text-sm">
                <span className="flex-1 text-gray-700 truncate">{pageLabel(p.path)}</span>
                <div className="w-32 hidden sm:block">{bar(p.views, overview.top_pages[0].views)}</div>
                <span className="font-semibold text-brand-gray w-10 text-right">{p.views}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

// ─── Tab: Sessões ────────────────────────────────────────────────────────────

function SessoesTab({ days }: { days: number }) {
  const [data, setData] = useState<SessionsData | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/analytics?type=sessions&days=${days}`)
      const json = await res.json()
      setData(json as SessionsData)
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [days])

  useEffect(() => { load() }, [load])

  if (loading) {
    return <div className="py-12 text-center text-gray-400">Carregando...</div>
  }

  if (!data) {
    return <div className="py-12 text-center text-gray-400">Erro ao carregar dados.</div>
  }

  const maxHour = data.by_hour.length > 0 ? Math.max(...data.by_hour.map(h => h.views)) : 1
  // Fill in all 24 hours
  const byHourFull: Array<{ hour: number; views: number }> = Array.from({ length: 24 }, (_, h) => {
    const found = data.by_hour.find(b => b.hour === h)
    return { hour: h, views: found?.views ?? 0 }
  })

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard icon="🔁" label={`Total de acessos (${days} dias)`} value={data.total_views.toLocaleString('pt-BR')} />
        <StatCard icon="👤" label="Sessões únicas" value={data.unique_sessions.toLocaleString('pt-BR')} />
        <StatCard icon="📄" label="Páginas / sessão (média)" value={data.avg_pages_per_session.toLocaleString('pt-BR')} />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-base font-semibold text-brand-gray mb-4">Acessos por hora do dia</h3>
        {data.by_hour.length === 0 ? (
          <p className="text-gray-400 text-sm">Nenhum dado disponível.</p>
        ) : (
          <div className="space-y-2">
            {byHourFull.map(h => (
              <div key={h.hour} className="flex items-center gap-3 text-xs">
                <span className="w-12 text-gray-500 flex-shrink-0">{String(h.hour).padStart(2, '0')}h</span>
                <div className="flex-1">{bar(h.views, maxHour, 'bg-brand-blue')}</div>
                <span className="w-8 text-right font-semibold text-brand-gray">{h.views}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Tab: Produtos ───────────────────────────────────────────────────────────

function ProdutosTab({ days }: { days: number }) {
  const [data, setData] = useState<ProductEntry[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/analytics?type=products&days=${days}`)
      const json = await res.json()
      setData(Array.isArray(json) ? (json as ProductEntry[]) : [])
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [days])

  useEffect(() => { load() }, [load])

  if (loading) {
    return <div className="py-12 text-center text-gray-400">Carregando...</div>
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StatCard icon="📦" label={`Páginas de produto (${days} dias)`} value={data.reduce((s, d) => s + d.views, 0).toLocaleString('pt-BR')} />
        <StatCard icon="🔗" label="Produtos únicos visitados" value={data.length} />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-base font-semibold text-brand-gray mb-4">Produtos mais visitados</h3>
        {data.length === 0 ? (
          <p className="text-gray-400 text-sm">Nenhum dado disponível.</p>
        ) : (
          <ul className="divide-y divide-gray-50">
            {data.map(p => (
              <li key={p.path} className="py-3 flex items-center gap-3 text-sm">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-800 truncate">{pageLabel(p.path)}</p>
                  <p className="text-xs text-gray-400 truncate">{p.path}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-bold text-brand-gray">{p.views} <span className="font-normal text-gray-400 text-xs">views</span></p>
                  <p className="text-xs text-gray-400">{p.sessions} sessões</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

type Tab = 'geral' | 'sessoes' | 'produtos'

const TABS: Array<{ key: Tab; label: string; icon: string }> = [
  { key: 'geral', label: 'Geral', icon: '📊' },
  { key: 'sessoes', label: 'Sessões', icon: '👤' },
  { key: 'produtos', label: 'Produtos', icon: '📦' },
]

export default function AnalyticsPage() {
  const [tab, setTab] = useState<Tab>('geral')
  const [days, setDays] = useState(30)

  return (
    <div>
      <div className="flex flex-wrap justify-between items-start gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Mapa de Acessos</h2>
          <p className="text-gray-500 text-sm mt-1">Visualize o tráfego e comportamento de visitantes no site</p>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-500">Período:</label>
          <select
            value={days}
            onChange={e => setDays(Number(e.target.value))}
            className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-brand-yellow"
          >
            {DAYS_OPTIONS.map(d => (
              <option key={d} value={d}>Últimos {d} dias</option>
            ))}
          </select>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit mb-6">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === t.key
                ? 'bg-white text-brand-gray shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <span>{t.icon}</span>
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'geral' && <GeralTab days={days} />}
      {tab === 'sessoes' && <SessoesTab days={days} />}
      {tab === 'produtos' && <ProdutosTab days={days} />}
    </div>
  )
}
