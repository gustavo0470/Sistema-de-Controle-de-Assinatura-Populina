import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/middleware'

export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request)
    
    if (!authUser) {
      return NextResponse.json(
        { success: false, error: 'Não autorizado' },
        { status: 401 }
      )
    }

    // Marcar todas as mensagens de chat como lidas
    await prisma.chatMessage.updateMany({
      where: {
        toUserId: authUser.userId,
        isRead: false
      },
      data: { isRead: true }
    })

    return NextResponse.json({
      success: true,
      message: 'Todas as notificações foram marcadas como lidas'
    })

  } catch (error) {
    console.error('Erro ao marcar todas como lidas:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

