import { NextRequest, NextResponse } from "next/server"
import { getUserAchievements, initializeAchievementsForUser } from "@/lib/achievements"
import { dbService } from "@/lib/db-raw"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params
    const session = await getServerSession(authOptions)

    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 })
    }

    // Initialize achievements if they don't exist
    await initializeAchievementsForUser(userId)

    // Get user's achievements
    const achievements = await getUserAchievements(userId)

    // Get user info using dbService
    const user = await dbService.getUserById(userId)

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Get user status from database
    let userStatus = null
    try {
      const conn = await (await import('@/lib/db-raw')).getConnection()
      const [statusRows] = await conn.execute(
        'SELECT status, lastSeen FROM userstatus WHERE userId = ?',
        [userId]
      ) as any

      if (statusRows.length > 0) {
        userStatus = statusRows[0]
      }
    } catch (error) {
      console.error('Error fetching user status:', error)
    }

    // Get friendship status if user is logged in and viewing someone else's profile
    let friendshipStatus = 'NONE'
    if (session?.user?.id && session.user.id !== userId) {
      try {
        const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/friends?type=friends`, {
          headers: {
            'Cookie': request.headers.get('cookie') || ''
          }
        })

        if (response.ok) {
          const data = await response.json()
          const isFriend = data.friends?.some((friend: any) => friend.id === userId)
          if (isFriend) {
            friendshipStatus = 'FRIENDS'
          }
        }

        // Check for pending requests
        const sentResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/friends?type=sent`, {
          headers: {
            'Cookie': request.headers.get('cookie') || ''
          }
        })

        if (sentResponse.ok) {
          const data = await sentResponse.json()
          const hasSentRequest = data.requests?.some((req: any) => req.receiver.id === userId)
          if (hasSentRequest) {
            friendshipStatus = 'REQUEST_SENT'
          }
        }

        const receivedResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/friends?type=received`, {
          headers: {
            'Cookie': request.headers.get('cookie') || ''
          }
        })

        if (receivedResponse.ok) {
          const data = await receivedResponse.json()
          const hasReceivedRequest = data.requests?.some((req: any) => req.sender.id === userId)
          if (hasReceivedRequest) {
            friendshipStatus = 'REQUEST_RECEIVED'
          }
        }
      } catch (error) {
        console.error('Error checking friendship status:', error)
      }
    }

    // Map image to avatar for frontend consistency
    const userWithAvatar = {
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
      avatar: user.image,
      selectedBorder: user.selectedBorder,
      role: user.role,
      bio: user.bio,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      userStatus: userStatus ? {
        status: userStatus.status,
        lastSeen: userStatus.lastSeen
      } : null,
      friendshipStatus
    }

    return NextResponse.json({
      user: userWithAvatar,
      achievements
    })
  } catch (error) {
    console.error("Error fetching user achievements:", error)
    return NextResponse.json(
      { error: "Failed to fetch achievements" },
      { status: 500 }
    )
  }
}
