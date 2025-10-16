import { Server as NetServer } from "http";
import { NextApiRequest, NextApiResponse } from "next";
import { Server as ServerIO } from "socket.io";
import { NextApiResponseWithSocket } from "@/types/socket";
import jwt from 'jsonwebtoken';
import * as mysql from 'mysql2/promise';

export const config = {
  api: {
    bodyParser: false,
  },
};

const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'hikariCha_db'
};

// Socket.io server setup
const SocketHandler = (req: NextApiRequest, res: NextApiResponseWithSocket) => {
  if (res.socket.server.io) {
    console.log('Socket.io server already running');
    res.end();
    return;
  }

  console.log('Setting up Socket.io server...');

  const httpServer: NetServer = res.socket.server as any;
  const io = new ServerIO(httpServer, {
    path: '/api/socket/io',
    addTrailingSlash: false,
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
      credentials: true
    }
  });

  // Online users tracking
  const onlineUsers = new Map<string, {
    socketId: string;
    userId: string;
    name: string;
    avatar?: string;
    joinedAt: Date;
  }>();

  // User rooms mapping
  const userRooms = new Map<string, Set<string>>(); // userId -> Set of conversationIds

  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const { token, userId, name } = socket.handshake.auth;

      // For NextAuth compatibility, we accept either a JWT token or direct user info
      if (token && token !== userId) {
        // If it's a proper JWT token (not just the user ID), verify it
        try {
          const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET || 'fallback-secret') as any;
          socket.userId = decoded.sub || decoded.userId;
          socket.userName = decoded.name || name || 'User';
        } catch (jwtError) {
          console.log('JWT verification failed, falling back to user ID');
          // Fallback to direct user ID authentication
          socket.userId = userId;
          socket.userName = name || 'User';
        }
      } else {
        // Direct user ID authentication (for NextAuth sessions)
        socket.userId = userId;
        socket.userName = name || 'User';
      }

      if (!socket.userId) {
        return next(new Error('User ID is required'));
      }

      // Verify user exists in database
      const connection = await mysql.createConnection(dbConfig);
      const [users] = await connection.execute(
        'SELECT id, name FROM user WHERE id = ?',
        [socket.userId]
      );
      await connection.end();

      if ((users as any[]).length === 0) {
        return next(new Error('User not found'));
      }

      next();
    } catch (error) {
      console.error('Socket authentication error:', error);
      next(new Error('Authentication failed'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.userId} (${socket.id})`);

    // Join user to their personal room and track as online
    socket.join(`user:${socket.userId}`);

    onlineUsers.set(socket.userId, {
      socketId: socket.id,
      userId: socket.userId,
      name: socket.userName,
      avatar: socket.handshake.auth.avatar,
      joinedAt: new Date()
    });

    // Initialize user rooms
    userRooms.set(socket.userId, new Set());

    // Broadcast online users count
    io.emit('users:online_count', onlineUsers.size);
    io.emit('users:online', Array.from(onlineUsers.values()));

    // Handle user joining conversation
    socket.on('conversation:join', async (conversationId: string) => {
      try {
        // Verify user is participant in this conversation
        const connection = await mysql.createConnection(dbConfig);

        const [participants] = await connection.execute(`
          SELECT user_id FROM chat_participants
          WHERE conversation_id = ? AND user_id = ? AND is_active = true
        `, [conversationId, socket.userId]);

        if ((participants as any[]).length === 0) {
          socket.emit('error', { message: 'Not authorized to join this conversation' });
          await connection.end();
          return;
        }

        // Join conversation room
        socket.join(conversationId);

        // Track user's joined rooms
        const userRoomSet = userRooms.get(socket.userId);
        if (userRoomSet) {
          userRoomSet.add(conversationId);
        }

        // Notify others in conversation that user is online
        socket.to(conversationId).emit('user:joined_conversation', {
          userId: socket.userId,
          userName: socket.userName,
          conversationId
        });

        // Mark messages as read when joining
        await connection.execute(`
          UPDATE chat_participants
          SET last_read_at = NOW()
          WHERE conversation_id = ? AND user_id = ?
        `, [conversationId, socket.userId]);

        await connection.end();

        console.log(`User ${socket.userId} joined conversation ${conversationId}`);
      } catch (error) {
        console.error('Error joining conversation:', error);
        socket.emit('error', { message: 'Failed to join conversation' });
      }
    });

    // Handle leaving conversation
    socket.on('conversation:leave', (conversationId: string) => {
      socket.leave(conversationId);

      const userRoomSet = userRooms.get(socket.userId);
      if (userRoomSet) {
        userRoomSet.delete(conversationId);
      }

      socket.to(conversationId).emit('user:left_conversation', {
        userId: socket.userId,
        userName: socket.userName,
        conversationId
      });

      console.log(`User ${socket.userId} left conversation ${conversationId}`);
    });

    // Handle sending messages
    socket.on('message:send', async (data: {
      conversationId: string;
      message: any;
      senderId: string;
    }) => {
      try {
        const connection = await mysql.createConnection(dbConfig);

        // Verify user is participant in conversation
        const [participants] = await connection.execute(`
          SELECT user_id FROM chat_participants
          WHERE conversation_id = ? AND user_id = ? AND is_active = true
        `, [data.conversationId, socket.userId]);

        if ((participants as any[]).length === 0) {
          socket.emit('error', { message: 'Not authorized to send messages in this conversation' });
          await connection.end();
          return;
        }

        // Verify sender matches authenticated user
        if (data.senderId !== socket.userId) {
          socket.emit('error', { message: 'Sender ID does not match authenticated user' });
          await connection.end();
          return;
        }

        // Insert message into database
        const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        await connection.execute(`
          INSERT INTO chat_messages (
            id, conversation_id, sender_id, content, type, reply_to,
            file_url, file_name, file_size, file_type
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          messageId,
          data.conversationId,
          data.senderId,
          data.message.content,
          data.message.type || 'TEXT',
          data.message.replyTo || null,
          data.message.fileUrl || null,
          data.message.fileName || null,
          data.message.fileSize || null,
          data.message.fileType || null
        ]);

        // Update conversation's last message info
        await connection.execute(`
          UPDATE chat_conversations
          SET last_message_at = NOW(),
              last_message_content = ?,
              last_sender_id = ?,
              updated_at = NOW()
          WHERE id = ?
        `, [data.message.content, data.senderId, data.conversationId]);

        // Get complete message data with sender info
        const [messageResult] = await connection.execute(`
          SELECT
            cm.*,
            u.name as senderName,
            u.image as senderImage,
            u.selectedBorder as senderBorder
          FROM chat_messages cm
          JOIN user u ON cm.sender_id = u.id
          WHERE cm.id = ?
        `, [messageId]);

        const messageData = (messageResult as any[])[0];

        // Broadcast to all users in conversation
        const broadcastData = {
          conversationId: data.conversationId,
          message: {
            id: messageData.id,
            conversationId: messageData.conversation_id,
            senderId: messageData.sender_id,
            content: messageData.content,
            type: messageData.type,
            replyTo: messageData.reply_to,
            fileUrl: messageData.file_url,
            fileName: messageData.file_name,
            fileSize: messageData.file_size,
            fileType: messageData.file_type,
            isEdited: messageData.is_edited,
            createdAt: messageData.created_at,
            updatedAt: messageData.updated_at,
            sender: {
              id: messageData.sender_id,
              name: messageData.senderName,
              image: messageData.senderImage,
              border: messageData.senderBorder
            }
          },
          senderId: data.senderId
        };

        io.to(data.conversationId).emit('message:new', broadcastData);

        await connection.end();
        console.log(`Message sent in conversation ${data.conversationId} by ${socket.userId}`);
      } catch (error) {
        console.error('Error sending message:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Handle typing indicators
    socket.on('typing:start', (data: {
      conversationId: string;
      user: any;
    }) => {
      socket.to(data.conversationId).emit('typing:indicator', {
        conversationId: data.conversationId,
        user: data.user,
        isTyping: true
      });
    });

    socket.on('typing:stop', (data: {
      conversationId: string;
      user: any;
    }) => {
      socket.to(data.conversationId).emit('typing:indicator', {
        conversationId: data.conversationId,
        user: data.user,
        isTyping: false
      });
    });

    // Handle message read receipts
    socket.on('message:read', async (data: {
      conversationId: string;
      userId: string;
      messageId: string;
    }) => {
      try {
        const connection = await mysql.createConnection(dbConfig);

        // Update user's last read timestamp
        await connection.execute(`
          UPDATE chat_participants
          SET last_read_at = NOW()
          WHERE conversation_id = ? AND user_id = ?
        `, [data.conversationId, data.userId]);

        // Notify other participants
        socket.to(data.conversationId).emit('message:read', {
          conversationId: data.conversationId,
          userId: data.userId,
          messageId: data.messageId
        });

        await connection.end();
      } catch (error) {
        console.error('Error marking message as read:', error);
      }
    });

    // Handle message reactions
    socket.on('message:reaction', async (data: {
      messageId: string;
      emoji: string;
      conversationId: string;
    }) => {
      try {
        const connection = await mysql.createConnection(dbConfig);

        // Check if reaction already exists
        const [existingReaction] = await connection.execute(`
          SELECT id FROM chat_message_reactions
          WHERE message_id = ? AND user_id = ?
        `, [data.messageId, socket.userId]);

        if ((existingReaction as any[]).length > 0) {
          // Remove existing reaction
          await connection.execute(`
            DELETE FROM chat_message_reactions
            WHERE message_id = ? AND user_id = ?
          `, [data.messageId, socket.userId]);
        } else {
          // Add new reaction
          await connection.execute(`
            INSERT INTO chat_message_reactions (message_id, user_id, reaction)
            VALUES (?, ?, ?)
          `, [data.messageId, socket.userId, data.emoji]);
        }

        // Get updated reactions for the message
        const [reactions] = await connection.execute(`
          SELECT
            cmr.reaction,
            COUNT(*) as count,
            GROUP_CONCAT(u.name) as users
          FROM chat_message_reactions cmr
          JOIN user u ON cmr.user_id = u.id
          WHERE cmr.message_id = ?
          GROUP BY cmr.reaction
        `, [data.messageId]);

        const reactionData = (reactions as any[]).map(r => ({
          emoji: r.reaction,
          count: parseInt(r.count),
          users: r.users.split(',')
        }));

        // Broadcast updated reactions
        io.to(data.conversationId).emit('message:reactions_updated', {
          messageId: data.messageId,
          reactions: reactionData
        });

        await connection.end();
      } catch (error) {
        console.error('Error handling message reaction:', error);
      }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.userId}`);

      // Remove from online users
      onlineUsers.delete(socket.userId);
      userRooms.delete(socket.userId);

      // Broadcast updated online users
      io.emit('users:online_count', onlineUsers.size);
      io.emit('users:offline', {
        userId: socket.userId,
        userName: socket.userName,
        onlineCount: onlineUsers.size
      });

      // Notify conversations that user left
      const userRoomSet = userRooms.get(socket.userId) || new Set();
      userRoomSet.forEach(conversationId => {
        socket.to(conversationId).emit('user:left_conversation', {
          userId: socket.userId,
          userName: socket.userName,
          conversationId
        });
      });
    });

    // Error handling
    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
  });

  res.socket.server.io = io;
  res.end();
};

export default SocketHandler;