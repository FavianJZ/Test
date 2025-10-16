"use client"

import React, { useState, useEffect, useRef } from "react"
import { BorderDisplay } from "@/components/ui/border-display"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Heart, MessageCircle, Send, Calendar } from "lucide-react"
import { toast } from "sonner"

interface SocialComment {
  id: string
  post_id: string
  parent_id?: string
  content: string
  author_id: string
  author_name: string
  author_avatar?: string
  author_border?: any
  author_posts?: number
  author_joinDate?: string
  likes: number
  is_deleted: boolean
  created_at: string
  updated_at: string
  replies?: SocialComment[]
}

interface SocialCommentSectionProps {
  postId: string
  onCommentCountChange: (count: number) => void
  currentUserId?: string
}

export function SocialCommentSection({ postId, onCommentCountChange, currentUserId }: SocialCommentSectionProps) {
  const [comments, setComments] = useState<SocialComment[]>([])
  const [loading, setLoading] = useState(true)
  const [commentText, setCommentText] = useState("")
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyText, setReplyText] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [completeBorders, setCompleteBorders] = useState<Map<string, any>>(new Map())
  const commentInputRef = useRef<HTMLTextAreaElement>(null)

  const getBorderFromDatabase = async (borderId: string) => {
    if (!borderId) {
      return {
        id: 'default',
        name: 'Default',
        imageUrl: '/borders/default.png',
        unlocked: true,
        rarity: 'COMMON'
      }
    }

    try {
      const response = await fetch('/api/borders-public')
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.data) {
          const border = data.data.find((b: any) => b.id === borderId)
          if (border) {
            return {
              id: border.id,
              name: border.name,
              imageUrl: border.imageUrl,
              unlocked: true,
              rarity: border.rarity
            }
          }
        }
      }
    } catch (error) {
      console.error('Error fetching border data:', error)
    }

    // Fallback to default border
    return {
      id: borderId,
      name: borderId.charAt(0).toUpperCase() + borderId.slice(1),
      imageUrl: '/borders/default.png',
      unlocked: true,
      rarity: 'COMMON'
    }
  }

  const fetchCommentBorders = async (comments: SocialComment[]) => {
    const borderPromises = new Map<string, Promise<any>>()

    // Collect unique border IDs from all comments
    comments.forEach(comment => {
      const borderId = comment.author_border
      if (borderId && !completeBorders.has(borderId)) {
        if (!borderPromises.has(borderId)) {
          borderPromises.set(borderId, getBorderFromDatabase(borderId))
        }
      }
    })

    // Fetch all borders in parallel
    const borderResults = await Promise.all(Array.from(borderPromises.entries()).map(async ([id, promise]) => {
      const borderData = await promise
      return [id, borderData] as [string, any]
    }))

    // Update borders map
    const newBorders = new Map(completeBorders)
    borderResults.forEach(([id, borderData]) => {
      newBorders.set(id, borderData)
    })
    setCompleteBorders(newBorders)
  }

  useEffect(() => {
    fetchComments()
  }, [postId])

  const fetchComments = async () => {
    try {
      const response = await fetch(`/api/social/posts/${postId}/comments`)
      const data = await response.json()

      if (data.success) {
        setComments(data.data)
        onCommentCountChange(data.data.length)

        // Fetch borders for all comments
        if (data.data.length > 0) {
          await fetchCommentBorders(data.data)
        }
      }
    } catch (error) {
      console.error('Error fetching comments:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCommentSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!currentUserId || !commentText.trim() || submitting) return

    setSubmitting(true)
    try {
      const response = await fetch(`/api/social/posts/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: commentText.trim()
        })
      })

      const data = await response.json()

      if (data.success) {
        setCommentText("")
        setComments(data.data)
        onCommentCountChange(data.data.length)

        // Fetch borders for new comments
        if (data.data.length > 0) {
          await fetchCommentBorders(data.data)
        }

        toast.success("Komentar berhasil ditambahkan!")
      } else {
        toast.error("Gagal menambahkan komentar")
      }
    } catch (error) {
      console.error('Error adding comment:', error)
      toast.error("Terjadi kesalahan saat menambahkan komentar")
    } finally {
      setSubmitting(false)
    }
  }

  const handleReplySubmit = async (parentCommentId: string, e?: React.FormEvent) => {
    e?.preventDefault()
    if (!currentUserId || !replyText.trim() || submitting) return

    setSubmitting(true)
    try {
      const response = await fetch(`/api/social/posts/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: replyText.trim(),
          parent_id: parentCommentId
        })
      })

      const data = await response.json()

      if (data.success) {
        setReplyText("")
        setReplyingTo(null)
        setComments(data.data)
        onCommentCountChange(data.data.length)

        // Fetch borders for new comments
        if (data.data.length > 0) {
          await fetchCommentBorders(data.data)
        }

        toast.success("Balasan berhasil ditambahkan!")
      } else {
        toast.error("Gagal menambahkan balasan")
      }
    } catch (error) {
      console.error('Error adding reply:', error)
      toast.error("Terjadi kesalahan saat menambahkan balasan")
    } finally {
      setSubmitting(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))

    if (diffHours < 1) {
      const diffMins = Math.floor(diffMs / (1000 * 60))
      return `${diffMins} menit yang lalu`
    } else if (diffHours < 24) {
      return `${diffHours} jam yang lalu`
    } else {
      const diffDays = Math.floor(diffHours / 24)
      return `${diffDays} hari yang lalu`
    }
  }

  const CommentItem = ({ comment, isReply = false }: { comment: SocialComment; isReply?: boolean }) => {
    // Get border data from cache or use fallback
    const borderData = comment.author_border ? completeBorders.get(comment.author_border) : null
    const processedBorder = borderData || {
      id: 'default',
      name: 'Default',
      imageUrl: '/borders/default.png',
      unlocked: true,
      rarity: 'COMMON'
    }

    const getBadgeText = () => {
      if (processedBorder?.rarity) {
        const rarity = processedBorder.rarity.charAt(0).toUpperCase() + processedBorder.rarity.slice(1).toLowerCase()
        return `${rarity} Member`
      }
      return "Member"
    }

    return (
      <Card className={isReply ? "ml-8 border-l-4 border-l-blue-200" : ""}>
        <CardContent className="pt-6">
          <div className="space-y-4">
            {/* Comment Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <BorderDisplay
                  border={processedBorder}
                  userAvatar={comment.author_avatar}
                  userName={comment.author_name}
                  size="social"
                  showUserInfo={true}
                  showBadge={true}
                  badgeText={getBadgeText()}
                  orientation="horizontal"
                />
              </div>
              <div className="text-xs text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {formatDate(comment.created_at)}
              </div>
            </div>

          {/* Comment Content */}
          <div className="pl-11">
            <p className="text-sm text-foreground whitespace-pre-wrap break-words">
              {comment.content}
            </p>
          </div>

          {/* Comment Actions */}
          <div className="flex items-center justify-between pl-11">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
              >
                <Heart className="h-3 w-3" />
                {comment.likes}
              </Button>
              {!isReply && currentUserId && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                >
                  <MessageCircle className="h-3 w-3" />
                  Balas
                </Button>
              )}
            </div>
          </div>

          {/* Reply Input */}
          {replyingTo === comment.id && (
            <div className="pl-11">
              <form onSubmit={(e) => handleReplySubmit(comment.id, e)} className="mt-3 space-y-2">
                <Textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && e.ctrlKey) {
                      e.preventDefault()
                      handleReplySubmit(comment.id)
                    }
                  }}
                  placeholder="Tulis balasan..."
                  className="min-h-[80px] resize-none text-sm"
                  maxLength={500}
                />
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setReplyingTo(null)
                      setReplyText("")
                    }}
                  >
                    Batal
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={!replyText.trim() || submitting}
                    className="bg-primary hover:bg-primary/90"
                  >
                    {submitting ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    ) : (
                      <Send className="h-3 w-3 mr-1" />
                    )}
                    Balas
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* Replies */}
          {comment.replies && comment.replies.length > 0 && (
            <div className="pl-11 space-y-3 mt-4">
              {comment.replies.map((reply) => (
                <CommentItem key={reply.id} comment={reply} isReply />
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
    )
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 2 }).map((_, index) => (
          <div key={index} className="animate-pulse">
            <div className="flex gap-3">
              <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="bg-gray-100 rounded-lg p-3 h-16"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Comment Form */}
      {currentUserId && (
        <form onSubmit={handleCommentSubmit} className="space-y-3">
          <Textarea
            ref={commentInputRef}
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && e.ctrlKey) {
                e.preventDefault()
                handleCommentSubmit()
              }
            }}
            placeholder="Tambahkan komentar..."
            className="min-h-[80px] resize-none"
            maxLength={500}
          />
          <div className="flex justify-between items-center">
            <span className="text-xs text-muted-foreground">
              {commentText.length}/500
            </span>
            <Button
              type="submit"
              disabled={!commentText.trim() || submitting}
              className="bg-primary hover:bg-primary/90"
            >
              {submitting ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Komentar
            </Button>
          </div>
        </form>
      )}

      {/* Comments List */}
      {comments.length > 0 ? (
        <div className="space-y-4">
          {comments.map((comment) => (
            <CommentItem key={comment.id} comment={comment} />
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Belum ada komentar</p>
          <p className="text-xs">Jadilah yang pertama berkomentar!</p>
        </div>
      )}

      {/* Login Prompt */}
      {!currentUserId && (
        <div className="text-center py-4 text-muted-foreground text-sm">
          <p>Login untuk dapat berkomentar</p>
        </div>
      )}
    </div>
  )
}