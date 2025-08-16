'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'

interface Message {
  id: string
  message: string
  createdAt: string
  isFromUser: boolean
}

export default function ChatSupportPage() {
  const [guestForm, setGuestForm] = useState({
    username: '',
    name: ''
  })
  const [chatStarted, setChatStarted] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [guestId, setGuestId] = useState('')
  const [supportUser, setSupportUser] = useState<any>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (chatStarted && guestForm.username) {
      // Buscar mensagens iniciais e configurar polling
      fetchMessages()
      const interval = setInterval(fetchMessages, 5000) // Poll a cada 5 segundos
      return () => clearInterval(interval)
    }
  }, [chatStarted, guestForm.username])

  const fetchMessages = async () => {
    try {
      const response = await fetch(`/api/chat/guest?username=${encodeURIComponent(guestForm.username)}`)
      if (response.ok) {
        const data = await response.json()
        const formattedMessages = data.data.messages.map((msg: any) => ({
          id: msg.id,
          message: msg.message.replace(/^\[GUEST: [^\]]+\] /, ''), // Remover prefixo do guest
          createdAt: msg.createdAt,
          isFromUser: msg.fromUserId.startsWith('guest-')
        }))
        setMessages(formattedMessages)
      }
    } catch (error) {
      console.error('Erro ao buscar mensagens:', error)
    }
  }

  const handleStartChat = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!guestForm.username.trim() || !guestForm.name.trim()) return

    setLoading(true)
    setError('')

    try {
      // Apenas marcar como iniciado - mensagem de boas-vindas será enviada automaticamente
      setChatStarted(true)
      setGuestId(`guest-${guestForm.username.toLowerCase()}`)
      
      // Aguardar um momento para o useEffect buscar mensagens
      setTimeout(() => {
        // Se não houver mensagens, adicionar uma de boas-vindas local
        if (messages.length === 0) {
          setMessages([{
            id: 'welcome',
            message: `Olá ${guestForm.name}! Bem-vindo ao nosso chat de suporte. Conectando você com nossa equipe...`,
            createdAt: new Date().toISOString(),
            isFromUser: false
          }])
        }
      }, 1000)
      
    } catch (error) {
      setError('Erro ao iniciar chat. Tente novamente.')
      console.error('Erro ao iniciar chat:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim()) return

    const messageText = newMessage.trim()
    setNewMessage('')

    try {
      const response = await fetch('/api/chat/guest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: guestForm.username,
          name: guestForm.name,
          message: messageText
        })
      })

      const data = await response.json()

      if (data.success) {
        // Atualizar mensagens localmente primeiro para resposta imediata
        const userMessage: Message = {
          id: Date.now().toString(),
          message: messageText,
          createdAt: new Date().toISOString(),
          isFromUser: true
        }
        setMessages(prev => [...prev, userMessage])

        // As mensagens de resposta do admin serão buscadas via polling
      } else {
        setError(data.error || 'Erro ao enviar mensagem')
        // Restaurar mensagem no input em caso de erro
        setNewMessage(messageText)
      }
    } catch (error) {
      setError('Erro de conexão. Tente novamente.')
      console.error('Erro ao enviar mensagem:', error)
      setNewMessage(messageText)
    }
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center py-12 px-4">
      <div className="max-w-2xl w-full">
        {!chatStarted ? (
          /* Formulário de Início */
          <div className="card animate-fade-in">
            <div className="text-center mb-6">
              <div className="mx-auto h-16 w-16 bg-primary-600 rounded-full flex items-center justify-center mb-4">
                <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h2 className="text-2xl font-display font-bold text-gray-900">
                Chat de Suporte
              </h2>
              <p className="mt-2 text-gray-600">
                Entre em contato com nossa equipe de suporte
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
                {error}
              </div>
            )}

            <form onSubmit={handleStartChat} className="space-y-4">
              <div className="form-group">
                <label htmlFor="username" className="form-label">
                  Username *
                </label>
                <input
                  id="username"
                  type="text"
                  required
                  className="input-field"
                  placeholder="Digite seu username"
                  value={guestForm.username}
                  onChange={(e) => setGuestForm({ ...guestForm, username: e.target.value })}
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="name" className="form-label">
                  Nome Completo *
                </label>
                <input
                  id="name"
                  type="text"
                  required
                  className="input-field"
                  placeholder="Digite seu nome completo"
                  value={guestForm.name}
                  onChange={(e) => setGuestForm({ ...guestForm, name: e.target.value })}
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
                    Iniciando...
                  </>
                ) : (
                  'Iniciar Chat'
                )}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-gray-200 text-center">
              <p className="text-sm text-gray-600 mb-3">
                Já tem uma conta no sistema?
              </p>
              <Link href="/login" className="btn-secondary">
                Fazer Login
              </Link>
            </div>
          </div>
        ) : (
          /* Interface de Chat */
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden h-96 flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-gray-200 bg-primary-600 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Chat de Suporte</h3>
                  <p className="text-sm text-primary-100">
                    Conectado como: {guestForm.name}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setChatStarted(false)
                    setMessages([])
                    setGuestForm({ username: '', name: '' })
                  }}
                  className="text-primary-100 hover:text-white transition-colors duration-200"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <div key={message.id} className={`flex ${message.isFromUser ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    message.isFromUser 
                      ? 'bg-primary-600 text-white' 
                      : 'bg-gray-100 text-gray-900'
                  }`}>
                    <p className="text-sm">{message.message}</p>
                    <p className={`text-xs mt-1 ${
                      message.isFromUser ? 'text-primary-100' : 'text-gray-500'
                    }`}>
                      {formatTime(message.createdAt)}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-gray-200">
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Digite sua mensagem..."
                  className="flex-1 input-field"
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="btn-primary px-6 flex items-center justify-center"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Info Footer */}
        <div className="mt-6 text-center text-sm text-gray-600">
          <p>
            Este é um chat de suporte público. Para um atendimento completo,{' '}
            <Link href="/login" className="text-primary-600 hover:text-primary-800">
              faça login no sistema
            </Link>
          </p>
        </div>

        {/* Watermark */}
        <div className="mt-4 text-center text-xs text-gray-500">
          © 2025 GOSZC SOLUTIONS - Gustavo Salmazo Custódio - +55 (17) 99703-8154 - gust.cust047@gmail.com - <a href="https://goszc.space" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">goszc.space</a>
        </div>
      </div>
    </div>
  )
}
