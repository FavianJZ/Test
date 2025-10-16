import { NextRequest, NextResponse } from 'next/server'
import { dbService } from '@/lib/db-raw'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Public borders API: Fetching all borders from database...')

    // Fetch all borders from database
    const borders = await dbService.getAllBorders()

    console.log(`✅ Public borders API: Retrieved ${borders.length} borders from database`)

    // Transform database data to match expected format
    const transformedBorders = borders.map(border => ({
      id: border.id,
      name: border.name,
      imageUrl: border.imageUrl,
      rarity: border.rarity,
      price: border.price,
      unlocked: true // For public API, we don't check unlock status
    }))

    return NextResponse.json({
      success: true,
      data: transformedBorders,
      count: transformedBorders.length
    })

  } catch (error) {
    console.error('❌ Public borders API: Error fetching borders:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: 'Failed to fetch border data'
      },
      { status: 500 }
    )
  }
}