'use client'

import Layout from '@/components/Layout'

const tables = [
  { key: 'users', label: 'Usuários' },
  { key: 'sectors', label: 'Setores' },
  { key: 'signatures', label: 'Assinaturas' },
  { key: 'requests', label: 'Solicitações' },
  { key: 'chat-messages', label: 'Mensagens de Chat' },
]

export default function ExportPage() {
  const handleExport = async (table: string) => {
    const res = await fetch(`/api/admin/backup/${table}`)
    if (!res.ok) return alert('Erro ao exportar')
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${table}-${new Date().toISOString().slice(0,10)}.xlsx`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  return (
    <Layout>
      <div className="space-y-6">
        <h1 className="text-2xl font-display font-bold text-gray-900">Exportar Dados</h1>
        <p className="text-gray-600">Escolha a tabela que deseja exportar para Excel</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tables.map(t => (
            <button key={t.key} onClick={()=>handleExport(t.key)} className="card p-4 hover:shadow">
              {t.label}
            </button>
          ))}
        </div>
      </div>
    </Layout>
  )
}
