"use client"

import type React from "react"

import { createContext, useContext, useMemo, useState } from "react"

type Item = { id: string; name: string; price: number; qty: number }
type CartContextValue = {
  items: Item[]
  count: number
  add: (item: Omit<Item, "qty">) => void
}

const CartContext = createContext<CartContextValue | null>(null)

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<Item[]>([])
  const add = (item: Omit<Item, "qty">) =>
    setItems((prev) => {
      const idx = prev.findIndex((p) => p.id === item.id)
      if (idx >= 0) {
        const copy = [...prev]
        copy[idx] = { ...copy[idx], qty: copy[idx].qty + 1 }
        return copy
      }
      return [...prev, { ...item, qty: 1 }]
    })
  const value = useMemo(() => ({ items, count: items.reduce((s, i) => s + i.qty, 0), add }), [items])
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error("useCart must be used within CartProvider")
  return ctx
}
