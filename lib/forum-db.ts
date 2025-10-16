import mysql from 'mysql2/promise'
import { onForumThreadCreated, onForumCommentCreated, onCommentLiked } from './achievements'

interface Category {
  id: number
  slug: string
  name: string
  description?: string
  color: string
  icon?: string
  created_at: string
}

interface Thread {
  id: string
  title: string
  content: string
  excerpt?: string
  category_id: number
  author_id: string
  author_name: string
  author_avatar?: string
  author_border?: string
  views: number
  likes: number
  replies: number
  is_pinned: boolean
  is_locked: boolean
  is_deleted: boolean
  created_at: string
  updated_at: string
  last_reply_at?: string
  last_reply_by?: string
  category?: Category
}

interface Reply {
  id: string
  thread_id: string
  parent_id?: string
  content: string
  author_id: string
  author_name: string
  author_avatar?: string
  author_border?: string
  likes: number
  is_deleted: boolean
  created_at: string
  updated_at: string
  replies?: Reply[]
}

const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'hikaricha_db'
}

export async function getForumCategories(): Promise<Category[]> {
  const connection = await mysql.createConnection(dbConfig)

  try {
    const [rows] = await connection.execute(
      'SELECT * FROM forum_categories ORDER BY name ASC'
    )
    return rows as Category[]
  } finally {
    await connection.end()
  }
}

export async function getForumThreads(options: {
  category?: string
  limit?: number
  offset?: number
  includeDeleted?: boolean
} = {}): Promise<Thread[]> {
  const connection = await mysql.createConnection(dbConfig)

  try {
    let query = `
      SELECT
        t.*,
        c.slug as category_slug,
        c.name as category_name,
        c.color as category_color
      FROM forum_threads t
      JOIN forum_categories c ON t.category_id = c.id
      WHERE 1=1
    `

    const params: any[] = []

    if (options.category && options.category !== 'all') {
      query += ' AND c.slug = ?'
      params.push(options.category)
    }

    if (!options.includeDeleted) {
      query += ' AND t.is_deleted = FALSE'
    }

    query += ' ORDER BY t.is_pinned DESC, t.last_reply_at DESC, t.created_at DESC'

    if (options.limit) {
      query += ' LIMIT ?'
      params.push(options.limit)

      if (options.offset) {
        query += ' OFFSET ?'
        params.push(options.offset)
      }
    }

    const [rows] = await connection.execute(query, params)

    const threads = rows as any[]

    // Transform the data to match the expected format
    return threads.map(thread => ({
      id: thread.id,
      title: thread.title,
      content: thread.content,
      excerpt: thread.excerpt,
      category_id: thread.category_id,
      author_id: thread.author_id,
      author_name: thread.author_name,
      author_avatar: thread.author_avatar,
      author_border: thread.author_border,
      views: thread.views,
      likes: thread.likes,
      replies: thread.replies,
      is_pinned: Boolean(thread.is_pinned),
      is_locked: Boolean(thread.is_locked),
      is_deleted: Boolean(thread.is_deleted),
      created_at: thread.created_at,
      updated_at: thread.updated_at,
      last_reply_at: thread.last_reply_at,
      last_reply_by: thread.last_reply_by,
      category: {
        id: thread.category_id,
        slug: thread.category_slug,
        name: thread.category_name,
        color: thread.category_color
      }
    }))
  } finally {
    await connection.end()
  }
}

export async function getThreadById(id: string): Promise<Thread | null> {
  const connection = await mysql.createConnection(dbConfig)

  try {
    const [rows] = await connection.execute(`
      SELECT
        t.*,
        c.slug as category_slug,
        c.name as category_name,
        c.color as category_color
      FROM forum_threads t
      JOIN forum_categories c ON t.category_id = c.id
      WHERE t.id = ? AND t.is_deleted = FALSE
    `, [id])

    const threads = rows as any[]

    if (threads.length === 0) {
      return null
    }

    const thread = threads[0]

    // Increment view count
    await connection.execute(
      'UPDATE forum_threads SET views = views + 1 WHERE id = ?',
      [id]
    )

    return {
      id: thread.id,
      title: thread.title,
      content: thread.content,
      excerpt: thread.excerpt,
      category_id: thread.category_id,
      author_id: thread.author_id,
      author_name: thread.author_name,
      author_avatar: thread.author_avatar,
      author_border: thread.author_border,
      views: thread.views + 1, // Already incremented
      likes: thread.likes,
      replies: thread.replies,
      is_pinned: Boolean(thread.is_pinned),
      is_locked: Boolean(thread.is_locked),
      is_deleted: Boolean(thread.is_deleted),
      created_at: thread.created_at,
      updated_at: thread.updated_at,
      last_reply_at: thread.last_reply_at,
      last_reply_by: thread.last_reply_by,
      category: {
        id: thread.category_id,
        slug: thread.category_slug,
        name: thread.category_name,
        color: thread.category_color
      }
    }
  } finally {
    await connection.end()
  }
}

export async function getThreadReplies(threadId: string): Promise<Reply[]> {
  const connection = await mysql.createConnection(dbConfig)

  try {
    const [rows] = await connection.execute(`
      SELECT * FROM forum_replies
      WHERE thread_id = ? AND is_deleted = FALSE
      ORDER BY created_at ASC
    `, [threadId])

    const replies = rows as Reply[]

    // Build nested structure
    const topLevelReplies: Reply[] = []
    const replyMap = new Map<string, Reply>()

    // First pass: create all replies and build map
    replies.forEach(reply => {
      replyMap.set(reply.id, { ...reply, replies: [] })
    })

    // Second pass: build hierarchy
    replies.forEach(reply => {
      const replyWithChildren = replyMap.get(reply.id)!

      if (reply.parent_id && replyMap.has(reply.parent_id)) {
        const parent = replyMap.get(reply.parent_id)!
        parent.replies!.push(replyWithChildren)
      } else {
        topLevelReplies.push(replyWithChildren)
      }
    })

    return topLevelReplies
  } finally {
    await connection.end()
  }
}

export async function createThread(data: {
  title: string
  content: string
  excerpt?: string
  category_id: number
  author_id: string
}): Promise<string> {
  const connection = await mysql.createConnection(dbConfig)

  try {
    const threadId = `thread_${Date.now()}`

    await connection.execute(`
      INSERT INTO forum_threads (
        id, title, content, excerpt, category_id,
        author_id, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
    `, [
      threadId,
      data.title,
      data.content,
      data.excerpt || data.content.substring(0, 200) + '...',
      data.category_id,
      data.author_id
    ])

    // Track achievement progress
    try {
      await onForumThreadCreated(data.author_id)
    } catch (error) {
      console.error('Error tracking forum thread achievement:', error)
    }

    return threadId
  } finally {
    await connection.end()
  }
}

export async function createReply(data: {
  thread_id: string
  parent_id?: string
  content: string
  author_id: string
}): Promise<string> {
  const connection = await mysql.createConnection(dbConfig)

  try {
    const replyId = `reply_${Date.now()}`

    // Debug logging
    console.log('🔍 Debug createReply data:', {
      thread_id: data.thread_id,
      parent_id: data.parent_id,
      parent_id_type: typeof data.parent_id,
      parent_id_truthy: !!data.parent_id,
      parent_id_trimmed: data.parent_id?.trim(),
      final_parent_id: data.parent_id && data.parent_id.trim() ? data.parent_id.trim() : null
    })

    // Start transaction
    await connection.query('START TRANSACTION')

    try {
      const finalParentId = data.parent_id && data.parent_id.trim() ? data.parent_id.trim() : null

      // Insert reply
      await connection.execute(`
        INSERT INTO forum_replies (
          id, thread_id, parent_id, content,
          author_id, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, NOW(), NOW())
      `, [
        replyId,
        data.thread_id,
        finalParentId,
        data.content,
        data.author_id
      ])

      // Update thread reply count and last reply info
      await connection.execute(`
        UPDATE forum_threads
        SET replies = replies + 1,
            last_reply_at = NOW(),
            last_reply_by = ?
        WHERE id = ?
      `, [data.author_id, data.thread_id])

      await connection.query('COMMIT')

    // Track achievement progress
    try {
      await onForumCommentCreated(data.author_id)
    } catch (error) {
      console.error('Error tracking forum comment achievement:', error)
    }

    return replyId
    } catch (error) {
      await connection.query('ROLLBACK')
      throw error
    }
  } finally {
    await connection.end()
  }
}

export async function likeContent(userId: string, contentId: string, contentType: 'thread' | 'reply'): Promise<boolean> {
  const connection = await mysql.createConnection(dbConfig)

  try {
    // Start transaction
    await connection.query('START TRANSACTION')

    try {
      // Check if already liked
      const [existing] = await connection.execute(
        'SELECT id FROM forum_likes WHERE user_id = ? AND target_id = ? AND target_type = ?',
        [userId, contentId, contentType]
      )

      const isLiked = (existing as any[]).length > 0

      if (isLiked) {
        // Unlike
        await connection.execute(
          'DELETE FROM forum_likes WHERE user_id = ? AND target_id = ? AND target_type = ?',
          [userId, contentId, contentType]
        )

        // Decrement like count
        const table = contentType === 'thread' ? 'forum_threads' : 'forum_replies'
        await connection.execute(
          `UPDATE ${table} SET likes = likes - 1 WHERE id = ?`,
          [contentId]
        )
      } else {
        // Like
        await connection.execute(
          'INSERT INTO forum_likes (user_id, target_id, target_type) VALUES (?, ?, ?)',
          [userId, contentId, contentType]
        )

        // Increment like count
        const table = contentType === 'thread' ? 'forum_threads' : 'forum_replies'
        await connection.execute(
          `UPDATE ${table} SET likes = likes + 1 WHERE id = ?`,
          [contentId]
        )
      }

      await connection.query('COMMIT')

      // Track achievement progress for comment likes
      if (!isLiked && contentType === 'reply') {
        try {
          // Get the author of the reply that was liked
          const [replyRows] = await connection.execute(
            'SELECT author_id FROM forum_replies WHERE id = ?',
            [contentId]
          )

          if (replyRows.length > 0) {
            const replyAuthorId = replyRows[0].author_id
            await onCommentLiked(replyAuthorId)
          }
        } catch (error) {
          console.error('Error tracking comment like achievement:', error)
        }
      }

      return !isLiked // Return new like status (true = liked, false = unliked)
    } catch (error) {
      await connection.query('ROLLBACK')
      throw error
    }
  } finally {
    await connection.end()
  }
}

export async function isContentLiked(userId: string, contentId: string, contentType: 'thread' | 'reply'): Promise<boolean> {
  const connection = await mysql.createConnection(dbConfig)

  try {
    const [rows] = await connection.execute(
      'SELECT id FROM forum_likes WHERE user_id = ? AND target_id = ? AND target_type = ?',
      [userId, contentId, contentType]
    )

    return (rows as any[]).length > 0
  } finally {
    await connection.end()
  }
}