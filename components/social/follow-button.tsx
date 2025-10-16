"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { UserPlus, UserCheck, Users } from "lucide-react"
import { toast } from "sonner"

interface FollowButtonProps {
  targetUserId: string
  isFollowing?: boolean
  className?: string
  variant?: "default" | "outline" | "ghost"
  size?: "default" | "sm" | "lg"
  showIcon?: boolean
  onFollowChange?: (isFollowing: boolean) => void
}

export function FollowButton({
  targetUserId,
  isFollowing: initialIsFollowing = false,
  className = "",
  variant = "default",
  size = "default",
  showIcon = true,
  onFollowChange
}: FollowButtonProps) {
  const { data: session } = useSession()
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing)
  const [isLoading, setIsLoading] = useState(false)

  // Update state when prop changes
  useEffect(() => {
    setIsFollowing(initialIsFollowing)
  }, [initialIsFollowing])

  // Don't show follow button for own profile
  if (session?.user?.id === targetUserId) {
    return null
  }

  const handleFollow = async () => {
    if (!session?.user?.id) {
      toast.error("Silakan login terlebih dahulu")
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/social/follow', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          targetUserId
        })
      })

      const data = await response.json()

      if (data.success) {
        const newFollowStatus = data.data.isFollowing
        setIsFollowing(newFollowStatus)
        onFollowChange?.(newFollowStatus)

        toast.success(
          newFollowStatus ? "Berhasil mengikuti pengguna" : "Berhasil berhenti mengikuti"
        )
      } else {
        toast.error(data.error || "Gagal mengubah status follow")
      }
    } catch (error) {
      console.error('Error following/unfollowing user:', error)
      toast.error("Terjadi kesalahan saat mengubah status follow")
    } finally {
      setIsLoading(false)
    }
  }

  const buttonContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          <span>{isFollowing ? "Unfollow..." : "Follow..."}</span>
        </div>
      )
    }

    return (
      <div className="flex items-center gap-2">
        {showIcon && (
          isFollowing ? (
            <UserCheck className="h-4 w-4" />
          ) : (
            <UserPlus className="h-4 w-4" />
          )
        )}
        <span>{isFollowing ? "Following" : "Follow"}</span>
      </div>
    )
  }

  return (
    <Button
      variant={isFollowing ? "outline" : variant}
      size={size}
      onClick={handleFollow}
      disabled={isLoading || !session?.user?.id}
      className={`transition-all duration-200 hover:scale-105 ${
        isFollowing
          ? "hover:bg-red-50 hover:text-red-600 hover:border-red-200"
          : "hover:bg-primary hover:text-primary-foreground"
      } ${className}`}
    >
      {buttonContent()}
    </Button>
  )
}