import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getAuthUser } from '@/lib/middleware'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Verificar se é rota admin
  if (pathname.startsWith('/admin')) {
    const authUser = await getAuthUser(request)
    
    // Se não estiver logado, redireciona para login
    if (!authUser) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    
    // Se for usuário comum tentando acessar admin, redireciona para dashboard
    if (authUser.role === 'COMMON') {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/admin/:path*'
  ]
}
