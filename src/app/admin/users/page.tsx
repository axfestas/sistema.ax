'use client'

import { useState, useEffect } from 'react'
import { useToast } from '@/hooks/useToast'

interface User {
  id: number
  email: string
  name: string
  role: 'admin' | 'user'
  active: number
  phone?: string
  created_at: string
  updated_at?: string
}

export default function UsersPage() {
  const { showSuccess, showError } = useToast()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    password: '',
    role: 'user' as 'admin' | 'user',
    active: 1,
    phone: '',
  })

  useEffect(() => {
    loadUsers()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const loadUsers = async () => {
    try {
      const response = await fetch('/api/users')
      if (response.ok) {
        const data: User[] = await response.json()
        setUsers(data)
      } else {
        showError('Erro ao carregar usuáries')
      }
    } catch (error) {
      console.error('Error loading users:', error)
      showError('Erro ao carregar usuáries')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const userData = {
      email: formData.email,
      name: formData.name,
      role: formData.role,
      active: formData.active,
      phone: formData.phone || undefined,
      ...(formData.password && { password: formData.password }),
    }

    try {
      const url = editingUser ? `/api/users?id=${editingUser.id}` : '/api/users'
      const method = editingUser ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      })

      if (response.ok) {
        await loadUsers()
        setShowForm(false)
        setEditingUser(null)
        setFormData({ email: '', name: '', password: '', role: 'user', active: 1, phone: '' })
        showSuccess(editingUser ? 'Usuárie atualizade com sucesso!' : 'Usuárie criade com sucesso!')
      } else {
        const error: any = await response.json()
        showError('Erro: ' + (error.error || 'Falha ao salvar usuárie'))
      }
    } catch (error) {
      console.error('Error saving user:', error)
      showError('Erro ao salvar usuárie')
    }
  }

  const handleEdit = (user: User) => {
    setEditingUser(user)
    setFormData({
      email: user.email,
      name: user.name,
      password: '', // Never populate password on edit
      role: user.role,
      active: user.active,
      phone: user.phone || '',
    })
    setShowForm(true)
  }

  const handleDelete = async (id: number, userName: string) => {
    if (!confirm(`Tem certeza que deseja deletar o usuárie ${userName}?`)) return

    try {
      const response = await fetch(`/api/users?id=${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        await loadUsers()
        showSuccess('Usuárie deletade com sucesso!')
      } else {
        const error: any = await response.json()
        showError('Erro: ' + (error.error || 'Falha ao deletar usuárie'))
      }
    } catch (error) {
      console.error('Error deleting user:', error)
      showError('Erro ao deletar usuárie')
    }
  }

  const toggleActive = async (user: User) => {
    try {
      const response = await fetch(`/api/users?id=${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: user.active === 1 ? 0 : 1 }),
      })

      if (response.ok) {
        await loadUsers()
        showSuccess(user.active === 1 ? 'Usuárie desativade' : 'Usuárie ativade')
      } else {
        showError('Erro ao atualizar status')
      }
    } catch (error) {
      console.error('Error toggling active status:', error)
      showError('Erro ao atualizar status')
    }
  }

  if (loading) {
    return <div className="p-4">Carregando...</div>
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-2xl font-bold">Gerenciar Usuáries</h2>
          <p className="text-gray-600 text-sm mt-1">
            Gerencie contas de usuáries do sistema
          </p>
        </div>
        <button
          onClick={() => {
            setShowForm(true)
            setEditingUser(null)
            setFormData({ email: '', name: '', password: '', role: 'user', active: 1, phone: '' })
          }}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          + Novo Usuárie
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h3 className="text-xl font-bold mb-4">
            {editingUser ? 'Editar Usuárie' : 'Novo Usuárie'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nome Completo</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full px-3 py-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required={!editingUser}
                  disabled={!!editingUser}
                  className="w-full px-3 py-2 border rounded disabled:bg-gray-100"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  {editingUser ? 'Nova Senha (deixe em branco para manter)' : 'Senha'}
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required={!editingUser}
                  minLength={6}
                  className="w-full px-3 py-2 border rounded"
                  placeholder={editingUser ? 'Deixe em branco para manter senha atual' : ''}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Telefone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 border rounded"
                  placeholder="(00) 00000-0000"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Perfil</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as 'admin' | 'user' })}
                  className="w-full px-3 py-2 border rounded"
                >
                  <option value="user">Usuárie</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="active"
                  checked={formData.active === 1}
                  onChange={(e) => setFormData({ ...formData, active: e.target.checked ? 1 : 0 })}
                  className="mr-2"
                />
                <label htmlFor="active" className="text-sm font-medium">Ativo</label>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
              >
                Salvar
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false)
                  setEditingUser(null)
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
        {users.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-500">Nenhum usuárie cadastrade</p>
          </div>
        ) : (
          <ul role="list" className="divide-y divide-gray-200">
            {users.map((user) => (
              <li key={user.id} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold">{user.name}</h3>
                      <span className={`text-xs px-2 py-1 rounded ${
                        user.role === 'admin' 
                          ? 'bg-purple-100 text-purple-700' 
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {user.role === 'admin' ? 'Admin' : 'Usuárie'}
                      </span>
                      {user.active === 0 && (
                        <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">
                          Inativo
                        </span>
                      )}
                    </div>
                    <div className="mt-1 text-sm text-gray-600">
                      <p>📧 {user.email}</p>
                      {user.phone && <p>📱 {user.phone}</p>}
                      <p className="text-xs text-gray-400 mt-1">
                        Criado em: {new Date(user.created_at).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => toggleActive(user)}
                      className={`${
                        user.active === 1 
                          ? 'bg-orange-500 hover:bg-orange-700' 
                          : 'bg-green-500 hover:bg-green-700'
                      } text-white font-bold py-1 px-3 rounded text-sm`}
                      title={user.active === 1 ? 'Desativar' : 'Ativar'}
                    >
                      {user.active === 1 ? '🔒 Desativar' : '✓ Ativar'}
                    </button>
                    <button
                      onClick={() => handleEdit(user)}
                      className="bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-1 px-3 rounded text-sm"
                    >
                      ✏️ Editar
                    </button>
                    <button
                      onClick={() => handleDelete(user.id, user.name)}
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
    </div>
  )
}
