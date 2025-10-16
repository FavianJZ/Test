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

export async function POST(request: NextRequest) {
  let connection
  try {
    const body = await request.json()
    const { conversationId, userId, isTyping = true } = body

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      )
    }

    connection = await pool.getConnection()

    // Verify user is participant in conversation
    const [participantCheck] = await connection.execute(`
      SELECT id FROM chat_participants
      WHERE conversation_id = ? AND user_id = ? AND is_active = true
      LIMIT 1
    `, [conversationId, userId])

    if ((participantCheck as any[]).length === 0) {
      return NextResponse.json(
        { success: false, error: 'User is not a participant in this conversation' },
        { status: 403 }
      )
    }

    // Update or insert typing indicator
    await connection.execute(`
      INSERT INTO chat_typing_indicators (conversation_id, user_id, is_typing)
      VALUES (?, ?, ?)
      ON DUPLICATE KEY UPDATE
        is_typing = ?,
        started_at = CASE WHEN ? THEN NOW() ELSE started_at END,
        updated_at = NOW()
    `, [conversationId, userId, isTyping, isTyping, isTyping])

    // Get all active typing indicators for this conversation (excluding the current user)
    const [typingUsers] = await connection.execute(`
      SELECT
        cti.user_id,
        u.name,
        u.image,
        cti.started_at
      FROM chat_typing_indicators cti
      JOIN user u ON cti.user_id = u.id
      WHERE cti.conversation_id = ?
        AND cti.is_typing = true
        AND cti.user_id != ?
        AND cti.updated_at >= DATE_SUB(NOW(), INTERVAL 5 SECOND)
      ORDER BY cti.updated_at DESC
    `, [conversationId, userId])

    return NextResponse.json({
      success: true,
      data: {
        conversationId,
        isTyping,
        typingUsers: typingUsers as any[]
      }
    })

  } catch (error) {
    console.error('Error updating typing indicator:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update typing indicator' },
      { status: 500 }
    )
  } finally {
    if (connection) {
      connection.release()
    }
  }
}

export async function GET(request: NextRequest) {
  let connection
  const { searchParams } = new URL(request.url)
  const conversationId = searchParams.get('conversationId')
  const currentUserId = searchParams.get('currentUserId')

  if (!conversationId) {
    return NextResponse.json(
      { success: false, error: 'Conversation ID is required' },
      { status: 400 }
    )
  }

  try {
    connection = await pool.getConnection()

    // Get active typing indicators for this conversation
    let query = `
      SELECT
        cti.user_id,
        u.name,
        u.image,
        u.selectedBorder as border,
        cti.started_at,
        cti.updated_at
      FROM chat_typing_indicators cti
      JOIN user u ON cti.user_id = u.id
      WHERE cti.conversation_id = ?
        AND cti.is_typing = true
        AND cti.updated_at >= DATE_SUB(NOW(), INTERVAL 5 SECOND)
    `

    const params = [conversationId]

    if (currentUserId) {
      query += ' AND cti.user_id != ?'
      params.push(currentUserId)
    }

    query += ' ORDER BY cti.updated_at DESC'

    const [typingUsers] = await connection.execute(query, params)

    return NextResponse.json({
      success: true,
      data: {
        conversationId,
        typingUsers: typingUsers as any[]
      }
    })

  } catch (error) {
    console.error('Error fetching typing indicators:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch typing indicators' },
      { status: 500 }
    )
  } finally {
    if (connection) {
      connection.release()
    }
  }
}

// Clean up old typing indicators (can be called by a cron job or cleanup function)
export async function DELETE(request: NextRequest) {
  let connection
  try {
    connection = await pool.getConnection()

    // Delete typing indicators older than 1 minute or that haven't been updated recently
    await connection.execute(`
      DELETE FROM chat_typing_indicators
      WHERE updated_at < DATE_SUB(NOW(), INTERVAL 1 MINUTE)
    `)

    return NextResponse.json({
      success: true,
      data: { message: 'Old typing indicators cleaned up' }
    })

  } catch (error) {
    console.error('Error cleaning up typing indicators:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to cleanup typing indicators' },
      { status: 500 }
    )
  } finally {
    if (connection) {
      connection.release()
    }
  }
}