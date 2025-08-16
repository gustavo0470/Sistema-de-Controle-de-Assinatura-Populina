import { NextRequest, NextResponse } from 'next/server'
import { validateUser } from '@/lib/auth'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'

export async function POST(request: NextRequest) {
  try {
    const { username, password, rememberMe } = await request.json()

    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: 'Username e senha são obrigatórios' },
        { status: 400 }
      )
    }

    const user = await validateUser(username, password)

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Credenciais inválidas' },
        { status: 401 }
      )
    }

    // Criar token JWT
    // Determinar tempo de expiração baseado em "manter login"
    const expirationTime = rememberMe ? '30d' : '24h'
    const maxAge = rememberMe ? 60 * 60 * 24 * 30 : 60 * 60 * 24 // 30 dias ou 24 horas

    const token = jwt.sign(
      { userId: user.id, username: user.username, role: user.role },
      process.env.NEXTAUTH_SECRET || 'fallback-secret',
      { expiresIn: expirationTime }
    )

    // Definir cookie
    const cookieStore = await cookies()
    cookieStore.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge,
      path: '/'
    })

    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: user.id,
          username: user.username,
          name: user.name,
          role: user.role,
          isFirstLogin: user.isFirstLogin
        }
      }
    })

  } catch (error) {
    console.error('Erro no login:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
