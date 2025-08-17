import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/middleware'
import { RequestStatus } from '@prisma/client'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Responder a solicitação (aprovar/rejeitar)
export const PUT = requireAdmin(async (request: NextRequest, context: { params: Promise<{ id: string }> }) => {
  try {
    const { id } = await context.params
    const { status, adminResponse } = await request.json()

    if (!status || !['APPROVED', 'REJECTED'].includes(status)) {
      return NextResponse.json(
        { success: false, error: 'Status deve ser APPROVED ou REJECTED' },
        { status: 400 }
      )
    }

    // Buscar a solicitação
    const existingRequest = await prisma.request.findUnique({
      where: { id },
      include: {
        signature: {
          include: {
            attachments: true
          }
        },
        user: true
      }
    })

    if (!existingRequest) {
      return NextResponse.json(
        { success: false, error: 'Solicitação não encontrada' },
        { status: 404 }
      )
    }

    if (existingRequest.status !== 'PENDING') {
      return NextResponse.json(
        { success: false, error: 'Esta solicitação já foi processada' },
        { status: 400 }
      )
    }

    const authUserHeader = request.headers.get('x-auth-user')
    const authUser = authUserHeader ? JSON.parse(authUserHeader) : null
    const adminUserId = authUser?.userId || null

    // Atualizar a solicitação
    const updatedRequest = await prisma.request.update({
      where: { id },
      data: {
        status: status as RequestStatus,
        adminResponse: adminResponse || null,
        respondedById: adminUserId
      },
      include: {
        user: {
          select: { id: true, name: true, username: true }
        },
        signature: {
          select: { id: true, incrementalId: true, reason: true, token: true, serverName: true }
        },
        respondedBy: {
          select: { id: true, name: true, username: true }
        }
      }
    })

    // Se aprovado
    if (status === 'APPROVED') {
      if (existingRequest.type === 'DELETE') {
        console.log(`🗑️ Processando exclusão da assinatura ${existingRequest.signature.incrementalId}`)
        
        // Deletar todos os arquivos anexados do storage primeiro
        if (existingRequest.signature.attachments && existingRequest.signature.attachments.length > 0) {
          console.log(`📁 Deletando ${existingRequest.signature.attachments.length} anexos do storage...`)
          
          const filesToDelete = existingRequest.signature.attachments.map(attachment => attachment.storagePath)
          
          try {
            const { error: deleteError } = await supabase.storage
              .from('attachments')
              .remove(filesToDelete)

            if (deleteError) {
              console.error('Erro ao deletar alguns arquivos do storage:', deleteError)
              // Continua com a exclusão mesmo se houver erro no storage
            } else {
              console.log(`✅ ${filesToDelete.length} arquivos deletados do storage com sucesso`)
            }
          } catch (storageError) {
            console.error('Erro ao acessar storage:', storageError)
            // Continua com a exclusão mesmo se houver erro no storage
          }
        } else {
          console.log('📄 Nenhum anexo para deletar')
        }

        // Deletar assinatura do banco (incluirá cascata para attachments e requests)
        await prisma.signature.delete({
          where: { id: existingRequest.signatureId }
        })
        
        console.log(`✅ Assinatura ${existingRequest.signature.incrementalId} deletada completamente`)
        
      } else if (existingRequest.type === 'EDIT') {
        // Marcar request como aprovada; a edição será liberada ao usuário no frontend (flag)
        // Opcionalmente poderíamos armazenar em outra tabela ou notificar via chat
      }
    }

    // Criar mensagem automática no chat
    if (adminUserId) {
      const sigId = existingRequest.signature.incrementalId ?? 'N/A'
      const message = status === 'APPROVED' 
        ? `Sua solicitação de ${existingRequest.type === 'DELETE' ? 'exclusão' : 'edição'} da assinatura ${sigId} foi APROVADA.${adminResponse ? ` Comentário: ${adminResponse}` : ''}`
        : `Sua solicitação de ${existingRequest.type === 'DELETE' ? 'exclusão' : 'edição'} da assinatura ${sigId} foi REJEITADA.${adminResponse ? ` Motivo: ${adminResponse}` : ''}`

      await prisma.chatMessage.create({
        data: {
          fromUserId: adminUserId,
          toUserId: existingRequest.userId,
          message
        }
      })
    }

    return NextResponse.json({
      success: true,
      data: { request: updatedRequest },
      message: `Solicitação ${status === 'APPROVED' ? 'aprovada' : 'rejeitada'} com sucesso`
    })

  } catch (error) {
    console.error('Erro ao responder solicitação:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
})
