import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { CartProvider } from "@/components/cart-provider"
import { SessionProviderWrapper } from "@/components/providers/session-provider"
import { NavigationProvider } from "@/components/providers/navigation-provider"
import { LoadingBar } from "@/components/ui/loading-bar"
import { PageLoading } from "@/components/ui/page-loading"
import { Toaster } from "@/components/ui/toaster"
import { ChatProvider } from "@/contexts/ChatContext"
import { FloatingChatProvider } from "@/components/chat/floating-chat-provider"
import { Suspense } from "react"

export const metadata: Metadata = {
  title: "HikariCha — Matcha Marketplace & Forum",
  description:
    "HikariCha: Jelajah matcha berkualitas, forum pecinta matcha, dan marketplace produk matcha. Responsif dan aksesibel.",
  generator: "v0.app",
  metadataBase: new URL("http://localhost:3000"),
  openGraph: {
    title: "HikariCha — Matcha Marketplace & Forum",
    description: "Jelajah matcha berkualitas, forum pecinta matcha, dan marketplace produk matcha.",
    url: "http://localhost:3000",
    siteName: "HikariCha",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "HikariCha — Matcha Marketplace & Forum",
    description: "Jelajah matcha berkualitas, forum pecinta matcha, dan marketplace produk matcha.",
  },
  icons: [{ rel: "icon", url: "/favicon.ico" }],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="id">
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 bg-primary text-primary-foreground px-3 py-2 rounded-md"
        >
          Lewati ke konten utama
        </a>
        <Suspense fallback={<div>Loading...</div>}>
          <SessionProviderWrapper>
            <NavigationProvider>
              <CartProvider>
                <ChatProvider>
                  <FloatingChatProvider>
                    <LoadingBar />
                    <PageLoading />
                    <SiteHeader />
                    <main id="main" className="min-h-[60vh]">
                      {children}
                    </main>
                    <SiteFooter />
                  </FloatingChatProvider>
                </ChatProvider>
              </CartProvider>
            </NavigationProvider>
          </SessionProviderWrapper>
        </Suspense>
        <Toaster />
        <Analytics />
      </body>
    </html>
  )
}
