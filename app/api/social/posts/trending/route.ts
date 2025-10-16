import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getTrendingPosts } from '@/lib/social-db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10')
    const timeRange = (searchParams.get('timeRange') || 'day') as 'hour' | 'day' | 'week' | 'month'

    // Validate timeRange
    const validTimeRanges = ['hour', 'day', 'week', 'month']
    if (!validTimeRanges.includes(timeRange)) {
      return NextResponse.json(
        { success: false, error: 'Invalid time range. Must be: hour, day, week, or month' },
        { status: 400 }
      )
    }

    const posts = await getTrendingPosts({ limit, timeRange })

    return NextResponse.json({
      success: true,
      data: posts,
      meta: {
        limit,
        timeRange,
        count: posts.length
      }
    })
  } catch (error) {
    console.error('Error fetching trending posts:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch trending posts' },
      { status: 500 }
    )
  }
}