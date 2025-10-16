import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getSavedPosts } from '@/lib/social-db'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = parseInt(searchParams.get('offset') || '0')

    const posts = await getSavedPosts(session.user.id, { limit, offset })

    return NextResponse.json({
      success: true,
      data: posts,
      meta: {
        limit,
        offset,
        count: posts.length
      }
    })
  } catch (error) {
    console.error('Error fetching saved posts:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch saved posts' },
      { status: 500 }
    )
  }
}