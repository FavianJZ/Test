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

// POST /api/achievements/claim - Claim achievement reward
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { achievementId } = await req.json()
    const userId = session.user.id

    if (!achievementId) {
      return NextResponse.json({ error: "Achievement ID is required" }, { status: 400 })
    }

    const conn = await getConnection()

    // Parse achievementId to get type and level
    // Handle different ID formats: "POST_MASTER_5" or "user_123_POST_MASTER_5"
    const parts = achievementId.split('_')
    const achievementLevel = parseInt(parts[parts.length - 1]) // Last part is the level
    const achievementType = parts.slice(0, -1).join('_') // Everything except the last part is the type

    // Check if achievement exists and is completed
    const [achievementProgress] = await conn.execute(`
      SELECT current_level, completed_levels, current_value
      FROM user_achievement_progress
      WHERE user_id = ? AND achievement_type = ?
    `, [userId, achievementType]) as any

    if (!achievementProgress.length || !achievementProgress[0].completed_levels.includes(achievementLevel)) {
      return NextResponse.json({ error: "Achievement not completed or not found" }, { status: 400 })
    }

    // Check if reward already claimed
    const [existingClaim] = await conn.execute(`
      SELECT id FROM claimed_achievement_rewards
      WHERE user_id = ? AND achievement_type = ? AND achievement_level = ?
    `, [userId, achievementType, achievementLevel]) as any

    if (existingClaim.length > 0) {
      return NextResponse.json({ error: "Reward already claimed" }, { status: 400 })
    }

    // Get reward details for this level
    const rewards = getRewardForLevel(achievementType, achievementLevel)
    if (!rewards) {
      return NextResponse.json({ error: "Reward not found for this level" }, { status: 400 })
    }

    // Start transaction
    await conn.beginTransaction()

    try {
      // Add points to user
      await conn.execute(
        'UPDATE user SET points = points + ? WHERE id = ?',
        [rewards.points, userId]
      )

      // Record the claimed reward
      await conn.execute(`
        INSERT INTO claimed_achievement_rewards (id, user_id, achievement_type, achievement_level, points_awarded, title_reward, badge_color, claimed_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
      `, [
        `car_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId,
        achievementType,
        achievementLevel,
        rewards.points,
        rewards.title,
        rewards.badgeColor
      ])

      // Update user achievement progress to mark reward as claimed
      const currentProgress = achievementProgress[0]
      const claimedLevels = JSON.parse(currentProgress.claimed_levels || '[]')
      claimedLevels.push(achievementLevel)

      await conn.execute(`
        UPDATE user_achievement_progress
        SET claimed_levels = ?,
            updated_at = NOW()
        WHERE user_id = ? AND achievement_type = ?
      `, [JSON.stringify(claimedLevels), userId, achievementType])

      // Add activity log
      await conn.execute(`
        INSERT INTO activity (id, user_id, type, title, description, metadata, createdAt)
        VALUES (?, ?, ?, ?, ?, ?, NOW())
      `, [
        `act_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId,
        'ACHIEVEMENT_REWARD_CLAIMED',
        `Reward claimed: ${rewards.title}`,
        `You claimed ${rewards.points} points and the title "${rewards.title}"`,
        JSON.stringify({
          achievementType,
          achievementLevel,
          rewards,
          claimedAt: new Date().toISOString()
        })
      ])

      await conn.commit()

      // Get updated user points
      const [updatedUser] = await conn.execute(
        'SELECT points FROM user WHERE id = ?',
        [userId]
      ) as any

      const newPointsBalance = updatedUser[0]?.points || 0

      return NextResponse.json({
        success: true,
        message: `Reward claimed successfully!`,
        newPointsBalance,
        rewards: {
          points: rewards.points,
          title: rewards.title,
          badgeColor: rewards.badgeColor,
          achievementLevel,
          achievementType
        }
      })

    } catch (error) {
      await conn.rollback()
      throw error
    }

  } catch (error) {
    console.error("Error claiming achievement reward:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// GET /api/achievements/claim - Get claimable achievement rewards
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = session.user.id
    const conn = await getConnection()

    // Get user's achievement progress
    const [achievementProgress] = await conn.execute(`
      SELECT achievement_type, current_level, completed_levels, claimed_levels
      FROM user_achievement_progress
      WHERE user_id = ?
    `, [userId]) as any

    const claimableAchievements = []

    for (const progress of achievementProgress) {
      const completedLevels = JSON.parse(progress.completed_levels || '[]')
      const claimedLevels = JSON.parse(progress.claimed_levels || '[]')

      // Find levels that are completed but not claimed
      const unclaimedLevels = completedLevels.filter(level => !claimedLevels.includes(level))

      for (const level of unclaimedLevels) {
        const rewards = getRewardForLevel(progress.achievement_type, level)
        if (rewards) {
          claimableAchievements.push({
            id: `${progress.achievement_type}_${level}`,
            type: progress.achievement_type,
            title: getAchievementTitle(progress.achievement_type, level),
            description: getAchievementDescription(progress.achievement_type),
            level,
            rewards,
            completedAt: progress.updated_at,
            isClaimed: false
          })
        }
      }
    }

    // Traditional achievements removed - only using level progression system now

    return NextResponse.json({
      success: true,
      achievements: claimableAchievements,
      hasUnclaimed: claimableAchievements.length > 0
    })

  } catch (error) {
    console.error("Error fetching claimable achievements:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// Helper functions
function getRewardForLevel(type: string, level: number) {
  const rewards = {
    // Social Achievements
    POST_MASTER: {
      1: { points: 20, title: 'Rising Star', badgeColor: 'bronze' },
      2: { points: 40, title: 'Rising Star', badgeColor: 'bronze' },
      3: { points: 60, title: 'Rising Star', badgeColor: 'bronze' },
      4: { points: 80, title: 'Active Poster', badgeColor: 'silver' },
      5: { points: 100, title: 'Active Poster', badgeColor: 'silver' },
      6: { points: 120, title: 'Active Poster', badgeColor: 'silver' },
      7: { points: 140, title: 'Content Creator', badgeColor: 'gold' },
      8: { points: 160, title: 'Content Creator', badgeColor: 'gold' },
      9: { points: 180, title: 'Content Creator', badgeColor: 'gold' },
      10: { points: 200, title: 'Social Media Influencer', badgeColor: 'diamond' }
    },
    COMMENTATOR: {
      1: { points: 15, title: 'Rising Voice', badgeColor: 'bronze' },
      2: { points: 30, title: 'Rising Voice', badgeColor: 'bronze' },
      3: { points: 45, title: 'Rising Voice', badgeColor: 'bronze' },
      4: { points: 60, title: 'Active Commenter', badgeColor: 'silver' },
      5: { points: 75, title: 'Active Commenter', badgeColor: 'silver' },
      6: { points: 90, title: 'Active Commenter', badgeColor: 'silver' },
      7: { points: 105, title: 'Discussion Expert', badgeColor: 'gold' },
      8: { points: 120, title: 'Discussion Expert', badgeColor: 'gold' },
      9: { points: 135, title: 'Discussion Expert', badgeColor: 'gold' },
      10: { points: 150, title: 'Master Conversationalist', badgeColor: 'diamond' }
    },
    SOCIALITE: {
      1: { points: 25, title: 'Friendly Face', badgeColor: 'bronze' },
      2: { points: 50, title: 'Friendly Face', badgeColor: 'bronze' },
      3: { points: 75, title: 'Friendly Face', badgeColor: 'bronze' },
      4: { points: 100, title: 'Popular User', badgeColor: 'silver' },
      5: { points: 125, title: 'Popular User', badgeColor: 'silver' },
      6: { points: 150, title: 'Popular User', badgeColor: 'silver' },
      7: { points: 175, title: 'Influencer', badgeColor: 'gold' },
      8: { points: 200, title: 'Influencer', badgeColor: 'gold' },
      9: { points: 225, title: 'Influencer', badgeColor: 'gold' },
      10: { points: 250, title: 'Community Leader', badgeColor: 'diamond' }
    },

    // Forum Achievements
    FORUM_EXPLORER: {
      1: { points: 10, title: 'Rising Explorer', badgeColor: 'bronze' },
      2: { points: 20, title: 'Rising Explorer', badgeColor: 'bronze' },
      3: { points: 30, title: 'Rising Explorer', badgeColor: 'bronze' },
      4: { points: 40, title: 'Forum Expert', badgeColor: 'silver' },
      5: { points: 50, title: 'Forum Expert', badgeColor: 'silver' },
      6: { points: 60, title: 'Forum Expert', badgeColor: 'silver' },
      7: { points: 70, title: 'Forum Master', badgeColor: 'gold' },
      8: { points: 80, title: 'Forum Master', badgeColor: 'gold' },
      9: { points: 90, title: 'Forum Master', badgeColor: 'gold' },
      10: { points: 100, title: 'Forum Legend', badgeColor: 'diamond' }
    },
    DISCUSSION_MASTER: {
      1: { points: 12, title: 'Rising Voice', badgeColor: 'bronze' },
      2: { points: 24, title: 'Rising Voice', badgeColor: 'bronze' },
      3: { points: 36, title: 'Rising Voice', badgeColor: 'bronze' },
      4: { points: 48, title: 'Discussion Expert', badgeColor: 'silver' },
      5: { points: 60, title: 'Discussion Expert', badgeColor: 'silver' },
      6: { points: 72, title: 'Discussion Expert', badgeColor: 'silver' },
      7: { points: 84, title: 'Discussion Champion', badgeColor: 'gold' },
      8: { points: 96, title: 'Discussion Champion', badgeColor: 'gold' },
      9: { points: 108, title: 'Discussion Champion', badgeColor: 'gold' },
      10: { points: 120, title: 'Discussion Guru', badgeColor: 'diamond' }
    },
    FORUM_LEGEND: {
      1: { points: 18, title: 'Rising Star', badgeColor: 'bronze' },
      2: { points: 36, title: 'Rising Star', badgeColor: 'bronze' },
      3: { points: 54, title: 'Rising Star', badgeColor: 'bronze' },
      4: { points: 72, title: 'Forum Star', badgeColor: 'silver' },
      5: { points: 90, title: 'Forum Star', badgeColor: 'silver' },
      6: { points: 108, title: 'Forum Star', badgeColor: 'silver' },
      7: { points: 126, title: 'Forum Legend', badgeColor: 'gold' },
      8: { points: 144, title: 'Forum Legend', badgeColor: 'gold' },
      9: { points: 162, title: 'Forum Legend', badgeColor: 'gold' },
      10: { points: 180, title: 'Forum Deity', badgeColor: 'diamond' }
    },

    // Recipe Achievements
    RECIPE_NOVICE: {
      1: { points: 15, title: 'Rising Chef', badgeColor: 'bronze' },
      2: { points: 30, title: 'Rising Chef', badgeColor: 'bronze' },
      3: { points: 45, title: 'Rising Chef', badgeColor: 'bronze' },
      4: { points: 60, title: 'Recipe Enthusiast', badgeColor: 'silver' },
      5: { points: 75, title: 'Recipe Enthusiast', badgeColor: 'silver' },
      6: { points: 90, title: 'Recipe Enthusiast', badgeColor: 'silver' },
      7: { points: 105, title: 'Recipe Expert', badgeColor: 'gold' },
      8: { points: 120, title: 'Recipe Expert', badgeColor: 'gold' },
      9: { points: 135, title: 'Recipe Expert', badgeColor: 'gold' },
      10: { points: 150, title: 'Recipe Master', badgeColor: 'diamond' }
    },
    CULINARY_ARTIST: {
      1: { points: 20, title: 'Rising Artist', badgeColor: 'bronze' },
      2: { points: 40, title: 'Rising Artist', badgeColor: 'bronze' },
      3: { points: 60, title: 'Rising Artist', badgeColor: 'bronze' },
      4: { points: 80, title: 'Culinary Expert', badgeColor: 'silver' },
      5: { points: 100, title: 'Culinary Expert', badgeColor: 'silver' },
      6: { points: 120, title: 'Culinary Expert', badgeColor: 'silver' },
      7: { points: 140, title: 'Culinary Master', badgeColor: 'gold' },
      8: { points: 160, title: 'Culinary Master', badgeColor: 'gold' },
      9: { points: 180, title: 'Culinary Master', badgeColor: 'gold' },
      10: { points: 200, title: 'Culinary Genius', badgeColor: 'diamond' }
    },
    MATCHA_MASTER: {
      1: { points: 25, title: 'Matcha Novice', badgeColor: 'bronze' },
      2: { points: 50, title: 'Matcha Novice', badgeColor: 'bronze' },
      3: { points: 75, title: 'Matcha Novice', badgeColor: 'bronze' },
      4: { points: 100, title: 'Matcha Enthusiast', badgeColor: 'silver' },
      5: { points: 125, title: 'Matcha Enthusiast', badgeColor: 'silver' },
      6: { points: 150, title: 'Matcha Enthusiast', badgeColor: 'silver' },
      7: { points: 175, title: 'Matcha Expert', badgeColor: 'gold' },
      8: { points: 200, title: 'Matcha Expert', badgeColor: 'gold' },
      9: { points: 225, title: 'Matcha Expert', badgeColor: 'gold' },
      10: { points: 250, title: 'Matcha Grandmaster', badgeColor: 'diamond' }
    },

    // Engagement Achievements
    DAILY_VISITOR: {
      1: { points: 8, title: 'Casual Visitor', badgeColor: 'bronze' },
      2: { points: 16, title: 'Casual Visitor', badgeColor: 'bronze' },
      3: { points: 24, title: 'Casual Visitor', badgeColor: 'bronze' },
      4: { points: 32, title: 'Frequent Visitor', badgeColor: 'silver' },
      5: { points: 40, title: 'Frequent Visitor', badgeColor: 'silver' },
      6: { points: 48, title: 'Frequent Visitor', badgeColor: 'silver' },
      7: { points: 56, title: 'Platform Regular', badgeColor: 'gold' },
      8: { points: 64, title: 'Platform Regular', badgeColor: 'gold' },
      9: { points: 72, title: 'Platform Regular', badgeColor: 'gold' },
      10: { points: 80, title: 'Platform Veteran', badgeColor: 'diamond' }
    },
    COMMUNITY_HELPER: {
      1: { points: 22, title: 'Helpful Newcomer', badgeColor: 'bronze' },
      2: { points: 44, title: 'Helpful Newcomer', badgeColor: 'bronze' },
      3: { points: 66, title: 'Helpful Newcomer', badgeColor: 'bronze' },
      4: { points: 88, title: 'Community Helper', badgeColor: 'silver' },
      5: { points: 110, title: 'Community Helper', badgeColor: 'silver' },
      6: { points: 132, title: 'Community Helper', badgeColor: 'silver' },
      7: { points: 154, title: 'Community Hero', badgeColor: 'gold' },
      8: { points: 176, title: 'Community Hero', badgeColor: 'gold' },
      9: { points: 198, title: 'Community Hero', badgeColor: 'gold' },
      10: { points: 220, title: 'Community Saint', badgeColor: 'diamond' }
    },
    TREND_SETTER: {
      1: { points: 30, title: 'Rising Trend', badgeColor: 'bronze' },
      2: { points: 60, title: 'Rising Trend', badgeColor: 'bronze' },
      3: { points: 90, title: 'Rising Trend', badgeColor: 'bronze' },
      4: { points: 120, title: 'Trend Setter', badgeColor: 'silver' },
      5: { points: 150, title: 'Trend Setter', badgeColor: 'silver' },
      6: { points: 180, title: 'Trend Setter', badgeColor: 'silver' },
      7: { points: 210, title: 'Trend Master', badgeColor: 'gold' },
      8: { points: 240, title: 'Trend Master', badgeColor: 'gold' },
      9: { points: 270, title: 'Trend Master', badgeColor: 'gold' },
      10: { points: 300, title: 'Trend Legend', badgeColor: 'diamond' }
    },

    // Collection Achievements
    BORDER_COLLECTOR: {
      1: { points: 35, title: 'Border Starter', badgeColor: 'bronze' },
      2: { points: 70, title: 'Border Starter', badgeColor: 'bronze' },
      3: { points: 105, title: 'Border Starter', badgeColor: 'bronze' },
      4: { points: 140, title: 'Border Collector', badgeColor: 'silver' },
      5: { points: 175, title: 'Border Collector', badgeColor: 'silver' },
      6: { points: 210, title: 'Border Collector', badgeColor: 'silver' },
      7: { points: 245, title: 'Border Expert', badgeColor: 'gold' },
      8: { points: 280, title: 'Border Expert', badgeColor: 'gold' },
      9: { points: 315, title: 'Border Expert', badgeColor: 'gold' },
      10: { points: 350, title: 'Border Hoarder', badgeColor: 'diamond' }
    },
    POINTS_HUNTER: {
      1: { points: 40, title: 'Points Collector', badgeColor: 'bronze' },
      2: { points: 80, title: 'Points Collector', badgeColor: 'bronze' },
      3: { points: 120, title: 'Points Collector', badgeColor: 'bronze' },
      4: { points: 160, title: 'Points Expert', badgeColor: 'silver' },
      5: { points: 200, title: 'Points Expert', badgeColor: 'silver' },
      6: { points: 240, title: 'Points Expert', badgeColor: 'silver' },
      7: { points: 280, title: 'Points Master', badgeColor: 'gold' },
      8: { points: 320, title: 'Points Master', badgeColor: 'gold' },
      9: { points: 360, title: 'Points Master', badgeColor: 'gold' },
      10: { points: 400, title: 'Points God', badgeColor: 'diamond' }
    },
    ACHIEVEMENT_HUNTER: {
      1: { points: 50, title: 'Achievement Collector', badgeColor: 'bronze' },
      2: { points: 100, title: 'Achievement Collector', badgeColor: 'bronze' },
      3: { points: 150, title: 'Achievement Collector', badgeColor: 'bronze' },
      4: { points: 200, title: 'Achievement Expert', badgeColor: 'silver' },
      5: { points: 250, title: 'Achievement Expert', badgeColor: 'silver' },
      6: { points: 300, title: 'Achievement Expert', badgeColor: 'silver' },
      7: { points: 350, title: 'Achievement Master', badgeColor: 'gold' },
      8: { points: 400, title: 'Achievement Master', badgeColor: 'gold' },
      9: { points: 450, title: 'Achievement Master', badgeColor: 'gold' },
      10: { points: 500, title: 'Achievement God', badgeColor: 'diamond' }
    }
  }

  return rewards[type as keyof typeof rewards]?.[level as keyof typeof rewards.POST_MASTER]
}

function getAchievementTitle(type: string, level: number): string {
  const names = {
    // Social
    POST_MASTER: 'Post Master',
    COMMENTATOR: 'Commentator',
    SOCIALITE: 'Socialite',
    // Forum
    FORUM_EXPLORER: 'Forum Explorer',
    DISCUSSION_MASTER: 'Discussion Master',
    FORUM_LEGEND: 'Forum Legend',
    // Recipe
    RECIPE_NOVICE: 'Recipe Novice',
    CULINARY_ARTIST: 'Culinary Artist',
    MATCHA_MASTER: 'Matcha Master',
    // Engagement
    DAILY_VISITOR: 'Daily Visitor',
    COMMUNITY_HELPER: 'Community Helper',
    TREND_SETTER: 'Trend Setter',
    // Collection
    BORDER_COLLECTOR: 'Border Collector',
    POINTS_HUNTER: 'Points Hunter',
    ACHIEVEMENT_HUNTER: 'Achievement Hunter'
  }
  return `${names[type as keyof typeof names]} - Level ${level}`
}

function getAchievementDescription(type: string): string {
  const descriptions = {
    // Social
    POST_MASTER: 'Create social posts and engage with the community',
    COMMENTATOR: 'Leave thoughtful comments on social posts',
    SOCIALITE: 'Build your follower network and expand your influence',
    // Forum
    FORUM_EXPLORER: 'Explore and participate in forum discussions',
    DISCUSSION_MASTER: 'Create engaging forum discussions',
    FORUM_LEGEND: 'Become a respected member of the forum community',
    // Recipe
    RECIPE_NOVICE: 'Start your culinary journey by sharing recipes',
    CULINARY_ARTIST: 'Create popular and loved recipes',
    MATCHA_MASTER: 'Master the art of matcha preparation',
    // Engagement
    DAILY_VISITOR: 'Visit the platform regularly',
    COMMUNITY_HELPER: 'Help other community members',
    TREND_SETTER: 'Start popular trends and discussions',
    // Collection
    BORDER_COLLECTOR: 'Collect unique profile borders',
    POINTS_HUNTER: 'Accumulate points through activities',
    ACHIEVEMENT_HUNTER: 'Complete various achievements'
  }
  return descriptions[type as keyof typeof descriptions]
}