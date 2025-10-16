"use client"

import { Card, CardContent, CardHeader } from "@/components/ui/card"

export function ForumPostSkeleton() {
  return (
    <Card className="animate-pulse">
      <CardHeader className="pb-3">
        {/* Author Header Skeleton */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1">
            {/* Avatar skeleton */}
            <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
            {/* User info skeleton */}
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/6"></div>
            </div>
          </div>
          {/* Status badge skeleton */}
          <div className="h-6 bg-gray-200 rounded w-16"></div>
        </div>

        {/* Post meta skeleton */}
        <div className="flex items-center gap-4 mt-3">
          <div className="h-3 bg-gray-200 rounded w-20"></div>
          <div className="h-3 bg-gray-200 rounded w-16"></div>
          <div className="h-3 bg-gray-200 rounded w-24"></div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Title skeleton */}
        <div className="mb-3 space-y-2">
          <div className="h-6 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-full"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>

        {/* Category and stats skeleton */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-6 bg-gray-200 rounded w-20"></div>
            <div className="flex items-center gap-3">
              <div className="h-4 bg-gray-200 rounded w-8"></div>
              <div className="h-4 bg-gray-200 rounded w-8"></div>
              <div className="h-4 bg-gray-200 rounded w-8"></div>
            </div>
          </div>
          <div className="h-4 bg-gray-200 rounded w-12"></div>
        </div>
      </CardContent>
    </Card>
  )
}

export function ForumPostListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, index) => (
        <ForumPostSkeleton key={index} />
      ))}
    </div>
  )
}

export function ForumCategoryFilterSkeleton() {
  return (
    <div className="flex items-center gap-2 flex-wrap mb-6">
      {Array.from({ length: 5 }).map((_, index) => (
        <div
          key={index}
          className="h-10 bg-gray-200 rounded-lg w-20 animate-pulse"
        ></div>
      ))}
    </div>
  )
}