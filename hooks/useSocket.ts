'use client'

import { useEffect, useRef, useState } from 'react'
import { useSession } from 'next-auth/react'
import { io, Socket } from 'socket.io-client'

interface UseSocketOptions {
  autoConnect?: boolean
  reconnection?: boolean
  reconnectionDelay?: number
  reconnectionAttempts?: number
}

interface OnlineUser {
  socketId: string
  userId: string
  name: string
  avatar?: string
  joinedAt: Date
}

export const useSocket = (options: UseSocketOptions = {}) => {
  const { data: session } = useSession()
  const {
    autoConnect = true,
    reconnection = true,
    reconnectionDelay = 1000,
    reconnectionAttempts = 5
  } = options

  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([])
  const [connectionError, setConnectionError] = useState<string | null>(null)
  const socketRef = useRef<Socket | null>(null)

  useEffect(() => {
    if (!autoConnect || !session?.user) return

    // Initialize socket connection with authentication
    const newSocket = io({
      path: '/api/socket/io',
      addTrailingSlash: false,
      reconnection,
      reconnectionDelay,
      reconnectionAttempts,
      auth: {
        token: session.accessToken || session.user.id, // Use access token if available
        userId: session.user.id,
        name: session.user.name,
        avatar: session.user.image
      }
    })

    socketRef.current = newSocket

    // Connection events
    newSocket.on('connect', () => {
      console.log('Connected to socket server:', newSocket.id)
      setIsConnected(true)
      setConnectionError(null)
    })

    newSocket.on('disconnect', (reason) => {
      console.log('Disconnected from socket server:', reason)
      setIsConnected(false)
    })

    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error)
      setConnectionError(error.message)
      setIsConnected(false)
    })

    // User events
    newSocket.on('users:online', (users: OnlineUser[]) => {
      setOnlineUsers(users)
    })

    newSocket.on('user:online', (user: OnlineUser & { onlineCount: number }) => {
      setOnlineUsers(prev => {
        const existing = prev.findIndex(u => u.userId === user.userId)
        if (existing === -1) {
          return [...prev, { socketId: user.socketId, userId: user.userId, name: user.name, avatar: user.avatar, joinedAt: new Date() }]
        }
        return prev
      })
    })

    newSocket.on('user:offline', (user: { userId: string, name: string, onlineCount: number }) => {
      setOnlineUsers(prev => prev.filter(u => u.userId !== user.userId))
    })

    newSocket.on('users:online_count', (count: number) => {
      console.log('Online users count:', count)
    })

    // Error handling
    newSocket.on('error', (error) => {
      console.error('Socket error:', error)
      setConnectionError(error.message)
    })

    setSocket(newSocket)

    // Cleanup on unmount
    return () => {
      if (newSocket) {
        newSocket.disconnect()
        socketRef.current = null
      }
    }
  }, [autoConnect, reconnection, reconnectionDelay, reconnectionAttempts, session])

  // Socket methods
  const joinUser = (userData: { userId: string, name: string, avatar?: string }) => {
    if (socket?.connected) {
      socket.emit('user:join', userData)
    }
  }

  const joinConversation = (conversationId: string) => {
    if (socket?.connected) {
      socket.emit('conversation:join', conversationId)
    }
  }

  const leaveConversation = (conversationId: string) => {
    if (socket?.connected) {
      socket.emit('conversation:leave', conversationId)
    }
  }

  const sendMessage = (data: { conversationId: string, message: any, senderId: string }) => {
    if (socket?.connected) {
      socket.emit('message:send', data)
    }
  }

  const startTyping = (data: { conversationId: string, user: any }) => {
    if (socket?.connected) {
      socket.emit('typing:start', data)
    }
  }

  const stopTyping = (data: { conversationId: string, user: any }) => {
    if (socket?.connected) {
      socket.emit('typing:stop', data)
    }
  }

  const markMessageAsRead = (data: { conversationId: string, userId: string, messageId: string }) => {
    if (socket?.connected) {
      socket.emit('message:read', data)
    }
  }

  const updateConversation = (data: { conversationId: string, update: any }) => {
    if (socket?.connected) {
      socket.emit('conversation:update', data)
    }
  }

  // Event listeners
  const onNewMessage = (callback: (data: { conversationId: string, message: any, senderId: string }) => void) => {
    if (socket) {
      socket.on('message:new', callback)
      return () => socket.off('message:new', callback)
    }
  }

  const onTypingIndicator = (callback: (data: { conversationId: string, user: any, isTyping: boolean }) => void) => {
    if (socket) {
      socket.on('typing:indicator', callback)
      return () => socket.off('typing:indicator', callback)
    }
  }

  const onMessageRead = (callback: (data: { conversationId: string, userId: string, messageId: string }) => void) => {
    if (socket) {
      socket.on('message:read', callback)
      return () => socket.off('message:read', callback)
    }
  }

  const onConversationUpdated = (callback: (data: { conversationId: string, update: any }) => void) => {
    if (socket) {
      socket.on('conversation:updated', callback)
      return () => socket.off('conversation:updated', callback)
    }
  }

  const onUserOnline = (callback: (user: OnlineUser & { onlineCount: number }) => void) => {
    if (socket) {
      socket.on('user:online', callback)
      return () => socket.off('user:online', callback)
    }
  }

  const onUserOffline = (callback: (user: { userId: string, name: string, onlineCount: number }) => void) => {
    if (socket) {
      socket.on('user:offline', callback)
      return () => socket.off('user:offline', callback)
    }
  }

  return {
    socket,
    isConnected,
    onlineUsers,
    connectionError,
    // Methods
    joinUser,
    joinConversation,
    leaveConversation,
    sendMessage,
    startTyping,
    stopTyping,
    markMessageAsRead,
    updateConversation,
    // Event listeners
    onNewMessage,
    onTypingIndicator,
    onMessageRead,
    onConversationUpdated,
    onUserOnline,
    onUserOffline,
    // Raw socket access
    on: (event: string, callback: (...args: any[]) => void) => {
      if (socket) {
        socket.on(event, callback)
        return () => socket.off(event, callback)
      }
    },
    emit: (event: string, ...args: any[]) => {
      if (socket?.connected) {
        socket.emit(event, ...args)
      }
    }
  }
}

export default useSocket