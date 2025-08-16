import { NextRequest, NextResponse } from 'next/server'
import { updateSecurityQuestion } from '@/lib/auth'
import { getAuthUser } from '@/lib/middleware'

export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request)
    if (!authUser) {
      return NextResponse.json(
        { success: false, error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const { question, answer } = await request.json()

    if (!question?.trim() || !answer?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Pergunta e resposta são obrigatórias' },
        { status: 400 }
      )
    }

    const success = await updateSecurityQuestion(authUser.userId, question.trim(), answer.trim())

    if (!success) {
      return NextResponse.json(
        { success: false, error: 'Erro ao configurar pergunta de segurança' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Pergunta de segurança configurada com sucesso'
    })

  } catch (error) {
    console.error('Erro ao configurar pergunta de segurança:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
