'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/hooks/useToast'
import Image from 'next/image'

interface PortfolioImage {
  id: number
  title: string
  description?: string
  image_url: string
  display_order: number
  is_active: number
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

export default function AdminPortfolioPage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [images, setImages] = useState<PortfolioImage[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingImage, setEditingImage] = useState<PortfolioImage | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    image_url: '',
    display_order: 0,
    is_active: 1
  })
  const router = useRouter()
  const { showSuccess, showError } = useToast()

  useEffect(() => {
    checkAuth()
    loadImages()
  }, [])

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/auth/user')
      const data = await res.json() as AuthResponse
      if (data.authenticated && data.user) {
        setUser(data.user)
      } else {
        router.push('/login')
      }
    } catch (error) {
      router.push('/login')
    } finally {
      setLoading(false)
    }
  }

  const loadImages = async () => {
    try {
      const response = await fetch('/api/portfolio')
      if (response.ok) {
        const data = await response.json() as PortfolioImage[]
        setImages(data)
      }
    } catch (error) {
      console.error('Error loading images:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const url = editingImage 
        ? `/api/portfolio?id=${editingImage.id}`
        : '/api/portfolio'
      
      const method = editingImage ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        setShowForm(false)
        setEditingImage(null)
        setFormData({
          title: '',
          description: '',
          image_url: '',
          display_order: 0,
          is_active: 1
        })
        loadImages()
        showSuccess(editingImage ? 'Imagem atualizada com sucesso!' : 'Imagem adicionada com sucesso!')
      } else {
        showError('Erro ao salvar imagem')
      }
    } catch (error) {
      console.error('Error saving image:', error)
      showError('Erro ao salvar imagem')
    }
  }

  const handleEdit = (image: PortfolioImage) => {
    setEditingImage(image)
    setFormData({
      title: image.title,
      description: image.description || '',
      image_url: image.image_url,
      display_order: image.display_order,
      is_active: image.is_active
    })
    setShowForm(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir esta imagem?')) return

    try {
      const response = await fetch(`/api/portfolio?id=${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        loadImages()
        showSuccess('Imagem excluída com sucesso!')
      } else {
        showError('Erro ao excluir imagem')
      }
    } catch (error) {
      console.error('Error deleting image:', error)
      showError('Erro ao excluir imagem')
    }
  }

  const toggleActive = async (image: PortfolioImage) => {
    try {
      const response = await fetch(`/api/portfolio?id=${image.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: image.is_active ? 0 : 1 })
      })

      if (response.ok) {
        loadImages()
      }
    } catch (error) {
      console.error('Error toggling active status:', error)
    }
  }

  if (loading) {
    return <div className="p-8">Carregando...</div>
  }

  if (!user) {
    return <div className="p-8">Acesso negado.</div>
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Gerenciar Portfólio</h1>
            <p className="text-gray-600 mt-2">
              Adicione e gerencie fotos da galeria que aparecem na página inicial
            </p>
          </div>
          <button
            onClick={() => {
              setShowForm(!showForm)
              setEditingImage(null)
              setFormData({
                title: '',
                description: '',
                image_url: '',
                display_order: 0,
                is_active: 1
              })
            }}
            className="bg-brand-yellow hover:bg-brand-yellow/90 text-white font-bold py-2 px-6 rounded-full"
          >
            {showForm ? 'Cancelar' : 'Nova Imagem'}
          </button>
        </div>

        {showForm && (
          <div className="bg-white p-6 rounded-lg shadow mb-8">
            <h2 className="text-xl font-bold mb-4">
              {editingImage ? 'Editar Imagem' : 'Nova Imagem'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Título *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Descrição</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">URL da Imagem *</label>
                <input
                  type="url"
                  required
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  placeholder="https://exemplo.com/imagem.jpg"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Ordem de Exibição</label>
                  <input
                    type="number"
                    value={formData.display_order}
                    onChange={(e) => setFormData({ ...formData, display_order: Number(e.target.value) })}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Status</label>
                  <select
                    value={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: Number(e.target.value) })}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                  >
                    <option value={1}>Ativo</option>
                    <option value={0}>Inativo</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="bg-brand-yellow hover:bg-brand-yellow/90 text-white font-bold py-2 px-6 rounded-full"
                >
                  Salvar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false)
                    setEditingImage(null)
                  }}
                  className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-6 rounded-full"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {images.map((image) => (
            <div key={image.id} className="bg-white rounded-lg shadow overflow-hidden">
              <div className="h-48 bg-gray-200 relative">
                <Image
                  src={image.image_url}
                  alt={image.title}
                  fill
                  className="object-cover"
                />
                {image.is_active === 0 && (
                  <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded text-xs font-bold">
                    Inativo
                  </div>
                )}
              </div>
              <div className="p-4">
                <h3 className="font-bold mb-1">{image.title}</h3>
                {image.description && (
                  <p className="text-sm text-gray-600 mb-2">{image.description}</p>
                )}
                <p className="text-xs text-gray-500 mb-3">Ordem: {image.display_order}</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(image)}
                    className="flex-1 bg-blue-500 hover:bg-blue-600 text-white text-sm py-1 px-3 rounded"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => toggleActive(image)}
                    className={`flex-1 ${
                      image.is_active 
                        ? 'bg-yellow-500 hover:bg-yellow-600' 
                        : 'bg-green-500 hover:bg-green-600'
                    } text-white text-sm py-1 px-3 rounded`}
                  >
                    {image.is_active ? 'Desativar' : 'Ativar'}
                  </button>
                  <button
                    onClick={() => handleDelete(image.id)}
                    className="flex-1 bg-red-500 hover:bg-red-600 text-white text-sm py-1 px-3 rounded"
                  >
                    Excluir
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {images.length === 0 && !showForm && (
          <div className="text-center py-12">
            <p className="text-gray-600">Nenhuma imagem cadastrada ainda.</p>
            <button
              onClick={() => setShowForm(true)}
              className="mt-4 bg-brand-yellow hover:bg-brand-yellow/90 text-white font-bold py-2 px-6 rounded-full"
            >
              Adicionar Primeira Imagem
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
