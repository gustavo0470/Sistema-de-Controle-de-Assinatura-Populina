import { NextRequest, NextResponse } from 'next/server'
import { robustPrisma } from '@/lib/prisma-robust'
import { requireAdmin } from '@/lib/middleware'
import bcrypt from 'bcryptjs'
import { UserRole } from '@prisma/client'

// Listar usuários
export const GET = requireAdmin(async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const role = searchParams.get('role') || ''
    const sectorId = searchParams.get('sectorId') || ''

    const skip = (page - 1) * limit

    const where: any = {}

    if (search) {
      where.OR = [
        { username: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } }
      ]
    }

    if (role) {
      where.role = role as UserRole
    }

    if (sectorId) {
      where.sectorId = sectorId
    }

    const [users, total] = await Promise.all([
      (await robustPrisma.user()).findMany({
        where,
        include: {
          sector: true,
          _count: {
            select: {
              signatures: true,
              requests: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      (await robustPrisma.user()).count({ where })
    ])

    return NextResponse.json({
      success: true,
      data: {
        users: users.map(user => ({
          ...user,
          password: undefined // Não retornar senha
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    })

  } catch (error) {
    console.error('Erro ao listar usuários:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
})

// Criar usuário
export const POST = requireAdmin(async (request: NextRequest) => {
  try {
    const { username, name, password, role, sectorId } = await request.json()

    if (!username || !name || !password || !role || !sectorId) {
      return NextResponse.json(
        { success: false, error: 'Todos os campos são obrigatórios' },
        { status: 400 }
      )
    }

    // Verificar se username já existe
    const existingUser = await (await robustPrisma.user()).findUnique({
      where: { username }
    })

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'Username já está em uso' },
        { status: 400 }
      )
    }

    // Verificar se setor existe
    const sector = await (await robustPrisma.sector()).findUnique({
      where: { id: sectorId }
    })

    if (!sector) {
      return NextResponse.json(
        { success: false, error: 'Setor não encontrado' },
        { status: 400 }
      )
    }

    // Validar role
    if (!Object.values(UserRole).includes(role)) {
      return NextResponse.json(
        { success: false, error: 'Role inválido' },
        { status: 400 }
      )
    }

    const hashedPassword = await bcrypt.hash(password, 12)

    const user = await (await robustPrisma.user()).create({
      data: {
        username,
        name,
        password: hashedPassword,
        role: role as UserRole,
        sectorId,
        isFirstLogin: true
      },
      include: {
        sector: true
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        user: {
          ...user,
          password: undefined
        }
      },
      message: 'Usuário criado com sucesso'
    })

  } catch (error) {
    console.error('Erro ao criar usuário:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
})
