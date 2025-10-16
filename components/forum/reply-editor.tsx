"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { DualModeEditor } from "@/components/ui/dual-mode-editor"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  Reply,
  Send,
  Eye,
  Edit3,
  AlertCircle,
  Image,
  Bold,
  Italic,
  Underline,
  List,
  Quote,
  Link,
  User
} from "lucide-react"

interface ReplyEditorProps {
  replyTo?: string
  replyingToUser?: string
  onSubmit: (content: string) => Promise<void>
  onCancel?: () => void
  placeholder?: string
  showAvatar?: boolean
  compact?: boolean
  defaultMode?: "rich" | "simple"
}

export function ReplyEditor({
  replyTo,
  replyingToUser,
  onSubmit,
  onCancel,
  placeholder = "Tulis balasan Anda...",
  showAvatar = true,
  compact = false,
  defaultMode = "simple"
}: ReplyEditorProps) {
  const [content, setContent] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [editorMode, setEditorMode] = useState<"rich" | "simple">(defaultMode)
  const [isInitialLoad, setIsInitialLoad] = useState(true)

  // Auto-tag user when replying to someone's comment (only on initial load)
  useEffect(() => {
    if (replyingToUser && replyTo && isInitialLoad) {
      // Clean username: remove spaces and special characters, but keep readable
      const cleanUsername = replyingToUser.replace(/[^a-zA-Z0-9_]/g, '')
      const userTag = `@${cleanUsername} `
      setContent(userTag)
      setIsInitialLoad(false)
    } else {
      setIsInitialLoad(false)
    }
  }, [replyingToUser, replyTo, isInitialLoad])

  const handleSubmit = async () => {
    if (!content.trim()) return

    setSubmitting(true)
    try {
      await onSubmit(content)
      setContent("")
    } catch (error) {
      console.error('Reply submission failed:', error)
    } finally {
      setSubmitting(false)
    }
  }

  // Handle Ctrl+Enter to submit
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.ctrlKey && e.key === 'Enter') {
      e.preventDefault()
      handleSubmit()
    }
  }

  const handleQuickFormat = (format: string) => {
    // Simple quick formatting for basic use cases
    const textarea = document.createElement('textarea')
    switch (format) {
      case 'bold':
        setContent(prev => prev + '**text**')
        break
      case 'italic':
        setContent(prev => prev + '*text*')
        break
      case 'underline':
        setContent(prev => prev + '__text__')
        break
      case 'list':
        setContent(prev => prev + '\n• Item 1\n• Item 2\n• Item 3')
        break
      case 'ordered':
        setContent(prev => prev + '\n1. Item 1\n2. Item 2\n3. Item 3')
        break
      case 'quote':
        setContent(prev => prev + '\n> Quoted text')
        break
      case 'link':
        const url = prompt('Masukkan URL:')
        if (url) {
          setContent(prev => prev + `[link text](${url})`)
        }
        break
      case 'image':
        const imgUrl = prompt('Masukkan URL gambar:')
        if (imgUrl) {
          setContent(prev => prev + `![alt text](${imgUrl})`)
        }
        break
    }
  }

  if (compact) {
    return (
      <div className="space-y-3" data-reply-id={replyTo}>
        {replyingToUser && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Reply className="h-3 w-3" />
            Membalas {replyingToUser}
          </div>
        )}
        <div className="flex gap-2">
          <DualModeEditor
            value={content}
            onChange={setContent}
            mode={editorMode}
            onModeChange={setEditorMode}
            placeholder={placeholder}
            height={120}
            showModeToggle={false}
          />
        </div>
        <div className="flex items-center justify-between">
          <div className="text-xs text-muted-foreground">
            {editorMode === "simple"
              ? "Simple mode: Upload foto dan basic formatting (ketik @ untuk tag user)"
              : "Rich text mode: Advanced formatting tools"
            }
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setEditorMode(editorMode === "simple" ? "rich" : "simple")}
              className="text-xs"
            >
              {editorMode === "simple" ? "Rich" : "Simple"}
            </Button>
            {onCancel && (
              <Button variant="outline" size="sm" onClick={onCancel}>
                Batal
              </Button>
            )}
            <Button
              size="sm"
              onClick={handleSubmit}
              disabled={submitting || !content.trim()}
              className="flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <div className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Mengirim...
                </>
              ) : (
                <>
                  <Send className="h-3 w-3" />
                  Balas
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <Card data-reply-id={replyTo}>
      <CardContent className="pt-6">
        <div className="space-y-4">
          {/* Header */}
          {replyingToUser && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Reply className="h-4 w-4" />
              Membalas {replyingToUser}
            </div>
          )}

          {/* Editor */}
          <DualModeEditor
            value={content}
            onChange={setContent}
            mode={editorMode}
            onModeChange={setEditorMode}
            placeholder={placeholder}
            height={200}
            showModeToggle={true}
          />

          {/* Quick Formatting Tips */}
          <div className={`${editorMode === "rich" ? "bg-blue-50 border-blue-200" : "bg-green-50 border-green-200"} rounded-lg p-3 border`}>
            <div className={`flex items-center gap-2 text-xs ${editorMode === "rich" ? "text-blue-700" : "text-green-700"} mb-2`}>
              <AlertCircle className="h-3 w-3" />
              Tips {editorMode === "rich" ? "Rich Text" : "Simple Mode"}:
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
              {editorMode === "simple" ? (
                <>
                  <div className="flex items-center gap-1 text-green-600">
                    <Bold className="h-3 w-3" />
                    <span>Bold: *text*</span>
                  </div>
                  <div className="flex items-center gap-1 text-green-600">
                    <Image className="h-3 w-3" />
                    <span>Upload foto</span>
                  </div>
                  <div className="flex items-center gap-1 text-green-600">
                    <Reply className="h-3 w-3" />
                    <span>WhatsApp style</span>
                  </div>
                  <div className="flex items-center gap-1 text-green-600">
                    <User className="h-3 w-3" />
                    <span>@User tagging</span>
                  </div>
                  <div className="flex items-center gap-1 text-green-600">
                    <Send className="h-3 w-3" />
                    <span>Ctrl+Enter kirim</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-1 text-blue-600">
                    <Bold className="h-3 w-3" />
                    <span>Bold: **text**</span>
                  </div>
                  <div className="flex items-center gap-1 text-blue-600">
                    <Italic className="h-3 w-3" />
                    <span>Italic: *text*</span>
                  </div>
                  <div className="flex items-center gap-1 text-blue-600">
                    <List className="h-3 w-3" />
                    <span>List: • item</span>
                  </div>
                  <div className="flex items-center gap-1 text-blue-600">
                    <Quote className="h-3 w-3" />
                    <span>Quote: &gt; text</span>
                  </div>
                  <div className="flex items-center gap-1 text-blue-600">
                    <Link className="h-3 w-3" />
                    <span>Link: [text](url)</span>
                  </div>
                  <div className="flex items-center gap-1 text-blue-600">
                    <Image className="h-3 w-3" />
                    <span>Image: ![alt](url)</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between">
            <div className="text-xs text-muted-foreground">
              💡 Gunakan toolbar editor untuk formatting, upload gambar, dan embed links
            </div>
            <div className="flex items-center gap-2">
              {onCancel && (
                <Button variant="outline" onClick={onCancel}>
                  Batal
                </Button>
              )}
              <Button
                onClick={handleSubmit}
                disabled={submitting || !content.trim()}
                className="flex items-center gap-2"
              >
                {submitting ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Mengirim Balasan...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Kirim Balasan
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}