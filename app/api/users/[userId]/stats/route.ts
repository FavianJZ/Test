import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import * as mysql from 'mysql2/promise';

const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'hikariCha_db'
};

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  const connection = await mysql.createConnection(dbConfig);

  try {
    const { userId } = params;

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Get friend count from friendship table
    const [friendRows] = await connection.execute(
      'SELECT COUNT(*) as count FROM friendship WHERE user1Id = ? OR user2Id = ?',
      [userId, userId]
    );
    const friendCount = (friendRows as any[])[0].count;

    // Get follower and following counts from user_follow table (real-time)
    const [followerRows] = await connection.execute(
      'SELECT COUNT(*) as count FROM user_follow WHERE followingId = ?',
      [userId]
    );
    const followerCount = (followerRows as any[])[0].count;

    const [followingRows] = await connection.execute(
      'SELECT COUNT(*) as count FROM user_follow WHERE followerId = ?',
      [userId]
    );
    const followingCount = (followingRows as any[])[0].count;

    // Get post count from user table (cached count)
    const [userRows] = await connection.execute(
      'SELECT postCount FROM user WHERE id = ?',
      [userId]
    );
    const postCount = (userRows as any[])[0]?.postCount || 0;

    return NextResponse.json({
      friendCount,
      followerCount,
      followingCount,
      postCount
    });

  } catch (error) {
    console.error('Error fetching user stats:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      userId
    });
    return NextResponse.json(
      {
        error: 'Failed to fetch user stats',
        details: error instanceof Error ? error.message : 'Unknown error',
        userId
      },
      { status: 500 }
    );
  } finally {
    await connection.end();
  }
}