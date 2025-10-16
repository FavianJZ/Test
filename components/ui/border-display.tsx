"use client"

import { BorderPreview } from "./border-preview"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"

interface Border {
  id: string
  name: string
  image?: string
  imageUrl?: string
  unlocked: boolean
  rarity?: "COMMON" | "RARE" | "EPIC" | "LEGENDARY" | "MYTHIC" | "BRONZE" | "SILVER" | "GOLD"
}

// Convert BorderDisplay interface to BorderPreview interface
const convertToBorderPreview = (border: Border) => ({
  id: border.id,
  name: border.name,
  imageUrl: border.imageUrl || border.image || '/borders/default.png',
  unlocked: border.unlocked,
  rarity: border.rarity as "COMMON" | "RARE" | "EPIC" | "LEGENDARY" | "MYTHIC" | "BRONZE" | "SILVER" | "GOLD"
})

// Get badge styling based on rarity
const getBadgeStyling = (rarity?: string) => {
  const rarityLower = (rarity || 'common').toLowerCase()

  switch (rarityLower) {
    case 'bronze':
      return 'bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-200'
    case 'silver':
      return 'bg-zinc-100 text-zinc-800 border-zinc-200 hover:bg-zinc-200'
    case 'gold':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-200'
    case 'common':
      return 'bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200'
    case 'uncommon':
      return 'bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-200'
    case 'rare':
      return 'bg-sky-100 text-sky-800 border-sky-200 hover:bg-sky-200'
    case 'epic':
      return 'bg-violet-100 text-violet-800 border-violet-200 hover:bg-violet-200'
    case 'legendary':
      return 'bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-200'
    case 'mythic':
      return 'bg-rose-100 text-rose-800 border-rose-200 hover:bg-rose-200'
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200'
  }
}

interface BorderDisplayProps {
  border: Border
  userAvatar?: string
  userName?: string
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "preborder" | "forum" | "threads"
  showUserInfo?: boolean
  showBadge?: boolean
  badgeText?: string
  orientation?: "horizontal" | "vertical"
  className?: string
}

export function BorderDisplay({
  border,
  userAvatar,
  userName,
  size = "xl",
  showUserInfo = false,
  showBadge = false,
  badgeText,
  orientation = "horizontal",
  className = ""
}: BorderDisplayProps) {
  // Handle null/undefined border
  if (!border) {
    console.warn('BorderDisplay: No border data provided, using default')
    border = {
      id: 'default',
      name: 'Default',
      imageUrl: '/borders/default.svg',
      unlocked: true,
      rarity: 'Default'
    }
  }

  console.log('🔍 BorderDisplay: Received border data:', border)
  console.log('🔍 BorderDisplay: Converting border:', {
    id: border.id,
    name: border.name,
    image: border.image,
    imageUrl: border.imageUrl
  })
  if (orientation === "vertical") {
    return (
      <div className={`flex flex-col items-center space-y-2 ${className}`}>
        <BorderPreview
          border={convertToBorderPreview(border)}
          size={size}
          avatarSrc={userAvatar}
          avatarName={userName}
          showLabel={false}
          showLockStatus={false}
        />
        {showUserInfo && userName && (
          <div className="text-center">
            <p className="text-sm font-medium truncate max-w-20">{userName}</p>
            {showBadge && badgeText && (
              <Badge
                variant="outline"
                className={`text-xs mt-1 font-medium ${getBadgeStyling(border.rarity)}`}
              >
                {badgeText}
              </Badge>
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      <BorderPreview
        border={convertToBorderPreview(border)}
        size={size}
        avatarSrc={userAvatar}
        avatarName={userName}
        showLabel={false}
        showLockStatus={false}
      />
      {showUserInfo && userName && (
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">{userName}</p>
          {showBadge && badgeText && (
            <Badge
              variant="outline"
              className={`text-xs mt-1 font-medium ${getBadgeStyling(border.rarity)}`}
            >
              {badgeText}
            </Badge>
          )}
        </div>
      )}
    </div>
  )
}

// Compact version for dropdowns and tight spaces
export function CompactBorderDisplay({
  border,
  userAvatar,
  userName,
  size = "sm",
  className = ""
}: Pick<BorderDisplayProps, "border" | "userAvatar" | "userName" | "size" | "className">) {
  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <BorderPreview
        border={convertToBorderPreview(border)}
        size={size}
        avatarSrc={userAvatar}
        avatarName={userName}
        showLabel={false}
        showLockStatus={false}
      />
      <span className="text-sm font-medium truncate">{userName}</span>
    </div>
  )
}

// Minimal version for user mentions and avatars
export function MinimalBorderDisplay({
  border,
  userAvatar,
  userName,
  size = "xs",
  className = ""
}: Pick<BorderDisplayProps, "border" | "userAvatar" | "userName" | "size" | "className">) {
  return (
    <span className={`inline-flex items-center ${className}`}>
      <BorderPreview
        border={convertToBorderPreview(border)}
        size={size}
        avatarSrc={userAvatar}
        avatarName={userName}
        showLabel={false}
        showLockStatus={false}
      />
    </span>
  )
}