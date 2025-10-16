import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { likeSocialPost, isSocialPostLiked, unlikeSocialPost } from '@/lib/social-db'
import * as mysql from 'mysql2/promise'

// Force recompilation - fixed like functionality

const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'hikariCha_db'
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

    const isLiked = await likeSocialPost(session.user.id, params.id)

    return NextResponse.json({
      success: true,
      data: { liked: isLiked }
    })
  } catch (error) {
    console.error('Error liking social post:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to like post' },
      { status: 500 }
    )
  }
}

export async function DELETE(
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

    await unlikeSocialPost(session.user.id, params.id)

    return NextResponse.json({
      success: true,
      data: { liked: false }
    })
  } catch (error) {
    console.error('Error unliking social post:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to unlike post' },
      { status: 500 }
    )
  }
}

export async function GET(
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

    const isLiked = await isSocialPostLiked(session.user.id, params.id)

    // Get actual likes count from database
    const connection = await mysql.createConnection(dbConfig)
    let likesCount = 0

    try {
      const [rows] = await connection.execute(
        'SELECT likesCount FROM social_post WHERE id = ?',
        [params.id]
      )
      const posts = rows as any[]
      if (posts.length > 0) {
        likesCount = posts[0].likesCount || 0
      }
    } finally {
      await connection.end()
    }

    return NextResponse.json({
      success: true,
      data: {
        liked: isLiked,
        likesCount: likesCount
      }
    })
  } catch (error) {
    console.error('Error checking like status:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to check like status' },
      { status: 500 }
    )
  }
}