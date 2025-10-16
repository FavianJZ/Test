"use client"

import { useState } from "react"
import { SocialFeed } from "@/components/social/social-feed/social-feed"
import { SocialSearch } from "@/components/social/social-search"
import { TrendingTopics } from "@/components/social/trending-topics"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Home, TrendingUp, Users, Bookmark, Search, BarChart3, Hash } from "lucide-react"
import Link from "next/link"

export default function SocialPage() {
  const [activeMode, setActiveMode] = useState<"home" | "trending" | "search">("home")
  const [searchQuery, setSearchQuery] = useState("")
  const [hashtagFilter, setHashtagFilter] = useState("")
  const [timeRange, setTimeRange] = useState<"hour" | "day" | "week" | "month">("day")
  const [showSearch, setShowSearch] = useState(false)

  const handleHashtagClick = (hashtag: string) => {
    setHashtagFilter(hashtag)
    setActiveMode("search")
    setSearchQuery(`#${hashtag}`)
  }

  const clearHashtagFilter = () => {
    setHashtagFilter("")
    setSearchQuery("")
  }

  const tabs = [
    { id: "home", label: "Beranda", icon: Home, mode: "home" as const },
    { id: "trending", label: "Trending", icon: TrendingUp, mode: "trending" as const },
    { id: "search", label: "Cari", icon: Search, mode: "search" as const },
  ]

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                Komunitas Sosial
              </h1>
              <p className="text-muted-foreground">
                {hashtagFilter
                  ? `Menampilkan post dengan hashtag #${hashtagFilter}`
                  : "Terhubung dengan komunitas pecinta matcha dan teh Jepang"
                }
              </p>
            </div>
            {hashtagFilter && (
              <Button
                variant="outline"
                size="sm"
                onClick={clearHashtagFilter}
                className="flex items-center gap-2"
              >
                <Hash className="h-4 w-4" />
                #{hashtagFilter}
                <span className="text-xs">✕</span>
              </Button>
            )}
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 p-1 bg-gray-100 rounded-lg">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                tab.href ? (
                  <Link key={tab.id} href={tab.href}>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex items-center gap-2 rounded-md transition-all duration-200 hover:bg-gray-200"
                    >
                      <Icon className="h-4 w-4" />
                      <span className="hidden sm:inline">{tab.label}</span>
                      <span className="sm:hidden">{tab.label.charAt(0)}</span>
                    </Button>
                  </Link>
                ) : (
                  <Button
                    key={tab.id}
                    variant={activeMode === tab.mode ? "default" : "ghost"}
                    size="sm"
                    className={`flex items-center gap-2 rounded-md transition-all duration-200 ${
                      activeMode === tab.mode
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "hover:bg-gray-200"
                    }`}
                    onClick={() => setActiveMode(tab.mode)}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="hidden sm:inline">{tab.label}</span>
                    <span className="sm:hidden">{tab.label.charAt(0)}</span>
                  </Button>
                )
              )
            })}

            {/* Additional Controls */}
            {activeMode === 'trending' && (
              <div className="ml-auto">
                <Select value={timeRange} onValueChange={(value: any) => setTimeRange(value)}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hour">1 Jam</SelectItem>
                    <SelectItem value="day">24 Jam</SelectItem>
                    <SelectItem value="week">7 Hari</SelectItem>
                    <SelectItem value="month">30 Hari</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {activeMode === 'search' && (
              <div className="ml-auto w-96">
                <SocialSearch
                  onResultClick={() => {}}
                  onQueryChange={setSearchQuery}
                  className="w-full"
                />
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Feed */}
          <div className="lg:col-span-2">
            <SocialFeed
              mode={activeMode}
              searchQuery={searchQuery}
              timeRange={timeRange}
            />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Trending Topics */}
            <TrendingTopics
              timeRange={timeRange}
              maxItems={10}
              showTimeRangeSelector={false}
              onHashtagClick={handleHashtagClick}
            />

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Aksi Cepat</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link href="/social/trending">
                    Lihat Trending
                  </Link>
                </Button>
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link href="/social/search">
                    Cari Konten
                  </Link>
                </Button>
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link href="/forum">
                    Kunjungi Forum
                  </Link>
                </Button>
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link href="/marketplace">
                    Jelajahi Marketplace
                  </Link>
                </Button>
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link href="/achievements">
                    Lihat Pencapaian
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}