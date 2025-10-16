import NextAuth from "next-auth"
import { authOptionsRaw } from "@/lib/auth-raw"

const handler = NextAuth(authOptionsRaw)

export { handler as GET, handler as POST }