"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "./button"
import { Badge } from "./badge"
import { Card, CardContent } from "./card"
import {
  Send,
  Image,
  Smile,
  Paperclip,
  X,
  Upload,
  AlertCircle,
  User
} from "lucide-react"

interface User {
  id: string
  name: string
  email: string
  avatar?: string
}

interface SimpleTextEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  onImageUpload?: (images: string[]) => void
  showSubmitButton?: boolean
  onSubmit?: () => void
  submitText?: string
  disabled?: boolean
  maxLength?: number
  showCharCount?: boolean
}

// User data will be fetched from database

export function SimpleTextEditor({
  value,
  onChange,
  placeholder = "Tulis pesan Anda...",
  onImageUpload,
  showSubmitButton = true,
  onSubmit,
  submitText = "Kirim",
  disabled = false,
  maxLength = 2000,
  showCharCount = true
}: SimpleTextEditorProps) {
  const [images, setImages] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // User tagging states
  const [showUserSuggestions, setShowUserSuggestions] = useState(false)
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [allUsers, setAllUsers] = useState<User[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [cursorPosition, setCursorPosition] = useState(0)

  // Fetch users from database
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch('/api/users')
        const data = await response.json()
        if (data.success) {
          setAllUsers(data.data)
        }
      } catch (error) {
        console.error('Failed to fetch users:', error)
        // Fallback to mock data if API fails
        setAllUsers([
          { id: "1", name: "Admin", email: "admin@admin.com", avatar: "" },
          { id: "2", name: "Test User", email: "test@demo1.com", avatar: "" },
          { id: "3", name: "Kenji Tea Master", email: "kenji@tea.com", avatar: "" },
          { id: "4", name: "Natsumi Matcha", email: "natsumi@matcha.com", avatar: "" },
          { id: "5", name: "Rina Reviewer", email: "rina@review.com", avatar: "" },
        ])
      }
    }
    fetchUsers()
  }, [])

  // Extract search term for user tagging
  const extractSearchTerm = (text: string, position: number) => {
    const beforeCursor = text.substring(0, position)
    const atMatch = beforeCursor.lastIndexOf('@')

    if (atMatch === -1) return null

    // Check if character before @ is a space, newline, or start of text
    if (atMatch > 0) {
      const charBeforeAt = beforeCursor.charAt(atMatch - 1)
      if (charBeforeAt.match(/[a-zA-Z0-9]/)) return null
    }

    const afterAt = beforeCursor.substring(atMatch + 1)
    const spaceMatch = afterAt.search(/\s/)

    if (spaceMatch === -1) {
      return { start: atMatch, end: position, term: afterAt }
    }

    if (position - atMatch - 1 > spaceMatch) return null

    return { start: atMatch, end: atMatch + spaceMatch + 1, term: afterAt.substring(0, spaceMatch) }
  }

  // Auto-resize textarea and handle user tagging
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value
    const newPosition = e.target.selectionStart

    onChange(newText)
    setCursorPosition(newPosition)

    // Handle user tagging
    const searchResult = extractSearchTerm(newText, newPosition)

    if (searchResult && searchResult.term.length >= 1) {
      setSearchTerm(searchResult.term.toLowerCase())
      const filtered = allUsers.filter(user =>
        user.name.toLowerCase().includes(searchResult.term.toLowerCase()) ||
        user.email.toLowerCase().includes(searchResult.term.toLowerCase())
      )
      setFilteredUsers(filtered)
      setShowUserSuggestions(filtered.length > 0)
    } else {
      setShowUserSuggestions(false)
    }

    // Auto-resize
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`
    }
  }

  // Handle image upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    setUploading(true)

    try {
      const newImages: string[] = []

      for (let i = 0; i < files.length; i++) {
        const file = files[i]

        // Validate file type
        if (!file.type.startsWith('image/')) {
          continue
        }

        // Validate file size (5MB max)
        if (file.size > 5 * 1024 * 1024) {
          continue
        }

        // Try upload to server first
        try {
          console.log('SimpleTextEditor: Uploading image:', file.name)
          const formData = new FormData()
          formData.append('image', file)

          const response = await fetch('/api/upload/image', {
            method: 'POST',
            body: formData
          })

          console.log('SimpleTextEditor: Response status:', response.status)

          if (response.ok) {
            const data = await response.json()
            console.log('SimpleTextEditor: Upload successful, URL:', data.data.url)
            newImages.push(data.data.url)
          } else {
            console.error('SimpleTextEditor: Upload failed')
            // Fallback to base64
            const base64 = await fileToBase64(file)
            newImages.push(base64)
          }
        } catch (error) {
          console.error('SimpleTextEditor: Upload error:', error)
          // Fallback to base64
          const base64 = await fileToBase64(file)
          newImages.push(base64)
        }
      }

      setImages(prev => [...prev, ...newImages])
      onImageUpload?.(newImages)

    } catch (error) {
      console.error('Image upload failed:', error)
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  // Convert file to base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  // Remove image
  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index))
  }

  // Handle submit
  const handleSubmit = () => {
    if (disabled || (!value.trim() && images.length === 0)) return
    onSubmit?.()
  }

  // Handle user selection for tagging
  const handleUserSelect = (user: User) => {
    const searchResult = extractSearchTerm(value, cursorPosition)

    if (searchResult) {
      const beforeMention = value.substring(0, searchResult.start)
      const afterMention = value.substring(searchResult.end)
      const newText = `${beforeMention}@${user.name.replace(/\s/g, '')} ${afterMention}`

      onChange(newText)
      setShowUserSuggestions(false)

      // Set cursor position after insertion
      setTimeout(() => {
        if (textareaRef.current) {
          const newCursorPosition = beforeMention.length + user.name.replace(/\s/g, '').length + 2
          textareaRef.current.setSelectionRange(newCursorPosition, newCursorPosition)
          textareaRef.current.focus()
        }
      }, 0)
    }
  }

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (showUserSuggestions) {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        // Implement keyboard navigation for user suggestions
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        // Implement keyboard navigation for user suggestions
      } else if (e.key === 'Escape') {
        setShowUserSuggestions(false)
      } else if (e.key === 'Enter') {
        e.preventDefault()
        // Select first user
        if (filteredUsers.length > 0) {
          handleUserSelect(filteredUsers[0])
        }
        return
      }
    }

    if (e.key === 'Enter' && e.ctrlKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  // Handle click outside for user suggestions
  const handleClickOutside = (e: MouseEvent) => {
    if (textareaRef.current && !textareaRef.current.contains(e.target as Node)) {
      setShowUserSuggestions(false)
    }
  }

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const charCount = value.length
  const remainingChars = maxLength - charCount

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <style jsx>{`
          :global(.simple-editor-image) {
            max-width: 100%;
            height: auto;
            border-radius: 8px;
            margin: 8px 0;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            display: block;
          }
        `}</style>
        {/* Mode Indicator */}
        <div className="flex items-center justify-between px-3 py-2 border-b bg-gradient-to-r from-green-50 to-emerald-50">
          <Badge variant="outline" className="text-xs bg-green-100 border-green-200 text-green-700">
            <Paperclip className="h-3 w-3 mr-1" />
            Simple Mode
          </Badge>
          <div className="text-xs text-muted-foreground">
            {showCharCount && (
              <span className={`transition-colors duration-200 ${
                remainingChars < 20 ? 'text-red-500 font-semibold' :
                remainingChars < 50 ? 'text-orange-500' :
                remainingChars < 100 ? 'text-yellow-500' : ''
              }`}>
                {charCount}/{maxLength}
              </span>
            )}
          </div>
        </div>

        {/* Images Preview */}
        {images.length > 0 && (
          <div className="p-3 border-b">
            <div className="flex flex-wrap gap-2">
              {images.map((image, index) => (
                <div key={index} className="relative group">
                  <img
                    src={image}
                    alt={`Upload ${index + 1}`}
                    className="w-20 h-20 object-cover rounded-md border simple-editor-image"
                  />
                  <Button
                    variant="destructive"
                    size="sm"
                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => removeImage(index)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Text Input */}
        <div className="p-3 relative">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            maxLength={maxLength}
            className="w-full resize-none border-0 p-0 focus:outline-none focus:ring-0 text-base min-h-[80px] placeholder:text-muted-foreground"
            style={{ minHeight: '80px', maxHeight: '200px' }}
          />

          {/* User Suggestions */}
          {showUserSuggestions && (
            <div className="absolute bottom-full left-3 right-3 mb-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
              <div className="p-2">
                <div className="text-xs text-gray-500 mb-2 px-2">
                  Tag user: {searchTerm}
                </div>
                {filteredUsers.map((user) => (
                  <div
                    key={user.id}
                    onClick={() => handleUserSelect(user)}
                    className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 rounded-md cursor-pointer transition-colors"
                  >
                    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                      {user.avatar ? (
                        <img
                          src={user.avatar}
                          alt={user.name}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <User className="w-4 h-4 text-gray-500" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{user.name}</div>
                      <div className="text-xs text-gray-500 truncate">{user.email}</div>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      @{user.name.replace(/\s/g, '')}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Action Bar */}
        <div className="flex items-center justify-between px-3 py-2 border-t bg-gray-50">
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
              variant="ghost"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled || uploading}
              className="text-muted-foreground hover:text-foreground hover:bg-green-100 hover:text-green-600 transition-all duration-200"
            >
              {uploading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-green-600 border-t-transparent" />
              ) : (
                <Image className="h-4 w-4" />
              )}
            </Button>

            {/* Emoji (placeholder for future) */}
            <Button
              variant="ghost"
              size="sm"
              disabled
              className="text-muted-foreground opacity-50"
            >
              <Smile className="h-4 w-4" />
            </Button>

            {/* File Attach (placeholder for future) */}
            <Button
              variant="ghost"
              size="sm"
              disabled
              className="text-muted-foreground opacity-50"
            >
              <Paperclip className="h-4 w-4" />
            </Button>
          </div>

          {/* Submit Button */}
          {showSubmitButton && (
            <Button
              size="sm"
              onClick={handleSubmit}
              disabled={disabled || uploading || (!value.trim() && images.length === 0)}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white hover:scale-105 transform transition-all duration-200 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {uploading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              {submitText}
            </Button>
          )}
        </div>

        {/* Character Count Warning */}
        {showCharCount && remainingChars < 50 && (
          <div className="px-3 py-2 bg-orange-50 border-t">
            <div className="flex items-center gap-2 text-xs text-orange-600">
              <AlertCircle className="h-3 w-3" />
              <span>
                {remainingChars <= 0
                  ? "Maksimal karakter tercapai"
                  : `${remainingChars} karakter tersisa`
                }
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Format simple content to HTML for display
export function formatSimpleContent(text: string, images: string[] = []): string {
  // Convert URLs to links
  const urlRegex = /(https?:\/\/[^\s]+)/g
  let formattedText = text.replace(urlRegex, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>')

  // Convert line breaks to <br>
  formattedText = formattedText.replace(/\n/g, '<br>')

  // Add images
  let content = formattedText

  if (images.length > 0) {
    const imageHtml = images.map(img => `
      <div class="my-3">
        <img src="${img}" alt="Shared image" class="max-w-full rounded-lg shadow-sm" />
      </div>
    `).join('')

    content = imageHtml + content
  }

  return content
}

// WhatsApp-style formatting (basic)
export function parseWhatsAppFormatting(text: string): string {
  // Bold: *text*
  text = text.replace(/\*([^*]+)\*/g, '<strong>$1</strong>')

  // Italic: _text_
  text = text.replace(/_([^_]+)_/g, '<em>$1</em>')

  // Strikethrough: ~text~
  text = text.replace(/~([^~]+)~/g, '<s>$1</s>')

  // Code: `text`
  text = text.replace(/`([^`]+)`/g, '<code class="bg-gray-100 px-1 rounded text-sm">$1</code>')

  return text
}