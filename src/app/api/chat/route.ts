import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/middleware'

// Listar conversas do usuário
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
    const withUserId = searchParams.get('withUserId')

    if (withUserId) {
      // Buscar mensagens específicas com um usuário
      const messages = await prisma.chatMessage.findMany({
        where: {
          OR: [
            { fromUserId: authUser.userId, toUserId: withUserId },
            { fromUserId: withUserId, toUserId: authUser.userId }
          ]
        },
        orderBy: { createdAt: 'asc' },
        take: 100
      })

      // Processar mensagens para adicionar informações de usuários quando possível
      const processedMessages = await Promise.all(messages.map(async (msg) => {
        let fromUser = null
        let toUser = null

        // Buscar fromUser se não for guest
        if (!msg.fromUserId.startsWith('guest-')) {
          const user = await prisma.user.findUnique({
            where: { id: msg.fromUserId },
            select: { id: true, name: true, username: true }
          })
          if (user) fromUser = user
        }

        // Buscar toUser se não for guest
        if (!msg.toUserId.startsWith('guest-')) {
          const user = await prisma.user.findUnique({
            where: { id: msg.toUserId },
            select: { id: true, name: true, username: true }
          })
          if (user) toUser = user
        }

        return {
          ...msg,
          fromUser,
          toUser
        }
      }))

      // Marcar mensagens como lidas
      await prisma.chatMessage.updateMany({
        where: {
          fromUserId: withUserId,
          toUserId: authUser.userId,
          isRead: false
        },
        data: { isRead: true }
      })

      // Processar mensagens de guests especificamente
      const finalMessages = processedMessages.map(msg => {
        // Se for mensagem de guest, extrair informações do prefixo
        if (msg.fromUserId.startsWith('guest-')) {
          const guestInfo = msg.message.match(/^\[GUEST: ([^@]+) @([^]]+)\]/)
          if (guestInfo) {
            return {
              ...msg,
              fromUser: {
                id: msg.fromUserId,
                name: guestInfo[1].trim(),
                username: guestInfo[2].trim()
              },
              message: msg.message.replace(/^\[GUEST: [^\]]+\] /, '') // Remover prefixo
            }
          }
        }
        return msg
      })

      return NextResponse.json({
        success: true,
        data: { messages: finalMessages }
      })
    } else {
      // Buscar lista de conversas
      const conversations = await prisma.$queryRaw`
        SELECT DISTINCT 
          CASE 
            WHEN "fromUserId" = ${authUser.userId} THEN "toUserId"
            ELSE "fromUserId"
          END as "userId",
          u.name,
          u.username,
          u.role,
          (
            SELECT COUNT(*)::int 
            FROM "chat_messages" 
            WHERE "fromUserId" = CASE 
              WHEN cm."fromUserId" = ${authUser.userId} THEN cm."toUserId"
              ELSE cm."fromUserId"
            END 
            AND "toUserId" = ${authUser.userId}
            AND "isRead" = false
          ) as "unreadCount",
          (
            SELECT "message" 
            FROM "chat_messages" cm2
            WHERE (
              (cm2."fromUserId" = ${authUser.userId} AND cm2."toUserId" = CASE 
                WHEN cm."fromUserId" = ${authUser.userId} THEN cm."toUserId"
                ELSE cm."fromUserId"
              END) OR
              (cm2."toUserId" = ${authUser.userId} AND cm2."fromUserId" = CASE 
                WHEN cm."fromUserId" = ${authUser.userId} THEN cm."toUserId"
                ELSE cm."fromUserId"
              END)
            )
            ORDER BY cm2."createdAt" DESC 
            LIMIT 1
          ) as "lastMessage",
          (
            SELECT cm2."createdAt" 
            FROM "chat_messages" cm2
            WHERE (
              (cm2."fromUserId" = ${authUser.userId} AND cm2."toUserId" = CASE 
                WHEN cm."fromUserId" = ${authUser.userId} THEN cm."toUserId"
                ELSE cm."fromUserId"
              END) OR
              (cm2."toUserId" = ${authUser.userId} AND cm2."fromUserId" = CASE 
                WHEN cm."fromUserId" = ${authUser.userId} THEN cm."toUserId"
                ELSE cm."fromUserId"
              END)
            )
            ORDER BY cm2."createdAt" DESC 
            LIMIT 1
          ) as "lastMessageAt"
        FROM "chat_messages" cm
        JOIN "users" u ON u.id = CASE 
          WHEN cm."fromUserId" = ${authUser.userId} THEN cm."toUserId"
          ELSE cm."fromUserId"
        END
        WHERE cm."fromUserId" = ${authUser.userId} OR cm."toUserId" = ${authUser.userId}
        ORDER BY "lastMessageAt" DESC
      ` as any[]

      // Buscar conversas com visitantes (guest-*)
      const guestMessages = await prisma.chatMessage.findMany({
        where: {
          OR: [
            { fromUserId: { startsWith: 'guest-' }, toUserId: authUser.userId },
            { toUserId: { startsWith: 'guest-' }, fromUserId: authUser.userId }
          ]
        },
        orderBy: { createdAt: 'desc' }
      })

      const guestConvoMap = new Map<string, any>()

      for (const msg of guestMessages) {
        const guestId = msg.fromUserId.startsWith('guest-') ? msg.fromUserId : msg.toUserId

        if (!guestConvoMap.has(guestId)) {
          // Calcular unread count
          const unread = await prisma.chatMessage.count({
            where: {
              fromUserId: guestId,
              toUserId: authUser.userId,
              isRead: false
            }
          })

          // Remover prefixo se existir para exibir mensagem limpa
          const cleanedMessage = msg.message.replace(/^\[GUEST:[^\]]+\]\s*/, '')

          guestConvoMap.set(guestId, {
            userId: guestId,
            name: 'Visitante',
            username: guestId.replace('guest-', ''),
            role: 'GUEST',
            unreadCount: unread,
            lastMessage: cleanedMessage,
            lastMessageAt: msg.createdAt
          })
        }
      }

      const guestConversations = Array.from(guestConvoMap.values())

      // Combinar e ordenar
      const combined = [...conversations, ...guestConversations].sort((a, b) => (
        new Date(b.lastMessageAt as any).getTime() - new Date(a.lastMessageAt as any).getTime()
      ))

      return NextResponse.json({
        success: true,
        data: { conversations: combined }
      })
    }

  } catch (error) {
    console.error('Erro ao buscar chat:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// Enviar mensagem
export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request)
    if (!authUser) {
      return NextResponse.json(
        { success: false, error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const { toUserId, message } = await request.json()

    if (!toUserId || !message?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Destinatário e mensagem são obrigatórios' },
        { status: 400 }
      )
    }

    // Se não for guest, verificar se usuário existe
    let toUser = null
    if (!toUserId.startsWith('guest-')) {
      toUser = await prisma.user.findUnique({ where: { id: toUserId } })
      if (!toUser) {
        return NextResponse.json(
          { success: false, error: 'Usuário destinatário não encontrado' },
          { status: 404 }
        )
      }
    }

    const chatMessage = await prisma.chatMessage.create({
      data: {
        fromUserId: authUser.userId,
        toUserId,
        message: message.trim()
      }
    })

    // Buscar informações do usuário remetente
    const fromUser = await prisma.user.findUnique({
      where: { id: authUser.userId },
      select: { id: true, name: true, username: true }
    })

    // Se estiver enviando para um guest, não teremos toUser real
    const processedMessage = {
      ...chatMessage,
      fromUser,
      toUser: toUserId.startsWith('guest-') ? {
        id: toUserId,
        name: 'Visitante',
        username: toUserId.replace('guest-', '')
      } : await prisma.user.findUnique({
        where: { id: toUserId },
        select: { id: true, name: true, username: true }
      })
    }

    return NextResponse.json({
      success: true,
      data: { message: processedMessage },
      message: 'Mensagem enviada com sucesso'
    })

  } catch (error) {
    console.error('Erro ao enviar mensagem:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
