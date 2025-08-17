'use client'

import { useState, useRef } from 'react'
import { AttachmentResponse } from '@/types'
import { FileCompressor } from './FileCompression'

interface FileUploadProps {
  signatureId?: string
  onUploadComplete?: (attachment: AttachmentResponse) => void
  onUploadError?: (error: string) => void
  multiple?: boolean
  disabled?: boolean
  className?: string
  maxSize?: number // em MB
}

const ALLOWED_EXTENSIONS = [
  '.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png', '.gif', '.txt'
]

const ALLOWED_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/png',
  'image/gif',
  'text/plain'
]

export default function FileUpload({
  signatureId,
  onUploadComplete,
  onUploadError,
  multiple = false,
  disabled = false,
  className = '',
  maxSize = 10
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const validateFile = (file: File): string | null => {
    // Validar tipo
    if (!ALLOWED_TYPES.includes(file.type)) {
      return 'Tipo de arquivo não permitido. Use: PDF, DOC, DOCX, JPG, PNG, GIF ou TXT'
    }

    // Validar tamanho
    const maxBytes = maxSize * 1024 * 1024
    if (file.size > maxBytes) {
      return `Arquivo muito grande. Máximo permitido: ${maxSize}MB`
    }

    return null
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const uploadFile = async (file: File) => {
    if (!signatureId) {
      onUploadError?.('ID da assinatura não fornecido')
      return
    }

    const validationError = validateFile(file)
    if (validationError) {
      onUploadError?.(validationError)
      return
    }

    setUploading(true)

    try {
      // Comprimir arquivo antes do upload
      console.log(`🔄 Processando arquivo: ${file.name}`)
      const compressedFile = await FileCompressor.compressFile(file)
      
      // Mostrar informações de compressão se houve redução
      if (compressedFile.size !== file.size) {
        const info = FileCompressor.getCompressionInfo(file.size, compressedFile.size)
        console.log(`✅ Arquivo comprimido: ${info.originalSize} → ${info.compressedSize} (${info.reduction} redução)`)
      }

      const formData = new FormData()
      formData.append('file', compressedFile)
      formData.append('signatureId', signatureId)

      const response = await fetch('/api/attachments', {
        method: 'POST',
        body: formData
      })

      const data = await response.json()

      if (data.success) {
        onUploadComplete?.(data.data.attachment)
      } else {
        onUploadError?.(data.error || 'Erro ao fazer upload')
      }
    } catch (error) {
      console.error('Erro no upload:', error)
      onUploadError?.('Erro de conexão durante o upload')
    } finally {
      setUploading(false)
    }
  }

  const handleFileSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return

    const fileArray = Array.from(files)
    
    if (!multiple && fileArray.length > 1) {
      onUploadError?.('Selecione apenas um arquivo')
      return
    }

    // Se múltiplos arquivos permitidos, fazer upload de cada um
    fileArray.forEach(file => uploadFile(file))
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(e.target.files)
    // Limpar input para permitir reselecionar o mesmo arquivo
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    
    if (disabled || uploading) return
    
    handleFileSelect(e.dataTransfer.files)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    if (!disabled && !uploading) {
      setDragOver(true)
    }
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
  }

  const openFileDialog = () => {
    if (disabled || uploading) return
    fileInputRef.current?.click()
  }

  return (
    <div className={`${className}`}>
      <input
        ref={fileInputRef}
        type="file"
        multiple={multiple}
        accept={ALLOWED_EXTENSIONS.join(',')}
        onChange={handleInputChange}
        className="hidden"
        disabled={disabled || uploading}
      />

      <div
        onClick={openFileDialog}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`
          border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all duration-200
          ${dragOver 
            ? 'border-primary-500 bg-primary-50' 
            : 'border-gray-300 hover:border-gray-400'
          }
          ${disabled || uploading 
            ? 'opacity-50 cursor-not-allowed' 
            : 'hover:bg-gray-50'
          }
        `}
      >
        {uploading ? (
          <div className="flex flex-col items-center">
            <div className="loading-spinner mb-2"></div>
            <p className="text-sm text-gray-600">Enviando arquivo...</p>
          </div>
        ) : (
          <>
            <div className="flex flex-col items-center">
              <svg
                className="w-12 h-12 text-gray-400 mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
              
              <p className="text-sm text-gray-900 font-medium mb-1">
                Clique para selecionar {multiple ? 'arquivos' : 'um arquivo'}
              </p>
              
              <p className="text-xs text-gray-500 mb-2">
                ou arraste e solte aqui
              </p>
              
              <p className="text-xs text-gray-400">
                Máximo {maxSize}MB • {ALLOWED_EXTENSIONS.join(', ')}
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// Componente para exibir anexos existentes
interface AttachmentListProps {
  attachments: AttachmentResponse[]
  onDelete?: (attachmentId: string) => void
  allowDelete?: boolean
  loading?: boolean
}

export function AttachmentList({
  attachments,
  onDelete,
  allowDelete = false,
  loading = false
}: AttachmentListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) {
      return (
        <svg className="w-6 h-6 text-green-500" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
        </svg>
      )
    } else if (mimeType === 'application/pdf') {
      return (
        <svg className="w-6 h-6 text-red-500" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
        </svg>
      )
    } else {
      return (
        <svg className="w-6 h-6 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
        </svg>
      )
    }
  }

  const handleDelete = async (attachmentId: string) => {
    if (!confirm('Tem certeza que deseja deletar este anexo?')) return

    setDeletingId(attachmentId)
    
    try {
      const response = await fetch(`/api/attachments/${attachmentId}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (data.success) {
        onDelete?.(attachmentId)
      } else {
        alert(data.error || 'Erro ao deletar anexo')
      }
    } catch (error) {
      console.error('Erro ao deletar:', error)
      alert('Erro ao deletar anexo')
    } finally {
      setDeletingId(null)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-4">
        <div className="loading-spinner"></div>
      </div>
    )
  }

  if (attachments.length === 0) {
    return (
      <p className="text-sm text-gray-500 text-center py-4">
        Nenhum anexo encontrado
      </p>
    )
  }

  return (
    <div className="space-y-2">
      {attachments.map((attachment) => (
        <div
          key={attachment.id}
          className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
        >
          <div className="flex items-center space-x-3">
            {getFileIcon(attachment.mimeType)}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {attachment.filename}
              </p>
              <p className="text-xs text-gray-500">
                {formatFileSize(attachment.fileSize)} • {new Date(attachment.uploadedAt).toLocaleString('pt-BR')}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <a
              href={attachment.downloadUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-600 hover:text-primary-800 text-sm font-medium"
            >
              Download
            </a>

            {allowDelete && (
              <button
                onClick={() => handleDelete(attachment.id)}
                disabled={deletingId === attachment.id}
                className="text-red-600 hover:text-red-800 text-sm font-medium disabled:opacity-50"
              >
                {deletingId === attachment.id ? (
                  <div className="w-4 h-4 border border-red-600 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  'Deletar'
                )}
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
