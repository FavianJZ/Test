import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// Temporary fallback borders for testing
const FALLBACK_BORDERS = [
  {
    id: "default",
    name: "Default",
    description: "Border default untuk semua user",
    imageUrl: "/borders/default.svg",
    price: null,
    rarity: "COMMON",
    isActive: true,
    sortOrder: 0,
    unlocked: true,
    unlockType: "ADMIN" as const,
    unlockedAt: new Date(),
    pricePaid: null
  },
  {
    id: "bronze",
    name: "Bronze",
    description: "Border bronze",
    imageUrl: "/borders/bronze.svg",
    price: null,
    rarity: "COMMON",
    isActive: true,
    sortOrder: 10,
    unlocked: true,
    unlockType: "ACHIEVEMENT" as const,
    unlockedAt: new Date(),
    pricePaid: null
  },
  {
    id: "silver",
    name: "Silver",
    description: "Border silver",
    imageUrl: "/borders/silver.svg",
    price: null,
    rarity: "RARE",
    isActive: true,
    sortOrder: 20,
    unlocked: true,
    unlockType: "ACHIEVEMENT" as const,
    unlockedAt: new Date(),
    pricePaid: null
  },
  {
    id: "gold",
    name: "Gold",
    description: "Border gold",
    imageUrl: "/borders/gold.svg",
    price: 500,
    rarity: "EPIC",
    isActive: true,
    sortOrder: 30,
    unlocked: true,
    unlockType: "PURCHASE" as const,
    unlockedAt: new Date(),
    pricePaid: 500
  },
  {
    id: "crystal",
    name: "Crystal",
    description: "Border crystal",
    imageUrl: "/borders/crystal.svg",
    price: 1000,
    rarity: "EPIC",
    isActive: true,
    sortOrder: 40,
    unlocked: true,
    unlockType: "PURCHASE" as const,
    unlockedAt: new Date(),
    pricePaid: 1000
  },
  {
    id: "diamond",
    name: "Diamond",
    description: "Border diamond",
    imageUrl: "/borders/diamond.svg",
    price: 2000,
    rarity: "LEGENDARY",
    isActive: true,
    sortOrder: 50,
    unlocked: false, // Locked for testing
    unlockType: null,
    unlockedAt: null,
    pricePaid: null
  }
]

export async function GET(request: NextRequest) {
  try {
    // Skip auth check for testing
    // const session = await getServerSession(authOptions)

    // if (!session?.user?.id) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // }

    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')

    switch (action) {
      case 'unlocks':
        // Get user's border unlocks
        return NextResponse.json({
          success: true,
          data: FALLBACK_BORDERS.filter(b => b.unlocked)
        })

      case 'transactions':
        // Get user's point transactions - dummy data
        return NextResponse.json({
          success: true,
          data: []
        })

      default:
        // Get all available borders with unlock status
        return NextResponse.json({
          success: true,
          data: FALLBACK_BORDERS
        })
    }

  } catch (error) {
    console.error('Error in borders API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}