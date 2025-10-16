"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { DualModeEditor } from "@/components/ui/dual-mode-editor"
import { ArrowLeft, Send, AlertCircle, Eye, Edit3 } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"

interface Category {
  id: number
  slug: string
  name: string
  description?: string
  color: string
  icon?: string
}

interface CreateThreadClientProps {
  session: any
}

export function CreateThreadClient({ session }: CreateThreadClientProps) {
  const router = useRouter()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    category_id: ""
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [editorMode, setEditorMode] = useState<"edit" | "preview">("edit")
  const [editorType, setEditorType] = useState<"rich" | "simple" | "choice">("simple")

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/forum/categories')
      const data = await response.json()

      if (data.success) {
        setCategories(data.data)
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error)
      toast.error("Gagal memuat kategori")
    } finally {
      setLoading(false)
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.title.trim()) {
      newErrors.title = "Judul tidak boleh kosong"
    } else if (formData.title.length < 10) {
      newErrors.title = "Judul minimal 10 karakter"
    } else if (formData.title.length > 200) {
      newErrors.title = "Judul maksimal 200 karakter"
    }

    if (!formData.content.trim()) {
      newErrors.content = "Konten tidak boleh kosong"
    } else {
      // Strip HTML to check text length
      const temp = document.createElement('div')
      temp.innerHTML = formData.content
      const textContent = temp.innerText || temp.textContent || ""

      if (textContent.length < 20) {
        newErrors.content = "Konten minimal 20 karakter"
      }
    }

    if (!formData.category_id) {
      newErrors.category = "Pilih kategori terlebih dahulu"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setSubmitting(true)

    try {
      const response = await fetch('/api/forum/threads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: formData.title.trim(),
          content: formData.content,
          category_id: parseInt(formData.category_id),
          excerpt: (() => {
            const temp = document.createElement('div')
            temp.innerHTML = formData.content
            const textContent = temp.innerText || temp.textContent || ""
            return textContent.trim().substring(0, 200) + (textContent.length > 200 ? '...' : '')
          })()
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast.success("Topik berhasil dibuat!")
        router.push(`/forum/thread/${data.data.threadId}`)
      } else {
        toast.error(data.error || "Gagal membuat topik")
      }
    } catch (error) {
      console.error('Create thread error:', error)
      toast.error("Terjadi kesalahan saat membuat topik")
    } finally {
      setSubmitting(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }))
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-8"></div>
          <div className="space-y-4">
            <div className="h-12 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-12 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link href="/forum">
          <Button variant="ghost" size="sm" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Kembali ke Forum
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-semibold">Buat Topik Baru</h1>
          <p className="text-sm text-muted-foreground">
            Bagikan pertanyaan atau diskusi Anda dengan komunitas matcha
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span>Detail Topik</span>
              <Badge variant="outline" className="text-xs">
                {session.user?.name}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Judul Topik *</Label>
              <Input
                id="title"
                placeholder="Contoh: Bagaimana cara memilih matcha yang baik untuk pemula?"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                className={errors.title ? "border-red-500" : ""}
                maxLength={200}
              />
              {errors.title && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.title}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                {formData.title.length}/200 karakter
              </p>
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label htmlFor="category">Kategori *</Label>
              <Select
                value={formData.category_id}
                onValueChange={(value) => handleInputChange('category_id', value)}
              >
                <SelectTrigger className={errors.category ? "border-red-500" : ""}>
                  <SelectValue placeholder="Pilih kategori" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id.toString()}>
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{category.name}</span>
                        {category.description && (
                          <span className="text-xs text-muted-foreground">
                            - {category.description}
                          </span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.category && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.category}
                </p>
              )}
            </div>

            {/* Content */}
            <div className="space-y-2">
              <Label htmlFor="content">Konten *</Label>
              <DualModeEditor
                value={formData.content}
                onChange={(value) => handleInputChange('content', value)}
                mode={editorType}
                onModeChange={(mode) => setEditorType(mode)}
                placeholder={
                  editorType === "simple"
                    ? "Tulis pertanyaan atau diskusi Anda... Upload foto mudah seperti WhatsApp!"
                    : editorType === "rich"
                    ? "Tuliskan pertanyaan atau diskusi Anda secara detail. Semakin jelas, semakin baik respon yang Anda dapatkan. Gunakan rich text formatting untuk membuat postingan lebih menarik! Klik ikon gambar 🖼️ untuk upload foto."
                    : "Pilih mode editor di bawah..."
                }
                height={editorType === "simple" ? 150 : 300}
                showModeToggle={editorType !== "choice"}
              />
              {errors.content && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.content}
                </p>
              )}
              {editorType !== "choice" && (
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    {editorType === "simple"
                      ? "Simple mode: Upload foto dan basic formatting seperti WhatsApp"
                      : "Rich text mode: Advanced formatting, tables, media embedding"
                    }
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditorType("choice")}
                    className="text-xs"
                  >
                    Ganti Mode
                  </Button>
                </div>
              )}
            </div>

            {/* Guidelines */}
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Panduan Posting:</strong>
                <ul className="list-disc list-inside text-sm mt-2 space-y-1">
                  <li>Buat judul yang jelas dan deskriptif</li>
                  <li>Jelaskan pertanyaan atau topik dengan detail</li>
                  <li>Sopan dan hormati member lain</li>
                  <li>Cari dulu apakah topik serupa sudah ada</li>
                  <li>Gunakan kategori yang sesuai</li>
                </ul>
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* Submit Buttons */}
        <div className="flex items-center justify-between">
          <Link href="/forum">
            <Button variant="outline" type="button">
              Batal
            </Button>
          </Link>
          <Button
            type="submit"
            disabled={submitting}
            className="flex items-center gap-2"
          >
            {submitting ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Membuat Topik...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Buat Topik
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}