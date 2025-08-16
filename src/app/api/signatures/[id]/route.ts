import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/middleware'

// Buscar assinatura específica
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

    const signature = await prisma.signature.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, name: true, username: true }
        },
        sector: {
          select: { id: true, name: true }
        }
      }
    })

    if (!signature) {
      return NextResponse.json(
        { success: false, error: 'Assinatura não encontrada' },
        { status: 404 }
      )
    }

    // Verificar permissão (próprio usuário ou admin/suporte)
    if (signature.userId !== authUser.userId && authUser.role !== 'ADMIN' && authUser.role !== 'SUPPORT') {
      return NextResponse.json(
        { success: false, error: 'Acesso negado' },
        { status: 403 }
      )
    }

    return NextResponse.json({
      success: true,
      data: { signature }
    })

  } catch (error) {
    console.error('Erro ao buscar assinatura:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// Atualizar assinatura
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

    // Verificar permissão (próprio usuário ou admin/suporte)
    if (existingSignature.userId !== authUser.userId && authUser.role !== 'ADMIN' && authUser.role !== 'SUPPORT') {
      return NextResponse.json(
        { success: false, error: 'Acesso negado' },
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

    return NextResponse.json({
      success: true,
      data: { signature: updatedSignature },
      message: 'Assinatura atualizada com sucesso'
    })

  } catch (error) {
    console.error('Erro ao atualizar assinatura:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// Deletar assinatura
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

    // Verificar permissão (próprio usuário ou admin/suporte)
    if (existingSignature.userId !== authUser.userId && authUser.role !== 'ADMIN' && authUser.role !== 'SUPPORT') {
      return NextResponse.json(
        { success: false, error: 'Acesso negado' },
        { status: 403 }
      )
    }

    await prisma.signature.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      message: 'Assinatura deletada com sucesso'
    })

  } catch (error) {
    console.error('Erro ao deletar assinatura:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

