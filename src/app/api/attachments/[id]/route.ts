import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/middleware'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authUser = await getAuthUser(request)
    if (!authUser) {
      return NextResponse.json(
        { success: false, error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const attachmentId = params.id

    // Buscar anexo com dados da assinatura
    const attachment = await prisma.signatureAttachment.findUnique({
      where: { id: attachmentId },
      include: {
        signature: {
          include: { user: true }
        }
      }
    })

    if (!attachment) {
      return NextResponse.json(
        { success: false, error: 'Anexo não encontrado' },
        { status: 404 }
      )
    }

    // Verificar permissão (só o criador da assinatura ou admin pode deletar)
    if (
      attachment.signature.userId !== authUser.userId && 
      authUser.role !== 'ADMIN' && 
      authUser.role !== 'SUPPORT'
    ) {
      return NextResponse.json(
        { success: false, error: 'Sem permissão para deletar este anexo' },
        { status: 403 }
      )
    }

    // Deletar arquivo do storage
    const { error: deleteError } = await supabase.storage
      .from('attachments')
      .remove([attachment.storagePath])

    if (deleteError) {
      console.error('Erro ao deletar arquivo do storage:', deleteError)
      // Continua mesmo com erro no storage, para não deixar registro órfão
    }

    // Deletar registro do banco
    await prisma.signatureAttachment.delete({
      where: { id: attachmentId }
    })

    return NextResponse.json({
      success: true,
      message: 'Anexo deletado com sucesso'
    })

  } catch (error) {
    console.error('Erro ao deletar anexo:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// Download de arquivo específico
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authUser = await getAuthUser(request)
    if (!authUser) {
      return NextResponse.json(
        { success: false, error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const attachmentId = params.id

    // Buscar anexo
    const attachment = await prisma.signatureAttachment.findUnique({
      where: { id: attachmentId },
      include: {
        signature: {
          include: { user: true }
        }
      }
    })

    if (!attachment) {
      return NextResponse.json(
        { success: false, error: 'Anexo não encontrado' },
        { status: 404 }
      )
    }

    // Gerar URL de download com expiração de 1 hora
    const { data: urlData, error } = await supabase.storage
      .from('attachments')
      .createSignedUrl(attachment.storagePath, 3600)

    if (error) {
      console.error('Erro ao gerar URL de download:', error)
      return NextResponse.json(
        { success: false, error: 'Erro ao gerar link de download' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        filename: attachment.filename,
        downloadUrl: urlData.signedUrl,
        mimeType: attachment.mimeType,
        fileSize: attachment.fileSize
      }
    })

  } catch (error) {
    console.error('Erro ao gerar download:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
