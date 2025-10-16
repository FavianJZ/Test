import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"


export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { borderId } = body

    if (!borderId) {
      return NextResponse.json(
        { error: "Border ID is required" },
        { status: 400 }
      )
    }

    // ✅ update border yang sedang dipakai user
    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: { selectedBorder: borderId },
      select: { id: true, selectedBorder: true },
    })

    return NextResponse.json({
      success: true,
      message: `Border equipped successfully.`,
      selectedBorder: user.selectedBorder,
    })
  } catch (error) {
    console.error("Error equipping border:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
