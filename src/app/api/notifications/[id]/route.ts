import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/middleware'

// Deletar notificação
export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params
    const authUser = await getAuthUser(request)
    
    if (!authUser) {
      return NextResponse.json(
        { success: false, error: 'Não autorizado' },
        { status: 401 }
      )
    }

    // Se for notificação de mensagem (formato: message-{id})
    if (id.startsWith('message-')) {
      const messageId = id.replace('message-', '')
      
      // Deletar a mensagem do chat (apenas do usuário atual)
      await prisma.chatMessage.deleteMany({
        where: { 
          id: messageId,
          toUserId: authUser.userId // Verificar se a mensagem é para o usuário atual
        }
      })
    }
    
    // Para notificações de request, não deletamos pois são dinâmicas

    return NextResponse.json({
      success: true,
      message: 'Notificação deletada'
    })

  } catch (error) {
    console.error('Erro ao deletar notificação:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

