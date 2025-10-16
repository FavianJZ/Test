import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createSocialComment, getSocialComments } from '@/lib/social-db'
import mysql from 'mysql2/promise'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const comments = await getSocialComments(params.id)

    return NextResponse.json({
      success: true,
      data: comments
    })
  } catch (error) {
    console.error('Error fetching social comments:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch comments' },
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

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { content, parent_id } = body

    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Content is required' },
        { status: 400 }
      )
    }

    // Get user info for the comment
    const userResponse = await fetch(`${process.env.NEXTAUTH_URL}/api/users/${session.user.id}`)
    const userData = await userResponse.json()

    if (!userData.success) {
      return NextResponse.json(
        { success: false, error: 'Failed to get user information' },
        { status: 500 }
      )
    }

    const user = userData.data
    const commentId = await createSocialComment({
      post_id: params.id,
      parent_id,
      content: content.trim(),
      author_id: session.user.id,
      author_name: user.name || session.user.name || 'Unknown',
      author_avatar: user.profilePhoto || user.avatar,
      author_border: user.border ? JSON.stringify(user.border) : null
    })

    // Update user's comment_count for achievements
    const conn = await getConnection()
    try {
      await conn.execute(
        'UPDATE user SET comment_count = comment_count + 1 WHERE id = ?',
        [session.user.id]
      )
    } finally {
      await conn.end()
    }

    // Trigger achievement check for COMMENTATOR
    try {
      const achievementResponse = await fetch(`${process.env.NEXTAUTH_URL}/api/achievements/social/check`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': request.headers.get('cookie') || ''
        },
        body: JSON.stringify({
          action: 'comment_added',
          data: { postId: params.id, commentId, content: content.trim() }
        })
      })

      if (achievementResponse.ok) {
        const achievementResult = await achievementResponse.json()
        console.log('Achievement check result:', achievementResult)
      }
    } catch (achievementError) {
      console.error('Error checking achievements:', achievementError)
      // Don't fail the comment creation if achievement check fails
    }

    // Get updated comments
    const comments = await getSocialComments(params.id)

    return NextResponse.json({
      success: true,
      data: comments
    })
  } catch (error) {
    console.error('Error creating social comment:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create comment' },
      { status: 500 }
    )
  }
}