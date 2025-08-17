'use client'

import { useState } from 'react'
import Layout from '@/components/Layout'

const tables = [
  { key: 'users', label: 'Usuários' },
  { key: 'sectors', label: 'Setores' },
  { key: 'signatures', label: 'Assinaturas' },
  { key: 'requests', label: 'Solicitações' },
  { key: 'chat-messages', label: 'Mensagens de Chat' },
]

const specialExports = [
  { key: 'pdfs', label: '📄 Todos os PDFs', description: 'Baixar todos os PDFs das assinaturas em um arquivo ZIP' },
]

export default function ExportPage() {
  const [loading, setLoading] = useState<string | null>(null)

  const handleExport = async (table: string) => {
    setLoading(table)
    try {
      const res = await fetch(`/api/admin/backup/${table}`)
      if (!res.ok) {
        alert('Erro ao exportar')
        return
      }
      
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      
      // Definir nome do arquivo baseado no tipo
      let filename
      if (table === 'pdfs') {
        // Para PDFs, o nome já vem correto do header
        const disposition = res.headers.get('content-disposition')
        filename = disposition?.split('filename=')[1]?.replace(/"/g, '') || `pdfs-${new Date().toISOString().slice(0,10)}.zip`
      } else {
        filename = `${table}-${new Date().toISOString().slice(0,10)}.xlsx`
      }
      
      a.download = filename
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Erro no export:', error)
      alert('Erro ao exportar: ' + error)
    } finally {
      setLoading(null)
    }
  }

  return (
    <Layout>
      <div className="space-y-6">
        <h1 className="text-2xl font-display font-bold text-gray-900">Exportar Dados</h1>
        <p className="text-gray-600">Escolha o tipo de dados que deseja exportar</p>

        {/* Exports Especiais */}
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">📁 Exports Especiais</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mobile-grid-1 mobile-gap-2">
              {specialExports.map(item => (
                <button 
                  key={item.key} 
                  onClick={() => handleExport(item.key)} 
                  disabled={loading === item.key}
                  className="card p-4 hover:shadow text-left transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900">{item.label}</h3>
                      <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                    </div>
                    {loading === item.key && (
                      <div className="loading-spinner"></div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Exports de Tabelas */}
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">📊 Tabelas do Sistema</h2>
            <p className="text-sm text-gray-600 mb-3">Exportar dados das tabelas para Excel</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mobile-grid-1 tablet-grid-2 mobile-gap-2">
              {tables.map(t => (
                <button 
                  key={t.key} 
                  onClick={() => handleExport(t.key)} 
                  disabled={loading === t.key}
                  className="card p-4 hover:shadow transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-between"
                >
                  <span>{t.label}</span>
                  {loading === t.key && (
                    <div className="loading-spinner"></div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Informações */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">
                Informações sobre os Exports
              </h3>
              <div className="mt-2 text-sm text-blue-700">
                <ul className="list-disc pl-5 space-y-1">
                  <li><strong>Tabelas:</strong> Exportadas em formato Excel (.xlsx)</li>
                  <li><strong>PDFs:</strong> Todos os PDFs das assinaturas em um arquivo ZIP organizado por pasta</li>
                  <li><strong>Segurança:</strong> Apenas administradores podem fazer exports</li>
                  <li><strong>Tamanho:</strong> Downloads grandes podem demorar alguns minutos</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
