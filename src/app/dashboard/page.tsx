'use client'

import { useState, useEffect } from 'react'
import Layout from '@/components/Layout'

interface User {
  id: string
  name: string
  sector: { name: string }
}

interface Signature {
  id: string
  reason: string
  token: string
  serverName: string
  sectorName: string
  createdAt: string
}

interface DashboardStats {
  totalSignatures: number
  recentSignatures: Signature[]
}

interface Token {
  value: string
  label: string
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null)
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [tokens, setTokens] = useState<string[]>([])
  const [formData, setFormData] = useState({
    reason: '',
    token: ''
  })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Buscar dados do usuário
        const userResponse = await fetch('/api/auth/me')
        if (userResponse.ok) {
          const userData = await userResponse.json()
          setUser(userData.data.user)
        }

        // Buscar estatísticas
        const statsResponse = await fetch('/api/signatures?limit=5')
        if (statsResponse.ok) {
          const statsData = await statsResponse.json()
          setStats({
            totalSignatures: statsData.data.pagination.total,
            recentSignatures: statsData.data.signatures
          })
        }

        // Buscar tokens disponíveis
        const tokensResponse = await fetch('/api/tokens')
        if (tokensResponse.ok) {
          const tokensData = await tokensResponse.json()
          setTokens(tokensData.data.tokens)
        }
      } catch (error) {
        console.error('Erro ao carregar dados:', error)
      }
    }

    fetchData()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch('/api/signatures', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (data.success) {
        setSuccess('Assinatura criada com sucesso!')
        setFormData({ reason: '', token: '' })
        
        // Recarregar estatísticas
        const statsResponse = await fetch('/api/signatures?limit=5')
        if (statsResponse.ok) {
          const statsData = await statsResponse.json()
          setStats({
            totalSignatures: statsData.data.pagination.total,
            recentSignatures: statsData.data.signatures
          })
        }
      } else {
        setError(data.error || 'Erro ao criar assinatura')
      }
    } catch (error) {
      setError('Erro de conexão. Tente novamente.')
      console.error('Erro ao criar assinatura:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR')
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-display font-bold text-gray-900">
            Dashboard
          </h1>
          <p className="mt-2 text-gray-600">
            Bem-vindo ao sistema de gestão de assinaturas
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total de Assinaturas</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.totalSignatures || 0}</p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Servidor</p>
                <p className="text-lg font-semibold text-gray-900">{user?.name}</p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Setor</p>
                <p className="text-lg font-semibold text-gray-900">{user?.sector?.name}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Create Signature Form */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-display font-semibold text-gray-900">
              Nova Assinatura
            </h2>
            <p className="text-sm text-gray-600">
              Os campos servidor e setor são preenchidos automaticamente
            </p>
          </div>

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4">
              {success}
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="form-group">
                <label className="form-label">Servidor (Automático)</label>
                <input
                  type="text"
                  className="input-field bg-gray-50"
                  value={user?.name || ''}
                  disabled
                />
              </div>

              <div className="form-group">
                <label className="form-label">Setor (Automático)</label>
                <input
                  type="text"
                  className="input-field bg-gray-50"
                  value={user?.sector?.name || ''}
                  disabled
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="reason" className="form-label">
                Motivo da Assinatura *
              </label>
              <textarea
                id="reason"
                name="reason"
                rows={3}
                required
                className="input-field resize-none"
                placeholder="Descreva o motivo da assinatura..."
                value={formData.reason}
                onChange={handleChange}
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="token" className="form-label">
                Token (Prefeito/Município) *
              </label>
              <select
                id="token"
                name="token"
                required
                className="input-field"
                value={formData.token}
                onChange={handleChange}
                disabled={loading}
              >
                <option value="">Selecione um token</option>
                {tokens.map((token) => (
                  <option key={token} value={token}>
                    {token}
                  </option>
                ))}
              </select>
              
              {/* Removido campo para novo token */}
            </div>

            <button
              type="submit"
              className="btn-primary flex items-center justify-center"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="loading-spinner mr-2"></div>
                  Criando...
                </>
              ) : (
                'Criar Assinatura'
              )}
            </button>
          </form>
        </div>

        {/* Recent Signatures */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-display font-semibold text-gray-900">
              Assinaturas Recentes
            </h2>
          </div>

          {stats?.recentSignatures && stats.recentSignatures.length > 0 ? (
            <div className="space-y-4">
              {stats.recentSignatures.map((signature) => (
                <div key={signature.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{signature.reason}</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Token: {signature.token}
                      </p>
                      <p className="text-xs text-gray-500 mt-2">
                        {formatDate(signature.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">
              Nenhuma assinatura encontrada
            </p>
          )}
        </div>
      </div>
    </Layout>
  )
}
