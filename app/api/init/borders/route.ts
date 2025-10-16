import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { borderService } from '@/lib/border-service'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    // Only allow admins to initialize borders
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized - Admin only' }, { status: 401 })
    }

    await borderService.initializeDefaultBorders()

    return NextResponse.json({
      success: true,
      message: 'Default borders initialized successfully'
    })

  } catch (error) {
    console.error('Error initializing borders:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}