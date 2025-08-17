import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/middleware'
import { createClient } from '@supabase/supabase-js'

// Configuração do Supabase para upload
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Tipos MIME permitidos
const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/png',
  'image/gif',
  'text/plain'
]

// Tamanho máximo: 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024

export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request)
    if (!authUser) {
      return NextResponse.json(
        { success: false, error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const signatureId = formData.get('signatureId') as string

    if (!file || !signatureId) {
      return NextResponse.json(
        { success: false, error: 'Arquivo e ID da assinatura são obrigatórios' },
        { status: 400 }
      )
    }

    // Validar tipo de arquivo
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: 'Tipo de arquivo não permitido. Permitidos: PDF, DOC, DOCX, JPG, PNG, GIF, TXT' },
        { status: 400 }
      )
    }

    // Validar tamanho
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: 'Arquivo muito grande. Máximo permitido: 10MB' },
        { status: 400 }
      )
    }

    // Verificar se a assinatura existe e pertence ao usuário (ou se é admin)
    const signature = await prisma.signature.findUnique({
      where: { id: signatureId },
      include: { user: true }
    })

    if (!signature) {
      return NextResponse.json(
        { success: false, error: 'Assinatura não encontrada' },
        { status: 404 }
      )
    }

    // Verificar permissão (só o criador ou admin pode anexar)
    if (signature.userId !== authUser.userId && authUser.role !== 'ADMIN' && authUser.role !== 'SUPPORT') {
      return NextResponse.json(
        { success: false, error: 'Sem permissão para anexar arquivo a esta assinatura' },
        { status: 403 }
      )
    }

    // Gerar nome único para o arquivo
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const fileExtension = file.name.split('.').pop()
    const fileName = `${timestamp}-${file.name}`
    const storagePath = `signatures/${signatureId}/${fileName}`

    // Converter File para ArrayBuffer
    const fileBuffer = await file.arrayBuffer()
    const uint8Array = new Uint8Array(fileBuffer)

    // Upload para Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('attachments')
      .upload(storagePath, uint8Array, {
        contentType: file.type,
        upsert: false
      })

    if (uploadError) {
      console.error('Erro no upload:', uploadError)
      return NextResponse.json(
        { success: false, error: 'Erro ao fazer upload do arquivo' },
        { status: 500 }
      )
    }

    // Salvar metadata no banco
    const attachment = await prisma.signatureAttachment.create({
      data: {
        signatureId,
        filename: file.name,
        storagePath: uploadData.path,
        fileSize: file.size,
        mimeType: file.type
      }
    })

    // Gerar URL de download (válida por 1 hora)
    const { data: urlData } = supabase.storage
      .from('attachments')
      .getPublicUrl(uploadData.path)

    return NextResponse.json({
      success: true,
      data: {
        attachment: {
          id: attachment.id,
          filename: attachment.filename,
          fileSize: attachment.fileSize,
          mimeType: attachment.mimeType,
          uploadedAt: attachment.uploadedAt,
          downloadUrl: urlData.publicUrl
        }
      },
      message: 'Arquivo anexado com sucesso'
    })

  } catch (error) {
    console.error('Erro ao anexar arquivo:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// Listar anexos de uma assinatura
export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request)
    if (!authUser) {
      return NextResponse.json(
        { success: false, error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const signatureId = searchParams.get('signatureId')

    if (!signatureId) {
      return NextResponse.json(
        { success: false, error: 'ID da assinatura é obrigatório' },
        { status: 400 }
      )
    }

    // Verificar se a assinatura existe
    const signature = await prisma.signature.findUnique({
      where: { id: signatureId },
      include: { user: true }
    })

    if (!signature) {
      return NextResponse.json(
        { success: false, error: 'Assinatura não encontrada' },
        { status: 404 }
      )
    }

    // Buscar anexos
    const attachments = await prisma.signatureAttachment.findMany({
      where: { signatureId },
      orderBy: { uploadedAt: 'desc' }
    })

    // Gerar URLs de download para cada anexo
    const attachmentsWithUrls = attachments.map(attachment => {
      const { data: urlData } = supabase.storage
        .from('attachments')
        .getPublicUrl(attachment.storagePath)

      return {
        id: attachment.id,
        filename: attachment.filename,
        fileSize: attachment.fileSize,
        mimeType: attachment.mimeType,
        uploadedAt: attachment.uploadedAt,
        downloadUrl: urlData.publicUrl
      }
    })

    return NextResponse.json({
      success: true,
      data: { attachments: attachmentsWithUrls }
    })

  } catch (error) {
    console.error('Erro ao listar anexos:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
