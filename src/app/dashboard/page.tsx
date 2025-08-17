'use client'

import { useState, useEffect } from 'react'
import Layout from '@/components/Layout'
import FileUpload, { AttachmentList } from '@/components/FileUpload'
import { AttachmentResponse } from '@/types'
import { FileCompressor } from '@/components/FileCompression'

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
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [uploadError, setUploadError] = useState('')
  const [createdSignatureId, setCreatedSignatureId] = useState<string | null>(null)
  const [attachments, setAttachments] = useState<AttachmentResponse[]>([])
  const [showUploadSection, setShowUploadSection] = useState(false)
  const [compressing, setCompressing] = useState(false)
  const [compressionStats, setCompressionStats] = useState<{[key: string]: any}>({})

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
    
    // Validar se há pelo menos um arquivo para upload
    if (uploadedFiles.length === 0) {
      setError('É obrigatório anexar pelo menos um documento assinado!')
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      // Primeiro, criar a assinatura
      const response = await fetch('/api/signatures', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (data.success) {
        const signatureId = data.data.signature.id
        setCreatedSignatureId(signatureId)

        // Agora fazer upload dos arquivos obrigatórios
        let uploadSuccess = true
        let uploadedCount = 0

        for (const file of uploadedFiles) {
          try {
            const formData = new FormData()
            formData.append('file', file)
            formData.append('signatureId', signatureId)

            const uploadResponse = await fetch('/api/attachments', {
              method: 'POST',
              body: formData
            })

            const uploadData = await uploadResponse.json()
            if (uploadData.success) {
              uploadedCount++
              setAttachments(prev => [...prev, uploadData.data.attachment])
            } else {
              console.error('Erro no upload do arquivo:', file.name, uploadData.error)
              uploadSuccess = false
            }
          } catch (error) {
            console.error('Erro no upload do arquivo:', file.name, error)
            uploadSuccess = false
          }
        }

        if (uploadSuccess && uploadedCount === uploadedFiles.length) {
          setSuccess(`Assinatura criada com sucesso! ${uploadedCount} documento(s) anexado(s).`)
          setFormData({ reason: '', token: '' })
          setUploadedFiles([])
          setShowUploadSection(false)
          
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
          setError(`Assinatura criada, mas houve erro no upload de ${uploadedFiles.length - uploadedCount} arquivo(s).`)
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

  const handleFileSelect = async (files: FileList | null) => {
    if (!files) return
    
    const fileArray = Array.from(files)
    setCompressing(true)
    setUploadError('')
    setError('')
    
    try {
      console.log(`🗜️  Iniciando compressão de ${fileArray.length} arquivo(s)...`)
      
      const compressedFiles: File[] = []
      const stats: {[key: string]: any} = {}
      
      for (let i = 0; i < fileArray.length; i++) {
        const file = fileArray[i]
        console.log(`📁 Processando: ${file.name} (${i + 1}/${fileArray.length})`)
        
        const originalSize = file.size
        const compressedFile = await FileCompressor.compressFile(file)
        const compressionInfo = FileCompressor.getCompressionInfo(originalSize, compressedFile.size)
        
        compressedFiles.push(compressedFile)
        stats[file.name] = compressionInfo
      }
      
      setUploadedFiles(prev => [...prev, ...compressedFiles])
      setCompressionStats(prev => ({...prev, ...stats}))
      
      console.log('✅ Compressão concluída!')
      
    } catch (error) {
      console.error('Erro na compressão:', error)
      setUploadError('Erro ao processar arquivos. Usando arquivos originais.')
      setUploadedFiles(prev => [...prev, ...fileArray])
    } finally {
      setCompressing(false)
    }
  }

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index))
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
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
            </div>

            {/* Seção de Upload Obrigatório */}
            <div className="form-group">
              <label className="form-label">
                Documentos Assinados * 
                <span className="text-red-500 text-sm ml-1">(Obrigatório)</span>
              </label>
              <p className="text-sm text-gray-600 mb-3">
                Anexe pelo menos um documento que foi assinado (PDF, DOC, DOCX, JPG, PNG, GIF, TXT - Máx: 10MB cada)
              </p>

              {/* Area de Upload */}
              <div className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                compressing 
                  ? 'border-blue-300 bg-blue-50' 
                  : 'border-gray-300 hover:border-gray-400'
              }`}>
                <input
                  type="file"
                  id="file-input"
                  multiple
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.txt"
                  onChange={(e) => handleFileSelect(e.target.files)}
                  className="hidden"
                  disabled={loading || compressing}
                />
                <label htmlFor="file-input" className={compressing ? 'cursor-not-allowed' : 'cursor-pointer'}>
                  <div className="flex flex-col items-center">
                    {compressing ? (
                      <>
                        <div className="w-12 h-12 mb-4 flex items-center justify-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        </div>
                        <p className="text-sm text-blue-900 font-medium mb-1">
                          🗜️ Comprimindo arquivos...
                        </p>
                        <p className="text-xs text-blue-600">
                          Aguarde, otimizando tamanho dos arquivos
                        </p>
                      </>
                    ) : (
                      <>
                        <svg className="w-12 h-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        <p className="text-sm text-gray-900 font-medium mb-1">
                          📁 Clique para selecionar arquivos ou arraste aqui
                        </p>
                        <p className="text-xs text-gray-500">
                          Múltiplos arquivos • Máx 10MB cada • Compressão automática de imagens
                        </p>
                      </>
                    )}
                  </div>
                </label>
              </div>

              {/* Lista de Arquivos Selecionados */}
              {uploadedFiles.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">
                    Arquivos Selecionados ({uploadedFiles.length})
                  </h4>
                  <div className="space-y-2">
                    {uploadedFiles.map((file, index) => {
                      const stats = compressionStats[file.name]
                      const isImage = file.type.startsWith('image/')
                      
                      return (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center space-x-3 flex-1">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                              isImage ? 'bg-green-100' : 'bg-blue-100'
                            }`}>
                              {isImage ? (
                                <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                                </svg>
                              ) : (
                                <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                                </svg>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-2">
                                <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                                {stats?.wasCompressed && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                    🗜️ -{stats.reduction}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center space-x-4 text-xs text-gray-500">
                                <span>{formatFileSize(file.size)}</span>
                                {stats && stats.wasCompressed && (
                                  <span className="text-green-600">
                                    Original: {stats.originalSize} → Comprimido: {stats.compressedSize}
                                  </span>
                                )}
                                {isImage && !stats?.wasCompressed && (
                                  <span className="text-gray-400">Sem compressão necessária</span>
                                )}
                              </div>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeFile(index)}
                            className="text-red-600 hover:text-red-800 text-sm font-medium ml-4"
                            disabled={loading || compressing}
                          >
                            Remover
                          </button>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {uploadError && (
                <div className="mt-2 text-sm text-red-600">
                  {uploadError}
                </div>
              )}
            </div>

            <button
              type="submit"
              className="btn-primary flex items-center justify-center"
              disabled={loading || compressing}
            >
              {loading ? (
                <>
                  <div className="loading-spinner mr-2"></div>
                  Criando e enviando anexos...
                </>
              ) : compressing ? (
                <>
                  <div className="loading-spinner mr-2"></div>
                  Comprimindo arquivos...
                </>
              ) : (
                <>
                  📎 Criar Assinatura com {uploadedFiles.length} anexo{uploadedFiles.length !== 1 ? 's' : ''}
                </>
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
