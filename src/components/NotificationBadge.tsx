'use client'

import { useState, useEffect } from 'react'

interface NotificationBadgeProps {
  children: React.ReactNode
}

export default function NotificationBadge({ children }: NotificationBadgeProps) {
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const response = await fetch('/api/notifications/count')
        if (response.ok) {
          const data = await response.json()
          setUnreadCount(data.data.unreadCount || 0)
        }
      } catch (error) {
        console.error('Erro ao buscar notificações:', error)
      }
    }

    // Buscar inicialmente
    fetchUnreadCount()

    // Polling a cada 30 segundos para simular tempo real
    const interval = setInterval(fetchUnreadCount, 30000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="relative">
      {children}
      {unreadCount > 0 && (
        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </div>
  )
}

