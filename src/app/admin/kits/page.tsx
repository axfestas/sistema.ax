'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { useToast } from '@/hooks/useToast'
import ImageUpload from '@/components/ImageUpload'
import { formatKitId } from '@/lib/formatId'

interface Kit {
  id: number
  name: string
  description?: string
  price: number
  image_url?: string
  is_active: number
}

interface Item {
  id: number
  name: string
  quantity: number
}

interface KitItem {
  id: number
  item_id: number
  item_name: string
  quantity: number
}

interface KitWithItems extends Kit {
  items: KitItem[]
}

export default function KitsPage() {
  const { showSuccess, showError } = useToast()
  const [kits, setKits] = useState<Kit[]>([])
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [showItemsModal, setShowItemsModal] = useState(false)
  const [editingKit, setEditingKit] = useState<Kit | null>(null)
  const [selectedKit, setSelectedKit] = useState<KitWithItems | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    image_url: '',
    is_active: 1,
  })
  const [formKitItems, setFormKitItems] = useState<Array<{ item_id: number; item_name: string; quantity: number }>>([])
  const [newFormItem, setNewFormItem] = useState({
    item_id: '',
    quantity: '1',
  })

  useEffect(() => {
    loadKits()
    loadItems()
  }, [])

  const loadKits = async () => {
    try {
      const response = await fetch('/api/kits')
      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`)
      }
      if (response.ok) {
        const data: any = await response.json()
        setKits(data)
      }
    } catch (error) {
      console.error('Error loading kits:', error)
      setKits([])
    } finally {
      setLoading(false)
    }
  }

  const loadItems = async () => {
    try {
      const response = await fetch('/api/items')
      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`)
      }
      if (response.ok) {
        const data: any = await response.json()
        setItems(data)
      }
    } catch (error) {
      console.error('Error loading items:', error)
      setItems([])
    }
  }

  const loadKitWithItems = async (kitId: number) => {
    try {
      const response = await fetch(`/api/kits?id=${kitId}`)
      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`)
      }
      if (response.ok) {
        const data: KitWithItems = await response.json()
        setSelectedKit(data)
        setShowItemsModal(true)
      }
    } catch (error) {
      console.error('Error loading kit items:', error)
      showError('Erro ao carregar itens do kit')
    }
  }

  const handleAddFormItem = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!newFormItem.item_id || !newFormItem.quantity) return
    
    const itemId = parseInt(newFormItem.item_id)
    const quantity = parseInt(newFormItem.quantity)
    const item = items.find(i => i.id === itemId)
    
    if (!item) return
    
    // Check if item already exists in the list
    const existingIndex = formKitItems.findIndex(i => i.item_id === itemId)
    
    if (existingIndex >= 0) {
      // Update quantity
      const updated = [...formKitItems]
      updated[existingIndex].quantity = quantity
      setFormKitItems(updated)
    } else {
      // Add new item
      setFormKitItems([...formKitItems, {
        item_id: itemId,
        item_name: item.name,
        quantity: quantity
      }])
    }
    
    setNewFormItem({ item_id: '', quantity: '1' })
  }

  const handleRemoveFormItem = (itemId: number) => {
    setFormKitItems(formKitItems.filter(i => i.item_id !== itemId))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const kitData = {
      name: formData.name,
      description: formData.description || undefined,
      price: parseFloat(formData.price),
      image_url: formData.image_url || undefined,
      is_active: formData.is_active,
    }

    try {
      const url = editingKit ? `/api/kits?id=${editingKit.id}` : '/api/kits'
      const method = editingKit ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(kitData),
      })

      if (response.ok) {
        const savedKit = await response.json() as { id: number }
        const kitId = editingKit ? editingKit.id : savedKit.id
        
        // Save kit items for new kits or when editing
        if (formKitItems.length > 0) {
          // If editing, first get current items to avoid duplicates
          if (editingKit) {
            const currentKit = await fetch(`/api/kits?id=${kitId}`).then(r => r.json()) as KitWithItems
            
            // Add new items that don't exist yet
            for (const formItem of formKitItems) {
              const exists = currentKit.items?.some((i: any) => i.item_id === formItem.item_id)
              
              if (!exists) {
                await fetch('/api/kit-items', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    kit_id: kitId,
                    item_id: formItem.item_id,
                    quantity: formItem.quantity,
                  }),
                })
              }
            }
          } else {
            // For new kits, add all items
            for (const item of formKitItems) {
              await fetch('/api/kit-items', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  kit_id: kitId,
                  item_id: item.item_id,
                  quantity: item.quantity,
                }),
              })
            }
          }
        }
        
        await loadKits()
        setShowForm(false)
        setEditingKit(null)
        setFormData({ name: '', description: '', price: '', image_url: '', is_active: 1 })
        setFormKitItems([])
        showSuccess(editingKit ? 'Kit atualizado com sucesso!' : 'Kit criado com sucesso!')
      } else {
        const error: any = await response.json()
        showError('Erro: ' + (error.error || 'Falha ao salvar kit'))
      }
    } catch (error) {
      console.error('Error saving kit:', error)
      showError('Erro ao salvar kit')
    }
  }

  const handleEdit = (kit: Kit) => {
    setEditingKit(kit)
    setFormData({
      name: kit.name,
      description: kit.description || '',
      price: kit.price.toString(),
      image_url: kit.image_url || '',
      is_active: kit.is_active,
    })
    
    // Load kit items for editing
    fetch(`/api/kits?id=${kit.id}`)
      .then(r => {
        if (!r.ok) {
          throw new Error(`Erro HTTP: ${r.status}`)
        }
        return r.json()
      })
      .then((data) => {
        const kitData = data as KitWithItems
        if (kitData.items) {
          setFormKitItems(kitData.items.map(item => ({
            item_id: item.item_id,
            item_name: item.item_name,
            quantity: item.quantity
          })))
        }
      })
      .catch(err => {
        console.error('Error loading kit items for edit:', err)
        setFormKitItems([])
      })
    
    setShowForm(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Tem certeza que deseja deletar este kit?')) return

    try {
      const response = await fetch(`/api/kits?id=${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`)
      }

      if (response.ok) {
        await loadKits()
        showSuccess('Kit deletade com sucesso!')
      } else {
        showError('Erro ao deletar kit')
      }
    } catch (error) {
      console.error('Error deleting kit:', error)
      showError('Erro ao deletar kit')
    }
  }

  if (loading) {
    return <div className="p-4">Carregando...</div>
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-2xl font-bold">Gerenciar Kits</h2>
          <p className="text-gray-600 text-sm mt-1">
            Crie kits com múltiplos itens do estoque
          </p>
        </div>
        <button
          onClick={() => {
            setShowForm(true)
            setEditingKit(null)
            setFormData({ name: '', description: '', price: '', image_url: '', is_active: 1 })
            setFormKitItems([])
          }}
          className="bg-brand-blue hover:bg-brand-blue-dark text-white font-bold py-2 px-4 rounded"
        >
          + Novo Kit
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h3 className="text-xl font-bold mb-4">
            {editingKit ? 'Editar Kit' : 'Novo Kit'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Nome do Kit</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="w-full px-3 py-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Descrição</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border rounded"
                rows={3}
              />
            </div>
            <ImageUpload
              currentImage={formData.image_url}
              onUpload={(url) => setFormData({ ...formData, image_url: url })}
              folder="kits"
              label="Imagem do Kit"
            />
            <div>
              <label className="block text-sm font-medium mb-1">Preço (R$)</label>
              <input
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                required
                className="w-full px-3 py-2 border rounded"
              />
            </div>
            
            {/* Section to add items to the kit */}
            <div className="border-t pt-4 mt-4">
              <h4 className="font-semibold mb-3">Itens do Kit</h4>
              
              {/* Form to add item */}
              <div className="mb-4 p-4 bg-gray-50 rounded">
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">Selecione um Item</label>
                    <select
                      value={newFormItem.item_id}
                      onChange={(e) => setNewFormItem({ ...newFormItem, item_id: e.target.value })}
                      className="w-full px-3 py-2 border rounded"
                    >
                      <option value="">Selecione um item</option>
                      {items.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name} (Estoque: {item.quantity})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Quantidade</label>
                    <input
                      type="number"
                      min="1"
                      value={newFormItem.quantity}
                      onChange={(e) => setNewFormItem({ ...newFormItem, quantity: e.target.value })}
                      className="w-full px-3 py-2 border rounded"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleAddFormItem}
                  disabled={!newFormItem.item_id}
                  className="bg-brand-blue hover:bg-brand-blue-dark text-white font-bold py-2 px-4 rounded text-sm disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  + Adicionar Item
                </button>
              </div>
              
              {/* List of selected items */}
              <div>
                {formKitItems.length === 0 ? (
                  <p className="text-gray-500 text-sm">Nenhum item adicionado ao kit</p>
                ) : (
                  <ul className="space-y-2">
                    {formKitItems.map((item) => (
                      <li key={item.item_id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                        <div>
                          <span className="font-medium">{item.item_name}</span>
                          <span className="text-gray-600 ml-2">× {item.quantity}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveFormItem(item.item_id)}
                          className="text-red-500 hover:text-red-700 text-sm"
                        >
                          🗑️ Remover
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active === 1}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked ? 1 : 0 })}
                className="mr-2"
              />
              <label htmlFor="is_active" className="text-sm font-medium">Ativo</label>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="bg-brand-blue hover:bg-brand-blue-dark text-white font-bold py-2 px-4 rounded"
              >
                Salvar
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false)
                  setEditingKit(null)
                  setFormKitItems([])
                }}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow">
        {kits.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-500">Nenhum kit cadastrado</p>
          </div>
        ) : (
          <ul role="list" className="divide-y divide-gray-200">
            {kits.map((kit) => (
              <li key={kit.id} className="px-6 py-4">
                <div className="flex items-center justify-between gap-4">
                  {/* Thumbnail */}
                  <div className="w-14 h-14 flex-shrink-0 rounded overflow-hidden bg-gray-100">
                    {kit.image_url ? (
                      <div className="relative w-14 h-14">
                        <Image src={kit.image_url} alt={kit.name} fill sizes="56px" className="object-cover" />
                      </div>
                    ) : (
                      <div className="w-14 h-14 flex items-center justify-center text-gray-300 text-2xl">🎁</div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono bg-purple-100 text-purple-800 px-2 py-1 rounded font-semibold">
                        {formatKitId(kit.id)}
                      </span>
                      <h3 className="text-lg font-semibold">{kit.name}</h3>
                      {kit.is_active === 0 && (
                        <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded">
                          Inativo
                        </span>
                      )}
                    </div>
                    {kit.description && (
                      <p className="text-sm text-gray-600 mt-1">{kit.description}</p>
                    )}
                    <div className="mt-2 flex gap-4 text-sm">
                      <span className="text-green-600 font-semibold">
                        R$ {kit.price.toFixed(2)}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => loadKitWithItems(kit.id)}
                      className="bg-brand-blue hover:bg-brand-blue-dark text-white font-bold py-1 px-3 rounded text-sm"
                    >
                      📦 Itens
                    </button>
                    <button
                      onClick={() => handleEdit(kit)}
                      className="bg-brand-blue hover:bg-brand-blue-dark text-white font-bold py-1 px-3 rounded text-sm"
                    >
                      ✏️ Editar
                    </button>
                    <button
                      onClick={() => handleDelete(kit.id)}
                      className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-3 rounded text-sm"
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

      {/* Modal de Itens do Kit */}
      {showItemsModal && selectedKit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Itens do Kit: {selectedKit.name}</h3>
              <button
                onClick={() => setShowItemsModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>

            {/* Lista de itens do kit */}
            <div>
              <h4 className="font-semibold mb-3">Itens incluídos ({selectedKit.items.length})</h4>
              {selectedKit.items.length === 0 ? (
                <p className="text-gray-500 text-sm">Nenhum item adicionado ainda</p>
              ) : (
                <ul className="space-y-2">
                  {selectedKit.items.map((kitItem) => (
                    <li key={kitItem.id} className="flex items-center p-3 bg-gray-50 rounded">
                      <div>
                        <span className="font-medium">{kitItem.item_name}</span>
                        <span className="text-gray-600 ml-2">× {kitItem.quantity}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowItemsModal(false)}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
