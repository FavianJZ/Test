import type { Metadata } from "next"
import Link from "next/link"
import { ForumPageClient } from "@/components/forum/forum-page-client"

export const metadata: Metadata = {
  title: "Forum Matcha — HikariCha",
  description: "Diskusi seputar manfaat kesehatan, teknik seduh, dan ulasan produk matcha.",
}

export default function ForumPage() {
  return <ForumPageClient />
}
