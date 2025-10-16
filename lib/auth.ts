import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { PrismaAdapter } from "@next-auth/prisma-adapter"
import { prisma } from "./prisma"
import bcrypt from "bcryptjs"

export const authOptions: NextAuthOptions = {
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
          const user = await prisma.user.findUnique({
            where: {
              email: credentials.email
            }
          })

          if (!user) {
            console.log("User not found:", credentials.email)
            return null
          }

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
    strategy: "jwt",
    maxAge: 60 * 60, // 1 hour - shorter to force more frequent refreshes
  },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      // Initial sign in
      if (user) {
        token.role = user.role
        token.id = user.id
        token.image = user.image
        token.bio = user.bio
        token.location = user.location
        token.selectedBorder = user.selectedBorder
        token.name = user.name
        return token
      }

      // Handle session updates (manual updates only)
      if (trigger === "update" && session) {
        token.image = session.user.image
        token.bio = session.user.bio
        token.location = session.user.location
        token.selectedBorder = session.user.selectedBorder
        token.name = session.user.name
      }

      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
        session.user.role = token.role as string
        session.user.image = token.image as string
        session.user.bio = token.bio as string
        session.user.location = token.location as string
        session.user.selectedBorder = token.selectedBorder as string
        session.user.name = token.name as string
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