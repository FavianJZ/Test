import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import mysql from 'mysql2/promise'

let connection: mysql.Connection | null = null

async function getConnection() {
  if (!connection) {
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'hikaricha_db'
    })
  }
  return connection
}

export const authOptionsRaw: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          console.log("Missing credentials")
          return null
        }

        try {
          const conn = await getConnection()

          const [users] = await conn.execute(
            'SELECT * FROM user WHERE email = ?',
            [credentials.email]
          ) as any

          if (users.length === 0) {
            console.log("User not found:", credentials.email)
            return null
          }

          const user = users[0]

          if (!user.password) {
            console.log("User has no password")
            return null
          }

          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            user.password
          )

          if (!isPasswordValid) {
            console.log("Password invalid")
            return null
          }

          console.log("Login successful for:", user.email)
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            image: user.image,
            bio: user.bio,
            location: user.location,
            selectedBorder: user.selectedBorder,
          }
        } catch (error) {
          console.error("Auth error:", error)
          return null
        }
      }
    })
  ],
  session: {
    strategy: "jwt"
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
        token.id = user.id
        token.name = user.name
        token.image = user.image
        token.bio = user.bio
        token.location = user.location
        token.selectedBorder = user.selectedBorder
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
        session.user.role = token.role as string
        session.user.name = token.name as string
        session.user.image = token.image as string
        session.user.bio = token.bio as string
        session.user.location = token.location as string
        session.user.selectedBorder = token.selectedBorder as string
      }
      return session
    }
  },
  pages: {
    signIn: "/auth/login",
    signUp: "/auth/register"
  },
  debug: process.env.NODE_ENV === "development"
}