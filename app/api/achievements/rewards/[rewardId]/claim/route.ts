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

// POST /api/achievements/rewards/[rewardId]/claim - Claim a reward
export async function POST(
  req: NextRequest,
  { params }: { params: { rewardId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { rewardId } = params
    const userId = session.user.id

    const conn = await getConnection()

    // Get reward details (in a real app, this would come from a database table)
    const rewards = {
      'reward_1': { type: 'border', name: 'Golden Border', value: 'Golden Frame', requiredPoints: 1000 },
      'reward_2': { type: 'border', name: 'Silver Border', value: 'Silver Frame', requiredPoints: 750 },
      'reward_3': { type: 'title', name: 'Master Chef', value: 'Master Chef', requiredPoints: 500 },
      'reward_4': { type: 'points', name: 'Points Booster', value: 500, requiredPoints: 200 },
      'reward_5': { type: 'badge', name: 'Early Supporter', value: 'Early Supporter Badge', requiredPoints: 1500 }
    }

    const reward = rewards[rewardId as keyof typeof rewards]
    if (!reward) {
      return NextResponse.json({ error: "Reward not found" }, { status: 404 })
    }

    // Check if user already claimed this reward
    const [existingClaim] = await conn.execute(
      'SELECT id FROM user_reward WHERE user_id = ? AND reward_id = ?',
      [userId, rewardId]
    ) as any

    if (existingClaim.length > 0) {
      return NextResponse.json({ error: "Reward already claimed" }, { status: 400 })
    }

    // Get user current points
    const [userPoints] = await conn.execute(
      'SELECT points FROM user WHERE id = ?',
      [userId]
    ) as any

    const currentPoints = userPoints[0]?.points || 0

    // Check if user has enough points
    if (currentPoints < reward.requiredPoints) {
      return NextResponse.json({
        error: "Insufficient points",
        required: reward.requiredPoints,
        current: currentPoints
      }, { status: 400 })
    }

    // Start transaction
    await conn.beginTransaction()

    try {
      // Deduct points
      await conn.execute(
        'UPDATE user SET points = points - ? WHERE id = ?',
        [reward.requiredPoints, userId]
      )

      // Add reward to user's claimed rewards
      await conn.execute(
        'INSERT INTO user_reward (id, user_id, reward_id, reward_type, reward_value, claimed_at) VALUES (?, ?, ?, ?, ?, NOW())',
        [`ur_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, userId, rewardId, reward.type, reward.value]
      )

      // Handle specific reward types
      if (reward.type === 'border') {
        // Add border to user's collection
        await conn.execute(
          'INSERT INTO user_border (id, user_id, border_id, unlocked_at) VALUES (?, ?, ?, NOW()) ON DUPLICATE KEY UPDATE unlocked_at = NOW()',
          [`ub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, userId, rewardId]
        )
      } else if (reward.type === 'points') {
        // Add bonus points
        await conn.execute(
          'UPDATE user SET points = points + ? WHERE id = ?',
          [reward.value, userId]
        )
      }

      // Add activity log
      await conn.execute(
        'INSERT INTO activity (id, user_id, type, title, description, metadata, createdAt) VALUES (?, ?, ?, ?, ?, ?, NOW())',
          [`act_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, userId, 'REWARD_CLAIMED', `Reward ${reward.name} claimed`, `You claimed ${reward.name}`, JSON.stringify({ rewardId, rewardType: reward.type, rewardValue: reward.value })]
      )

      await conn.commit()

      // Get updated user points
      const [updatedPoints] = await conn.execute(
        'SELECT points FROM user WHERE id = ?',
        [userId]
      ) as any

      const newPointsBalance = updatedPoints[0]?.points || 0

      return NextResponse.json({
        success: true,
        message: `Reward ${reward.name} claimed successfully!`,
        newPointsBalance,
        reward: {
          id: rewardId,
          type: reward.type,
          name: reward.name,
          value: reward.value
        }
      })

    } catch (error) {
      await conn.rollback()
      throw error
    }

  } catch (error) {
    console.error("Error claiming reward:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}