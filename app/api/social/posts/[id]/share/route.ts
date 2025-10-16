import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { shareSocialPost } from '@/lib/social-db'

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

    const success = await shareSocialPost(session.user.id, params.id)

    return NextResponse.json({
      success,
      message: success ? 'Post shared successfully' : 'Failed to share post'
    })
  } catch (error) {
    console.error('Error sharing social post:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to share post' },
      { status: 500 }
    )
  }
}