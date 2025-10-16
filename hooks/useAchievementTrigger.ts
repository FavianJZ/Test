"use client"

import { useCallback } from 'react'
import { useSession } from 'next-auth/react'

interface AchievementTriggerOptions {
  action: 'post_created' | 'comment_added' | 'follower_gained' | 'forum_post_created' | 'forum_comment_added' | 'recipe_created' | 'border_collected' | 'daily_visit'
  data?: any
}

export function useAchievementTrigger() {
  const { data: session } = useSession()

  const triggerAchievement = useCallback(async (options: AchievementTriggerOptions) => {
    if (!session?.user?.id) {
      console.warn('User not authenticated')
      return null
    }

    try {
      const response = await fetch('/api/achievements/social/check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(options)
      })

      if (!response.ok) {
        throw new Error('Failed to trigger achievement check')
      }

      const result = await response.json()

      if (result.success && result.newAchievements.length > 0) {
        // Dispatch custom event for real-time UI updates
        window.dispatchEvent(new CustomEvent('achievement-unlocked', {
          detail: {
            achievements: result.newAchievements,
            totalPointsAwarded: result.totalPointsAwarded,
            currentStats: result.currentStats
          }
        }))
      }

      return result
    } catch (error) {
      console.error('Error triggering achievement:', error)
      return null
    }
  }, [session?.user?.id])

  return { triggerAchievement }
}