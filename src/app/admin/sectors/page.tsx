'use client'

import { useState, useEffect } from 'react'
import Layout from '@/components/Layout'

interface Sector {
  id: string
  name: string
  description: string | null
  _count: {
    users: number
    signatures: number
  }
  createdAt: string
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

export default function AdminSectorsPage() {
  const [sectors, setSectors] = useState<Sector[]>([])
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  })
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingSector, setEditingSector] = useState<Sector | null>(null)
  const [createForm, setCreateForm] = useState({
    name: '',
    description: ''
  })
  const [editForm, setEditForm] = useState({
    name: '',
    description: ''
  })
  const [createLoading, setCreateLoading] = useState(false)
  const [editLoading, setEditLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    fetchSectors()
  }, [pagination.page, pagination.limit])

  const fetchSectors = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        search
      })

      const response = await fetch(`/api/admin/sectors?${params}`)
      if (response.ok) {
        const data = await response.json()
        setSectors(data.data.sectors)
        setPagination(data.data.pagination)
      }
    } catch (error) {
      console.error('Erro ao carregar setores:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setPagination({ ...pagination, page: 1 })
    fetchSectors()
  }

  const clearSearch = () => {
    setSearch('')
    setPagination({ ...pagination, page: 1 })
    setTimeout(fetchSectors, 100)
  }

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreateLoading(true)
    setError('')

    try {
      const response = await fetch('/api/admin/sectors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(createForm)
      })

      const data = await response.json()

      if (data.success) {
        setSuccess('Setor criado com sucesso!')
        setShowCreateModal(false)
        setCreateForm({ name: '', description: '' })
        fetchSectors()
      } else {
        setError(data.error || 'Erro ao criar setor')
      }
    } catch (error) {
      setError('Erro de conexão. Tente novamente.')
      console.error('Erro ao criar setor:', error)
    } finally {
      setCreateLoading(false)
    }
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingSector) return

    setEditLoading(true)
    setError('')

    try {
      const response = await fetch(`/api/admin/sectors/${editingSector.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(editForm)
      })

      const data = await response.json()

      if (data.success) {
        setSuccess('Setor atualizado com sucesso!')
        setShowEditModal(false)
        setEditingSector(null)
        setEditForm({ name: '', description: '' })
        fetchSectors()
      } else {
        setError(data.error || 'Erro ao atualizar setor')
      }
    } catch (error) {
      setError('Erro de conexão. Tente novamente.')
      console.error('Erro ao atualizar setor:', error)
    } finally {
      setEditLoading(false)
    }
  }

  const handleDelete = async (sector: Sector) => {
    if (sector._count.users > 0 || sector._count.signatures > 0) {
      setError('Não é possível deletar setor que possui usuários ou assinaturas')
      return
    }

    if (!confirm(`Tem certeza que deseja deletar o setor "${sector.name}"?`)) {
      return
    }

    try {
      const response = await fetch(`/api/admin/sectors/${sector.id}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (data.success) {
        setSuccess('Setor deletado com sucesso!')
        fetchSectors()
      } else {
        setError(data.error || 'Erro ao deletar setor')
      }
    } catch (error) {
      setError('Erro de conexão. Tente novamente.')
      console.error('Erro ao deletar setor:', error)
    }
  }

  const openEditModal = (sector: Sector) => {
    setEditingSector(sector)
    setEditForm({
      name: sector.name,
      description: sector.description || ''
    })
    setShowEditModal(true)
  }

  const handleCreateChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setCreateForm({
      ...createForm,
      [e.target.name]: e.target.value
    })
  }

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setEditForm({
      ...editForm,
      [e.target.name]: e.target.value
    })
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-display font-bold text-gray-900">
              Gerenciar Setores
            </h1>
            <p className="mt-2 text-gray-600">
              Administre setores da organização
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary"
          >
            Criar Setor
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

        {/* Search */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-display font-semibold text-gray-900">
              Buscar Setores
            </h2>
          </div>

          <form onSubmit={handleSearchSubmit} className="space-y-4">
            <div className="flex space-x-3">
              <input
                type="text"
                className="flex-1 input-field"
                placeholder="Nome ou descrição do setor..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <button type="submit" className="btn-primary">
                Buscar
              </button>
              <button type="button" onClick={clearSearch} className="btn-secondary">
                Limpar
              </button>
            </div>
          </form>
        </div>

        {/* Results */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-display font-semibold text-gray-900">
              Setores ({pagination.total})
            </h2>
          </div>

          {loading ? (
            <div className="flex justify-center py-8">
              <div className="loading-spinner"></div>
            </div>
          ) : sectors.length > 0 ? (
            <div className="table-container">
              <table className="table">
                <thead className="table-header">
                  <tr>
                    <th className="table-header-cell">Nome</th>
                    <th className="table-header-cell">Descrição</th>
                    <th className="table-header-cell">Usuários</th>
                    <th className="table-header-cell">Assinaturas</th>
                    <th className="table-header-cell">Criado em</th>
                    <th className="table-header-cell">Ações</th>
                  </tr>
                </thead>
                <tbody className="table-body">
                  {sectors.map((sector) => (
                    <tr key={sector.id}>
                      <td className="table-cell">
                        <span className="font-medium">{sector.name}</span>
                      </td>
                      <td className="table-cell">
                        <div className="max-w-xs truncate" title={sector.description || ''}>
                          {sector.description || '-'}
                        </div>
                      </td>
                      <td className="table-cell">
                        <span className="badge badge-info">
                          {sector._count.users}
                        </span>
                      </td>
                      <td className="table-cell">
                        <span className="badge badge-success">
                          {sector._count.signatures}
                        </span>
                      </td>
                      <td className="table-cell">
                        <span className="text-sm text-gray-500">
                          {formatDate(sector.createdAt)}
                        </span>
                      </td>
                      <td className="table-cell">
                        <div className="flex space-x-2">
                          <button 
                            onClick={() => openEditModal(sector)}
                            className="text-primary-600 hover:text-primary-800 text-sm"
                            disabled={editLoading}
                          >
                            {editLoading && editingSector?.id === sector.id ? 'Editando...' : 'Editar'}
                          </button>
                          <button 
                            onClick={() => handleDelete(sector)}
                            className="text-red-600 hover:text-red-800 text-sm disabled:opacity-50"
                            disabled={sector._count.users > 0 || sector._count.signatures > 0}
                            title={sector._count.users > 0 || sector._count.signatures > 0 ? 'Não é possível excluir setor que possui usuários ou assinaturas' : ''}
                          >
                            Excluir
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
              <p className="text-gray-500">Nenhum setor encontrado</p>
            </div>
          )}
        </div>

        {/* Create Sector Modal */}
        {showCreateModal && (
          <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-lg font-display font-semibold text-gray-900 mb-4">
                Criar Novo Setor
              </h3>

              <form onSubmit={handleCreateSubmit} className="space-y-4">
                <div className="form-group">
                  <label htmlFor="create-name" className="form-label">
                    Nome do Setor *
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
                  <label htmlFor="create-description" className="form-label">
                    Descrição
                  </label>
                  <textarea
                    id="create-description"
                    name="description"
                    rows={3}
                    className="input-field resize-none"
                    value={createForm.description}
                    onChange={handleCreateChange}
                    disabled={createLoading}
                  />
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
                      'Criar Setor'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Sector Modal */}
        {showEditModal && editingSector && (
          <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-lg font-display font-semibold text-gray-900 mb-4">
                Editar Setor
              </h3>

              <form onSubmit={handleEditSubmit} className="space-y-4">
                <div className="form-group">
                  <label htmlFor="edit-name" className="form-label">
                    Nome do Setor *
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
                  <label htmlFor="edit-description" className="form-label">
                    Descrição
                  </label>
                  <textarea
                    id="edit-description"
                    name="description"
                    rows={3}
                    className="input-field resize-none"
                    value={editForm.description}
                    onChange={handleEditChange}
                    disabled={editLoading}
                  />
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
