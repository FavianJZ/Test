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

    const points = await dbService.getUserPoints(session.user.id)

    return NextResponse.json({
      success: true,
      data: { points }
    })

  } catch (error) {
    console.error('Error in points API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}