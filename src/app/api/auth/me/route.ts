import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/middleware'
import { robustPrisma } from '@/lib/prisma-robust'

// Cache de usuários em memória para reduzir consultas ao banco
const userCache = new Map<string, { user: any; expires: number }>()
const USER_CACHE_DURATION = 10 * 60 * 1000 // 10 minutos

export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request)
    
    if (!authUser) {
      return NextResponse.json(
        { success: false, error: 'Não autorizado' },
        { status: 401 }
      )
    }

    // Verificar cache primeiro
    const cached = userCache.get(authUser.userId)
    if (cached && cached.expires > Date.now()) {
      return NextResponse.json({
        success: true,
        data: { user: cached.user }
      })
    }

    try {
      // Buscar dados completos do usuário com retry automático
      const user = await (await robustPrisma.user()).findUnique({
        where: { id: authUser.userId },
        include: {
          sector: true
        }
      })

      if (!user) {
        return NextResponse.json(
          { success: false, error: 'Usuário não encontrado' },
          { status: 404 }
        )
      }

      const userData = {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
        sectorId: user.sectorId,
        isFirstLogin: user.isFirstLogin,
        hasSecurityQuestion: !!user.securityQuestion,
        sector: (user as any).sector || null
      }

      // Adicionar ao cache
      userCache.set(authUser.userId, {
        user: userData,
        expires: Date.now() + USER_CACHE_DURATION
      })

      // Limpar cache expirado periodicamente
      if (userCache.size > 50) {
        for (const [key, value] of userCache.entries()) {
          if (value.expires <= Date.now()) {
            userCache.delete(key)
          }
        }
      }

      return NextResponse.json({
        success: true,
        data: { user: userData }
      })

    } catch (dbError: any) {
      console.error('Erro de conectividade com banco:', dbError)
      
      // Fallback: usar dados básicos do JWT se banco estiver inacessível
      const fallbackUser = {
        id: authUser.userId,
        username: authUser.username,
        name: authUser.username, // Fallback para username
        role: authUser.role,
        sectorId: 'fallback',
        isFirstLogin: false,
        hasSecurityQuestion: false,
        sector: {
          id: 'fallback',
          name: 'Sistema Indisponível',
          description: 'Problemas de conectividade'
        }
      }

      return NextResponse.json({
        success: true,
        data: { user: fallbackUser },
        warning: 'Dados limitados devido a problemas de conectividade'
      })
    }

  } catch (error) {
    console.error('Erro ao buscar dados do usuário:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
