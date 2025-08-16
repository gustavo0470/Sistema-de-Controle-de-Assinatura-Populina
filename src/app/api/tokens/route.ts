import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/middleware'

// Buscar tokens únicos para dropdown
export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request)
    if (!authUser) {
      return NextResponse.json(
        { success: false, error: 'Não autorizado' },
        { status: 401 }
      )
    }

    // Tokens permitidos fixos (Prefeito e Município)
    const allowedTokens = ['Prefeito', 'Municipio']

    return NextResponse.json({
      success: true,
      data: { tokens: allowedTokens }
    })

  } catch (error) {
    console.error('Erro ao buscar tokens:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

