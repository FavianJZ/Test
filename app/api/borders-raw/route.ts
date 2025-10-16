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
    const action = searchParams.get('action')

    switch (action) {
      case 'unlocks':
        // Get user's border unlocks
        const unlocks = await dbService.getAllBordersWithUnlockStatus(session.user.id)
        const userUnlocks = unlocks.filter(b => b.unlocked)
        return NextResponse.json({ success: true, data: userUnlocks })

      case 'transactions':
        // Get user's point transactions (using activities for now)
        const limit = parseInt(searchParams.get('limit') || '20')
        const activities = await dbService.getUserActivities(session.user.id, limit)
        return NextResponse.json({ success: true, data: activities })

      default:
        // Get all available borders with unlock status
        const borders = await dbService.getAllBordersWithUnlockStatus(session.user.id)
        return NextResponse.json({ success: true, data: borders })
    }

  } catch (error) {
    console.error('Error in borders API:', error)
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
    const { action, borderId } = body

    switch (action) {
      case 'purchase':
        const purchaseResult = await dbService.purchaseBorder(session.user.id, borderId)

        if (purchaseResult.success) {
          // Refresh data to get updated points and border
          const freshBorders = await dbService.getAllBordersWithUnlockStatus(session.user.id)
          return NextResponse.json({
            success: true,
            message: purchaseResult.message,
            newPointsBalance: purchaseResult.newPointsBalance,
            data: freshBorders
          })
        } else {
          return NextResponse.json(
            { error: purchaseResult.message },
            { status: 400 }
          )
        }

      case 'select':
        const selectResult = await dbService.selectUserBorder(session.user.id, borderId)

        if (selectResult.success) {
          // Refresh data to get updated border status
          const freshBorders = await dbService.getAllBordersWithUnlockStatus(session.user.id)
          return NextResponse.json({
            success: true,
            message: selectResult.message,
            data: freshBorders
          })
        } else {
          return NextResponse.json(
            { error: selectResult.message },
            { status: 400 }
          )
        }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

  } catch (error) {
    console.error('Error in borders POST API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}