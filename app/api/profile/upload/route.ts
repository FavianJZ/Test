import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { dbService } from "@/lib/db-raw"
import { writeFile, mkdir } from "fs/promises"
import path from "path"

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "File must be an image" }, { status: 400 })
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "File size must be less than 5MB" }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), "public", "uploads", "avatars")
    try {
      await mkdir(uploadsDir, { recursive: true })
    } catch (error) {
      // Directory already exists
    }

    // Generate unique filename
    const timestamp = Date.now()
    const filename = `${session.user.email.replace(/[@.]/g, "_")}_${timestamp}.${file.type.split("/")[1]}`
    const filepath = path.join(uploadsDir, filename)

    // Write file
    await writeFile(filepath, buffer)

    // Get user ID from session email
    const userResult = await dbService.getUserByEmail(session.user.email)
    if (!userResult) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Update user profile with new image URL
    const imageUrl = `/uploads/avatars/${filename}`

    // Update user using raw DB service
    const conn = await dbService.getConnection()
    await conn.execute(
      'UPDATE user SET image = ? WHERE email = ?',
      [imageUrl, session.user.email]
    )

    // Create activity log using raw DB service
    await dbService.createActivity(
      userResult.id,
      "PROFILE_UPDATE",
      "Foto profil diperbarui",
      "Anda mengubah foto profil"
    )

    return NextResponse.json({
      message: "Profile image updated successfully",
      userImage: imageUrl  // Changed to match client expectation
    })
  } catch (error) {
    console.error("Profile image upload error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}