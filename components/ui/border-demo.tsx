"use client"

import { BorderPreview } from "./border-preview"
import { BorderDisplay, CompactBorderDisplay, MinimalBorderDisplay } from "./border-display"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

const demoBorders = [
  {
    id: "default",
    name: "Default",
    image: "/borders/default.svg",
    unlocked: true,
    rarity: "common" as const
  },
  {
    id: "bronze",
    name: "Bronze",
    image: "/borders/bronze.svg",
    unlocked: true,
    rarity: "common" as const
  },
  {
    id: "silver",
    name: "Silver",
    image: "/borders/silver.svg",
    unlocked: false,
    rarity: "rare" as const
  },
  {
    id: "gold",
    name: "Gold",
    image: "/borders/gold.svg",
    unlocked: false,
    rarity: "epic" as const
  }
]

export function BorderDemo() {
  return (
    <div className="space-y-8 p-6">
      <h1 className="text-2xl font-bold">Border Component Demo</h1>

      {/* Profile Usage */}
      <Card>
        <CardHeader>
          <CardTitle>Profile Usage</CardTitle>
          <CardDescription>Large border for profile pages</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center">
            <BorderPreview
              border={demoBorders[0]}
              size="2xl"
              avatarSrc="/placeholder-avatar.jpg"
              avatarName="John Doe"
              showLabel={false}
              showLockStatus={false}
            />
          </div>
        </CardContent>
      </Card>

      {/* Forum Post Header */}
      <Card>
        <CardHeader>
          <CardTitle>Forum Post Header</CardTitle>
          <CardDescription>User info in forum posts</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <BorderDisplay
              border={demoBorders[0]}
              userAvatar="/placeholder-avatar.jpg"
              userName="John Doe"
              size="md"
              showUserInfo={true}
              showBadge={true}
              badgeText="Active Member"
              orientation="horizontal"
            />
            <BorderDisplay
              border={demoBorders[1]}
              userAvatar="/placeholder-avatar.jpg"
              userName="Jane Smith"
              size="md"
              showUserInfo={true}
              showBadge={true}
              badgeText="Chef"
              orientation="horizontal"
            />
          </div>
        </CardContent>
      </Card>

      {/* User List */}
      <Card>
        <CardHeader>
          <CardTitle>User List / Leaderboard</CardTitle>
          <CardDescription>Compact user display for lists</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {demoBorders.slice(0, 3).map((border, index) => (
              <CompactBorderDisplay
                key={border.id}
                border={border}
                userAvatar="/placeholder-avatar.jpg"
                userName={`User ${index + 1}`}
                size="sm"
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* User Mentions */}
      <Card>
        <CardHeader>
          <CardTitle>User Mentions</CardTitle>
          <CardDescription>Inline user mentions in comments</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center space-x-2">
              <span>Thanks to</span>
              <MinimalBorderDisplay
                border={demoBorders[0]}
                userAvatar="/placeholder-avatar.jpg"
                userName="John"
                size="xs"
              />
              <span>for the recipe!</span>
            </div>
            <div className="flex items-center space-x-2">
              <span>Great tip from</span>
              <MinimalBorderDisplay
                border={demoBorders[1]}
                userAvatar="/placeholder-avatar.jpg"
                userName="Jane"
                size="xs"
              />
              <span>!</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Border Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Border Selection</CardTitle>
          <CardDescription>Border customization interface</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            {demoBorders.map((border) => (
              <BorderPreview
                key={border.id}
                border={border}
                size="lg"
                showLabel={true}
                showLockStatus={true}
                showRarity={true}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Size Variations */}
      <Card>
        <CardHeader>
          <CardTitle>Size Variations</CardTitle>
          <CardDescription>Different sizes for different use cases</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-end space-x-6">
            <div className="text-center">
              <BorderPreview
                border={demoBorders[0]}
                size="xs"
                showLabel={false}
              />
              <p className="text-xs mt-1">xs</p>
            </div>
            <div className="text-center">
              <BorderPreview
                border={demoBorders[0]}
                size="sm"
                showLabel={false}
              />
              <p className="text-xs mt-1">sm</p>
            </div>
            <div className="text-center">
              <BorderPreview
                border={demoBorders[0]}
                size="md"
                showLabel={false}
              />
              <p className="text-xs mt-1">md</p>
            </div>
            <div className="text-center">
              <BorderPreview
                border={demoBorders[0]}
                size="lg"
                showLabel={false}
              />
              <p className="text-xs mt-1">lg</p>
            </div>
            <div className="text-center">
              <BorderPreview
                border={demoBorders[0]}
                size="2xl"
                showLabel={false}
              />
              <p className="text-xs mt-1">xl</p>
            </div>
            <div className="text-center">
              <BorderPreview
                border={demoBorders[0]}
                size="2xl"
                showLabel={false}
              />
              <p className="text-xs mt-1">2xl</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}