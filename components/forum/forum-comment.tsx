"use client"

import { useState } from "react"
import { BorderDisplay, MinimalBorderDisplay } from "@/components/ui/border-display"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Heart, MessageSquare, MoreHorizontal, Reply } from "lucide-react"

interface User {
  name: string
  avatar: string
  border: {
    id: string
    name: string
    image: string
    rarity: "common" | "rare" | "epic" | "legendary"
    unlocked: boolean
  }
  role: string
}

interface ForumComment {
  id: string
  content: string
  author: User
  createdAt: string
  likes: number
  isLiked?: boolean
  replies?: ForumComment[]
}

interface ForumCommentProps {
  comment: ForumComment
  onReply?: (commentId: string, content: string) => void
  onLike?: (commentId: string) => void
  level?: number
}

export function ForumComment({
  comment,
  onReply,
  onLike,
  level = 0
}: ForumCommentProps) {
  const [isReplying, setIsReplying] = useState(false)
  const [replyContent, setReplyContent] = useState("")
  const [isLiked, setIsLiked] = useState(comment.isLiked || false)
  const [likesCount, setLikesCount] = useState(comment.likes)

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const handleLike = () => {
    const newIsLiked = !isLiked
    setIsLiked(newIsLiked)
    setLikesCount(prev => newIsLiked ? prev + 1 : prev - 1)
    onLike?.(comment.id)
  }

  const handleReply = () => {
    if (replyContent.trim()) {
      onReply?.(comment.id, replyContent)
      setReplyContent("")
      setIsReplying(false)
    }
  }

  const processMentions = (content: string) => {
    // Simple mention processing - in real app, this would be more sophisticated
    const mentionRegex = /@(\w+)/g
    const parts = content.split(mentionRegex)

    return parts.map((part, index) => {
      if (part.startsWith('@') || (index > 0 && parts[index - 1]?.endsWith('@'))) {
        const username = part.startsWith('@') ? part.substring(1) : part
        if (username === 'Natsumi') {
          return (
            <MinimalBorderDisplay
              key={index}
              border={{
                id: "gold",
                name: "Gold",
                image: "/borders/gold.svg",
                rarity: "epic",
                unlocked: true
              }}
              userAvatar="/avatars/natsumi.jpg"
              userName={username}
              size="xs"
            />
          )
        } else if (username === 'Bima') {
          return (
            <MinimalBorderDisplay
              key={index}
              border={{
                id: "silver",
                name: "Silver",
                image: "/borders/silver.svg",
                rarity: "rare",
                unlocked: true
              }}
              userAvatar="/avatars/bima.jpg"
              userName={username}
              size="xs"
            />
          )
        }
        return <span key={index} className="text-blue-600 hover:underline cursor-pointer">@{username}</span>
      }
      return <span key={index}>{part}</span>
    })
  }

  return (
    <div className={`${level > 0 ? 'ml-8 border-l-2 border-gray-200 pl-4' : ''}`}>
      <Card className="mb-4 hover:shadow-sm transition-shadow">
        <CardContent className="p-4">
          {/* Comment Header */}
          <div className="flex items-start justify-between mb-3">
            <BorderDisplay
              border={comment.author.border}
              userAvatar={comment.author.avatar}
              userName={comment.author.name}
              size="sm"
              showUserInfo={true}
              showBadge={true}
              badgeText={comment.author.role}
              orientation="horizontal"
            />

            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                {formatDate(comment.createdAt)}
              </span>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                <MoreHorizontal className="h-3 w-3" />
              </Button>
            </div>
          </div>

          {/* Comment Content with Mentions */}
          <div className="text-sm mb-4 leading-relaxed">
            {processMentions(comment.content)}
          </div>

          {/* Comment Actions */}
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLike}
              className={`flex items-center gap-1 text-xs ${
                isLiked ? 'text-red-600 hover:text-red-700' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Heart className={`h-3 w-3 ${isLiked ? 'fill-current' : ''}`} />
              {likesCount}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsReplying(!isReplying)}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              <Reply className="h-3 w-3" />
              Balas
            </Button>

            {comment.replies && comment.replies.length > 0 && (
              <span className="text-xs text-muted-foreground">
                {comment.replies.length} balasan
              </span>
            )}
          </div>

          {/* Reply Form */}
          {isReplying && (
            <div className="mt-4 space-y-3">
              <Textarea
                placeholder="Tulis balasan Anda..."
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                className="min-h-[80px] resize-none"
                rows={3}
              />
              <div className="flex items-center justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsReplying(false)
                    setReplyContent("")
                  }}
                >
                  Batal
                </Button>
                <Button size="sm" onClick={handleReply} disabled={!replyContent.trim()}>
                  Balas
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Nested Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="space-y-2">
          {comment.replies.map(reply => (
            <ForumComment
              key={reply.id}
              comment={reply}
              onReply={onReply}
              onLike={onLike}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// Sample comments for demonstration
export const sampleComments: ForumComment[] = [
  {
    id: "c1",
    content: "Terima kasih untuk sharingnya @Natsumi! Saya juga punya pengalaman serupa dengan matcha ceremonial. Memang rasanya jauh lebih smooth dan less bitter.",
    author: {
      name: "Bima Santoso",
      avatar: "/avatars/bima.jpg",
      border: {
        id: "silver",
        name: "Silver",
        image: "/borders/silver.svg",
        rarity: "rare",
        unlocked: true
      },
      role: "Home Barista"
    },
    createdAt: "2024-10-06T11:45:00Z",
    likes: 5,
    isLiked: false,
    replies: [
      {
        id: "c1-1",
        content: "Iya @Bima, setuju banget! Matcha ceremonial itu memang worth the price untuk yang serius menikmati matcha.",
        author: {
          name: "Ayu Wijaya",
          avatar: "/avatars/ayu.jpg",
          border: {
            id: "bronze",
            name: "Bronze",
            image: "/borders/bronze.svg",
            rarity: "common",
            unlocked: true
          },
          role: "Health Enthusiast"
        },
        createdAt: "2024-10-06T12:30:00Z",
        likes: 2,
        isLiked: true
      }
    ]
  },
  {
    id: "c2",
    content: "Kalau untuk pemula seperti saya, lebih baik mulai dari yang culinary grade dulu ya? Atau langsung ceremonial?",
    author: {
      name: "Rina Patel",
      avatar: "/avatars/rina.jpg",
      border: {
        id: "crystal",
        name: "Crystal",
        image: "/borders/crystal.svg",
        rarity: "epic",
        unlocked: true
      },
      role: "Product Reviewer"
    },
    createdAt: "2024-10-06T13:15:00Z",
    likes: 3,
    isLiked: false
  }
]