"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Hash, TrendingUp, Clock, Users, Heart, MessageCircle } from "lucide-react"
import { toast } from "sonner"

interface Topic {
  hashtag: string
  mentionCount: number
  totalLikes: number
  totalComments: number
  uniqueUsers: number
  avgEngagement: number
  trendingScore: number
}

interface TrendingTopicsProps {
  timeRange?: 'hour' | 'day' | 'week' | 'month'
  maxItems?: number
  showTimeRangeSelector?: boolean
  onHashtagClick?: (hashtag: string) => void
}

const timeRanges = [
  { value: 'hour', label: '1 Jam', icon: Clock },
  { value: 'day', label: '24 Jam', icon: Clock },
  { value: 'week', label: '7 Hari', icon: Clock },
  { value: 'month', label: '30 Hari', icon: Clock }
]

export function TrendingTopics({
  timeRange = 'day',
  maxItems = 10,
  showTimeRangeSelector = true,
  onHashtagClick
}: TrendingTopicsProps) {
  const [topics, setTopics] = useState<Topic[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentTimeRange, setCurrentTimeRange] = useState(timeRange)

  const fetchTopics = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch(`/api/social/topics?timeRange=${currentTimeRange}&limit=${maxItems}`)
      const data = await response.json()

      if (data.success) {
        setTopics(data.data.topics)
      } else {
        setError(data.error || 'Failed to fetch trending topics')
      }
    } catch (error) {
      console.error('Error fetching trending topics:', error)
      setError('Failed to fetch trending topics')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTopics()
  }, [currentTimeRange, maxItems])

  const handleTopicClick = (hashtag: string) => {
    if (onHashtagClick) {
      onHashtagClick(hashtag)
    } else {
      // Fallback: Copy hashtag to clipboard
      navigator.clipboard.writeText(hashtag)
        .then(() => {
          toast.success(`Topik ${hashtag} disalin ke clipboard!`)
        })
        .catch(() => {
          toast.error('Gagal menyalin topik ke clipboard')
        })
    }
  }

  const formatNumber = (num: number) => {
    if (num >= 1000) return `${(num / 1000).toFixed(1)}k`
    return num.toString()
  }

  const getTrendIndicator = (index: number) => {
    if (index === 0) return { icon: TrendingUp, color: 'text-green-600', label: 'Terpopuler' }
    if (index <= 2) return { icon: TrendingUp, color: 'text-blue-600', label: 'Trending' }
    return { icon: TrendingUp, color: 'text-gray-600', label: 'Naik' }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Topik Trending</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-lg border animate-pulse">
                <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-red-600">
          Error: {error}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Hash className="h-5 w-5" />
            Topik Trending
          </CardTitle>
          {showTimeRangeSelector && (
            <div className="flex gap-2">
              {timeRanges.map((range) => (
                <Button
                  key={range.value}
                  variant={currentTimeRange === range.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentTimeRange(range.value as any)}
                  className="flex items-center gap-1"
                >
                  <range.icon className="h-3 w-3" />
                  {range.label}
                </Button>
              ))}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {topics.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Hash className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Belum ada topik trending untuk {timeRanges.find(r => r.value === currentTimeRange)?.label.toLowerCase()}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {topics.map((topic, index) => (
              <div
                key={topic.hashtag}
                className="flex items-center gap-3 p-3 rounded-lg border hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => handleTopicClick(topic.hashtag)}
              >
                <Hash className="h-5 w-5 text-blue-500" />
                <div className="flex-1">
                  <span className="font-medium text-blue-600 hover:text-blue-800">
                    #{topic.hashtag}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    <span>{formatNumber(topic.uniqueUsers)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MessageCircle className="h-3 w-3" />
                    <span>{formatNumber(topic.totalComments)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Heart className="h-3 w-3" />
                    <span>{formatNumber(topic.totalLikes)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {topics.length > 0 && (
          <div className="mt-4 pt-4 border-t">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Total {topics.length} topik trending</span>
              <span>Update otomatis</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}