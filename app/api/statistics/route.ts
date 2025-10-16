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

// GET /api/statistics - Get comprehensive user statistics
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const conn = await getConnection()

    // Get user ID from email
    const [userRows] = await conn.execute(
      'SELECT id FROM user WHERE email = ?',
      [session.user.email]
    ) as any

    if (userRows.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const userId = userRows[0].id

    // Initialize statistics object
    const stats = {
      forum: {
        posts: 0,
        comments: 0,
        likes: 0
      },
      recipes: {
        created: 0,
        liked: 0
      },
      social: {
        posts: 0,
        comments: 0,
        likes: 0,
        shares: 0,
        friends: 0,
        followers: 0,
        following: 0
      },
      achievements: {
        unlocked: 0,
        total: 0,
        pointsEarned: 0
      },
      marketplace: {
        purchases: 0,
        reviews: 0,
        totalSpent: 0
      },
      chat: {
        messagesSent: 0,
        conversations: 0
      },
      profile: {
        views: 0,
        borderChanges: 0
      }
    }

    // Forum Statistics
    try {
      const [forumStats] = await conn.execute(`
        SELECT
          COUNT(DISTINCT f.id) as posts,
          COUNT(DISTINCT fc.id) as comments,
          COALESCE(SUM(f.likes_count), 0) as likes
        FROM user u
        LEFT JOIN forum f ON u.id = f.author_id
        LEFT JOIN forum_comment fc ON u.id = fc.author_id
        WHERE u.id = ?
      `, [userId]) as any

      if (forumStats.length > 0) {
        stats.forum.posts = forumStats[0].posts || 0
        stats.forum.comments = forumStats[0].comments || 0
        stats.forum.likes = forumStats[0].likes || 0
      }
    } catch (error) {
      console.error("Error fetching forum stats:", error)
    }

    // Recipe Statistics
    try {
      const [recipeStats] = await conn.execute(`
        SELECT
          COUNT(DISTINCT r.id) as created,
          COALESCE(
            (SELECT COUNT(*) FROM recipe_like rl WHERE rl.user_id = ?), 0
          ) as liked
        FROM user u
        LEFT JOIN recipe r ON u.id = r.author_id
        WHERE u.id = ?
      `, [userId, userId]) as any

      if (recipeStats.length > 0) {
        stats.recipes.created = recipeStats[0].created || 0
        stats.recipes.liked = recipeStats[0].liked || 0
      }
    } catch (error) {
      console.error("Error fetching recipe stats:", error)
    }

    // Social Statistics
    try {
      const [socialStats] = await conn.execute(`
        SELECT
          COUNT(DISTINCT sp.id) as posts,
          COUNT(DISTINCT pc.id) as comments,
          COALESCE(SUM(sp.likes_count), 0) as likes,
          COALESCE(SUM(sp.shares_count), 0) as shares,
          COALESCE(u.friend_count, 0) as friends,
          COALESCE(u.follower_count, 0) as followers,
          COALESCE(u.following_count, 0) as following
        FROM user u
        LEFT JOIN social_post sp ON u.id = sp.author_id
        LEFT JOIN post_comment pc ON u.id = pc.author_id
        WHERE u.id = ?
      `, [userId]) as any

      if (socialStats.length > 0) {
        stats.social.posts = socialStats[0].posts || 0
        stats.social.comments = socialStats[0].comments || 0
        stats.social.likes = socialStats[0].likes || 0
        stats.social.shares = socialStats[0].shares || 0
        stats.social.friends = socialStats[0].friends || 0
        stats.social.followers = socialStats[0].followers || 0
        stats.social.following = socialStats[0].following || 0
      }
    } catch (error) {
      console.error("Error fetching social stats:", error)
    }

    // Achievement Statistics
    try {
      const [achievementStats] = await conn.execute(`
        SELECT
          COUNT(DISTINCT ua.id) as unlocked,
          (SELECT COUNT(*) FROM achievement WHERE is_active = 1) as total,
          COALESCE(SUM(ua.points_awarded), 0) as pointsEarned
        FROM user u
        LEFT JOIN user_achievement ua ON u.id = ua.user_id
        WHERE u.id = ? AND ua.is_completed = 1
      `, [userId]) as any

      if (achievementStats.length > 0) {
        stats.achievements.unlocked = achievementStats[0].unlocked || 0
        stats.achievements.total = achievementStats[0].total || 0
        stats.achievements.pointsEarned = achievementStats[0].pointsEarned || 0
      }
    } catch (error) {
      console.error("Error fetching achievement stats:", error)
    }

    // Marketplace Statistics
    try {
      const [marketplaceStats] = await conn.execute(`
        SELECT
          COUNT(DISTINCT o.id) as purchases,
          COUNT(DISTINCT r.id) as reviews,
          COALESCE(SUM(o.total_amount), 0) as totalSpent
        FROM user u
        LEFT JOIN \`order\` o ON u.id = o.user_id
        LEFT JOIN review r ON u.id = r.user_id
        WHERE u.id = ? AND o.status = 'COMPLETED'
      `, [userId]) as any

      if (marketplaceStats.length > 0) {
        stats.marketplace.purchases = marketplaceStats[0].purchases || 0
        stats.marketplace.reviews = marketplaceStats[0].reviews || 0
        stats.marketplace.totalSpent = marketplaceStats[0].totalSpent || 0
      }
    } catch (error) {
      console.error("Error fetching marketplace stats:", error)
    }

    // Chat Statistics
    try {
      const [chatStats] = await conn.execute(`
        SELECT
          COUNT(DISTINCT m.id) as messagesSent,
          COUNT(DISTINCT cp.conversation_id) as conversations
        FROM user u
        LEFT JOIN conversation_participant cp ON u.id = cp.user_id
        LEFT JOIN message m ON u.id = m.sender_id
        WHERE u.id = ?
      `, [userId]) as any

      if (chatStats.length > 0) {
        stats.chat.messagesSent = chatStats[0].messagesSent || 0
        stats.chat.conversations = chatStats[0].conversations || 0
      }
    } catch (error) {
      console.error("Error fetching chat stats:", error)
    }

    // Profile Statistics
    try {
      const [profileStats] = await conn.execute(`
        SELECT
          COALESCE(u.profile_views, 0) as views,
          (SELECT COUNT(*) FROM activity a WHERE a.user_id = ? AND a.type = 'BORDER_SELECT') as borderChanges
        FROM user u
        WHERE u.id = ?
      `, [userId, userId]) as any

      if (profileStats.length > 0) {
        stats.profile.views = profileStats[0].views || 0
        stats.profile.borderChanges = profileStats[0].borderChanges || 0
      }
    } catch (error) {
      console.error("Error fetching profile stats:", error)
    }

    return NextResponse.json({
      success: true,
      statistics: stats,
      lastUpdated: new Date().toISOString()
    })

  } catch (error) {
    console.error("Statistics fetch error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}