import Link from "next/link"

export function SiteFooter() {
  return (
    <footer className="border-t bg-secondary">
      <div className="mx-auto max-w-6xl px-4 py-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <h2 className="text-sm font-medium">HikariCha</h2>
          <p className="text-sm text-muted-foreground">{"Komunitas & marketplace matcha."}</p>
        </div>
        <nav aria-label="Footer" className="flex gap-6 text-sm">
          <Link className="hover:underline" href="/forum">
            Forum
          </Link>
          <Link className="hover:underline" href="/marketplace">
            Marketplace
          </Link>
          <Link className="hover:underline" href="/profile">
            Profil
          </Link>
        </nav>
        <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} HikariCha.</p>
      </div>
    </footer>
  )
}
