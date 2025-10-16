"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"

// User data cache for real-time updates
const userCache = new Map<string, any>()

// Function to fetch user data with caching
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

import { useBorderData } from "@/hooks/useBorderData"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { BorderPreview } from "@/components/ui/border-preview"
import {
  ArrowLeft,
  MessageSquare,
  Heart,
  Eye,
  Calendar,
  Pin,
  Lock,
  Send,
  Reply,
  AlertCircle
} from "lucide-react"
import { toast } from "sonner"
import { ReplyEditor } from "./reply-editor"
import { UserProfileLink } from "@/components/ui/user-profile-link"
import { ContentRenderer } from "@/components/ui/content-renderer"
import { UserAchievements } from "./user-achievements"
import { ForumUserBorder } from "./forum-user-border"

interface ThreadData {
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

interface Reply {
  id: string
  thread_id: string
  parent_id?: string
  content: string
  author_id: string
  likes: number
  is_deleted: boolean
  created_at: string
  updated_at: string
  replies?: Reply[]
  isLiked?: boolean
}

interface ThreadDetailClientProps {
  thread: ThreadData
  threadId: string
}

export function ThreadDetailClient({ thread, threadId }: ThreadDetailClientProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const [replies, setReplies] = useState<Reply[]>([])
  const [loadingReplies, setLoadingReplies] = useState(true)
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyingToUser, setReplyingToUser] = useState<string | null>(null)
  const [threadLiked, setThreadLiked] = useState(false)
  const [replyLikes, setReplyLikes] = useState<Record<string, boolean>>({})

  // Enhanced thread with real-time user data
  const [enhancedThread, setEnhancedThread] = useState<ThreadData | null>(null)
  const [enhancedReplies, setEnhancedReplies] = useState<Reply[]>([])

  useEffect(() => {
    fetchReplies()
    fetchThreadAuthorData()
    if (session) {
      checkThreadLike()
    }
  }, [threadId, session])

  const fetchThreadAuthorData = async () => {
    if (thread.author_id) {
      const authorData = await fetchUserData(thread.author_id)
      if (authorData) {
        const selectedBorder = authorData.selectedBorder || "default"
        const borderRarity = await getBorderRarityFromDatabase(selectedBorder)

        setEnhancedThread({
          ...thread,
          author: {
            name: authorData.name,
            avatar: authorData.image || "",
            border: {
              id: selectedBorder,
              name: selectedBorder.charAt(0).toUpperCase() + selectedBorder.slice(1).replace(/_/g, ' '),
              image: `/borders/${selectedBorder}.png`,
              rarity: borderRarity as any,
              unlocked: true
            },
            posts: Math.floor(Math.random() * 50) + 5,
            joinDate: new Date(thread.created_at).toLocaleDateString('id-ID', {
              month: 'short',
              year: 'numeric'
            })
          }
        })
      }
    }
  }

  const fetchReplies = async () => {
    try {
      const response = await fetch(`/api/forum/threads/${threadId}/replies`)
      const data = await response.json()

      if (data.success) {
        const processedReplies = await Promise.all(
          data.data.map(async (reply: Reply) => {
            let authorData = null

            // Fetch author data using foreign key
            if (reply.author_id) {
              authorData = await fetchUserData(reply.author_id)
            }

            const selectedBorder = authorData?.selectedBorder || "default"
            const borderRarity = await getBorderRarityFromDatabase(selectedBorder)

            return {
              ...reply,
              author: authorData ? {
                name: authorData.name,
                avatar: authorData.image || "",
                border: {
                  id: selectedBorder,
                  name: selectedBorder.charAt(0).toUpperCase() + selectedBorder.slice(1).replace(/_/g, ' '),
                  image: `/borders/${selectedBorder}.png`,
                  rarity: borderRarity as any,
                  unlocked: true
                },
                posts: Math.floor(Math.random() * 50) + 5,
                joinDate: new Date(reply.created_at).toLocaleDateString('id-ID', {
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
                  rarity: "common" as any,
                  unlocked: true
                },
                posts: Math.floor(Math.random() * 50) + 5,
                joinDate: new Date(reply.created_at).toLocaleDateString('id-ID', {
                  month: 'short',
                  year: 'numeric'
                })
              },
              isLiked: session ? await checkReplyLike(reply.id) : false
            }
          })
        )
        setEnhancedReplies(processedReplies)
        setReplies(processedReplies) // Keep original state for compatibility
      }
    } catch (error) {
      console.error('Failed to fetch replies:', error)
      toast.error("Gagal memuat balasan")
    } finally {
      setLoadingReplies(false)
    }
  }

  const checkThreadLike = async () => {
    try {
      const response = await fetch(`/api/forum/like?content_id=${threadId}&content_type=thread`)
      const data = await response.json()
      setThreadLiked(data.success && data.data.isLiked)
    } catch (error) {
      console.error('Failed to check thread like:', error)
    }
  }

  const checkReplyLike = async (replyId: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/forum/like?content_id=${replyId}&content_type=reply`)
      const data = await response.json()
      return data.success && data.data.isLiked
    } catch (error) {
      console.error('Failed to check reply like:', error)
      return false
    }
  }

  const handleLikeThread = async () => {
    if (!session) {
      toast.error("Login terlebih dahulu")
      return
    }

    try {
      const response = await fetch('/api/forum/like', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content_id: threadId,
          content_type: 'thread'
        }),
      })

      const data = await response.json()
      if (data.success) {
        setThreadLiked(data.data.isLiked)
        toast.success(data.data.isLiked ? "Thread disukai" : "Like dibatalkan")
      }
    } catch (error) {
      console.error('Failed to like thread:', error)
      toast.error("Gagal menyukai thread")
    }
  }

  const handleLikeReply = async (replyId: string) => {
    if (!session) {
      toast.error("Login terlebih dahulu")
      return
    }

    try {
      const response = await fetch('/api/forum/like', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content_id: replyId,
          content_type: 'reply'
        }),
      })

      const data = await response.json()
      if (data.success) {
        setReplyLikes(prev => ({ ...prev, [replyId]: data.data.isLiked }))
        toast.success(data.data.isLiked ? "Balasan disukai" : "Like dibatalkan")
      }
    } catch (error) {
      console.error('Failed to like reply:', error)
      toast.error("Gagal menyukai balasan")
    }
  }

  const handleReply = async (content: string, parentId?: string, userName?: string) => {
    console.log('🚀 handleReply called:', { content, parentId, userName, replyingTo, threadId })

    if (!session) {
      toast.error("Login terlebih dahulu")
      return
    }

    if (thread.is_locked) {
      toast.error("Thread ini dikunci, tidak bisa membalas")
      return
    }

    try {
      // Logic: If replying to a reply that has a parent, use the parent's ID instead
      // This creates a flat 2-level conversation structure
      let finalParentId = null

      if (parentId) {
        // Direct parent ID provided
        finalParentId = parentId
      } else if (replyingTo && replyingTo !== threadId) {
        // Find the reply being replied to and check if it has a parent
        const findReplyParent = (replies: any[], targetId: string): string | null => {
          for (const reply of replies) {
            if (reply.id === targetId) {
              // If this reply has a parent, use that parent instead
              return reply.parent_id || targetId
            }
            // Search in nested replies
            if (reply.replies) {
              const found = findReplyParent(reply.replies, targetId)
              if (found) return found
            }
          }
          return targetId
        }

        finalParentId = findReplyParent(replies, replyingTo)
      }

      console.log('📤 Sending reply:', {
        content: content.trim(),
        parent_id: finalParentId,
        originalReplyingTo: replyingTo,
        threadId,
        authorId: session.user?.id || session.user?.email
      })

      const response = await fetch(`/api/forum/threads/${threadId}/replies`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: content.trim(),
          parent_id: finalParentId
        }),
      })

      const data = await response.json()
      console.log('📥 Reply response:', data)

      if (data.success) {
        toast.success("Balasan berhasil dikirim!")
        setReplyingTo(null)
        setReplyingToUser(null)
        await fetchReplies() // Refresh replies
      } else {
        console.error('❌ Reply submission failed:', data.error)
        toast.error(data.error || "Gagal mengirim balasan")
      }
    } catch (error) {
      console.error('❌ Failed to submit reply:', error)
      toast.error("Terjadi kesalahan saat mengirim balasan")
    }
  }

  const handleReplyTo = (replyId: string, userName: string) => {
    setReplyingTo(replyId)
    setReplyingToUser(userName)
  }

  const getBorderRarityFromDatabase = async (borderId: string): Promise<string> => {
    if (!borderId) return 'common'

    try {
      // Fetch border data from public API
      const response = await fetch('/api/borders-public')
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.data) {
          const border = data.data.find((b: any) => b.id === borderId)
          if (border) {
            return border.rarity || 'common'
          }
        }
      }
    } catch (error) {
      console.error('Error fetching border rarity:', error)
    }

    return 'common'
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getCategoryColor = (color: string) => {
    const colors: Record<string, string> = {
      "green": "bg-green-100 text-green-800",
      "blue": "bg-blue-100 text-blue-800",
      "purple": "bg-purple-100 text-purple-800",
      "orange": "bg-orange-100 text-orange-800",
    }
    return colors[color] || "bg-gray-100 text-gray-800"
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/forum">
          <Button variant="ghost" size="sm" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Kembali ke Forum
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            {thread.is_pinned && (
              <Badge variant="outline" className="text-xs border-yellow-400 text-yellow-700">
                <Pin className="h-3 w-3 mr-1" />
                Ditandai
              </Badge>
            )}
            {thread.is_locked && (
              <Badge variant="secondary" className="text-xs">
                <Lock className="h-3 w-3 mr-1" />
                Dikunci
              </Badge>
            )}
            {thread.category && (
              <Badge className={getCategoryColor(thread.category.color)}>
                {thread.category.name}
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Main Thread */}
      <Card className="overflow-hidden">
        <CardHeader className="pb-4">
          {/* Author Info */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ForumUserBorder
                userId={thread.author_id}
                size="threads"
                showUserInfo={true}
                badgeText={`${(enhancedThread?.author?.border?.rarity || 'common').charAt(0).toUpperCase() + (enhancedThread?.author?.border?.rarity || 'common').slice(1).toLowerCase()} Member`}
              />
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              {formatDate(thread.created_at)}
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-0 space-y-4">
          {/* Thread Content */}
          <div>
            <h1 className="text-2xl font-bold mb-4">{thread.title}</h1>
            <ContentRenderer content={thread.content} />
          </div>

          {/* Thread Actions */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLikeThread}
                className={`flex items-center gap-2 ${threadLiked ? 'text-red-600' : ''}`}
              >
                <Heart className={`h-4 w-4 ${threadLiked ? 'fill-current' : ''}`} />
                {thread.likes + (threadLiked ? 1 : 0)}
              </Button>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MessageSquare className="h-4 w-4" />
                {thread.replies} balasan
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Eye className="h-4 w-4" />
                {thread.views} views
              </div>
            </div>
            {session && !thread.is_locked && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setReplyingTo(threadId)}
                className="flex items-center gap-2"
              >
                <Reply className="h-4 w-4" />
                Balas
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Reply Form */}
      {replyingTo === threadId && (
        <ReplyEditor
          replyTo={threadId}
          onSubmit={(content) => handleReply(content)}
          onCancel={() => {
            setReplyingTo(null)
            setReplyingToUser(null)
          }}
          placeholder="Tulis balasan untuk thread ini..."
        />
      )}

      {/* Replies Section */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">
          {thread.replies} Balasan
        </h2>

        {loadingReplies ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="pt-6">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-full mb-1"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : enhancedReplies.length > 0 ? (
          <div className="space-y-4">
            {enhancedReplies.map((reply) => (
              <ReplyCard
                key={reply.id}
                reply={reply}
                onLike={handleLikeReply}
                isLiked={replyLikes[reply.id] || reply.isLiked}
                session={session}
                threadLocked={thread.is_locked}
                setReplyingTo={setReplyingTo}
                setReplyingToUser={setReplyingToUser}
                handleReply={handleReply}
              />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="pt-6 text-center">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground mb-4">
                Belum ada balasan. Jadilah yang pertama membalas!
              </p>
              {session && !thread.is_locked && (
                <Button
                  onClick={() => setReplyingTo(threadId)}
                  className="flex items-center gap-2"
                >
                  <Reply className="h-4 w-4" />
                  Tulis Balasan Pertama
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Quick Reply at Bottom */}
      {session && !thread.is_locked && replies.length > 0 && (
        <ReplyEditor
          replyTo={threadId}
          onSubmit={(content) => handleReply(content)}
          placeholder="Tulis balasan cepat untuk thread ini..."
          compact={true}
          enableUserTagging={true}
        />
      )}
    </div>
  )
}

// Reply Card Component
function ReplyCard({
  reply,
  onLike,
  isLiked,
  session,
  threadLocked,
  setReplyingTo,
  setReplyingToUser,
  handleReply
}: {
  reply: any
  onLike: (id: string) => void
  isLiked: boolean
  session: any
  threadLocked: boolean
  setReplyingTo: (id: string) => void
  setReplyingToUser: (name: string) => void
  handleReply: (content: string, parentId?: string) => Promise<void>
}) {
  const [showReplyForm, setShowReplyForm] = useState(false)

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <Card className={reply.parent_id ? "ml-8 border-l-4 border-l-blue-200" : ""}>
      <CardContent className="pt-6">
        <div className="space-y-4">
          {/* Reply Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ForumUserBorder
                userId={reply.author_id}
                size="forum"
                showUserInfo={true}
                badgeText={`${(reply.author?.border?.rarity || 'common').charAt(0).toUpperCase() + (reply.author?.border?.rarity || 'common').slice(1).toLowerCase()} Member`}
              />
            </div>
            <div className="text-xs text-muted-foreground">
              {formatDate(reply.created_at)}
            </div>
          </div>

          {/* User Achievements */}
          <div className="pl-11">
            <UserAchievements userId={reply.author_id} />
          </div>

          {/* Reply Content */}
          <div className="pl-11">
            <ContentRenderer content={reply.content} className="prose prose-sm max-w-none text-sm" />
          </div>

          {/* Reply Actions */}
          <div className="flex items-center justify-between pl-11">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onLike(reply.id)}
                className={`flex items-center gap-1 text-xs ${isLiked ? 'text-red-600' : ''}`}
              >
                <Heart className={`h-3 w-3 ${isLiked ? 'fill-current' : ''}`} />
                {reply.likes + (isLiked ? 1 : 0)}
              </Button>
              {session && !threadLocked && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setReplyingTo(reply.id)
                    setReplyingToUser(reply.author_name)
                    // Show reply form
                    setShowReplyForm(true)
                  }}
                  className="flex items-center gap-1 text-xs"
                >
                  <Reply className="h-3 w-3" />
                  Balas
                </Button>
              )}
            </div>
          </div>

          {/* Reply Form */}
          {showReplyForm && (
            <div className="pl-11">
              <ReplyEditor
                replyTo={reply.id}
                replyingToUser={reply.author_name}
                onSubmit={(content) => {
                  setShowReplyForm(false)
                  setReplyingTo(null)
                  setReplyingToUser(null)
                  return handleReply(content, reply.id)
                }}
                onCancel={() => {
                  setShowReplyForm(false)
                  setReplyingTo(null)
                  setReplyingToUser(null)
                }}
                placeholder="Tulis balasan..."
                compact={true}
              />
            </div>
          )}

          {/* Nested Replies */}
          {reply.replies && reply.replies.length > 0 && (
            <div className="pl-11 space-y-3 mt-4">
              {reply.replies.map((nestedReply: any) => (
                <ReplyCard
                  key={nestedReply.id}
                  reply={nestedReply}
                  onLike={(replyId: string) => handleLikeReply(replyId)}
                  isLiked={false}
                  session={session}
                  threadLocked={threadLocked}
                  setReplyingTo={setReplyingTo}
                  setReplyingToUser={setReplyingToUser}
                  handleReply={handleReply}
                />
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}