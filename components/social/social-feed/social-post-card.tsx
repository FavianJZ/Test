"use client"

import { useState, useEffect } from "react"
import { BorderDisplay } from "@/components/ui/border-display"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MessageCircle, Share2, MoreHorizontal, Calendar, Bookmark, User, Flag, BarChart3, Trash2 } from "lucide-react"
import { SocialCommentSection } from "./social-comment-section"
import { SocialReactions } from "./social-reactions"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { ImageModal } from "@/components/ui/image-modal"
import { FollowButton } from "@/components/social/follow-button"
import { toast } from "sonner"

interface SocialPost {
  id: string
  content: string
  author_id: string
  author_name: string
  author_avatar?: string
  author_border?: any
  media_urls?: string[]
  likes: number
  comments: number
  shares: number
  is_deleted: boolean
  created_at: string
  updated_at: string
  author_posts?: number
  author_joinDate?: string
}

interface SocialPostCardProps {
  post: SocialPost
  onUpdate: (postId: string, updates: Partial<SocialPost>) => void
  onDelete: (postId: string) => void
  currentUserId?: string
}

export function SocialPostCard({ post, onUpdate, onDelete, currentUserId }: SocialPostCardProps) {
  const [likesCount, setLikesCount] = useState(post.likes)
  const [showComments, setShowComments] = useState(false)
  const [commentsCount, setCommentsCount] = useState(post.comments)
  const [isSharing, setIsSharing] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  const [userReaction, setUserReaction] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [completeBorder, setCompleteBorder] = useState<any>(null)
  const [showImageModal, setShowImageModal] = useState(false)
  const [selectedImageUrl, setSelectedImageUrl] = useState<string>("")
  const [selectedImageAlt, setSelectedImageAlt] = useState<string>("")
  const [showMenu, setShowMenu] = useState(false)
  const [showInfoModal, setShowInfoModal] = useState(false)
  const [isFollowingAuthor, setIsFollowingAuthor] = useState(false)

  const getBorderFromDatabase = async (borderId: string) => {
    if (!borderId) {
      return {
        id: 'default',
        name: 'Default',
        imageUrl: '/borders/default.png',
        unlocked: true,
        rarity: 'COMMON'
      }
    }

    try {
      const response = await fetch('/api/borders-public')
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.data) {
          const border = data.data.find((b: any) => b.id === borderId)
          if (border) {
            return {
              id: border.id,
              name: border.name,
              imageUrl: border.imageUrl,
              unlocked: true,
              rarity: border.rarity
            }
          }
        }
      }
    } catch (error) {
      console.error('Error fetching border data:', error)
    }

    // Fallback to default border
    return {
      id: borderId,
      name: borderId.charAt(0).toUpperCase() + borderId.slice(1),
      imageUrl: '/borders/default.png',
      unlocked: true,
      rarity: 'COMMON'
    }
  }

  useEffect(() => {
    // Fetch complete border data when component mounts or border changes
    if (post.author_border) {
      getBorderFromDatabase(post.author_border).then(setCompleteBorder)
    } else {
      setCompleteBorder({
        id: 'default',
        name: 'Default',
        imageUrl: '/borders/default.png',
        unlocked: true,
        rarity: 'COMMON'
      })
    }

    // Check if current user liked this post
    if (currentUserId) {
      checkSaveStatus()
      checkReactionStatus()
      checkFollowStatus()
    } else {
      // Reset user reaction when user is not logged in
      setUserReaction(null)
      setIsFollowingAuthor(false)
    }
  }, [currentUserId, post.id, post.author_border, post.likes, post.author_id]) // Add post.author_id to dependencies

  const checkSaveStatus = async () => {
    try {
      const response = await fetch(`/api/social/posts/${post.id}/save`)
      const data = await response.json()
      if (data.success) {
        setIsSaved(data.data.saved)
      }
    } catch (error) {
      console.error('Error checking save status:', error)
    }
  }

  const checkReactionStatus = async () => {
    try {
      const response = await fetch(`/api/social/posts/${post.id}/like`)
      const data = await response.json()
      if (data.success) {
        const newReaction = data.data.liked ? "❤️" : null
        setUserReaction(newReaction) // Use heart emoji for likes
        // Also sync the likes count from database to ensure consistency
        if (data.data.likesCount !== undefined && data.data.likesCount !== likesCount) {
          setLikesCount(data.data.likesCount)
          onUpdate(post.id, { likes: data.data.likesCount })
        }
      }
    } catch (error) {
      console.error('Error checking like status:', error)
    }
  }

  const checkFollowStatus = async () => {
    if (!currentUserId || currentUserId === post.author_id) return

    try {
      const response = await fetch(`/api/social/follow?type=following&limit=1`)
      const data = await response.json()
      if (data.success) {
        const isFollowing = data.data.some((user: any) => user.id === post.author_id)
        setIsFollowingAuthor(isFollowing)
      }
    } catch (error) {
      console.error('Error checking follow status:', error)
    }
  }

  
  const handleShare = async () => {
    if (!currentUserId || isSharing) return

    setIsSharing(true)
    try {
      const response = await fetch(`/api/social/posts/${post.id}/share`, {
        method: 'POST'
      })
      const data = await response.json()

      if (data.success) {
        toast.success("Postingan berhasil dibagikan!")
        onUpdate(post.id, {
          shares: post.shares + 1
        })

        // Copy link to clipboard
        const shareUrl = `${window.location.origin}/social/post/${post.id}`
        await navigator.clipboard.writeText(shareUrl)
        toast.info("Link postingan disalin ke clipboard!")
      } else {
        toast.error("Gagal membagikan postingan")
      }
    } catch (error) {
      console.error('Error sharing post:', error)
      toast.error("Terjadi kesalahan saat membagikan postingan")
    } finally {
      setIsSharing(false)
    }
  }

  const handleSave = async () => {
    if (!currentUserId || isSaving) return

    setIsSaving(true)
    try {
      const response = await fetch(`/api/social/posts/${post.id}/save`, {
        method: 'POST'
      })
      const data = await response.json()

      if (data.success) {
        const newSavedStatus = data.data.saved
        setIsSaved(newSavedStatus)
        toast.success(newSavedStatus ? "Postingan berhasil disimpan!" : "Postingan dihapus dari tersimpan")
      } else {
        toast.error("Gagal menyimpan postingan")
      }
    } catch (error) {
      console.error('Error saving post:', error)
      toast.error("Terjadi kesalahan saat menyimpan postingan")
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!currentUserId || isDeleting) return

    setShowDeleteConfirm(true)
  }

  const handleConfirmDelete = async () => {
    setIsDeleting(true)
    try {
      const response = await fetch(`/api/social/posts?id=${post.id}`, {
        method: 'DELETE'
      })
      const data = await response.json()

      if (data.success) {
        onDelete(post.id)
        toast.success("Postingan berhasil dihapus!")
      } else {
        toast.error(data.error || "Gagal menghapus postingan")
      }
    } catch (error) {
      console.error('Error deleting post:', error)
      toast.error("Terjadi kesalahan saat menghapus postingan")
    } finally {
      setIsDeleting(false)
    }
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

  const getBadgeText = () => {
    if (completeBorder?.rarity) {
      const rarity = completeBorder.rarity.charAt(0).toUpperCase() + completeBorder.rarity.slice(1).toLowerCase()
      return `${rarity} Member`
    }
    return "Member"
  }

  const handleImageClick = (url: string, alt: string = "") => {
    setSelectedImageUrl(url)
    setSelectedImageAlt(alt)
    setShowImageModal(true)
  }

  const handleLikesUpdate = (newLikesCount: number) => {
    setLikesCount(newLikesCount)
  }

  const handleShowInfo = () => {
    setShowInfoModal(true)
    setShowMenu(false)
  }

  const handleReport = () => {
    // TODO: Implement report functionality
    toast.info("Fitur lapor akan segera tersedia")
    setShowMenu(false)
  }

  const handleViewProfile = () => {
    // Navigate to user profile
    window.location.href = `/profile/${post.author_id}`
    setShowMenu(false)
  }

  const isOwnPost = currentUserId === post.author_id

  return (
    <Card className="hover:shadow-lg transition-all duration-300 animate-in slide-in-from-bottom duration-300">
      <CardContent className="p-6">
        {/* Author Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3 flex-1">
            <BorderDisplay
              border={completeBorder || { id: 'default', name: 'Default', imageUrl: '/borders/default.png', unlocked: true, rarity: 'COMMON' }}
              userAvatar={post.author_avatar}
              userName={post.author_name}
              size="forum"
              showUserInfo={true}
              showBadge={true}
              badgeText={getBadgeText()}
              orientation="horizontal"
              className="flex-1"
            />

            {/* Follow Button - only show for other users' posts */}
            {!isOwnPost && (
              <div className="ml-2">
                <FollowButton
                  targetUserId={post.author_id}
                  isFollowing={isFollowingAuthor}
                  size="sm"
                  variant="outline"
                  showIcon={true}
                  onFollowChange={(following) => setIsFollowingAuthor(following)}
                  className="text-xs"
                />
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="relative ml-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowMenu(!showMenu)}
              className="hover:bg-gray-100 rounded-full p-2"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>

            {/* Dropdown Menu */}
            {showMenu && (
              <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50 min-w-48">
                {isOwnPost ? (
                  <>
                    <button
                      onClick={handleShowInfo}
                      className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-3"
                    >
                      <BarChart3 className="h-4 w-4 text-gray-600" />
                      <span>Info</span>
                    </button>
                    <hr className="my-1 border-gray-200" />
                    <button
                      onClick={handleDelete}
                      disabled={isDeleting}
                      className="w-full px-4 py-2 text-left hover:bg-red-50 flex items-center gap-3 text-red-600"
                    >
                      {isDeleting ? (
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-red-600 border-t-transparent" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                      <span>Hapus</span>
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={handleViewProfile}
                      className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-3"
                    >
                      <User className="h-4 w-4 text-gray-600" />
                      <span>Profile</span>
                    </button>
                    <button
                      onClick={handleReport}
                      className="w-full px-4 py-2 text-left hover:bg-red-50 flex items-center gap-3 text-red-600"
                    >
                      <Flag className="h-4 w-4" />
                      <span>Laporkan</span>
                    </button>
                  </>
                )}
              </div>
            )}

            {/* Close dropdown when clicking outside */}
            {showMenu && (
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowMenu(false)}
              />
            )}
          </div>
        </div>

        {/* Post Time */}
        <div className="text-xs text-muted-foreground mb-4">
          {formatDate(post.created_at)}
        </div>

        {/* Content */}
        <div className="mb-4">
          <p className="text-foreground whitespace-pre-wrap break-words">
            {post.content}
          </p>
        </div>

        {/* Media */}
        {post.media_urls && post.media_urls.length > 0 && (
          <div className="mb-4">
            {post.media_urls.length === 1 && (
              <div className="rounded-lg overflow-hidden border cursor-pointer hover:opacity-90 transition-opacity">
                <img
                  src={post.media_urls[0]}
                  alt="Post media"
                  className="w-full h-auto max-h-96 object-cover"
                  onClick={() => handleImageClick(post.media_urls![0], "Post media")}
                />
              </div>
            )}
            {post.media_urls.length === 2 && (
              <div className="grid grid-cols-2 gap-2">
                {post.media_urls.map((url, index) => (
                  <div key={index} className="rounded-lg overflow-hidden border cursor-pointer hover:opacity-90 transition-opacity">
                    <img
                      src={url}
                      alt={`Post media ${index + 1}`}
                      className="w-full h-48 object-cover"
                      onClick={() => handleImageClick(url, `Post media ${index + 1}`)}
                    />
                  </div>
                ))}
              </div>
            )}
            {post.media_urls.length > 2 && (
              <div className="grid grid-cols-2 gap-2">
                {post.media_urls.slice(0, 3).map((url, index) => (
                  <div key={index} className={`rounded-lg overflow-hidden border relative cursor-pointer hover:opacity-90 transition-opacity ${index === 2 && post.media_urls.length > 3 ? 'col-span-2' : ''}`}>
                    <img
                      src={url}
                      alt={`Post media ${index + 1}`}
                      className={`w-full object-cover ${index === 2 && post.media_urls.length > 3 ? 'h-48' : 'h-48'}`}
                      onClick={() => handleImageClick(url, `Post media ${index + 1}`)}
                    />
                    {index === 2 && post.media_urls.length > 3 && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <span className="text-white text-2xl font-bold">
                          +{post.media_urls.length - 3}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Engagement Bar */}
        <div className="flex items-center justify-between py-3 border-t border-b">
          <div className="flex items-center gap-4">
            {/* Reactions */}
            <SocialReactions
              postId={post.id}
              currentUserId={currentUserId}
              existingReaction={userReaction}
              onReactionChange={(reaction, newLikesCount) => {
                setUserReaction(reaction)
                // Use the likes count from SocialReactions component
                if (newLikesCount !== undefined) {
                  setLikesCount(newLikesCount)
                  onUpdate(post.id, { likes: newLikesCount })
                }
              }}
              likesCount={likesCount}
            />

            {/* Comment Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowComments(!showComments)}
              className="hover:bg-gray-100 text-muted-foreground hover:text-foreground transition-colors"
            >
              <MessageCircle className="h-4 w-4 mr-1" />
              <span className="text-sm">{commentsCount}</span>
            </Button>

            {/* Share Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleShare}
              disabled={!currentUserId || isSharing}
              className="hover:bg-gray-100 text-muted-foreground hover:text-foreground transition-colors"
            >
              <Share2 className="h-4 w-4 mr-1" />
              <span className="text-sm">{post.shares}</span>
            </Button>

            {/* Save Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSave}
              disabled={!currentUserId || isSaving}
              className={`hover:bg-gray-100 transition-colors ${isSaved ? 'text-blue-600 hover:text-blue-700' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <Bookmark className={`h-4 w-4 mr-1 ${isSaved ? 'fill-current' : ''}`} />
              <span className="text-sm">{isSaved ? 'Tersimpan' : 'Simpan'}</span>
            </Button>
          </div>

          <div className="text-xs text-muted-foreground">
            {post.shares > 0 && `${post.shares} bagian`}
          </div>
        </div>

        {/* Comments Section */}
        {showComments && (
          <div className="mt-4 pt-4 border-t">
            <SocialCommentSection
              postId={post.id}
              onCommentCountChange={(count) => {
                setCommentsCount(count)
                onUpdate(post.id, { comments: count })
              }}
              currentUserId={currentUserId}
            />
          </div>
        )}
      </CardContent>

      {/* Custom Delete Confirmation Dialog */}
      <ConfirmDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        title="Hapus Postingan"
        description="Apakah Anda yakin ingin menghapus postingan ini? Tindakan ini tidak dapat dibatalkan."
        confirmText="Hapus"
        cancelText="Batal"
        onConfirm={handleConfirmDelete}
        isDestructive={true}
      />

      {/* Post Info Modal */}
      <div
        className={`fixed inset-0 flex items-center justify-center z-50 p-4 transition-all duration-300 ${
          showInfoModal
            ? 'opacity-100 pointer-events-auto'
            : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Backdrop with blur effect */}
        <div
          className={`absolute inset-0 bg-black/50 transition-all duration-300 ${
            showInfoModal
              ? 'backdrop-blur-sm'
              : 'backdrop-blur-none'
          }`}
          onClick={() => setShowInfoModal(false)}
        />

        {/* Modal Content */}
        <div
          className={`bg-white rounded-lg max-w-md w-full p-6 relative transform transition-all duration-300 ${
            showInfoModal
              ? 'scale-100 opacity-100 translate-y-0'
              : 'scale-95 opacity-0 translate-y-4'
          }`}
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-600" />
              Statistik Postingan
            </h3>
            <button
              onClick={() => setShowInfoModal(false)}
              className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full w-8 h-8 flex items-center justify-center transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between py-3 border-b hover:bg-gray-50 px-2 rounded transition-colors">
              <span className="text-gray-600 flex items-center gap-2">
                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                  <span className="text-red-600 text-sm">❤️</span>
                </div>
                Suka
              </span>
              <span className="font-semibold text-lg">{likesCount}</span>
            </div>
            <div className="flex items-center justify-between py-3 border-b hover:bg-gray-50 px-2 rounded transition-colors">
              <span className="text-gray-600 flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <MessageCircle className="h-4 w-4 text-blue-600" />
                </div>
                Komentar
              </span>
              <span className="font-semibold text-lg">{commentsCount}</span>
            </div>
            <div className="flex items-center justify-between py-3 border-b hover:bg-gray-50 px-2 rounded transition-colors">
              <span className="text-gray-600 flex items-center gap-2">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <Share2 className="h-4 w-4 text-green-600" />
                </div>
                Bagikan
              </span>
              <span className="font-semibold text-lg">{post.shares}</span>
            </div>
            <div className="flex items-center justify-between py-3 border-b hover:bg-gray-50 px-2 rounded transition-colors">
              <span className="text-gray-600 flex items-center gap-2">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <Bookmark className={`h-4 w-4 ${isSaved ? 'fill-purple-600 text-purple-600' : 'text-purple-600'}`} />
                </div>
                Disimpan
              </span>
              <span className="font-semibold text-lg">{isSaved ? 'Ya' : 'Tidak'}</span>
            </div>
            <div className="flex items-center justify-between py-3 hover:bg-gray-50 px-2 rounded transition-colors">
              <span className="text-gray-600 flex items-center gap-2">
                <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                  <Calendar className="h-4 w-4 text-orange-600" />
                </div>
                Diposting
              </span>
              <span className="font-semibold text-lg">{formatDate(post.created_at)}</span>
            </div>
          </div>

          <div className="mt-8 flex justify-end">
            <Button
              onClick={() => setShowInfoModal(false)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors hover:scale-105 transform"
            >
              Tutup
            </Button>
          </div>
        </div>
      </div>

      {/* Image Modal */}
      <ImageModal
        isOpen={showImageModal}
        onClose={() => setShowImageModal(false)}
        imageUrl={selectedImageUrl}
        alt={selectedImageAlt}
      />
    </Card>
  )
}