import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptionsRaw } from '@/lib/auth-raw'
import { dbService } from '@/lib/db-raw'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptionsRaw)

    // Only allow admins to initialize borders, or allow if running locally
    if (!session?.user?.email || !session.user.email.includes('admin')) {
      // Check if running in development environment
      if (process.env.NODE_ENV === 'development') {
        console.log('⚠️ Running in development mode - allowing border initialization without admin check')
      } else {
        return NextResponse.json({ error: 'Unauthorized - Admin only' }, { status: 401 })
      }
    }

    // Initialize default borders
    const defaultBorders = [
      {
        id: 'default',
        name: 'Default',
        description: 'Border default untuk semua user',
        imageUrl: '/borders/default.svg',
        price: null,
        rarity: 'COMMON',
        isActive: true,
        sortOrder: 1
      },
      {
        id: 'bronze',
        name: 'Bronze',
        description: 'Border bronze untuk achievement pertama',
        imageUrl: '/borders/BronzeBorderProfile.png',
        price: null,
        rarity: 'COMMON',
        isActive: true,
        sortOrder: 10
      },
      {
        id: 'silver',
        name: 'Silver',
        description: 'Border silver untuk user aktif',
        imageUrl: '/borders/SilverBorderProfile.png',
        price: null,
        rarity: 'RARE',
        isActive: true,
        sortOrder: 20
      },
      {
        id: 'gold',
        name: 'Gold',
        description: 'Border gold untuk user premium',
        imageUrl: '/borders/GoldBorderProfile.png',
        price: 500,
        rarity: 'EPIC',
        isActive: true,
        sortOrder: 30
      },
      {
        id: 'diamond',
        name: 'Diamond',
        description: 'Border diamond untuk master user',
        imageUrl: '/borders/diamond.svg',
        price: 2000,
        rarity: 'LEGENDARY',
        isActive: true,
        sortOrder: 40
      }
    ]

    // Check if database tables exist, if not create them
    // Note: This assumes tables are already created by Prisma
    // If tables don't exist, you need to run: npx prisma db push

    for (const border of defaultBorders) {
      try {
        const mysql = require('mysql2/promise')
        const conn = await mysql.createConnection({
          host: 'localhost',
          user: 'root',
          password: '',
          database: 'hikaricha_db'
        })

        // Check if border already exists
        const [existing] = await conn.execute(
          'SELECT id FROM border WHERE id = ?',
          [border.id]
        )

        if (existing.length === 0) {
          // Insert new border
          await conn.execute(
            `INSERT INTO border (id, name, description, imageUrl, price, rarity, isActive, sortOrder, createdAt, updatedAt)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
            [border.id, border.name, border.description, border.imageUrl, border.price, border.rarity, border.isActive, border.sortOrder]
          )
          console.log(`✅ Created border: ${border.name}`)
        } else {
          // Update existing border
          await conn.execute(
            `UPDATE border SET name = ?, description = ?, imageUrl = ?, price = ?, rarity = ?, isActive = ?, sortOrder = ?, updatedAt = NOW()
             WHERE id = ?`,
            [border.name, border.description, border.imageUrl, border.price, border.rarity, border.isActive, border.sortOrder, border.id]
          )
          console.log(`🔄 Updated border: ${border.name}`)
        }

        await conn.end()
      } catch (error) {
        console.error(`Error processing border ${border.name}:`, error)
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Default borders initialized successfully'
    })

  } catch (error) {
    console.error('Error initializing borders:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}