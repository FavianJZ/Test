"use client"

import { useState, useEffect } from "react"
import { SocialFeed } from "@/components/social/social-feed/social-feed"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { TrendingUp, Clock, Calendar, Flame } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"

export default function TrendingPage() {
  const [activeTimeRange, setActiveTimeRange] = useState("day")
  const [loading, setLoading] = useState(true)

  const timeRanges = [
    { value: "hour", label: "1 Jam Terakhir", icon: Clock },
    { value: "day", label: "24 Jam Terakhir", icon: Calendar },
    { value: "week", label: "7 Hari Terakhir", icon: Flame },
    { value: "month", label: "30 Hari Terakhir", icon: TrendingUp },
  ]

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                Postingan Trending
              </h1>
              <p className="text-muted-foreground">
                Temukan konten paling populer di komunitas HikariCha
              </p>
            </div>
          </div>
        </div>

        {/* Time Range Selector */}
        <div className="mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Periode Waktu:</span>
                </div>
                <Select value={activeTimeRange} onValueChange={setActiveTimeRange}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {timeRanges.map((range) => {
                      const Icon = range.icon
                      return (
                        <SelectItem key={range.value} value={range.value}>
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4" />
                            <span>{range.label}</span>
                          </div>
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Trending Feed */}
          <div className="lg:col-span-2">
            <SocialFeed />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* How Trending Works */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-orange-600" />
                  Cara Kerja Trending
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm text-muted-foreground space-y-2">
                  <p>Postingan trending dihitung berdasarkan:</p>
                  <ul className="space-y-1 ml-4">
                    <li>• <strong>3 poin</strong> untuk setiap like</li>
                    <li>• <strong>2 poin</strong> untuk setiap komentar</li>
                    <li>• <strong>1 poin</strong> untuk setiap share</li>
                  </ul>
                  <p className="text-xs mt-3">
                    Postingan yang lebih baru mendapatkan bobot lebih tinggi untuk mendorong konten fresh.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Statistik Trending</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total Postingan</span>
                  <Badge variant="secondary">127</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Engagement Rate</span>
                  <Badge variant="secondary">+24%</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Top Creator</span>
                  <Badge variant="secondary">@matcha_lover</Badge>
                </div>
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
                  <Link href="/social/bookmarks">
                    Lihat Tersimpan
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