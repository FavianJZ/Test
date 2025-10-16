import { NextRequest, NextResponse } from 'next/server'
import { getThreadReplies, createReply } from '@/lib/forum-db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import mysql from 'mysql2/promise'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const replies = await getThreadReplies(params.id)

    return NextResponse.json({
      success: true,
      data: replies
    })
  } catch (error) {
    console.error('Get replies error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch replies' },
      { status: 500 }
    )
  }
}

// Database connection function
async function getConnection() {
  return await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'hikariCha_db'
  })
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { content, parent_id } = body

    if (!content || !content.trim()) {
      return NextResponse.json(
        { success: false, error: 'Content is required' },
        { status: 400 }
      )
    }

    const replyId = await createReply({
      thread_id: params.id,
      parent_id: parent_id && parent_id.trim() && parent_id !== params.id ? parent_id.trim() : null,
      content: content.trim(),
      author_id: session.user.id || session.user.email!
    })

    // Update user's forum_comment_count for achievements
    const conn = await getConnection()
    try {
      await conn.execute(
        'UPDATE user SET forum_comment_count = forum_comment_count + 1 WHERE id = ?',
        [session.user.id]
      )
    } finally {
      await conn.end()
    }

    // Trigger achievement check for DISCUSSION_MASTER
    try {
      const achievementResponse = await fetch(`${process.env.NEXTAUTH_URL}/api/achievements/social/check`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': request.headers.get('cookie') || ''
        },
        body: JSON.stringify({
          action: 'forum_comment_added',
          data: { threadId: params.id, replyId, content: content.trim(), parent_id }
        })
      })

      if (achievementResponse.ok) {
        const achievementResult = await achievementResponse.json()
        console.log('Achievement check result:', achievementResult)
      }
    } catch (achievementError) {
      console.error('Error checking achievements:', achievementError)
      // Don't fail the reply creation if achievement check fails
    }

    return NextResponse.json({
      success: true,
      data: { replyId }
    })
  } catch (error) {
    console.error('Create reply error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create reply' },
      { status: 500 }
    )
  }
}