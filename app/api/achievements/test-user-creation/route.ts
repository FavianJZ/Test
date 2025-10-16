import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    console.log("🧪 Creating test user for achievement tracking...")

    const body = await request.json()
    const { userId, userName, userEmail } = body

    if (!userId || !userName || !userEmail) {
      return NextResponse.json({
        error: "User ID, name, and email required"
      }, { status: 400 })
    }

    const { dbService } = await import("@/lib/db-raw")

    // Create a simple test user record if it doesn't exist
    const conn = await dbService.getConnection()

    try {
      // Check if user exists
      const [existingUsers] = await conn.execute(
        'SELECT id FROM user WHERE id = ?',
        [userId]
      ) as any

      if (existingUsers.length === 0) {
        // Create test user
        await conn.execute(`
          INSERT INTO user (id, name, email, createdAt, updatedAt)
          VALUES (?, ?, ?, NOW(), NOW())
        `, [userId, userName, userEmail])

        console.log(`✅ Test user created: ${userId}`)
      } else {
        console.log(`ℹ️ Test user already exists: ${userId}`)
      }

      // Initialize achievements for this user
      const { initializeAchievementsForUser, getUserAchievements } = await import("@/lib/achievements")

      await initializeAchievementsForUser(userId)
      const achievements = await getUserAchievements(userId)

      console.log(`✅ Achievements initialized for user: ${userId}`)

      return NextResponse.json({
        success: true,
        message: "Test user and achievements created successfully",
        user: {
          id: userId,
          name: userName,
          email: userEmail
        },
        achievementsCount: achievements.length,
        achievements: achievements.map(a => ({
          type: a.type,
          title: a.title,
          currentValue: a.currentValue,
          targetValue: a.targetValue,
          isCompleted: a.isCompleted
        })),
        timestamp: new Date().toISOString()
      })

    } finally {
      await conn.end()
    }

  } catch (error) {
    console.error("❌ Test user creation failed:", error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}