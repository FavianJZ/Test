"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

interface NavLinkProps {
  href: string
  children: React.ReactNode
  className?: string
  activeClassName?: string
  onClick?: () => void
}

export function NavLink({
  href,
  children,
  className = "",
  activeClassName = "text-primary bg-primary/10",
  onClick
}: NavLinkProps) {
  const pathname = usePathname()
  const isActive = pathname === href

  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "relative inline-flex items-center gap-2 px-3 py-2 rounded-md transition-all duration-200 hover:scale-105 transform hover:shadow-md",
        isActive ? activeClassName : "hover:bg-muted/50",
        className
      )}
    >
      {children}
    </Link>
  )
}