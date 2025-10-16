import { NextRequest, NextResponse } from 'next/server'
import { getForumThreads, createThread } from '@/lib/forum-db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import mysql from 'mysql2/promise'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category') || 'all'
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    const threads = await getForumThreads({
      category,
      limit,
      offset
    })

    return NextResponse.json({
      success: true,
      data: threads
    })
  } catch (error) {
    console.error('Forum threads error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch threads' },
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

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { title, content, category_id, excerpt } = body

    if (!title || !content || !category_id) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const threadId = await createThread({
      title: title.trim(),
      content: content.trim(),
      excerpt: excerpt?.trim(),
      category_id: parseInt(category_id),
      author_id: session.user.id || session.user.email!
    })

    // Update user's forum_post_count for achievements
    const conn = await getConnection()
    try {
      await conn.execute(
        'UPDATE user SET forum_post_count = forum_post_count + 1 WHERE id = ?',
        [session.user.id]
      )
    } finally {
      await conn.end()
    }

    // Trigger achievement check for FORUM_EXPLORER
    try {
      const achievementResponse = await fetch(`${process.env.NEXTAUTH_URL}/api/achievements/social/check`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': request.headers.get('cookie') || ''
        },
        body: JSON.stringify({
          action: 'forum_post_created',
          data: { threadId, title: title.trim(), category_id }
        })
      })

      if (achievementResponse.ok) {
        const achievementResult = await achievementResponse.json()
        console.log('Achievement check result:', achievementResult)
      }
    } catch (achievementError) {
      console.error('Error checking achievements:', achievementError)
      // Don't fail the thread creation if achievement check fails
    }

    return NextResponse.json({
      success: true,
      data: { threadId }
    })
  } catch (error) {
    console.error('Create thread error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create thread' },
      { status: 500 }
    )
  }
}