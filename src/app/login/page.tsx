'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  })
  const [rememberMe, setRememberMe] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          rememberMe
        })
      })

      const data = await response.json()

      if (data.success) {
        // Verificar se é primeiro login
        if (data.data.user.isFirstLogin) {
          router.push('/change-password')
        } else {
          // Redirecionar baseado no role
          if (data.data.user.role === 'ADMIN' || data.data.user.role === 'SUPPORT') {
            router.push('/admin')
          } else {
            router.push('/dashboard')
          }
        }
      } else {
        setError(data.error || 'Erro ao fazer login')
      }
    } catch (error) {
      setError('Erro de conexão. Tente novamente.')
      console.error('Erro no login:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-16 w-16 bg-primary-600 rounded-full flex items-center justify-center">
            <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="mt-6 text-center text-3xl font-display font-bold text-gray-900">
            Sistema de Assinaturas
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Faça login com seu username e senha
          </p>
        </div>

        <div className="card animate-fade-in">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <div className="form-group">
              <label htmlFor="username" className="form-label">
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                className="input-field"
                placeholder="Digite seu username"
                value={formData.username}
                onChange={handleChange}
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="password" className="form-label">
                Senha
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="input-field"
                placeholder="Digite sua senha"
                value={formData.password}
                onChange={handleChange}
                disabled={loading}
              />
            </div>

            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                disabled={loading}
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                Manter login por 30 dias
              </label>
            </div>

            <div>
              <button
                type="submit"
                className="w-full btn-primary flex items-center justify-center"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className="loading-spinner mr-2"></div>
                    Entrando...
                  </>
                ) : (
                  'Entrar'
                )}
              </button>
            </div>

            <div className="text-center">
              <Link 
                href="/forgot-password" 
                className="text-sm text-primary-600 hover:text-primary-800 transition-colors duration-200"
              >
                Esqueceu sua senha?
              </Link>
            </div>
          </form>
        </div>

        <div className="text-center text-xs text-gray-500">
          <p>Sistema de Gestão de Assinaturas</p>
          <p>Desenvolvido com Next.js + Supabase + Prisma</p>
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-400">
              © 2025 GOSZC SOLUTIONS - Gustavo Salmazo Custódio - +55 (17) 99703-8154 - gust.cust047@gmail.com - <a href="https://goszc.space" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">goszc.space</a>
            </p>
          </div>
        </div>
      </div>

      {/* Floating Chat Button */}
      <Link 
        href="/chat-support"
        className="fixed bottom-6 right-6 bg-primary-600 hover:bg-primary-700 text-white p-4 rounded-full shadow-lg transition-all duration-200 z-50"
        title="Chat de Suporte"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      </Link>
    </div>
  )
}
