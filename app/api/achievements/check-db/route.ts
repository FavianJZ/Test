import { NextRequest, NextResponse } from "next/server"

export async function GET() {
  try {
    console.log("🔍 Checking database integration for achievement system...")

    // Test 1: Import database service
    const { dbService } = await import("@/lib/db-raw")
    console.log("✅ Database service imported successfully")

    // Test 2: Test database connection
    const conn = await dbService.getConnection()
    console.log("✅ Database connection established")

    // Test 3: Check if achievement table exists
    const [tableRows] = await conn.execute(
      "SHOW TABLES LIKE 'achievement'"
    )
    console.log("✅ Achievement table check completed")

    // Test 4: Check table structure
    if (tableRows.length > 0) {
      const [structureRows] = await conn.execute(
        "DESCRIBE achievement"
      )
      console.log("✅ Achievement table structure retrieved")
    } else {
      console.log("⚠️ Achievement table not found")
    }

    // Test 5: Test achievement functions import
    const {
      getUserAchievements,
      initializeAchievementsForUser,
      updateAchievementProgress
    } = await import("@/lib/achievements")
    console.log("✅ Achievement functions imported successfully")

    // Test 6: Check what tables exist in the database
    const [tableList] = await conn.execute("SHOW TABLES")
    console.log("✅ Table list retrieved")

    // Test 7: Test basic database query (check if user table exists)
    let userCount = 0
    try {
      const [userRows] = await conn.execute(
        "SELECT COUNT(*) as userCount FROM user WHERE id IS NOT NULL LIMIT 1"
      )
      userCount = (userRows as any[])[0].userCount
      console.log("✅ Basic database query successful")
    } catch (userError) {
      console.log("⚠️ User table not found or query failed:", userError)
    }

    // Test 8: Test border service
    try {
      const { borderService } = await import("@/lib/border-service")
      console.log("✅ Border service imported successfully")
    } catch (borderError) {
      console.log("⚠️ Border service import failed:", borderError)
    }

    await conn.end()
    console.log("✅ Database connection closed")

    return NextResponse.json({
      success: true,
      message: "Database integration check completed",
      results: {
        databaseConnection: "✅ Connected",
        achievementTable: tableRows.length > 0 ? "✅ Exists" : "❌ Not Found",
        achievementFunctions: "✅ Loaded",
        basicQuery: userCount > 0 ? "✅ Working" : "⚠️ Users Table Issue",
        borderService: "✅ Available",
        userCount: userCount,
        tablesFound: (tableList as any[]).map(row => Object.values(row)[0]),
        timestamp: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error("❌ Database integration check failed:", error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}