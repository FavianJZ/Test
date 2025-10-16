import { NextRequest, NextResponse } from 'next/server'
import { getForumCategories } from '@/lib/forum-db'

export async function GET() {
  try {
    const categories = await getForumCategories()
    return NextResponse.json({
      success: true,
      data: categories
    })
  } catch (error) {
    console.error('Forum categories error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch categories' },
      { status: 500 }
    )
  }
}