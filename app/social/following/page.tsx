"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BorderDisplay } from "@/components/ui/border-display"
import { FollowButton } from "@/components/social/follow-button"
import { Users, UserPlus, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

interface User {
  id: string
  name: string
  avatar?: string
  border?: string
  bio?: string
  followerCount: number
  followingCount: number
  postCount: number
  followedAt: string
  isFollowing?: boolean
  isFollowingBack?: boolean
}

export default function FollowingPage() {
  const { data: session } = useSession()
  const [following, setFollowing] = useState<User[]>([])
  const [followers, setFollowers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'following' | 'followers'>('following')

  const fetchFollowingData = async () => {
    if (!session?.user?.id) return

    try {
      setLoading(true)

      // Fetch following
      const followingResponse = await fetch('/api/social/follow?type=following&limit=50')
      const followingData = await followingResponse.json()

      if (followingData.success) {
        setFollowing(followingData.data)
      } else {
        toast.error("Gagal memuat daftar following")
      }

      // Fetch followers
      const followersResponse = await fetch('/api/social/follow?type=followers&limit=50')
      const followersData = await followersResponse.json()

      if (followersData.success) {
        setFollowers(followersData.data)
      } else {
        toast.error("Gagal memuat daftar followers")
      }
    } catch (error) {
      console.error('Error fetching following/followers:', error)
      toast.error("Terjadi kesalahan saat memuat data")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFollowingData()
  }, [session?.user?.id])

  const handleFollowChange = (userId: string, isFollowing: boolean) => {
    // Update following state when unfollowing someone
    if (!isFollowing && activeTab === 'following') {
      setFollowing(prev => prev.filter(user => user.id !== userId))
    }

    // Update followers state when following back
    if (isFollowing && activeTab === 'followers') {
      setFollowers(prev =>
        prev.map(user =>
          user.id === userId ? { ...user, isFollowing: true } : user
        )
      )
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return "Hari ini"
    if (diffDays === 1) return "Kemarin"
    if (diffDays < 7) return `${diffDays} hari lalu`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} minggu lalu`
    return `${Math.floor(diffDays / 30)} bulan lalu`
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-semibold mb-2">Login Diperlukan</h2>
            <p className="text-muted-foreground mb-4">
              Silakan login untuk melihat daftar following dan followers
            </p>
            <Button asChild>
              <Link href="/auth/login">Login</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const currentData = activeTab === 'following' ? following : followers

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-6">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/social" className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Kembali
              </Link>
            </Button>
            <h1 className="text-3xl font-bold text-foreground">
              {activeTab === 'following' ? 'Following' : 'Followers'}
            </h1>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-2 p-1 bg-gray-100 rounded-lg mb-6">
            <Button
              variant={activeTab === 'following' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('following')}
              className="flex items-center gap-2 rounded-md"
            >
              <UserPlus className="h-4 w-4" />
              <span>Following ({following.length})</span>
            </Button>
            <Button
              variant={activeTab === 'followers' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('followers')}
              className="flex items-center gap-2 rounded-md"
            >
              <Users className="h-4 w-4" />
              <span>Followers ({followers.length})</span>
            </Button>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, index) => (
              <Card key={index} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-48"></div>
                    </div>
                    <div className="h-8 bg-gray-200 rounded w-20"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* User List */}
        {!loading && (
          <>
            {currentData.length > 0 ? (
              <div className="space-y-4">
                {currentData.map((user) => (
                  <Card key={user.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4">
                        <BorderDisplay
                          border={
                            user.border
                              ? { id: user.border, name: '', imageUrl: user.border, unlocked: true, rarity: 'COMMON' }
                              : { id: 'default', name: 'Default', imageUrl: '/borders/default.png', unlocked: true, rarity: 'COMMON' }
                          }
                          userAvatar={user.avatar}
                          userName={user.name}
                          size="profile"
                          showUserInfo={true}
                          orientation="horizontal"
                          className="flex-1"
                        />

                        <div className="flex items-center gap-4">
                          {/* Stats */}
                          <div className="hidden sm:block text-right">
                            <div className="text-sm text-muted-foreground">
                              {user.postCount} postingan
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {activeTab === 'following'
                                ? `Following sejak ${formatDate(user.followedAt)}`
                                : `${user.followerCount} followers`
                              }
                            </div>
                          </div>

                          {/* Follow Button */}
                          <FollowButton
                            targetUserId={user.id}
                            isFollowing={activeTab === 'following' ? true : user.isFollowing}
                            onFollowChange={(isFollowing) => handleFollowChange(user.id, isFollowing)}
                            size="sm"
                            showIcon={false}
                          />
                        </div>
                      </div>

                      {/* Bio */}
                      {user.bio && (
                        <div className="mt-4 text-sm text-muted-foreground">
                          {user.bio}
                        </div>
                      )}

                      {/* Mobile Stats */}
                      <div className="sm:hidden mt-4 pt-4 border-t text-xs text-muted-foreground">
                        <div className="flex justify-between">
                          <span>{user.postCount} postingan</span>
                          <span>{user.followerCount} followers</span>
                          <span>{user.followingCount} following</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="text-center py-12">
                <CardContent>
                  <div className="space-y-4">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
                      {activeTab === 'following' ? (
                        <UserPlus className="h-8 w-8 text-gray-400" />
                      ) : (
                        <Users className="h-8 w-8 text-gray-400" />
                      )}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground mb-2">
                        {activeTab === 'following'
                          ? "Belum ada following"
                          : "Belum ada followers"
                        }
                      </h3>
                      <p className="text-muted-foreground">
                        {activeTab === 'following'
                          ? "Mulai follow pengguna lain untuk melihat mereka di sini"
                          : "Pengguna lain akan muncul di sini ketika mereka mulai follow Anda"
                        }
                      </p>
                    </div>
                    <Button asChild>
                      <Link href="/social">Jelajahi Komunitas</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  )
}