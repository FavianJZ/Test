"use client"

import { useState, useEffect, useCallback } from "react"
import { useSession, signOut, update } from "next-auth/react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { useProfileRealtime } from "@/hooks/useProfileRealtime"
import { useRealtimeSession } from "@/hooks/useRealtimeSession"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { FlexibleAvatar } from "@/components/ui/flexible-avatar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { BorderPreview } from "@/components/ui/border-preview"
import { BorderSelector } from "@/components/ui/border-selector"
import { BorderDisplay } from "@/components/ui/border-display"
import { BorderPreviewModal } from "@/components/ui/border-preview-modal"
import { Loader2, User, MapPin, Calendar, Settings, Camera, Save, Edit2, Check, X, Palette, Star, MessageSquare, MessageCircle, ChefHat, Heart, ShoppingCart, Activity, Trophy, Gift } from "lucide-react"


export default function ProfilePage() {
  const { data: originalSession, status, update } = useSession()
  const { session, fetchFreshUserData } = useRealtimeSession()
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [activities, setActivities] = useState<any[]>([])
  const [borderOptions, setBorderOptions] = useState<any[]>([])
  const [achievements, setAchievements] = useState<any[]>([])
  const [statistics, setStatistics] = useState<any>(null)
  const [selectedBorderForModal, setSelectedBorderForModal] = useState<any>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [currentAvatarUrl, setCurrentAvatarUrl] = useState<string>("")

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    bio: "",
    location: "",
    selectedBorder: ""
  })

  // Use real-time profile hook
  const {
    profile,
    userBorder,
    userPoints,
    isLoading,
    fetchProfileData,
    updateProfile,
    selectBorder,
    purchaseBorder
  } = useProfileRealtime()

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login")
    }
  }, [status, router])

  useEffect(() => {
    if (session?.user) {
      fetchProfileData()
      fetchBorderOptions()
      fetchUserAchievements()
      fetchUserStatistics()
    }
  }, [session?.user?.email, fetchProfileData])

  // Listen for avatar updates and refresh profile data
  useEffect(() => {
    const handleAvatarUpdate = () => {
      fetchProfileData()
    }

    window.addEventListener('profile-updated', handleAvatarUpdate as EventListener)

    return () => {
      window.removeEventListener('profile-updated', handleAvatarUpdate as EventListener)
    }
  }, [])

  // Listen for activities updates from real-time hook
  useEffect(() => {
    const handleActivitiesUpdate = (event: CustomEvent) => {
      setActivities(event.detail)
    }

    window.addEventListener('activities-updated', handleActivitiesUpdate as EventListener)

    return () => {
      window.removeEventListener('activities-updated', handleActivitiesUpdate as EventListener)
    }
  }, [session])

  // Update form data when profile changes
  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || "",
        bio: profile.bio || "",
        location: profile.location || "",
        selectedBorder: profile.selectedBorder || ""
      })
    }
  }, [profile])

  // Function to extract timestamp from image URL or add new one
  const getAvatarUrlWithTimestamp = (imageUrl: string | null | undefined) => {
    if (!imageUrl) return ""

    // Check if URL already has timestamp parameter
    const url = new URL(imageUrl, window.location.origin)
    const existingTimestamp = url.searchParams.get('t')

    if (existingTimestamp) {
      return imageUrl
    }

    // Extract timestamp from filename if it exists (our upload format)
    const filename = imageUrl.split('/').pop() || ''
    const timestampMatch = filename.match(/_(\d+)\./)

    if (timestampMatch) {
      const fileTimestamp = timestampMatch[1]
      const separator = imageUrl.includes('?') ? '&' : '?'
      return `${imageUrl}${separator}t=${fileTimestamp}`
    }

    // Fallback: use current timestamp only if no existing timestamp found
    const timestamp = Date.now()
    const separator = imageUrl.includes('?') ? '&' : '?'
    return `${imageUrl}${separator}t=${timestamp}`
  }

  // Initialize and update avatar URL with cache busting
  useEffect(() => {
    setCurrentAvatarUrl(getAvatarUrlWithTimestamp(session?.user?.image))
  }, [session?.user?.image])

  // Listen for avatar updates
  useEffect(() => {
    const handleAvatarUpdate = (event: CustomEvent) => {
      if (event.detail.image) {
        const newUrl = getAvatarUrlWithTimestamp(event.detail.image)
        setCurrentAvatarUrl(newUrl)
      }
    }

    window.addEventListener('profile-updated', handleAvatarUpdate as EventListener)

    return () => {
      window.removeEventListener('profile-updated', handleAvatarUpdate as EventListener)
    }
  }, [])

  const fetchUserProfile = async () => {
    try {
      const response = await fetch("/api/profile-raw")
      if (response.ok) {
        const data = await response.json()
        setFormData({
          name: data.user.name || "",
          bio: data.user.bio || "",
          location: data.user.location || "",
          selectedBorder: data.user.selectedBorder || "default"
        })
      }
    } catch (error) {
      toast.error("Gagal memuat profil")
    }
  }

  const fetchUserActivities = async () => {
    try {
      const response = await fetch("/api/activities-raw")
      if (response.ok) {
        const data = await response.json()
        setActivities(data.activities || [])
      }
    } catch (error) {
      console.error("Gagal memuat aktivitas:", error)
    }
  }

  const fetchBorderOptions = async () => {
    try {
      // Use borders-raw API to get borders from database
      const response = await fetch("/api/borders-raw")
      if (response.ok) {
        const data = await response.json()
        setBorderOptions(data.data || [])
      } else {
        console.error("Borders API returned error:", response.status)
      }
    } catch (error) {
      console.error("Gagal memuat borders:", error)
    }
  }

  
  const fetchUserAchievements = async () => {
    try {
      // Use level progression achievements API
      const response = await fetch("/api/achievements/social")
      if (response.ok) {
        const data = await response.json()
        setAchievements(data.achievements || [])
      }
    } catch (error) {
      console.error("Gagal memuat achievements:", error)
    }
  }

  const fetchUserStatistics = async () => {
    try {
      const response = await fetch("/api/statistics")
      if (response.ok) {
        const data = await response.json()
        setStatistics(data.statistics)
      } else {
        console.error("Statistics API returned error:", response.status)
      }
    } catch (error) {
      console.error("Gagal memuat statistik:", error)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/profile/upload", {
        method: "POST",
        body: formData
      })

      if (response.ok) {
        const data = await response.json()
        toast.success("Foto profil berhasil diperbarui!")

        // Clear the file input
        e.target.value = ''

        // Refresh profile data to get updated image from database
        await fetchProfileData()

        // Force refresh of realtime session data
        await fetchFreshUserData()

        // Dispatch events for real-time updates across components
        window.dispatchEvent(new CustomEvent('profile-updated', { detail: { image: data.userImage } }))
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || "Gagal mengupload foto")
      }
    } catch (error) {
      console.error("Upload error:", error)
      toast.error("Terjadi kesalahan saat upload")
    } finally {
      setIsUploading(false)
    }
  }

  const handleSaveProfile = async () => {
    // Validate form data
    if (!formData.name || formData.name.trim().length < 2) {
      toast.error("Nama harus diisi minimal 2 karakter")
      return
    }

    if (formData.name.length > 50) {
      toast.error("Nama maksimal 50 karakter")
      return
    }

    if (formData.bio && formData.bio.length > 500) {
      toast.error("Bio maksimal 500 karakter")
      return
    }

    if (formData.location && formData.location.length > 100) {
      toast.error("Lokasi maksimal 100 karakter")
      return
    }

    const success = await updateProfile({
      name: formData.name.trim(),
      bio: formData.bio?.trim() || null,
      location: formData.location?.trim() || null,
      selectedBorder: formData.selectedBorder
    })

    if (success) {
      toast.success("Profil berhasil diperbarui!")
      setIsEditing(false)

      // Dispatch events for real-time updates across components
      window.dispatchEvent(new CustomEvent('profile-updated', { detail: {
        name: formData.name.trim(),
        bio: formData.bio?.trim() || null,
        location: formData.location?.trim() || null
      } }))

      // Track profile update activity
      try {
        await fetch('/api/activities-raw', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'PROFILE_UPDATE',
            title: 'Profil diperbarui',
            description: 'Anda mengubah informasi profil'
          })
        })
      } catch (error) {
        console.error('Failed to track activity:', error)
      }

      // Refresh profile data to ensure consistency
      await fetchProfileData()
    } else {
      toast.error("Gagal memperbarui profil")
    }
  }

  const handleBorderSelect = (borderId: string) => {
    const allBorders = getAllBorderOptions()
    const border = allBorders.find(b => b.id === borderId)

    if (!border) {
      toast.error("Border tidak ditemukan")
      return
    }

    // Show modal for all borders (unlocked or locked)
    setSelectedBorderForModal(border)
    setIsModalOpen(true)
  }

  const handleModalPurchase = async (borderId: string) => {
    if (!selectedBorderForModal) return

    const result = await purchaseBorder(borderId)

    if (result.success) {
      toast.success(result.message)
      // Refresh all profile data to get updated points and border status
      await fetchProfileData()
      // Update border options to reflect new unlocked status
      await fetchBorderOptions()

      // Dispatch events for real-time updates across components
      window.dispatchEvent(new CustomEvent('border-updated', { detail: { borderId } }))
      window.dispatchEvent(new CustomEvent('points-updated', { detail: { newBalance: result.newPointsBalance } }))

      // Track border purchase activity
      try {
        await fetch('/api/activities-raw', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'BORDER_PURCHASE',
            title: `Border ${selectedBorderForModal.name} dibeli`,
            description: `Anda membeli border seharga ${selectedBorderForModal.price} poin`,
            metadata: { borderId, borderName: selectedBorderForModal.name, price: selectedBorderForModal.price }
          })
        })
      } catch (error) {
        console.error('Failed to track activity:', error)
      }

      // Refresh data to show updated points and border
      await fetchProfileData()
    } else {
      toast.error(result.error || "Gagal membeli border")
    }
  }

  const handleModalSelect = async (borderId: string) => {
    if (!selectedBorderForModal) return

    // Select border using real-time hook
    const result = await selectBorder(borderId)

    if (result.success) {
      toast.success(result.message)
      // Refresh all profile data to get updated border
      await fetchProfileData()

      // Dispatch events for real-time updates across components
      window.dispatchEvent(new CustomEvent('border-updated', { detail: { borderId } }))

      // Track border selection activity
      try {
        await fetch('/api/activities-raw', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'BORDER_SELECT',
            title: `Border ${selectedBorderForModal.name} dipilih`,
            description: 'Anda mengubah border profil',
            metadata: { borderId, borderName: selectedBorderForModal.name }
          })
        })
      } catch (error) {
        console.error('Failed to track activity:', error)
      }

      // Refresh data to show updated border
      await fetchProfileData()
    } else {
      toast.error(result.error || "Gagal memilih border")
    }
  }

  const getAllBorderOptions = () => {
    // Use border options from database
    return borderOptions
  }

  const getSelectedBorder = () => {
    // First try to use the userBorder from real-time hook
    if (userBorder) {
      return userBorder
    }

    // Fallback to form data
    const allOptions = getAllBorderOptions()
    return allOptions.find(b => b.id === formData.selectedBorder) || null
  }

  const getUserInitials = () => {
    return formData.name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase() || "U"
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'FORUM_POST': return <MessageSquare className="h-4 w-4" />
      case 'FORUM_COMMENT': return <MessageCircle className="h-4 w-4" />
      case 'RECIPE_CREATED': return <ChefHat className="h-4 w-4" />
      case 'RECIPE_LIKED': return <Heart className="h-4 w-4" />
      case 'PURCHASE': return <ShoppingCart className="h-4 w-4" />
      case 'PROFILE_UPDATE': return <User className="h-4 w-4" />
      case 'BADGE_EARNED': return <Star className="h-4 w-4" />
      default: return <Activity className="h-4 w-4" />
    }
  }
  if (status === "loading") {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 space-y-8">
      {/* Header */}
      <header className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Profil Saya</h1>
        <p className="text-muted-foreground">Kelola profil dan lihat aktivitas terbaru</p>
      </header>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Profile Card */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader className="text-center">
              <div className="relative mx-auto w-fit">
                {/* Avatar with border from database */}
                {getSelectedBorder() ? (
                  <BorderPreview
                    border={getSelectedBorder()}
                    size="3xl"
                    avatarSrc={currentAvatarUrl}
                    avatarName={session.user?.name || ""}
                    showLabel={false}
                    showLockStatus={false}
                  />
                ) : (
                  <FlexibleAvatar
                    src={currentAvatarUrl}
                    name={session.user?.name || ""}
                    size="3xl"
                    className="mx-auto"
                  />
                )}
                {/* Camera Button */}
                {isEditing && (
                  <label className="absolute bottom-2 right-2 bg-primary text-primary-foreground rounded-full p-1 cursor-pointer hover:bg-primary/90 z-20">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      disabled={isUploading}
                    />
                    {isUploading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Camera className="h-4 w-4" />
                    )}
                  </label>
                )}
              </div>
              <CardTitle className="text-xl mt-4">{formData.name || "User"}</CardTitle>
              <CardDescription>{session.user?.email}</CardDescription>
              {formData.location && (
                <div className="flex items-center justify-center text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4 mr-1" />
                  {formData.location}
                </div>
              )}
            </CardHeader>
            <CardContent>
              {formData.bio && (
                <p className="text-sm text-center text-muted-foreground mb-4">
                  {formData.bio}
                </p>
              )}

              <div className="flex justify-center">
                <Button
                  variant={isEditing ? "default" : "outline"}
                  onClick={() => isEditing ? handleSaveProfile() : setIsEditing(true)}
                  disabled={isLoading}
                >
                  {isEditing ? (
                    <>
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4 mr-2" />
                      )}
                      Simpan
                    </>
                  ) : (
                    <>
                      <Edit2 className="h-4 w-4 mr-2" />
                      Edit Profil
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-lg">Statistik</CardTitle>
              
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Forum Statistics */}
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Forum Post</span>
                <Badge variant="secondary">{statistics?.forum?.posts || 0}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Forum Komentar</span>
                <Badge variant="secondary">{statistics?.forum?.comments || 0}</Badge>
              </div>

              {/* Recipe Statistics */}
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Resep Dibuat</span>
                <Badge variant="secondary">{statistics?.recipes?.created || 0}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Resep Disukai</span>
                <Badge variant="secondary">{statistics?.recipes?.liked || 0}</Badge>
              </div>

              {/* Social Statistics */}
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Social Post</span>
                <Badge variant="secondary">{statistics?.social?.posts || 0}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Teman</span>
                <Badge variant="secondary">{statistics?.social?.friends || 0}</Badge>
              </div>

              {/* Marketplace Statistics */}
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Pembelian</span>
                <Badge variant="secondary">{statistics?.marketplace?.purchases || 0}</Badge>
              </div>

              {/* Achievement Statistics */}
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Achievement</span>
                <Badge variant="secondary">{statistics?.achievements?.unlocked || 0}</Badge>
              </div>

              {/* Points */}
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Poin</span>
                <Badge variant="default">{userPoints}</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Achievement Quick Access */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-lg">Achievements</CardTitle>
              </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Button
                  variant="outline"
                  className="h-16 flex-col gap-2"
                  onClick={() => router.push('/achievements')}
                >
                  <Trophy className="h-6 w-6" />
                  <span className="text-sm">All Levels</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-16 flex-col gap-2"
                  onClick={() => router.push('/achievements/test')}
                >
                  <Gift className="h-6 w-6" />
                  <span className="text-sm">Test Lab</span>
                </Button>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground">
                  Total Achievements: {statistics?.achievements?.unlocked || 0}/{statistics?.achievements?.total || 0}
                </p>
                <p className="text-xs text-muted-foreground">
                  Points Available: {userPoints}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <Tabs defaultValue="profile" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="profile">Profil</TabsTrigger>
              <TabsTrigger value="activity">Aktivitas</TabsTrigger>
              <TabsTrigger value="customization">Kustomisasi</TabsTrigger>
              <TabsTrigger value="settings">Pengaturan</TabsTrigger>
            </TabsList>

            <TabsContent value="profile" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Informasi Profil</CardTitle>
                  <CardDescription>
                    {isEditing ? "Edit informasi profil Anda" : "Informasi dasar profil Anda"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nama Lengkap</Label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      placeholder="Masukkan nama lengkap"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      value={session.user?.email || ""}
                      disabled
                      className="bg-muted"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location">Lokasi</Label>
                    <Input
                      id="location"
                      name="location"
                      value={formData.location}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      placeholder="Kota, Negara"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      name="bio"
                      value={formData.bio}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      placeholder="Ceritakan tentang diri Anda..."
                      rows={4}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="activity" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Aktivitas Terbaru</CardTitle>
                  </CardHeader>
                <CardContent>
                  {activities.length > 0 ? (
                    <div className="space-y-4">
                      {activities.map((activity) => (
                        <div key={activity.id} className="flex items-start space-x-4 p-3 rounded-lg border">
                          <div className="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                            {getActivityIcon(activity.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium">{activity.title}</p>
                            {activity.description && (
                              <p className="text-sm text-muted-foreground">{activity.description}</p>
                            )}
                            <p className="text-xs text-muted-foreground mt-1">
                              {formatDate(activity.createdAt)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>Belum ada aktivitas</p>
                      <p className="text-sm text-muted-foreground mt-2">
                        Aktivitas Anda akan ditampilkan di sini setelah Anda memperbarui profil atau memilih border
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            
            <TabsContent value="customization" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Palette className="h-5 w-5 mr-2" />
                    Kustomisasi Profil
                  </CardTitle>
                  <CardDescription>Personalisasi tampilan profil Anda</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <Label className="text-base font-medium">Border Foto Profil</Label>
                    <p className="text-sm text-muted-foreground mb-3">
                      Pilih border untuk foto profil Anda. Beberapa border membutuhkan poin untuk membuka.
                    </p>
                    <br></br>
                    {borderOptions.length > 0 ? (
                      <BorderSelector
                        borders={borderOptions}
                        selectedBorder={getSelectedBorder()?.id || formData.selectedBorder}
                        onSelect={handleBorderSelect}
                        size="xl"
                        columns={3}
                        showRarity={true}
                      />
                    ) : (
                      <div className="text-center py-8">
                        <Palette className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                        <p className="text-muted-foreground">Belum ada border yang tersedia</p>
                        <p className="text-sm text-muted-foreground mt-2">
                          Hubungi admin untuk menambahkan border options ke database
                        </p>
                        <p className="text-xs text-green-600 mt-4">
                          ✅ Border data dimuat dari database
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="settings" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Settings className="h-5 w-5 mr-2" />
                    Pengaturan Akun
                  </CardTitle>
                  <CardDescription>Kelola pengaturan akun dan privasi</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-3 rounded-lg border">
                    <div>
                      <p className="font-medium">Notifikasi Email</p>
                      <p className="text-sm text-muted-foreground">Terima update via email</p>
                      <p className="text-xs text-orange-600">🔧 Fitur dummy - belum terkoneksi</p>
                    </div>
                    <Button variant="outline" size="sm">Atur</Button>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg border">
                    <div>
                      <p className="font-medium">Privasi Profil</p>
                      <p className="text-sm text-muted-foreground">Atur siapa yang bisa lihat profil</p>
                      <p className="text-xs text-orange-600">🔧 Fitur dummy - belum terkoneksi</p>
                    </div>
                    <Button variant="outline" size="sm">Atur</Button>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg border">
                    <div>
                      <p className="font-medium">Keamanan</p>
                      <p className="text-sm text-muted-foreground">Password dan autentikasi</p>
                      <p className="text-xs text-orange-600">🔧 Fitur dummy - belum terkoneksi</p>
                    </div>
                    <Button variant="outline" size="sm">Atur</Button>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg border border-orange-200 bg-orange-50/30">
                    <div>
                      <p className="font-medium">Preferensi Tema</p>
                      <p className="text-sm text-muted-foreground">Dark/Light mode (segera)</p>
                      <p className="text-xs text-orange-600">🔧 Akan datang</p>
                    </div>
                    <Button variant="outline" size="sm" disabled>Coming Soon</Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Border Preview Modal */}
      <BorderPreviewModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        border={selectedBorderForModal}
        userPoints={userPoints}
        onPurchase={handleModalPurchase}
        onSelect={handleModalSelect}
        userAvatar={currentAvatarUrl}
        userName={session.user?.name || ""}
        selectedBorderId={getSelectedBorder()?.id || ""}
      />
    </div>
  )
}