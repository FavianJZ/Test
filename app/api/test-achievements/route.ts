import { NextRequest, NextResponse } from "next/server"
import { dbService } from "@/lib/db-raw"
import { getUserAchievements, initializeAchievementsForUser, updateAchievementProgress, onForumThreadCreated, onForumCommentCreated } from "@/lib/achievements"

export async function GET() {
  try {
    // Test dengan user yang ada
    const testUserId = "user_1759875804311_admin" // Admin user

    console.log("🔍 Testing achievement system...")

    // Test database connection first
    console.log("🗄️ Testing database connection...")
    try {
      const conn = await dbService.getConnection()
      const [testRows] = await conn.execute('SELECT 1 as test')
      console.log("✅ Database connection successful:", testRows)
    } catch (dbError) {
      console.error("❌ Database connection failed:", dbError)
      return NextResponse.json({
        success: false,
        error: "Database connection failed",
        details: dbError instanceof Error ? dbError.message : "Unknown DB error"
      }, { status: 500 })
    }

    // 1. Initialize achievements for test user
    console.log("📝 Initializing achievements...")
    try {
      await initializeAchievementsForUser(testUserId)
      console.log("✅ Achievements initialized successfully")
    } catch (initError) {
      console.error("❌ Achievement initialization failed:", initError)
      return NextResponse.json({
        success: false,
        error: "Achievement initialization failed",
        details: initError instanceof Error ? initError.message : "Unknown init error"
      }, { status: 500 })
    }

    // 2. Get current achievements
    console.log("📊 Getting current achievements...")
    let achievements = []
    try {
      achievements = await getUserAchievements(testUserId)
      console.log(`✅ Retrieved ${achievements.length} achievements`)
    } catch (getError) {
      console.error("❌ Getting achievements failed:", getError)
      return NextResponse.json({
        success: false,
        error: "Getting achievements failed",
        details: getError instanceof Error ? getError.message : "Unknown get error"
      }, { status: 500 })
    }

    // 3. Test forum thread creation achievement
    console.log("🧵 Testing forum thread achievement...")
    try {
      await onForumThreadCreated(testUserId)
      console.log("✅ Forum thread achievement tracked")
    } catch (threadError) {
      console.error("❌ Forum thread achievement failed:", threadError)
      // Don't return error here, continue with other tests
    }

    // 4. Test forum comment creation achievement
    console.log("💬 Testing forum comment achievement...")
    try {
      await onForumCommentCreated(testUserId)
      console.log("✅ Forum comment achievement tracked")
    } catch (commentError) {
      console.error("❌ Forum comment achievement failed:", commentError)
      // Don't return error here, continue with other tests
    }

    // 5. Get updated achievements
    console.log("🔄 Getting updated achievements...")
    let updatedAchievements = []
    try {
      updatedAchievements = await getUserAchievements(testUserId)
      console.log(`✅ Retrieved ${updatedAchievements.length} updated achievements`)
    } catch (getError) {
      console.error("❌ Getting updated achievements failed:", getError)
      // Don't return error here, return what we have so far
    }

    return NextResponse.json({
      success: true,
      testUserId,
      initialAchievements: achievements.length,
      finalAchievements: updatedAchievements.length,
      achievements: updatedAchievements,
      message: "Achievement system test completed"
    })
  } catch (error) {
    console.error("❌ Achievement test failed:", error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}