import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import mysql from "mysql2/promise"
import { z } from "zod"

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

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  captchaToken: z.string().min(1, "reCAPTCHA verification is required"),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, email, password, captchaToken } = registerSchema.parse(body)

    // Verify reCAPTCHA token
    const recaptchaResponse = await fetch(
      `https://www.google.com/recaptcha/api/siteverify`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          secret: process.env.RECAPTCHA_SECRET_KEY || "6LfLIeErAAAAABD-cA9fMSoNlyApg-SPqG7Q9iJy",
          response: captchaToken,
        }),
      }
    )

    const recaptchaResult = await recaptchaResponse.json()

    if (!recaptchaResult.success) {
      console.error("reCAPTCHA verification failed:", recaptchaResult)
      return NextResponse.json(
        { error: "reCAPTCHA verification failed. Please try again." },
        { status: 400 }
      )
    }

    // Check if user already exists
    const conn = await getConnection()
    const [existingUsers] = await conn.execute(
      'SELECT id FROM user WHERE email = ?',
      [email]
    ) as any

    if (existingUsers.length > 0) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create user
    const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    await conn.execute(
      'INSERT INTO user (id, name, email, password, role, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, NOW(), NOW())',
      [userId, name, email, hashedPassword, 'USER']
    )

    const user = {
      id: userId,
      name,
      email,
      role: 'USER',
      createdAt: new Date()
    }

    return NextResponse.json({
      message: "User created successfully",
      user
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      )
    }

    console.error("Registration error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}