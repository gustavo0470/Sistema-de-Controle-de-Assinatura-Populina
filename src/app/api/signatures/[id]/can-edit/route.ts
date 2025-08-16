import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/middleware'

// Verificar se usuário pode editar assinatura (tem request aprovado)
export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params
    const authUser = await getAuthUser(request)
    
    if (!authUser) {
      return NextResponse.json(
        { success: false, error: 'Não autorizado' },
        { status: 401 }
      )
    }

    // Admin/Support sempre podem editar
    if (authUser.role === 'ADMIN' || authUser.role === 'SUPPORT') {
      return NextResponse.json({
        success: true,
        data: { canEdit: true, reason: 'Admin/Support' }
      })
    }

    // Verificar se assinatura existe e pertence ao usuário
    const signature = await prisma.signature.findUnique({
      where: { id }
    })

    if (!signature) {
      return NextResponse.json(
        { success: false, error: 'Assinatura não encontrada' },
        { status: 404 }
      )
    }

    if (signature.userId !== authUser.userId) {
      return NextResponse.json({
        success: true,
        data: { canEdit: false, reason: 'Não é sua assinatura' }
      })
    }

    // Verificar se existe request de EDIT aprovado
    const approvedEditRequest = await prisma.request.findFirst({
      where: {
        signatureId: id,
        userId: authUser.userId,
        type: 'EDIT',
        status: 'APPROVED'
      },
      orderBy: { updatedAt: 'desc' }
    })

    if (approvedEditRequest) {
      return NextResponse.json({
        success: true,
        data: { 
          canEdit: true, 
          reason: 'Request aprovado',
          requestId: approvedEditRequest.id,
          approvedAt: approvedEditRequest.updatedAt
        }
      })
    } else {
      return NextResponse.json({
        success: true,
        data: { 
          canEdit: false, 
          reason: 'Nenhum request de edição aprovado'
        }
      })
    }

  } catch (error) {
    console.error('Erro ao verificar permissão de edição:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

