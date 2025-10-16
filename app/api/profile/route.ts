import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const updateProfileSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  bio: z.string().optional(),
  location: z.string().optional(),
  selectedBorder: z.string().optional(),
})

// GET /api/profile - Get current user profile
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        bio: true,
        location: true,
        selectedBorder: true,
        createdAt: true,
        updatedAt: true,
      }
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json({ user })
  } catch (error) {
    console.error("Profile fetch error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// PUT /api/profile - Update user profile
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const validatedData = updateProfileSchema.parse(body)

    const user = await prisma.user.update({
      where: { email: session.user.email },
      data: validatedData,
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        bio: true,
        location: true,
        selectedBorder: true,
        updatedAt: true,
      }
    })

    // Create activity log
    await prisma.activity.create({
      data: {
        id: `act_${user.id}_${Date.now()}`,
        userId: user.id,
        type: "PROFILE_UPDATE",
        title: "Profil diperbarui",
        description: "Anda memperbarui informasi profil",
        metadata: JSON.stringify(validatedData),
      }
    })

    return NextResponse.json({
      message: "Profile updated successfully",
      user
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      )
    }

    console.error("Profile update error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}