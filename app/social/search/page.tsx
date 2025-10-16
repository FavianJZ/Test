"use client"

import { useState } from "react"
import { SocialSearch } from "@/components/social/social-search"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Search, TrendingUp, Clock, Hash } from "lucide-react"
import Link from "next/link"

export default function SearchPage() {
  const [hasSearched, setHasSearched] = useState(false)

  const handleResultClick = (result: any) => {
    setHasSearched(true)
    // Handle result click - navigate to post or user profile
    if (result.type === 'post') {
      // Navigate to post
      console.log('Navigate to post:', result.id)
    } else if (result.type === 'user') {
      // Navigate to user profile
      console.log('Navigate to user:', result.id)
    }
  }

  const popularSearches = [
    { query: "matcha", count: 342 },
    { query: "teh jepang", count: 256 },
    { query: "ceremoni teh", count: 189 },
    { query: "resep matcha", count: 167 },
    { query: "budaya jepang", count: 145 },
    { query: "tips teh", count: 128 },
  ]

  const trendingTopics = [
    { topic: "#MatchaMonday", posts: 89 },
    { topic: "#TehCeremony", posts: 67 },
    { topic: "#JapaneseCulture", posts: 45 },
    { topic: "#TeaTime", posts: 34 },
    { topic: "#ZenMoments", posts: 28 },
  ]

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
              <Search className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                Pencarian Sosial
              </h1>
              <p className="text-muted-foreground">
                Temukan postingan, pengguna, dan topik menarik di komunitas HikariCha
              </p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="mb-6">
            <SocialSearch onResultClick={handleResultClick} />
          </div>
        </div>

        {!hasSearched && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Popular Searches */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-orange-600" />
                    Pencarian Populer
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {popularSearches.map((item, index) => (
                    <div key={item.query} className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 cursor-pointer transition-colors">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold text-muted-foreground w-6">
                          {index + 1}
                        </span>
                        <span className="font-medium">{item.query}</span>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {item.count} hasil
                      </Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Trending Topics */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Hash className="h-5 w-5 text-blue-600" />
                    Topik Trending
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {trendingTopics.map((topic) => (
                    <div key={topic.topic} className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 cursor-pointer transition-colors">
                      <span className="font-medium text-blue-600 hover:text-blue-700">
                        {topic.topic}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {topic.posts} postingan
                      </Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Search Tips */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Tips Pencarian</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-sm text-muted-foreground space-y-2">
                    <p>💡 <strong>Gunakan kata kunci spesifik</strong> untuk hasil yang lebih relevan</p>
                    <p>🔍 <strong>Coba variasi kata</strong> jika tidak menemukan yang dicari</p>
                    <p>📱 <strong>Filter berdasarkan tipe</strong> (postingan/pengguna) untuk mempersempit hasil</p>
                    <p>⏰ <strong>Gunakan trending topics</strong> untuk menemukan konten populer</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Quick Stats */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Statistik Pencarian</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Total Pencarian</span>
                    <Badge variant="secondary">1,234</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Hari Ini</span>
                    <Badge variant="secondary">89</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Topik Terpopuler</span>
                    <Badge variant="secondary">Matcha</Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Searches */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Clock className="h-5 w-5 text-gray-600" />
                    Pencarian Terakhir
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {["tips matcha", "teh hijau", "ceremoni teh", "jepang", "kultur"].map((search, index) => (
                    <div key={search} className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground hover:text-foreground cursor-pointer transition-colors">
                        {search}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {index + 1}j lalu
                      </span>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Aksi Cepat</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Link href="/social">
                    <div className="w-full text-left p-2 rounded hover:bg-gray-50 cursor-pointer transition-colors text-sm">
                      Kembali ke Beranda
                    </div>
                  </Link>
                  <Link href="/social/trending">
                    <div className="w-full text-left p-2 rounded hover:bg-gray-50 cursor-pointer transition-colors text-sm">
                      Lihat Trending
                    </div>
                  </Link>
                  <Link href="/social/bookmarks">
                    <div className="w-full text-left p-2 rounded hover:bg-gray-50 cursor-pointer transition-colors text-sm">
                      Buka Tersimpan
                    </div>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {hasSearched && (
          <div className="text-center py-12">
            <div className="text-muted-foreground">
              <p className="text-lg mb-2">Hasil pencarian akan muncul di sini</p>
              <p className="text-sm">Klik pada hasil untuk melihat detail</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}