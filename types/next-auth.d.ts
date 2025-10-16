import NextAuth from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      email: string
      name?: string | null
      role: string
      image?: string | null
      bio?: string | null
      location?: string | null
      selectedBorder?: string | null
    }
  }

  interface User {
    id: string
    email: string
    name?: string | null
    role: string
    image?: string | null
    bio?: string | null
    location?: string | null
    selectedBorder?: string | null
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    role: string
    image?: string | null
    bio?: string | null
    location?: string | null
    selectedBorder?: string | null
  }
}