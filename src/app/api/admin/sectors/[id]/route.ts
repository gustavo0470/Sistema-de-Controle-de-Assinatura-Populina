import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/middleware'

// Buscar setor específico
export const GET = requireAdmin(async (request: NextRequest, context: { params: Promise<{ id: string }> }) => {
  try {
    const { id } = await context.params
    const sector = await prisma.sector.findUnique({
      where: { id },
      include: {
        users: {
          select: {
            id: true,
            name: true,
            username: true,
            role: true
          }
        },
        _count: {
          select: {
            users: true,
            signatures: true
          }
        }
      }
    })

    if (!sector) {
      return NextResponse.json(
        { success: false, error: 'Setor não encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: { sector }
    })

  } catch (error) {
    console.error('Erro ao buscar setor:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
})

// Atualizar setor
export const PUT = requireAdmin(async (request: NextRequest, context: { params: Promise<{ id: string }> }) => {
  try {
    const { id } = await context.params
    const { name, description } = await request.json()

    if (!name) {
      return NextResponse.json(
        { success: false, error: 'Nome do setor é obrigatório' },
        { status: 400 }
      )
    }

    // Verificar se setor existe
    const existingSector = await prisma.sector.findUnique({
      where: { id }
    })

    if (!existingSector) {
      return NextResponse.json(
        { success: false, error: 'Setor não encontrado' },
        { status: 404 }
      )
    }

    // Verificar se nome já está em uso por outro setor
    if (name !== existingSector.name) {
      const sectorWithName = await prisma.sector.findUnique({
        where: { name }
      })

      if (sectorWithName) {
        return NextResponse.json(
          { success: false, error: 'Já existe um setor com este nome' },
          { status: 400 }
        )
      }
    }

    const sector = await prisma.sector.update({
      where: { id },
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
      message: 'Setor atualizado com sucesso'
    })

  } catch (error) {
    console.error('Erro ao atualizar setor:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
})

// Deletar setor
export const DELETE = requireAdmin(async (request: NextRequest, context: { params: Promise<{ id: string }> }) => {
  try {
    const { id } = await context.params
    // Verificar se setor existe
    const existingSector = await prisma.sector.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            users: true,
            signatures: true
          }
        }
      }
    })

    if (!existingSector) {
      return NextResponse.json(
        { success: false, error: 'Setor não encontrado' },
        { status: 404 }
      )
    }

    // Verificar se setor tem usuários ou assinaturas
    if (existingSector._count.users > 0) {
      return NextResponse.json(
        { success: false, error: 'Não é possível deletar setor que possui usuários' },
        { status: 400 }
      )
    }

    if (existingSector._count.signatures > 0) {
      return NextResponse.json(
        { success: false, error: 'Não é possível deletar setor que possui assinaturas' },
        { status: 400 }
      )
    }

    await prisma.sector.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      message: 'Setor deletado com sucesso'
    })

  } catch (error) {
    console.error('Erro ao deletar setor:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
})
