import { NextRequest, NextResponse } from 'next/server'
import { robustPrisma } from '@/lib/prisma-robust'
import { getAuthUser } from '@/lib/middleware'

// Criar nova assinatura
export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request)
    if (!authUser) {
      return NextResponse.json(
        { success: false, error: 'Não autorizado' },
        { status: 401 }
      )
    }

    // Verificar se SUPPORT pode criar assinaturas (não pode)
    if (authUser.role === 'SUPPORT') {
      return NextResponse.json(
        { success: false, error: 'Suporte não pode criar assinaturas' },
        { status: 403 }
      )
    }

    const { reason, token } = await request.json()

    if (!reason || !token) {
      return NextResponse.json(
        { success: false, error: 'Motivo e token são obrigatórios' },
        { status: 400 }
      )
    }

    // Buscar dados do usuário para auto-preenchimento
    const user = await (await robustPrisma.user()).findUnique({
      where: { id: authUser.userId },
      include: { sector: true }
    })

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Usuário não encontrado' },
        { status: 404 }
      )
    }

    // Criar assinatura com auto-preenchimento
    const signature = await (await robustPrisma.signature()).create({
      data: {
        userId: user.id,
        sectorId: user.sectorId,
        serverName: user.name, // Auto-preenchido
        sectorName: (user as any).sector.name, // Auto-preenchido
        reason,
        token
      },
      include: {
        user: true,
        sector: true
      }
    })

    return NextResponse.json({
      success: true,
      data: { signature },
      message: 'Assinatura criada com sucesso'
    })

  } catch (error) {
    console.error('Erro ao criar assinatura:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// Listar assinaturas (com filtros)
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
    const search = searchParams.get('search') || ''
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const token = searchParams.get('token') || ''
    const server = searchParams.get('server') || ''
    const sector = searchParams.get('sector') || ''

    const skip = (page - 1) * limit

    // Construir filtros
    const where: any = {}

    // REMOVIDO: Agora todos podem ver assinaturas de todos
    // if (authUser.role === 'COMMON') {
    //   where.userId = authUser.userId
    // }

    // Filtro de busca
    if (search) {
      where.OR = [
        { reason: { contains: search, mode: 'insensitive' } },
        { token: { contains: search, mode: 'insensitive' } },
        { serverName: { contains: search, mode: 'insensitive' } },
        { sectorName: { contains: search, mode: 'insensitive' } }
      ]
    }

    // Filtro de data
    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) {
        where.createdAt.gte = new Date(startDate)
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate + 'T23:59:59.999Z')
      }
    }

    // Filtro de token
    if (token) {
      where.token = { contains: token, mode: 'insensitive' }
    }

    // Filtro de servidor
    if (server) {
      where.serverName = { contains: server, mode: 'insensitive' }
    }

    // Filtro de setor
    if (sector) {
      where.sectorName = { contains: sector, mode: 'insensitive' }
    }

    const [signatures, total] = await Promise.all([
      (await robustPrisma.signature()).findMany({
        where,
        include: {
          user: true,
          sector: true,
          attachments: true
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      (await robustPrisma.signature()).count({ where })
    ])

    return NextResponse.json({
      success: true,
      data: {
        signatures,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    })

  } catch (error: any) {
    console.error('Erro ao listar assinaturas:', error)
    
    // Fallback para erros de conectividade
    if (error.code === 'P1001') {
      return NextResponse.json({
        success: true,
        data: {
          signatures: [],
          pagination: {
            page: 1,
            limit: 10,
            total: 0,
            totalPages: 0
          }
        },
        warning: 'Sistema temporariamente indisponível - dados não carregados'
      })
    }
    
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
