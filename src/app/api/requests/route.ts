import { NextRequest, NextResponse } from 'next/server'
import { robustPrisma } from '@/lib/prisma-robust'
import { getAuthUser } from '@/lib/middleware'
import { RequestType } from '@prisma/client'

// Listar solicitações
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
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const status = searchParams.get('status') || ''

    const skip = (page - 1) * limit

    const where: any = {}

    // Se não for admin, só mostrar solicitações próprias
    if (authUser.role === 'COMMON') {
      where.userId = authUser.userId
    }

    // Filtro de status
    if (status) {
      where.status = status
    }

    const [requests, total] = await Promise.all([
      (await robustPrisma.request()).findMany({
        where,
        include: {
          user: {
            select: { id: true, name: true, username: true }
          },
          signature: {
            select: { id: true, reason: true, token: true, serverName: true }
          },
          respondedBy: {
            select: { id: true, name: true, username: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      (await robustPrisma.request()).count({ where })
    ])

    return NextResponse.json({
      success: true,
      data: {
        requests,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    })

  } catch (error) {
    console.error('Erro ao listar solicitações:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// Criar solicitação
export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request)
    if (!authUser) {
      return NextResponse.json(
        { success: false, error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const { type, signatureId, reason } = await request.json()

    if (!type || !signatureId || !reason?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Tipo, ID da assinatura e motivo são obrigatórios' },
        { status: 400 }
      )
    }

    // Verificar se a assinatura existe e pertence ao usuário
    const signature = await (await robustPrisma.signature()).findUnique({
      where: { id: signatureId }
    })

    if (!signature) {
      return NextResponse.json(
        { success: false, error: 'Assinatura não encontrada' },
        { status: 404 }
      )
    }

    if (signature.userId !== authUser.userId) {
      return NextResponse.json(
        { success: false, error: 'Você só pode solicitar alteração de suas próprias assinaturas' },
        { status: 403 }
      )
    }

    // Verificar se não há solicitação pendente para esta assinatura
    const existingRequest = await (await robustPrisma.request()).findFirst({
      where: {
        signatureId,
        status: 'PENDING'
      }
    })

    if (existingRequest) {
      return NextResponse.json(
        { success: false, error: 'Já existe uma solicitação pendente para esta assinatura' },
        { status: 400 }
      )
    }

    const newRequest = await (await robustPrisma.request()).create({
      data: {
        type: type as RequestType,
        userId: authUser.userId,
        signatureId,
        reason: reason.trim()
      },
      include: {
        user: {
          select: { id: true, name: true, username: true }
        },
        signature: {
          select: { id: true, reason: true, token: true, serverName: true }
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: { request: newRequest },
      message: 'Solicitação enviada com sucesso'
    })

  } catch (error) {
    console.error('Erro ao criar solicitação:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
