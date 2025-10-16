import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import mysql from "mysql2/promise"

let connection: mysql.Connection | null = null

async function getConnection() {
  if (!connection) {
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'hikariCha_db'
    })
  }
  return connection
}

// POST /api/achievements/test - Test achievements with simulated data
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { action, value } = await req.json()
    const userId = session.user.id

    const conn = await getConnection()

    // Update user stats based on action
    let updateField = null
    let achievementType = null

    switch (action) {
      case 'add_posts':
        updateField = 'post_count'
        achievementType = 'POST_MASTER'
        break
      case 'add_comments':
        updateField = 'comment_count'
        achievementType = 'COMMENTATOR'
        break
      case 'add_followers':
        updateField = 'follower_count'
        achievementType = 'SOCIALITE'
        break
      case 'add_forum_posts':
        updateField = 'forum_post_count'
        achievementType = 'FORUM_EXPLORER'
        break
      case 'add_forum_comments':
        updateField = 'forum_comment_count'
        achievementType = 'DISCUSSION_MASTER'
        break
      case 'add_recipes':
        updateField = 'recipe_count'
        achievementType = 'RECIPE_NOVICE'
        break
      case 'add_borders':
        achievementType = 'BORDER_COLLECTOR'
        break
      case 'add_active_days':
        updateField = 'active_days_count'
        achievementType = 'DAILY_VISITOR'
        break
      case 'add_active_hours':
        updateField = 'active_hours_count'
        achievementType = 'ACTIVE_USER'
        break
      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }

    // Update user stats
    if (updateField && value) {
      await conn.execute(`
        UPDATE user SET ${updateField} = ${updateField} + ? WHERE id = ?
      `, [value, userId])
    }

    // Add border_count manually if needed
    if (action === 'add_borders') {
      // For testing, we'll simulate border collection by adding dummy entries
      for (let i = 0; i < value; i++) {
        await conn.execute(`
          INSERT IGNORE INTO user_border (id, user_id, borderId, unlockedAt)
          VALUES (?, ?, ?, NOW())
        `, [`test_border_${userId}_${i}`, userId, 'default'])
      }
    }

    // Trigger achievement check
    const checkResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/achievements/social/check`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': req.headers.get('cookie') || ''
      },
      body: JSON.stringify({
        action: action.replace('add_', '').replace('s', '_created'), // Convert 'add_posts' to 'post_created'
        data: { value }
      })
    })

    if (checkResponse.ok) {
      const result = await checkResponse.json()
      return NextResponse.json({
        success: true,
        message: `Added ${value} ${action.replace('add_', '')} and checked achievements`,
        result
      })
    } else {
      return NextResponse.json({
        success: false,
        message: `Failed to check achievements after adding ${value} ${action.replace('add_', '')}`
      }, { status: 500 })
    }

  } catch (error) {
    console.error("Error in test achievement:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// GET /api/achievements/test - Get current test status
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const conn = await getConnection()
    const userId = session.user.id

    // Get current user stats
    const [userStats] = await conn.execute(`
      SELECT
        u.post_count,
        u.comment_count,
        u.follower_count,
        u.forum_post_count,
        u.forum_comment_count,
        u.recipe_count,
        u.active_days_count,
        u.active_hours_count,
        u.points,
        (SELECT COUNT(*) FROM user_border WHERE user_id = u.id) as border_count
      FROM user u
      WHERE u.id = ?
    `, [userId]) as any

    const stats = userStats[0]

    // Get achievement progress
    const [achievements] = await conn.execute(`
      SELECT achievement_type, current_level, current_value, completed_levels
      FROM user_achievement_progress
      WHERE user_id = ?
    `, [userId]) as any

    return NextResponse.json({
      success: true,
      currentStats: stats,
      achievements: achievements.map(a => ({
        ...a,
        completed_levels: a.completed_levels ? JSON.parse(a.completed_levels) : []
      })),
      availableActions: [
        { action: 'add_posts', description: 'Add posts to test POST_MASTER' },
        { action: 'add_comments', description: 'Add comments to test COMMENTATOR' },
        { action: 'add_followers', description: 'Add followers to test SOCIALITE' },
        { action: 'add_forum_posts', description: 'Add forum posts to test FORUM_EXPLORER' },
        { action: 'add_forum_comments', description: 'Add forum comments to test DISCUSSION_MASTER' },
        { action: 'add_recipes', description: 'Add recipes to test RECIPE_NOVICE' },
        { action: 'add_borders', description: 'Add borders to test BORDER_COLLECTOR' },
        { action: 'add_active_days', description: 'Add active days to test DAILY_VISITOR' },
        { action: 'add_active_hours', description: 'Add active hours to test ACTIVE_USER' }
      ]
    })

  } catch (error) {
    console.error("Error getting test status:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}