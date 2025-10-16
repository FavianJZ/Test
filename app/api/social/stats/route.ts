import { NextRequest, NextResponse } from 'next/server'
import * as mysql from 'mysql2/promise'

const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'hikariCha_db'
}

export async function GET(request: NextRequest) {
  let connection
  const { searchParams } = new URL(request.url)
  const timeRange = searchParams.get('timeRange') || 'all'

  try {
    connection = await mysql.createConnection(dbConfig)

    // Calculate time condition based on timeRange
    let timeCondition = ''
    let recentActivityTime = '24 HOUR' // Default for recent activity

    switch (timeRange) {
      case 'hour':
        timeCondition = 'AND createdAt >= DATE_SUB(NOW(), INTERVAL 1 HOUR)'
        recentActivityTime = '1 HOUR'
        break
      case 'day':
        timeCondition = 'AND createdAt >= DATE_SUB(NOW(), INTERVAL 24 HOUR)'
        recentActivityTime = '24 HOUR'
        break
      case 'week':
        timeCondition = 'AND createdAt >= DATE_SUB(NOW(), INTERVAL 7 DAY)'
        recentActivityTime = '7 DAY'
        break
      case 'month':
        timeCondition = 'AND createdAt >= DATE_SUB(NOW(), INTERVAL 30 DAY)'
        recentActivityTime = '30 DAY'
        break
      default:
        timeCondition = '' // All time
        recentActivityTime = '24 HOUR'
    }

    // Get popular statistics
    const [
      totalUsers,
      totalPosts,
      totalLikes,
      totalComments,
      topUsers,
      recentActivity
    ] = await Promise.all([
      // Total users
      connection.execute('SELECT COUNT(*) as count FROM user'),

      // Total posts
      connection.execute('SELECT COUNT(*) as count FROM social_post WHERE content IS NOT NULL AND content != ""'),

      // Total likes from post_like table (more accurate)
      connection.execute('SELECT COUNT(*) as total FROM post_like'),

      // Total comments from post_comment table (more accurate)
      connection.execute('SELECT COUNT(*) as total FROM post_comment'),

      // Top users by posts
      connection.execute(`
        SELECT
          u.id,
          u.name,
          u.image as avatar,
          u.selectedBorder as border,
          COUNT(sp.id) as postCount,
          SUM(sp.likesCount) as totalLikes,
          MAX(sp.createdAt) as lastPostDate
        FROM user u
        LEFT JOIN social_post sp ON u.id = sp.authorId
        GROUP BY u.id, u.name, u.image, u.selectedBorder
        HAVING postCount > 0
        ORDER BY postCount DESC, totalLikes DESC
        LIMIT 10
      `),

      // Recent activity (based on timeRange)
      connection.execute(`
        SELECT
          COUNT(*) as activityCount,
          SUM(CASE WHEN sp.likesCount > 0 THEN 1 ELSE 0 END) as postsWithLikes,
          SUM(CASE WHEN sp.commentsCount > 0 THEN 1 ELSE 0 END) as postsWithComments
        FROM social_post sp
        WHERE sp.createdAt >= DATE_SUB(NOW(), INTERVAL ${recentActivityTime})
      `)
    ])

    const stats = {
      totalUsers: (totalUsers as any[])[0]?.count || 0,
      totalPosts: (totalPosts as any[])[0]?.count || 0,
      totalLikes: (totalLikes as any[])[0]?.total || 0,
      totalComments: (totalComments as any[])[0]?.total || 0,
      topUsers: (topUsers as any[]).map(user => ({
        id: user.id,
        name: user.name,
        avatar: user.avatar,
        border: user.border,
        postCount: user.postCount,
        totalLikes: user.totalLikes || 0,
        lastPostDate: user.lastPostDate
      })),
      recentActivity: {
        activityCount: (recentActivity as any[])[0]?.activityCount || 0,
        postsWithLikes: (recentActivity as any[])[0]?.postsWithLikes || 0,
        postsWithComments: (recentActivity as any[])[0]?.postsWithComments || 0
      },
      engagementRate: (totalPosts as any[])[0]?.count > 0
        ? Math.round((((totalLikes as any[])[0]?.total || 0) + (totalComments as any[])[0]?.total || 0) / (totalPosts as any[])[0]?.count * 100) / 100
        : 0
    }

    return NextResponse.json({
      success: true,
      data: stats,
      meta: {
        timeRange,
        generatedAt: new Date().toISOString(),
        recentActivityTime
      }
    })

  } catch (error) {
    console.error('Error fetching social stats:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch social statistics' },
      { status: 500 }
    )
  } finally {
    if (connection) {
      await connection.end()
    }
  }
}