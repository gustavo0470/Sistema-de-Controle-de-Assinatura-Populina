'use client'

import { useState, useEffect } from 'react'
import Layout from '@/components/Layout'

interface Notification {
  id: string
  type: 'message' | 'request' | 'system'
  title: string
  message: string
  isRead: boolean
  createdAt: string
  fromUser?: {
    name: string
    username: string
  }
  relatedData?: any
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all') // all, unread, read
  const [markingAsRead, setMarkingAsRead] = useState<string[]>([])
  const [deletingNotifications, setDeletingNotifications] = useState<string[]>([])

  useEffect(() => {
    fetchNotifications()
    // Auto-refresh a cada 5 segundos para tempo real
    const interval = setInterval(fetchNotifications, 5000)
    return () => clearInterval(interval)
  }, [])

  // REMOVIDO: Auto-marcar causava loop infinito
  // Usuário deve marcar manualmente como lida

  const fetchNotifications = async () => {
    try {
      const response = await fetch('/api/notifications')
      if (response.ok) {
        const data = await response.json()
        setNotifications(data.data.notifications)
      }
    } catch (error) {
      console.error('Erro ao carregar notificações:', error)
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (notificationId: string) => {
    setMarkingAsRead([...markingAsRead, notificationId])
    
    try {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'POST'
      })

      if (response.ok) {
        setNotifications(notifications.map(n => 
          n.id === notificationId ? { ...n, isRead: true } : n
        ))
      }
    } catch (error) {
      console.error('Erro ao marcar como lida:', error)
    } finally {
      setMarkingAsRead(markingAsRead.filter(id => id !== notificationId))
    }
  }

  const markAllAsRead = async () => {
    try {
      const response = await fetch('/api/notifications/mark-all-read', {
        method: 'POST'
      })

      if (response.ok) {
        setNotifications(notifications.map(n => ({ ...n, isRead: true })))
      }
    } catch (error) {
      console.error('Erro ao marcar todas como lidas:', error)
    }
  }

  const deleteNotification = async (notificationId: string) => {
    setDeletingNotifications([...deletingNotifications, notificationId])
    
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setNotifications(notifications.filter(n => n.id !== notificationId))
      }
    } catch (error) {
      console.error('Erro ao deletar notificação:', error)
    } finally {
      setDeletingNotifications(deletingNotifications.filter(id => id !== notificationId))
    }
  }

  const goToOrigin = (notification: Notification) => {
    if (notification.type === 'message' && notification.relatedData?.messageId) {
      // Ir para o chat
      window.location.href = '/chat'
    } else if (notification.type === 'request' && notification.relatedData?.requestId) {
      // Ir para as solicitações
      window.location.href = '/admin/requests'
    }
  }

  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'unread') return !notification.isRead
    if (filter === 'read') return notification.isRead
    return true
  })

  const unreadCount = notifications.filter(n => !n.isRead).length

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(diffInHours * 60)
      return `${diffInMinutes}m atrás`
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h atrás`
    } else {
      return date.toLocaleDateString('pt-BR')
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'message':
        return (
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
        )
      case 'request':
        return (
          <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          </div>
        )
      default:
        return (
          <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        )
    }
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-display font-bold text-gray-900">
              Notificações
            </h1>
            <p className="mt-2 text-gray-600">
              {unreadCount > 0 ? `${unreadCount} notificação(ões) não lida(s)` : 'Todas as notificações estão em dia'}
            </p>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="btn-secondary"
            >
              Marcar todas como lidas
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="card">
          <div className="flex space-x-1">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                filter === 'all' 
                  ? 'bg-primary-100 text-primary-700' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Todas ({notifications.length})
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                filter === 'unread' 
                  ? 'bg-primary-100 text-primary-700' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Não lidas ({unreadCount})
            </button>
            <button
              onClick={() => setFilter('read')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                filter === 'read' 
                  ? 'bg-primary-100 text-primary-700' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Lidas ({notifications.length - unreadCount})
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="card">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="loading-spinner"></div>
            </div>
          ) : filteredNotifications.length > 0 ? (
            <div className="space-y-1">
              {filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 rounded-lg border transition-colors duration-200 ${
                    notification.isRead 
                      ? 'bg-white border-gray-200' 
                      : 'bg-blue-50 border-blue-200'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    {getNotificationIcon(notification.type)}
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className={`text-sm font-medium ${
                          notification.isRead ? 'text-gray-900' : 'text-gray-900 font-semibold'
                        }`}>
                          {notification.title}
                        </h4>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-gray-500">
                            {formatDate(notification.createdAt)}
                          </span>
                          <div className="flex space-x-1">
                            {notification.relatedData && (
                              <button
                                onClick={() => goToOrigin(notification)}
                                className="text-xs text-blue-600 hover:text-blue-800"
                                title="Ir para origem"
                              >
                                📍 Ir
                              </button>
                            )}
                            {!notification.isRead && (
                              <button
                                onClick={() => markAsRead(notification.id)}
                                disabled={markingAsRead.includes(notification.id)}
                                className="text-xs text-primary-600 hover:text-primary-800"
                              >
                                {markingAsRead.includes(notification.id) ? 'Marcando...' : '✓ Lida'}
                              </button>
                            )}
                            <button
                              onClick={() => deleteNotification(notification.id)}
                              disabled={deletingNotifications.includes(notification.id)}
                              className="text-xs text-red-600 hover:text-red-800"
                              title="Deletar notificação"
                            >
                              {deletingNotifications.includes(notification.id) ? 'Deletando...' : '🗑️'}
                            </button>
                          </div>
                        </div>
                      </div>
                      
                      <p className={`text-sm mt-1 ${
                        notification.isRead ? 'text-gray-600' : 'text-gray-700'
                      }`}>
                        {notification.message}
                      </p>
                      
                      {notification.fromUser && (
                        <p className="text-xs text-gray-500 mt-2">
                          De: {notification.fromUser.name} (@{notification.fromUser.username})
                        </p>
                      )}
                    </div>
                    
                    {!notification.isRead && (
                      <div className="w-2 h-2 bg-primary-500 rounded-full flex-shrink-0 mt-2"></div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5H9l5-5H9a2 2 0 01-2-2V5a2 2 0 012-2h6a2 2 0 012 2v10a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {filter === 'unread' ? 'Nenhuma notificação não lida' : 
                 filter === 'read' ? 'Nenhuma notificação lida' : 
                 'Nenhuma notificação'}
              </h3>
              <p className="text-gray-600">
                {filter === 'all' 
                  ? 'Você não possui notificações no momento.' 
                  : 'Tente ajustar o filtro para ver outras notificações.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}
