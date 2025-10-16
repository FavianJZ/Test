import * as mysql from 'mysql2/promise'

interface SocialPost {
  id: string
  content: string
  authorId: string
  attachments?: string
  visibility: string
  likesCount: number
  commentsCount: number
  sharesCount: number
  createdAt: string
  updatedAt: string
  // Computed fields
  author_name?: string
  author_avatar?: string
  author_border?: string
  author_posts?: number
  author_joinDate?: string
  media_urls?: string[]
}

interface SocialComment {
  id: string
  postId: string
  parentId?: string
  content: string
  authorId: string
  likesCount: number
  createdAt: string
  updatedAt: string
  // Computed fields
  author_name?: string
  author_avatar?: string
  author_border?: string
  author_posts?: number
  author_joinDate?: string
  likes?: number
  is_deleted?: boolean
  replies?: SocialComment[]
}

const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '', // Empty password for local development
  database: 'hikariCha_db'
}

export async function createSocialPost(data: {
  content: string
  author_id: string
  author_name?: string
  author_avatar?: string
  author_border?: string
  media_urls?: string[]
}): Promise<string> {
  // Force recompile
  const connection = await mysql.createConnection(dbConfig)

  try {
    const postId = `social_post_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    await connection.execute(`
      INSERT INTO social_post (
        id, authorId, content, attachments, visibility, likesCount, commentsCount, sharesCount, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `, [
      postId,
      data.author_id,
      data.content,
      data.media_urls ? JSON.stringify(data.media_urls) : null,
      'PUBLIC',
      0, // likesCount
      0, // commentsCount
      0  // sharesCount
    ])

    return postId
  } finally {
    await connection.end()
  }
}

export async function getSocialPosts(options: {
  limit?: number
  offset?: number
  author_id?: string
  includeDeleted?: boolean
} = {}): Promise<SocialPost[]> {
  const connection = await mysql.createConnection(dbConfig)

  try {
    let query = `
      SELECT sp.*,
             u.name as author_name,
             u.image as author_avatar,
             u.selectedBorder as author_border,
             (SELECT COUNT(*) FROM social_post WHERE authorId = sp.authorId) as author_posts,
             DATE_FORMAT(u.createdAt, '%d %b %Y') as author_joinDate
      FROM social_post sp
      LEFT JOIN user u ON sp.authorId COLLATE utf8mb4_unicode_ci = u.id COLLATE utf8mb4_unicode_ci
      WHERE 1=1
    `

    const params: any[] = []

    if (options.author_id) {
      query += ' AND sp.authorId = ?'
      params.push(options.author_id)
    }

    query += ' ORDER BY sp.createdAt DESC'

    if (options.limit) {
      query += ' LIMIT ?'
      params.push(options.limit)

      if (options.offset) {
        query += ' OFFSET ?'
        params.push(options.offset)
      }
    }

    const [rows] = await connection.execute(query, params)
    const posts = rows as any[]

    return posts.map(post => ({
      id: post.id,
      content: post.content || '',
      authorId: post.authorId,
      attachments: post.attachments,
      visibility: post.visibility,
      likesCount: post.likesCount || 0,
      commentsCount: post.commentsCount || 0,
      sharesCount: post.sharesCount || 0,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      // Computed fields for compatibility
      author_name: post.author_name || 'Unknown',
      author_avatar: post.author_avatar,
      author_border: post.author_border,
      author_posts: post.author_posts || 0,
      author_joinDate: post.author_joinDate,
      media_urls: post.attachments ? JSON.parse(post.attachments) : undefined,
      // Legacy fields for compatibility
      author_id: post.authorId,
      created_at: post.createdAt,
      updated_at: post.updatedAt,
      likes: post.likesCount,
      comments: post.commentsCount,
      shares: post.sharesCount,
      is_deleted: false
    }))
  } finally {
    await connection.end()
  }
}

export async function getSocialPostById(id: string): Promise<SocialPost | null> {
  const connection = await mysql.createConnection(dbConfig)

  try {
    const [rows] = await connection.execute(
      `SELECT sp.*,
              u.name as author_name,
              u.image as author_avatar,
              u.selectedBorder as author_border,
              (SELECT COUNT(*) FROM social_post WHERE authorId = sp.authorId) as author_posts,
              DATE_FORMAT(u.createdAt, '%d %b %Y') as author_joinDate
       FROM social_post sp
       LEFT JOIN user u ON sp.authorId COLLATE utf8mb4_unicode_ci = u.id COLLATE utf8mb4_unicode_ci
       WHERE sp.id = ?`,
      [id]
    )

    const posts = rows as any[]

    if (posts.length === 0) {
      return null
    }

    const post = posts[0]

    return {
      id: post.id,
      content: post.content || '',
      authorId: post.authorId,
      attachments: post.attachments,
      visibility: post.visibility,
      likesCount: post.likesCount || 0,
      commentsCount: post.commentsCount || 0,
      sharesCount: post.sharesCount || 0,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      // Computed fields for compatibility
      author_name: post.author_name || 'Unknown',
      author_avatar: post.author_avatar,
      author_border: post.author_border,
      author_posts: post.author_posts || 0,
      author_joinDate: post.author_joinDate,
      media_urls: post.attachments ? JSON.parse(post.attachments) : undefined,
      // Legacy fields for compatibility
      author_id: post.authorId,
      created_at: post.createdAt,
      updated_at: post.updatedAt,
      likes: post.likesCount,
      comments: post.commentsCount,
      shares: post.sharesCount,
      is_deleted: false
    }
  } finally {
    await connection.end()
  }
}

export async function deleteSocialPost(id: string, author_id: string): Promise<boolean> {
  const connection = await mysql.createConnection(dbConfig)

  try {
    const [result] = await connection.execute(
      'DELETE FROM social_post WHERE id = ? AND authorId = ?',
      [id, author_id]
    )

    return (result as any).affectedRows > 0
  } finally {
    await connection.end()
  }
}

export async function createSocialComment(data: {
  post_id: string
  parent_id?: string
  content: string
  author_id: string
  author_name: string
  author_avatar?: string
  author_border?: string
}): Promise<string> {
  const connection = await mysql.createConnection(dbConfig)

  try {
    const commentId = `post_comment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    await connection.execute(`
      INSERT INTO post_comment (
        id, postId, parentId, content, authorId, likesCount, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
    `, [
      commentId,
      data.post_id,
      data.parent_id || null,
      data.content,
      data.author_id,
      0 // likesCount
    ])

    // Update post comment count
    await connection.execute(
      'UPDATE social_post SET commentsCount = commentsCount + 1 WHERE id = ?',
      [data.post_id]
    )

    return commentId
  } finally {
    await connection.end()
  }
}

export async function getSocialComments(postId: string): Promise<SocialComment[]> {
  const connection = await mysql.createConnection(dbConfig)

  try {
    const [rows] = await connection.execute(`
      SELECT pc.*,
             u.name as author_name,
             u.image as author_avatar,
             u.selectedBorder as author_border,
             (SELECT COUNT(*) FROM social_post WHERE authorId = pc.authorId) as author_posts,
             DATE_FORMAT(u.createdAt, '%d %b %Y') as author_joinDate
      FROM post_comment pc
      LEFT JOIN user u ON pc.authorId COLLATE utf8mb4_unicode_ci = u.id COLLATE utf8mb4_unicode_ci
      WHERE pc.postId = ?
      ORDER BY pc.createdAt ASC
    `, [postId])

    const comments = rows as any[]

    // Convert to proper SocialComment format
    const formattedComments = comments.map(comment => ({
      id: comment.id,
      postId: comment.postId,
      parentId: comment.parentId,
      content: comment.content,
      authorId: comment.authorId,
      likesCount: comment.likesCount || 0,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
      // Computed fields for compatibility
      author_name: comment.author_name || 'Unknown',
      author_avatar: comment.author_avatar,
      author_border: comment.author_border,
      author_posts: comment.author_posts || 0,
      author_joinDate: comment.author_joinDate,
      likes: comment.likesCount,
      is_deleted: false,
      // Legacy fields for compatibility
      post_id: comment.postId,
      parent_id: comment.parentId,
      author_id: comment.authorId,
      created_at: comment.createdAt,
      updated_at: comment.updatedAt,
      replies: []
    }))

    // Build nested structure
    const topLevelComments: SocialComment[] = []
    const commentMap = new Map<string, SocialComment>()

    // First pass: create all comments and build map
    formattedComments.forEach(comment => {
      commentMap.set(comment.id, comment)
    })

    // Second pass: build hierarchy
    formattedComments.forEach(comment => {
      const commentWithChildren = commentMap.get(comment.id)!

      if (comment.parentId && commentMap.has(comment.parentId)) {
        const parent = commentMap.get(comment.parentId)!
        parent.replies!.push(commentWithChildren)
      } else {
        topLevelComments.push(commentWithChildren)
      }
    })

    return topLevelComments
  } finally {
    await connection.end()
  }
}

export async function likeSocialPost(userId: string, postId: string): Promise<boolean> {
  const connection = await mysql.createConnection(dbConfig)

  try {
    // Check if already liked using post_like table
    const [existing] = await connection.execute(
      'SELECT id FROM post_like WHERE userId = ? AND postId = ?',
      [userId, postId]
    )

    const isLiked = (existing as any[]).length > 0

    if (isLiked) {
      // Unlike - remove like
      await connection.execute(
        'DELETE FROM post_like WHERE userId = ? AND postId = ?',
        [userId, postId]
      )

      // Decrement like count
      await connection.execute(
        'UPDATE social_post SET likesCount = likesCount - 1 WHERE id = ?',
        [postId]
      )
    } else {
      // Like - add like
      const likeId = `like_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      await connection.execute(
        'INSERT INTO post_like (id, userId, postId) VALUES (?, ?, ?)',
        [likeId, userId, postId]
      )

      // Increment like count
      await connection.execute(
        'UPDATE social_post SET likesCount = likesCount + 1 WHERE id = ?',
        [postId]
      )
    }

    return !isLiked // Return new like status (true = liked, false = unliked)
  } finally {
    await connection.end()
  }
}

export async function unlikeSocialPost(userId: string, postId: string): Promise<void> {
  const connection = await mysql.createConnection(dbConfig)

  try {
    // Remove like from post_like table
    await connection.execute(
      'DELETE FROM post_like WHERE userId = ? AND postId = ?',
      [userId, postId]
    )

    // Decrement like count
    await connection.execute(
      'UPDATE social_post SET likesCount = likesCount - 1 WHERE id = ?',
      [postId]
    )
  } finally {
    await connection.end()
  }
}

export async function isSocialPostLiked(userId: string, postId: string): Promise<boolean> {
  const connection = await mysql.createConnection(dbConfig)

  try {
    const [rows] = await connection.execute(
      'SELECT id FROM post_like WHERE userId = ? AND postId = ?',
      [userId, postId]
    )

    return (rows as any[]).length > 0
  } finally {
    await connection.end()
  }
}

export async function shareSocialPost(userId: string, postId: string): Promise<boolean> {
  const connection = await mysql.createConnection(dbConfig)

  try {
    // Record the share
    await connection.execute(
      'INSERT INTO social_shares (userId, postId) VALUES (?, ?)',
      [userId, postId]
    )

    // Increment share count
    await connection.execute(
      'UPDATE social_post SET sharesCount = sharesCount + 1 WHERE id = ?',
      [postId]
    )

    return true
  } finally {
    await connection.end()
  }
}

export async function getTrendingPosts(options: {
  limit?: number
  timeRange?: 'hour' | 'day' | 'week' | 'month'
} = {}): Promise<SocialPost[]> {
  const connection = await mysql.createConnection(dbConfig)

  try {
    const { limit = 10, timeRange = 'day' } = options

    // Calculate time threshold based on timeRange
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

    const query = `
      SELECT sp.*,
             u.name as author_name,
             u.image as author_avatar,
             u.selectedBorder as author_border,
             (SELECT COUNT(*) FROM social_post WHERE authorId = sp.authorId) as author_posts,
             DATE_FORMAT(u.createdAt, '%d %b %Y') as author_joinDate,
             -- Calculate trending score
             (sp.likesCount * 3 + sp.commentsCount * 2 + sp.sharesCount * 1) /
             CASE
               WHEN sp.createdAt >= DATE_SUB(NOW(), INTERVAL 1 HOUR) THEN 1
               WHEN sp.createdAt >= DATE_SUB(NOW(), INTERVAL 6 HOUR) THEN 2
               WHEN sp.createdAt >= DATE_SUB(NOW(), INTERVAL 24 HOUR) THEN 4
               ELSE 8
             END as trending_score
      FROM social_post sp
      LEFT JOIN user u ON sp.authorId COLLATE utf8mb4_unicode_ci = u.id COLLATE utf8mb4_unicode_ci
      WHERE 1=1 ${timeCondition}
      ORDER BY trending_score DESC, sp.createdAt DESC
      LIMIT ?
    `

    const [rows] = await connection.execute(query, [limit])
    const posts = rows as any[]

    return posts.map(post => ({
      id: post.id,
      content: post.content || '',
      authorId: post.authorId,
      attachments: post.attachments,
      visibility: post.visibility,
      likesCount: post.likesCount || 0,
      commentsCount: post.commentsCount || 0,
      sharesCount: post.sharesCount || 0,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      // Computed fields for compatibility
      author_name: post.author_name || 'Unknown',
      author_avatar: post.author_avatar,
      author_border: post.author_border,
      author_posts: post.author_posts || 0,
      author_joinDate: post.author_joinDate,
      media_urls: post.attachments ? JSON.parse(post.attachments) : undefined,
      // Legacy fields for compatibility
      author_id: post.authorId,
      created_at: post.createdAt,
      updated_at: post.updatedAt,
      likes: post.likesCount,
      comments: post.commentsCount,
      shares: post.sharesCount,
      is_deleted: false
    }))
  } finally {
    await connection.end()
  }
}

export async function savePost(userId: string, postId: string): Promise<boolean> {
  const connection = await mysql.createConnection(dbConfig)

  try {
    // Check if already saved
    const [existing] = await connection.execute(
      'SELECT id FROM post_save WHERE userId = ? AND postId = ?',
      [userId, postId]
    )

    const isSaved = (existing as any[]).length > 0

    if (isSaved) {
      // Unsave - remove save
      await connection.execute(
        'DELETE FROM post_save WHERE userId = ? AND postId = ?',
        [userId, postId]
      )
      return false
    } else {
      // Save - add save
      const saveId = `save_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      await connection.execute(
        'INSERT INTO post_save (id, userId, postId) VALUES (?, ?, ?)',
        [saveId, userId, postId]
      )
      return true
    }
  } finally {
    await connection.end()
  }
}

export async function isPostSaved(userId: string, postId: string): Promise<boolean> {
  const connection = await mysql.createConnection(dbConfig)

  try {
    const [rows] = await connection.execute(
      'SELECT id FROM post_save WHERE userId = ? AND postId = ?',
      [userId, postId]
    )

    return (rows as any[]).length > 0
  } finally {
    await connection.end()
  }
}

export async function getSavedPosts(userId: string, options: {
  limit?: number
  offset?: number
} = {}): Promise<SocialPost[]> {
  const connection = await mysql.createConnection(dbConfig)

  try {
    const { limit = 10, offset = 0 } = options

    const query = `
      SELECT sp.*,
             u.name as author_name,
             u.image as author_avatar,
             u.selectedBorder as author_border,
             (SELECT COUNT(*) FROM social_post WHERE authorId = sp.authorId) as author_posts,
             DATE_FORMAT(u.createdAt, '%d %b %Y') as author_joinDate
      FROM post_save ps
      INNER JOIN social_post sp ON ps.postId = sp.id
      LEFT JOIN user u ON sp.authorId COLLATE utf8mb4_unicode_ci = u.id COLLATE utf8mb4_unicode_ci
      WHERE ps.userId = ?
      ORDER BY ps.createdAt DESC
      LIMIT ? OFFSET ?
    `

    const [rows] = await connection.execute(query, [userId, limit, offset])
    const posts = rows as any[]

    return posts.map(post => ({
      id: post.id,
      content: post.content || '',
      authorId: post.authorId,
      attachments: post.attachments,
      visibility: post.visibility,
      likesCount: post.likesCount || 0,
      commentsCount: post.commentsCount || 0,
      sharesCount: post.sharesCount || 0,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      // Computed fields for compatibility
      author_name: post.author_name || 'Unknown',
      author_avatar: post.author_avatar,
      author_border: post.author_border,
      author_posts: post.author_posts || 0,
      author_joinDate: post.author_joinDate,
      media_urls: post.attachments ? JSON.parse(post.attachments) : undefined,
      // Legacy fields for compatibility
      author_id: post.authorId,
      created_at: post.createdAt,
      updated_at: post.updatedAt,
      likes: post.likesCount,
      comments: post.commentsCount,
      shares: post.sharesCount,
      is_deleted: false
    }))
  } finally {
    await connection.end()
  }
}

export async function getFollowingPosts(userId: string, options: {
  limit?: number
  offset?: number
} = {}): Promise<SocialPost[]> {
  const connection = await mysql.createConnection(dbConfig)

  try {
    const { limit = 10, offset = 0 } = options

    const query = `
      SELECT sp.*,
             u.name as author_name,
             u.image as author_avatar,
             u.selectedBorder as author_border,
             (SELECT COUNT(*) FROM social_post WHERE authorId = sp.authorId) as author_posts,
             DATE_FORMAT(u.createdAt, '%d %b %Y') as author_joinDate,
             1 as isFromFollowing
      FROM social_post sp
      LEFT JOIN user u ON sp.authorId COLLATE utf8mb4_unicode_ci = u.id COLLATE utf8mb4_unicode_ci
      INNER JOIN friendship f ON (
        (f.user1Id = ? AND f.user2Id = sp.authorId) OR
        (f.user2Id = ? AND f.user1Id = sp.authorId)
      )
      WHERE sp.authorId != ?
      ORDER BY sp.createdAt DESC
      LIMIT ? OFFSET ?
    `

    const [rows] = await connection.execute(query, [userId, userId, userId, limit, offset])
    const posts = rows as any[]

    return posts.map(post => ({
      id: post.id,
      content: post.content || '',
      authorId: post.authorId,
      attachments: post.attachments,
      visibility: post.visibility,
      likesCount: post.likesCount || 0,
      commentsCount: post.commentsCount || 0,
      sharesCount: post.sharesCount || 0,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      // Computed fields for compatibility
      author_name: post.author_name || 'Unknown',
      author_avatar: post.author_avatar,
      author_border: post.author_border,
      author_posts: post.author_posts || 0,
      author_joinDate: post.author_joinDate,
      media_urls: post.attachments ? JSON.parse(post.attachments) : undefined,
      // Legacy fields for compatibility
      author_id: post.authorId,
      created_at: post.createdAt,
      updated_at: post.updatedAt,
      likes: post.likesCount,
      comments: post.commentsCount,
      shares: post.sharesCount,
      is_deleted: false,
      isFromFollowing: true
    }))
  } finally {
    await connection.end()
  }
}

export async function getPrioritizedFeed(userId: string, options: {
  limit?: number
  offset?: number
} = {}): Promise<SocialPost[]> {
  const connection = await mysql.createConnection(dbConfig)

  try {
    const { limit = 10, offset = 0 } = options

    // Get posts from followed users (prioritized)
    const followingPosts = await getFollowingPosts(userId, {
      limit: Math.ceil(limit * 0.5), // 50% from following
      offset: 0
    })

    // Get user's own posts (prioritized)
    const ownPostsQuery = `
      SELECT sp.*,
             u.name as author_name,
             u.image as author_avatar,
             u.selectedBorder as author_border,
             (SELECT COUNT(*) FROM social_post WHERE authorId = sp.authorId) as author_posts,
             DATE_FORMAT(u.createdAt, '%d %b %Y') as author_joinDate,
             1 as isFromFollowing,
             1 as isOwnPost
      FROM social_post sp
      LEFT JOIN user u ON sp.authorId COLLATE utf8mb4_unicode_ci = u.id COLLATE utf8mb4_unicode_ci
      WHERE sp.authorId = ?
      ORDER BY sp.createdAt DESC
      LIMIT ?
    `
    const [ownRows] = await connection.execute(ownPostsQuery, [userId, Math.ceil(limit * 0.2)])
    const ownPosts = (ownRows as any[]).map(post => ({
      id: post.id,
      content: post.content || '',
      authorId: post.authorId,
      attachments: post.attachments,
      visibility: post.visibility,
      likesCount: post.likesCount || 0,
      commentsCount: post.commentsCount || 0,
      sharesCount: post.sharesCount || 0,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      // Computed fields for compatibility
      author_name: post.author_name || 'Unknown',
      author_avatar: post.author_avatar,
      author_border: post.author_border,
      author_posts: post.author_posts || 0,
      author_joinDate: post.author_joinDate,
      media_urls: post.attachments ? JSON.parse(post.attachments) : undefined,
      // Legacy fields for compatibility
      author_id: post.authorId,
      created_at: post.createdAt,
      updated_at: post.updatedAt,
      likes: post.likesCount,
      comments: post.commentsCount,
      shares: post.sharesCount,
      is_deleted: false,
      isFromFollowing: true,
      isOwnPost: true
    }))

    // Get other posts (random/public)
    const otherPostsQuery = `
      SELECT sp.*,
             u.name as author_name,
             u.image as author_avatar,
             u.selectedBorder as author_border,
             (SELECT COUNT(*) FROM social_post WHERE authorId = sp.authorId) as author_posts,
             DATE_FORMAT(u.createdAt, '%d %b %Y') as author_joinDate,
             0 as isFromFollowing,
             0 as isOwnPost
      FROM social_post sp
      LEFT JOIN user u ON sp.authorId COLLATE utf8mb4_unicode_ci = u.id COLLATE utf8mb4_unicode_ci
      WHERE sp.authorId NOT IN (
        SELECT DISTINCT CASE
          WHEN f.user1Id = ? THEN f.user2Id
          ELSE f.user1Id
        END
        FROM friendship f
        WHERE f.user1Id = ? OR f.user2Id = ?
      )
      AND sp.authorId != ?
      ORDER BY sp.createdAt DESC
      LIMIT ? OFFSET ?
    `

    const [otherRows] = await connection.execute(otherPostsQuery, [
      userId, userId, userId, userId,
      Math.ceil(limit * 0.3) + offset, // 30% from others
      offset
    ])
    const otherPosts = otherRows as any[]

    const formattedOtherPosts = otherPosts.map(post => ({
      id: post.id,
      content: post.content || '',
      authorId: post.authorId,
      attachments: post.attachments,
      visibility: post.visibility,
      likesCount: post.likesCount || 0,
      commentsCount: post.commentsCount || 0,
      sharesCount: post.sharesCount || 0,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      // Computed fields for compatibility
      author_name: post.author_name || 'Unknown',
      author_avatar: post.author_avatar,
      author_border: post.author_border,
      author_posts: post.author_posts || 0,
      author_joinDate: post.author_joinDate,
      media_urls: post.attachments ? JSON.parse(post.attachments) : undefined,
      // Legacy fields for compatibility
      author_id: post.authorId,
      created_at: post.createdAt,
      updated_at: post.updatedAt,
      likes: post.likesCount,
      comments: post.commentsCount,
      shares: post.sharesCount,
      is_deleted: false,
      isFromFollowing: false,
      isOwnPost: false
    }))

    // Combine prioritized posts (following + own)
    const prioritizedPosts = [...followingPosts, ...ownPosts].sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )

    // Combine and interleave posts with slight randomization: 2 prioritized posts, 1 other post, repeat
    const prioritizedFeed: SocialPost[] = []
    let prioritizedIndex = 0
    let otherIndex = 0

    while (prioritizedFeed.length < limit && (prioritizedIndex < prioritizedPosts.length || otherIndex < formattedOtherPosts.length)) {
      // Add 2 prioritized posts (following + own posts combined by time)
      for (let i = 0; i < 2 && prioritizedIndex < prioritizedPosts.length && prioritizedFeed.length < limit; i++) {
        prioritizedFeed.push(prioritizedPosts[prioritizedIndex])
        prioritizedIndex++
      }

      // Add 1 other post with slight randomization
      if (otherIndex < formattedOtherPosts.length && prioritizedFeed.length < limit) {
        // 30% chance to add an extra other post for randomization
        if (Math.random() < 0.3 && otherIndex + 1 < formattedOtherPosts.length && prioritizedFeed.length + 1 < limit) {
          prioritizedFeed.push(formattedOtherPosts[otherIndex])
          otherIndex++
        }

        prioritizedFeed.push(formattedOtherPosts[otherIndex])
        otherIndex++
      }
    }

    return prioritizedFeed
  } finally {
    await connection.end()
  }
}