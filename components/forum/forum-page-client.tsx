"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useSession } from "next-auth/react"
import { ForumPostList } from "@/components/forum/forum-post-card"
import { Button } from "@/components/ui/button"
import { Plus, MessageSquare, Users } from "lucide-react"

const userCache = new Map<string, any>()

const fetchUserData = async (userId: string): Promise<any> => {
  if (userCache.has(userId)) {
    return userCache.get(userId)
  }

  try {
    const response = await fetch(`/api/users/${userId}`)
    if (response.ok) {
      const result = await response.json()
      // Extract user data from the response structure
      const userData = result.success ? result.data : result
      userCache.set(userId, userData)
      return userData
    }
  } catch (error) {
    console.error('Error fetching user data:', error)
  }

  return null
}

interface Category {
  id: number
  slug: string
  name: string
  description?: string
  color: string
  icon?: string
}

interface Thread {
  id: string
  title: string
  content: string
  excerpt?: string
  category_id: number
  author_id: string
  views: number
  likes: number
  replies: number
  is_pinned: boolean
  is_locked: boolean
  is_deleted: boolean
  created_at: string
  updated_at: string
  last_reply_at?: string
  last_reply_by?: string
  category?: {
    id: number
    slug: string
    name: string
    color: string
  }
}

export function ForumPageClient() {
  console.log('🔍 ForumPageClient: Component mounted!')
  const { data: session } = useSession()
  const [categories, setCategories] = useState<Category[]>([])
  const [threads, setThreads] = useState<Thread[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [stats, setStats] = useState({ totalThreads: 0, totalReplies: 0 })

  
  useEffect(() => {
    console.log('🔍 ForumPageClient: useEffect triggered, selectedCategory:', selectedCategory)
    fetchData()
  }, [selectedCategory])

  const fetchData = async () => {
    try {
      console.log('🔍 ForumPageClient: Starting fetchData...')
      setLoading(true)

      // Fetch categories
      console.log('🔍 ForumPageClient: Fetching categories...')
      const categoriesResponse = await fetch('/api/forum/categories')
      const categoriesData = await categoriesResponse.json()
      console.log('🔍 ForumPageClient: Categories response:', categoriesData)

      if (categoriesData.success) {
        setCategories(categoriesData.data)
      }

      // Fetch threads
      const threadsUrl = selectedCategory === 'all'
        ? '/api/forum/threads'
        : `/api/forum/threads?category=${selectedCategory}`

      console.log('🔍 ForumPageClient: Fetching threads from:', threadsUrl)
      const threadsResponse = await fetch(threadsUrl)
      const threadsData = await threadsResponse.json()
      console.log('🔍 ForumPageClient: Threads response:', threadsData)

      if (threadsData.success) {
        const fetchedThreads = await Promise.all(
          threadsData.data.map(async (thread: Thread) => {
            console.log(`🔍 Processing thread ${thread.id} with author_id: ${thread.author_id}`)
            let authorData = null

            // Fetch author data using foreign key
            if (thread.author_id) {
              authorData = await fetchUserData(thread.author_id)
              console.log(`🔍 Author data for ${thread.author_id}:`, authorData)
            }

            const selectedBorder = authorData?.selectedBorder || "default"
            console.log(`🔍 Selected border for ${thread.author_id}: ${selectedBorder}`)
            const borderInfo = await getBorderFromDatabase(selectedBorder)
            console.log(`🔍 Border info for ${selectedBorder}:`, borderInfo)

            const processedThread = {
              ...thread,
              author: authorData ? {
                name: authorData.name,
                avatar: authorData.image || "",
                border: {
                  id: selectedBorder,
                  name: borderInfo.name,
                  imageUrl: borderInfo.imageUrl || `/borders/${borderInfo.imageFile}`,
                  rarity: borderInfo.rarity,
                  unlocked: true
                },
                posts: Math.floor(Math.random() * 100) + 10, // Mock data for now
                joinDate: new Date(thread.created_at).toLocaleDateString('id-ID', {
                  month: 'short',
                  year: 'numeric'
                })
              } : {
                // Fallback for missing author data
                name: "Unknown User",
                avatar: "",
                border: {
                  id: "default",
                  name: "Default",
                  image: "/borders/default.png",
                  imageUrl: "/borders/default.png",
                  rarity: "COMMON" as any,
                  unlocked: true
                },
                posts: Math.floor(Math.random() * 100) + 10,
                joinDate: new Date(thread.created_at).toLocaleDateString('id-ID', {
                  month: 'short',
                  year: 'numeric'
                })
              },
              createdAt: thread.created_at,
              replies: thread.replies,
              likes: thread.likes,
              views: thread.views,
              isPinned: thread.is_pinned,
              isLocked: thread.is_locked,
              category: thread.category?.slug || "general"
            }

            console.log(`✅ Processed thread ${thread.id} with border:`, processedThread.author?.border)
            return processedThread
          })
        )

        setThreads(fetchedThreads)

        // Calculate stats
        const totalThreads = fetchedThreads.length
        const totalReplies = fetchedThreads.reduce((sum: number, thread: any) => sum + thread.replies, 0)
        setStats({ totalThreads, totalReplies })
      }
    } catch (error) {
      console.error('Failed to fetch forum data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getBorderFromDatabase = async (borderId: string) => {
    console.log(`🔍 ForumPageClient: Looking up border ${borderId} from database...`)

    if (!borderId) {
      return {
        name: 'Default',
        imageUrl: '/borders/default.png',
        imageFile: 'default.png',
        rarity: 'COMMON'
      }
    }

    try {
      // Fetch border data from public API (same as thread page)
      const response = await fetch('/api/borders-public')
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.data) {
          const border = data.data.find((b: any) => b.id === borderId)
          if (border) {
            console.log(`✅ ForumPageClient: Found border ${borderId} via API:`, border)
            return {
              name: border.name,
              imageUrl: border.imageUrl,
              imageFile: border.imageUrl.split('/').pop() || 'default.png',
              rarity: border.rarity
            }
          }
        }
      }
    } catch (error) {
      console.error('ForumPageClient: Error fetching border data:', error)
    }

    // Fallback to default border if not found in database
    console.log(`⚠️ ForumPageClient: Border ${borderId} not found in database, using default`)
    return {
      name: 'Default',
      imageUrl: '/borders/default.png',
      imageFile: 'default.png',
      rarity: 'COMMON'
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10 space-y-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
        <div className="text-center text-sm text-muted-foreground">
          Loading forum data...
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 space-y-8">
      <header className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold">Forum HikariCha</h1>
            <p className="text-sm text-muted-foreground">
              Bertanya, berbagi, dan berdiskusi seputar matcha.
            </p>
            {!session && (
              <p className="text-xs text-muted-foreground">
                Daftar/Masuk untuk membuat topik dan menautkan profil Anda.
              </p>
            )}
          </div>

          {session && (
            <Link href="/forum/create">
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Buat Topik Baru
              </Button>
            </Link>
          )}
        </div>

        {/* Forum Stats */}
        <div className="flex items-center gap-6 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            <span>{stats.totalThreads} diskusi</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span>{stats.totalReplies} balasan</span>
          </div>
        </div>
      </header>

      <section aria-labelledby="cats" className="space-y-3">
        <h2 id="cats" className="text-xl font-semibold">
          Kategori
        </h2>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCategory("all")}
            className={`px-3 py-1 rounded-md border transition-colors ${
              selectedCategory === "all"
                ? "bg-primary text-primary-foreground"
                : "bg-secondary hover:bg-secondary/80"
            }`}
          >
            Semua Kategori
          </button>
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.slug)}
              className={`px-3 py-1 rounded-md border transition-colors ${
                selectedCategory === category.slug
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary hover:bg-secondary/80"
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>
      </section>

      <section aria-labelledby="threads" className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 id="threads" className="text-xl font-semibold">
            {selectedCategory === "all" ? "Topik Terbaru" : `Topik: ${categories.find(c => c.slug === selectedCategory)?.name || selectedCategory}`}
          </h2>
        </div>

        <ForumPostList posts={threads} showCategoryFilter={false} />

        {threads.length === 0 && !loading && (
          <div className="text-center py-12 text-muted-foreground">
            <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">Belum ada topik di kategori ini</p>
            <p className="text-sm mb-4">
              Jadilah yang pertama memulai diskusi!
            </p>
            {session && (
              <Link href="/forum/create">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Buat Topik Baru
                </Button>
              </Link>
            )}
          </div>
        )}
      </section>
    </div>
  )
}