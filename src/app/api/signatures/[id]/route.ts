import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/middleware'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

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

    // Verificar se assinatura existe e buscar anexos
    const existingSignature = await prisma.signature.findUnique({
      where: { id },
      include: {
        attachments: true
      }
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

    console.log(`🗑️ Deletando assinatura ${existingSignature.incrementalId} via API direta`)

    // Deletar todos os arquivos anexados do storage primeiro
    if (existingSignature.attachments && existingSignature.attachments.length > 0) {
      console.log(`📁 Deletando ${existingSignature.attachments.length} anexos do storage...`)
      
      const filesToDelete = existingSignature.attachments.map(attachment => attachment.storagePath)
      
      try {
        const { error: deleteError } = await supabase.storage
          .from('attachments')
          .remove(filesToDelete)

        if (deleteError) {
          console.error('Erro ao deletar alguns arquivos do storage:', deleteError)
          // Continua com a exclusão mesmo se houver erro no storage
        } else {
          console.log(`✅ ${filesToDelete.length} arquivos deletados do storage com sucesso`)
        }
      } catch (storageError) {
        console.error('Erro ao acessar storage:', storageError)
        // Continua com a exclusão mesmo se houver erro no storage
      }
    } else {
      console.log('📄 Nenhum anexo para deletar')
    }

    // Deletar assinatura do banco (incluirá cascata para attachments e requests)
    await prisma.signature.delete({
      where: { id }
    })

    console.log(`✅ Assinatura ${existingSignature.incrementalId} deletada completamente via API direta`)

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

