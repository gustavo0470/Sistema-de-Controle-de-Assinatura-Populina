import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Criar conversa de guest com admin/suporte
export async function POST(request: NextRequest) {
  try {
    const { username, name, message } = await request.json()

    if (!username || !name || !message) {
      return NextResponse.json(
        { success: false, error: 'Username, nome e mensagem são obrigatórios' },
        { status: 400 }
      )
    }

    // Buscar um usuário admin ou suporte para receber a mensagem
    const supportUser = await prisma.user.findFirst({
      where: {
        OR: [
          { role: 'ADMIN' },
          { role: 'SUPPORT' }
        ]
      },
      orderBy: { createdAt: 'asc' } // Pegar o mais antigo (provavelmente o gustavo)
    })

    if (!supportUser) {
      return NextResponse.json(
        { success: false, error: 'Nenhum administrador ou suporte disponível' },
        { status: 404 }
      )
    }

    // Criar ID único para o guest baseado no username
    const guestId = `guest-${username.toLowerCase()}`

    // Salvar a mensagem do guest (sem FKs)
    const chatMessage = await prisma.chatMessage.create({
      data: {
        fromUserId: guestId,
        toUserId: supportUser.id,
        message: `[GUEST: ${name} (@${username})] ${message}`
      }
    })

    return NextResponse.json({
      success: true,
      data: { 
        message: chatMessage,
        guestId,
        supportUser: {
          id: supportUser.id,
          name: supportUser.name
        }
      },
      message: 'Mensagem enviada com sucesso'
    })

  } catch (error) {
    console.error('Erro ao enviar mensagem de guest:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// Buscar mensagens de uma conversa guest
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const username = searchParams.get('username')

    if (!username) {
      return NextResponse.json(
        { success: false, error: 'Username é obrigatório' },
        { status: 400 }
      )
    }

    const guestId = `guest-${username.toLowerCase()}`

    // Buscar mensagens relacionadas a este guest
    const messages = await prisma.chatMessage.findMany({
      where: {
        OR: [
          { fromUserId: guestId },
          { toUserId: guestId }
        ]
      },
      orderBy: { createdAt: 'asc' }
    })

    // Processar mensagens para adicionar informações de usuários reais quando necessário
    const processedMessages = await Promise.all(messages.map(async (msg) => {
      let fromUser = null
      let toUser = null

      // Se fromUserId não é guest, buscar o usuário real
      if (!msg.fromUserId.startsWith('guest-')) {
        const user = await prisma.user.findUnique({
          where: { id: msg.fromUserId },
          select: { name: true, username: true }
        })
        if (user) fromUser = user
      }

      // Se toUserId não é guest, buscar o usuário real
      if (!msg.toUserId.startsWith('guest-')) {
        const user = await prisma.user.findUnique({
          where: { id: msg.toUserId },
          select: { name: true, username: true }
        })
        if (user) toUser = user
      }

      return {
        ...msg,
        fromUser,
        toUser
      }
    }))

    return NextResponse.json({
      success: true,
      data: { messages: processedMessages }
    })

  } catch (error) {
    console.error('Erro ao buscar mensagens do guest:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
