'use client'

import { useState, useEffect } from 'react'
import Layout from '@/components/Layout'
import Link from 'next/link'

interface AdminStats {
  totalUsers: number
  totalSectors: number
  totalSignatures: number
  pendingRequests: number
  recentActivity: any[]
}

interface RecentSignature {
  id: string
  reason: string
  token: string
  serverName: string
  createdAt: string
  user: {
    name: string
  }
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [recentSignatures, setRecentSignatures] = useState<RecentSignature[]>([])
  const [loading, setLoading] = useState(true)
  const [backupLoading, setBackupLoading] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Buscar estatísticas gerais
        const [usersRes, sectorsRes, signaturesRes] = await Promise.all([
          fetch('/api/admin/users?limit=1'),
          fetch('/api/admin/sectors?limit=1'),
          fetch('/api/signatures?limit=5')
        ])

        const [usersData, sectorsData, signaturesData] = await Promise.all([
          usersRes.json(),
          sectorsRes.json(),
          signaturesRes.json()
        ])

        if (usersData.success && sectorsData.success && signaturesData.success) {
          setStats({
            totalUsers: usersData.data.pagination.total,
            totalSectors: sectorsData.data.pagination.total,
            totalSignatures: signaturesData.data.pagination.total,
            pendingRequests: 0, // TODO: implementar quando tivermos requests
            recentActivity: []
          })

          setRecentSignatures(signaturesData.data.signatures)
        }
      } catch (error) {
        console.error('Erro ao carregar dados:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const downloadBackup = async () => {
    setBackupLoading(true)
    try {
      const response = await fetch('/api/admin/backup/signatures')
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        
        // Extrair nome do arquivo do header ou gerar um
        const contentDisposition = response.headers.get('Content-Disposition')
        const filename = contentDisposition 
          ? contentDisposition.split('filename=')[1]?.replace(/"/g, '')
          : `backup-assinaturas-${new Date().toISOString().slice(0, 10)}.json`
        
        a.download = filename
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)
      } else {
        alert('Erro ao gerar backup')
      }
    } catch (error) {
      console.error('Erro ao baixar backup:', error)
      alert('Erro ao baixar backup')
    } finally {
      setBackupLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR')
  }

  const StatCard = ({ title, value, icon, color, href }: any) => (
    <Link href={href} className="block">
      <div className="card hover:shadow-md transition-shadow duration-200">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className={`w-10 h-10 ${color} rounded-lg flex items-center justify-center`}>
              {icon}
            </div>
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
          </div>
        </div>
      </div>
    </Link>
  )

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="loading-spinner"></div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-display font-bold text-gray-900">
              Painel Administrativo
            </h1>
            <p className="mt-2 text-gray-600">
              Visão geral do sistema e gerenciamento de dados
            </p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={downloadBackup}
              className="btn-secondary flex items-center"
              disabled={backupLoading}
            >
              {backupLoading ? (
                <>
                  <div className="loading-spinner mr-2"></div>
                  Gerando...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Backup Assinaturas
                </>
              )}
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total de Usuários"
            value={stats?.totalUsers || 0}
            href="/admin/users"
            color="bg-blue-600"
            icon={
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            }
          />

          <StatCard
            title="Total de Setores"
            value={stats?.totalSectors || 0}
            href="/admin/sectors"
            color="bg-green-600"
            icon={
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            }
          />

          <StatCard
            title="Total de Assinaturas"
            value={stats?.totalSignatures || 0}
            href="/signatures"
            color="bg-purple-600"
            icon={
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            }
          />

          <StatCard
            title="Solicitações Pendentes"
            value={stats?.pendingRequests || 0}
            href="/admin/requests"
            color="bg-orange-600"
            icon={
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
        </div>

        {/* Quick Actions */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-display font-semibold text-gray-900">
              Ações Rápidas
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link href="/admin/users" className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="font-medium text-gray-900">Criar Usuário</p>
                  <p className="text-sm text-gray-600">Adicionar novo usuário</p>
                </div>
              </div>
            </Link>

            <Link href="/admin/sectors" className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="font-medium text-gray-900">Criar Setor</p>
                  <p className="text-sm text-gray-600">Adicionar novo setor</p>
                </div>
              </div>
            </Link>

            <Link href="/chat" className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="font-medium text-gray-900">Chat Suporte</p>
                  <p className="text-sm text-gray-600">Atender usuários</p>
                </div>
              </div>
            </Link>

            <Link href="/admin/export" className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="font-medium text-gray-900">Exportar Dados</p>
                  <p className="text-sm text-gray-600">Baixar tabelas em Excel</p>
                </div>
              </div>
            </Link>
          </div>
        </div>

        {/* Recent Signatures */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-display font-semibold text-gray-900">
              Assinaturas Recentes
            </h2>
          </div>

          {recentSignatures.length > 0 ? (
            <div className="space-y-4">
              {recentSignatures.map((signature) => (
                <div key={signature.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{signature.reason}</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Por: {signature.user.name} • Token: {signature.token}
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
