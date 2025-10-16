import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptionsRaw } from '@/lib/auth-raw'
import { dbService } from '@/lib/db-raw'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptionsRaw)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')

    const activities = await dbService.getUserActivities(session.user.id, limit)

    return NextResponse.json({
      success: true,
      activities
    })

  } catch (error) {
    console.error('Error in activities API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptionsRaw)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { type, title, description, metadata } = body

    if (!type || !title) {
      return NextResponse.json({ error: 'Type and title are required' }, { status: 400 })
    }

    const success = await dbService.createActivity(
      session.user.id,
      type,
      title,
      description,
      metadata
    )

    if (success) {
      return NextResponse.json({
        success: true,
        message: 'Activity created successfully'
      })
    } else {
      return NextResponse.json({
        success: false,
        error: 'Failed to create activity'
      }, { status: 500 })
    }

  } catch (error) {
    console.error('Error in activities POST API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}