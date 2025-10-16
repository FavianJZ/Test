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

// Get user's following list
export async function GET(request: NextRequest) {
  const connection = await mysql.createConnection(dbConfig)

  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'following' // 'following' or 'followers'
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    let query = ''
    let params: any[] = []

    if (type === 'following') {
      // Get users that current user is following
      query = `
        SELECT
          u.id,
          u.name,
          u.image as avatar,
          u.selectedBorder as border,
          u.bio,
          u.followerCount,
          u.followingCount,
          u.postCount,
          f.createdAt as followedAt,
          CASE WHEN fr.id IS NOT NULL THEN true ELSE false END as isFollowingBack
        FROM user u
        INNER JOIN user_follow f ON f.followerId = ? AND f.followingId = u.id
        LEFT JOIN user_follow fr ON fr.followerId = u.id AND fr.followingId = ?
        WHERE u.id != ?
        ORDER BY f.createdAt DESC
        LIMIT ? OFFSET ?
      `
      params = [session.user.id, session.user.id, session.user.id, limit, offset]
    } else {
      // Get users that follow current user
      query = `
        SELECT
          u.id,
          u.name,
          u.image as avatar,
          u.selectedBorder as border,
          u.bio,
          u.followerCount,
          u.followingCount,
          u.postCount,
          f.createdAt as followedAt,
          CASE WHEN fr.id IS NOT NULL THEN true ELSE false END as isFollowing
        FROM user u
        INNER JOIN user_follow f ON f.followingId = ? AND f.followerId = u.id
        LEFT JOIN user_follow fr ON fr.followerId = ? AND fr.followingId = u.id
        WHERE u.id != ?
        ORDER BY f.createdAt DESC
        LIMIT ? OFFSET ?
      `
      params = [session.user.id, session.user.id, session.user.id, limit, offset]
    }

    const [rows] = await connection.execute(query, params)
    const users = rows as any[]

    return NextResponse.json({
      success: true,
      data: users.map(user => ({
        id: user.id,
        name: user.name,
        avatar: user.avatar,
        border: user.border,
        bio: user.bio,
        followerCount: user.followerCount || 0,
        followingCount: user.followingCount || 0,
        postCount: user.postCount || 0,
        followedAt: user.followedAt,
        isFollowing: type === 'followers' ? user.isFollowing : true,
        isFollowingBack: type === 'following' ? user.isFollowingBack : false
      }))
    })
  } catch (error) {
    console.error('Error fetching following/followers:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch following/followers' },
      { status: 500 }
    )
  } finally {
    await connection.end()
  }
}

// Follow/unfollow a user
export async function POST(request: NextRequest) {
  const connection = await mysql.createConnection(dbConfig)

  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { targetUserId } = body

    if (!targetUserId || targetUserId === session.user.id) {
      return NextResponse.json(
        { success: false, error: 'Invalid target user' },
        { status: 400 }
      )
    }

    // Check if already following
    const [existing] = await connection.execute(
      `SELECT id FROM user_follow
       WHERE followerId = ? AND followingId = ?`,
      [session.user.id, targetUserId]
    )

    const isFollowing = (existing as any[]).length > 0

    if (isFollowing) {
      // Unfollow - remove follow relationship
      await connection.execute(
        `DELETE FROM user_follow
         WHERE followerId = ? AND followingId = ?`,
        [session.user.id, targetUserId]
      )

      // Update follower counts for both old and new systems
      await connection.execute(
        'UPDATE user SET followerCount = GREATEST(followerCount - 1, 0), follower_count = GREATEST(follower_count - 1, 0) WHERE id = ?',
        [targetUserId]
      )
      await connection.execute(
        'UPDATE user SET followingCount = GREATEST(followingCount - 1, 0), following_count = GREATEST(following_count - 1, 0) WHERE id = ?',
        [session.user.id]
      )

      return NextResponse.json({
        success: true,
        data: { isFollowing: false }
      })
    } else {
      // Follow - add follow relationship
      const followId = `follow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      await connection.execute(
        'INSERT INTO user_follow (id, followerId, followingId) VALUES (?, ?, ?)',
        [followId, session.user.id, targetUserId]
      )

      // Update follower counts for both old and new systems
      await connection.execute(
        'UPDATE user SET followerCount = followerCount + 1, follower_count = follower_count + 1 WHERE id = ?',
        [targetUserId]
      )
      await connection.execute(
        'UPDATE user SET followingCount = followingCount + 1, following_count = following_count + 1 WHERE id = ?',
        [session.user.id]
      )

      // Trigger achievement check for SOCIALITE (target user) and FRIEND_COLLECTOR (current user)
      try {
        // For the target user who gained a follower
        const targetUserResponse = await fetch(`${process.env.NEXTAUTH_URL}/api/achievements/social/check`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'follower_gained',
            data: { followerId: session.user.id, targetUserId }
          })
        })

        // For the current user who followed someone (for FRIEND_COLLECTOR)
        const currentUserResponse = await fetch(`${process.env.NEXTAUTH_URL}/api/achievements/social/check`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Cookie': request.headers.get('cookie') || ''
          },
          body: JSON.stringify({
            action: 'follow_added',
            data: { targetUserId, followId }
          })
        })

        if (targetUserResponse.ok) {
          const result = await targetUserResponse.json()
          console.log('Target user achievement check result:', result)
        }

        if (currentUserResponse.ok) {
          const result = await currentUserResponse.json()
          console.log('Current user achievement check result:', result)
        }
      } catch (achievementError) {
        console.error('Error checking achievements:', achievementError)
        // Don't fail the follow if achievement check fails
      }

      return NextResponse.json({
        success: true,
        data: { isFollowing: true }
      })
    }
  } catch (error) {
    console.error('Error following/unfollowing user:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to follow/unfollow user' },
      { status: 500 }
    )
  } finally {
    await connection.end()
  }
}