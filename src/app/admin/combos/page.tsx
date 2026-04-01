'use client'

import { useEffect, useState, useCallback } from 'react'
import { useToast } from '@/hooks/useToast'

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
        showSuccess(editingCombo ? 'Combo atualizado com sucesso!' : 'Combo criado com sucesso!')
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
    if (!confirm(`Tem certeza que deseja deletar o combo "${combo.name}"?`)) return
    try {
      const res = await fetch(`/api/combos?id=${combo.id}`, { method: 'DELETE' })
      if (res.ok) {
        showSuccess('Combo deletado com sucesso!')
        loadCombos()
      } else {
        showError('Erro ao deletar combo.')
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

  if (loading) {
    return <div className="p-4">Carregando...</div>
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-2xl font-bold">Combos Promocionais</h2>
          <p className="text-gray-600 text-sm mt-1">
            Crie combos para aplicar descontos automáticos no carrinho
          </p>
        </div>
        <button
          onClick={openCreate}
          className="bg-brand-blue hover:bg-brand-blue-dark text-white py-2 px-4 rounded"
        >
          + Novo Combo
        </button>
      </div>

      {!showForm && (
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nome..."
            className="px-3 py-2 border rounded flex-1"
          />
        </div>
      )}

      {/* ─── Inline Form ──────────────────────────────────────────────────── */}
      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h3 className="text-xl font-bold mb-4">
            {editingCombo ? 'Editar Combo' : 'Novo Combo'}
          </h3>
          <form onSubmit={handleSave} className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium mb-1">Nome do combo *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                placeholder="Ex: 5 suportes em promoção"
                className="w-full px-3 py-2 border rounded"
              />
            </div>

            {/* Type + Discount side by side */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Tipo de combo *</label>
                <select
                  value={formData.type}
                  onChange={e => setFormData(p => ({ ...p, type: e.target.value as typeof formData.type }))}
                  className="w-full px-3 py-2 border rounded"
                >
                  <option value="products">Produtos específicos</option>
                  <option value="category">Por categoria</option>
                  <option value="mixed">Misto (produtos + categorias)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Tipo de desconto *</label>
                <select
                  value={formData.discount_type}
                  onChange={e => setFormData(p => ({ ...p, discount_type: e.target.value as typeof formData.discount_type }))}
                  className="w-full px-3 py-2 border rounded"
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
                <label className="block text-sm font-medium mb-1">
                  {formData.discount_type === 'fixed_price' ? 'Preço fixo (R$) *' :
                   formData.discount_type === 'percentage' ? 'Percentual (%) *' :
                   'Valor do desconto (R$) *'}
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={formData.discount_value}
                  onChange={e => setFormData(p => ({ ...p, discount_value: e.target.value }))}
                  className="w-full px-3 py-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Qtd. mínima</label>
                <input
                  type="number"
                  min="1"
                  value={formData.min_quantity}
                  onChange={e => setFormData(p => ({ ...p, min_quantity: e.target.value }))}
                  className="w-full px-3 py-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Prioridade</label>
                <input
                  type="number"
                  min="0"
                  value={formData.priority}
                  onChange={e => setFormData(p => ({ ...p, priority: e.target.value }))}
                  className="w-full px-3 py-2 border rounded"
                />
              </div>
            </div>

            {/* Active */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="combo_is_active"
                checked={formData.is_active === 1}
                onChange={e => setFormData(p => ({ ...p, is_active: e.target.checked ? 1 : 0 }))}
                className="mr-2"
              />
              <label htmlFor="combo_is_active" className="text-sm font-medium">Combo ativo</label>
            </div>

            {/* ── Products section ─────────────────────────────────────────── */}
            {(formData.type === 'products' || formData.type === 'mixed') && (
              <div className="border-t pt-4 mt-4">
                <h4 className="font-semibold mb-3">Produtos do combo</h4>

                {/* Added products */}
                {formItems.length > 0 && (
                  <ul className="space-y-2 mb-4">
                    {formItems.map((item, idx) => (
                      <li key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                        <div>
                          <span className="font-medium">{item.product_name}</span>
                          <span className="text-xs text-gray-500 ml-2">({PRODUCT_TYPE_LABELS[item.product_type]})</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="1"
                            value={item.required_quantity}
                            onChange={e => updateProductQty(idx, parseInt(e.target.value, 10) || 1)}
                            className="w-16 px-2 py-1 border rounded text-sm text-center"
                            title="Quantidade necessária"
                          />
                          <button
                            type="button"
                            onClick={() => removeProduct(idx)}
                            className="text-red-500 hover:text-red-700 text-sm"
                          >
                            🗑️ Remover
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}

                {/* Product picker */}
                <div className="p-4 bg-gray-50 rounded">
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className="block text-sm font-medium mb-1">Buscar produto</label>
                      <input
                        type="text"
                        placeholder="Digite o nome do produto..."
                        value={productSearch}
                        onChange={e => setProductSearch(e.target.value)}
                        className="w-full px-3 py-2 border rounded"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Tipo</label>
                      <select
                        value={productTypeFilter}
                        onChange={e => setProductTypeFilter(e.target.value)}
                        className="w-full px-3 py-2 border rounded"
                      >
                        <option value="all">Todos</option>
                        <option value="item">Estoque</option>
                        <option value="kit">Kits</option>
                        <option value="sweet">Doces</option>
                        <option value="design">Designs</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 mb-3">
                    <label className="text-sm font-medium">Quantidade:</label>
                    <input
                      type="number"
                      min="1"
                      value={newItemQty}
                      onChange={e => setNewItemQty(e.target.value)}
                      className="w-20 px-2 py-1 border rounded text-sm"
                    />
                  </div>

                  {productSearch.trim() && (
                    <div className="border rounded bg-white max-h-40 overflow-y-auto">
                      {filteredProducts.length === 0 ? (
                        <p className="text-sm text-gray-400 p-3">Nenhum produto encontrado.</p>
                      ) : (
                        filteredProducts.slice(0, 20).map(p => (
                          <button
                            key={`${p.type}-${p.id}`}
                            type="button"
                            onClick={() => addProduct(p)}
                            className="w-full text-left px-3 py-2 text-sm hover:bg-yellow-50 flex items-center gap-2"
                          >
                            <span className="text-xs bg-gray-100 px-1.5 py-0.5 rounded text-gray-500">{PRODUCT_TYPE_LABELS[p.type]}</span>
                            {p.name}
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── Categories section ────────────────────────────────────────── */}
            {(formData.type === 'category' || formData.type === 'mixed') && (
              <div className="border-t pt-4 mt-4">
                <h4 className="font-semibold mb-3">Categorias do combo</h4>

                {/* Added categories */}
                {formCategories.length > 0 && (
                  <ul className="space-y-2 mb-4">
                    {formCategories.map((cat, idx) => (
                      <li key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                        <div>
                          <span className="font-medium">{cat.category_name}</span>
                          <span className="text-xs text-gray-500 ml-2">({SECTION_LABELS[cat.product_section]})</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeCategory(idx)}
                          className="text-red-500 hover:text-red-700 text-sm"
                        >
                          🗑️ Remover
                        </button>
                      </li>
                    ))}
                  </ul>
                )}

                {/* Category picker */}
                <div className="border rounded bg-white max-h-40 overflow-y-auto">
                  {categories.length === 0 ? (
                    <p className="text-sm text-gray-400 p-3">Nenhuma categoria cadastrada.</p>
                  ) : (
                    categories.map((cat, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => addCategory(cat)}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-yellow-50 flex items-center gap-2"
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
            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="bg-brand-blue hover:bg-brand-blue-dark text-white py-2 px-4 rounded disabled:opacity-50"
              >
                {saving ? 'Salvando...' : editingCombo ? 'Salvar alterações' : 'Criar combo'}
              </button>
              <button
                type="button"
                onClick={closeForm}
                className="border rounded hover:bg-gray-100 py-2 px-4 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ─── Combo List ───────────────────────────────────────────────────── */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        {filteredCombos.length === 0 ? (
          <div className="px-6 py-8 text-center">
            <p className="text-gray-500">
              {combos.length === 0 ? 'Nenhum combo cadastrado' : 'Nenhum combo encontrado para a busca.'}
            </p>
          </div>
        ) : (
          <ul role="list" className="divide-y divide-gray-200">
            {filteredCombos.map(combo => (
              <li key={combo.id} className="px-6 py-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="text-lg font-semibold">{combo.name}</h3>
                      <span className={`text-xs px-2 py-1 rounded font-semibold ${combo.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-700'}`}>
                        {combo.is_active ? 'Ativo' : 'Inativo'}
                      </span>
                      <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded font-semibold">
                        {TYPE_LABELS[combo.type]}
                      </span>
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded font-semibold">
                        {DISCOUNT_TYPE_LABELS[combo.discount_type]}
                      </span>
                    </div>

                    <div className="text-sm text-gray-600 mt-1">
                      <span className="font-medium text-green-600">{discountLabel(combo)}</span>
                      {combo.priority > 0 && (
                        <span className="ml-3 text-xs text-gray-500">Prioridade: {combo.priority}</span>
                      )}
                    </div>

                    {/* Products */}
                    {combo.items.length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs text-gray-500 font-medium mb-1">Produtos:</p>
                        <div className="flex flex-wrap gap-1">
                          {combo.items.map((item, idx) => (
                            <span key={idx} className="text-xs bg-gray-100 border border-gray-200 px-2 py-0.5 rounded text-gray-600">
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
                            <span key={idx} className="text-xs bg-blue-50 border border-blue-100 px-2 py-0.5 rounded text-blue-700">
                              {cat.category_name} ({SECTION_LABELS[cat.product_section]})
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2 flex-shrink-0">
                    <button
                      onClick={() => toggleActive(combo)}
                      className={`py-1 px-3 rounded text-sm ${
                        combo.is_active
                          ? 'bg-gray-300 hover:bg-gray-400 text-gray-800'
                          : 'bg-green-500 hover:bg-green-600 text-white'
                      }`}
                    >
                      {combo.is_active ? 'Desativar' : 'Ativar'}
                    </button>
                    <button
                      onClick={() => openEdit(combo)}
                      className="bg-brand-blue hover:bg-brand-blue-dark text-white py-1 px-3 rounded text-sm"
                    >
                      ✏️ Editar
                    </button>
                    <button
                      onClick={() => handleDelete(combo)}
                      className="bg-red-500 hover:bg-red-700 text-white py-1 px-3 rounded text-sm"
                    >
                      🗑️ Deletar
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
