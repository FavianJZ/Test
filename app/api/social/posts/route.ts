import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import {
  createSocialPost,
  getSocialPosts,
  getSocialPostById,
  deleteSocialPost,
  getPrioritizedFeed,
  getFollowingPosts
} from '@/lib/social-db'
import mysql from 'mysql2/promise'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = parseInt(searchParams.get('offset') || '0')
    const author_id = searchParams.get('author_id') || undefined
    const feed_type = searchParams.get('feed_type') || 'all' // 'all', 'following', 'prioritized'

    const session = await getServerSession(authOptions)
    const userId = session?.user?.id

    let posts

    switch (feed_type) {
      case 'following':
        if (!userId) {
          return NextResponse.json(
            { success: false, error: 'Authentication required for following feed' },
            { status: 401 }
          )
        }
        posts = await getFollowingPosts(userId, { limit, offset })
        break
      case 'prioritized':
        if (!userId) {
          // Fallback to regular feed if not authenticated
          posts = await getSocialPosts({ limit, offset, author_id })
        } else {
          posts = await getPrioritizedFeed(userId, { limit, offset })
        }
        break
      default:
        posts = await getSocialPosts({ limit, offset, author_id })
        break
    }

    return NextResponse.json({
      success: true,
      data: posts,
      meta: {
        feed_type,
        limit,
        offset,
        count: posts.length
      }
    })
  } catch (error) {
    console.error('Error fetching social posts:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch posts' },
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

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { content, media_urls } = body

    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Content is required' },
        { status: 400 }
      )
    }

    // Get user info for the post
    const userResponse = await fetch(`${process.env.NEXTAUTH_URL}/api/users/${session.user.id}`)
    const userData = await userResponse.json()

    if (!userData.success) {
      return NextResponse.json(
        { success: false, error: 'Failed to get user information' },
        { status: 500 }
      )
    }

    const user = userData.data
    const postId = await createSocialPost({
      content: content.trim(),
      author_id: session.user.id,
      author_name: user.name || session.user.name || 'Unknown',
      author_avatar: user.profilePhoto || user.avatar,
      author_border: user.border ? JSON.stringify(user.border) : null,
      media_urls
    })

    // Update user's post_count for achievements
    const conn = await getConnection()
    try {
      await conn.execute(
        'UPDATE user SET post_count = post_count + 1 WHERE id = ?',
        [session.user.id]
      )
    } finally {
      await conn.end()
    }

    // Trigger achievement check for POST_MASTER
    try {
      const achievementResponse = await fetch(`${process.env.NEXTAUTH_URL}/api/achievements/social/check`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': request.headers.get('cookie') || ''
        },
        body: JSON.stringify({
          action: 'post_created',
          data: { postId, content: content.trim() }
        })
      })

      if (achievementResponse.ok) {
        const achievementResult = await achievementResponse.json()
        console.log('Achievement check result:', achievementResult)
      }
    } catch (achievementError) {
      console.error('Error checking achievements:', achievementError)
      // Don't fail the post creation if achievement check fails
    }

    // Get the created post
    const post = await getSocialPostById(postId)

    if (!post) {
      console.error('Failed to retrieve created post with ID:', postId)
      return NextResponse.json(
        { success: false, error: 'Failed to retrieve created post' },
        { status: 500 }
      )
    }

    console.log('Successfully created post:', post.id)
    return NextResponse.json({
      success: true,
      data: post
    })
  } catch (error) {
    console.error('Error creating social post:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create post' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const postId = searchParams.get('id')

    if (!postId) {
      return NextResponse.json(
        { success: false, error: 'Post ID is required' },
        { status: 400 }
      )
    }

    const success = await deleteSocialPost(postId, session.user.id)

    return NextResponse.json({
      success,
      message: success ? 'Post deleted successfully' : 'Failed to delete post or unauthorized'
    })
  } catch (error) {
    console.error('Error deleting social post:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete post' },
      { status: 500 }
    )
  }
}