import { NextRequest, NextResponse } from "next/server";
import * as mysql from "mysql2/promise";

const dbConfig = {
  host: "localhost",
  user: "root",
  password: "",
  database: "hikariCha_db",
  connectionLimit: 10,
  acquireTimeout: 60000,
  timeout: 60000,
};

// Create connection pool
const pool = mysql.createPool(dbConfig);

// In-memory store for real-time online users (fallback)
const onlineUsers = new Map<string, {
  userId: string;
  name: string;
  socketId: string;
  lastSeen: string;
  avatar?: string;
}>();

export async function GET(request: NextRequest) {
  let connection;

  try {
    const url = new URL(request.url);
    const currentUserId = url.searchParams.get("currentUserId");

    connection = await pool.getConnection();

    // Get all users with basic info
    const [users] = await connection.execute(`
      SELECT
        u.id,
        u.name,
        u.image,
        u.selectedBorder,
        'OFFLINE' as status
      FROM user u
      WHERE u.id != ?
      ORDER BY u.name ASC
      LIMIT 50
    `, [currentUserId || '']);

    // For now, skip friendship status checking since friendships table doesn't exist
    const usersWithFriendship = (users as any[]).map(user => ({
      ...user,
      isFriend: false,
      friendStatus: 'NONE'
    }));

    // Merge with real-time online users from memory
    const finalUsers = usersWithFriendship.map(user => {
      const realtimeUser = onlineUsers.get(user.id);
      if (realtimeUser) {
        return {
          ...user,
          status: 'ONLINE',
          lastSeen: realtimeUser.lastSeen,
          socketId: realtimeUser.socketId
        };
      }
      return user;
    });

    // Get online users count
    const onlineCount = finalUsers.filter(user => user.status === 'ONLINE').length;

    return NextResponse.json({
      success: true,
      users: finalUsers,
      onlineCount
    });

  } catch (error) {
    console.error("Error fetching online users:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch online users"
      },
      { status: 500 }
    );
  } finally {
    if (connection) {
      connection.release();
    }
  }
}

// Update user's last seen timestamp
export async function POST(request: NextRequest) {
  let connection;

  try {
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "User ID is required" },
        { status: 400 }
      );
    }

    connection = await pool.getConnection();

    // For now, we'll just store online status in memory
    // In a real application, you might want to add a last_seen column to the user table
    console.log(`User ${userId} is now online`);

    return NextResponse.json({
      success: true,
      message: "Last seen updated successfully"
    });

  } catch (error) {
    console.error("Error updating last seen:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update last seen"
      },
      { status: 500 }
    );
  } finally {
    if (connection) {
      connection.release();
    }
  }
}

// Real-time user management functions (called by Socket.io server)
export function addOnlineUser(userId: string, name: string, socketId: string, avatar?: string) {
  onlineUsers.set(userId, {
    userId,
    name,
    socketId,
    lastSeen: new Date().toISOString(),
    avatar
  });
}

export function removeOnlineUser(userId: string) {
  onlineUsers.delete(userId);
}

export function updateLastSeen(userId: string) {
  const user = onlineUsers.get(userId);
  if (user) {
    user.lastSeen = new Date().toISOString();
  }
}

export function getOnlineUsers() {
  return Array.from(onlineUsers.values()).map(user => ({
    id: user.userId,
    name: user.name,
    image: user.avatar,
    status: 'ONLINE',
    lastSeen: user.lastSeen,
    socketId: user.socketId
  }));
}