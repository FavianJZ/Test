"use client"

import { useState, useRef } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Send, Image, X, Smile, Paperclip } from "lucide-react"
import { toast } from "sonner"

interface SocialPostCreatorProps {
  isVisible: boolean
  onClose: () => void
  onPostCreated: (post: any) => void
}

export function SocialPostCreator({ isVisible, onClose, onPostCreated }: SocialPostCreatorProps) {
  const [content, setContent] = useState("")
  const [mediaFiles, setMediaFiles] = useState<File[]>([])
  const [mediaUrls, setMediaUrls] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const { data: session } = useSession()
  const fileInputRef = useRef<HTMLInputElement>(null)

  if (!isVisible) return null

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    setIsUploading(true)

    try {
      const newUrls: string[] = []

      for (const file of files) {
        // Validate file type
        if (!file.type.startsWith('image/')) {
          toast.error(`${file.name} bukan file gambar`)
          continue
        }

        // Validate file size (5MB max)
        if (file.size > 5 * 1024 * 1024) {
          toast.error(`${file.name} terlalu besar (maksimal 5MB)`)
          continue
        }

        // Upload image
        const formData = new FormData()
        formData.append('image', file)

        const response = await fetch('/api/upload/image', {
          method: 'POST',
          body: formData
        })

        if (response.ok) {
          const data = await response.json()
          newUrls.push(data.data.url)
        } else {
          toast.error(`Gagal mengunggah ${file.name}`)
        }
      }

      setMediaUrls(prev => [...prev, ...newUrls])
      setMediaFiles(prev => [...prev, ...files])

      if (newUrls.length > 0) {
        toast.success(`${newUrls.length} gambar berhasil diunggah`)
      }
    } catch (error) {
      console.error('Error uploading images:', error)
      toast.error("Terjadi kesalahan saat mengunggah gambar")
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const removeMedia = (index: number) => {
    setMediaUrls(prev => prev.filter((_, i) => i !== index))
    setMediaFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async () => {
    if (!content.trim() && mediaUrls.length === 0) {
      toast.error("Tulis sesuatu atau tambahkan media untuk membuat postingan")
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/social/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: content.trim(),
          media_urls: mediaUrls.length > 0 ? mediaUrls : undefined
        })
      })

      const data = await response.json()

      if (data.success) {
        if (!data.data || !data.data.id) {
          console.error('Invalid post data received from API:', data.data)
          toast.error("Data postingan tidak valid")
          return
        }

        console.log('Post created successfully:', data.data.id)
        onPostCreated(data.data)
        setContent("")
        setMediaUrls([])
        setMediaFiles([])
        onClose()
      } else {
        console.error('API returned error:', data.error)
        toast.error(data.error || "Gagal membuat postingan")
      }
    } catch (error) {
      console.error('Error creating post:', error)
      toast.error("Terjadi kesalahan saat membuat postingan")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <Card className="border-2 border-primary/20 shadow-lg animate-in slide-in-from-top duration-300">
      <CardContent className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
              <Send className="h-4 w-4 text-primary" />
            </div>
            <h3 className="text-lg font-semibold">Buat Postingan Baru</h3>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="hover:bg-gray-100 rounded-full p-2"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content Input */}
        <div className="space-y-4">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Bagikan pemikiran atau momen Anda dengan komunitas HikariCha..."
            className="min-h-[120px] resize-none border-0 focus:ring-0 text-base"
            maxLength={2000}
          />

          {/* Character Count */}
          <div className="text-right text-xs text-muted-foreground">
            {content.length}/2000
          </div>

          {/* Media Preview */}
          {mediaUrls.length > 0 && (
            <div className="grid grid-cols-2 gap-3">
              {mediaUrls.map((url, index) => (
                <div key={index} className="relative group">
                  <img
                    src={url}
                    alt={`Upload ${index + 1}`}
                    className="w-full h-48 object-cover rounded-lg border"
                  />
                  <Button
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2 h-6 w-6 rounded-full p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => removeMedia(index)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Action Bar */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="flex items-center gap-2">
              {/* Image Upload */}
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="hover:bg-gray-100"
              >
                {isUploading ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                ) : (
                  <Image className="h-4 w-4" />
                )}
              </Button>

              {/* Placeholder for future features */}
              <Button
                variant="outline"
                size="sm"
                disabled
                className="opacity-50"
              >
                <Smile className="h-4 w-4" />
              </Button>

              <Button
                variant="outline"
                size="sm"
                disabled
                className="opacity-50"
              >
                <Paperclip className="h-4 w-4" />
              </Button>
            </div>

            {/* Submit Button */}
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || (!content.trim() && mediaUrls.length === 0)}
              className="bg-primary hover:bg-primary/90 hover:scale-105 transition-all duration-200 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {isSubmitting ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Posting
            </Button>
          </div>

          {/* Help Text */}
          <div className="text-xs text-muted-foreground">
            💡 Tip: Tekan Ctrl+Enter untuk memposting cepat
          </div>
        </div>
      </CardContent>
    </Card>
  )
}