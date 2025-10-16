import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { savePost, isPostSaved } from '@/lib/social-db'

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const postId = params.id

    if (!postId) {
      return NextResponse.json(
        { success: false, error: 'Post ID is required' },
        { status: 400 }
      )
    }

    const isSaved = await savePost(session.user.id, postId)

    return NextResponse.json({
      success: true,
      data: { saved: isSaved },
      message: isSaved ? 'Post saved successfully' : 'Post unsaved successfully'
    })
  } catch (error) {
    console.error('Error saving post:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to save post' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const postId = params.id

    if (!postId) {
      return NextResponse.json(
        { success: false, error: 'Post ID is required' },
        { status: 400 }
      )
    }

    const isSaved = await isPostSaved(session.user.id, postId)

    return NextResponse.json({
      success: true,
      data: { saved: isSaved }
    })
  } catch (error) {
    console.error('Error checking save status:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to check save status' },
      { status: 500 }
    )
  }
}