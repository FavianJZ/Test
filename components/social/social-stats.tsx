"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { BorderDisplay } from "@/components/ui/border-display"
import { Users, MessageSquare, Heart, TrendingUp, Activity } from "lucide-react"

interface TopUser {
  id: string
  name: string
  avatar?: string
  border?: any
  postCount: number
  totalLikes: number
  lastPostDate: string
}

interface SocialStats {
  totalUsers: number
  totalPosts: number
  totalLikes: number
  totalComments: number
  topUsers: TopUser[]
  recentActivity: {
    activityCount: number
    postsWithLikes: number
    postsWithComments: number
  }
  engagementRate: number
}

interface SocialStatsProps {
  timeRange?: 'hour' | 'day' | 'week' | 'month'
  refreshInterval?: number
}

export function SocialStats({ timeRange = 'day', refreshInterval = 30000 }: SocialStatsProps) {
  const [stats, setStats] = useState<SocialStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch(`/api/social/stats?timeRange=${timeRange}`)
      const data = await response.json()

      if (data.success) {
        setStats(data.data)
      } else {
        setError(data.error || 'Failed to fetch statistics')
      }
    } catch (error) {
      console.error('Error fetching social stats:', error)
      setError('Failed to fetch statistics')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()

    if (refreshInterval > 0) {
      const interval = setInterval(fetchStats, refreshInterval)
      return () => clearInterval(interval)
    }
  }, [timeRange, refreshInterval])

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))

    if (diffHours < 1) {
      const diffMins = Math.floor(diffMs / (1000 * 60))
      return `${diffMins} menit yang lalu`
    } else if (diffHours < 24) {
      return `${diffHours} jam yang lalu`
    } else {
      const diffDays = Math.floor(diffHours / 24)
      return `${diffDays} hari yang lalu`
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Statistik Komunitas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center justify-between animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-4 bg-gray-200 rounded w-8"></div>
            </div>
          ))}
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Statistik Komunitas</CardTitle>
        </CardHeader>
        <CardContent className="p-6 text-center text-red-600">
          Error: {error}
        </CardContent>
      </Card>
    )
  }

  if (!stats) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Statistik Komunitas
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Main Stats */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground flex items-center gap-1">
              <Users className="h-3 w-3" />
              Total Pengguna
            </span>
            <Badge variant="secondary">{formatNumber(stats.totalUsers)}</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground flex items-center gap-1">
              <MessageSquare className="h-3 w-3" />
              Total Postingan
            </span>
            <Badge variant="secondary">{formatNumber(stats.totalPosts)}</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground flex items-center gap-1">
              <Heart className="h-3 w-3" />
              Total Suka
            </span>
            <Badge variant="secondary">{formatNumber(stats.totalLikes)}</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground flex items-center gap-1">
              <MessageSquare className="h-3 w-3" />
              Total Komentar
            </span>
            <Badge variant="secondary">{formatNumber(stats.totalComments)}</Badge>
          </div>
        </div>

        {/* Engagement Rate */}
        <div className="border-t pt-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              Engagement Rate
            </span>
            <Badge variant={stats.engagementRate > 5 ? "default" : "secondary"}>
              {stats.engagementRate.toFixed(1)}%
            </Badge>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="border-t pt-3">
          <h4 className="text-sm font-medium mb-2">Aktivitas Terkini</h4>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Postingan aktif</span>
              <span className="font-medium">{stats.recentActivity.activityCount}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Dapat suka</span>
              <span className="font-medium">{stats.recentActivity.postsWithLikes}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Dapat komentar</span>
              <span className="font-medium">{stats.recentActivity.postsWithComments}</span>
            </div>
          </div>
        </div>

        {/* Top Contributors Preview */}
        {stats.topUsers && stats.topUsers.length > 0 && (
          <div className="border-t pt-3">
            <h4 className="text-sm font-medium mb-2">Kontributor Teratas</h4>
            <div className="space-y-2">
              {stats.topUsers.slice(0, 3).map((user, index) => (
                <div key={user.id} className="flex items-center gap-2">
                  <span className="text-xs font-bold text-muted-foreground w-4">
                    {index + 1}.
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{user.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {user.postCount} postingan • {formatNumber(user.totalLikes)} suka
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}