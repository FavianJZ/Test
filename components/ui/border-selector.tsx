"use client"

import { BorderPreview } from "./border-preview"
import { cn } from "@/lib/utils"

interface Border {
  id: string
  name: string
  imageUrl: string
  unlocked: boolean
  rarity?: "COMMON" | "RARE" | "EPIC" | "LEGENDARY"
  price?: number | null
}

interface BorderSelectorProps {
  borders: Border[]
  selectedBorder: string
  onSelect: (borderId: string) => void
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl"
  columns?: number
  showRarity?: boolean
  className?: string
}

export function BorderSelector({
  borders,
  selectedBorder,
  onSelect,
  size = "md",
  columns = 3,
  showRarity = false,
  className = ""
}: BorderSelectorProps) {
  return (
    <div className={cn(
      `grid gap-3`,
      columns === 2 && "grid-cols-2",
      columns === 3 && "grid-cols-3",
      columns === 4 && "grid-cols-4",
      columns === 5 && "grid-cols-5",
      columns === 6 && "grid-cols-6",
      className
    )}>
      {borders.map((border) => (
        <BorderPreview
          key={border.id}
          border={border}
          size={size}
          isSelected={selectedBorder === border.id}
          onClick={() => onSelect(border.id)}
          showRarity={showRarity}
          className={cn(
            "p-2 rounded-lg border-2 transition-all hover:scale-105",
            selectedBorder === border.id
              ? "border-primary bg-primary/5"
              : border.unlocked
              ? "border-muted hover:border-muted-foreground/20"
              : "border-muted/50 opacity-60"
          )}
        />
      ))}
    </div>
  )
}