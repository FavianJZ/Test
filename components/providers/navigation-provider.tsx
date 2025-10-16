"use client"

import { useState, useEffect, createContext, useContext, ReactNode } from "react"
import { usePathname, useSearchParams } from "next/navigation"

interface NavigationContextType {
  isLoading: boolean
  setIsLoading: (loading: boolean) => void
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined)

export function NavigationProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(false)
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    // Start loading when pathname changes
    setIsLoading(true)

    // Simulate minimum loading time for better UX
    const minLoadingTime = setTimeout(() => {
      setIsLoading(false)
    }, 500)

    return () => clearTimeout(minLoadingTime)
  }, [pathname, searchParams])

  return (
    <NavigationContext.Provider value={{ isLoading, setIsLoading }}>
      {children}
    </NavigationContext.Provider>
  )
}

export function useNavigation() {
  const context = useContext(NavigationContext)
  if (context === undefined) {
    throw new Error("useNavigation must be used within a NavigationProvider")
  }
  return context
}