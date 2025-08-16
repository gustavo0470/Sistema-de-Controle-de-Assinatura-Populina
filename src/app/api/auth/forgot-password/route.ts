import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { validateSecurityAnswer, changePassword } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const { username, securityAnswer, newPassword } = await request.json()

    if (!username || !securityAnswer || !newPassword) {
      return NextResponse.json(
        { success: false, error: 'Todos os campos são obrigatórios' },
        { status: 400 }
      )
    }

    // Buscar usuário e sua pergunta de segurança
    const user = await prisma.user.findUnique({
      where: { username }
    })

    if (!user || !user.securityQuestion) {
      return NextResponse.json(
        { success: false, error: 'Usuário não encontrado ou pergunta de segurança não configurada' },
        { status: 404 }
      )
    }

    // Validar resposta de segurança
    const isValidAnswer = await validateSecurityAnswer(username, securityAnswer)

    if (!isValidAnswer) {
      return NextResponse.json(
        { success: false, error: 'Resposta de segurança incorreta' },
        { status: 401 }
      )
    }

    // Alterar senha
    const success = await changePassword(user.id, newPassword)

    if (!success) {
      return NextResponse.json(
        { success: false, error: 'Erro ao alterar senha' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Senha alterada com sucesso'
    })

  } catch (error) {
    console.error('Erro na recuperação de senha:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// API para obter pergunta de segurança
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const username = searchParams.get('username')

    if (!username) {
      return NextResponse.json(
        { success: false, error: 'Username é obrigatório' },
        { status: 400 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { username },
      select: { securityQuestion: true }
    })

    if (!user || !user.securityQuestion) {
      return NextResponse.json(
        { success: false, error: 'Usuário não encontrado ou pergunta de segurança não configurada' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        securityQuestion: user.securityQuestion
      }
    })

  } catch (error) {
    console.error('Erro ao buscar pergunta de segurança:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
