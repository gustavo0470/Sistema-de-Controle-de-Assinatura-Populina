import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/middleware'

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params
    const authUser = await getAuthUser(request)
    
    if (!authUser) {
      return NextResponse.json(
        { success: false, error: 'Não autorizado' },
        { status: 401 }
      )
    }

    let messageId = id
    if (id.startsWith('message-')) {
      messageId = id.replace('message-', '')
    }
    if (messageId.length === 24) {
      
      await prisma.chatMessage.updateMany({
        where: { id: messageId, toUserId: authUser.userId },
        data: { isRead: true }
      })
    }
    
    // Para notificações de request, não fazemos nada pois elas são sempre "não lidas" até serem processadas

    return NextResponse.json({
      success: true,
      message: 'Notificação marcada como lida'
    })

  } catch (error) {
    console.error('Erro ao marcar notificação como lida:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

