'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function ChangePasswordPage() {
  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const router = useRouter()

  useEffect(() => {
    // Verificar se o usuário está autenticado
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me')
        if (!response.ok) {
          router.push('/login')
        }
      } catch (error) {
        router.push('/login')
      }
    }
    checkAuth()
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    if (formData.newPassword !== formData.confirmPassword) {
      setError('As senhas não conferem')
      setLoading(false)
      return
    }

    if (formData.newPassword.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres')
      setLoading(false)
      return
    }

    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (data.success) {
        setSuccess('Senha alterada com sucesso! Redirecionando...')
        setTimeout(() => {
          router.push('/dashboard')
        }, 2000)
      } else {
        setError(data.error || 'Erro ao alterar senha')
      }
    } catch (error) {
      setError('Erro de conexão. Tente novamente.')
      console.error('Erro ao alterar senha:', error)
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
          <div className="mx-auto h-16 w-16 bg-yellow-500 rounded-full flex items-center justify-center">
            <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="mt-6 text-center text-3xl font-display font-bold text-gray-900">
            Alterar Senha
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Por segurança, você deve alterar sua senha no primeiro acesso
          </p>
        </div>

        <div className="card animate-fade-in">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
                {success}
              </div>
            )}

            <div className="form-group">
              <label htmlFor="newPassword" className="form-label">
                Nova Senha
              </label>
              <input
                id="newPassword"
                name="newPassword"
                type="password"
                required
                className="input-field"
                placeholder="Digite sua nova senha (mín. 6 caracteres)"
                value={formData.newPassword}
                onChange={handleChange}
                disabled={loading}
                minLength={6}
              />
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword" className="form-label">
                Confirmar Nova Senha
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                className="input-field"
                placeholder="Confirme sua nova senha"
                value={formData.confirmPassword}
                onChange={handleChange}
                disabled={loading}
                minLength={6}
              />
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
                    Alterando...
                  </>
                ) : (
                  'Alterar Senha'
                )}
              </button>
            </div>
          </form>
        </div>

        <div className="text-center text-xs text-gray-500">
          <p>⚠️ Esta alteração é obrigatória para sua segurança</p>
        </div>
      </div>
    </div>
  )
}
