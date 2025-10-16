import { dbService } from "./db-raw"
import { borderService } from "./border-service"

// Achievement types (mimicking enum from Prisma)
export type AchievementType =
  | "FIRST_FORUM_POST"
  | "FORUM_REGULAR"
  | "RECIPE_CREATOR"
  | "SOCIAL_BUTTERFLY"
  | "EARLY_ADOPTER"
  | "PURCHASE_MASTER"
  | "BORDER_COLLECTOR"
  | "POINTS_COLLECTOR"
  | "DAILY_VISITOR"
  | "RECIPE_MASTER"
  | "FORUM_EXPERT"
  | "COMMENTATOR_PRO"
  | "ACTIVE_MEMBER"
  | "FRIEND_CONNECTOR"
  | "HELPFUL_MEMBER"
  | "DISCUSSION_STARTER"

export interface AchievementConfig {
  type: AchievementType
  title: string
  description: string
  targetValue: number
  rewards: {
    points?: number
    borderUnlocks?: string[]
    badges?: string[]
  }
}

export const ACHIEVEMENTS_CONFIG: AchievementConfig[] = [
  {
    type: "FIRST_FORUM_POST",
    title: "Poster Pertama",
    description: "Buat postingan forum pertama Anda",
    targetValue: 1,
    rewards: {
      points: 10,
      borderUnlocks: ["Bronze"]
    }
  },
  {
    type: "FORUM_REGULAR",
    title: "Pembicara Aktif",
    description: "Buat 10 postingan forum",
    targetValue: 10,
    rewards: {
      points: 50,
      borderUnlocks: ["Silver"]
    }
  },
  {
    type: "SOCIAL_BUTTERFLY",
    title: "Pendengar Baik",
    description: "Buat 20 komentar di forum",
    targetValue: 20,
    rewards: {
      points: 40,
      borderUnlocks: ["Crystal"]
    }
  },
  {
    type: "EARLY_ADOPTER",
    title: "Early Adopter",
    description: "Bergabung dalam minggu pertama",
    targetValue: 1,
    rewards: {
      points: 25,
      borderUnlocks: ["Bronze"]
    }
  },
  {
    type: "BORDER_COLLECTOR",
    title: "Border Collector",
    description: "Kumpulkan semua border",
    targetValue: 6,
    rewards: {
      points: 200,
      borderUnlocks: ["Diamond"]
    }
  },
  {
    type: "POINTS_COLLECTOR",
    title: "Poin Hunter",
    description: "Kumpulkan 1000 poin",
    targetValue: 1000,
    rewards: {
      points: 100,
      borderUnlocks: ["Diamond"]
    }
  },
  {
    type: "DAILY_VISITOR",
    title: "Daily Visitor",
    description: "Login 7 hari berturut-turut",
    targetValue: 7,
    rewards: {
      points: 50,
      borderUnlocks: ["Silver"]
    }
  },
  {
    type: "FORUM_EXPERT",
    title: "Forum Expert",
    description: "Buat 100 postingan forum",
    targetValue: 100,
    rewards: {
      points: 300,
      borderUnlocks: ["Diamond"]
    }
  },
  {
    type: "COMMENTATOR_PRO",
    title: "Commentator Pro",
    description: "Buat 100 komentar",
    targetValue: 100,
    rewards: {
      points: 200,
      borderUnlocks: ["Crystal"]
    }
  },
  {
    type: "ACTIVE_MEMBER",
    title: "Active Member",
    description: "Aktif selama 30 hari",
    targetValue: 30,
    rewards: {
      points: 100,
      borderUnlocks: ["Gold"]
    }
  },
  // New forum-specific achievements
  {
    type: "FRIEND_CONNECTOR",
    title: "Konektor Pertemanan",
    description: "Buat 5 koneksi pertemanan",
    targetValue: 5,
    rewards: {
      points: 30,
      borderUnlocks: ["Silver"]
    }
  },
  {
    type: "DISCUSSION_STARTER",
    title: "Pemdiskusi",
    description: "Buat 10 thread diskusi baru",
    targetValue: 10,
    rewards: {
      points: 60,
      borderUnlocks: ["Gold"]
    }
  },
  {
    type: "HELPFUL_MEMBER",
    title: "Anggota Bermanfaat",
    description: "Dapatkan 50 like di komentar",
    targetValue: 50,
    rewards: {
      points: 80,
      borderUnlocks: ["Crystal"]
    }
  }
]

export async function initializeAchievementsForUser(userId: string) {
  try {
    console.log('🏆 Initializing achievements for userId:', userId)
    const achievements = []
    const conn = await dbService.getConnection()

    for (const config of ACHIEVEMENTS_CONFIG) {
      const achievementId = `ach_${userId}_${config.type}`
      console.log('🎯 Processing achievement:', { achievementId, userId, type: config.type })

      try {
        // Use INSERT IGNORE to handle race conditions gracefully
        const result = await conn.execute(`
          INSERT IGNORE INTO achievement (
            id, userId, type, title, description,
            targetValue, currentValue, isCompleted,
            rewards, createdAt, updatedAt
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
        `, [
          achievementId,
          userId,
          config.type,
          config.title,
          config.description,
          config.targetValue,
          0,
          false,
          JSON.stringify(config.rewards)
        ])

        console.log('✅ Achievement insert result:', {
          achievementId,
          affectedRows: (result as any).affectedRows
        })

      } catch (insertError: any) {
        // Log detailed error for debugging
        console.error('❌ Achievement insert failed:', {
          achievementId,
          userId,
          type: config.type,
          error: insertError.message,
          sqlState: insertError.sqlState,
          errno: insertError.errno
        })

        // If it's a duplicate key error, continue gracefully
        if (insertError.errno === 1062) {
          console.log('⚠️ Duplicate achievement detected, continuing...')
          continue
        }

        // For other errors, re-throw
        throw insertError
      }

      achievements.push({
        id: achievementId,
        type: config.type,
        title: config.title,
        description: config.description,
        targetValue: config.targetValue,
        currentValue: 0,
        isCompleted: false
      })
    }

    console.log('🏅 Achievements initialization completed for userId:', userId)
    return achievements
  } catch (error) {
    console.error('💥 Error initializing achievements for userId:', userId, error)
    return []
  }
}

export async function updateAchievementProgress(
  userId: string,
  type: AchievementType,
  increment: number = 1
) {
  const config = ACHIEVEMENTS_CONFIG.find(a => a.type === type)
  if (!config) return null

  try {
    const achievementId = `ach_${userId}_${type}`
    const conn = await dbService.getConnection()

    // Get current achievement - also try to find by userId and type as fallback
    let achievementRows = await conn.execute(
      'SELECT * FROM achievement WHERE id = ?',
      [achievementId]
    ) as any

    // Fallback: check by userId and type combination (more robust)
    if (!achievementRows.length) {
      achievementRows = await conn.execute(
        'SELECT * FROM achievement WHERE userId = ? AND type = ?',
        [userId, type]
      ) as any
    }

    if (!achievementRows.length) {
      console.log(`⚠️ Achievement not found for userId: ${userId}, type: ${type}. Initializing...`)
      // Initialize this specific achievement only
      try {
        await conn.execute(`
          INSERT IGNORE INTO achievement (
            id, userId, type, title, description,
            targetValue, currentValue, isCompleted,
            rewards, createdAt, updatedAt
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
        `, [
          achievementId,
          userId,
          config.type,
          config.title,
          config.description,
          config.targetValue,
          0,
          false,
          JSON.stringify(config.rewards)
        ])

        // Try to get it again
        const newRows = await conn.execute(
          'SELECT * FROM achievement WHERE id = ?',
          [achievementId]
        ) as any
        achievementRows = newRows

        if (!achievementRows.length) {
          console.error(`❌ Failed to create achievement for userId: ${userId}, type: ${type}`)
          return null
        }
      } catch (error) {
        console.error(`❌ Error creating achievement for userId: ${userId}, type: ${type}`, error)
        return null
      }
    }

    const achievement = achievementRows[0]

    if (achievement.isCompleted) return achievement

    const newCurrentValue = Math.min(achievement.currentValue + increment, config.targetValue)
    const isCompleted = newCurrentValue >= config.targetValue

    // Update achievement progress
    await conn.execute(`
      UPDATE achievement
      SET currentValue = ?, isCompleted = ?, completedAt = ?, updatedAt = NOW()
      WHERE id = ?
    `, [newCurrentValue, isCompleted, isCompleted ? new Date() : null, achievementId])

    // If achievement is completed, give rewards
    if (isCompleted && !achievement.isCompleted) {
      await grantAchievementRewards(userId, config)

      // Log activity
      await conn.execute(`
        INSERT INTO activities (userId, type, title, description, createdAt)
        VALUES (?, ?, ?, ?, NOW())
      `, [
        userId,
        "BADGE_EARNED",
        `Achievement Unlocked: ${config.title}`,
        config.description
      ])
    }

    return {
      ...achievement,
      currentValue: newCurrentValue,
      isCompleted,
      completedAt: isCompleted ? new Date() : null
    }
  } catch (error) {
    console.error('Error updating achievement progress:', error)
    return null
  }
}

export async function grantAchievementRewards(userId: string, config: AchievementConfig) {
  try {
    // Grant points using border service
    if (config.rewards.points) {
      await borderService.addPoints({
        userId,
        type: 'EARNED',
        amount: config.rewards.points,
        description: `Achievement reward: ${config.title}`,
        metadata: {
          achievementType: config.type,
          achievementTitle: config.title
        }
      })
    }

    // Unlock borders using border service
    if (config.rewards.borderUnlocks) {
      await Promise.all(
        config.rewards.borderUnlocks.map(async (borderName) => {
          // Find the border in database
          const conn = await dbService.getConnection()
          const [borderRows] = await conn.execute(
            'SELECT id FROM border WHERE name = ?',
            [borderName]
          ) as any

          if (borderRows.length > 0) {
            const border = borderRows[0]
            await borderService.unlockBorderViaAchievement(userId, border.id, config.type)
          }
        })
      )
    }

    // Grant badges (could be implemented later)
    if (config.rewards.badges) {
      // TODO: Implement badge system
    }
  } catch (error) {
    console.error('Error granting achievement rewards:', error)
  }
}

export async function getUserAchievements(userId: string) {
  try {
    const conn = await dbService.getConnection()
    const [rows] = await conn.execute(
      'SELECT * FROM achievement WHERE userId = ? ORDER BY createdAt ASC',
      [userId]
    ) as any
    return rows
  } catch (error) {
    console.error('Error getting user achievements:', error)
    return []
  }
}

export async function getUserUnlockedBorders(userId: string) {
  try {
    // Use border service instead of old ProfileBorder model
    const borders = await borderService.getAllBordersWithUnlockStatus(userId)

    // Return only unlocked borders
    return borders.filter(border => border.unlocked)
  } catch (error) {
    console.error('Error getting user unlocked borders:', error)
    return []
  }
}

export async function trackActivity(userId: string, activityType: string, increment: number = 1) {
  try {
    // Map activity types to achievement types
    const activityToAchievementMap: { [key: string]: AchievementType } = {
      'FORUM_POST': 'FORUM_REGULAR',
      'FORUM_COMMENT': 'SOCIAL_BUTTERFLY',
      'FORUM_THREAD_CREATED': 'DISCUSSION_STARTER',
      'FRIEND_ADDED': 'FRIEND_CONNECTOR',
      'COMMENT_LIKED': 'HELPFUL_MEMBER',
      'PROFILE_UPDATE': 'ACTIVE_MEMBER',
      'USER_REGISTERED': 'EARLY_ADOPTER'
    }

    const achievementType = activityToAchievementMap[activityType]
    if (achievementType) {
      await updateAchievementProgress(userId, achievementType, increment)
    }

    // Special handling for first forum post
    if (activityType === 'FORUM_POST') {
      const conn = await dbService.getConnection()
      const [existingPosts] = await conn.execute(
        'SELECT COUNT(*) as count FROM forum_threads WHERE author_id = ?',
        [userId]
      ) as any

      if (existingPosts[0].count === 1) {
        await updateAchievementProgress(userId, 'FIRST_FORUM_POST', 1)
      }
    }

    // Track border collector achievement
    if (activityType === 'BADGE_EARNED') {
      const userBorders = await getUserUnlockedBorders(userId)
      await updateAchievementProgress(userId, 'BORDER_COLLECTOR', userBorders.length)
    }

    // Track points collector achievement
    if (activityType === 'EARNED') {
      const userPoints = await borderService.getUserPoints(userId)
      await updateAchievementProgress(userId, 'POINTS_COLLECTOR', userPoints)
    }
  } catch (error) {
    console.error('Error tracking activity:', error)
  }
}

// Helper functions for forum activities
export async function onForumPostCreated(userId: string) {
  await trackActivity(userId, 'FORUM_POST', 1)
}

export async function onForumThreadCreated(userId: string) {
  await trackActivity(userId, 'FORUM_THREAD_CREATED', 1)
}

export async function onForumCommentCreated(userId: string) {
  await trackActivity(userId, 'FORUM_COMMENT', 1)
}

export async function onCommentLiked(userId: string) {
  await trackActivity(userId, 'COMMENT_LIKED', 1)
}

export async function onFriendAdded(userId: string) {
  await trackActivity(userId, 'FRIEND_ADDED', 1)
}

export async function onUserRegistered(userId: string) {
  await trackActivity(userId, 'USER_REGISTERED', 1)
}