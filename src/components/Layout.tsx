'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import NotificationBadge from './NotificationBadge'

interface User {
  id: string
  username: string
  name: string
  role: 'COMMON' | 'ADMIN' | 'SUPPORT'
  sector: {
    name: string
  }
}

interface LayoutProps {
  children: React.ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const [user, setUser] = useState<User | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch('/api/auth/me')
        if (response.ok) {
          const data = await response.json()
          setUser(data.data.user)
        } else {
          router.push('/login')
        }
      } catch (error) {
        console.error('Erro ao buscar dados do usuário:', error)
        router.push('/login')
      } finally {
        setLoading(false)
      }
    }

    fetchUser()
  }, [router])

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      router.push('/login')
    } catch (error) {
      console.error('Erro no logout:', error)
    }
  }

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPPORT'

  const navigation = [
    {
      name: 'Dashboard',
      href: isAdmin ? '/admin' : '/dashboard',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2 2z" />
        </svg>
      ),
      current: pathname === (isAdmin ? '/admin' : '/dashboard')
    },
    ...(isAdmin ? [
      {
        name: 'Usuários',
        href: '/admin/users',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
          </svg>
        ),
        current: pathname.startsWith('/admin/users')
      },
      {
        name: 'Setores',
        href: '/admin/sectors',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        ),
        current: pathname.startsWith('/admin/sectors')
      },
      {
        name: 'Solicitações',
        href: '/admin/requests',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
        ),
        current: pathname.startsWith('/admin/requests')
      },
      {
        name: 'Assinaturas',
        href: '/signatures',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        ),
        current: pathname.startsWith('/signatures')
      },
      {
        name: 'Exportar',
        href: '/admin/export',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        ),
        current: pathname.startsWith('/admin/export')
      }
    ] : [
      {
        name: 'Assinaturas',
        href: '/signatures',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        ),
        current: pathname.startsWith('/signatures')
      }
    ]),
    {
      name: 'Notificações',
      href: '/notifications',
      icon: (
        <NotificationBadge>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5a2 2 0 00-2-2H8a2 2 0 01-2-2V8a2 2 0 012-2h5a2 2 0 012 2v1" />
          </svg>
        </NotificationBadge>
      ),
      current: pathname.startsWith('/notifications')
    },
    {
      name: 'Chat',
      href: '/chat',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      ),
      current: pathname.startsWith('/chat')
    },
    {
      name: 'Perfil',
      href: '/profile',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
      current: pathname === '/profile'
    }
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="loading-spinner"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className={`sidebar ${sidebarOpen ? 'block' : 'hidden'} lg:block fade-in mobile-scroll`}>
        <div className="flex items-center justify-center h-16 bg-primary-600">
          <h1 className="text-white text-lg font-display font-bold">
            Sistema Assinaturas
          </h1>
        </div>
        
        <nav className="mt-8">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={`nav-item ${item.current ? 'active' : ''} hover-lift transition-all duration-200 touch-optimization`}
            >
              {item.icon}
              <span className="ml-3">{item.name}</span>
            </Link>
          ))}
        </nav>

        <div className="absolute bottom-0 w-full p-4 border-t border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">
                  {user?.name?.charAt(0)?.toUpperCase()}
                </span>
              </div>
            </div>
            <div className="ml-3 min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user?.name}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {user?.sector?.name}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="mt-3 w-full text-left text-sm text-gray-500 hover:text-gray-700 transition-colors duration-200"
          >
            Sair
          </button>
        </div>
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <div className="bg-white shadow-sm border-b border-gray-200">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            
            <div className="flex items-center">
              <span className="text-sm text-gray-600">
                Bem-vindo, <span className="font-medium">{user?.name}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="p-4 sm:p-6 lg:p-8 pb-16">
          {children}
        </main>

        {/* Footer / Watermark */}
        <footer className="fixed bottom-0 left-0 right-0 lg:left-64 bg-gray-800 text-gray-300 text-xs py-2 px-4 z-30">
          <div className="flex items-center justify-center">
            <p className="text-center">
              © 2025 GOSZC SOLUTIONS - Gustavo Salmazo Custódio - +55 (17) 99703-8154 - gust.cust047@gmail.com - <a href="https://goszc.space" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">goszc.space</a>
            </p>
          </div>
        </footer>
      </div>
    </div>
  )
}
