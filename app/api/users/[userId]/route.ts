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
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 })
    }

    // Get user border
    const userBorder = await dbService.getBorderById(user.selectedBorder)

    // If user has no border or border not found, use default border
    const borderData = userBorder || {
      id: 'default',
      name: 'Default',
      imageUrl: '/borders/default.svg',
      rarity: 'Default',
      price: null,
      isActive: true,
      sortOrder: 0
    }

    return NextResponse.json({
      success: true,
      data: {
        ...user,
        avatar: user.image,
        profilePhoto: user.image,
        border: borderData
      }
    })
  } catch (error) {
    console.error("Error fetching user:", error)
    return NextResponse.json(
      { success: false, error: "Failed to fetch user" },
      { status: 500 }
    )
  }
}