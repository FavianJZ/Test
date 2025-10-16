import { useState, useEffect, useCallback, useRef } from 'react'
import { useSession } from 'next-auth/react'

interface RealtimeSessionData {
  id: string
  email: string
  name: string | null
  image: string | null
  bio: string | null
  location: string | null
  selectedBorder: string
  role: string
}

export function useRealtimeSession() {
  const { data: session, status, update } = useSession()
  const [realtimeData, setRealtimeData] = useState<RealtimeSessionData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const hasInitialized = useRef(false)

  // Fetch fresh user data from database
  const fetchFreshUserData = useCallback(async () => {
    if (!session?.user?.email || isLoading) return

    setIsLoading(true)
    try {
      const response = await fetch('/api/session/refresh')
      if (response.ok) {
        const data = await response.json()
        setRealtimeData(data.user)
      }
    } catch (error) {
      console.error('Error fetching fresh user data:', error)
    } finally {
      setIsLoading(false)
    }
  }, [session?.user?.email, isLoading])

  // Initialize data only once when session loads
  useEffect(() => {
    if (session?.user && !hasInitialized.current) {
      hasInitialized.current = true
      fetchFreshUserData()
    }
  }, [session?.user, fetchFreshUserData])

  // Listen for profile updates
  useEffect(() => {
    const handleProfileUpdate = () => {
      fetchFreshUserData()
    }

    window.addEventListener('profile-updated', handleProfileUpdate)

    return () => {
      window.removeEventListener('profile-updated', handleProfileUpdate)
    }
  }, [fetchFreshUserData])

  // Merge session data with realtime data
  const mergedUser = {
    ...session?.user,
    ...realtimeData,
    // Prefer realtime data for image and other fields
    image: realtimeData?.image || session?.user?.image,
    name: realtimeData?.name || session?.user?.name,
    bio: realtimeData?.bio || session?.user?.bio,
    location: realtimeData?.location || session?.user?.location,
    selectedBorder: realtimeData?.selectedBorder || session?.user?.selectedBorder,
  }

  return {
    session: session ? {
      ...session,
      user: mergedUser
    } : null,
    status,
    isLoading,
    fetchFreshUserData
  }
}