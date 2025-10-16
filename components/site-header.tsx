"use client"

import Link from "next/link"
import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { ShoppingCart, User, Users, Bell, Trophy, Home, MessageSquare, MessageCircle, ShoppingBag } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useCart } from "@/components/cart-provider"
import { NavLink } from "@/components/ui/nav-link"
import { cn } from "@/lib/utils"
import { ProfileDropdown } from "@/components/auth/profile-dropdown"
import { toast } from "sonner"

export function SiteHeader() {
  const [open, setOpen] = useState(false)
  const { data: session } = useSession()
  const { count } = useCart()
  const [friendRequestCount, setFriendRequestCount] = useState(0)
  const [unreadMessageCount, setUnreadMessageCount] = useState(0)

  // Fetch friend request count and unread messages
  useEffect(() => {
    if (!session?.user?.id) return

    const fetchFriendRequests = async () => {
      try {
        const response = await fetch('/api/friends?type=received')
        if (response.ok) {
          const data = await response.json()
          setFriendRequestCount(data.requests?.length || 0)
        }
      } catch (error) {
        console.error('Error fetching friend requests:', error)
      }
    }

    const fetchUnreadMessages = async () => {
      try {
        const response = await fetch(`/api/chat/conversations?userId=${session.user.id}`)
        if (response.ok) {
          const data = await response.json()
          const unreadCount = data.data.reduce((total: number, conv: any) => total + (conv.unreadCount || 0), 0)
          setUnreadMessageCount(unreadCount)
        }
      } catch (error) {
        console.error('Error fetching unread messages:', error)
      }
    }

    fetchFriendRequests()
    fetchUnreadMessages()

    // Set up polling for real-time updates (every 30 seconds)
    const interval = setInterval(() => {
      fetchFriendRequests()
      fetchUnreadMessages()
    }, 30000)

    return () => clearInterval(interval)
  }, [session])

  return (
    <header className="border-b border-border/50 bg-background/90 backdrop-blur-md supports-[backdrop-filter]:bg-background/80 sticky top-0 z-50 transition-all duration-300 shadow-sm">
      <nav aria-label="Navigasi utama" className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/" className="inline-flex items-center gap-3 group">
            <span aria-hidden className="size-8 rounded-xl bg-gradient-to-br from-primary to-primary/90 shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105 flex items-center justify-center" title="HikariCha">
              <span className="text-white font-bold text-sm">HC</span>
            </span>
            <span className="font-semibold text-lg group-hover:text-primary transition-colors duration-200">HikariCha</span>
          </Link>
        </div>

        <button
          aria-label="Buka menu"
          className="md:hidden px-4 py-2 rounded-lg border border-border bg-background hover:bg-muted/50 transition-all duration-200 active:scale-95 shadow-sm"
          onClick={() => setOpen((v) => !v)}
        >
          Menu
        </button>

        <ul className="hidden md:flex items-center gap-1">
          {session && (
            <li>
              <NavLink href="/social" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-primary/10 hover:text-primary transition-all duration-200 font-medium">
                <Home className="size-4" />
                <span className="hidden sm:inline">Social</span>
              </NavLink>
            </li>
          )}
          <li>
            <NavLink href="/forum" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-primary/10 hover:text-primary transition-all duration-200 font-medium">
              <MessageCircle className="size-4" />
              <span>Forum</span>
            </NavLink>
          </li>
          <li>
            <NavLink href="/marketplace" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-primary/10 hover:text-primary transition-all duration-200 font-medium">
              <ShoppingBag className="size-4" />
              <span>Marketplace</span>
            </NavLink>
          </li>
          {session && (
            <>
              </>
          )}
            <li>
            <NavLink href="/marketplace#cart" className={cn("relative inline-flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-primary/10 hover:text-primary transition-all duration-200 font-medium")}>
              <ShoppingCart className="size-4" />
              <span className="hidden sm:inline">Cart</span>
              <span className="sr-only">{"Jumlah item di keranjang"}</span>
              {count > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
                  {count > 99 ? '99+' : count}
                </span>
              )}
            </NavLink>
          </li>
          <li>
            {session ? (
              <ProfileDropdown />
            ) : (
              <NavLink href="/auth/login" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-200 font-medium shadow-sm hover:shadow-md">
                <User className="size-4" />
                <span className="hidden sm:inline">Login/Register</span>
                <span className="sm:hidden">Login</span>
              </NavLink>
            )}
          </li>
        </ul>
      </nav>

      {open && (
        <div className="md:hidden border-t border-border/50 bg-background/95 backdrop-blur-md animate-in slide-in-from-top-2 duration-300 shadow-lg">
          <ul className="px-6 py-4 flex flex-col gap-2">
            {session && (
              <li>
                <NavLink href="/social" onClick={() => setOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-primary/10 hover:text-primary transition-all duration-200 font-medium">
                  <Home className="size-4" />
                  <span>Social</span>
                </NavLink>
              </li>
            )}
            <li>
              <NavLink href="/forum" onClick={() => setOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-primary/10 hover:text-primary transition-all duration-200 font-medium">
                <MessageCircle className="size-4" />
                <span>Forum</span>
              </NavLink>
            </li>
            <li>
              <NavLink href="/marketplace" onClick={() => setOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-primary/10 hover:text-primary transition-all duration-200 font-medium">
                <ShoppingBag className="size-4" />
                <span>Marketplace</span>
              </NavLink>
            </li>
            {session && (
              <>
                </>
            )}
              <li className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-primary/10 hover:text-primary transition-all duration-200 font-medium">
              <ShoppingCart className="size-4" />
              <span>Cart{count > 0 && ` (${count})`}</span>
            </li>
            <li>
              {session ? (
                <div className="px-4 py-2">
                  <ProfileDropdown />
                </div>
              ) : (
                <NavLink href="/auth/login" onClick={() => setOpen(false)} className="inline-flex items-center gap-3 px-4 py-3 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-200 font-medium shadow-sm">
                  <User className="size-4" />
                  <span>Login/Register</span>
                </NavLink>
              )}
            </li>
          </ul>
        </div>
      )}
    </header>
  )
}
