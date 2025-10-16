"use client"

import { useMemo, useState } from "react"
import { ProductCard } from "@/components/product-card"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"

type Item = {
  id: string
  name: string
  price: number
  category: "teh" | "alat" | "paket"
}

const ITEMS: Item[] = [
  { id: "m1", name: "Ceremonial Matcha", price: 150000, category: "teh" },
  { id: "m2", name: "Premium Culinary Matcha", price: 110000, category: "teh" },
  { id: "m3", name: "Whisk (Chasen)", price: 120000, category: "alat" },
  { id: "m4", name: "Sendok Bambu (Chashaku)", price: 45000, category: "alat" },
  { id: "m5", name: "Starter Pack Matcha", price: 230000, category: "paket" },
]

export default function MarketplacePage() {
  const [cat, setCat] = useState<"all" | Item["category"]>("all")
  const [max, setMax] = useState(300000)

  const filtered = useMemo(() => {
    return ITEMS.filter((i) => (cat === "all" || i.category === cat) && i.price <= max)
  }, [cat, max])

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 space-y-8">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">Marketplace</h1>
        <p className="text-sm text-muted-foreground">Belanja produk matcha: teh, alat seduh, dan paket.</p>
        <div role="status" aria-live="polite" className="text-xs text-muted-foreground">
          Catatan: Checkout dinonaktifkan sampai integrasi Stripe diaktifkan.
        </div>
      </header>

      <section aria-labelledby="filters" className="rounded-lg border p-4 space-y-4">
        <h2 id="filters" className="font-medium">
          Filter
        </h2>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="flex items-center gap-2">
            <Button
              variant={cat === "all" ? "default" : "outline"}
              onClick={() => setCat("all")}
              aria-pressed={cat === "all"}
            >
              Semua
            </Button>
            <Button
              variant={cat === "teh" ? "default" : "outline"}
              onClick={() => setCat("teh")}
              aria-pressed={cat === "teh"}
            >
              Teh
            </Button>
            <Button
              variant={cat === "alat" ? "default" : "outline"}
              onClick={() => setCat("alat")}
              aria-pressed={cat === "alat"}
            >
              Alat
            </Button>
            <Button
              variant={cat === "paket" ? "default" : "outline"}
              onClick={() => setCat("paket")}
              aria-pressed={cat === "paket"}
            >
              Paket
            </Button>
          </div>
          <div className="md:col-span-2">
            <Label htmlFor="price">Harga maksimal: Rp{max.toLocaleString("id-ID")}</Label>
            <Slider
              id="price"
              value={[max]}
              min={50000}
              max={500000}
              step={5000}
              onValueChange={(v) => setMax(v[0] ?? max)}
              className="mt-2"
              aria-label="Filter harga maksimal"
            />
          </div>
        </div>
      </section>

      <section aria-labelledby="list" className="space-y-4">
        <h2 id="list" className="text-xl font-semibold">
          Produk
        </h2>
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
          {filtered.map((p) => (
            <ProductCard key={p.id} id={p.id} name={p.name} price={p.price} />
          ))}
        </div>
      </section>

      <section id="cart" className="rounded-lg border p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-medium">Keranjang</h2>
            <p className="text-sm text-muted-foreground">Checkout akan aktif setelah integrasi Stripe dipasang.</p>
          </div>
          <Button disabled aria-disabled className="cursor-not-allowed">
            Checkout (nonaktif)
          </Button>
        </div>
      </section>
    </div>
  )
}
