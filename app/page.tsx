import Link from "next/link"
import Image from "next/image"
import type { Metadata } from "next"
import { ProductCard } from "@/components/product-card"
import { AdsRotator } from "@/components/ads-rotator"
import { Button } from "@/components/ui/button"

export const metadata: Metadata = {
  title: "HikariCha — Beranda",
  description: "Selamat datang di HikariCha. Temukan produk matcha, forum diskusi, dan profil Anda.",
}

const POPULAR = [
  { id: "p1", name: "Matcha Ceremonial Grade", price: 150000 },
  { id: "p2", name: "Matcha Latte Blend", price: 95000 },
  { id: "p3", name: "Whisk Bambu (Chasen)", price: 120000 },
]

export default function Page() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 space-y-12">
      <section className="grid md:grid-cols-2 gap-8 items-center">
        <div className="space-y-4">
          <h1 className="text-3xl md:text-4xl font-semibold text-balance">
            Nikmati Keanggunan Matcha bersama HikariCha
          </h1>
          <p className="text-muted-foreground leading-relaxed">
            Matcha kaya antioksidan, membantu fokus, dan menenangkan. Jelajahi produk pilihan, teknik seduh, serta tips
            kesehatan dari komunitas.
          </p>
          <div className="flex gap-3">
            <Link href="/marketplace">
              <Button>Belanja Sekarang</Button>
            </Link>
            <Link href="/forum">
              <Button variant="outline">Masuk Forum</Button>
            </Link>
          </div>
        </div>
        <Image
          src="/hero-matcha-banner.jpg"
          alt="Banner matcha dengan peralatan seduh"
          width={560}
          height={360}
          priority
          className="w-full h-auto rounded-lg border"
        />
      </section>

      <section aria-labelledby="popular" className="space-y-4">
        <h2 id="popular" className="text-xl font-semibold">
          Produk Populer
        </h2>
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
          {POPULAR.map((p) => (
            <ProductCard key={p.id} id={p.id} name={p.name} price={p.price} />
          ))}
        </div>
        <div>
          <Link href="/marketplace" className="underline">
            Lihat semua produk →
          </Link>
        </div>
      </section>

      <section aria-labelledby="ads" className="space-y-4">
        <h2 id="ads" className="text-xl font-semibold">
          Iklan Terkait Matcha
        </h2>
        <AdsRotator />
      </section>

      <section aria-labelledby="navsections" className="space-y-4">
        <h2 id="navsections" className="text-xl font-semibold">
          Jelajahi Komunitas
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="rounded-lg border p-4">
            <h3 className="font-medium">Forum Diskusi</h3>
            <p className="text-sm text-muted-foreground">Tanya jawab, resep, teknik seduh, dan ulasan produk.</p>
            <Link href="/forum" className="underline text-sm">
              Masuk forum →
            </Link>
          </div>
          <div className="rounded-lg border p-4">
            <h3 className="font-medium">Marketplace</h3>
            <p className="text-sm text-muted-foreground">Belanja dan jual produk matcha berkualitas.</p>
            <Link href="/marketplace" className="underline text-sm">
              Lihat marketplace →
            </Link>
          </div>
          <div className="rounded-lg border p-4">
            <h3 className="font-medium">Profil & Keanggotaan</h3>
            <p className="text-sm text-muted-foreground">
              Kelola profil Anda, tingkatkan membership, dan lihat pencapaian.
            </p>
            <Link href="/profile" className="underline text-sm">
              Ke profil →
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
