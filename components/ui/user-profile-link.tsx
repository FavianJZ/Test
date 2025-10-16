"use client"

import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { User } from "lucide-react"
import { useSession } from "next-auth/react"

interface User {
  id: string
  name: string
  email: string
  avatar?: string
  role?: string
  posts?: number
  joinDate?: string
}

interface UserProfileLinkProps {
  user: User | { name: string; avatar?: string; author_id?: string; author_avatar?: string }
  showRole?: boolean
  showStats?: boolean
  size?: "sm" | "md" | "lg"
  className?: string
}

export function UserProfileLink({
  user,
  showRole = false,
  showStats = false,
  size = "sm",
  className = ""
}: UserProfileLinkProps) {
  const { data: session } = useSession()

  // Handle different user object formats
  const userId = (user as any).author_id || (user as User).id || user.id
  const userName = user.name || (user as any).author_name || "Unknown User"
  const userAvatar = user.avatar || (user as any).author_avatar || ""

  // Determine profile URL based on whether it's the current user
  const isOwnProfile = session?.user?.id === userId
  const profileUrl = isOwnProfile ? "/profile" : (userId ? `/profile/${userId}` : "#")

  const sizeClasses = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg"
  }

  const avatarSizes = {
    sm: "h-6 w-6",
    md: "h-8 w-8",
    lg: "h-10 w-10"
  }

  const handleProfileClick = (e: React.MouseEvent) => {
    if (!userId) {
      e.preventDefault()
      return
    }
  }

  return (
    <Link
      href={profileUrl}
      onClick={handleProfileClick}
      className={`inline-flex items-center gap-2 hover:bg-gray-50 rounded-md px-2 py-1 transition-colors ${className}`}
    >
      <Avatar className={avatarSizes[size]}>
        <AvatarImage src={userAvatar} alt={userName} />
        <AvatarFallback className="text-xs">
          <User className="h-3 w-3" />
        </AvatarFallback>
      </Avatar>
      <div className="flex flex-col items-start">
        <span className={`font-medium text-gray-900 hover:text-blue-600 transition-colors ${sizeClasses[size]}`}>
          {userName}
        </span>
        {showRole && (user as User).role && (
          <Badge variant="outline" className="text-xs">
            {(user as User).role}
          </Badge>
        )}
        {showStats && (user as User).posts && (
          <span className="text-xs text-gray-500">
            {(user as User).posts} posts
          </span>
        )}
      </div>
    </Link>
  )
}