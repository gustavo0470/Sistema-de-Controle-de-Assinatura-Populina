import { NextRequest } from 'next/server'
import jwt from 'jsonwebtoken'
import { UserRole } from '@prisma/client'

export interface AuthUserToken {
  userId: string
  username: string
  role: UserRole
}

// Cache de autenticação em memória para reduzir verificações JWT
const authCache = new Map<string, { user: AuthUserToken; expires: number }>()
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutos

export async function getAuthUser(request: NextRequest): Promise<AuthUserToken | null> {
  try {
    const token = request.cookies.get('auth-token')?.value

    if (!token) {
      return null
    }

    // Verificar cache primeiro
    const cached = authCache.get(token)
    if (cached && cached.expires > Date.now()) {
      return cached.user
    }

    const decoded = jwt.verify(
      token,
      process.env.NEXTAUTH_SECRET || 'fallback-secret'
    ) as AuthUserToken

    // Adicionar ao cache
    if (decoded) {
      authCache.set(token, {
        user: decoded,
        expires: Date.now() + CACHE_DURATION
      })
      
      // Limpar cache expirado periodicamente
      if (authCache.size > 100) {
        for (const [key, value] of authCache.entries()) {
          if (value.expires <= Date.now()) {
            authCache.delete(key)
          }
        }
      }
    }

    return decoded
  } catch (error) {
    console.error('Erro ao validar token:', error)
    // Remover do cache se inválido
    const token = request.cookies.get('auth-token')?.value
    if (token) {
      authCache.delete(token)
    }
    return null
  }
}

export function requireAuth(handler: Function) {
  return async (request: NextRequest, ...args: any[]) => {
    const authUser = await getAuthUser(request)
    
    if (!authUser) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Não autorizado' 
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    return handler(request, { authUser }, ...args)
  }
}

export function requireAdmin(handler: Function) {
  return async (request: NextRequest, context?: any) => {
    const authUser = await getAuthUser(request)
    
    if (!authUser) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Não autorizado' 
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    if (authUser.role !== UserRole.ADMIN && authUser.role !== UserRole.SUPPORT) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Acesso negado - Privilégios administrativos necessários' 
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Adicionar authUser ao request para uso posterior
    request.headers.set('x-auth-user', JSON.stringify(authUser))
    
    return handler(request, context)
  }
}
