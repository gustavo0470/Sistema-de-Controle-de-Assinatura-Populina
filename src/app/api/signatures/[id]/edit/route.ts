import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/middleware'

// Editar assinatura após aprovação de request
export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params
    const { reason, token } = await request.json()
    const authUser = await getAuthUser(request)
    
    if (!authUser) {
      return NextResponse.json(
        { success: false, error: 'Não autorizado' },
        { status: 401 }
      )
    }

    if (!reason?.trim() || !token?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Motivo e token são obrigatórios' },
        { status: 400 }
      )
    }

    // Verificar se assinatura existe
    const existingSignature = await prisma.signature.findUnique({
      where: { id }
    })

    if (!existingSignature) {
      return NextResponse.json(
        { success: false, error: 'Assinatura não encontrada' },
        { status: 404 }
      )
    }

    // Verificar permissão (próprio usuário)
    if (existingSignature.userId !== authUser.userId) {
      return NextResponse.json(
        { success: false, error: 'Acesso negado' },
        { status: 403 }
      )
    }

    // Verificar se existe request de EDIT aprovado para esta assinatura
    const approvedEditRequest = await prisma.request.findFirst({
      where: {
        signatureId: id,
        userId: authUser.userId,
        type: 'EDIT',
        status: 'APPROVED'
      },
      orderBy: { updatedAt: 'desc' }
    })

    if (!approvedEditRequest) {
      return NextResponse.json(
        { success: false, error: 'Você não tem permissão para editar esta assinatura. Solicite uma edição primeiro.' },
        { status: 403 }
      )
    }

    const updatedSignature = await prisma.signature.update({
      where: { id },
      data: {
        reason: reason.trim(),
        token: token.trim()
      },
      include: {
        user: {
          select: { id: true, name: true, username: true }
        },
        sector: {
          select: { id: true, name: true }
        }
      }
    })

    // Marcar o request como "utilizado" - muda status para impedir nova edição
    await prisma.request.update({
      where: { id: approvedEditRequest.id },
      data: {
        status: 'REJECTED', // força o usuário a abrir nova solicitação
        adminResponse: `Edição realizada em ${new Date().toLocaleString('pt-BR')}`
      }
    })

    return NextResponse.json({
      success: true,
      data: { signature: updatedSignature },
      message: 'Assinatura editada com sucesso'
    })

  } catch (error) {
    console.error('Erro ao editar assinatura pós-aprovação:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

