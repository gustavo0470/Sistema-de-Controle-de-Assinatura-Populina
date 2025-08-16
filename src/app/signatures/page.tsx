'use client'

import { useState, useEffect } from 'react'
import Layout from '@/components/Layout'
import Link from 'next/link'

interface Signature {
  id: string
  reason: string
  token: string
  serverName: string
  sectorName: string
  createdAt: string
  user: {
    id: string
    name: string
  }
  sector: {
    name: string
  }
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

export default function SignaturesPage() {
  const [signatures, setSignatures] = useState<Signature[]>([])
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  })
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    search: '',
    startDate: '',
    endDate: '',
    token: '',
    server: '',
    sector: ''
  })
  const [tokens, setTokens] = useState<string[]>([])
  const [servers, setServers] = useState<string[]>([])
  const [sectors, setSectors] = useState<any[]>([])
  const [showRequestModal, setShowRequestModal] = useState(false)
  const [selectedSignature, setSelectedSignature] = useState<Signature | null>(null)
  const [requestForm, setRequestForm] = useState({
    type: 'DELETE' as 'EDIT' | 'DELETE',
    reason: ''
  })
  const [requestLoading, setRequestLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [editingSignature, setEditingSignature] = useState<Signature | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editForm, setEditForm] = useState({
    reason: '',
    token: ''
  })
  const [editLoading, setEditLoading] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null)
  const [editableSignatures, setEditableSignatures] = useState<Set<string>>(new Set())

  const fetchSignatures = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...filters
      })

      const response = await fetch(`/api/signatures?${params}`)
      if (response.ok) {
        const data = await response.json()
        setSignatures(data.data.signatures)
        setPagination(data.data.pagination)
      }
    } catch (error) {
      console.error('Erro ao carregar assinaturas:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSignatures()
    fetchDropdownData()
    fetchCurrentUser()
  }, [pagination.page, pagination.limit])

  useEffect(() => {
    if (currentUser && signatures.length > 0) {
      checkEditableSignatures()
    }
  }, [currentUser, signatures])

  const fetchCurrentUser = async () => {
    try {
      const response = await fetch('/api/auth/me')
      if (response.ok) {
        const data = await response.json()
        setCurrentUser(data.data.user)
      }
    } catch (error) {
      console.error('Erro ao buscar usuário atual:', error)
    }
  }

  const checkEditableSignatures = async () => {
    if (!currentUser || currentUser.role === 'ADMIN' || currentUser.role === 'SUPPORT') return
    
    const editableSet = new Set<string>()
    
    // Verificar para cada assinatura do usuário se pode editar
    for (const signature of signatures) {
      if (signature.user.id === currentUser.id) {
        try {
          const response = await fetch(`/api/signatures/${signature.id}/can-edit`)
          if (response.ok) {
            const data = await response.json()
            if (data.data.canEdit) {
              editableSet.add(signature.id)
            }
          }
        } catch (error) {
          console.error('Erro ao verificar edição:', error)
        }
      }
    }
    
    setEditableSignatures(editableSet)
  }

  const fetchDropdownData = async () => {
    try {
      // Buscar tokens
      const tokensResponse = await fetch('/api/tokens')
      if (tokensResponse.ok) {
        const tokensData = await tokensResponse.json()
        setTokens(tokensData.data.tokens)
      }

      // Buscar servidores
      const serversResponse = await fetch('/api/servers')
      if (serversResponse.ok) {
        const serversData = await serversResponse.json()
        setServers(serversData.data.servers)
      }

      // Buscar setores
      const sectorsResponse = await fetch('/api/admin/sectors?limit=100')
      if (sectorsResponse.ok) {
        const sectorsData = await sectorsResponse.json()
        setSectors(sectorsData.data.sectors)
      }
    } catch (error) {
      console.error('Erro ao carregar dados dos dropdowns:', error)
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
    fetchSignatures()
  }

  const clearFilters = () => {
    setFilters({
      search: '',
      startDate: '',
      endDate: '',
      token: '',
      server: '',
      sector: ''
    })
    setPagination({ ...pagination, page: 1 })
    setTimeout(fetchSignatures, 100)
  }

  const handlePageChange = (newPage: number) => {
    setPagination({ ...pagination, page: newPage })
  }

  const openRequestModal = (signature: Signature, type: 'EDIT' | 'DELETE') => {
    setSelectedSignature(signature)
    setRequestForm({ type, reason: '' })
    setShowRequestModal(true)
    setError('')
    setSuccess('')
  }

  const handleRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedSignature || !requestForm.reason.trim()) return

    setRequestLoading(true)
    setError('')

    try {
      const response = await fetch('/api/requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type: requestForm.type,
          signatureId: selectedSignature.id,
          reason: requestForm.reason.trim()
        })
      })

      const data = await response.json()

      if (data.success) {
        setSuccess('Solicitação enviada com sucesso! Aguarde a aprovação do administrador.')
        setShowRequestModal(false)
        setSelectedSignature(null)
        setRequestForm({ type: 'DELETE', reason: '' })
      } else {
        setError(data.error || 'Erro ao enviar solicitação')
      }
    } catch (error) {
      setError('Erro de conexão. Tente novamente.')
      console.error('Erro ao enviar solicitação:', error)
    } finally {
      setRequestLoading(false)
    }
  }

  const openEditModal = (signature: Signature) => {
    setEditingSignature(signature)
    setEditForm({
      reason: signature.reason,
      token: signature.token
    })
    setShowEditModal(true)
    setError('')
    setSuccess('')
  }

  // Editar via aprovação (para usuários comuns com request aprovado)
  const handleApprovedEdit = async (signature: Signature) => {
    setEditingSignature(signature)
    setEditForm({
      reason: signature.reason,
      token: signature.token
    })
    setShowEditModal(true)
    setError('')
    setSuccess('')
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingSignature) return

    setEditLoading(true)
    setError('')

    try {
      // Decidir qual endpoint usar baseado no tipo de usuário
      const isApprovedEdit = currentUser && 
        currentUser.role === 'COMMON' && 
        editableSignatures.has(editingSignature.id)
      
      const endpoint = isApprovedEdit 
        ? `/api/signatures/${editingSignature.id}/edit`
        : `/api/signatures/${editingSignature.id}`

      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(editForm)
      })

      const data = await response.json()

      if (data.success) {
        setSuccess('Assinatura atualizada com sucesso!')
        setShowEditModal(false)
        setEditingSignature(null)
        fetchSignatures()
        // Atualizar lista de assinaturas editáveis
        if (isApprovedEdit) {
          const newSet = new Set(editableSignatures)
          newSet.delete(editingSignature.id)
          setEditableSignatures(newSet)
        }
      } else {
        setError(data.error || 'Erro ao atualizar assinatura')
      }
    } catch (error) {
      setError('Erro de conexão. Tente novamente.')
      console.error('Erro ao atualizar assinatura:', error)
    } finally {
      setEditLoading(false)
    }
  }

  const handleDirectDelete = async (signature: Signature) => {
    if (!confirm(`Tem certeza que deseja deletar esta assinatura?\n\nMotivo: ${signature.reason}\nToken: ${signature.token}`)) {
      return
    }

    setDeleteLoading(signature.id)
    setError('')

    try {
      const response = await fetch(`/api/signatures/${signature.id}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (data.success) {
        setSuccess('Assinatura deletada com sucesso!')
        fetchSignatures()
      } else {
        setError(data.error || 'Erro ao deletar assinatura')
      }
    } catch (error) {
      setError('Erro de conexão. Tente novamente.')
      console.error('Erro ao deletar assinatura:', error)
    } finally {
      setDeleteLoading(null)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR')
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-display font-bold text-gray-900">
              Minhas Assinaturas
            </h1>
            <p className="mt-2 text-gray-600">
              Gerencie e visualize suas assinaturas
            </p>
          </div>
          <Link href="/dashboard" className="btn-primary">
            Nova Assinatura
          </Link>
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="form-group">
                <label htmlFor="search" className="form-label">
                  Buscar
                </label>
                <input
                  id="search"
                  name="search"
                  type="text"
                  className="input-field"
                  placeholder="Motivo, token, servidor..."
                  value={filters.search}
                  onChange={handleFilterChange}
                />
              </div>

              <div className="form-group">
                <label htmlFor="token" className="form-label">
                  Token
                </label>
                <select
                  id="token"
                  name="token"
                  className="input-field"
                  value={filters.token}
                  onChange={handleFilterChange}
                >
                  <option value="">Todos os tokens</option>
                  {tokens.map((token) => (
                    <option key={token} value={token}>
                      {token}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="server" className="form-label">
                  Servidor
                </label>
                <select
                  id="server"
                  name="server"
                  className="input-field"
                  value={filters.server}
                  onChange={handleFilterChange}
                >
                  <option value="">Todos os servidores</option>
                  {servers.map((server) => (
                    <option key={server} value={server}>
                      {server}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="sector" className="form-label">
                  Setor
                </label>
                <select
                  id="sector"
                  name="sector"
                  className="input-field"
                  value={filters.sector}
                  onChange={handleFilterChange}
                >
                  <option value="">Todos os setores</option>
                  {sectors.map((sector) => (
                    <option key={sector.id} value={sector.name}>
                      {sector.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="startDate" className="form-label">
                  Data Inicial
                </label>
                <input
                  id="startDate"
                  name="startDate"
                  type="date"
                  className="input-field"
                  value={filters.startDate}
                  onChange={handleFilterChange}
                />
              </div>

              <div className="form-group">
                <label htmlFor="endDate" className="form-label">
                  Data Final
                </label>
                <input
                  id="endDate"
                  name="endDate"
                  type="date"
                  className="input-field"
                  value={filters.endDate}
                  onChange={handleFilterChange}
                />
              </div>
            </div>

            <div className="flex space-x-3">
              <button type="submit" className="btn-primary">
                Filtrar
              </button>
              <button type="button" onClick={clearFilters} className="btn-secondary">
                Limpar Filtros
              </button>
            </div>
          </form>
        </div>

        {/* Results */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-display font-semibold text-gray-900">
              Resultados ({pagination.total})
            </h2>
          </div>

          {loading ? (
            <div className="flex justify-center py-8">
              <div className="loading-spinner"></div>
            </div>
          ) : signatures.length > 0 ? (
            <>
              <div className="table-container">
                <table className="table">
                  <thead className="table-header">
                    <tr>
                      <th className="table-header-cell">Motivo</th>
                      <th className="table-header-cell">Token</th>
                      <th className="table-header-cell">Servidor</th>
                      <th className="table-header-cell">Setor</th>
                      <th className="table-header-cell">Data</th>
                      <th className="table-header-cell">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="table-body">
                    {signatures.map((signature) => (
                      <tr key={signature.id}>
                        <td className="table-cell">
                          <div className="max-w-xs truncate" title={signature.reason}>
                            {signature.reason}
                          </div>
                        </td>
                        <td className="table-cell">
                          <span className="badge badge-info">
                            {signature.token}
                          </span>
                        </td>
                        <td className="table-cell">{signature.serverName}</td>
                        <td className="table-cell">{signature.sectorName}</td>
                        <td className="table-cell">
                          <span className="text-sm text-gray-500">
                            {formatDate(signature.createdAt)}
                          </span>
                        </td>
                        <td className="table-cell">
                          <div className="flex space-x-2">
                            {currentUser && (currentUser.role === 'ADMIN' || currentUser.role === 'SUPPORT') ? (
                              // Botões diretos para admin/suporte
                              <>
                                <button 
                                  onClick={() => openEditModal(signature)}
                                  className="text-primary-600 hover:text-primary-800 text-sm"
                                  disabled={editLoading || deleteLoading === signature.id}
                                >
                                  {editLoading && editingSignature?.id === signature.id ? 'Editando...' : 'Editar'}
                                </button>
                                <button 
                                  onClick={() => handleDirectDelete(signature)}
                                  className="text-red-600 hover:text-red-800 text-sm"
                                  disabled={editLoading || deleteLoading === signature.id}
                                >
                                  {deleteLoading === signature.id ? 'Excluindo...' : 'Excluir'}
                                </button>
                              </>
                            ) : (
                              // Botões para usuários comuns
                              <>
                                {editableSignatures.has(signature.id) && signature.user.id === currentUser?.id ? (
                                  <button 
                                    onClick={() => handleApprovedEdit(signature)}
                                    className="text-green-600 hover:text-green-800 text-sm font-medium"
                                    title="Você pode editar esta assinatura (aprovação concedida)"
                                  >
                                    ✓ Editar Agora
                                  </button>
                                ) : (
                                  <button 
                                    onClick={() => openRequestModal(signature, 'EDIT')}
                                    className="text-primary-600 hover:text-primary-800 text-sm"
                                  >
                                    Solicitar Edição
                                  </button>
                                )}
                                
                                <button 
                                  onClick={() => openRequestModal(signature, 'DELETE')}
                                  className="text-red-600 hover:text-red-800 text-sm"
                                >
                                  Solicitar Exclusão
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-6">
                  <div className="text-sm text-gray-700">
                    Mostrando {((pagination.page - 1) * pagination.limit) + 1} a{' '}
                    {Math.min(pagination.page * pagination.limit, pagination.total)} de{' '}
                    {pagination.total} resultados
                  </div>
                  
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={pagination.page === 1}
                      className="btn-secondary disabled:opacity-50"
                    >
                      Anterior
                    </button>
                    
                    {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                      const page = i + 1
                      return (
                        <button
                          key={page}
                          onClick={() => handlePageChange(page)}
                          className={`px-3 py-1 rounded ${
                            page === pagination.page
                              ? 'bg-primary-600 text-white'
                              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          }`}
                        >
                          {page}
                        </button>
                      )
                    })}
                    
                    <button
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={pagination.page === pagination.totalPages}
                      className="btn-secondary disabled:opacity-50"
                    >
                      Próxima
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhuma assinatura encontrada
              </h3>
              <p className="text-gray-600 mb-4">
                Tente ajustar os filtros ou criar uma nova assinatura.
              </p>
              <Link href="/dashboard" className="btn-primary">
                Criar Nova Assinatura
              </Link>
            </div>
          )}
        </div>

        {/* Request Modal */}
        {showRequestModal && selectedSignature && (
          <div className="modal-overlay" onClick={() => setShowRequestModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-lg font-display font-semibold text-gray-900 mb-4">
                Solicitar {requestForm.type === 'EDIT' ? 'Edição' : 'Exclusão'}
              </h3>

              <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Assinatura Selecionada</h4>
                <p><strong>Motivo:</strong> {selectedSignature.reason}</p>
                <p><strong>Token:</strong> {selectedSignature.token}</p>
                <p><strong>Servidor:</strong> {selectedSignature.serverName}</p>
                <p><strong>Setor:</strong> {selectedSignature.sectorName}</p>
              </div>

              <form onSubmit={handleRequestSubmit} className="space-y-4">
                <div className="form-group">
                  <label htmlFor="request-type" className="form-label">
                    Tipo de Solicitação
                  </label>
                  <select
                    id="request-type"
                    className="input-field"
                    value={requestForm.type}
                    onChange={(e) => setRequestForm({ ...requestForm, type: e.target.value as 'EDIT' | 'DELETE' })}
                    disabled={requestLoading}
                  >
                    <option value="EDIT">Edição</option>
                    <option value="DELETE">Exclusão</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="request-reason" className="form-label">
                    Motivo da Solicitação *
                  </label>
                  <textarea
                    id="request-reason"
                    rows={4}
                    required
                    className="input-field resize-none"
                    placeholder="Explique o motivo da solicitação..."
                    value={requestForm.reason}
                    onChange={(e) => setRequestForm({ ...requestForm, reason: e.target.value })}
                    disabled={requestLoading}
                  />
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-yellow-700">
                        <strong>Atenção:</strong> Sua solicitação será enviada para análise do administrador. 
                        Você receberá uma notificação no chat quando houver uma resposta.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowRequestModal(false)}
                    className="flex-1 btn-secondary"
                    disabled={requestLoading}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 btn-primary flex items-center justify-center"
                    disabled={requestLoading || !requestForm.reason.trim()}
                  >
                    {requestLoading ? (
                      <>
                        <div className="loading-spinner mr-2"></div>
                        Enviando...
                      </>
                    ) : (
                      'Enviar Solicitação'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Signature Modal */}
        {showEditModal && editingSignature && (
          <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-lg font-display font-semibold text-gray-900 mb-4">
                Editar Assinatura
              </h3>

              <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Dados Atuais</h4>
                <p><strong>Usuário:</strong> {editingSignature.user.name}</p>
                <p><strong>Servidor:</strong> {editingSignature.serverName}</p>
                <p><strong>Setor:</strong> {editingSignature.sectorName}</p>
                <p><strong>Data:</strong> {formatDate(editingSignature.createdAt)}</p>
              </div>

              <form onSubmit={handleEditSubmit} className="space-y-4">
                <div className="form-group">
                  <label htmlFor="edit-reason" className="form-label">
                    Motivo *
                  </label>
                  <textarea
                    id="edit-reason"
                    rows={3}
                    required
                    className="input-field resize-none"
                    value={editForm.reason}
                    onChange={(e) => setEditForm({ ...editForm, reason: e.target.value })}
                    disabled={editLoading}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="edit-token" className="form-label">
                    Token *
                  </label>
                  <input
                    id="edit-token"
                    type="text"
                    required
                    className="input-field"
                    value={editForm.token}
                    onChange={(e) => setEditForm({ ...editForm, token: e.target.value })}
                    disabled={editLoading}
                  />
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-blue-700">
                        <strong>Atenção:</strong> Você está editando diretamente a assinatura. 
                        As alterações serão aplicadas imediatamente.
                      </p>
                    </div>
                  </div>
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
