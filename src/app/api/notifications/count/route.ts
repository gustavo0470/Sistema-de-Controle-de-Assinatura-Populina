import { NextRequest, NextResponse } from 'next/server'
import { robustPrisma } from '@/lib/prisma-robust'
import { getAuthUser } from '@/lib/middleware'

export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request)
    if (!authUser) {
      return NextResponse.json(
        { success: false, error: 'Não autorizado' },
        { status: 401 }
      )
    }

    // Contar mensagens não lidas do chat
    const unreadMessages = await (await robustPrisma.chatMessage()).count({
      where: {
        toUserId: authUser.userId,
        isRead: false
      }
    })

    // Para administradores, contar também solicitações pendentes
    let pendingRequests = 0
    if (authUser.role === 'ADMIN' || authUser.role === 'SUPPORT') {
      pendingRequests = await (await robustPrisma.request()).count({
        where: {
          status: 'PENDING'
        }
      })
    }

    const totalUnread = unreadMessages + pendingRequests

    return NextResponse.json({
      success: true,
      data: {
        unreadCount: totalUnread,
        unreadMessages,
        pendingRequests
      }
    })

  } catch (error) {
    console.error('Erro ao contar notificações:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
