'use client'

import { useState, useEffect } from 'react'
import Layout from '@/components/Layout'

interface User {
  id: string
  username: string
  name: string
  role: 'COMMON' | 'ADMIN' | 'SUPPORT'
  isFirstLogin: boolean
  sector: {
    id: string
    name: string
  }
  _count: {
    signatures: number
    requests: number
  }
  createdAt: string
}

interface Sector {
  id: string
  name: string
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [sectors, setSectors] = useState<Sector[]>([])
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  })
  const [filters, setFilters] = useState({
    search: '',
    role: '',
    sectorId: ''
  })
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [createForm, setCreateForm] = useState({
    username: '',
    name: '',
    password: '',
    role: 'COMMON',
    sectorId: ''
  })
  const [editForm, setEditForm] = useState({
    username: '',
    name: '',
    password: '',
    role: 'COMMON',
    sectorId: ''
  })
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [createLoading, setCreateLoading] = useState(false)
  const [editLoading, setEditLoading] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      await Promise.all([
        fetchUsers(),
        fetchSectors()
      ])
    }
    fetchData()
  }, [pagination.page, pagination.limit])

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...filters
      })

      const response = await fetch(`/api/admin/users?${params}`)
      if (response.ok) {
        const data = await response.json()
        setUsers(data.data.users)
        setPagination(data.data.pagination)
      }
    } catch (error) {
      console.error('Erro ao carregar usuários:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchSectors = async () => {
    try {
      const response = await fetch('/api/admin/sectors?limit=100')
      if (response.ok) {
        const data = await response.json()
        setSectors(data.data.sectors)
      }
    } catch (error) {
      console.error('Erro ao carregar setores:', error)
    }
  }

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value
    })
  }

  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setPagination({ ...pagination, page: 1 })
    fetchUsers()
  }

  const clearFilters = () => {
    setFilters({
      search: '',
      role: '',
      sectorId: ''
    })
    setPagination({ ...pagination, page: 1 })
    setTimeout(fetchUsers, 100)
  }

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreateLoading(true)
    setError('')

    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(createForm)
      })

      const data = await response.json()

      if (data.success) {
        setSuccess('Usuário criado com sucesso!')
        setShowCreateModal(false)
        setCreateForm({
          username: '',
          name: '',
          password: '',
          role: 'COMMON',
          sectorId: ''
        })
        fetchUsers()
      } else {
        setError(data.error || 'Erro ao criar usuário')
      }
    } catch (error) {
      setError('Erro de conexão. Tente novamente.')
      console.error('Erro ao criar usuário:', error)
    } finally {
      setCreateLoading(false)
    }
  }

  const handleCreateChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setCreateForm({
      ...createForm,
      [e.target.name]: e.target.value
    })
  }

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setEditForm({
      ...editForm,
      [e.target.name]: e.target.value
    })
  }

  const openEditModal = (user: User) => {
    setEditingUser(user)
    setEditForm({
      username: user.username,
      name: user.name,
      password: '', // Não preencher senha por segurança
      role: user.role,
      sectorId: user.sector.id
    })
    setShowEditModal(true)
    setError('')
    setSuccess('')
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingUser) return

    setEditLoading(true)
    setError('')

    try {
      const response = await fetch(`/api/admin/users/${editingUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(editForm)
      })

      const data = await response.json()

      if (data.success) {
        setSuccess('Usuário atualizado com sucesso!')
        setShowEditModal(false)
        setEditingUser(null)
        setEditForm({
          username: '',
          name: '',
          password: '',
          role: 'COMMON',
          sectorId: ''
        })
        fetchUsers()
      } else {
        setError(data.error || 'Erro ao atualizar usuário')
      }
    } catch (error) {
      setError('Erro de conexão. Tente novamente.')
      console.error('Erro ao atualizar usuário:', error)
    } finally {
      setEditLoading(false)
    }
  }

  const handleDelete = async (user: User) => {
    if (user._count.signatures > 0 || user._count.requests > 0) {
      setError('Não é possível deletar usuário que possui assinaturas ou solicitações')
      return
    }

    if (!confirm(`Tem certeza que deseja deletar o usuário "${user.name}"?`)) {
      return
    }

    setDeleteLoading(user.id)
    setError('')

    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (data.success) {
        setSuccess('Usuário deletado com sucesso!')
        fetchUsers()
      } else {
        setError(data.error || 'Erro ao deletar usuário')
      }
    } catch (error) {
      setError('Erro de conexão. Tente novamente.')
      console.error('Erro ao deletar usuário:', error)
    } finally {
      setDeleteLoading(null)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  const getRoleLabel = (role: string) => {
    const roles = {
      COMMON: 'Comum',
      ADMIN: 'Administrador',
      SUPPORT: 'Suporte'
    }
    return roles[role as keyof typeof roles] || role
  }

  const getRoleBadgeColor = (role: string) => {
    const colors = {
      COMMON: 'badge-info',
      ADMIN: 'badge-danger',
      SUPPORT: 'badge-warning'
    }
    return colors[role as keyof typeof colors] || 'badge-info'
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-display font-bold text-gray-900">
              Gerenciar Usuários
            </h1>
            <p className="mt-2 text-gray-600">
              Administre usuários do sistema
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary"
          >
            Criar Usuário
          </button>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
            {success}
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Filters */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-display font-semibold text-gray-900">
              Filtros de Busca
            </h2>
          </div>

          <form onSubmit={handleFilterSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="form-group">
                <label htmlFor="search" className="form-label">
                  Buscar
                </label>
                <input
                  id="search"
                  name="search"
                  type="text"
                  className="input-field"
                  placeholder="Username ou nome..."
                  value={filters.search}
                  onChange={handleFilterChange}
                />
              </div>

              <div className="form-group">
                <label htmlFor="role" className="form-label">
                  Papel
                </label>
                <select
                  id="role"
                  name="role"
                  className="input-field"
                  value={filters.role}
                  onChange={handleFilterChange}
                >
                  <option value="">Todos os papéis</option>
                  <option value="COMMON">Comum</option>
                  <option value="ADMIN">Administrador</option>
                  <option value="SUPPORT">Suporte</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="sectorId" className="form-label">
                  Setor
                </label>
                <select
                  id="sectorId"
                  name="sectorId"
                  className="input-field"
                  value={filters.sectorId}
                  onChange={handleFilterChange}
                >
                  <option value="">Todos os setores</option>
                  {sectors.map((sector) => (
                    <option key={sector.id} value={sector.id}>
                      {sector.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex space-x-3">
              <button type="submit" className="btn-primary">
                Filtrar
              </button>
              <button type="button" onClick={clearFilters} className="btn-secondary">
                Limpar
              </button>
            </div>
          </form>
        </div>

        {/* Results */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-display font-semibold text-gray-900">
              Usuários ({pagination.total})
            </h2>
          </div>

          {loading ? (
            <div className="flex justify-center py-8">
              <div className="loading-spinner"></div>
            </div>
          ) : users.length > 0 ? (
            <div className="table-container">
              <table className="table">
                <thead className="table-header">
                  <tr>
                    <th className="table-header-cell">Username</th>
                    <th className="table-header-cell">Nome</th>
                    <th className="table-header-cell">Papel</th>
                    <th className="table-header-cell">Setor</th>
                    <th className="table-header-cell">Assinaturas</th>
                    <th className="table-header-cell">Primeiro Login</th>
                    <th className="table-header-cell">Ações</th>
                  </tr>
                </thead>
                <tbody className="table-body">
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td className="table-cell">
                        <span className="font-medium">{user.username}</span>
                      </td>
                      <td className="table-cell">{user.name}</td>
                      <td className="table-cell">
                        <span className={`badge ${getRoleBadgeColor(user.role)}`}>
                          {getRoleLabel(user.role)}
                        </span>
                      </td>
                      <td className="table-cell">{user.sector.name}</td>
                      <td className="table-cell">{user._count.signatures}</td>
                      <td className="table-cell">
                        {user.isFirstLogin ? (
                          <span className="badge badge-warning">Pendente</span>
                        ) : (
                          <span className="badge badge-success">Concluído</span>
                        )}
                      </td>
                      <td className="table-cell">
                        <div className="flex space-x-2">
                          <button 
                            onClick={() => openEditModal(user)}
                            className="text-primary-600 hover:text-primary-800 text-sm"
                            disabled={editLoading || deleteLoading === user.id}
                          >
                            {editLoading && editingUser?.id === user.id ? 'Editando...' : 'Editar'}
                          </button>
                          <button 
                            onClick={() => handleDelete(user)}
                            className="text-red-600 hover:text-red-800 text-sm"
                            disabled={editLoading || deleteLoading === user.id || user._count.signatures > 0 || user._count.requests > 0}
                          >
                            {deleteLoading === user.id ? 'Excluindo...' : 'Excluir'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">Nenhum usuário encontrado</p>
            </div>
          )}
        </div>

        {/* Create User Modal */}
        {showCreateModal && (
          <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-lg font-display font-semibold text-gray-900 mb-4">
                Criar Novo Usuário
              </h3>

              <form onSubmit={handleCreateSubmit} className="space-y-4">
                <div className="form-group">
                  <label htmlFor="create-username" className="form-label">
                    Username *
                  </label>
                  <input
                    id="create-username"
                    name="username"
                    type="text"
                    required
                    className="input-field"
                    value={createForm.username}
                    onChange={handleCreateChange}
                    disabled={createLoading}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="create-name" className="form-label">
                    Nome Completo *
                  </label>
                  <input
                    id="create-name"
                    name="name"
                    type="text"
                    required
                    className="input-field"
                    value={createForm.name}
                    onChange={handleCreateChange}
                    disabled={createLoading}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="create-password" className="form-label">
                    Senha Inicial *
                  </label>
                  <input
                    id="create-password"
                    name="password"
                    type="password"
                    required
                    className="input-field"
                    value={createForm.password}
                    onChange={handleCreateChange}
                    disabled={createLoading}
                    minLength={6}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="create-role" className="form-label">
                    Papel *
                  </label>
                  <select
                    id="create-role"
                    name="role"
                    required
                    className="input-field"
                    value={createForm.role}
                    onChange={handleCreateChange}
                    disabled={createLoading}
                  >
                    <option value="COMMON">Comum</option>
                    <option value="ADMIN">Administrador</option>
                    <option value="SUPPORT">Suporte</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="create-sectorId" className="form-label">
                    Setor *
                  </label>
                  <select
                    id="create-sectorId"
                    name="sectorId"
                    required
                    className="input-field"
                    value={createForm.sectorId}
                    onChange={handleCreateChange}
                    disabled={createLoading}
                  >
                    <option value="">Selecione um setor</option>
                    {sectors.map((sector) => (
                      <option key={sector.id} value={sector.id}>
                        {sector.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 btn-secondary"
                    disabled={createLoading}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 btn-primary flex items-center justify-center"
                    disabled={createLoading}
                  >
                    {createLoading ? (
                      <>
                        <div className="loading-spinner mr-2"></div>
                        Criando...
                      </>
                    ) : (
                      'Criar Usuário'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit User Modal */}
        {showEditModal && editingUser && (
          <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-lg font-display font-semibold text-gray-900 mb-4">
                Editar Usuário
              </h3>

              <form onSubmit={handleEditSubmit} className="space-y-4">
                <div className="form-group">
                  <label htmlFor="edit-username" className="form-label">
                    Username *
                  </label>
                  <input
                    id="edit-username"
                    name="username"
                    type="text"
                    required
                    className="input-field"
                    value={editForm.username}
                    onChange={handleEditChange}
                    disabled={editLoading}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="edit-name" className="form-label">
                    Nome Completo *
                  </label>
                  <input
                    id="edit-name"
                    name="name"
                    type="text"
                    required
                    className="input-field"
                    value={editForm.name}
                    onChange={handleEditChange}
                    disabled={editLoading}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="edit-password" className="form-label">
                    Nova Senha (deixe em branco para manter atual)
                  </label>
                  <input
                    id="edit-password"
                    name="password"
                    type="password"
                    className="input-field"
                    value={editForm.password}
                    onChange={handleEditChange}
                    disabled={editLoading}
                    minLength={6}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="edit-role" className="form-label">
                    Papel *
                  </label>
                  <select
                    id="edit-role"
                    name="role"
                    required
                    className="input-field"
                    value={editForm.role}
                    onChange={handleEditChange}
                    disabled={editLoading}
                  >
                    <option value="COMMON">Comum</option>
                    <option value="ADMIN">Administrador</option>
                    <option value="SUPPORT">Suporte</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="edit-sectorId" className="form-label">
                    Setor *
                  </label>
                  <select
                    id="edit-sectorId"
                    name="sectorId"
                    required
                    className="input-field"
                    value={editForm.sectorId}
                    onChange={handleEditChange}
                    disabled={editLoading}
                  >
                    <option value="">Selecione um setor</option>
                    {sectors.map((sector) => (
                      <option key={sector.id} value={sector.id}>
                        {sector.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="flex-1 btn-secondary"
                    disabled={editLoading}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 btn-primary flex items-center justify-center"
                    disabled={editLoading}
                  >
                    {editLoading ? (
                      <>
                        <div className="loading-spinner mr-2"></div>
                        Salvando...
                      </>
                    ) : (
                      'Salvar Alterações'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
