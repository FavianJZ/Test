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

// GET /api/achievements/rewards - Get available rewards for user
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId') || session.user.id

    const conn = await getConnection()

    // Get user points
    const [userPoints] = await conn.execute(
      'SELECT points FROM user WHERE id = ?',
      [userId]
    ) as any

    const currentPoints = userPoints[0]?.points || 0

    // Get available rewards (you can customize this based on your reward system)
    const rewards = [
      {
        id: 'reward_1',
        type: 'border',
        name: 'Golden Border',
        description: 'Exclusive golden border for your profile picture',
        value: 'Golden Frame',
        rarity: 'legendary',
        isUnlocked: false,
        requiredPoints: 1000,
        currentPoints: currentPoints,
        imageUrl: '/borders/gold-border.png'
      },
      {
        id: 'reward_2',
        type: 'border',
        name: 'Silver Border',
        description: 'Elegant silver border for your profile picture',
        value: 'Silver Frame',
        rarity: 'epic',
        isUnlocked: false,
        requiredPoints: 750,
        currentPoints: currentPoints,
        imageUrl: '/borders/silver-border.png'
      },
      {
        id: 'reward_3',
        type: 'title',
        name: 'Master Chef',
        description: 'Special title displayed on your profile',
        value: 'Master Chef',
        rarity: 'rare',
        isUnlocked: false,
        requiredPoints: 500,
        currentPoints: currentPoints
      },
      {
        id: 'reward_4',
        type: 'points',
        name: 'Points Booster',
        description: 'Get 500 bonus points instantly',
        value: 500,
        rarity: 'common',
        isUnlocked: false,
        requiredPoints: 200,
        currentPoints: currentPoints
      },
      {
        id: 'reward_5',
        type: 'badge',
        name: 'Early Supporter',
        description: 'Exclusive badge for early supporters',
        value: 'Early Supporter Badge',
        rarity: 'legendary',
        isUnlocked: false,
        requiredPoints: 1500,
        currentPoints: currentPoints,
        imageUrl: '/badges/early-supporter.png'
      }
    ]

    // Check which rewards are already unlocked
    const [unlockedRewards] = await conn.execute(
      'SELECT reward_id FROM user_reward WHERE user_id = ?',
      [userId]
    ) as any

    const unlockedRewardIds = new Set(unlockedRewards.map(r => r.reward_id))

    rewards.forEach(reward => {
      reward.isUnlocked = unlockedRewardIds.has(reward.id)
    })

    return NextResponse.json({
      success: true,
      rewards,
      userPoints: currentPoints
    })

  } catch (error) {
    console.error("Error fetching rewards:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}