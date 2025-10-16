"use client"

import Image from "next/image"
import { useEffect, useState } from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"

type Ad = { id: string; title: string; href: string; alt: string }

const DEFAULT_ADS: Ad[] = [
  {
    id: "ad1",
    title: "Matcha Whisk Premium",
    href: "/marketplace",
    alt: "Iklan whisk matcha",
  },
  {
    id: "ad2",
    title: "Cangkir Keramik Jepang",
    href: "/marketplace",
    alt: "Iklan cangkir keramik Jepang",
  },
  {
    id: "ad3",
    title: "Set Starter Matcha",
    href: "/marketplace",
    alt: "Iklan set starter matcha",
  },
]

export function AdsRotator({ ads = DEFAULT_ADS }: { ads?: Ad[] }) {
  const [index, setIndex] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setIndex((i) => (i + 1) % ads.length), 4000)
    return () => clearInterval(id)
  }, [ads.length])

  return (
    <aside aria-label="Iklan" className="w-full">
      <div className="relative overflow-hidden rounded-lg border">
        {ads.map((ad, i) => (
          <Link
            key={ad.id}
            href={ad.href}
            className={cn(
              "grid grid-cols-1 md:grid-cols-[220px_1fr] items-center gap-4 p-4 transition-opacity",
              i === index ? "opacity-100" : "opacity-0 pointer-events-none absolute inset-0",
            )}
            aria-hidden={i !== index}
            tabIndex={i === index ? 0 : -1}
          >
            <Image
              src={`/.jpg?height=160&width=220&query=${encodeURIComponent(ad.title)}`}
              alt={ad.alt}
              width={220}
              height={160}
              className="w-full h-auto"
            />
            <div>
              <h3 className="font-medium">{ad.title}</h3>
              <p className="text-sm text-muted-foreground">Penawaran terkait matcha. Klik untuk lihat detail.</p>
            </div>
          </Link>
        ))}
      </div>
    </aside>
  )
}
