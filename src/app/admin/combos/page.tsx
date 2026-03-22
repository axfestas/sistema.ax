'use client'

import { useEffect, useState, useCallback } from 'react'
import { useToast } from '@/components/ToastProvider'

// ─── Types ────────────────────────────────────────────────────────────────────

interface ComboItem {
  id?: number
  product_type: 'item' | 'kit' | 'sweet' | 'design' | 'theme'
  product_id: number
  product_name: string
  required_quantity: number
}

interface ComboCategory {
  id?: number
  category_name: string
  product_section: 'items' | 'sweets' | 'designs' | 'themes'
}

interface Combo {
  id: number
  name: string
  type: 'products' | 'category' | 'mixed'
  discount_type: 'fixed_price' | 'percentage' | 'fixed_amount'
  discount_value: number
  min_quantity: number
  priority: number
  is_active: number
  created_at: string
  items: ComboItem[]
  categories: ComboCategory[]
}

interface ProductOption {
  id: number
  name: string
  type: 'item' | 'kit' | 'sweet' | 'design' | 'theme'
}

interface CategoryOption {
  name: string
  section: 'items' | 'sweets' | 'designs' | 'themes'
}

// ─── Constants ────────────────────────────────────────────────────────────────

const TYPE_LABELS: Record<string, string> = {
  products: 'Produtos específicos',
  category: 'Por categoria',
  mixed: 'Misto',
}

const DISCOUNT_TYPE_LABELS: Record<string, string> = {
  fixed_price: 'Preço fixo',
  percentage: 'Desconto %',
  fixed_amount: 'Desconto R$',
}

const SECTION_LABELS: Record<string, string> = {
  items: 'Estoque',
  sweets: 'Doces',
  designs: 'Designs',
  themes: 'Temas',
}

const PRODUCT_TYPE_LABELS: Record<string, string> = {
  item: 'Estoque',
  kit: 'Kit',
  sweet: 'Doce',
  design: 'Design',
  theme: 'Tema',
}

const BRL = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

// ─── Empty form ───────────────────────────────────────────────────────────────

interface FormData {
  name: string
  type: 'products' | 'category' | 'mixed'
  discount_type: 'fixed_price' | 'percentage' | 'fixed_amount'
  discount_value: string
  min_quantity: string
  priority: string
  is_active: number
}

const emptyForm: FormData = {
  name: '',
  type: 'products',
  discount_type: 'fixed_amount',
  discount_value: '',
  min_quantity: '1',
  priority: '0',
  is_active: 1,
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function CombosPage() {
  const { showSuccess, showError } = useToast()

  const [combos, setCombos] = useState<Combo[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingCombo, setEditingCombo] = useState<Combo | null>(null)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')

  // Product/category data for pickers
  const [products, setProducts] = useState<ProductOption[]>([])
  const [categories, setCategories] = useState<CategoryOption[]>([])

  // Form state
  const [formData, setFormData] = useState<FormData>(emptyForm)
  const [formItems, setFormItems] = useState<ComboItem[]>([])
  const [formCategories, setFormCategories] = useState<ComboCategory[]>([])

  // Picker state
  const [productSearch, setProductSearch] = useState('')
  const [productTypeFilter, setProductTypeFilter] = useState<string>('all')
  const [newItemQty, setNewItemQty] = useState('1')

  const filteredCombos = combos.filter(c => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return c.name.toLowerCase().includes(q)
  })

  // ─── Data loading ──────────────────────────────────────────────────────────

  const loadCombos = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/combos')
      if (res.ok) setCombos(await res.json() as Combo[])
    } catch {
      showError('Erro ao carregar combos.')
    } finally {
      setLoading(false)
    }
  }, [showError])

  const loadProductsAndCategories = useCallback(async () => {
    try {
      const [itemsRes, kitsRes, sweetsRes, designsRes, categoriesRes] = await Promise.all([
        fetch('/api/items'),
        fetch('/api/kits'),
        fetch('/api/sweets'),
        fetch('/api/designs'),
        fetch('/api/categories'),
      ])

      const allProducts: ProductOption[] = []
      if (itemsRes.ok) {
        const data = await itemsRes.json() as { id: number; name: string }[]
        data.forEach(p => allProducts.push({ id: p.id, name: p.name, type: 'item' }))
      }
      if (kitsRes.ok) {
        const data = await kitsRes.json() as { id: number; name: string }[]
        data.forEach(p => allProducts.push({ id: p.id, name: p.name, type: 'kit' }))
      }
      if (sweetsRes.ok) {
        const data = await sweetsRes.json() as { id: number; name: string }[]
        data.forEach(p => allProducts.push({ id: p.id, name: p.name, type: 'sweet' }))
      }
      if (designsRes.ok) {
        const data = await designsRes.json() as { id: number; name: string }[]
        data.forEach(p => allProducts.push({ id: p.id, name: p.name, type: 'design' }))
      }
      setProducts(allProducts)

      if (categoriesRes.ok) {
        const data = await categoriesRes.json() as { name: string; section: string }[]
        setCategories(
          data
            .filter(c => ['items', 'sweets', 'designs', 'themes'].includes(c.section))
            .map(c => ({ name: c.name, section: c.section as CategoryOption['section'] }))
        )
      }
    } catch {
      // Non-critical; form will just have empty pickers
    }
  }, [])

  useEffect(() => {
    loadCombos()
    loadProductsAndCategories()
  }, [loadCombos, loadProductsAndCategories])

  // ─── Form helpers ──────────────────────────────────────────────────────────

  const openCreate = () => {
    setEditingCombo(null)
    setFormData(emptyForm)
    setFormItems([])
    setFormCategories([])
    setProductSearch('')
    setNewItemQty('1')
    setShowForm(true)
  }

  const openEdit = (combo: Combo) => {
    setEditingCombo(combo)
    setFormData({
      name: combo.name,
      type: combo.type,
      discount_type: combo.discount_type,
      discount_value: combo.discount_value.toString(),
      min_quantity: combo.min_quantity.toString(),
      priority: combo.priority.toString(),
      is_active: combo.is_active,
    })
    setFormItems(combo.items.map(i => ({ ...i })))
    setFormCategories(combo.categories.map(c => ({ ...c })))
    setProductSearch('')
    setNewItemQty('1')
    setShowForm(true)
  }

  const closeForm = () => {
    setShowForm(false)
    setEditingCombo(null)
  }

  // ─── Product picker ────────────────────────────────────────────────────────

  const filteredProducts = products.filter(p => {
    const matchesSearch = !productSearch.trim() ||
      p.name.toLowerCase().includes(productSearch.toLowerCase())
    const matchesType = productTypeFilter === 'all' || p.type === productTypeFilter
    return matchesSearch && matchesType
  })

  const addProduct = (product: ProductOption) => {
    if (formItems.some(i => i.product_id === product.id && i.product_type === product.type)) {
      showError('Produto já adicionado.')
      return
    }
    setFormItems(prev => [...prev, {
      product_type: product.type,
      product_id: product.id,
      product_name: product.name,
      required_quantity: parseInt(newItemQty, 10) || 1,
    }])
  }

  const removeProduct = (idx: number) => {
    setFormItems(prev => prev.filter((_, i) => i !== idx))
  }

  const updateProductQty = (idx: number, qty: number) => {
    setFormItems(prev => prev.map((item, i) => i === idx ? { ...item, required_quantity: qty } : item))
  }

  // ─── Category picker ───────────────────────────────────────────────────────

  const addCategory = (cat: CategoryOption) => {
    if (formCategories.some(c => c.category_name === cat.name && c.product_section === cat.section)) {
      showError('Categoria já adicionada.')
      return
    }
    setFormCategories(prev => [...prev, { category_name: cat.name, product_section: cat.section }])
  }

  const removeCategory = (idx: number) => {
    setFormCategories(prev => prev.filter((_, i) => i !== idx))
  }

  // ─── Save ──────────────────────────────────────────────────────────────────

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) { showError('Informe o nome do combo.'); return }
    if (!formData.discount_value || isNaN(parseFloat(formData.discount_value))) {
      showError('Informe o valor do desconto.')
      return
    }

    const needsProducts = formData.type === 'products' || formData.type === 'mixed'
    const needsCategories = formData.type === 'category' || formData.type === 'mixed'
    if (needsProducts && formItems.length === 0) {
      showError('Adicione ao menos um produto ao combo.')
      return
    }
    if (needsCategories && formCategories.length === 0) {
      showError('Adicione ao menos uma categoria ao combo.')
      return
    }

    setSaving(true)
    try {
      const payload = {
        name: formData.name.trim(),
        type: formData.type,
        discount_type: formData.discount_type,
        discount_value: parseFloat(formData.discount_value),
        min_quantity: parseInt(formData.min_quantity, 10) || 1,
        priority: parseInt(formData.priority, 10) || 0,
        is_active: formData.is_active,
        items: formItems,
        categories: formCategories,
      }

      const url = editingCombo ? `/api/combos?id=${editingCombo.id}` : '/api/combos'
      const method = editingCombo ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (res.ok) {
        showSuccess(editingCombo ? 'Combo atualizado!' : 'Combo criado!')
        closeForm()
        loadCombos()
      } else {
        const err = await res.json() as { error?: string }
        showError(err.error || 'Erro ao salvar combo.')
      }
    } catch {
      showError('Erro de conexão.')
    } finally {
      setSaving(false)
    }
  }

  // ─── Delete ────────────────────────────────────────────────────────────────

  const handleDelete = async (combo: Combo) => {
    if (!confirm(`Excluir o combo "${combo.name}"?`)) return
    try {
      const res = await fetch(`/api/combos?id=${combo.id}`, { method: 'DELETE' })
      if (res.ok) {
        showSuccess('Combo excluído.')
        loadCombos()
      } else {
        showError('Erro ao excluir.')
      }
    } catch {
      showError('Erro de conexão.')
    }
  }

  // ─── Toggle active ─────────────────────────────────────────────────────────

  const toggleActive = async (combo: Combo) => {
    try {
      const res = await fetch(`/api/combos?id=${combo.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: combo.is_active ? 0 : 1 }),
      })
      if (res.ok) {
        showSuccess(combo.is_active ? 'Combo desativado.' : 'Combo ativado!')
        loadCombos()
      } else {
        showError('Erro ao atualizar.')
      }
    } catch {
      showError('Erro de conexão.')
    }
  }

  // ─── Discount label ────────────────────────────────────────────────────────

  const discountLabel = (combo: Combo) => {
    if (combo.discount_type === 'fixed_price') return `Preço fixo: ${BRL(combo.discount_value)}`
    if (combo.discount_type === 'percentage') return `${combo.discount_value}% de desconto`
    return `${BRL(combo.discount_value)} de desconto`
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Combos Promocionais</h1>
          <p className="text-gray-500 text-sm mt-1">Crie combos para aplicar descontos automáticos no carrinho</p>
        </div>
        <button
          onClick={openCreate}
          className="px-5 py-2.5 bg-brand-yellow hover:bg-yellow-400 text-brand-gray font-bold rounded-xl transition"
        >
          + Novo Combo
        </button>
      </div>

      {/* Search */}
      <div className="mb-5">
        <input
          type="text"
          placeholder="Buscar combo..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full max-w-sm border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-yellow"
        />
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center min-h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-yellow" />
        </div>
      ) : filteredCombos.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-5xl mb-4">🎁</p>
          <p className="font-medium">Nenhum combo encontrado.</p>
          <p className="text-sm mt-1">Clique em &quot;Novo Combo&quot; para criar o primeiro.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredCombos.map(combo => (
            <div key={combo.id} className={`bg-white rounded-2xl border shadow-sm p-5 ${combo.is_active ? 'border-gray-100' : 'border-gray-200 opacity-70'}`}>
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-bold text-gray-900 text-lg">{combo.name}</span>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${combo.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {combo.is_active ? 'Ativo' : 'Inativo'}
                    </span>
                    <span className="text-xs px-2 py-0.5 bg-brand-yellow/20 text-yellow-800 rounded-full font-medium">
                      {TYPE_LABELS[combo.type]}
                    </span>
                    <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full font-medium">
                      {discountLabel(combo)}
                    </span>
                    {combo.priority > 0 && (
                      <span className="text-xs px-2 py-0.5 bg-purple-50 text-purple-700 rounded-full font-medium">
                        Prioridade {combo.priority}
                      </span>
                    )}
                  </div>

                  {/* Products */}
                  {combo.items.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs text-gray-500 font-medium mb-1">Produtos:</p>
                      <div className="flex flex-wrap gap-1">
                        {combo.items.map((item, idx) => (
                          <span key={idx} className="text-xs bg-gray-50 border border-gray-200 px-2 py-0.5 rounded-lg text-gray-600">
                            {item.product_name} ({PRODUCT_TYPE_LABELS[item.product_type]}) × {item.required_quantity}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Categories */}
                  {combo.categories.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs text-gray-500 font-medium mb-1">
                        Categorias (mín. {combo.min_quantity} {combo.min_quantity === 1 ? 'item' : 'itens'}):
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {combo.categories.map((cat, idx) => (
                          <span key={idx} className="text-xs bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-lg text-blue-600">
                            {cat.category_name} ({SECTION_LABELS[cat.product_section]})
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 flex-shrink-0 flex-wrap">
                  <button
                    onClick={() => toggleActive(combo)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                      combo.is_active
                        ? 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                        : 'bg-green-50 hover:bg-green-100 text-green-700'
                    }`}
                  >
                    {combo.is_active ? '⏸ Desativar' : '▶ Ativar'}
                  </button>
                  <button
                    onClick={() => openEdit(combo)}
                    className="px-3 py-1.5 bg-brand-yellow/80 hover:bg-brand-yellow text-brand-gray text-xs font-semibold rounded-lg transition"
                  >
                    ✏️ Editar
                  </button>
                  <button
                    onClick={() => handleDelete(combo)}
                    className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-semibold rounded-lg transition"
                  >
                    🗑 Excluir
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ─── Form Modal ─────────────────────────────────────────────────────── */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-start justify-center overflow-y-auto p-4" onClick={closeForm}>
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl my-8"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-bold text-gray-900">
                {editingCombo ? 'Editar Combo' : 'Novo Combo'}
              </h2>
              <button onClick={closeForm} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">✕</button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-5">
              {/* Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Nome do combo *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                  placeholder="Ex: 5 suportes em promoção"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-yellow"
                />
              </div>

              {/* Type + Discount side by side */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Tipo de combo *</label>
                  <select
                    value={formData.type}
                    onChange={e => setFormData(p => ({ ...p, type: e.target.value as typeof formData.type }))}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-yellow"
                  >
                    <option value="products">Produtos específicos</option>
                    <option value="category">Por categoria</option>
                    <option value="mixed">Misto (produtos + categorias)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Tipo de desconto *</label>
                  <select
                    value={formData.discount_type}
                    onChange={e => setFormData(p => ({ ...p, discount_type: e.target.value as typeof formData.discount_type }))}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-yellow"
                  >
                    <option value="fixed_price">Preço fixo total</option>
                    <option value="percentage">Desconto percentual (%)</option>
                    <option value="fixed_amount">Desconto em valor (R$)</option>
                  </select>
                </div>
              </div>

              {/* Discount value + min qty + priority */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    {formData.discount_type === 'fixed_price' ? 'Preço fixo (R$) *' :
                     formData.discount_type === 'percentage' ? 'Percentual (%) *' :
                     'Valor desconto (R$) *'}
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={formData.discount_value}
                    onChange={e => setFormData(p => ({ ...p, discount_value: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-yellow"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Qtd. mínima</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.min_quantity}
                    onChange={e => setFormData(p => ({ ...p, min_quantity: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-yellow"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Prioridade</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.priority}
                    onChange={e => setFormData(p => ({ ...p, priority: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-yellow"
                  />
                </div>
              </div>

              {/* Active */}
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active === 1}
                  onChange={e => setFormData(p => ({ ...p, is_active: e.target.checked ? 1 : 0 }))}
                  className="w-4 h-4 accent-brand-yellow"
                />
                <label htmlFor="is_active" className="text-sm font-medium text-gray-700">Combo ativo</label>
              </div>

              {/* ── Products section ────────────────────────────── */}
              {(formData.type === 'products' || formData.type === 'mixed') && (
                <div className="border border-gray-200 rounded-xl p-4">
                  <h3 className="text-sm font-bold text-gray-800 mb-3">Produtos do combo</h3>

                  {/* Added products */}
                  {formItems.length > 0 && (
                    <div className="space-y-2 mb-4">
                      {formItems.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-2 bg-gray-50 rounded-lg p-2">
                          <span className="flex-1 text-sm text-gray-700">
                            <span className="font-medium">{item.product_name}</span>
                            <span className="text-xs text-gray-400 ml-1">({PRODUCT_TYPE_LABELS[item.product_type]})</span>
                          </span>
                          <input
                            type="number"
                            min="1"
                            value={item.required_quantity}
                            onChange={e => updateProductQty(idx, parseInt(e.target.value, 10) || 1)}
                            className="w-16 border border-gray-200 rounded-lg px-2 py-1 text-sm text-center"
                            title="Quantidade necessária"
                          />
                          <button type="button" onClick={() => removeProduct(idx)} className="text-red-400 hover:text-red-600 text-sm">✕</button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Product picker */}
                  <div className="flex gap-2 mb-2 flex-wrap">
                    <input
                      type="text"
                      placeholder="Buscar produto..."
                      value={productSearch}
                      onChange={e => setProductSearch(e.target.value)}
                      className="flex-1 min-w-[140px] border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-yellow"
                    />
                    <select
                      value={productTypeFilter}
                      onChange={e => setProductTypeFilter(e.target.value)}
                      className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-yellow"
                    >
                      <option value="all">Todos</option>
                      <option value="item">Estoque</option>
                      <option value="kit">Kits</option>
                      <option value="sweet">Doces</option>
                      <option value="design">Designs</option>
                    </select>
                    <input
                      type="number"
                      min="1"
                      value={newItemQty}
                      onChange={e => setNewItemQty(e.target.value)}
                      className="w-16 border border-gray-200 rounded-lg px-2 py-2 text-sm text-center"
                      title="Quantidade"
                    />
                  </div>

                  {productSearch.trim() && (
                    <div className="border border-gray-200 rounded-lg max-h-40 overflow-y-auto">
                      {filteredProducts.length === 0 ? (
                        <p className="text-xs text-gray-400 p-3">Nenhum produto encontrado.</p>
                      ) : (
                        filteredProducts.slice(0, 20).map(p => (
                          <button
                            key={`${p.type}-${p.id}`}
                            type="button"
                            onClick={() => addProduct(p)}
                            className="w-full text-left px-3 py-2 text-sm hover:bg-brand-yellow/10 transition flex items-center gap-2"
                          >
                            <span className="text-xs bg-gray-100 px-1.5 py-0.5 rounded text-gray-500">{PRODUCT_TYPE_LABELS[p.type]}</span>
                            {p.name}
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* ── Categories section ───────────────────────────── */}
              {(formData.type === 'category' || formData.type === 'mixed') && (
                <div className="border border-gray-200 rounded-xl p-4">
                  <h3 className="text-sm font-bold text-gray-800 mb-3">Categorias do combo</h3>

                  {/* Added categories */}
                  {formCategories.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {formCategories.map((cat, idx) => (
                        <span key={idx} className="flex items-center gap-1.5 text-sm bg-blue-50 border border-blue-100 px-3 py-1 rounded-full text-blue-700">
                          {cat.category_name}
                          <span className="text-xs text-blue-400">({SECTION_LABELS[cat.product_section]})</span>
                          <button type="button" onClick={() => removeCategory(idx)} className="text-blue-400 hover:text-blue-600">✕</button>
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Category picker */}
                  <div className="border border-gray-200 rounded-lg max-h-40 overflow-y-auto">
                    {categories.length === 0 ? (
                      <p className="text-xs text-gray-400 p-3">Nenhuma categoria cadastrada.</p>
                    ) : (
                      categories.map((cat, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => addCategory(cat)}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-brand-yellow/10 transition flex items-center gap-2"
                        >
                          <span className="text-xs bg-gray-100 px-1.5 py-0.5 rounded text-gray-500">{SECTION_LABELS[cat.section]}</span>
                          {cat.name}
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeForm}
                  className="flex-1 border border-gray-200 text-gray-600 hover:bg-gray-50 font-semibold py-2.5 rounded-xl transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-brand-yellow hover:bg-yellow-400 text-brand-gray font-bold py-2.5 rounded-xl transition disabled:opacity-50"
                >
                  {saving ? 'Salvando...' : editingCombo ? 'Salvar alterações' : 'Criar combo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
