import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Verificar se é rota admin
  if (pathname.startsWith('/admin')) {
    // Verificar se há cookie de autenticação
    const authCookie = request.cookies.get('auth-token')
    
    // Se não estiver logado, redireciona para login
    if (!authCookie) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    
    // Para verificação de role, deixar a API fazer isso
    // O middleware só verifica se está autenticado
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/admin/:path*'
  ]
}
