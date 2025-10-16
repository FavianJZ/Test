import { Server as NetServer } from 'http'
import { NextApiRequest, NextApiResponse } from 'next'
import { Server as ServerIO } from 'socket.io'

export const config = {
  api: {
    bodyParser: false
  }
}

const SocketHandler = (req: NextApiRequest, res: NextApiResponse & { socket: any }) => {
  if (res.socket.server.io) {
    console.log('Socket is already running')
  } else {
    console.log('Socket is initializing')
    const httpServer: NetServer = res.socket.server as any
    const io = new ServerIO(httpServer, {
      path: '/api/socket/io',
      addTrailingSlash: false,
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      }
    })

    // Store online users
    const onlineUsers = new Map<string, { socketId: string, userId: string, name: string }>()

    io.on('connection', (socket) => {
      console.log('Client connected:', socket.id)

      // User joins the chat
      socket.on('user:join', (userData: { userId: string, name: string, avatar?: string }) => {
        const { userId, name } = userData

        // Store user info
        onlineUsers.set(userId, {
          socketId: socket.id,
          userId,
          name
        })

        // Join user to their personal room for private messages
        socket.join(`user:${userId}`)

        // Broadcast online status to all connected clients
        socket.broadcast.emit('user:online', {
          userId,
          name,
          onlineCount: onlineUsers.size
        })

        // Send current online users list to the newly connected user
        const currentOnlineUsers = Array.from(onlineUsers.values())
        socket.emit('users:online', currentOnlineUsers)

        console.log(`User ${name} (${userId}) is now online. Total online: ${onlineUsers.size}`)
      })

      // Join conversation room
      socket.on('conversation:join', (conversationId: string) => {
        socket.join(conversationId)
        console.log(`Socket ${socket.id} joined conversation ${conversationId}`)
      })

      // Leave conversation room
      socket.on('conversation:leave', (conversationId: string) => {
        socket.leave(conversationId)
        console.log(`Socket ${socket.id} left conversation ${conversationId}`)
      })

      // Handle new message
      socket.on('message:send', (data) => {
        const { conversationId, message, senderId } = data

        // Broadcast to all users in the conversation except sender
        socket.to(conversationId).emit('message:new', {
          conversationId,
          message,
          senderId
        })

        console.log(`New message in conversation ${conversationId} from ${senderId}`)
      })

      // Handle typing indicator
      socket.on('typing:start', (data) => {
        const { conversationId, user } = data

        // Broadcast to all users in the conversation except sender
        socket.to(conversationId).emit('typing:indicator', {
          conversationId,
          user,
          isTyping: true
        })
      })

      socket.on('typing:stop', (data) => {
        const { conversationId, user } = data

        // Broadcast to all users in the conversation except sender
        socket.to(conversationId).emit('typing:indicator', {
          conversationId,
          user,
          isTyping: false
        })
      })

      // Handle message read status
      socket.on('message:read', (data) => {
        const { conversationId, userId, messageId } = data

        // Notify other participants in the conversation
        socket.to(conversationId).emit('message:read', {
          conversationId,
          userId,
          messageId
        })
      })

      // Handle conversation updates (e.g., new participant added)
      socket.on('conversation:update', (data) => {
        const { conversationId, update } = data

        // Broadcast to all users in the conversation
        io.to(conversationId).emit('conversation:updated', {
          conversationId,
          update
        })
      })

      // Handle disconnect
      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id)

        // Find and remove user from online users
        let disconnectedUser = null
        for (const [userId, userInfo] of onlineUsers.entries()) {
          if (userInfo.socketId === socket.id) {
            disconnectedUser = userInfo
            onlineUsers.delete(userId)
            break
          }
        }

        if (disconnectedUser) {
          // Broadcast user offline status
          socket.broadcast.emit('user:offline', {
            userId: disconnectedUser.userId,
            name: disconnectedUser.name,
            onlineCount: onlineUsers.size
          })

          console.log(`User ${disconnectedUser.name} (${disconnectedUser.userId}) is now offline. Total online: ${onlineUsers.size}`)
        }
      })

      // Handle errors
      socket.on('error', (error) => {
        console.error('Socket error:', error)
      })
    })

    res.socket.server.io = io
  }
  res.end()
}

export default SocketHandler