import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { borderService } from '@/lib/border-service'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')

    switch (action) {
      case 'unlocks':
        // Get user's border unlocks
        const unlocks = await borderService.getUserBorderUnlocks(session.user.id)
        return NextResponse.json({ success: true, data: unlocks })

      case 'transactions':
        // Get user's point transactions
        const limit = parseInt(searchParams.get('limit') || '20')
        const transactions = await borderService.getUserPointTransactions(session.user.id, limit)
        return NextResponse.json({ success: true, data: transactions })

      default:
        // Get all available borders with unlock status
        const borders = await borderService.getAllBordersWithUnlockStatus(session.user.id)
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