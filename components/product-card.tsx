"use client"

import Image from "next/image"
import { Button } from "@/components/ui/button"
import { useCart } from "@/components/cart-provider"

type Props = {
  id: string
  name: string
  price: number
  imageAlt?: string
}

export function ProductCard({ id, name, price, imageAlt }: Props) {
  const { add } = useCart()
  return (
    <div className="rounded-lg border overflow-hidden bg-card">
      <Image
        src={`/placeholder.jpg?height=180&width=320`}
        alt={imageAlt || `Gambar produk ${name}`}
        width={320}
        height={180}
        className="w-full h-auto"
        priority={false}
      />
      <div className="p-4 flex items-center justify-between gap-3">
        <div>
          <h3 className="font-medium text-pretty">{name}</h3>
          <p className="text-sm text-muted-foreground">Rp{price.toLocaleString("id-ID")}</p>
        </div>
        <Button aria-label={`Tambah ${name} ke keranjang`} onClick={() => add({ id, name, price })}>
          Tambah
        </Button>
      </div>
    </div>
  )
}
