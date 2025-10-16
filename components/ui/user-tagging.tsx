"use client"

import { useState, useRef, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { User } from "lucide-react"

interface User {
  id: string
  name: string
  email: string
  avatar?: string
}

interface UserTaggingProps {
  value: string
  onChange: (value: string) => void
  onUserSelect?: (user: User) => void
  placeholder?: string
  disabled?: boolean
  className?: string
}

// Mock user data - dalam implementasi nyata, ini akan fetch dari database
const mockUsers: User[] = [
  { id: "1", name: "Admin", email: "admin@admin.com" },
  { id: "2", name: "Test User", email: "test@demo1.com" },
  { id: "3", name: "Kenji Tea Master", email: "kenji@tea.com" },
  { id: "4", name: "Natsumi Matcha", email: "natsumi@matcha.com" },
  { id: "5", name: "Rina Reviewer", email: "rina@review.com" },
]

export function UserTagging({
  value,
  onChange,
  onUserSelect,
  placeholder = "Ketik @ untuk tag user...",
  disabled = false,
  className = ""
}: UserTaggingProps) {
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [cursorPosition, setCursorPosition] = useState(0)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const extractSearchTerm = (text: string, position: number) => {
    const beforeCursor = text.substring(0, position)
    const atMatch = beforeCursor.lastIndexOf('@')

    if (atMatch === -1) return null

    const afterAt = beforeCursor.substring(atMatch + 1)
    const spaceMatch = afterAt.search(/\s/)

    if (spaceMatch === -1) {
      return { start: atMatch, end: position, term: afterAt }
    }

    if (position - atMatch - 1 > spaceMatch) return null

    return { start: atMatch, end: atMatch + spaceMatch + 1, term: afterAt.substring(0, spaceMatch) }
  }

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value
    const newPosition = e.target.selectionStart

    onChange(newText)
    setCursorPosition(newPosition)

    const searchResult = extractSearchTerm(newText, newPosition)

    if (searchResult && searchResult.term.length > 0) {
      setSearchTerm(searchResult.term.toLowerCase())
      const filtered = mockUsers.filter(user =>
        user.name.toLowerCase().includes(searchResult.term.toLowerCase()) ||
        user.email.toLowerCase().includes(searchResult.term.toLowerCase())
      )
      setFilteredUsers(filtered)
      setShowSuggestions(filtered.length > 0)
    } else {
      setShowSuggestions(false)
    }
  }

  const handleUserSelect = (user: User) => {
    const searchResult = extractSearchTerm(value, cursorPosition)

    if (searchResult) {
      const beforeMention = value.substring(0, searchResult.start)
      const afterMention = value.substring(searchResult.end)
      const newText = `${beforeMention}@${user.name.replace(/\s/g, '')} ${afterMention}`

      onChange(newText)
      setShowSuggestions(false)

      if (onUserSelect) {
        onUserSelect(user)
      }

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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      // Implement keyboard navigation
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      // Implement keyboard navigation
    } else if (e.key === 'Escape') {
      setShowSuggestions(false)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      // Select first user
      if (filteredUsers.length > 0) {
        handleUserSelect(filteredUsers[0])
      }
    }
  }

  const handleClickOutside = (e: MouseEvent) => {
    if (textareaRef.current && !textareaRef.current.contains(e.target as Node)) {
      setShowSuggestions(false)
    }
  }

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  return (
    <div className={`relative ${className}`}>
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleTextChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full min-h-[100px] p-3 border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />

      {showSuggestions && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
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
  )
}