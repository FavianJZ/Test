"use client"

import { useState, useEffect } from "react"

interface Border {
  id: string
  name: string
  imageUrl: string
  unlocked: boolean
  rarity?: "COMMON" | "RARE" | "EPIC" | "LEGENDARY"
  price?: number | null
}

export function useUserBorder(userId?: string) {
  const [border, setBorder] = useState<Border | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) {
      setLoading(false)
      return
    }

    const fetchUserBorder = async () => {
      try {
        const response = await fetch(`/api/users/${userId}/border`)
        if (response.ok) {
          const data = await response.json()
          if (data.border) {
            setBorder(data.border)
          }
        }
      } catch (error) {
        console.error('Error fetching user border:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchUserBorder()
  }, [userId])

  return { border, loading }
}

// Hook untuk multiple users (optimized for lists)
export function useUserBorders(userIds: string[]) {
  const [borders, setBorders] = useState<Record<string, Border | null>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userIds || userIds.length === 0) {
      setLoading(false)
      return
    }

    const fetchUserBorders = async () => {
      try {
        // Fetch borders for all users in parallel
        const borderPromises = userIds.map(async (userId) => {
          try {
            const response = await fetch(`/api/users/${userId}/border`)
            if (response.ok) {
              const data = await response.json()
              return { userId, border: data.border || null }
            }
            return { userId, border: null }
          } catch (error) {
            console.error(`Error fetching border for user ${userId}:`, error)
            return { userId, border: null }
          }
        })

        const results = await Promise.all(borderPromises)

        const borderMap: Record<string, Border | null> = {}
        results.forEach(({ userId, border }) => {
          borderMap[userId] = border
        })

        setBorders(borderMap)
      } catch (error) {
        console.error('Error fetching user borders:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchUserBorders()
  }, [userIds.join(',')]) // Convert to string for proper comparison

  return { borders, loading }
}