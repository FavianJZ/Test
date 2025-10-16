import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Masuk | HikariCha",
  description: "Masuk ke akun HikariCha Anda",
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen">
      {children}
    </div>
  )
}