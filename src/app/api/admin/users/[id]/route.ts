import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/middleware'
import bcrypt from 'bcryptjs'
import { UserRole } from '@prisma/client'

// Buscar usuário específico
export const GET = requireAdmin(async (request: NextRequest, context: { params: Promise<{ id: string }> }) => {
  try {
    const { id } = await context.params
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        sector: true,
        _count: {
          select: {
            signatures: true,
            requests: true
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Usuário não encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        user: {
          ...user,
          password: undefined
        }
      }
    })

  } catch (error) {
    console.error('Erro ao buscar usuário:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
})

// Atualizar usuário
export const PUT = requireAdmin(async (request: NextRequest, context: { params: Promise<{ id: string }> }) => {
  try {
    const { id } = await context.params
    const { username, name, password, role, sectorId } = await request.json()

    if (!username || !name || !role || !sectorId) {
      return NextResponse.json(
        { success: false, error: 'Username, nome, role e setor são obrigatórios' },
        { status: 400 }
      )
    }

    // Verificar se usuário existe
    const existingUser = await prisma.user.findUnique({
      where: { id }
    })

    if (!existingUser) {
      return NextResponse.json(
        { success: false, error: 'Usuário não encontrado' },
        { status: 404 }
      )
    }

    // Verificar se username já está em uso por outro usuário
    if (username !== existingUser.username) {
      const userWithUsername = await prisma.user.findUnique({
        where: { username }
      })

      if (userWithUsername) {
        return NextResponse.json(
          { success: false, error: 'Username já está em uso' },
          { status: 400 }
        )
      }
    }

    // Verificar se setor existe
    const sector = await prisma.sector.findUnique({
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

    const updateData: any = {
      username,
      name,
      role: role as UserRole,
      sectorId
    }

    // Se senha foi fornecida, atualizar hash
    if (password) {
      updateData.password = await bcrypt.hash(password, 12)
      updateData.isFirstLogin = true // Forçar troca de senha
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
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
      message: 'Usuário atualizado com sucesso'
    })

  } catch (error) {
    console.error('Erro ao atualizar usuário:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
})

// Deletar usuário
export const DELETE = requireAdmin(async (request: NextRequest, context: { params: Promise<{ id: string }> }) => {
  try {
    const { id } = await context.params
    // Verificar se usuário existe
    const existingUser = await prisma.user.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            signatures: true,
            requests: true
          }
        }
      }
    })

    if (!existingUser) {
      return NextResponse.json(
        { success: false, error: 'Usuário não encontrado' },
        { status: 404 }
      )
    }

    // Verificar se usuário tem assinaturas ou solicitações
    if (existingUser._count.signatures > 0 || existingUser._count.requests > 0) {
      return NextResponse.json(
        { success: false, error: 'Não é possível deletar usuário com assinaturas ou solicitações' },
        { status: 400 }
      )
    }

    await prisma.user.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      message: 'Usuário deletado com sucesso'
    })

  } catch (error) {
    console.error('Erro ao deletar usuário:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
})
