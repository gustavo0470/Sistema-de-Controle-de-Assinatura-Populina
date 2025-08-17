'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Layout from '@/components/Layout'
import FileUpload, { AttachmentList } from '@/components/FileUpload'
import { AttachmentResponse } from '@/types'

interface User {
  id: string
  name: string
  sector: { name: string }
}

export default function CreateSignaturePage() {
  const [user, setUser] = useState<User | null>(null)
  const [tokens, setTokens] = useState<string[]>([])
  const [formData, setFormData] = useState({
    reason: '',
    token: ''
  })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  const [createdSignatureId, setCreatedSignatureId] = useState<string | null>(null)
  const [attachments, setAttachments] = useState<AttachmentResponse[]>([])
  const [uploadError, setUploadError] = useState('')
  
  const router = useRouter()

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Buscar dados do usuário
        const userResponse = await fetch('/api/auth/me')
        if (userResponse.ok) {
          const userData = await userResponse.json()
          setUser(userData.data.user)
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
        setCreatedSignatureId(data.data.signature.id)
        setFormData({ reason: '', token: '' })
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

  const handleUploadComplete = (attachment: AttachmentResponse) => {
    setAttachments([...attachments, attachment])
    setUploadError('')
  }

  const handleUploadError = (error: string) => {
    setUploadError(error)
  }

  const handleDeleteAttachment = (attachmentId: string) => {
    setAttachments(attachments.filter(a => a.id !== attachmentId))
  }

  const handleFinish = () => {
    router.push('/signatures')
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-display font-bold text-gray-900">
            Nova Assinatura
          </h1>
          <p className="mt-2 text-gray-600">
            Crie uma nova assinatura e anexe os documentos relacionados
          </p>
        </div>

        {/* Formulário Principal */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-display font-semibold text-gray-900">
              Dados da Assinatura
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mobile-grid-1 mobile-gap-2">
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
                disabled={loading || !!createdSignatureId}
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
                disabled={loading || !!createdSignatureId}
              >
                <option value="">Selecione um token</option>
                {tokens.map((token) => (
                  <option key={token} value={token}>
                    {token}
                  </option>
                ))}
              </select>
            </div>

            {!createdSignatureId && (
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
            )}
          </form>
        </div>

        {/* Upload de Anexos - Só aparece após criar a assinatura */}
        {createdSignatureId && (
          <div className="card">
            <div className="card-header">
              <h2 className="text-lg font-display font-semibold text-gray-900">
                Anexar Documentos
              </h2>
              <p className="text-sm text-gray-600">
                Faça upload dos documentos que foram assinados (opcional)
              </p>
            </div>

            {uploadError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
                {uploadError}
              </div>
            )}

            <div className="space-y-6">
              <FileUpload
                signatureId={createdSignatureId}
                onUploadComplete={handleUploadComplete}
                onUploadError={handleUploadError}
                multiple={true}
                className="mb-6"
              />

              {attachments.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-3">
                    Anexos ({attachments.length})
                  </h3>
                  <AttachmentList
                    attachments={attachments}
                    onDelete={handleDeleteAttachment}
                    allowDelete={true}
                  />
                </div>
              )}
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="flex justify-between">
                <button
                  onClick={() => router.push('/signatures/create')}
                  className="btn-secondary"
                >
                  Criar Nova Assinatura
                </button>
                
                <button
                  onClick={handleFinish}
                  className="btn-primary"
                >
                  Finalizar e Ver Assinaturas
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Instruções */}
        <div className="card bg-blue-50 border-blue-200">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">
                Dicas para Anexos
              </h3>
              <div className="mt-2 text-sm text-blue-700">
                <ul className="list-disc pl-5 space-y-1">
                  <li>Formatos aceitos: PDF, DOC, DOCX, JPG, PNG, GIF, TXT</li>
                  <li>Tamanho máximo por arquivo: 10MB</li>
                  <li>Você pode anexar múltiplos documentos</li>
                  <li>Os anexos podem ser adicionados após criar a assinatura</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
