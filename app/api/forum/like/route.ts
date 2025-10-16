import { NextRequest, NextResponse } from 'next/server'
import { likeContent, isContentLiked } from '@/lib/forum-db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

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
    const { content_id, content_type } = body

    if (!content_id || !content_type || !['thread', 'reply'].includes(content_type)) {
      return NextResponse.json(
        { success: false, error: 'Invalid parameters' },
        { status: 400 }
      )
    }

    const isLiked = await likeContent(
      session.user.id || session.user.email!,
      content_id,
      content_type
    )

    return NextResponse.json({
      success: true,
      data: { isLiked }
    })
  } catch (error) {
    console.error('Like content error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to process like' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const content_id = searchParams.get('content_id')
    const content_type = searchParams.get('content_type') as 'thread' | 'reply'

    if (!content_id || !content_type || !['thread', 'reply'].includes(content_type)) {
      return NextResponse.json(
        { success: false, error: 'Invalid parameters' },
        { status: 400 }
      )
    }

    const isLiked = await isContentLiked(
      session.user.id || session.user.email!,
      content_id,
      content_type
    )

    return NextResponse.json({
      success: true,
      data: { isLiked }
    })
  } catch (error) {
    console.error('Check like status error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to check like status' },
      { status: 500 }
    )
  }
}