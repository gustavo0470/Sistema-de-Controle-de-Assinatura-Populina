import { NextRequest, NextResponse } from 'next/server'
import { robustPrisma } from '@/lib/prisma-robust'
import { requireAdmin } from '@/lib/middleware'

// Listar setores
// Público para dropdowns/filtros
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''

    const skip = (page - 1) * limit

    const where: any = {}

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ]
    }

    const [sectors, total] = await Promise.all([
      (await robustPrisma.sector()).findMany({
        where,
        include: {
          _count: {
            select: {
              users: true,
              signatures: true
            }
          }
        },
        orderBy: { name: 'asc' },
        skip,
        take: limit
      }),
      (await robustPrisma.sector()).count({ where })
    ])

    return NextResponse.json({
      success: true,
      data: {
        sectors,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    })

  } catch (error) {
    console.error('Erro ao listar setores:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// Criar setor
export const POST = requireAdmin(async (request: NextRequest) => {
  try {
    const { name, description } = await request.json()

    if (!name) {
      return NextResponse.json(
        { success: false, error: 'Nome do setor é obrigatório' },
        { status: 400 }
      )
    }

    // Verificar se setor já existe
    const existingSector = await (await robustPrisma.sector()).findUnique({
      where: { name }
    })

    if (existingSector) {
      return NextResponse.json(
        { success: false, error: 'Já existe um setor com este nome' },
        { status: 400 }
      )
    }

    const sector = await (await robustPrisma.sector()).create({
      data: {
        name,
        description: description || null
      },
      include: {
        _count: {
          select: {
            users: true,
            signatures: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: { sector },
      message: 'Setor criado com sucesso'
    })

  } catch (error) {
    console.error('Erro ao criar setor:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
})
