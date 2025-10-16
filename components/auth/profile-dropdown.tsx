"use client"

import { useState, useEffect } from "react"
import { useSession, signOut } from "next-auth/react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { BorderPreview } from "@/components/ui/border-preview"
import { useProfileRealtime } from "@/hooks/useProfileRealtime"
import { useRealtimeSession } from "@/hooks/useRealtimeSession"
import { User, LogOut, ShoppingBag, Coins, Star, Trophy, Users } from "lucide-react"

export function ProfileDropdown() {
  const { data: originalSession } = useSession()
  const { session, fetchFreshUserData } = useRealtimeSession()
  const [isOpen, setIsOpen] = useState(false)
  const [currentAvatarUrl, setCurrentAvatarUrl] = useState<string>("")
  const [friendRequestCount, setFriendRequestCount] = useState(0)

  // Use real-time profile hook
  const { userBorder, userPoints, fetchProfileData } = useProfileRealtime()

  // Fetch friend request count
  useEffect(() => {
    if (!session?.user?.id) return

    const fetchFriendRequests = async () => {
      try {
        const response = await fetch('/api/friends?type=received')
        if (response.ok) {
          const data = await response.json()
          setFriendRequestCount(data.requests?.length || 0)
        }
      } catch (error) {
        console.error('Error fetching friend requests:', error)
      }
    }

    fetchFriendRequests()

    // Set up polling for real-time updates (every 30 seconds)
    const interval = setInterval(fetchFriendRequests, 30000)

    return () => clearInterval(interval)
  }, [session])

  // Function to extract timestamp from image URL or add new one
  const getAvatarUrlWithTimestamp = (imageUrl: string | null | undefined) => {
    if (!imageUrl) return ""

    // Check if URL already has timestamp parameter
    const url = new URL(imageUrl, window.location.origin)
    const existingTimestamp = url.searchParams.get('t')

    if (existingTimestamp) {
      return imageUrl
    }

    // Extract timestamp from filename if it exists (our upload format)
    const filename = imageUrl.split('/').pop() || ''
    const timestampMatch = filename.match(/_(\d+)\./)

    if (timestampMatch) {
      const fileTimestamp = timestampMatch[1]
      const separator = imageUrl.includes('?') ? '&' : '?'
      return `${imageUrl}${separator}t=${fileTimestamp}`
    }

    // Fallback: use current timestamp only if no existing timestamp found
    const timestamp = Date.now()
    const separator = imageUrl.includes('?') ? '&' : '?'
    return `${imageUrl}${separator}t=${timestamp}`
  }

  // Initialize and update avatar URL with cache busting
  useEffect(() => {
    setCurrentAvatarUrl(getAvatarUrlWithTimestamp(session?.user?.image))
  }, [session?.user?.image])

  // Listen for profile updates from other components
  useEffect(() => {
    const handleProfileUpdate = () => {
      fetchProfileData()
    }

    // Handle avatar updates with cache busting
    const handleAvatarUpdate = (event: CustomEvent) => {
      if (event.detail.image) {
        const newUrl = getAvatarUrlWithTimestamp(event.detail.image)
        setCurrentAvatarUrl(newUrl)
        fetchProfileData()
        fetchFreshUserData()
      }
    }

    // Listen for custom events from profile page
    window.addEventListener('profile-updated', handleProfileUpdate)
    window.addEventListener('profile-updated', handleAvatarUpdate as EventListener)
    window.addEventListener('border-updated', handleProfileUpdate)
    window.addEventListener('points-updated', handleProfileUpdate)

    return () => {
      window.removeEventListener('profile-updated', handleProfileUpdate)
      window.removeEventListener('profile-updated', handleAvatarUpdate as EventListener)
      window.removeEventListener('border-updated', handleProfileUpdate)
      window.removeEventListener('points-updated', handleProfileUpdate)
    }
  }, [fetchProfileData, fetchFreshUserData])

  
  if (!session) {
    return null
  }

  const userInitials = session.user?.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase() || "U"

  const handleLogout = async () => {
    try {
      await signOut({
        redirect: true,
        callbackUrl: '/'
      })
      toast.success("Logout berhasil!")
    } catch (error) {
      toast.error("Gagal logout")
    }
  }

  const handleButtonClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const newIsOpen = !isOpen
    setIsOpen(newIsOpen)

    // Refresh data when opening dropdown
    if (newIsOpen && session?.user) {
      fetchProfileData()
    }
  }

  const handleMenuItemClick = (action: string) => {
    setIsOpen(false)

    if (action === 'logout') {
      handleLogout()
    }
    // TODO: Add navigation for other menu items
    if (action === 'profile') {
      // Navigate to profile page
      window.location.href = '/profile'
    }
    if (action === 'orders') {
      // Navigate to orders page
      window.location.href = '/orders'
    }
  }

  return (
    <div className="relative">
      {/* Avatar Button with Border */}
      <Button
        variant="ghost"
        className="relative h-12 w-12 rounded-full hover:bg-gray-100 transition-colors p-0 items-center justify-center"
        aria-label="User menu"
        onClick={handleButtonClick}
      >
        {userBorder ? (
          <BorderPreview
            border={userBorder}
            size="xl"
            avatarSrc={currentAvatarUrl}
            avatarName={session.user?.name || ""}
            showLabel={false}
            showLockStatus={false}
          />
        ) : (
          <Avatar className="h-10 w-10">
            <AvatarImage src={currentAvatarUrl} alt={session.user?.name || ""} />
            <AvatarFallback className="bg-primary text-primary-foreground font-medium">
              {userInitials}
            </AvatarFallback>
          </Avatar>
        )}
      </Button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          <div
            className="absolute right-0 top-12 w-56 bg-popover border border-border rounded-md shadow-lg z-50"
            onClick={(e) => e.stopPropagation()}
          >
            {/* User Info Header with Border */}
            <div className="p-3 border-b border-border">
              <div className="flex items-center gap-3">
                {userBorder ? (
                  <BorderPreview
                    border={userBorder}
                    size="xl"
                    avatarSrc={currentAvatarUrl}
                    avatarName={session.user?.name || ""}
                    showLabel={false}
                    showLockStatus={false}
                  />
                ) : (
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={currentAvatarUrl} alt={session.user?.name || ""} />
                    <AvatarFallback className="bg-primary text-primary-foreground font-medium">
                      {userInitials}
                    </AvatarFallback>
                  </Avatar>
                )}
                <div className="flex flex-col flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{session.user?.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{session.user?.email}</p>

                  {/* Border Info with Rarity */}
                  {userBorder && (
                    <div className="flex items-center gap-1 mt-1">
                      <Star className={`h-3 w-3 ${
                        userBorder.name === 'Bronze' ? 'text-amber-700' :
                        userBorder.name === 'Silver' ? 'text-zinc-300' :
                        userBorder.name === 'Gold' ? 'text-amber-400' :
                        userBorder.rarity === 'Default' ? 'text-gray-400' :
                        userBorder.rarity === 'Common' ? 'text-gray-500' :
                        userBorder.rarity === 'Uncommon' ? 'text-emerald-400' :
                        userBorder.rarity === 'Rare' ? 'text-sky-400' :
                        userBorder.rarity === 'Epic' ? 'text-violet-400' :
                        userBorder.rarity === 'Legendary' ? 'text-amber-500' :
                        userBorder.rarity === 'Mythic' ? 'text-rose-500' :
                        'text-gray-500'
                      }`} />
                      <p className={`text-xs ${
                        userBorder.name === 'Bronze' ? 'text-amber-700' :
                        userBorder.name === 'Silver' ? 'text-zinc-300' :
                        userBorder.name === 'Gold' ? 'text-amber-400' :
                        userBorder.rarity === 'Default' ? 'text-gray-400' :
                        userBorder.rarity === 'Common' ? 'text-gray-500' :
                        userBorder.rarity === 'Uncommon' ? 'text-emerald-400' :
                        userBorder.rarity === 'Rare' ? 'text-sky-400' :
                        userBorder.rarity === 'Epic' ? 'text-violet-400' :
                        userBorder.rarity === 'Legendary' ? 'text-amber-500' :
                        userBorder.rarity === 'Mythic' ? 'text-rose-500' :
                        'text-gray-500'
                      }`}>
                        {userBorder.name}
                      </p>

                    </div>
                  )}
                </div>
              </div>

              {/* Points Display */}
              <div className="flex items-center gap-2 mt-2 pt-2 border-t border-border/50">
                <Coins className="h-4 w-4 text-yellow-500" />
                <span className="text-sm font-medium">{userPoints.toLocaleString()} Points</span>
              </div>
            </div>

            {/* Menu Items */}
            <div className="py-1">
              <button
                className="w-full px-3 py-2 text-left hover:bg-accent hover:text-accent-foreground flex items-center gap-3 text-sm"
                onClick={() => handleMenuItemClick('profile')}
              >
                <User className="h-4 w-4" />
                <span>Profile</span>
              </button>

              <button
                className="w-full px-3 py-2 text-left hover:bg-accent hover:text-accent-foreground flex items-center gap-3 text-sm relative"
                onClick={() => window.location.href = '/friends'}
              >
                <Users className="h-4 w-4" />
                <span>Friends</span>
                {friendRequestCount > 0 && (
                  <span className="absolute right-3 bg-destructive text-destructive-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
                    {friendRequestCount > 99 ? '99+' : friendRequestCount}
                  </span>
                )}
              </button>

              <button
                className="w-full px-3 py-2 text-left hover:bg-accent hover:text-accent-foreground flex items-center gap-3 text-sm"
                onClick={() => handleMenuItemClick('orders')}
              >
                <ShoppingBag className="h-4 w-4" />
                <span>Pesanan Saya</span>
              </button>

              <button
                className="w-full px-3 py-2 text-left hover:bg-accent hover:text-accent-foreground flex items-center gap-3 text-sm"
                onClick={() => window.location.href = '/achievements'}
              >
                <Trophy className="h-4 w-4" />
                <span>Achievements</span>
              </button>

              <div className="border-t border-border my-1"></div>

              <button
                className="w-full px-3 py-2 text-left hover:bg-accent hover:text-destructive flex items-center gap-3 text-sm text-destructive"
                onClick={() => handleMenuItemClick('logout')}
              >
                <LogOut className="h-4 w-4" />
                <span>Log out</span>
              </button>
            </div>
          </div>

          {/* Backdrop for clicking outside */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
        </>
      )}
    </div>
  )
}