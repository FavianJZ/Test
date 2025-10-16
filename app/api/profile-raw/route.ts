import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptionsRaw } from '@/lib/auth-raw'
import { dbService } from '@/lib/db-raw'

// GET user profile
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptionsRaw)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await dbService.getUserById(session.user.id)

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        bio: user.bio,
        location: user.location,
        selectedBorder: user.selectedBorder,
        image: user.image
      }
    })

  } catch (error) {
    console.error('Error in profile GET API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT update user profile
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptionsRaw)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, bio, location, selectedBorder } = body

    const success = await dbService.updateUserProfile(session.user.id, {
      name,
      bio,
      location,
      selectedBorder
    })

    if (success) {
      return NextResponse.json({
        success: true,
        message: 'Profile updated successfully'
      })
    } else {
      return NextResponse.json({
        success: false,
        error: 'Failed to update profile'
      }, { status: 500 })
    }

  } catch (error) {
    console.error('Error in profile PUT API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}