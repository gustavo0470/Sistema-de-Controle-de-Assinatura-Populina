'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function ForgotPasswordPage() {
  const [step, setStep] = useState(1) // 1: username, 2: security question, 3: new password
  const [formData, setFormData] = useState({
    username: '',
    securityAnswer: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [securityQuestion, setSecurityQuestion] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const router = useRouter()

  const handleUsernameSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch(`/api/auth/forgot-password?username=${formData.username}`)
      const data = await response.json()

      if (data.success) {
        setSecurityQuestion(data.data.securityQuestion)
        setStep(2)
      } else {
        setError(data.error || 'Usuário não encontrado')
      }
    } catch (error) {
      setError('Erro de conexão. Tente novamente.')
      console.error('Erro ao buscar pergunta de segurança:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSecurityValidation = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (!formData.securityAnswer.trim()) {
      setError('A resposta é obrigatória')
      setLoading(false)
      return
    }

    try {
      // Validar resposta de segurança
      const response = await fetch('/api/auth/validate-security', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: formData.username,
          securityAnswer: formData.securityAnswer
        })
      })

      const data = await response.json()

      if (data.success) {
        setStep(3) // Prosseguir para o step 3
      } else {
        setError(data.error || 'Resposta de segurança incorreta')
      }
    } catch (error) {
      setError('Erro de conexão. Tente novamente.')
      console.error('Erro na validação de segurança:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

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
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: formData.username,
          securityAnswer: formData.securityAnswer,
          newPassword: formData.newPassword
        })
      })

      const data = await response.json()

      if (data.success) {
        setSuccess('Senha alterada com sucesso! Redirecionando para login...')
        setTimeout(() => {
          router.push('/login')
        }, 3000)
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
          <div className="mx-auto h-16 w-16 bg-orange-500 rounded-full flex items-center justify-center">
            <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="mt-6 text-center text-3xl font-display font-bold text-gray-900">
            Recuperar Senha
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {step === 1 && 'Digite seu username para continuar'}
            {step === 2 && 'Responda sua pergunta de segurança'}
            {step === 3 && 'Digite sua nova senha'}
          </p>
        </div>

        <div className="card animate-fade-in">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4">
              {success}
            </div>
          )}

          {step === 1 && (
            <form onSubmit={handleUsernameSubmit} className="space-y-6">
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

              <button
                type="submit"
                className="w-full btn-primary flex items-center justify-center"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className="loading-spinner mr-2"></div>
                    Verificando...
                  </>
                ) : (
                  'Continuar'
                )}
              </button>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleSecurityValidation} className="space-y-6">
              <div className="form-group">
                <label className="form-label">
                  Pergunta de Segurança
                </label>
                <p className="text-sm text-gray-600 mb-2">{securityQuestion}</p>
                <input
                  name="securityAnswer"
                  type="text"
                  required
                  className="input-field"
                  placeholder="Digite sua resposta"
                  value={formData.securityAnswer}
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>

              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 btn-secondary"
                >
                  Voltar
                </button>
                <button
                  type="submit"
                  className="flex-1 btn-primary"
                >
                  Continuar
                </button>
              </div>
            </form>
          )}

          {step === 3 && (
            <form onSubmit={handlePasswordReset} className="space-y-6">
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

              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="flex-1 btn-secondary"
                  disabled={loading}
                >
                  Voltar
                </button>
                <button
                  type="submit"
                  className="flex-1 btn-primary flex items-center justify-center"
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
          )}

          <div className="text-center mt-4">
            <Link 
              href="/login" 
              className="text-sm text-primary-600 hover:text-primary-800 transition-colors duration-200"
            >
              Voltar para Login
            </Link>
          </div>
        </div>

        <div className="text-center text-xs text-gray-500">
          <p>Precisa de ajuda? Entre em contato com o suporte técnico</p>
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
