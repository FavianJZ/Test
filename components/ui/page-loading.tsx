"use client"

import { useNavigation } from "@/components/providers/navigation-provider"

export function PageLoading() {
  const { isLoading } = useNavigation()

  if (!isLoading) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm">
      <div className="flex flex-col items-center space-y-4">
        <div className="relative">
          <div className="w-12 h-12 rounded-full border-4 border-gray-200"></div>
          <div className="absolute top-0 left-0 w-12 h-12 rounded-full border-4 border-blue-500 border-t-transparent animate-spin"></div>
        </div>
        <div className="text-sm font-medium text-gray-600">Loading...</div>
      </div>
    </div>
  )
}