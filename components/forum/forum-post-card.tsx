"use client"

import { useState } from "react"
import Link from "next/link"
import { BorderDisplay } from "@/components/ui/border-display"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { MessageSquare, Heart, Calendar, Eye } from "lucide-react"
import { ForumUserBorder } from "./forum-user-border"

interface Author {
  name: string
  avatar: string
  border: {
    id: string
    name: string
    imageUrl: string
    rarity: "COMMON" | "RARE" | "EPIC" | "LEGENDARY" | "MYTHIC" | "BRONZE" | "SILVER" | "GOLD"
    unlocked: boolean
  }
  posts: number
  joinDate: string
}

interface ForumPost {
  id: string
  title: string
  excerpt?: string
  category: string
  author: Author
  createdAt: string
  replies: number
  likes: number
  views: number
  isPinned?: boolean
  isLocked?: boolean
}

interface ForumPostCardProps {
  post: ForumPost
  showFullContent?: boolean
}

export function ForumPostCard({ post, showFullContent = false }: ForumPostCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [isLiked, setIsLiked] = useState(false)
  console.log('🔍 ForumPostCard: Rendering post:', post.id, 'with border:', post.author?.border)
  console.log('🔍 ForumPostCard: Author avatar:', post.author?.avatar)

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      "manfaat": "bg-green-100 text-green-800 hover:bg-green-200",
      "teknik-seduh": "bg-blue-100 text-blue-800 hover:bg-blue-200",
      "ulasan-produk": "bg-purple-100 text-purple-800 hover:bg-purple-200",
      "resep": "bg-orange-100 text-orange-800 hover:bg-orange-200",
    }
    return colors[category] || "bg-gray-100 text-gray-800 hover:bg-gray-200"
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <Card
      className={`hover:shadow-lg transition-all duration-300 ${isHovered ? 'scale-[1.02] -translate-y-1' : ''} ${
        post.isPinned ? 'ring-2 ring-yellow-400 border-yellow-200 bg-yellow-50/30' : ''
      } cursor-pointer group`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <CardHeader className="pb-3">
        {/* Author Header with Border */}
        <div className="flex items-center justify-between">
          <BorderDisplay
            border={post.author.border}
            userAvatar={post.author.avatar}
            userName={post.author.name}
            size="forum"
            showUserInfo={true}
            showBadge={true}
            badgeText={`${post.author.border.rarity.charAt(0).toUpperCase() + post.author.border.rarity.slice(1).toLowerCase()} Member`}
            orientation="horizontal"
            className="flex-1"
          />

          {/* Post Status */}
          <div className="flex items-center gap-2 ml-4">
            {post.isPinned && (
              <Badge variant="outline" className="text-xs border-yellow-400 text-yellow-700 animate-pulse">
                📌 Ditandai
              </Badge>
            )}
            {post.isLocked && (
              <Badge variant="secondary" className="text-xs">
                🔒 Dikunci
              </Badge>
            )}
          </div>
        </div>

        {/* Post Meta */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {formatDate(post.createdAt)}
          </span>
          <span>{post.author.posts} posts</span>
          <span>Bergabung {post.author.joinDate}</span>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Post Title */}
        <div className="mb-3">
          <Link href={`/forum/thread/${post.id}`}>
            <h3 className={`font-semibold text-lg hover:text-blue-600 transition-colors group-hover:text-blue-700 ${
              post.isPinned ? 'text-yellow-700' : ''
            }`}>
              {post.isPinned && '📌 '}
              {post.title}
            </h3>
          </Link>

          {post.excerpt && (
            <p className="text-sm text-muted-foreground mt-2 line-clamp-2 group-hover:text-foreground transition-colors duration-200">
              {post.excerpt}
            </p>
          )}
        </div>

        {/* Category and Stats */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Badge
              className={`text-xs cursor-pointer ${getCategoryColor(post.category)}`}
              onClick={() => window.location.href = `/forum?category=${post.category}`}
            >
              {post.category.replace('-', ' ').charAt(0).toUpperCase() + post.category.replace('-', ' ').slice(1).toLowerCase()}

            </Badge>

            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <MessageSquare className="h-3 w-3" />
                {post.replies}
              </span>
              <span className="flex items-center gap-1">
                <Heart className="h-3 w-3" />
                {post.likes}
              </span>
              <span className="flex items-center gap-1">
                <Eye className="h-3 w-3" />
                {post.views}
              </span>
            </div>
          </div>

          <Link
            href={`/forum/thread/${post.id}`}
            className="text-xs text-blue-600 hover:text-blue-800 hover:underline font-medium group-hover:text-blue-700 transition-all duration-200 group-hover:translate-x-1 transform inline-block"
          >
            Baca →
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}

// Component untuk multiple forum posts
interface ForumPostListProps {
  posts: ForumPost[]
  showCategoryFilter?: boolean
}

export function ForumPostList({ posts, showCategoryFilter = false }: ForumPostListProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("all")

  const categories = Array.from(new Set(posts.map(post => post.category)))

  const filteredPosts = selectedCategory === "all"
    ? posts
    : posts.filter(post => post.category === selectedCategory)

  // Sort posts: pinned first, then by most recent
  const sortedPosts = [...filteredPosts].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1
    if (!a.isPinned && b.isPinned) return 1
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })

  return (
    <div className="space-y-4">
      {showCategoryFilter && (
        <div className="flex items-center gap-2 flex-wrap mb-6">
          <button
            onClick={() => setSelectedCategory("all")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 hover:scale-105 transform ${
              selectedCategory === "all"
                ? "bg-primary text-primary-foreground shadow-lg"
                : "bg-secondary hover:bg-secondary/80 hover:shadow-md"
            }`}
          >
            Semua
          </button>
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 hover:scale-105 transform ${
                selectedCategory === category
                  ? "bg-primary text-primary-foreground shadow-lg"
                  : "bg-secondary hover:bg-secondary/80 hover:shadow-md"
              }`}
            >
              {category.replace('-', ' ').charAt(0).toUpperCase() + category.replace('-', ' ').slice(1)}
            </button>
          ))}
        </div>
      )}

      <div className="space-y-4">
        {sortedPosts.map(post => (
          <ForumPostCard key={post.id} post={post} />
        ))}
      </div>

      {sortedPosts.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <p>Belum ada postingan di kategori ini.</p>
        </div>
      )}
    </div>
  )
}