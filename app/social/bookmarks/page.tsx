"use client"

import { useState, useEffect } from "react"
import { SocialFeed } from "@/components/social/social-feed/social-feed"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Bookmark, Search, Filter, Grid, List } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"

export default function BookmarksPage() {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [loading, setLoading] = useState(true)

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <Bookmark className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                Postingan Tersimpan
              </h1>
              <p className="text-muted-foreground">
                Koleksi postingan yang Anda simpan untuk dibaca nanti
              </p>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {/* Search */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Cari postingan tersimpan..."
                      className="pl-10 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  {/* Filter */}
                  <Button variant="outline" size="sm" className="flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    Filter
                  </Button>
                </div>

                {/* View Mode */}
                <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
                  <Button
                    variant={viewMode === "grid" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("grid")}
                    className="rounded-md"
                  >
                    <Grid className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === "list" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("list")}
                    className="rounded-md"
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Saved Posts Feed */}
          <div className="lg:col-span-2">
            <SocialFeed />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Collection Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Statistik Koleksi</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total Tersimpan</span>
                  <Badge variant="secondary">42</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Minggu Ini</span>
                  <Badge variant="secondary">+8</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Kategori Terbanyak</span>
                  <Badge variant="secondary">Matcha Tips</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Terlama Disimpan</span>
                  <Badge variant="secondary">2 bulan lalu</Badge>
                </div>
              </CardContent>
            </Card>

            {/* Collections */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Koleksi</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { name: "Resep Matcha", count: 15, color: "bg-green-100 text-green-800" },
                  { name: "Teh Jepang", count: 12, color: "bg-blue-100 text-blue-800" },
                  { name: "Cerita Teh", count: 8, color: "bg-purple-100 text-purple-800" },
                  { name: "Tips & Trik", count: 7, color: "bg-orange-100 text-orange-800" },
                ].map((collection) => (
                  <div key={collection.name} className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 cursor-pointer transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${collection.color.split(' ')[0]}`} />
                      <span className="text-sm font-medium">{collection.name}</span>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {collection.count}
                    </Badge>
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
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link href="/social">
                    Kembali ke Beranda
                  </Link>
                </Button>
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link href="/social/trending">
                    Lihat Trending
                  </Link>
                </Button>
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link href="/forum">
                    Kunjungi Forum
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