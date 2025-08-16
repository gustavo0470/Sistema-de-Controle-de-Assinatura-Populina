import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/middleware'

// Listar usuários disponíveis para chat
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
    const search = searchParams.get('search') || ''

    const where: any = {
      id: { not: authUser.userId } // Excluir o próprio usuário
    }

    // Se for usuário comum, só pode conversar com ADMIN e SUPPORT
    if (authUser.role === 'COMMON') {
      where.role = { in: ['ADMIN', 'SUPPORT'] }
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { username: { contains: search, mode: 'insensitive' } }
      ]
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        username: true,
        role: true,
        sector: {
          select: {
            name: true
          }
        }
      },
      orderBy: [
        { role: 'desc' }, // Admins e suporte primeiro
        { name: 'asc' }
      ],
      take: 50
    })

    // Buscar guests que enviaram mensagens (apenas para admin/suporte)
    let guestUsers: any[] = []
    if (authUser.role === 'ADMIN' || authUser.role === 'SUPPORT') {
      const guestMessages = await prisma.chatMessage.findMany({
        where: {
          fromUserId: { startsWith: 'guest-' },
          toUserId: authUser.userId
        },
        select: {
          fromUserId: true,
          message: true,
          createdAt: true
        },
        distinct: ['fromUserId'],
        orderBy: { createdAt: 'desc' }
      })

      guestUsers = guestMessages.map(msg => {
        const guestInfo = msg.message.match(/^\[GUEST: ([^@]+) @([^]]+)\]/)
        return {
          id: msg.fromUserId,
          name: guestInfo ? guestInfo[1].trim() : 'Visitante',
          username: guestInfo ? guestInfo[2].trim() : msg.fromUserId.replace('guest-', ''),
          role: 'GUEST',
          isGuest: true,
          sector: { name: 'Visitante' }
        }
      })
    }

    const allUsers = [...guestUsers, ...users] // Guests primeiro

    return NextResponse.json({
      success: true,
      data: { users: allUsers }
    })

  } catch (error) {
    console.error('Erro ao listar usuários:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
