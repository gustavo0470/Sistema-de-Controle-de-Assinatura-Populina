import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/middleware'

// Deletar mensagem individual
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

    // Verificar se mensagem existe
    const existingMessage = await prisma.chatMessage.findUnique({
      where: { id }
    })

    if (!existingMessage) {
      return NextResponse.json(
        { success: false, error: 'Mensagem não encontrada' },
        { status: 404 }
      )
    }

    // Verificar permissão (autor da mensagem ou admin/suporte)
    const isAuthor = existingMessage.fromUserId === authUser.userId
    const isAdmin = authUser.role === 'ADMIN' || authUser.role === 'SUPPORT'
    
    if (!isAuthor && !isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Sem permissão para deletar esta mensagem' },
        { status: 403 }
      )
    }

    await prisma.chatMessage.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      message: 'Mensagem deletada com sucesso'
    })

  } catch (error) {
    console.error('Erro ao deletar mensagem:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

