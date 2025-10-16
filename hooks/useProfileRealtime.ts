import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'

interface ProfileData {
  id: string
  name: string | null
  email: string
  bio: string | null
  location: string | null
  selectedBorder: string
}

interface BorderData {
  id: string
  name: string
  imageUrl: string
  rarity: string
  unlocked: boolean
  price: number | null
}

export function useProfileRealtime() {
  const { data: session } = useSession()
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [userBorder, setUserBorder] = useState<BorderData | null>(null)
  const [userPoints, setUserPoints] = useState<number>(0)
  const [isLoading, setIsLoading] = useState(false)

  // Fetch all profile data
  const fetchProfileData = useCallback(async () => {
    if (!session?.user?.id) return

    setIsLoading(true)
    try {
      const [profileResponse, bordersResponse, pointsResponse, activitiesResponse] = await Promise.all([
        fetch('/api/profile-raw'),
        fetch('/api/borders-raw'),
        fetch('/api/points-raw'),
        fetch('/api/activities-raw?limit=10')
      ])

      if (profileResponse.ok && bordersResponse.ok && pointsResponse.ok && activitiesResponse.ok) {
        const profileData = await profileResponse.json()
        const bordersData = await bordersResponse.json()
        const pointsData = await pointsResponse.json()
        const activitiesData = await activitiesResponse.json()

        
        // Set profile data
        setProfile(profileData.user)

        // Set user points
        setUserPoints(pointsData.data?.points || 0)

        // Set user border
        if (profileData.user.selectedBorder && bordersData.data) {
          const border = bordersData.data.find((b: any) => b.id === profileData.user.selectedBorder)
          if (border) {
            setUserBorder({
              id: border.id,
              name: border.name,
              imageUrl: border.imageUrl,
              rarity: border.rarity,
              unlocked: border.unlocked,
              price: border.price
            })
          }
        }

        // Store activities data for profile page to use
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('activities-updated', {
            detail: activitiesData.activities || []
          }))
        }
      }
    } catch (error) {
      console.error('Error fetching profile data:', error)
    } finally {
      setIsLoading(false)
    }
  }, [session?.user?.id])

  // Update profile
  const updateProfile = useCallback(async (data: Partial<ProfileData>) => {
    if (!session?.user?.id) return false

    setIsLoading(true)
    try {
      const response = await fetch('/api/profile-raw', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      })

      if (response.ok) {
        // Update local state immediately
        setProfile(prev => prev ? { ...prev, ...data } : null)

        // If border changed, update userBorder state
        if (data.selectedBorder && userBorder) {
          setUserBorder(prev => prev ? { ...prev, id: data.selectedBorder } : null)
        }

        return true
      }
      return false
    } catch (error) {
      console.error('Error updating profile:', error)
      return false
    } finally {
      setIsLoading(false)
    }
  }, [session?.user?.id, userBorder])

  // Select border
  const selectBorder = useCallback(async (borderId: string) => {
    if (!session?.user?.id) return false

    setIsLoading(true)
    try {
      const response = await fetch('/api/borders-raw', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action: 'select', borderId })
      })

      if (response.ok) {
        const data = await response.json()

        // Update local states immediately
        setProfile(prev => prev ? { ...prev, selectedBorder: borderId } : null)

        // Update userBorder with new border
        if (data.data) {
          const border = data.data.find((b: any) => b.id === borderId)
          if (border) {
            setUserBorder({
              id: border.id,
              name: border.name,
              imageUrl: border.imageUrl,
              rarity: border.rarity,
              unlocked: border.unlocked,
              price: border.price
            })
          }
        }

        return { success: true, message: data.message }
      }

      const errorData = await response.json()
      return { success: false, error: errorData.error || 'Failed to select border' }
    } catch (error) {
      console.error('Error selecting border:', error)
      return { success: false, error: 'Terjadi kesalahan saat memilih border' }
    } finally {
      setIsLoading(false)
    }
  }, [session?.user?.id])

  // Purchase border
  const purchaseBorder = useCallback(async (borderId: string) => {
    if (!session?.user?.id) return false

    setIsLoading(true)
    try {
      const response = await fetch('/api/borders-raw', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action: 'purchase', borderId })
      })

      const data = await response.json()

      if (response.ok && data.success) {
        // Refresh data to get updated points and border
        await fetchProfileData()
        return { success: true, message: data.message, newPointsBalance: data.newPointsBalance }
      }

      return { success: false, error: data.error || 'Failed to purchase border' }
    } catch (error) {
      console.error('Error purchasing border:', error)
      return { success: false, error: 'Terjadi kesalahan saat membeli border' }
    } finally {
      setIsLoading(false)
    }
  }, [session?.user?.id, fetchProfileData])

  // Initial fetch
  useEffect(() => {
    fetchProfileData()
  }, [fetchProfileData])

  return {
    profile,
    userBorder,
    userPoints,
    isLoading,
    fetchProfileData,
    updateProfile,
    selectBorder,
    purchaseBorder
  }
}