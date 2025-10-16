"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { BorderDisplay } from "@/components/ui/border-display"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Heart, MessageCircle, Share2, MoreHorizontal, Send, Image, X } from "lucide-react"
import { SocialPostCard } from "./social-post-card"
import { SocialPostCreator } from "./social-post-creator"
import { toast } from "sonner"

interface SocialPost {
  id: string
  content: string
  author_id: string
  author_name: string
  author_avatar?: string
  author_border?: any
  media_urls?: string[]
  likes: number
  comments: number
  shares: number
  is_deleted: boolean
  created_at: string
  updated_at: string
}

interface SocialFeedProps {
  authorId?: string
  className?: string
  mode?: 'home' | 'trending' | 'search' | 'saved'
  searchQuery?: string
  timeRange?: 'hour' | 'day' | 'week' | 'month'
}

export function SocialFeed({
  authorId,
  className = "",
  mode = 'home',
  searchQuery,
  timeRange = 'day'
}: SocialFeedProps) {
  const [posts, setPosts] = useState<SocialPost[]>([])
  const [loading, setLoading] = useState(true)
  const [showPostCreator, setShowPostCreator] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const { data: session } = useSession()

  const fetchPosts = async (showRefresh = false) => {
    try {
      if (showRefresh) setIsRefreshing(true)

      let url = ''
      let params = new URLSearchParams()

      switch (mode) {
        case 'trending':
          url = '/api/social/posts/trending'
          params.append('limit', '20')
          params.append('timeRange', timeRange)
          break
        case 'search':
          url = '/api/social/search'
          params.append('q', searchQuery || '')
          params.append('type', 'posts')
          params.append('limit', '20')
          break
        case 'saved':
          url = '/api/social/posts/saved'
          params.append('limit', '20')
          break
        default: // home
          url = '/api/social/posts'
          if (authorId) {
            params.append('author_id', authorId)
          } else {
            // Use prioritized feed for home page when user is authenticated
            params.append('feed_type', 'prioritized')
          }
          params.append('limit', '20')
          break
      }

      const response = await fetch(`${url}?${params}`)
      const data = await response.json()

      if (data.success) {
        setPosts(data.data)
      } else {
        toast.error(`Gagal memuat postingan${mode === 'trending' ? ' trending' : mode === 'search' ? ' hasil pencarian' : ''}`)
      }
    } catch (error) {
      console.error('Error fetching posts:', error)
      toast.error("Terjadi kesalahan saat memuat postingan")
    } finally {
      setLoading(false)
      if (showRefresh) setIsRefreshing(false)
    }
  }

  useEffect(() => {
    fetchPosts()
  }, [authorId, mode, searchQuery, timeRange])

  const handleNewPost = (newPost: SocialPost) => {
    // Validate post has required fields
    if (!newPost || !newPost.id) {
      console.error('Invalid post data received:', newPost)
      toast.error("Terjadi kesalahan dengan data postingan")
      return
    }

    setPosts(prev => [newPost, ...prev])
    setShowPostCreator(false)
    toast.success("Postingan berhasil dibuat!")
  }

  const handlePostUpdate = (postId: string, updates: Partial<SocialPost>) => {
    setPosts(prev =>
      prev.map(post =>
        post.id === postId ? { ...post, ...updates } : post
      )
    )
  }

  const handlePostDelete = (postId: string) => {
    setPosts(prev => prev.filter(post => post.id !== postId))
    toast.success("Postingan berhasil dihapus")
  }

  const handleRefresh = () => {
    fetchPosts(true)
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Post Creator */}
      {!authorId && session && (
        <SocialPostCreator
          isVisible={showPostCreator}
          onClose={() => setShowPostCreator(false)}
          onPostCreated={handleNewPost}
        />
      )}

      {/* Feed Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">
            {mode === 'trending' ? "Postingan Trending" :
             mode === 'search' ? `Hasil Pencarian: "${searchQuery}"` :
             mode === 'saved' ? "Postingan Tersimpan" :
             authorId ? "Postingan" : "Beranda Sosial"}
          </h2>
          <p className="text-muted-foreground mt-1">
            {mode === 'trending'
              ? `Lihat postingan terpopuler ${timeRange === 'hour' ? '1 jam terakhir' : timeRange === 'day' ? '24 jam terakhir' : timeRange === 'week' ? '7 hari terakhir' : '30 hari terakhir'}`
              : mode === 'search'
              ? `Hasil pencarian untuk "${searchQuery}"`
              : mode === 'saved'
              ? "Koleksi postingan yang Anda simpan"
              : authorId
              ? "Lihat semua postingan dari pengguna ini"
              : "Lihat update terbaru dari komunitas HikariCha"
            }
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Refresh Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="hover:scale-105 transition-transform"
          >
            <MoreHorizontal className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>

          {/* Create Post Button */}
          {mode === 'home' && !authorId && session && !showPostCreator && (
            <Button
              onClick={() => setShowPostCreator(true)}
              className="bg-primary hover:bg-primary/90 hover:scale-105 transition-all duration-200 hover:shadow-lg"
            >
              <Send className="h-4 w-4 mr-2" />
              Buat Postingan
            </Button>
          )}
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <Card key={index} className="animate-pulse">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-32"></div>
                      <div className="h-3 bg-gray-200 rounded w-24"></div>
                    </div>
                  </div>
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-32 bg-gray-200 rounded-lg"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Posts Feed */}
      {!loading && (
        <>
          {posts.length > 0 ? (
            <div className="space-y-6">
              {posts.filter(post => post && post.id).map((post) => (
                <SocialPostCard
                  key={post.id}
                  post={post}
                  onUpdate={handlePostUpdate}
                  onDelete={handlePostDelete}
                  currentUserId={session?.user?.id}
                />
              ))}
            </div>
          ) : (
            <Card className="text-center py-12">
              <CardContent>
                <div className="space-y-4">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
                    <Image className="h-8 w-8 text-gray-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      {mode === 'trending' ? "Belum ada postingan trending" :
                       mode === 'search' ? "Tidak ada hasil pencarian" :
                       mode === 'saved' ? "Belum ada postingan tersimpan" :
                       authorId ? "Belum ada postingan" : "Mulai berbagi momen Anda"}
                    </h3>
                    <p className="text-muted-foreground">
                      {mode === 'trending'
                        ? `Belum ada postingan trending dalam ${timeRange === 'hour' ? '1 jam terakhir' : timeRange === 'day' ? '24 jam terakhir' : timeRange === 'week' ? '7 hari terakhir' : '30 hari terakhir'}.`
                        : mode === 'search'
                        ? `Tidak ada hasil untuk "${searchQuery}". Coba kata kunci yang berbeda.`
                        : mode === 'saved'
                        ? "Anda belum menyimpan postingan apa pun. Simpan postingan yang menarik untuk dibaca nanti."
                        : authorId
                        ? "Pengguna ini belum membuat postingan apa pun."
                        : "Buat postingan pertama Anda untuk berbagi dengan komunitas HikariCha."
                      }
                    </p>
                  </div>
                  {mode === 'home' && !authorId && session && !showPostCreator && (
                    <Button
                      onClick={() => setShowPostCreator(true)}
                      className="mt-4 bg-primary hover:bg-primary/90 hover:scale-105 transition-all duration-200 hover:shadow-lg"
                    >
                      <Send className="h-4 w-4 mr-2" />
                      Buat Postingan Pertama
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}