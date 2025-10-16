"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Search, Filter, Users, FileText, Hash, X, Clock } from "lucide-react"
import { BorderDisplay } from "@/components/ui/border-display"
import { SocialPostCard } from "./social-feed/social-post-card"
import { toast } from "sonner"

interface SearchResult {
  type: 'post' | 'user'
  relevance_score: number
}

interface PostResult extends SearchResult {
  type: 'post'
  id: string
  content: string
  authorId: string
  author_name: string
  author_avatar?: string
  author_border?: any
  author_posts?: number
  author_joinDate?: string
  media_urls?: string[]
  likesCount: number
  commentsCount: number
  sharesCount: number
  createdAt: string
  updatedAt: string
}

interface UserResult extends SearchResult {
  type: 'user'
  id: string
  name: string
  avatar?: string
  border?: any
  bio?: string
  post_count: number
}

interface SocialSearchProps {
  onResultClick?: (result: SearchResult) => void
  onQueryChange?: (query: string) => void
  className?: string
}

export function SocialSearch({ onResultClick, onQueryChange, className = "" }: SocialSearchProps) {
  const [query, setQuery] = useState("")
  const [searchType, setSearchType] = useState<"posts" | "users" | "all">("posts")
  const [results, setResults] = useState<(PostResult | UserResult)[]>([])
  const [loading, setLoading] = useState(false)
  const [isSearching, setIsSearching] = useState(false)

  const handleSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([])
      return
    }

    setLoading(true)
    try {
      const params = new URLSearchParams({
        q: searchQuery,
        type: searchType,
        limit: '20'
      })

      const response = await fetch(`/api/social/search?${params}`)
      const data = await response.json()

      if (data.success) {
        setResults(data.data)
      } else {
        toast.error("Gagal melakukan pencarian")
      }
    } catch (error) {
      console.error('Error searching:', error)
      toast.error("Terjadi kesalahan saat mencari")
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (value: string) => {
    setQuery(value)
    onQueryChange?.(value)

    if (value.trim()) {
      setIsSearching(true)
      // Debounce search
      const timer = setTimeout(() => {
        handleSearch(value)
      }, 300)
      return () => clearTimeout(timer)
    } else {
      setResults([])
      setIsSearching(false)
    }
  }

  const clearSearch = () => {
    setQuery("")
    setResults([])
    setIsSearching(false)
    onQueryChange?.("")
  }

  const handleResultClick = (result: PostResult | UserResult) => {
    onResultClick?.(result)
    clearSearch()
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

  return (
    <div className={`relative ${className}`}>
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          placeholder="Cari postingan, pengguna, atau topik..."
          className="pl-10 pr-10"
        />
        {query && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearSearch}
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Search Type Selector */}
      {isSearching && (
        <div className="absolute top-full left-0 right-0 mt-2 p-3 bg-white border rounded-lg shadow-lg z-50">
          <div className="flex items-center gap-2 mb-3">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={searchType} onValueChange={(value: any) => setSearchType(value)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="posts">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    <span>Postingan</span>
                  </div>
                </SelectItem>
                <SelectItem value="users">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <span>Pengguna</span>
                  </div>
                </SelectItem>
                <SelectItem value="all">
                  <div className="flex items-center gap-2">
                    <Hash className="h-4 w-4" />
                    <span>Semua</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Results */}
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              </div>
            ) : results.length > 0 ? (
              <div className="space-y-3">
                {results.map((result, index) => (
                  <div key={`${result.type}-${result.id}-${index}`}>
                    {result.type === 'post' && (
                      <Card className="cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => handleResultClick(result)}>
                        <CardContent className="p-4">
                          <div className="space-y-3">
                            {/* Post Header */}
                            <div className="flex items-center gap-3">
                              <BorderDisplay
                                border={result.author_border ? JSON.parse(result.author_border) : null}
                                userAvatar={result.author_avatar}
                                userName={result.author_name}
                                size="social"
                                showUserInfo={true}
                                showBadge={true}
                                badgeText="Member"
                                orientation="horizontal"
                              />
                              <div className="text-xs text-muted-foreground flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatDate(result.createdAt)}
                              </div>
                              <Badge variant="secondary" className="text-xs">
                                Postingan
                              </Badge>
                            </div>

                            {/* Post Content */}
                            <div className="text-sm line-clamp-2">
                              {result.content}
                            </div>

                            {/* Post Stats */}
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <span>{result.likesCount} suka</span>
                              <span>{result.commentsCount} komentar</span>
                              <span>{result.sharesCount} bagian</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {result.type === 'user' && (
                      <Card className="cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => handleResultClick(result)}>
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            <BorderDisplay
                              border={result.border ? JSON.parse(result.border) : null}
                              userAvatar={result.avatar}
                              userName={result.name}
                              size="social"
                              showUserInfo={true}
                              showBadge={true}
                              badgeText="Member"
                              orientation="horizontal"
                            />
                            <div className="flex-1">
                              {result.bio && (
                                <div className="text-sm text-muted-foreground line-clamp-1">{result.bio}</div>
                              )}
                              <div className="text-xs text-muted-foreground">{result.post_count} postingan</div>
                            </div>
                            <Badge variant="secondary" className="text-xs">
                              Pengguna
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Tidak ada hasil untuk "{query}"</p>
                <p className="text-xs">Coba kata kunci yang berbeda</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}