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

  try {
    const { searchParams } = new URL(request.url)
    const timeRange = searchParams.get('timeRange') || 'day' // day, week, month
    const limit = parseInt(searchParams.get('limit') || '10')

    connection = await mysql.createConnection(dbConfig)

    // Calculate time condition
    let timeCondition = ''
    switch (timeRange) {
      case 'hour':
        timeCondition = 'AND sp.createdAt >= DATE_SUB(NOW(), INTERVAL 1 HOUR)'
        break
      case 'day':
        timeCondition = 'AND sp.createdAt >= DATE_SUB(NOW(), INTERVAL 24 HOUR)'
        break
      case 'week':
        timeCondition = 'AND sp.createdAt >= DATE_SUB(NOW(), INTERVAL 7 DAY)'
        break
      case 'month':
        timeCondition = 'AND sp.createdAt >= DATE_SUB(NOW(), INTERVAL 30 DAY)'
        break
    }

    // Extract hashtags from post content
    const query = `
      SELECT
        hashtag,
        COUNT(*) as mentionCount,
        SUM(likesCount) as totalLikes,
        SUM(commentsCount) as totalComments,
        COUNT(DISTINCT authorId) as uniqueUsers,
        AVG(likesCount) as avgEngagement
      FROM (
        SELECT
          sp.id,
          sp.authorId,
          sp.likesCount,
          sp.commentsCount,
          TRIM(SUBSTRING_INDEX(SUBSTRING_INDEX(sp.content, '#', -1), ' ', 1)) as hashtag
        FROM social_post sp
        WHERE sp.content LIKE '%#%'
        AND sp.content REGEXP '#[a-zA-Z0-9_]+'
        ${timeCondition}
      ) as hashtag_posts
      WHERE hashtag != ''
      AND LENGTH(hashtag) > 1
      AND hashtag REGEXP '^[a-zA-Z0-9_]+$'
      GROUP BY hashtag
      HAVING mentionCount >= 1
      ORDER BY
        mentionCount DESC,
        totalLikes DESC,
        totalComments DESC
      LIMIT ?
    `

    const [rows] = await connection.execute(query, [limit])
    const topics = rows as any[]

    // Calculate trending score
    const topicsWithScore = topics.map(topic => ({
      hashtag: topic.hashtag,
      mentionCount: topic.mentionCount,
      totalLikes: parseInt(topic.totalLikes) || 0,
      totalComments: parseInt(topic.totalComments) || 0,
      uniqueUsers: topic.uniqueUsers,
      avgEngagement: parseFloat(topic.avgEngagement || 0),
      trendingScore: (
        (topic.mentionCount * 3) +
        (parseInt(topic.totalLikes) || 0) +
        (parseInt(topic.totalComments) || 0) +
        (topic.uniqueUsers * 2)
      )
    }))

    // Sort by trending score
    topicsWithScore.sort((a, b) => b.trendingScore - a.trendingScore)

    return NextResponse.json({
      success: true,
      data: {
        topics: topicsWithScore,
        timeRange,
        totalTopics: topicsWithScore.length
      }
    })

  } catch (error) {
    console.error('Error fetching trending topics:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch trending topics' },
      { status: 500 }
    )
  } finally {
    if (connection) {
      await connection.end()
    }
  }
}