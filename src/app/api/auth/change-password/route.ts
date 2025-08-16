import { NextRequest, NextResponse } from 'next/server'
import { changePassword } from '@/lib/auth'
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

    const { newPassword, confirmPassword } = await request.json()

    if (!newPassword || !confirmPassword) {
      return NextResponse.json(
        { success: false, error: 'Nova senha e confirmação são obrigatórias' },
        { status: 400 }
      )
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        { success: false, error: 'Senhas não conferem' },
        { status: 400 }
      )
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { success: false, error: 'A senha deve ter pelo menos 6 caracteres' },
        { status: 400 }
      )
    }

    const success = await changePassword(authUser.userId, newPassword)

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
    console.error('Erro ao alterar senha:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
