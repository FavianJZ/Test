"use client"

import { useEffect, useState } from "react"
import { useNavigation } from "@/components/providers/navigation-provider"

export function LoadingBar() {
  const { isLoading } = useNavigation()
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    if (isLoading) {
      setProgress(0)

      // Simulate progress
      const timer1 = setTimeout(() => setProgress(30), 100)
      const timer2 = setTimeout(() => setProgress(60), 200)
      const timer3 = setTimeout(() => setProgress(90), 300)
      const timer4 = setTimeout(() => {
        setProgress(100)
        // Complete loading after a short delay
        setTimeout(() => setProgress(0), 200)
      }, 500)

      return () => {
        clearTimeout(timer1)
        clearTimeout(timer2)
        clearTimeout(timer3)
        clearTimeout(timer4)
      }
    }
  }, [isLoading])

  if (!isLoading || progress === 0) return null

  return (
    <div className="fixed top-0 left-0 right-0 z-50">
      <div className="h-1 bg-gray-200">
        <div
          className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  )
}