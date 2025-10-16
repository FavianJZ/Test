import { NextRequest, NextResponse } from "next/server";
import * as mysql from "mysql2/promise";

const dbConfig = {
  host: "localhost",
  user: "root",
  password: "",
  database: "hikariCha_db",
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
  const messageId = params.id;

  try {
    const body = await request.json();
    const { userId, emoji } = body;

    if (!userId || !emoji) {
      return NextResponse.json(
        { success: false, error: "User ID and emoji are required" },
        { status: 400 }
      );
    }

    connection = await pool.getConnection();

    // Check if message exists and user is participant in the conversation
    const [messageCheck] = await connection.execute(`
      SELECT cm.conversation_id
      FROM chat_messages cm
      JOIN chat_participants cp ON cm.conversation_id = cp.conversation_id
      WHERE cm.id = ? AND cp.user_id = ? AND cp.is_active = true
      LIMIT 1
    `, [messageId, userId]);

    if ((messageCheck as any[]).length === 0) {
      return NextResponse.json(
        { success: false, error: "Message not found or access denied" },
        { status: 404 }
      );
    }

    // Check if reaction already exists
    const [existingReaction] = await connection.execute(`
      SELECT id FROM chat_message_reactions
      WHERE message_id = ? AND user_id = ?
    `, [messageId, userId]);

    let action: 'added' | 'removed';

    if ((existingReaction as any[]).length > 0) {
      // Remove existing reaction
      await connection.execute(`
        DELETE FROM chat_message_reactions
        WHERE message_id = ? AND user_id = ?
      `, [messageId, userId]);
      action = 'removed';
    } else {
      // Add new reaction
      await connection.execute(`
        INSERT INTO chat_message_reactions (message_id, user_id, reaction)
        VALUES (?, ?, ?)
      `, [messageId, userId, emoji]);
      action = 'added';
    }

    // Get updated reactions for the message
    const [reactions] = await connection.execute(`
      SELECT
        cmr.reaction,
        COUNT(*) as count,
        GROUP_CONCAT(u.name SEPARATOR ',') as userNames
      FROM chat_message_reactions cmr
      JOIN user u ON cmr.user_id = u.id
      WHERE cmr.message_id = ?
      GROUP BY cmr.reaction
      ORDER BY count DESC
    `, [messageId]);

    const reactionData = (reactions as any[]).map(r => ({
      emoji: r.reaction,
      count: parseInt(r.count),
      users: r.userNames ? r.userNames.split(',') : []
    }));

    return NextResponse.json({
      success: true,
      data: {
        messageId,
        action,
        reactions: reactionData,
        userReaction: action === 'added' ? emoji : null
      }
    });

  } catch (error) {
    console.error('Error handling message reaction:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to handle message reaction' },
      { status: 500 }
    );
  } finally {
    if (connection) {
      connection.release();
    }
  }
}

// Get all reactions for a message
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  let connection;
  const messageId = params.id;

  try {
    connection = await pool.getConnection();

    const [reactions] = await connection.execute(`
      SELECT
        cmr.reaction,
        COUNT(*) as count,
        GROUP_CONCAT(
          CONCAT(u.id, ':', u.name, ':', u.image)
          SEPARATOR '|'
        ) as users
      FROM chat_message_reactions cmr
      JOIN user u ON cmr.user_id = u.id
      WHERE cmr.message_id = ?
      GROUP BY cmr.reaction
      ORDER BY count DESC, cmr.created_at ASC
    `, [messageId]);

    const reactionData = (reactions as any[]).map(r => {
      const users = r.users ? r.users.split('|').map((userStr: string) => {
        const [id, name, image] = userStr.split(':');
        return { id, name, image };
      }) : [];

      return {
        emoji: r.reaction,
        count: parseInt(r.count),
        users
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        messageId,
        reactions: reactionData
      }
    });

  } catch (error) {
    console.error('Error fetching message reactions:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch message reactions' },
      { status: 500 }
    );
  } finally {
    if (connection) {
      connection.release();
    }
  }
}

// Delete a specific reaction
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  let connection;
  const messageId = params.id;

  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get("userId");
    const emoji = url.searchParams.get("emoji");

    if (!userId || !emoji) {
      return NextResponse.json(
        { success: false, error: "User ID and emoji are required" },
        { status: 400 }
      );
    }

    connection = await pool.getConnection();

    const result = await connection.execute(`
      DELETE FROM chat_message_reactions
      WHERE message_id = ? AND user_id = ? AND reaction = ?
    `, [messageId, userId, emoji]);

    if ((result as any).affectedRows === 0) {
      return NextResponse.json(
        { success: false, error: "Reaction not found" },
        { status: 404 }
      );
    }

    // Get updated reactions for the message
    const [reactions] = await connection.execute(`
      SELECT
        cmr.reaction,
        COUNT(*) as count,
        GROUP_CONCAT(u.name SEPARATOR ',') as userNames
      FROM chat_message_reactions cmr
      JOIN user u ON cmr.user_id = u.id
      WHERE cmr.message_id = ?
      GROUP BY cmr.reaction
      ORDER BY count DESC
    `, [messageId]);

    const reactionData = (reactions as any[]).map(r => ({
      emoji: r.reaction,
      count: parseInt(r.count),
      users: r.userNames ? r.userNames.split(',') : []
    }));

    return NextResponse.json({
      success: true,
      data: {
        messageId,
        action: 'removed',
        reactions: reactionData,
        removedReaction: emoji
      }
    });

  } catch (error) {
    console.error('Error deleting message reaction:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete message reaction' },
      { status: 500 }
    );
  } finally {
    if (connection) {
      connection.release();
    }
  }
}