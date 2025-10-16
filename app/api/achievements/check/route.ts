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

// POST /api/achievements/check - Check all achievements for user
export async function POST() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = session.user.id
    const conn = await getConnection()

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
        (SELECT COUNT(*) FROM user_border WHERE user_id = u.id) as border_count,
        (SELECT COUNT(*) FROM friends WHERE user_id = u.id OR friend_id = u.id) as friend_count
      FROM user u
      WHERE u.id = ?
    `, [userId]) as any

    const stats = userStats[0]
    if (!stats) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Get achievement configurations
    const achievementsResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/achievements/social`, {
      headers: {
        'Cookie': 'next-auth.session-token=' + (req as any).cookies?.get('next-auth.session-token')?.value || ''
      }
    })

    if (!achievementsResponse.ok) {
      return NextResponse.json({ error: "Failed to fetch achievements" }, { status: 500 })
    }

    const achievementsData = await achievementsResponse.json()
    const achievements = achievementsData.achievements

    const newlyCompletedAchievements = []

    // Check each achievement for completion
    for (const achievement of achievements) {
      if (achievement.progressPercentage >= 100 && !achievement.isCompleted) {
        // Mark this achievement as completed
        newlyCompletedAchievements.push({
          id: achievement.id,
          type: achievement.type,
          level: achievement.level,
          rewards: achievement.rewards
        })

        // Update achievement progress
        const [currentProgress] = await conn.execute(`
          SELECT current_level, completed_levels, claimed_levels
          FROM user_achievement_progress
          WHERE user_id = ? AND achievement_type = ?
        `, [userId, achievement.type]) as any

        const progress = currentProgress[0] || {
          current_level: 0,
          completed_levels: [],
          claimed_levels: []
        }

        const completedLevels = Array.isArray(progress.completed_levels) ? [...progress.completed_levels] : []
        if (!completedLevels.includes(achievement.level)) {
          completedLevels.push(achievement.level)

          await conn.execute(`
            INSERT INTO user_achievement_progress (id, user_id, achievement_type, current_level, current_value, completed_levels, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, NOW())
            ON DUPLICATE KEY UPDATE
            current_level = VALUES(current_level),
            current_value = VALUES(current_value),
            completed_levels = VALUES(completed_levels),
            updated_at = NOW()
          `, [
            `ap_${userId}_${achievement.type}_${Date.now()}`,
            userId,
            achievement.type,
            Math.max(achievement.level, progress.current_level || 0),
            achievement.currentValue,
            JSON.stringify(completedLevels)
          ])

          // Award points for new achievement
          await conn.execute(
            'UPDATE user SET points = points + ? WHERE id = ?',
            [achievement.rewards.points, userId]
          )

          // Add activity log
          await conn.execute(`
            INSERT INTO activity (id, user_id, type, title, description, metadata, createdAt)
            VALUES (?, ?, ?, ?, ?, ?, NOW())
          `, [
            `act_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            userId,
            'ACHIEVEMENT_UNLOCKED',
            achievement.title,
            `You've unlocked ${achievement.title}!`,
            JSON.stringify({
              type: achievement.type,
              level: achievement.level,
              rewards: achievement.rewards,
              currentValue: achievement.currentValue,
              targetValue: achievement.targetValue
            })
          ])
        }
      }
    }

    return NextResponse.json({
      success: true,
      newlyCompletedAchievements,
      totalPointsAwarded: newlyCompletedAchievements.reduce((sum, a) => sum + a.rewards.points, 0),
      message: `Checked ${achievements.length} achievements. ${newlyCompletedAchievements.length} new achievements completed.`
    })

  } catch (error) {
    console.error("Error checking achievements:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}