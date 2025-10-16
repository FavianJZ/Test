"use client"

import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Trophy, MessageSquare, Calendar } from "lucide-react"

interface Achievement {
  id: string
  type: string
  title: string
  description?: string
  targetValue: number
  currentValue: number
  isCompleted: boolean
  completedAt?: string
}

interface UserAchievementsProps {
  userId: string
  className?: string
}

export function UserAchievements({ userId, className = "" }: UserAchievementsProps) {
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (userId) {
      fetchAchievements()
    }
  }, [userId])

  const fetchAchievements = async () => {
    try {
      const response = await fetch(`/api/achievements/${userId}`)
      if (response.ok) {
        const data = await response.json()
        setAchievements(data.achievements || [])
      }
    } catch (error) {
      console.error('Failed to fetch achievements:', error)
    } finally {
      setLoading(false)
    }
  }

  const getAchievementIcon = (type: string) => {
    switch (type) {
      case 'FIRST_FORUM_POST':
        return <MessageSquare className="h-3 w-3" />
      case 'FORUM_REGULAR':
        return <MessageSquare className="h-3 w-3" />
      case 'SOCIAL_BUTTERFLY':
        return <MessageSquare className="h-3 w-3" />
      case 'EARLY_ADOPTER':
        return <Trophy className="h-3 w-3" />
      case 'BORDER_COLLECTOR':
        return <Trophy className="h-3 w-3" />
      case 'POINTS_COLLECTOR':
        return <Trophy className="h-3 w-3" />
      case 'DAILY_VISITOR':
        return <Calendar className="h-3 w-3" />
      case 'FORUM_EXPERT':
        return <MessageSquare className="h-3 w-3" />
      case 'COMMENTATOR_PRO':
        return <MessageSquare className="h-3 w-3" />
      case 'ACTIVE_MEMBER':
        return <Calendar className="h-3 w-3" />
      case 'FRIEND_CONNECTOR':
        return <Trophy className="h-3 w-3" />
      case 'DISCUSSION_STARTER':
        return <MessageSquare className="h-3 w-3" />
      case 'HELPFUL_MEMBER':
        return <Trophy className="h-3 w-3" />
      default:
        return <Trophy className="h-3 w-3" />
    }
  }

  // Only show completed achievements
  const completedAchievements = achievements.filter(a => a.isCompleted)

  if (loading) {
    return null
  }

  // Don't render anything if no completed achievements
  if (completedAchievements.length === 0) {
    return null
  }

  return (
    <div className={`mt-1 ${className}`}>
      <div className="flex flex-wrap gap-1">
        {completedAchievements.slice(0, 3).map((achievement) => (
          <Badge
            key={achievement.id}
            variant="outline"
            className="text-xs bg-green-50 text-green-700 border-green-200 flex items-center gap-1"
            title={achievement.title}
          >
            <div className="flex-shrink-0">
              {getAchievementIcon(achievement.type)}
            </div>
            <span className="truncate max-w-[100px]">
              {achievement.title}
            </span>
          </Badge>
        ))}
        {completedAchievements.length > 3 && (
          <Badge
            variant="outline"
            className="text-xs bg-gray-50 text-gray-600 border-gray-200"
          >
            +{completedAchievements.length - 3}
          </Badge>
        )}
      </div>
    </div>
  )
}