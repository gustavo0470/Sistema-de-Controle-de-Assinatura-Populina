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

    // Buscar mensagens do chat como notificações (sem include - ChatMessage não tem relações)
    const chatMessages = await (await robustPrisma.chatMessage()).findMany({
      where: {
        toUserId: authUser.userId
      },
      orderBy: { createdAt: 'desc' },
      take: 30
    })

    // Buscar informações dos usuários das mensagens (manualmente, devido à remoção das FKs)
    const messageNotifications = await Promise.all(
      chatMessages.map(async (message) => {
        let fromUser = null
        
        // Se não é guest, buscar informações do usuário
        if (!message.fromUserId.startsWith('guest-')) {
          try {
            fromUser = await (await robustPrisma.user()).findUnique({
              where: { id: message.fromUserId },
              select: { name: true, username: true }
            })
          } catch (error) {
            console.warn('Erro ao buscar usuário:', error)
          }
        } else {
          // Se é guest, extrair nome do prefixo da mensagem
          const guestInfo = message.message.match(/^\[GUEST: ([^@]+) @([^\]]+)\]/)
          if (guestInfo) {
            fromUser = {
              name: guestInfo[1].trim(),
              username: guestInfo[2].trim()
            }
          } else {
            fromUser = {
              name: 'Visitante',
              username: message.fromUserId.replace('guest-', '')
            }
          }
        }

        return {
          id: `message-${message.id}`,
          type: 'message',
          title: 'Nova Mensagem',
          description: message.message.length > 100 ? message.message.substring(0, 100) + '...' : message.message,
          isRead: message.isRead,
          createdAt: message.createdAt,
          relatedData: { messageId: message.id, fromUserId: message.fromUserId },
          fromUser
        }
      })
    )

    // Buscar solicitações pendentes para administradores
    let requestNotifications: any[] = []
    if (authUser.role === 'ADMIN' || authUser.role === 'SUPPORT') {
      try {
        const pendingRequests = await (await robustPrisma.request()).findMany({
          where: {
            status: 'PENDING'
          },
          include: {
            user: true,
            signature: true
          },
          orderBy: { createdAt: 'desc' }
        })

        requestNotifications = pendingRequests.slice(0,30).map(request => ({
          id: request.id,
          type: 'request',
          title: `Nova Solicitação de ${request.type === 'EDIT' ? 'Edição' : 'Exclusão'}`,
          description: `Usuário ${(request as any).user.name} (${(request as any).user.username}) solicitou ${request.type === 'EDIT' ? 'edição' : 'exclusão'} da assinatura #${(request as any).signature.incrementalId} - © 2025 GOSZC SOLUTIONS - Gustavo Salmazo Custódio - +55 (17) 99703-8154 - gust.cust047@gmail.com - goszc.space "${(request as any).signature.reason}" (Token: ${(request as any).signature.token}). Motivo: ${request.reason}`,
          isRead: false, // Requests são considerados não lidos até serem processados
          createdAt: request.createdAt,
          relatedData: { requestId: request.id, signatureId: request.signatureId, userId: request.userId }
        }))
      } catch (error) {
        console.warn('Erro ao buscar requests pendentes:', error)
        // Continuar sem requests se houver erro
      }
    }

    // Combinar e ordenar todas as notificações
    const allNotifications = [
      ...requestNotifications,
      ...messageNotifications
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    return NextResponse.json({
      success: true,
      data: {
        notifications: allNotifications
      }
    })

  } catch (error) {
    console.error('Erro ao buscar notificações:', error)
    
    // Fallback: retornar lista vazia se houver problemas de conectividade
    return NextResponse.json({
      success: true,
      data: {
        notifications: []
      }
    })
  }
}
