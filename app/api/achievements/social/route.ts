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

// All achievement definitions with levels 1-10
const ALL_ACHIEVEMENTS = {
  // Social Achievements
  POST_MASTER: {
    name: 'Post Master',
    description: 'Create social posts and engage with the community',
    icon: '📝',
    category: 'social',
    levels: Array.from({ length: 10 }, (_, i) => {
      const level = i + 1
      return {
        level,
        targetValue: Math.floor(5 * Math.pow(1.1, level - 1)), // 5, 6, 7, 8, 9, 11, 13, 15, 17, 19
        pointsReward: level * 25, // 25, 50, 75, 100, 125, 150, 175, 200, 225, 250
        title: level === 10 ? 'Social Media Legend' : level >= 8 ? 'Content Master' : level >= 5 ? 'Active Creator' : level >= 3 ? 'Rising Star' : 'Novice Poster',
        badgeColor: level < 3 ? 'bronze' : level < 6 ? 'silver' : level < 9 ? 'gold' : 'diamond'
      }
    })
  },
  COMMENTATOR: {
    name: 'Commentator',
    description: 'Leave thoughtful comments on social posts',
    icon: '💬',
    category: 'social',
    levels: Array.from({ length: 10 }, (_, i) => {
      const level = i + 1
      return {
        level,
        targetValue: Math.floor(10 * Math.pow(1.1, level - 1)), // 10, 11, 13, 14, 16, 18, 20, 22, 25, 27
        pointsReward: level * 20, // 20, 40, 60, 80, 100, 120, 140, 160, 180, 200
        title: level === 10 ? 'Comment Master' : level >= 8 ? 'Discussion Expert' : level >= 5 ? 'Active Commenter' : level >= 3 ? 'Rising Voice' : 'Novice Commentator',
        badgeColor: level < 3 ? 'bronze' : level < 6 ? 'silver' : level < 9 ? 'gold' : 'diamond'
      }
    })
  },
  SOCIALITE: {
    name: 'Socialite',
    description: 'Build your follower network and expand your influence',
    icon: '👥',
    category: 'social',
    levels: Array.from({ length: 10 }, (_, i) => {
      const level = i + 1
      return {
        level,
        targetValue: Math.floor(3 * Math.pow(1.1, level - 1)), // 3, 4, 5, 6, 7, 8, 9, 11, 13, 14
        pointsReward: level * 30, // 30, 60, 90, 120, 150, 180, 210, 240, 270, 300
        title: level === 10 ? 'Network Master' : level >= 8 ? 'Community Leader' : level >= 5 ? 'Popular User' : level >= 3 ? 'Rising Star' : 'Friendly Face',
        badgeColor: level < 3 ? 'bronze' : level < 6 ? 'silver' : level < 9 ? 'gold' : 'diamond'
      }
    })
  },
  FRIEND_COLLECTOR: {
    name: 'Friend Collector',
    description: 'Build meaningful friendships in the community',
    icon: '🤝',
    category: 'social',
    levels: Array.from({ length: 10 }, (_, i) => {
      const level = i + 1
      return {
        level,
        targetValue: Math.floor(2 * Math.pow(1.1, level - 1)), // 2, 3, 4, 4, 5, 6, 7, 8, 9, 10
        pointsReward: level * 35, // 35, 70, 105, 140, 175, 210, 245, 280, 315, 350
        title: level === 10 ? 'Friend Master' : level >= 8 ? 'Social Butterfly' : level >= 5 ? 'Friend Seeker' : level >= 3 ? 'Friendly User' : 'New Friend',
        badgeColor: level < 3 ? 'bronze' : level < 6 ? 'silver' : level < 9 ? 'gold' : 'diamond'
      }
    })
  },

  // Forum Achievements
  FORUM_EXPLORER: {
    name: 'Forum Explorer',
    description: 'Explore and participate in forum discussions',
    icon: '🗺️',
    category: 'forum',
    levels: Array.from({ length: 10 }, (_, i) => {
      const level = i + 1
      return {
        level,
        targetValue: Math.floor(2 * Math.pow(1.1, level - 1)), // 2, 3, 3, 4, 4, 5, 6, 7, 8, 9
        pointsReward: level * 15, // 15, 30, 45, 60, 75, 90, 105, 120, 135, 150
        title: level === 10 ? 'Forum Master' : level >= 8 ? 'Forum Legend' : level >= 5 ? 'Forum Expert' : level >= 3 ? 'Active Explorer' : 'Novice Explorer',
        badgeColor: level < 3 ? 'bronze' : level < 6 ? 'silver' : level < 9 ? 'gold' : 'diamond'
      }
    })
  },
  DISCUSSION_MASTER: {
    name: 'Discussion Master',
    description: 'Create engaging forum discussions',
    icon: '💭',
    category: 'forum',
    levels: Array.from({ length: 10 }, (_, i) => {
      const level = i + 1
      return {
        level,
        targetValue: Math.floor(5 * Math.pow(1.1, level - 1)), // 5, 6, 7, 8, 9, 11, 13, 15, 17, 19
        pointsReward: level * 18, // 18, 36, 54, 72, 90, 108, 126, 144, 162, 180
        title: level === 10 ? 'Discussion Guru' : level >= 8 ? 'Discussion Champion' : level >= 5 ? 'Discussion Expert' : level >= 3 ? 'Active Discussant' : 'Novice Speaker',
        badgeColor: level < 3 ? 'bronze' : level < 6 ? 'silver' : level < 9 ? 'gold' : 'diamond'
      }
    })
  },
  FORUM_LEGEND: {
    name: 'Forum Legend',
    description: 'Become a respected member of the forum community',
    icon: '👑',
    category: 'forum',
    levels: Array.from({ length: 10 }, (_, i) => {
      const level = i + 1
      return {
        level,
        targetValue: Math.floor(5 * Math.pow(1.1, level - 1)), // 5, 6, 7, 8, 9, 11, 13, 15, 17, 19 likes received
        pointsReward: level * 25, // 25, 50, 75, 100, 125, 150, 175, 200, 225, 250
        title: level === 10 ? 'Forum Deity' : level >= 8 ? 'Forum Legend' : level >= 5 ? 'Forum Star' : level >= 3 ? 'Forum Favorite' : 'Rising Star',
        badgeColor: level < 3 ? 'bronze' : level < 6 ? 'silver' : level < 9 ? 'gold' : 'diamond'
      }
    })
  },

  // Recipe Achievements
  RECIPE_NOVICE: {
    name: 'Recipe Novice',
    description: 'Start your culinary journey by sharing recipes',
    icon: '👨‍🍳',
    category: 'recipe',
    levels: Array.from({ length: 10 }, (_, i) => {
      const level = i + 1
      return {
        level,
        targetValue: Math.floor(1 * Math.pow(1.1, level - 1)), // 1, 1, 2, 2, 3, 3, 4, 4, 5, 5 recipes
        pointsReward: level * 15, // 15, 30, 45, 60, 75, 90, 105, 120, 135, 150
        title: level === 10 ? 'Recipe Master' : level >= 8 ? 'Recipe Expert' : level >= 5 ? 'Recipe Enthusiast' : level >= 3 ? 'Rising Chef' : 'Novice Chef',
        badgeColor: level < 3 ? 'bronze' : level < 6 ? 'silver' : level < 9 ? 'gold' : 'diamond'
      }
    })
  },
  CULINARY_ARTIST: {
    name: 'Culinary Artist',
    description: 'Create popular and loved recipes',
    icon: '🎨',
    category: 'recipe',
    levels: Array.from({ length: 10 }, (_, i) => {
      const level = i + 1
      return {
        level,
        targetValue: Math.floor(2 * Math.pow(1.1, level - 1)), // 2, 2, 3, 3, 4, 4, 5, 5, 6, 7 likes on recipes
        pointsReward: level * 20, // 20, 40, 60, 80, 100, 120, 140, 160, 180, 200
        title: level === 10 ? 'Culinary Genius' : level >= 8 ? 'Culinary Master' : level >= 5 ? 'Culinary Expert' : level >= 3 ? 'Rising Artist' : 'Novice Artist',
        badgeColor: level < 3 ? 'bronze' : level < 6 ? 'silver' : level < 9 ? 'gold' : 'diamond'
      }
    })
  },
  MATCHA_MASTER: {
    name: 'Matcha Master',
    description: 'Master the art of matcha preparation',
    icon: '🍵',
    category: 'recipe',
    levels: Array.from({ length: 10 }, (_, i) => {
      const level = i + 1
      return {
        level,
        targetValue: Math.floor(1 * Math.pow(1.1, level - 1)), // 1, 1, 2, 2, 3, 3, 4, 4, 5, 5 matcha recipes
        pointsReward: level * 25, // 25, 50, 75, 100, 125, 150, 175, 200, 225, 250
        title: level === 10 ? 'Matcha Grandmaster' : level >= 8 ? 'Matcha Expert' : level >= 5 ? 'Matcha Enthusiast' : level >= 3 ? 'Matcha Novice' : 'Matcha Beginner',
        badgeColor: level < 3 ? 'bronze' : level < 6 ? 'silver' : level < 9 ? 'gold' : 'diamond'
      }
    })
  },

  // Engagement Achievements
  DAILY_VISITOR: {
    name: 'Daily Visitor',
    description: 'Visit the platform regularly',
    icon: '📅',
    category: 'engagement',
    levels: Array.from({ length: 10 }, (_, i) => {
      const level = i + 1
      return {
        level,
        targetValue: Math.floor(1 * Math.pow(1.1, level - 1)), // 1, 1, 2, 2, 3, 3, 4, 4, 5, 5 days (streak)
        pointsReward: level * 10, // 10, 20, 30, 40, 50, 60, 70, 80, 90, 100
        title: level === 10 ? 'Daily Legend' : level >= 8 ? 'Consistent User' : level >= 5 ? 'Regular Visitor' : level >= 3 ? 'Frequent User' : 'Casual Visitor',
        badgeColor: level < 3 ? 'bronze' : level < 6 ? 'silver' : level < 9 ? 'gold' : 'diamond'
      }
    })
  },
  ACTIVE_USER: {
    name: 'Active User',
    description: 'Spend time actively on the platform',
    icon: '⏰',
    category: 'engagement',
    levels: Array.from({ length: 10 }, (_, i) => {
      const level = i + 1
      return {
        level,
        targetValue: Math.floor(1 * Math.pow(1.1, level - 1)), // 1, 1, 2, 2, 3, 3, 4, 4, 5, 5 hours
        pointsReward: level * 12, // 12, 24, 36, 48, 60, 72, 84, 96, 108, 120
        title: level === 10 ? 'Time Master' : level >= 8 ? 'Active Veteran' : level >= 5 ? 'Active User' : level >= 3 ? 'Engaged User' : 'New User',
        badgeColor: level < 3 ? 'bronze' : level < 6 ? 'silver' : level < 9 ? 'gold' : 'diamond'
      }
    })
  },
  COMMUNITY_HELPER: {
    name: 'Community Helper',
    description: 'Help other community members',
    icon: '🤝',
    category: 'engagement',
    levels: Array.from({ length: 10 }, (_, i) => {
      const level = i + 1
      return {
        level,
        targetValue: Math.floor(5 * Math.pow(1.1, level - 1)), // 5, 6, 7, 8, 9, 11, 13, 15, 17, 19 helpful actions
        pointsReward: level * 22, // 22, 44, 66, 88, 110, 132, 154, 176, 198, 220
        title: level === 10 ? 'Community Saint' : level >= 8 ? 'Community Hero' : level >= 5 ? 'Community Helper' : level >= 3 ? 'Helpful User' : 'Helpful Newcomer',
        badgeColor: level < 3 ? 'bronze' : level < 6 ? 'silver' : level < 9 ? 'gold' : 'diamond'
      }
    })
  },
  TREND_SETTER: {
    name: 'Trend Setter',
    description: 'Start popular trends and discussions',
    icon: '🔥',
    category: 'engagement',
    levels: Array.from({ length: 10 }, (_, i) => {
      const level = i + 1
      return {
        level,
        targetValue: Math.floor(3 * Math.pow(1.1, level - 1)), // 3, 3, 4, 4, 5, 6, 7, 8, 9, 10 trending posts
        pointsReward: level * 30, // 30, 60, 90, 120, 150, 180, 210, 240, 270, 300
        title: level === 10 ? 'Trend Legend' : level >= 8 ? 'Trend Master' : level >= 5 ? 'Trend Setter' : level >= 3 ? 'Rising Trend' : 'Trend Starter',
        badgeColor: level < 3 ? 'bronze' : level < 6 ? 'silver' : level < 9 ? 'gold' : 'diamond'
      }
    })
  },

  // Collection Achievements
  BORDER_COLLECTOR: {
    name: 'Border Collector',
    description: 'Collect unique profile borders',
    icon: '🖼️',
    category: 'collection',
    levels: Array.from({ length: 10 }, (_, i) => {
      const level = i + 1
      return {
        level,
        targetValue: Math.floor(1 * Math.pow(1.1, level - 1)), // 1, 1, 2, 2, 3, 3, 4, 4, 5, 5 borders
        pointsReward: level * 35, // 35, 70, 105, 140, 175, 210, 245, 280, 315, 350
        title: level === 10 ? 'Border Master' : level >= 8 ? 'Border Expert' : level >= 5 ? 'Border Collector' : level >= 3 ? 'Border Enthusiast' : 'Border Starter',
        badgeColor: level < 3 ? 'bronze' : level < 6 ? 'silver' : level < 9 ? 'gold' : 'diamond'
      }
    })
  },
  POINTS_HUNTER: {
    name: 'Points Hunter',
    description: 'Accumulate points through activities',
    icon: '💰',
    category: 'collection',
    levels: Array.from({ length: 10 }, (_, i) => {
      const level = i + 1
      return {
        level,
        targetValue: Math.floor(50 * Math.pow(1.1, level - 1)), // 50, 55, 61, 67, 74, 81, 89, 98, 108, 119 points
        pointsReward: level * 40, // 40, 80, 120, 160, 200, 240, 280, 320, 360, 400
        title: level === 10 ? 'Points Legend' : level >= 8 ? 'Points Master' : level >= 5 ? 'Points Expert' : level >= 3 ? 'Points Collector' : 'Points Starter',
        badgeColor: level < 3 ? 'bronze' : level < 6 ? 'silver' : level < 9 ? 'gold' : 'diamond'
      }
    })
  },
  ACHIEVEMENT_HUNTER: {
    name: 'Achievement Hunter',
    description: 'Complete various achievements',
    icon: '🏆',
    category: 'collection',
    levels: Array.from({ length: 10 }, (_, i) => {
      const level = i + 1
      return {
        level,
        targetValue: Math.floor(1 * Math.pow(1.1, level - 1)), // 1, 1, 2, 2, 3, 3, 4, 4, 5, 5 achievements
        pointsReward: level * 50, // 50, 100, 150, 200, 250, 300, 350, 400, 450, 500
        title: level === 10 ? 'Achievement Legend' : level >= 8 ? 'Achievement Master' : level >= 5 ? 'Achievement Expert' : level >= 3 ? 'Achievement Collector' : 'Achievement Starter',
        badgeColor: level < 3 ? 'bronze' : level < 6 ? 'silver' : level < 9 ? 'gold' : 'diamond'
      }
    })
  }
}

// GET /api/achievements/social - Get user's all achievements (now includes all categories)
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const conn = await getConnection()
    const userId = session.user.id

    // Get user's current stats for all categories
    const [userStats] = await conn.execute(`
      SELECT
        u.id,
        u.follower_count,
        u.following_count,
        u.post_count,
        u.comment_count,
        u.forum_post_count,
        u.forum_comment_count,
        u.recipe_count,
        u.active_days_count,
        u.active_hours_count,
        u.points as user_points,
        (SELECT COUNT(*) FROM user_border WHERE user_id = u.id) as border_count,
        (SELECT COUNT(*) FROM user_achievement_progress WHERE user_id = u.id) as achievement_count
      FROM user u
      WHERE u.id = ?
    `, [userId]) as any

    if (userStats.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const stats = userStats[0]

    // Get user's achievement progress
    const [userAchievements] = await conn.execute(`
      SELECT achievement_type, current_level, current_value, completed_levels, claimed_levels, updated_at
      FROM user_achievement_progress
      WHERE user_id = ?
    `, [userId]) as any

    const achievementProgress = new Map()
    userAchievements.forEach(ua => {
      const completedLevels = ua.completed_levels ? JSON.parse(ua.completed_levels) : []
      const claimedLevels = ua.claimed_levels ? JSON.parse(ua.claimed_levels) : []
      achievementProgress.set(ua.achievement_type, {
        ...ua,
        completed_levels: completedLevels,
        claimed_levels: claimedLevels
      })
    })

    // Calculate achievements for all categories
    const achievements = []

    Object.entries(ALL_ACHIEVEMENTS).forEach(([type, config]) => {
      let currentValue = 0

      switch (type) {
        case 'POST_MASTER':
          currentValue = stats.post_count || 0
          break
        case 'COMMENTATOR':
          currentValue = stats.comment_count || 0
          break
        case 'SOCIALITE':
          currentValue = stats.follower_count || 0
          break
        case 'FORUM_EXPLORER':
          currentValue = stats.forum_post_count || 0
          break
        case 'DISCUSSION_MASTER':
          currentValue = stats.forum_comment_count || 0
          break
        case 'FORUM_LEGEND':
          // Placeholder for likes received - we need to implement likes system
          currentValue = 0
          break
        case 'RECIPE_NOVICE':
          currentValue = stats.recipe_count || 0
          break
        case 'CULINARY_ARTIST':
          // Placeholder for recipe likes - we need to implement recipe likes system
          currentValue = 0
          break
        case 'MATCHA_MASTER':
          // Placeholder for matcha recipes - we need to implement recipe categories
          currentValue = 0
          break
        case 'DAILY_VISITOR':
          currentValue = stats.active_days_count || 0
          break
        case 'ACTIVE_USER':
          currentValue = stats.active_hours_count || 0
          break
        case 'COMMUNITY_HELPER':
          // Placeholder for helpful actions - we need to implement this tracking
          currentValue = 0
          break
        case 'TREND_SETTER':
          // Placeholder for trending posts - we need to implement trending system
          currentValue = 0
          break
        case 'BORDER_COLLECTOR':
          currentValue = stats.border_count || 0
          break
        case 'POINTS_HUNTER':
          currentValue = Math.floor((stats.user_points || 0) / 100)
          break
        case 'ACHIEVEMENT_HUNTER':
          currentValue = stats.achievement_count || 0
          break
      }

      const progress = achievementProgress.get(type)
      const currentLevel = progress?.current_level || 0
      const completedLevels = progress?.completed_levels || []

      config.levels.forEach((level) => {
        const isCompleted = completedLevels.includes(level.level)
        const isCurrentLevel = level.level === currentLevel + 1
        const progressPercentage = Math.min((currentValue / level.targetValue) * 100, 100)

        achievements.push({
          id: `${type}_${level.level}`,
          type,
          title: `${config.name} - Level ${level.level}`,
          description: `${config.description} - Reach ${level.targetValue}`,
          targetValue: level.targetValue,
          currentValue,
          isCompleted,
          isCurrentLevel,
          progressPercentage,
          level: level.level,
          rewards: {
            points: level.pointsReward,
            title: level.title,
            badgeColor: level.badgeColor,
            icon: config.icon
          },
          category: config.category,
          completedAt: isCompleted ? progress?.updated_at : null
        })
      })
    })

    return NextResponse.json({
      success: true,
      achievements,
      userStats: {
        posts: stats.post_count || 0,
        comments: stats.comment_count || 0,
        followers: stats.follower_count || 0,
        following: stats.following_count || 0,
        forumPosts: stats.forum_post_count || 0,
        forumComments: stats.forum_comment_count || 0,
        recipes: stats.recipe_count || 0,
        borders: stats.border_count || 0,
        activeDays: stats.active_days_count || 0,
        activeHours: stats.active_hours_count || 0,
        points: stats.user_points || 0,
        achievementsCompleted: stats.achievement_count || 0
      }
    })

  } catch (error) {
    console.error("Error fetching achievements:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// POST /api/achievements/social/check - Check and update achievements
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { action, data } = await req.json()
    const userId = session.user.id

    const conn = await getConnection()

    // Update user stats based on action
    let updateField = null
    let achievementType = null

    switch (action) {
      case 'post_created':
        updateField = 'post_count'
        achievementType = 'POST_MASTER'
        break
      case 'comment_added':
        updateField = 'comment_count'
        achievementType = 'COMMENTATOR'
        break
      case 'follower_gained':
        updateField = 'follower_count'
        achievementType = 'SOCIALITE'
        break
      case 'forum_post_created':
        updateField = 'forum_post_count'
        achievementType = 'FORUM_EXPLORER'
        break
      case 'forum_comment_added':
        updateField = 'forum_comment_count'
        achievementType = 'DISCUSSION_MASTER'
        break
      case 'recipe_created':
        updateField = 'recipe_count'
        achievementType = 'RECIPE_NOVICE'
        break
      case 'border_collected':
        achievementType = 'BORDER_COLLECTOR'
        break
      case 'daily_visit':
        updateField = 'active_days_count'
        achievementType = 'DAILY_VISITOR'
        break
      case 'active_hours':
        updateField = 'active_hours_count'
        achievementType = 'ACTIVE_USER'
        break
      case 'follow_added':
        // For FRIEND_COLLECTOR - we don't need to update a field, just check achievement
        achievementType = 'FRIEND_COLLECTOR'
        break
      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }

    // Update user stats if needed
    if (updateField) {
      await conn.execute(`
        UPDATE user SET ${updateField} = ${updateField} + 1 WHERE id = ?
      `, [userId])
    }

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
    if (!stats) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Get current achievement progress
    const [currentProgress] = await conn.execute(`
      SELECT current_level, current_value, completed_levels
      FROM user_achievement_progress
      WHERE user_id = ? AND achievement_type = ?
    `, [userId, achievementType]) as any

    let progress = currentProgress[0] || {
      current_level: 0,
      current_value: 0,
      completed_levels: []
    }

    let currentValue = 0
    switch (achievementType) {
      case 'POST_MASTER':
        currentValue = stats.post_count || 0
        break
      case 'COMMENTATOR':
        currentValue = stats.comment_count || 0
        break
      case 'SOCIALITE':
        currentValue = stats.follower_count || 0
        break
      case 'FORUM_EXPLORER':
        currentValue = stats.forum_post_count || 0
        break
      case 'DISCUSSION_MASTER':
        currentValue = stats.forum_comment_count || 0
        break
      case 'RECIPE_NOVICE':
        currentValue = stats.recipe_count || 0
        break
      case 'BORDER_COLLECTOR':
        currentValue = stats.border_count || 0
        break
      case 'DAILY_VISITOR':
        currentValue = stats.active_days_count || 0
        break
      case 'ACTIVE_USER':
        currentValue = stats.active_hours_count || 0
        break
    }

    const achievementConfig = ALL_ACHIEVEMENTS[achievementType]
    if (!achievementConfig) {
      return NextResponse.json({ error: "Achievement type not found" }, { status: 404 })
    }

    const newAchievements = []

    // Check for completed levels
    achievementConfig.levels.forEach((level) => {
      const completedLevels = Array.isArray(progress.completed_levels) ? progress.completed_levels : []
      if (!completedLevels.includes(level.level) && currentValue >= level.targetValue) {
        newAchievements.push({
          type: achievementType,
          level: level.level,
          rewards: level
        })
      }
    })

    // Update progress if new achievements
    if (newAchievements.length > 0) {
      const completedLevels = Array.isArray(progress.completed_levels) ? [...progress.completed_levels] : []
      const newCompletedLevels = [...completedLevels, ...newAchievements.map(a => a.level)]
      const newLevel = Math.max(...newCompletedLevels)

      await conn.execute(`
        INSERT INTO user_achievement_progress (id, user_id, achievement_type, current_level, current_value, completed_levels, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, NOW())
        ON DUPLICATE KEY UPDATE
        current_level = VALUES(current_level),
        current_value = VALUES(current_value),
        completed_levels = VALUES(completed_levels),
        updated_at = NOW()
      `, [
        `ap_${userId}_${achievementType}_${Date.now()}`,
        userId,
        achievementType,
        newLevel,
        currentValue,
        JSON.stringify(newCompletedLevels)
      ])

      // Award points for new achievements
      const totalPoints = newAchievements.reduce((sum, a) => sum + a.rewards.pointsReward, 0)

      await conn.execute(
        'UPDATE user SET points = points + ? WHERE id = ?',
        [totalPoints, userId]
      )

      // Add activity logs
      for (const achievement of newAchievements) {
        await conn.execute(`
          INSERT INTO activity (id, user_id, type, title, description, metadata, createdAt)
          VALUES (?, ?, ?, ?, ?, ?, NOW())
        `, [
          `act_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          userId,
          'ACHIEVEMENT_UNLOCKED',
          `${achievementConfig.name} Level ${achievement.level}`,
          `You've unlocked ${achievementConfig.name} Level ${achievement.level}!`,
          JSON.stringify({
            type: achievementType,
            level: achievement.level,
            rewards: achievement.rewards,
            currentValue,
            targetValue: achievement.rewards.targetValue
          })
        ])
      }

      return NextResponse.json({
        success: true,
        newAchievements,
        totalPointsAwarded: totalPoints,
        currentStats: {
          posts: stats.post_count || 0,
          comments: stats.comment_count || 0,
          followers: stats.follower_count || 0,
          forumPosts: stats.forum_post_count || 0,
          forumComments: stats.forum_comment_count || 0,
          recipes: stats.recipe_count || 0,
          borders: stats.border_count || 0,
          activeDays: stats.active_days_count || 0,
          activeHours: stats.active_hours_count || 0,
          points: stats.points || 0
        }
      })
    }

    return NextResponse.json({
      success: true,
      newAchievements: [],
      currentStats: {
        posts: stats.post_count || 0,
        comments: stats.comment_count || 0,
        followers: stats.follower_count || 0,
        forumPosts: stats.forum_post_count || 0,
        forumComments: stats.forum_comment_count || 0,
        recipes: stats.recipe_count || 0,
        borders: stats.border_count || 0,
        activeDays: stats.active_days_count || 0,
        activeHours: stats.active_hours_count || 0,
        points: stats.points || 0
      }
    })

  } catch (error) {
    console.error("Error checking achievements:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}