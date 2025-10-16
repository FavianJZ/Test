import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import mysql from 'mysql2/promise'

// Database connection function
async function getConnection() {
  return await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'hikariCha_db'
  })
}

// POST /api/user/activity/track - Track user activity for achievements
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { activity_type, duration_minutes } = await req.json()
    const userId = session.user.id

    const conn = await getConnection()

    // Update appropriate activity counter
    let updateField = null
    let achievementType = null

    switch (activity_type) {
      case 'daily_visit':
        updateField = 'active_days_count'
        achievementType = 'DAILY_VISITOR'
        break
      case 'active_hours':
        updateField = 'active_hours_count'
        achievementType = 'ACTIVE_USER'
        break
      default:
        return NextResponse.json({ error: "Invalid activity type" }, { status: 400 })
    }

    if (updateField) {
      if (activity_type === 'daily_visit') {
        // For daily visits, only increment once per day
        await conn.execute(`
          UPDATE user
          SET ${updateField} = ${updateField} + 1,
              last_active_date = CURRENT_DATE()
          WHERE id = ? AND (last_active_date IS NULL OR last_active_date < CURRENT_DATE())
        `, [userId])
      } else if (activity_type === 'active_hours' && duration_minutes) {
        // For active hours, add the duration in minutes (convert to hours)
        await conn.execute(`
          UPDATE user
          SET ${updateField} = ${updateField} + ?
          WHERE id = ?
        `, [duration_minutes / 60, userId]) // Convert minutes to hours
      }
    }

    // Trigger achievement check
    try {
      const achievementResponse = await fetch(`${process.env.NEXTAUTH_URL}/api/achievements/social/check`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': req.headers.get('cookie') || ''
        },
        body: JSON.stringify({
          action: activity_type,
          data: { duration_minutes }
        })
      })

      if (achievementResponse.ok) {
        const result = await achievementResponse.json()
        console.log('Achievement check result:', result)
      }
    } catch (achievementError) {
      console.error('Error checking achievements:', achievementError)
    }

    await conn.end()

    return NextResponse.json({
      success: true,
      message: `Activity tracked: ${activity_type}`
    })

  } catch (error) {
    console.error("Error tracking user activity:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// GET /api/user/activity/track - Get current activity stats
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const conn = await getConnection()
    const userId = session.user.id

    const [userStats] = await conn.execute(`
      SELECT
        active_days_count,
        active_hours_count,
        last_active_date
      FROM user
      WHERE id = ?
    `, [userId]) as any

    await conn.end()

    if (userStats.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      stats: userStats[0]
    })

  } catch (error) {
    console.error("Error getting user activity stats:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}