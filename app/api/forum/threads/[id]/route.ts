import { NextRequest, NextResponse } from 'next/server'
import { getThreadById } from '@/lib/forum-db'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const thread = await getThreadById(params.id)

    if (!thread) {
      return NextResponse.json(
        { success: false, error: 'Thread not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: thread
    })
  } catch (error) {
    console.error('Get thread error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch thread' },
      { status: 500 }
    )
  }
}