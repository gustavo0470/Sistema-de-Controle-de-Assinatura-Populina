'use client'

import { useState, useEffect } from 'react'
import Layout from '@/components/Layout'

interface Request {
  id: string
  type: 'EDIT' | 'DELETE'
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  reason: string
  adminResponse?: string
  createdAt: string
  updatedAt: string
  user: {
    id: string
    name: string
    username: string
  }
  signature: {
    id: string
    reason: string
    token: string
    serverName: string
  }
  respondedBy?: {
    id: string
    name: string
    username: string
  }
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

export default function AdminRequestsPage() {
  const [requests, setRequests] = useState<Request[]>([])
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  })
  const [statusFilter, setStatusFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [responding, setResponding] = useState<string | null>(null)
  const [responseForm, setResponseForm] = useState({
    status: '',
    adminResponse: ''
  })
  const [showResponseModal, setShowResponseModal] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    fetchRequests()
  }, [pagination.page, pagination.limit, statusFilter])

  const fetchRequests = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString()
      })

      if (statusFilter) {
        params.append('status', statusFilter)
      }

      const response = await fetch(`/api/requests?${params}`)
      if (response.ok) {
        const data = await response.json()
        setRequests(data.data.requests)
        setPagination(data.data.pagination)
      }
    } catch (error) {
      console.error('Erro ao carregar solicitações:', error)
      setError('Erro ao carregar solicitações')
    } finally {
      setLoading(false)
    }
  }

  const openResponseModal = (request: Request) => {
    setSelectedRequest(request)
    setResponseForm({ status: '', adminResponse: '' })
    setShowResponseModal(true)
    setError('')
    setSuccess('')
  }

  const handleResponse = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedRequest || !responseForm.status) return

    setResponding(selectedRequest.id)
    setError('')

    try {
      const response = await fetch(`/api/admin/requests/${selectedRequest.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(responseForm)
      })

      const data = await response.json()

      if (data.success) {
        setSuccess(data.message)
        setShowResponseModal(false)
        setSelectedRequest(null)
        fetchRequests()
      } else {
        setError(data.error || 'Erro ao responder solicitação')
      }
    } catch (error) {
      setError('Erro de conexão. Tente novamente.')
      console.error('Erro ao responder solicitação:', error)
    } finally {
      setResponding(null)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR')
  }

  const getStatusLabel = (status: string) => {
    const labels = {
      PENDING: 'Pendente',
      APPROVED: 'Aprovada',
      REJECTED: 'Rejeitada'
    }
    return labels[status as keyof typeof labels] || status
  }

  const getStatusBadgeColor = (status: string) => {
    const colors = {
      PENDING: 'badge-warning',
      APPROVED: 'badge-success',
      REJECTED: 'badge-danger'
    }
    return colors[status as keyof typeof colors] || 'badge-info'
  }

  const getTypeLabel = (type: string) => {
    const labels = {
      EDIT: 'Edição',
      DELETE: 'Exclusão'
    }
    return labels[type as keyof typeof labels] || type
  }

  const getTypeBadgeColor = (type: string) => {
    const colors = {
      EDIT: 'badge-info',
      DELETE: 'badge-danger'
    }
    return colors[type as keyof typeof colors] || 'badge-info'
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-display font-bold text-gray-900">
            Solicitações de Usuários
          </h1>
          <p className="mt-2 text-gray-600">
            Gerencie solicitações de edição e exclusão de assinaturas
          </p>
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
              Filtros
            </h2>
          </div>

          <div className="flex gap-4">
            <div className="form-group flex-1">
              <label htmlFor="status" className="form-label">
                Status
              </label>
              <select
                id="status"
                className="input-field"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">Todos os status</option>
                <option value="PENDING">Pendente</option>
                <option value="APPROVED">Aprovada</option>
                <option value="REJECTED">Rejeitada</option>
              </select>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-display font-semibold text-gray-900">
              Solicitações ({pagination.total})
            </h2>
          </div>

          {loading ? (
            <div className="flex justify-center py-8">
              <div className="loading-spinner"></div>
            </div>
          ) : requests.length > 0 ? (
            <div className="table-container">
              <table className="table">
                <thead className="table-header">
                  <tr>
                    <th className="table-header-cell">Usuário</th>
                    <th className="table-header-cell">Tipo</th>
                    <th className="table-header-cell">Assinatura</th>
                    <th className="table-header-cell">Motivo</th>
                    <th className="table-header-cell">Status</th>
                    <th className="table-header-cell">Data</th>
                    <th className="table-header-cell">Ações</th>
                  </tr>
                </thead>
                <tbody className="table-body">
                  {requests.map((request) => (
                    <tr key={request.id}>
                      <td className="table-cell">
                        <div>
                          <p className="font-medium">{request.user.name}</p>
                          <p className="text-sm text-gray-500">@{request.user.username}</p>
                        </div>
                      </td>
                      <td className="table-cell">
                        <span className={`badge ${getTypeBadgeColor(request.type)}`}>
                          {getTypeLabel(request.type)}
                        </span>
                      </td>
                      <td className="table-cell">
                        <div className="max-w-xs">
                          <p className="font-medium truncate" title={request.signature.reason}>
                            {request.signature.reason}
                          </p>
                          <p className="text-sm text-gray-500">
                            Token: {request.signature.token}
                          </p>
                        </div>
                      </td>
                      <td className="table-cell">
                        <div className="max-w-xs truncate" title={request.reason}>
                          {request.reason}
                        </div>
                      </td>
                      <td className="table-cell">
                        <span className={`badge ${getStatusBadgeColor(request.status)}`}>
                          {getStatusLabel(request.status)}
                        </span>
                      </td>
                      <td className="table-cell">
                        <span className="text-sm text-gray-500">
                          {formatDate(request.createdAt)}
                        </span>
                      </td>
                      <td className="table-cell">
                        {request.status === 'PENDING' ? (
                          <button
                            onClick={() => openResponseModal(request)}
                            className="text-primary-600 hover:text-primary-800 text-sm"
                            disabled={responding === request.id}
                          >
                            {responding === request.id ? 'Processando...' : 'Responder'}
                          </button>
                        ) : (
                          <div className="text-sm text-gray-500">
                            <p>Por: {request.respondedBy?.name}</p>
                            <p>{formatDate(request.updatedAt)}</p>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhuma solicitação encontrada
              </h3>
              <p className="text-gray-600">
                Não há solicitações pendentes no momento.
              </p>
            </div>
          )}
        </div>

        {/* Response Modal */}
        {showResponseModal && selectedRequest && (
          <div className="modal-overlay" onClick={() => setShowResponseModal(false)}>
            <div className="modal-content max-w-lg" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-lg font-display font-semibold text-gray-900 mb-4">
                Responder Solicitação
              </h3>

              <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Detalhes da Solicitação</h4>
                <p><strong>Usuário:</strong> {selectedRequest.user.name}</p>
                <p><strong>Tipo:</strong> {getTypeLabel(selectedRequest.type)}</p>
                <p><strong>Assinatura:</strong> {selectedRequest.signature.reason}</p>
                <p><strong>Token:</strong> {selectedRequest.signature.token}</p>
                <p><strong>Motivo:</strong> {selectedRequest.reason}</p>
              </div>

              <form onSubmit={handleResponse} className="space-y-4">
                <div className="form-group">
                  <label htmlFor="response-status" className="form-label">
                    Decisão *
                  </label>
                  <select
                    id="response-status"
                    required
                    className="input-field"
                    value={responseForm.status}
                    onChange={(e) => setResponseForm({ ...responseForm, status: e.target.value })}
                    disabled={!!responding}
                  >
                    <option value="">Selecione uma decisão</option>
                    <option value="APPROVED">Aprovar</option>
                    <option value="REJECTED">Rejeitar</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="response-comment" className="form-label">
                    Comentário (Opcional)
                  </label>
                  <textarea
                    id="response-comment"
                    rows={3}
                    className="input-field resize-none"
                    placeholder="Adicione um comentário explicativo..."
                    value={responseForm.adminResponse}
                    onChange={(e) => setResponseForm({ ...responseForm, adminResponse: e.target.value })}
                    disabled={!!responding}
                  />
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowResponseModal(false)}
                    className="flex-1 btn-secondary"
                    disabled={!!responding}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 btn-primary flex items-center justify-center"
                    disabled={!!responding || !responseForm.status}
                  >
                    {responding ? (
                      <>
                        <div className="loading-spinner mr-2"></div>
                        Processando...
                      </>
                    ) : (
                      'Enviar Resposta'
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

