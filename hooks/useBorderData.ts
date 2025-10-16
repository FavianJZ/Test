"use client"

import { useState, useEffect } from "react"

interface Border {
  id: string
  name: string
  imageUrl: string
  unlocked: boolean
  rarity?: "COMMON" | "RARE" | "EPIC" | "LEGENDARY" | "BRONZE" | "SILVER" | "GOLD"
  price?: number | null
}

interface UseBorderDataResult {
  borders: Border[]
  loading: boolean
  error: string | null
  getBorderById: (borderId: string) => Border | null
  refetch: () => Promise<void>
}

// Cache for border data to avoid repeated API calls
let borderCache: Border[] | null = null
let cacheTimestamp: number = 0
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

export function useBorderData(): UseBorderDataResult {
  const [borders, setBorders] = useState<Border[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchBorders = async () => {
    try {
      setLoading(true)
      setError(null)

      // Check cache first
      const now = Date.now()
      if (borderCache && (now - cacheTimestamp) < CACHE_DURATION) {
        console.log('🔍 useBorderData: Using cached border data')
        setBorders(borderCache)
        setLoading(false)
        return
      }

      console.log('🔍 useBorderData: Fetching border data from database...')
      const response = await fetch("/api/borders-public")

      if (!response.ok) {
        throw new Error(`Failed to fetch borders: ${response.status}`)
      }

      const data = await response.json()
      console.log('🔍 useBorderData: Border data received:', data)

      if (data.success && data.data) {
        console.log('🔍 useBorderData: Raw API data received:', data.data)
        borderCache = data.data
        cacheTimestamp = now
        setBorders(data.data)
        console.log('🔍 useBorderData: Border data cached and set, border IDs:', data.data.map((b: Border) => b.id))
      } else {
        throw new Error(data.error || 'Invalid response format')
      }
    } catch (err) {
      console.error('🔍 useBorderData: Error fetching border data:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const getBorderById = (borderId: string): Border | null => {
    console.log(`🔍 useBorderData: Available borders in database:`, borders.map(b => b.id))
    const border = borders.find(b => b.id === borderId)
    console.log(`🔍 useBorderData: Looking for border ${borderId}, found:`, border)
    return border || null
  }

  const refetch = async () => {
    // Clear cache and refetch
    borderCache = null
    cacheTimestamp = 0
    await fetchBorders()
  }

  useEffect(() => {
    fetchBorders()
  }, [])

  return {
    borders,
    loading,
    error,
    getBorderById,
    refetch
  }
}