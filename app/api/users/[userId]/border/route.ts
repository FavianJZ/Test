import { NextRequest, NextResponse } from 'next/server'
import { dbService } from '@/lib/db-raw'

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params

    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 })
    }

    // Get user data including selected border
    const user = await dbService.getUserById(userId)

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // If user has selected border, get border details
    if (user.selectedBorder && user.selectedBorder !== 'default') {
      try {
        const border = await dbService.getBorderById(user.selectedBorder)
        return NextResponse.json({
          border: border ? {
            ...border,
            unlocked: true // If user selected it, it's unlocked
          } : null
        })
      } catch (error) {
        console.error("Error fetching border:", error)
        return NextResponse.json({ border: null })
      }
    }

    // Return default border if no selected border
    return NextResponse.json({
      border: {
        id: 'default',
        name: 'Default',
        imageUrl: '/borders/default.svg',
        unlocked: true,
        rarity: 'Default'
      }
    })
  } catch (error) {
    console.error("Error fetching user border:", error)
    return NextResponse.json(
      { error: "Failed to fetch user border" },
      { status: 500 }
    )
  }
}