"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Heart, ThumbsUp, Laugh, Wow, Sad, Angry } from "lucide-react"
import { toast } from "sonner"

interface SocialReaction {
  emoji: string
  icon: any
  label: string
  color: string
}

interface SocialReactionsProps {
  postId: string
  currentUserId?: string
  onReactionChange?: (reaction: string | null, newLikesCount?: number) => void
  existingReaction?: string | null
  likesCount?: number
}

const reactions: SocialReaction[] = [
  { emoji: "❤️", icon: Heart, label: "Suka", color: "text-red-600" },
]

export function SocialReactions({
  postId,
  currentUserId,
  onReactionChange,
  existingReaction = null,
  likesCount = 0
}: SocialReactionsProps) {
  const [selectedReaction, setSelectedReaction] = useState<string | null>(existingReaction)
  const [isOpen, setIsOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [currentLikesCount, setCurrentLikesCount] = useState(likesCount)

  useEffect(() => {
    setSelectedReaction(existingReaction)
    setCurrentLikesCount(likesCount)
  }, [existingReaction, likesCount])

  const handleReactionSelect = async (reaction: string) => {
    if (!currentUserId || isSubmitting) return

    // Toggle like if clicking the same heart
    const isCurrentlyLiked = selectedReaction === "❤️"
    const newReaction = isCurrentlyLiked ? null : "❤️"

    // IMMEDIATE FEEDBACK: Update UI state right away
    setSelectedReaction(newReaction)
    const newLikesCount = isCurrentlyLiked ? currentLikesCount - 1 : currentLikesCount + 1
    setCurrentLikesCount(newLikesCount)

    // Call parent callback with immediate feedback
    onReactionChange?.(newReaction, newLikesCount)

    setIsSubmitting(true)
    try {
      // API call to save/remove like - connect to post_like table
      const response = await fetch(`/api/social/posts/${postId}/like`, {
        method: isCurrentlyLiked ? 'DELETE' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      const data = await response.json()

      if (data.success) {
        // Update with actual server count if available
        if (data.data.likesCount !== undefined) {
          setCurrentLikesCount(data.data.likesCount)
          onReactionChange?.(newReaction, data.data.likesCount)
        }

        if (newReaction) {
          toast.success("Postingan disukai!")
        } else {
          toast.success("Suka dibatalkan")
        }
      } else {
        // REVERT: If API call fails, revert to original state
        setSelectedReaction(selectedReaction)
        setCurrentLikesCount(currentLikesCount)
        onReactionChange?.(selectedReaction, currentLikesCount)
        toast.error("Gagal menyukai postingan")
      }
    } catch (error) {
      console.error('Error liking post:', error)
      // REVERT: If error occurs, revert to original state
      setSelectedReaction(selectedReaction)
      setCurrentLikesCount(currentLikesCount)
      onReactionChange?.(selectedReaction, currentLikesCount)
      toast.error("Terjadi kesalahan saat menyukai postingan")
    } finally {
      setIsSubmitting(false)
      setIsOpen(false)
    }
  }

  const getCurrentReactionData = () => {
    return reactions.find(r => r.emoji === selectedReaction)
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="ghost"
        size="sm"
        disabled={!currentUserId || isSubmitting}
        onClick={() => handleReactionSelect("❤️")}
        className={`hover:bg-gray-100 transition-colors flex items-center gap-1 ${
          selectedReaction ? 'text-red-600 hover:text-red-700' : 'text-muted-foreground hover:text-foreground'
        }`}
      >
        <Heart className={`h-4 w-4 ${selectedReaction ? 'fill-current' : ''}`} />
        <span className="text-sm">{currentLikesCount}</span>
      </Button>
    </div>
  )
}