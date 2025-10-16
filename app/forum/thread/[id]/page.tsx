import { notFound } from "next/navigation"
import { ThreadDetailClient } from "@/components/forum/thread-detail-client"

interface PageProps {
  params: {
    id: string
  }
}

async function getThread(id: string) {
  try {
    const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/forum/threads/${id}`, {
      cache: 'no-store'
    })

    if (!response.ok) {
      return null
    }

    const data = await response.json()
    return data.success ? data.data : null
  } catch (error) {
    console.error('Failed to fetch thread:', error)
    return null
  }
}

export default async function ThreadPage({ params }: PageProps) {
  const thread = await getThread(params.id)

  if (!thread) {
    notFound()
  }

  return <ThreadDetailClient thread={thread} threadId={params.id} />
}