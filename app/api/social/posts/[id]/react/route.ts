import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import * as mysql from 'mysql2/promise'

const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'hikariCha_db'
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const connection = await mysql.createConnection(dbConfig)

  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const postId = params.id
    const body = await request.json()
    const { reaction } = body

    if (!postId) {
      return NextResponse.json(
        { success: false, error: 'Post ID is required' },
        { status: 400 }
      )
    }

    const userId = session.user.id

    // Check if user already has a reaction
    const [existing] = await connection.execute(
      'SELECT reaction FROM post_reactions WHERE userId = ? AND postId = ?',
      [userId, postId]
    )

    const existingReaction = (existing as any[])[0]

    if (reaction) {
      // Add or update reaction
      if (existingReaction) {
        // Update existing reaction
        await connection.execute(
          'UPDATE post_reactions SET reaction = ?, updatedAt = NOW() WHERE userId = ? AND postId = ?',
          [reaction, userId, postId]
        )
      } else {
        // Add new reaction
        await connection.execute(
          'INSERT INTO post_reactions (userId, postId, reaction, createdAt, updatedAt) VALUES (?, ?, ?, NOW(), NOW())',
          [userId, postId, reaction]
        )
      }
    } else {
      // Remove reaction
      if (existingReaction) {
        await connection.execute(
          'DELETE FROM post_reactions WHERE userId = ? AND postId = ?',
          [userId, postId]
        )
      }
    }

    return NextResponse.json({
      success: true,
      data: { reaction: reaction || null },
      message: reaction ? 'Reaction added successfully' : 'Reaction removed successfully'
    })
  } catch (error) {
    console.error('Error handling reaction:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to handle reaction' },
      { status: 500 }
    )
  } finally {
    await connection.end()
  }
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const connection = await mysql.createConnection(dbConfig)

  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const postId = params.id
    const userId = session.user.id

    if (!postId) {
      return NextResponse.json(
        { success: false, error: 'Post ID is required' },
        { status: 400 }
      )
    }

    // Get user's reaction for this post
    const [rows] = await connection.execute(
      'SELECT reaction FROM post_reactions WHERE userId = ? AND postId = ?',
      [userId, postId]
    )

    const userReaction = (rows as any[])[0]?.reaction || null

    // Get all reactions count for this post
    const [reactionCounts] = await connection.execute(
      `SELECT reaction, COUNT(*) as count
       FROM post_reactions
       WHERE postId = ?
       GROUP BY reaction
       ORDER BY count DESC`,
      [postId]
    )

    return NextResponse.json({
      success: true,
      data: {
        userReaction,
        reactions: reactionCounts as any[]
      }
    })
  } catch (error) {
    console.error('Error fetching reactions:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch reactions' },
      { status: 500 }
    )
  } finally {
    await connection.end()
  }
}