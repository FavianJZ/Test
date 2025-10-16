import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import * as mysql from 'mysql2/promise'

const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'hikariCha_db'
}

export async function GET(request: NextRequest) {
  const connection = await mysql.createConnection(dbConfig)

  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') || ''
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = parseInt(searchParams.get('offset') || '0')
    const type = searchParams.get('type') || 'posts' // posts, users, hashtags

    if (!query.trim()) {
      return NextResponse.json(
        { success: false, error: 'Search query is required' },
        { status: 400 }
      )
    }

    let results = []

    if (type === 'posts' || type === 'all') {
      // Search posts using LIKE query (fallback for no FULLTEXT index)
      const searchPattern = `%${query}%`
      const [posts] = await connection.execute(`
        SELECT sp.*,
               u.name as author_name,
               u.image as author_avatar,
               u.selectedBorder as author_border,
               (SELECT COUNT(*) FROM social_post WHERE authorId = sp.authorId) as author_posts,
               DATE_FORMAT(u.createdAt, '%d %b %Y') as author_joinDate,
               CASE
                 WHEN sp.content LIKE ? THEN 3
                 WHEN sp.content LIKE ? THEN 2
                 ELSE 1
               END as relevance_score
        FROM social_post sp
        LEFT JOIN user u ON sp.authorId COLLATE utf8mb4_unicode_ci = u.id COLLATE utf8mb4_unicode_ci
        WHERE sp.content LIKE ?
        ORDER BY relevance_score DESC, sp.createdAt DESC
        LIMIT ? OFFSET ?
      `, [searchPattern, searchPattern, searchPattern, limit, offset])

      const formattedPosts = (posts as any[]).map(post => ({
        type: 'post',
        id: post.id,
        content: post.content || '',
        authorId: post.authorId,
        author_name: post.author_name || 'Unknown',
        author_avatar: post.author_avatar,
        author_border: post.author_border,
        author_posts: post.author_posts || 0,
        author_joinDate: post.author_joinDate,
        media_urls: post.attachments ? JSON.parse(post.attachments) : undefined,
        likesCount: post.likesCount || 0,
        commentsCount: post.commentsCount || 0,
        sharesCount: post.sharesCount || 0,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
        relevance_score: post.relevance_score
      }))

      results = results.concat(formattedPosts)
    }

    if (type === 'users' || type === 'all') {
      // Search users using LIKE query (fallback for no FULLTEXT index)
      const searchPattern = `%${query}%`
      const [users] = await connection.execute(`
        SELECT u.id, u.name, u.image, u.selectedBorder, u.bio,
               (SELECT COUNT(*) FROM social_post WHERE authorId = u.id) as post_count,
               CASE
                 WHEN u.name LIKE ? THEN 3
                 WHEN u.bio LIKE ? THEN 2
                 ELSE 1
               END as relevance_score
        FROM user u
        WHERE u.name LIKE ? OR u.bio LIKE ?
        ORDER BY relevance_score DESC
        LIMIT ? OFFSET ?
      `, [searchPattern, searchPattern, searchPattern, searchPattern, limit, offset])

      const formattedUsers = (users as any[]).map(user => ({
        type: 'user',
        id: user.id,
        name: user.name,
        avatar: user.image,
        border: user.selectedBorder,
        bio: user.bio,
        post_count: user.post_count || 0,
        relevance_score: user.relevance_score
      }))

      results = results.concat(formattedUsers)
    }

    // Sort by relevance score
    results.sort((a, b) => b.relevance_score - a.relevance_score)

    return NextResponse.json({
      success: true,
      data: results,
      meta: {
        query,
        type,
        limit,
        offset,
        count: results.length
      }
    })
  } catch (error) {
    console.error('Error searching social content:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to search content' },
      { status: 500 }
    )
  } finally {
    await connection.end()
  }
}