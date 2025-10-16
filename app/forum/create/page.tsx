import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { CreateThreadClient } from "@/components/forum/create-thread-client"

export default async function CreateThreadPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/auth/login?callbackUrl=/forum/create")
  }

  return <CreateThreadClient session={session} />
}