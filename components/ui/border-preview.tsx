"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Star } from "lucide-react"

interface Border {
  id: string
  name: string
  imageUrl: string
  unlocked: boolean
  rarity?: "COMMON" | "RARE" | "EPIC" | "LEGENDARY"
  price?: number | null
}

interface BorderPreviewProps {
  border: Border
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "preborder" | "forum" | "threads"
  showLabel?: boolean
  showLockStatus?: boolean
  showRarity?: boolean
  avatarSrc?: string
  avatarName?: string
  isSelected?: boolean
  onClick?: () => void
  className?: string
}

const sizeConfig = {
  xs: { container: "w-6 h-6", avatar: "w-4 h-4", inset: "inset-[1px] bottom-[1px]" },
  sm: { container: "w-8 h-8", avatar: "w-6 h-6", inset: "inset-[2px] bottom-[1px]" },
  md: { container: "w-10 h-10", avatar: "w-7 h-7", inset: "inset-[3px] bottom-[2px]" },
  lg: { container: "w-12 h-12", avatar: "w-9 h-9", inset: "inset-[4px] bottom-[2px]" },
  xl: { container: "w-14 h-14", avatar: "w-10 h-10", inset: "bottom-[7px] left-[7px]" },
  "2xl": { container: "w-18 h-18", avatar: "w-14 h-14", inset: "inset-[5px] bottom-[3px]" },
  "3xl": { container: "w-24 h-24", avatar: "w-16 h-16", inset: "bottom-[15px] left-[15px]" },
  preborder: { container: "w-40 h-40", avatar: "w-28 h-28", inset: "inset-[10px] bottom-[6px]" },
  forum:{ container: "w-18 h-18", avatar: "w-13 h-13", inset: " bottom-[8px] left-[9px]" },
  threads: { container: "w-22 h-22", avatar: "w-15 h-15", inset: "bottom-[12px] left-[13px]" }
}




const rarityColors = {
  default: "border-slate-400",
  common: "border-gray-400",
  uncommon: "border-emerald-400",
  rare: "border-sky-400",
  epic: "border-violet-400",
  legendary: "border-amber-400",
  mythic: "border-rose-400",
  bronze: "border-amber-700",
  silver: "border-zinc-400",
  gold: "border-yellow-400",
}

const rarityBgColors = {
  default: "bg-slate-100",
  common: "bg-gray-100",
  uncommon: "bg-emerald-100",
  rare: "bg-sky-100",
  epic: "bg-violet-100",
  legendary: "bg-amber-100",
  mythic: "bg-rose-100",
  bronze: "bg-amber-100",
  silver: "bg-zinc-100",
  gold: "bg-yellow-100",
}


export function BorderPreview({
  border,
  size = "md",
  showLabel = true,
  showLockStatus = true,
  showRarity = false,
  avatarSrc,
  avatarName = "U",
  isSelected = false,
  onClick,
  className = ""
}: BorderPreviewProps) {
  const config = sizeConfig[size] || sizeConfig.md

  const getUserInitials = () => {
    return avatarName
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase() || "U"
  }

  const formatRarity = (rarity: string) => {
    if (!rarity) return ""
    return rarity.charAt(0).toUpperCase() + rarity.slice(1).toLowerCase()
  }

  const getRarityColor = () => {
    if (!border || !border.rarity) return "" // 🛡️ safety check
    const key = border.rarity.toLowerCase() as keyof typeof rarityColors
    return rarityColors[key] || ""
  }

  const getRarityBgColor = () => {
    if (!border || !border.rarity) return ""
    const key = border.rarity.toLowerCase() as keyof typeof rarityBgColors
    return rarityBgColors[key] || ""
  }

  if (!border) {
    return <div className="text-gray-400 text-sm">Loading border...</div>
  }



  return (
    <div
      className={`relative inline-flex flex-col items-center ${onClick ? 'cursor-pointer' : ''} ${className}`}
      onClick={onClick}
    >
      {/* Border Container */}
      <div className={`relative ${config.container} ${isSelected ? 'ring-2 ring-primary ring-offset-2' : ''} overflow-visible`}>
        {/* Border Image */}
        <img
          src={border.imageUrl}
          className={`absolute inset-0 w-full h-full z-20 ${showRarity && border.rarity ? `border-2 ${getRarityColor()}` : ''} overflow-visible`}
          style={{
            objectFit: 'cover',
            objectPosition: 'center',
            overflow: 'visible'
          }}
          onError={(e) => {
            // Fallback to colored border if image fails to load
            e.currentTarget.src = `data:image/svg+xml,${encodeURIComponent(`
              <svg width="${size === 'xs' ? 24 : size === 'sm' ? 32 : size === 'md' ? 48 : size === 'lg' ? 64 : size === 'xl' ? 80 : 96}"
                   height="${size === 'xs' ? 24 : size === 'sm' ? 32 : size === 'md' ? 48 : size === 'lg' ? 64 : size === 'xl' ? 80 : 96}"
                   xmlns="http://www.w3.org/2000/svg">
                <circle cx="${size === 'xs' ? 12 : size === 'sm' ? 16 : size === 'md' ? 24 : size === 'lg' ? 32 : size === 'xl' ? 40 : 48}"
                        cy="${size === 'xs' ? 12 : size === 'sm' ? 16 : size === 'md' ? 24 : size === 'lg' ? 32 : size === 'xl' ? 40 : 48}"
                        r="${size === 'xs' ? 10 : size === 'sm' ? 14 : size === 'md' ? 20 : size === 'lg' ? 28 : size === 'xl' ? 36 : 44}"
                        fill="none"
                        stroke="${border.unlocked ? '#9ca3af' : '#d1d5db'}"
                        stroke-width="${size === 'xs' ? 1 : size === 'sm' ? 1 : size === 'md' ? 2 : size === 'lg' ? 2 : size === 'xl' ? 3 : 3}"/>
                <text x="${size === 'xs' ? 12 : size === 'sm' ? 16 : size === 'md' ? 24 : size === 'lg' ? 32 : size === 'xl' ? 40 : 48}"
                      y="${size === 'xs' ? 16 : size === 'sm' ? 20 : size === 'md' ? 28 : size === 'lg' ? 36 : size === 'xl' ? 44 : 52}"
                      text-anchor="middle"
                      fill="${border.unlocked ? '#6b7280' : '#9ca3af'}"
                      font-size="${size === 'xs' ? 4 : size === 'sm' ? 5 : size === 'md' ? 6 : size === 'lg' ? 8 : size === 'xl' ? 10 : 12}">${border.name.charAt(0)}</text>
              </svg>
            `)}`
          }}
        />

        {/* Avatar */}
        <div className={`absolute ${config.inset} flex items-center justify-center`}>
          <Avatar className={`${config.avatar} relative z-0 ${getRarityBgColor()}`}>
            <AvatarImage
              src={avatarSrc || ""}
              alt={avatarName || ""}
              className="object-cover"
              style={{
                borderRadius: '50%',
                width: '100%',
                height: '100%'
              }}
            />
            <AvatarFallback className={`text-xs font-medium ${size === 'xs' ? 'text-[8px]' : size === 'sm' ? 'text-[10px]' : size === 'md' ? 'text-xs' : size === 'lg' ? 'text-sm' : 'text-base'}`}>
              {getUserInitials()}
            </AvatarFallback>
          </Avatar>
        </div>

        {/* Lock Overlay */}
        {!border.unlocked && showLockStatus && (
          <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center z-20">
            <Star className={`${size === 'xs' ? 'w-2 h-2' : size === 'sm' ? 'w-3 h-3' : size === 'md' ? 'w-4 h-4' : size === 'lg' ? 'w-5 h-5' : size === 'w-6 h-6'} text-yellow-400`} />
          </div>
        )}

        {/* Selected Indicator */}
        {isSelected && (
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full flex items-center justify-center z-30">
            <div className="w-2 h-2 bg-primary-foreground rounded-full"></div>
          </div>
        )}
      </div>

      {/* Label */}
      {showLabel && (
        <div className="mt-1 text-center">
          <p className={`font-medium ${size === 'xs' ? 'text-[8px]' : size === 'sm' ? 'text-[10px]' : size === 'md' ? 'text-xs' : size === 'lg' ? 'text-sm' : 'text-base'}`}>
            {border.name}
          </p>
          {!border.unlocked && showLockStatus && (
            <p className={`text-muted-foreground ${size === 'xs' ? 'text-[6px]' : size === 'sm' ? 'text-[8px]' : size === 'md' ? 'text-[10px]' : size === 'lg' ? 'text-xs' : 'text-sm'}`}>
              🔒 Terkunci
            </p>
          )}
          {showRarity && border.rarity && (
            <Badge variant="outline" className={`text-[8px] h-4 mt-1 ${getRarityColor()}`}>
              {formatRarity(border.rarity)}
            </Badge>
          )}
        </div>
      )}
    </div>
  )
}