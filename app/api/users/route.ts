import { NextResponse } from 'next/server'
import mysql from 'mysql2/promise'

const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'hikaricha_db'
}

export async function GET() {
  try {
    const connection = await mysql.createConnection(dbConfig)

    try {
      const [rows] = await connection.execute(`
        SELECT
          id,
          name,
          email,
          image as avatar
        FROM user
        ORDER BY name ASC
        LIMIT 50
      `)

      await connection.end()

      return NextResponse.json({
        success: true,
        data: rows
      })
    } catch (error) {
      await connection.end()
      throw error
    }
  } catch (error) {
    console.error('Get users error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch users' },
      { status: 500 }
    )
  }
}