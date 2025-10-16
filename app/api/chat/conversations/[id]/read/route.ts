import { NextRequest, NextResponse } from 'next/server';
import * as mysql from 'mysql2/promise';

const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'hikariCha_db',
  connectionLimit: 10,
  acquireTimeout: 60000,
  timeout: 60000,
};

// Create connection pool
const pool = mysql.createPool(dbConfig);

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  let connection;
  const conversationId = params.id;

  try {
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    connection = await pool.getConnection();

    // Update the last_read_at timestamp for the participant
    await connection.execute(`
      UPDATE chat_participants
      SET last_read_at = NOW()
      WHERE conversation_id = ? AND user_id = ?
    `, [conversationId, userId]);

    // Also update the conversation's updated_at timestamp
    await connection.execute(`
      UPDATE chat_conversations
      SET updated_at = NOW()
      WHERE id = ?
    `, [conversationId]);

    return NextResponse.json({
      success: true,
      message: 'Conversation marked as read'
    });

  } catch (error) {
    console.error('Error marking conversation as read:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to mark conversation as read' },
      { status: 500 }
    );
  } finally {
    if (connection) {
      connection.release();
    }
  }
}