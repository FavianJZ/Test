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
  const userId = searchParams.get('userId')
  const type = searchParams.get('type') // 'DIRECT' or 'GROUP'

  if (!userId) {
    return NextResponse.json(
      { success: false, error: 'User ID is required' },
      { status: 400 }
    )
  }

  try {
    connection = await pool.getConnection()

    let query = `
      SELECT
        c.*,
        cp.role as userRole,
        cp.last_read_at as lastReadAt,
        cp.is_muted as isMuted,
        (
          SELECT COUNT(*)
          FROM chat_messages cm
          WHERE cm.conversation_id = c.id
          AND cm.created_at > COALESCE(cp.last_read_at, '1970-01-01')
          AND cm.sender_id != ?
        ) as unreadCount
      FROM chat_conversations c
      JOIN chat_participants cp ON c.id = cp.conversation_id
      WHERE cp.user_id = ? AND cp.is_active = true
    `

    const params = [userId, userId]

    if (type) {
      query += ' AND c.type = ?'
      params.push(type)
    }

    query += ' ORDER BY c.last_message_at DESC, c.updated_at DESC'

    const [conversations] = await connection.execute(query, params)

    // Get additional data for each conversation
    const formattedConversations = []
    for (const conv of conversations as any[]) {
      let otherUser = null
      let participants = []

      // Get other user for direct conversations
      if (conv.type === 'DIRECT') {
        const [otherUserResult] = await connection.execute(`
          SELECT u.id, u.name, u.image, u.selectedBorder
          FROM chat_participants cp
          JOIN user u ON cp.user_id = u.id
          WHERE cp.conversation_id = ? AND cp.user_id != ?
          LIMIT 1
        `, [conv.id, userId])

        if ((otherUserResult as any[]).length > 0) {
          otherUser = (otherUserResult as any[])[0]
        }
      }

      // Get all participants
      const [participantsResult] = await connection.execute(`
        SELECT u.id, u.name, u.image, u.selectedBorder, cp.role
        FROM chat_participants cp
        JOIN user u ON cp.user_id = u.id
        WHERE cp.conversation_id = ? AND cp.is_active = true
      `, [conv.id])

      participants = participantsResult as any[]

      formattedConversations.push({
        ...conv,
        otherUser,
        participants
      })
    }

    return NextResponse.json({
      success: true,
      data: formattedConversations
    })

  } catch (error) {
    console.error('Error fetching conversations:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch conversations' },
      { status: 500 }
    )
  } finally {
    if (connection) {
      connection.release() // Release back to pool instead of closing
    }
  }
}

export async function POST(request: NextRequest) {
  let connection
  try {
    const body = await request.json()
    const { type, name, participantIds, createdBy } = body

    if (!type || !participantIds || !Array.isArray(participantIds) || !createdBy) {
      return NextResponse.json(
        { success: false, error: 'Type, participant IDs, and creator are required' },
        { status: 400 }
      )
    }

    if (type === 'GROUP' && !name) {
      return NextResponse.json(
        { success: false, error: 'Group name is required for group conversations' },
        { status: 400 }
      )
    }

    if (type === 'DIRECT' && participantIds.length !== 1) {
      return NextResponse.json(
        { success: false, error: 'Direct conversation must have exactly one participant' },
        { status: 400 }
      )
    }

    connection = await pool.getConnection()

    // Check if direct conversation already exists
    if (type === 'DIRECT') {
      const [existingConv] = await connection.execute(`
        SELECT c.id
        FROM chat_conversations c
        JOIN chat_participants cp1 ON c.id = cp1.conversation_id AND cp1.user_id = ?
        JOIN chat_participants cp2 ON c.id = cp2.conversation_id AND cp2.user_id = ?
        WHERE c.type = 'DIRECT' AND c.is_active = true
      `, [createdBy, participantIds[0]])

      if ((existingConv as any[]).length > 0) {
        return NextResponse.json({
          success: true,
          data: { conversationId: (existingConv as any[])[0].id, existed: true }
        })
      }
    }

    const conversationId = type === 'DIRECT'
      ? `conv_direct_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      : `conv_group_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // Start transaction
    await connection.beginTransaction()

    // Create conversation
    await connection.execute(`
      INSERT INTO chat_conversations (id, type, name, created_by)
      VALUES (?, ?, ?, ?)
    `, [conversationId, type, name || null, createdBy])

    // Add participants (only if they exist in user table)
    const allParticipants = [createdBy, ...participantIds]
    for (const participantId of allParticipants) {
      // Verify user exists before adding to conversation
      const [userCheck] = await connection.execute(`
        SELECT id FROM user WHERE id = ? LIMIT 1
      `, [participantId])

      if ((userCheck as any[]).length > 0) {
        await connection.execute(`
          INSERT INTO chat_participants (conversation_id, user_id, role)
          VALUES (?, ?, ?)
        `, [conversationId, participantId, participantId === createdBy ? 'ADMIN' : 'MEMBER'])
      } else {
        console.warn(`Skipping invalid user ID: ${participantId}`)
      }
    }

    await connection.commit()

    return NextResponse.json({
      success: true,
      data: {
        conversationId,
        type,
        name,
        participants: allParticipants,
        existed: false
      }
    })

  } catch (error) {
    console.error('Error creating conversation:', error)
    if (connection) {
      await connection.rollback()
    }
    return NextResponse.json(
      { success: false, error: 'Failed to create conversation' },
      { status: 500 }
    )
  } finally {
    if (connection) {
      connection.release() // Release back to pool instead of closing
    }
  }
}