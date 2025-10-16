import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    // Skip auth check for testing
    // const session = await getServerSession(authOptions)

    // if (!session?.user?.id) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // }

    const { borderId } = await req.json()

    if (!borderId) {
      return NextResponse.json({ error: 'Border ID is required' }, { status: 400 })
    }

    // Validate border ID
    const validBorders = ['default', 'bronze', 'silver', 'gold', 'crystal', 'diamond']
    if (!validBorders.includes(borderId)) {
      return NextResponse.json({ error: 'Invalid border ID' }, { status: 400 })
    }

    // Diamond border is locked
    if (borderId === 'diamond') {
      return NextResponse.json({ error: 'Anda belum memiliki border ini' }, { status: 400 })
    }

    // Simulate successful border selection
    console.log(`User selected border: ${borderId}`)

    return NextResponse.json({
      success: true,
      message: `Border ${borderId} berhasil dipilih!`
    })

  } catch (error) {
    console.error('Error selecting border:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan saat memilih border' },
      { status: 500 }
    )
  }
}