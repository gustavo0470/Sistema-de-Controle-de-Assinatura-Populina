import { NextRequest, NextResponse } from 'next/server'
import { validateSecurityAnswer } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const { username, securityAnswer } = await request.json()

    if (!username || !securityAnswer) {
      return NextResponse.json(
        { success: false, error: 'Username e resposta de segurança são obrigatórios' },
        { status: 400 }
      )
    }

    const isValid = await validateSecurityAnswer(username, securityAnswer)

    if (!isValid) {
      return NextResponse.json(
        { success: false, error: 'Resposta de segurança incorreta' },
        { status: 401 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Resposta de segurança validada com sucesso'
    })

  } catch (error) {
    console.error('Erro na validação de segurança:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

