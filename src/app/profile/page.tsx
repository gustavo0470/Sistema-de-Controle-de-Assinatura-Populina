'use client'

import { useState, useEffect } from 'react'
import Layout from '@/components/Layout'

interface User {
  id: string
  username: string
  name: string
  role: string
  hasSecurityQuestion: boolean
  sector: {
    name: string
  }
}

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null)
  const [activeTab, setActiveTab] = useState('profile')
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [securityForm, setSecurityForm] = useState({
    question: '',
    answer: ''
  })
  const [loading, setLoading] = useState(true)
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [securityLoading, setSecurityLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    fetchUserData()
  }, [])

  const fetchUserData = async () => {
    try {
      const response = await fetch('/api/auth/me')
      if (response.ok) {
        const data = await response.json()
        setUser(data.data.user)
      }
    } catch (error) {
      console.error('Erro ao carregar dados do usuário:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordLoading(true)
    setError('')
    setSuccess('')

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError('As senhas não conferem')
      setPasswordLoading(false)
      return
    }

    if (passwordForm.newPassword.length < 6) {
      setError('A nova senha deve ter pelo menos 6 caracteres')
      setPasswordLoading(false)
      return
    }

    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
          confirmPassword: passwordForm.confirmPassword
        })
      })

      const data = await response.json()

      if (data.success) {
        setSuccess('Senha alterada com sucesso!')
        setPasswordForm({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        })
      } else {
        setError(data.error || 'Erro ao alterar senha')
      }
    } catch (error) {
      setError('Erro de conexão. Tente novamente.')
      console.error('Erro ao alterar senha:', error)
    } finally {
      setPasswordLoading(false)
    }
  }

  const handleSecuritySubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSecurityLoading(true)
    setError('')
    setSuccess('')

    if (!securityForm.question.trim() || !securityForm.answer.trim()) {
      setError('Pergunta e resposta são obrigatórias')
      setSecurityLoading(false)
      return
    }

    try {
      const response = await fetch('/api/auth/security-question', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(securityForm)
      })

      const data = await response.json()

      if (data.success) {
        setSuccess('Pergunta de segurança configurada com sucesso!')
        setSecurityForm({ question: '', answer: '' })
        setUser({ ...user!, hasSecurityQuestion: true })
      } else {
        setError(data.error || 'Erro ao configurar pergunta de segurança')
      }
    } catch (error) {
      setError('Erro de conexão. Tente novamente.')
      console.error('Erro ao configurar pergunta de segurança:', error)
    } finally {
      setSecurityLoading(false)
    }
  }

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswordForm({
      ...passwordForm,
      [e.target.name]: e.target.value
    })
  }

  const handleSecurityChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setSecurityForm({
      ...securityForm,
      [e.target.name]: e.target.value
    })
  }

  const getRoleLabel = (role: string) => {
    const roles = {
      COMMON: 'Usuário Comum',
      ADMIN: 'Administrador',
      SUPPORT: 'Suporte Técnico'
    }
    return roles[role as keyof typeof roles] || role
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="loading-spinner"></div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-display font-bold text-gray-900">
            Perfil do Usuário
          </h1>
          <p className="mt-2 text-gray-600">
            Gerencie suas informações pessoais e configurações de segurança
          </p>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
            {success}
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('profile')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'profile'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Informações Pessoais
            </button>
            <button
              onClick={() => setActiveTab('password')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'password'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Alterar Senha
            </button>
            <button
              onClick={() => setActiveTab('security')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'security'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Segurança
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'profile' && (
          <div className="card">
            <div className="card-header">
              <h2 className="text-lg font-display font-semibold text-gray-900">
                Informações Pessoais
              </h2>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="form-label">Username</label>
                  <input
                    type="text"
                    className="input-field bg-gray-50"
                    value={user?.username || ''}
                    disabled
                  />
                </div>

                <div>
                  <label className="form-label">Nome Completo</label>
                  <input
                    type="text"
                    className="input-field bg-gray-50"
                    value={user?.name || ''}
                    disabled
                  />
                </div>

                <div>
                  <label className="form-label">Papel</label>
                  <input
                    type="text"
                    className="input-field bg-gray-50"
                    value={getRoleLabel(user?.role || '')}
                    disabled
                  />
                </div>

                <div>
                  <label className="form-label">Setor</label>
                  <input
                    type="text"
                    className="input-field bg-gray-50"
                    value={user?.sector?.name || ''}
                    disabled
                  />
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-blue-700">
                      <strong>Informação:</strong> Para alterar suas informações pessoais, entre em contato com o administrador do sistema.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'password' && (
          <div className="card">
            <div className="card-header">
              <h2 className="text-lg font-display font-semibold text-gray-900">
                Alterar Senha
              </h2>
            </div>

            <form onSubmit={handlePasswordSubmit} className="space-y-6">
              <div className="form-group">
                <label htmlFor="currentPassword" className="form-label">
                  Senha Atual *
                </label>
                <input
                  id="currentPassword"
                  name="currentPassword"
                  type="password"
                  required
                  className="input-field"
                  value={passwordForm.currentPassword}
                  onChange={handlePasswordChange}
                  disabled={passwordLoading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="newPassword" className="form-label">
                  Nova Senha *
                </label>
                <input
                  id="newPassword"
                  name="newPassword"
                  type="password"
                  required
                  className="input-field"
                  value={passwordForm.newPassword}
                  onChange={handlePasswordChange}
                  disabled={passwordLoading}
                  minLength={6}
                />
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword" className="form-label">
                  Confirmar Nova Senha *
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  className="input-field"
                  value={passwordForm.confirmPassword}
                  onChange={handlePasswordChange}
                  disabled={passwordLoading}
                  minLength={6}
                />
              </div>

              <button
                type="submit"
                className="btn-primary flex items-center justify-center"
                disabled={passwordLoading}
              >
                {passwordLoading ? (
                  <>
                    <div className="loading-spinner mr-2"></div>
                    Alterando...
                  </>
                ) : (
                  'Alterar Senha'
                )}
              </button>
            </form>
          </div>
        )}

        {activeTab === 'security' && (
          <div className="card">
            <div className="card-header">
              <h2 className="text-lg font-display font-semibold text-gray-900">
                Pergunta de Segurança
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {user?.hasSecurityQuestion 
                  ? 'Você já possui uma pergunta de segurança configurada. Use o formulário abaixo para alterá-la.'
                  : 'Configure uma pergunta de segurança para recuperar sua senha em caso de esquecimento.'
                }
              </p>
            </div>

            <form onSubmit={handleSecuritySubmit} className="space-y-6">
              <div className="form-group">
                <label htmlFor="question" className="form-label">
                  Pergunta de Segurança *
                </label>
                <input
                  id="question"
                  name="question"
                  type="text"
                  required
                  className="input-field"
                  placeholder="Ex: Qual o nome da sua cidade natal?"
                  value={securityForm.question}
                  onChange={handleSecurityChange}
                  disabled={securityLoading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="answer" className="form-label">
                  Resposta *
                </label>
                <input
                  id="answer"
                  name="answer"
                  type="text"
                  required
                  className="input-field"
                  placeholder="Digite sua resposta"
                  value={securityForm.answer}
                  onChange={handleSecurityChange}
                  disabled={securityLoading}
                />
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-yellow-700">
                      <strong>Importante:</strong> Guarde bem sua resposta. Ela será necessária para recuperar sua senha caso você a esqueça.
                    </p>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="btn-primary flex items-center justify-center"
                disabled={securityLoading}
              >
                {securityLoading ? (
                  <>
                    <div className="loading-spinner mr-2"></div>
                    Salvando...
                  </>
                ) : (
                  user?.hasSecurityQuestion ? 'Atualizar Pergunta' : 'Configurar Pergunta'
                )}
              </button>
            </form>
          </div>
        )}
      </div>
    </Layout>
  )
}
