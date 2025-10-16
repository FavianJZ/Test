"use client"

import { useState, useEffect } from "react"
import { BorderDisplay } from "@/components/ui/border-display"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { User } from "lucide-react"
import { useBorderData } from "@/hooks/useBorderData"

interface ForumUserBorderProps {
  userId: string
  borderId?: string | null // deprecated, will use userId to fetch user data
  avatarSrc?: string // deprecated, will use userId to fetch user data
  avatarName?: string // deprecated, will use userId to fetch user data
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "preborder" | "forum" | "threads"
  showUserInfo?: boolean
  badgeText?: string
}

export function ForumUserBorder({
  userId,
  borderId, // kept for compatibility but will be ignored
  avatarSrc, // kept for compatibility but will be ignored
  avatarName, // kept for compatibility but will be ignored
  size = "forum",
  showUserInfo = false,
  badgeText
}: ForumUserBorderProps) {
  const [userData, setUserData] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  // Use border data hook for database connection
  const { getBorderById, loading: borderLoading } = useBorderData()

  useEffect(() => {
    if (userId) {
      fetchUserData()
    }
  }, [userId])

  const fetchUserData = async () => {
    setLoading(true)
    try {
      // Fetch user data directly from API
      console.log('ForumUserBorder: Fetching user data for userId:', userId)
      const response = await fetch(`/api/users/${userId}`)
      if (response.ok) {
        const result = await response.json()
        console.log('ForumUserBorder: API response received:', result)

        // Extract user data from the response structure
        const user = result.success ? result.data : result
        console.log('ForumUserBorder: User data extracted:', user)
        setUserData(user)
      } else {
        console.error('ForumUserBorder: Failed to fetch user data, response:', response.status)
      }
    } catch (error) {
      console.error('ForumUserBorder: Error fetching user data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Get border data from database (or provide fallback default)
  const getBorderFromDatabase = (borderId: string) => {
    console.log(`🔍 ForumUserBorder: Looking up border ${borderId} from database...`)

    // Try to get border from database via hook
    const borderFromDb = getBorderById(borderId)

    if (borderFromDb) {
      console.log(`✅ ForumUserBorder: Found border ${borderId} in database:`, borderFromDb)
      return borderFromDb
    }

    // Fallback to default border if not found in database
    console.log(`⚠️ ForumUserBorder: Border ${borderId} not found in database, using default`)
    const defaultBorder = {
      id: 'default',
      name: 'Default',
      imageUrl: '/borders/default.png',
      unlocked: true,
      rarity: 'COMMON' as const
    }
    return defaultBorder
  }

  // Show loading state while fetching user data or border data
  if (loading || borderLoading) {
    console.log('🔄 ForumUserBorder: Loading user or border data...')
    return (
      <Avatar className={size === "xs" ? "h-6 w-6" : size === "sm" ? "h-8 w-8" : size === "md" ? "h-10 w-10" : size === "lg" ? "h-12 w-12" : "h-14 w-14"}>
        <AvatarFallback className="text-xs">
          <User className="h-3 w-3" />
        </AvatarFallback>
      </Avatar>
    )
  }

  if (!userData) {
    console.log('❌ ForumUserBorder: No user data, showing fallback avatar')
    // Fallback to simple avatar if no user data
    return (
      <Avatar className={size === "xs" ? "h-6 w-6" : size === "sm" ? "h-8 w-8" : size === "md" ? "h-10 w-10" : size === "lg" ? "h-12 w-12" : "h-14 w-14"}>
        <AvatarImage src={avatarSrc} alt={avatarName} />
        <AvatarFallback className="text-xs">
          <User className="h-3 w-3" />
        </AvatarFallback>
      </Avatar>
    )
  }

  console.log('🔍 ForumUserBorder: userData.selectedBorder:', userData.selectedBorder)

  // Get border from database
  const borderData = userData.selectedBorder ? getBorderFromDatabase(userData.selectedBorder) : getBorderFromDatabase('default')
  console.log('🔍 ForumUserBorder: final borderData:', borderData)

  console.log('✅ ForumUserBorder: Rendering BorderDisplay with border:', {
    id: borderData.id,
    name: borderData.name,
    image: borderData.imageUrl,
    unlocked: borderData.unlocked,
    rarity: borderData.rarity
  })

  return (
    <BorderDisplay
      border={{
        id: borderData.id,
        name: borderData.name,
        image: borderData.imageUrl,
        unlocked: borderData.unlocked,
        rarity: borderData.rarity
      }}
      userAvatar={userData.image}
      userName={showUserInfo ? userData.name : undefined}
      size={size}
      showUserInfo={showUserInfo}
      showBadge={showUserInfo && !!badgeText}
      badgeText={badgeText || (borderData.rarity ? borderData.rarity.charAt(0).toUpperCase() + borderData.rarity.slice(1).toLowerCase() + ' Member' : 'Member')}

      orientation="horizontal"
    />
  )
}