import { prisma } from './prisma'
import { BorderRarity, UnlockType, PointType, AchievementType } from '@prisma/client'

export interface BorderWithUnlockStatus {
  id: string
  name: string
  description: string | null
  imageUrl: string
  price: number | null
  rarity: BorderRarity
  isActive: boolean
  sortOrder: number
  unlocked: boolean
  unlockType?: UnlockType
  unlockedAt?: Date | null
  pricePaid?: number | null
}

export interface PurchaseBorderRequest {
  borderId: string
  userId: string
}

export interface PointTransactionRequest {
  userId: string
  type: PointType
  amount: number
  description?: string
  metadata?: any
}

class BorderService {
  /**
   * Get all available borders with unlock status for a user
   */
  async getAllBordersWithUnlockStatus(userId: string): Promise<BorderWithUnlockStatus[]> {
    const borders = await prisma.border.findMany({
      where: {
        isActive: true
      },
      orderBy: [
        { sortOrder: 'asc' },
        { rarity: 'asc' },
        { name: 'asc' }
      ]
    })

    const userUnlocks = await prisma.borderUnlock.findMany({
      where: { userId },
      select: {
        borderId: true,
        unlockType: true,
        unlockedAt: true,
        pricePaid: true
      }
    })

    const unlockedBorderIds = new Set(userUnlocks.map(unlock => unlock.borderId))
    const unlockMap = new Map(userUnlocks.map(unlock => [unlock.borderId, unlock]))

    return borders.map(border => ({
      ...border,
      unlocked: unlockedBorderIds.has(border.id) || border.name === 'default',
      ...(unlockedBorderIds.has(border.id) && unlockMap.get(border.id))
    }))
  }

  /**
   * Get user's current points balance
   */
  async getUserPoints(userId: string): Promise<number> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { points: true }
    })

    return user?.points || 0
  }

  /**
   * Purchase a border with points
   */
  async purchaseBorder(request: PurchaseBorderRequest): Promise<{
    success: boolean
    message: string
    border?: BorderWithUnlockStatus
    newPointsBalance?: number
  }> {
    const { borderId, userId } = request

    try {
      // Get border and user info
      const [border, user] = await Promise.all([
        prisma.border.findUnique({
          where: { id: borderId }
        }),
        prisma.user.findUnique({
          where: { id: userId },
          select: { points: true }
        })
      ])

      if (!border) {
        return { success: false, message: 'Border tidak ditemukan' }
      }

      if (!border.isActive) {
        return { success: false, message: 'Border tidak tersedia' }
      }

      if (!border.price || border.price <= 0) {
        return { success: false, message: 'Border ini tidak bisa dibeli dengan poin' }
      }

      if (!user) {
        return { success: false, message: 'User tidak ditemukan' }
      }

      if (user.points < border.price) {
        return {
          success: false,
          message: `Poin tidak cukup. Diperlukan ${border.price} poin, Anda punya ${user.points} poin`
        }
      }

      // Check if already unlocked
      const existingUnlock = await prisma.borderUnlock.findUnique({
        where: {
          userId_borderId: {
            userId,
            borderId
          }
        }
      })

      if (existingUnlock) {
        return { success: false, message: 'Border ini sudah Anda miliki' }
      }

      // Perform transaction
      const result = await prisma.$transaction(async (tx) => {
        // Deduct points
        await tx.user.update({
          where: { id: userId },
          data: {
            points: {
              decrement: border.price
            }
          }
        })

        // Create border unlock
        const borderUnlock = await tx.borderUnlock.create({
          data: {
            userId,
            borderId,
            unlockType: 'PURCHASE',
            pricePaid: border.price
          }
        })

        // Create point transaction record
        await tx.pointTransaction.create({
          data: {
            userId,
            type: 'SPENT',
            amount: -border.price,
            description: `Membeli border ${border.name}`,
            metadata: {
              borderId,
              borderName: border.name,
              purchaseType: 'border'
            }
          }
        })

        return borderUnlock
      })

      // Get updated user points
      const updatedUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { points: true }
      })

      const borderWithStatus = await this.getBorderWithUnlockStatus(borderId, userId)

      return {
        success: true,
        message: `Berhasil membeli border ${border.name}!`,
        border: borderWithStatus,
        newPointsBalance: updatedUser?.points || 0
      }

    } catch (error) {
      console.error('Error purchasing border:', error)
      return { success: false, message: 'Terjadi kesalahan saat membeli border' }
    }
  }

  /**
   * Unlock border via achievement
   */
  async unlockBorderViaAchievement(
    userId: string,
    borderId: string,
    achievementType: AchievementType
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Check if border exists
      const border = await prisma.border.findUnique({
        where: { id: borderId }
      })

      if (!border) {
        return { success: false, message: 'Border tidak ditemukan' }
      }

      // Check if already unlocked
      const existingUnlock = await prisma.borderUnlock.findUnique({
        where: {
          userId_borderId: {
            userId,
            borderId
          }
        }
      })

      if (existingUnlock) {
        return { success: false, message: 'Border ini sudah dibuka' }
      }

      // Create border unlock
      await prisma.borderUnlock.create({
        data: {
          userId,
          borderId,
          unlockType: 'ACHIEVEMENT'
        }
      })

      // Create activity record
      await prisma.activity.create({
        data: {
          userId,
          type: 'BADGE_EARNED',
          title: `Border dibuka: ${border.name}`,
          description: `Border ${border.name} berhasil dibuka melalui achievement`,
          metadata: {
            borderId,
            borderName: border.name,
            achievementType,
            rarity: border.rarity
          }
        }
      })

      return {
        success: true,
        message: `Border ${border.name} berhasil dibuka melalui achievement!`
      }

    } catch (error) {
      console.error('Error unlocking border via achievement:', error)
      return { success: false, message: 'Terjadi kesalahan saat membuka border' }
    }
  }

  /**
   * Add points to user account
   */
  async addPoints(request: PointTransactionRequest): Promise<{
    success: boolean
    message: string
    newBalance?: number
  }> {
    const { userId, type, amount, description, metadata } = request

    if (amount <= 0) {
      return { success: false, message: 'Jumlah poin harus lebih dari 0' }
    }

    try {
      const result = await prisma.$transaction(async (tx) => {
        // Update user points
        const updatedUser = await tx.user.update({
          where: { id: userId },
          data: {
            points: {
              increment: amount
            }
          }
        })

        // Create transaction record
        await tx.pointTransaction.create({
          data: {
            userId,
            type,
            amount,
            description: description || `Poin ditambahkan (${type})`,
            metadata
          }
        })

        // Create activity record for earned points
        if (type === 'EARNED' || type === 'ADMIN_GIVEN') {
          await tx.activity.create({
            data: {
              userId,
              type: 'PROFILE_UPDATE',
              title: `Poin ditambahkan: +${amount}`,
              description: description || `Anda mendapatkan ${amount} poin`,
              metadata
            }
          })
        }

        return updatedUser.points
      })

      return {
        success: true,
        message: `Berhasil menambahkan ${amount} poin`,
        newBalance: result
      }

    } catch (error) {
      console.error('Error adding points:', error)
      return { success: false, message: 'Terjadi kesalahan saat menambahkan poin' }
    }
  }

  /**
   * Get user's transaction history
   */
  async getUserPointTransactions(userId: string, limit = 20): Promise<any[]> {
    return await prisma.pointTransaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit
    })
  }

  /**
   * Get user's border unlocks
   */
  async getUserBorderUnlocks(userId: string): Promise<any[]> {
    return await prisma.borderUnlock.findMany({
      where: { userId },
      include: {
        border: true
      },
      orderBy: { unlockedAt: 'desc' }
    })
  }

  /**
   * Select a border for user profile
   */
  async selectUserBorder(userId: string, borderId: string): Promise<{
    success: boolean
    message: string
  }> {
    try {
      // Check if user has unlocked this border
      const unlock = await prisma.borderUnlock.findUnique({
        where: {
          userId_borderId: {
            userId,
            borderId
          }
        }
      })

      // Allow default border even if not in unlock table
      const border = await prisma.border.findUnique({
        where: { id: borderId }
      })

      if (!border) {
        return { success: false, message: 'Border tidak ditemukan' }
      }

      if (border.name !== 'default' && !unlock) {
        return { success: false, message: 'Anda belum memiliki border ini' }
      }

      // Update user's selected border
      await prisma.user.update({
        where: { id: userId },
        data: { selectedBorder: borderId }
      })

      return {
        success: true,
        message: `Border ${border.name} berhasil dipilih`
      }

    } catch (error) {
      console.error('Error selecting border:', error)
      return { success: false, message: 'Terjadi kesalahan saat memilih border' }
    }
  }

  /**
   * Get border with unlock status for a specific border
   */
  private async getBorderWithUnlockStatus(borderId: string, userId: string): Promise<BorderWithUnlockStatus | null> {
    const border = await prisma.border.findUnique({
      where: { id: borderId }
    })

    if (!border) return null

    const unlock = await prisma.borderUnlock.findUnique({
      where: {
        userId_borderId: {
          userId,
          borderId
        }
      }
    })

    return {
      ...border,
      unlocked: !!unlock || border.name === 'default',
      ...(unlock && {
        unlockType: unlock.unlockType,
        unlockedAt: unlock.unlockedAt,
        pricePaid: unlock.pricePaid
      })
    }
  }

  /**
   * Initialize default borders in database
   */
  async initializeDefaultBorders(): Promise<void> {
    const defaultBorders = [
      {
        name: 'default',
        description: 'Border default untuk semua user',
        imageUrl: '/borders/default.svg',
        price: null,
        rarity: 'COMMON' as BorderRarity,
        sortOrder: 0
      },
      {
        name: 'Bronze',
        description: 'Border bronze - achievement: FIRST_FORUM_POST',
        imageUrl: '/borders/bronze.svg',
        price: null,
        rarity: 'COMMON' as BorderRarity,
        sortOrder: 10
      },
      {
        name: 'Silver',
        description: 'Border silver - achievement: FORUM_REGULAR',
        imageUrl: '/borders/silver.svg',
        price: null,
        rarity: 'RARE' as BorderRarity,
        sortOrder: 20
      },
      {
        name: 'Gold',
        description: 'Border gold - achievement: RECIPE_CREATOR',
        imageUrl: '/borders/gold.svg',
        price: 500,
        rarity: 'EPIC' as BorderRarity,
        sortOrder: 30
      },
      {
        name: 'Crystal',
        description: 'Border crystal - achievement: SOCIAL_BUTTERFLY',
        imageUrl: '/borders/crystal.svg',
        price: 1000,
        rarity: 'EPIC' as BorderRarity,
        sortOrder: 40
      },
      {
        name: 'Diamond',
        description: 'Border diamond - achievement: BORDER_COLLECTOR',
        imageUrl: '/borders/diamond.svg',
        price: 2000,
        rarity: 'LEGENDARY' as BorderRarity,
        sortOrder: 50
      }
    ]

    for (const borderData of defaultBorders) {
      await prisma.border.upsert({
        where: { name: borderData.name },
        update: borderData,
        create: borderData
      })
    }
  }
}

export const borderService = new BorderService()