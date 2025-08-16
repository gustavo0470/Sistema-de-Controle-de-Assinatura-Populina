'use client'

import { useState, useEffect, useRef } from 'react'
import Layout from '@/components/Layout'

interface User {
  id: string
  name: string
  username: string
  role: string
  sector?: { name: string }
}

interface Message {
  id: string
  message: string
  createdAt: string
  fromUser: User | null
  toUser: User | null
  fromUserId?: string
}

interface Conversation {
  userId: string
  name: string
  username: string
  role: string
  unreadCount: number
  lastMessage: string
  lastMessageAt: string
}

export default function ChatPage() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [users, setUsers] = useState<User[]>([])
  const [showUserList, setShowUserList] = useState(false)
  const [userSearch, setUserSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [sendingMessage, setSendingMessage] = useState(false)
  const [deletingMessage, setDeletingMessage] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchConversations()
    fetchUsers()
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (selectedUser) {
      fetchMessages(selectedUser.id)
    }
  }, [selectedUser])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const fetchConversations = async () => {
    try {
      const response = await fetch('/api/chat')
      if (response.ok) {
        const data = await response.json()
        setConversations(data.data.conversations)
      }
    } catch (error) {
      console.error('Erro ao carregar conversas:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchUsers = async () => {
    try {
      const params = new URLSearchParams()
      if (userSearch) params.append('search', userSearch)
      
      const response = await fetch(`/api/chat/users?${params}`)
      if (response.ok) {
        const data = await response.json()
        setUsers(data.data.users)
      }
    } catch (error) {
      console.error('Erro ao carregar usuários:', error)
    }
  }

  const fetchMessages = async (userId: string) => {
    try {
      const response = await fetch(`/api/chat?withUserId=${userId}`)
      if (response.ok) {
        const data = await response.json()
        setMessages(data.data.messages)
      }
    } catch (error) {
      console.error('Erro ao carregar mensagens:', error)
    }
  }

  const deleteMessage = async (messageId: string) => {
    if (!confirm('Tem certeza que deseja deletar esta mensagem?')) return
    
    setDeletingMessage(messageId)
    
    try {
      const response = await fetch(`/api/chat/${messageId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setMessages(messages.filter(m => m.id !== messageId))
        // Atualizar conversas se necessário
        fetchConversations()
      } else {
        const data = await response.json()
        alert(data.error || 'Erro ao deletar mensagem')
      }
    } catch (error) {
      console.error('Erro ao deletar mensagem:', error)
      alert('Erro ao deletar mensagem')
    } finally {
      setDeletingMessage(null)
    }
  }

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedUser || !newMessage.trim() || sendingMessage) return

    setSendingMessage(true)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          toUserId: selectedUser.id,
          message: newMessage
        })
      })

      if (response.ok) {
        const data = await response.json()
        setMessages([...messages, data.data.message])
        setNewMessage('')
        fetchConversations() // Atualizar lista de conversas
      }
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error)
    } finally {
      setSendingMessage(false)
    }
  }

  const selectUser = (user: User) => {
    setSelectedUser(user)
    setShowUserList(false)
    setUserSearch('')
  }

  const selectConversation = (conversation: Conversation) => {
    const user: User = {
      id: conversation.userId,
      name: conversation.name,
      username: conversation.username,
      role: conversation.role
    }
    setSelectedUser(user)
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const today = new Date()
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === today.toDateString()) {
      return 'Hoje'
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Ontem'
    } else {
      return date.toLocaleDateString('pt-BR')
    }
  }

  const getRoleLabel = (role: string) => {
    const roles = {
      COMMON: 'Comum',
      ADMIN: 'Admin',
      SUPPORT: 'Suporte',
      GUEST: 'Visitante'
    }
    return roles[role as keyof typeof roles] || role
  }

  const getRoleBadgeColor = (role: string) => {
    const colors = {
      COMMON: 'bg-blue-100 text-blue-800',
      ADMIN: 'bg-red-100 text-red-800',
      SUPPORT: 'bg-yellow-100 text-yellow-800',
      GUEST: 'bg-gray-100 text-gray-800'
    }
    return colors[role as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  return (
    <Layout>
      <div className="h-[calc(100vh-12rem)] flex bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {/* Sidebar */}
        <div className="w-1/3 border-r border-gray-200 flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex justify-between items-center mb-3">
              <h2 className="font-display font-semibold text-gray-900">Chat</h2>
              <button
                onClick={() => setShowUserList(true)}
                className="btn-primary text-sm px-3 py-1"
              >
                Nova Conversa
              </button>
            </div>
          </div>

          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="loading-spinner"></div>
              </div>
            ) : conversations.length > 0 ? (
              <div className="space-y-1 p-2">
                {conversations.map((conversation) => (
                  <button
                    key={conversation.userId}
                    onClick={() => selectConversation(conversation)}
                    className={`w-full text-left p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200 ${
                      selectedUser?.id === conversation.userId ? 'bg-primary-50 border border-primary-200' : ''
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900 truncate">
                            {conversation.name}
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${getRoleBadgeColor(conversation.role)}`}>
                            {getRoleLabel(conversation.role)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 truncate mt-1">
                          {conversation.lastMessage}
                        </p>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-xs text-gray-500">
                          {formatTime(conversation.lastMessageAt)}
                        </span>
                        {conversation.unreadCount > 0 && (
                          <span className="bg-primary-600 text-white text-xs rounded-full px-2 py-0.5 mt-1">
                            {conversation.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>Nenhuma conversa ainda</p>
                <p className="text-sm mt-1">Clique em "Nova Conversa" para começar</p>
              </div>
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {selectedUser ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-medium">
                      {selectedUser.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{selectedUser.name}</h3>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">@{selectedUser.username}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${getRoleBadgeColor(selectedUser.role)}`}>
                        {getRoleLabel(selectedUser.role)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message, index) => {
                  const isFromCurrentUser = (message.fromUser?.id || message.fromUserId) === selectedUser.id
                  const showDate = index === 0 || 
                    formatDate(message.createdAt) !== formatDate(messages[index - 1].createdAt)

                  return (
                    <div key={message.id}>
                      {showDate && (
                        <div className="text-center py-2">
                          <span className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                            {formatDate(message.createdAt)}
                          </span>
                        </div>
                      )}
                      <div className={`flex group ${isFromCurrentUser ? 'justify-start' : 'justify-end'}`}>
                        <div className={`relative max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          isFromCurrentUser 
                            ? 'bg-gray-100 text-gray-900' 
                            : 'bg-primary-600 text-white'
                        }`}>
                          <p className="text-sm">{message.message}</p>
                          <p className={`text-xs mt-1 ${
                            isFromCurrentUser ? 'text-gray-500' : 'text-primary-100'
                          }`}>
                            {formatTime(message.createdAt)}
                          </p>
                          
                          {/* Botão de exclusão - aparecer ao hover */}
                          <button
                            onClick={() => deleteMessage(message.id)}
                            disabled={deletingMessage === message.id}
                            className={`absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center hover:bg-red-600 ${
                              deletingMessage === message.id ? 'opacity-100' : ''
                            }`}
                            title="Deletar mensagem"
                          >
                            {deletingMessage === message.id ? (
                              <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                              '×'
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="p-4 border-t border-gray-200">
                <form onSubmit={sendMessage} className="flex gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Digite sua mensagem..."
                    className="flex-1 input-field"
                    disabled={sendingMessage}
                  />
                  <button
                    type="submit"
                    disabled={!newMessage.trim() || sendingMessage}
                    className="btn-primary px-6 flex items-center justify-center"
                  >
                    {sendingMessage ? (
                      <div className="loading-spinner w-4 h-4"></div>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                    )}
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <p className="text-lg font-medium">Selecione uma conversa</p>
                <p className="text-sm mt-1">Escolha um usuário da lista para começar a conversar</p>
              </div>
            </div>
          )}
        </div>

        {/* User Selection Modal */}
        {showUserList && (
          <div className="modal-overlay" onClick={() => setShowUserList(false)}>
            <div className="modal-content max-w-lg" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-lg font-display font-semibold text-gray-900 mb-4">
                Selecionar Usuário
              </h3>

              <div className="mb-4">
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  onKeyUp={fetchUsers}
                  placeholder="Buscar usuário..."
                  className="input-field"
                />
              </div>

              <div className="max-h-96 overflow-y-auto space-y-2">
                {users.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => selectUser(user)}
                    className="w-full text-left p-3 rounded-lg hover:bg-gray-50 border border-gray-200"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{user.name}</p>
                        <p className="text-sm text-gray-600">@{user.username}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${getRoleBadgeColor(user.role)}`}>
                          {getRoleLabel(user.role)}
                        </span>
                        {user.sector && (
                          <span className="text-xs text-gray-500">{user.sector.name}</span>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200">
                <button
                  onClick={() => setShowUserList(false)}
                  className="w-full btn-secondary"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
