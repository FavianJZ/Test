import { NextRequest, NextResponse } from 'next/server'
import * as mysql from 'mysql2/promise'

const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'hikariCha_db',
  connectionLimit: 10,
  acquireTimeout: 60000,
  timeout: 60000,
}

// Create connection pool
const pool = mysql.createPool(dbConfig)

export async function GET(request: NextRequest) {
  let connection
  const { searchParams } = new URL(request.url)
  const conversationId = searchParams.get('conversationId')
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '50')
  const before = searchParams.get('before') // Message ID for pagination

  if (!conversationId) {
    return NextResponse.json(
      { success: false, error: 'Conversation ID is required' },
      { status: 400 }
    )
  }

  try {
    connection = await pool.getConnection()

    let query = `
      SELECT
        cm.*,
        u.name as senderName,
        u.image as senderImage,
        u.selectedBorder as senderBorder
      FROM chat_messages cm
      JOIN user u ON cm.sender_id = u.id
      WHERE cm.conversation_id = ? AND cm.is_deleted = false
    `

    const params = [conversationId]

    if (before) {
      query += ' AND cm.created_at < (SELECT created_at FROM chat_messages WHERE id = ? LIMIT 1)'
      params.push(before)
    }

    query += ' ORDER BY cm.created_at DESC LIMIT ? OFFSET ?'
    params.push(limit, (page - 1) * limit)

    const [messages] = await connection.execute(query, params)

    // Get additional data for each message
    const formattedMessages = []
    const messageArray = messages as any[]

    for (const msg of messageArray.reverse()) {
      let replyToUser = null
      let reactions = []

      // Get reply to user info
      if (msg.reply_to) {
        const [replyToResult] = await connection.execute(`
          SELECT id, name, image, selectedBorder
          FROM user
          WHERE id = ?
          LIMIT 1
        `, [msg.reply_to])

        if ((replyToResult as any[]).length > 0) {
          replyToUser = (replyToResult as any[])[0]
        }
      }

      // Get reactions for this message
      const [reactionsResult] = await connection.execute(`
        SELECT cmr.id, cmr.reaction, u.id as userId, u.name, u.image
        FROM chat_message_reactions cmr
        JOIN user u ON cmr.user_id = u.id
        WHERE cmr.message_id = ?
      `, [msg.id])

      reactions = reactionsResult as any[]

      formattedMessages.push({
        ...msg,
        replyToUser,
        reactions
      })
    }

    return NextResponse.json({
      success: true,
      data: formattedMessages,
      meta: {
        page,
        limit,
        hasMore: formattedMessages.length === limit
      }
    })

  } catch (error) {
    console.error('Error fetching messages:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch messages' },
      { status: 500 }
    )
  } finally {
    if (connection) {
      connection.release()
    }
  }
}

export async function POST(request: NextRequest) {
  let connection
  try {
    const body = await request.json()
    const {
      conversationId,
      senderId,
      content,
      type = 'TEXT',
      replyTo,
      fileUrl,
      fileName,
      fileSize,
      fileType
    } = body

    if (!senderId) {
      return NextResponse.json(
        { success: false, error: 'Sender ID is required' },
        { status: 400 }
      )
    }

    if (!conversationId || !content) {
      return NextResponse.json(
        { success: false, error: 'Conversation ID and content are required' },
        { status: 400 }
      )
    }

    connection = await pool.getConnection()

    // Verify user is participant in conversation
    const [participantCheck] = await connection.execute(`
      SELECT id FROM chat_participants
      WHERE conversation_id = ? AND user_id = ? AND is_active = true
      LIMIT 1
    `, [conversationId, senderId])

    if ((participantCheck as any[]).length === 0) {
      return NextResponse.json(
        { success: false, error: 'User is not a participant in this conversation' },
        { status: 403 }
      )
    }

    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // Start transaction
    await connection.beginTransaction()

    // Insert message
    await connection.execute(`
      INSERT INTO chat_messages (
        id, conversation_id, sender_id, content, type, reply_to,
        file_url, file_name, file_size, file_type
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      messageId, conversationId, senderId, content, type,
      replyTo || null, fileUrl || null, fileName || null,
      fileSize || null, fileType || null
    ])

    // Update conversation's last message info
    await connection.execute(`
      UPDATE chat_conversations
      SET last_message_at = NOW(),
          last_message_content = ?,
          updated_at = NOW()
      WHERE id = ?
    `, [content, conversationId])

    await connection.commit()

    // Get the created message with sender info
    const [newMessage] = await connection.execute(`
      SELECT
        cm.*,
        u.name as senderName,
        u.image as senderImage,
        u.selectedBorder as senderBorder
      FROM chat_messages cm
      JOIN user u ON cm.sender_id = u.id
      WHERE cm.id = ?
    `, [messageId])

    const messageData = (newMessage as any[])[0]

    return NextResponse.json({
      success: true,
      data: {
        id: messageData.id,
        conversationId: messageData.conversation_id,
        senderId: messageData.sender_id,
        content: messageData.content,
        type: messageData.type,
        fileUrl: messageData.file_url,
        fileName: messageData.file_name,
        fileSize: messageData.file_size,
        fileType: messageData.file_type,
        replyTo: messageData.reply_to,
        isEdited: messageData.is_edited,
        createdAt: messageData.created_at,
        updatedAt: messageData.updated_at,
        sender: {
          id: senderId,
          name: messageData.senderName,
          image: messageData.senderImage,
          border: messageData.senderBorder
        }
      }
    })

  } catch (error) {
    console.error('Error sending message:', error)
    if (connection) {
      await connection.rollback()
    }
    return NextResponse.json(
      { success: false, error: 'Failed to send message' },
      { status: 500 }
    )
  } finally {
    if (connection) {
      connection.release()
    }
  }
}

export async function PUT(request: NextRequest) {
  let connection
  try {
    const body = await request.json()
    const { messageId, userId, content } = body

    if (!messageId || !userId || !content) {
      return NextResponse.json(
        { success: false, error: 'Message ID, user ID, and content are required' },
        { status: 400 }
      )
    }

    connection = await pool.getConnection()

    // Verify user is the sender of the message
    const [messageCheck] = await connection.execute(`
      SELECT sender_id FROM chat_messages
      WHERE id = ? AND is_deleted = false
      LIMIT 1
    `, [messageId])

    if ((messageCheck as any[]).length === 0) {
      return NextResponse.json(
        { success: false, error: 'Message not found' },
        { status: 404 }
      )
    }

    if ((messageCheck as any[])[0].sender_id !== userId) {
      return NextResponse.json(
        { success: false, error: 'Only message sender can edit the message' },
        { status: 403 }
      )
    }

    // Update message
    await connection.execute(`
      UPDATE chat_messages
      SET content = ?,
          is_edited = true,
          edited_at = NOW(),
          updated_at = NOW()
      WHERE id = ?
    `, [content, messageId])

    return NextResponse.json({
      success: true,
      data: { messageId, content, isEdited: true }
    })

  } catch (error) {
    console.error('Error editing message:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to edit message' },
      { status: 500 }
    )
  } finally {
    if (connection) {
      connection.release()
    }
  }
}

export async function DELETE(request: NextRequest) {
  let connection
  try {
    const { searchParams } = new URL(request.url)
    const messageId = searchParams.get('messageId')
    const userId = searchParams.get('userId')

    if (!messageId || !userId) {
      return NextResponse.json(
        { success: false, error: 'Message ID and user ID are required' },
        { status: 400 }
      )
    }

    connection = await pool.getConnection()

    // Verify user is the sender of the message
    const [messageCheck] = await connection.execute(`
      SELECT sender_id FROM chat_messages
      WHERE id = ? AND is_deleted = false
      LIMIT 1
    `, [messageId])

    if ((messageCheck as any[]).length === 0) {
      return NextResponse.json(
        { success: false, error: 'Message not found' },
        { status: 404 }
      )
    }

    if ((messageCheck as any[])[0].sender_id !== userId) {
      return NextResponse.json(
        { success: false, error: 'Only message sender can delete the message' },
        { status: 403 }
      )
    }

    // Soft delete message
    await connection.execute(`
      UPDATE chat_messages
      SET is_deleted = true,
          deleted_at = NOW(),
          updated_at = NOW()
      WHERE id = ?
    `, [messageId])

    return NextResponse.json({
      success: true,
      data: { messageId, isDeleted: true }
    })

  } catch (error) {
    console.error('Error deleting message:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete message' },
      { status: 500 }
    )
  } finally {
    if (connection) {
      connection.release()
    }
  }
}