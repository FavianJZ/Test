"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Eye, EyeOff, ArrowLeft, Check, X, Shield } from "lucide-react"
import Link from "next/link"
import ReCAPTCHA from "react-google-recaptcha"

export default function RegisterPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [captchaValue, setCaptchaValue] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: ""
  })
  const [passwordErrors, setPasswordErrors] = useState<string[]>([])
  const router = useRouter()

  const validatePassword = (password: string) => {
    const errors = []
    if (password.length < 6) errors.push("Minimal 6 karakter")
    if (!/[A-Z]/.test(password)) errors.push("1 huruf besar")
    if (!/[a-z]/.test(password)) errors.push("1 huruf kecil")
    if (!/\d/.test(password)) errors.push("1 angka")
    setPasswordErrors(errors)
    return errors.length === 0
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))

    if (name === "password") {
      validatePassword(value)
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)

    const { name, email, password, confirmPassword } = formData

    if (password !== confirmPassword) {
      toast.error("Password tidak cocok")
      setIsLoading(false)
      return
    }

    if (!validatePassword(password)) {
      toast.error("Password tidak memenuhi syarat keamanan")
      setIsLoading(false)
      return
    }

    if (!captchaValue) {
      toast.error("Silakan lengkapi reCAPTCHA")
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          password,
          captchaToken: captchaValue,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        toast.error(data.error || "Registrasi gagal")
      } else {
        toast.success("Registrasi berhasil! Silakan login.")
        setCaptchaValue(null)
        setFormData({ name: "", email: "", password: "", confirmPassword: "" })
        setTimeout(() => {
          router.push("/auth/login")
        }, 1500)
      }
    } catch (error) {
      toast.error("Terjadi kesalahan saat registrasi")
    } finally {
      setIsLoading(false)
    }
  }

  const isFormValid = formData.name && formData.email &&
    formData.password === formData.confirmPassword &&
    passwordErrors.length === 0 && captchaValue

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-grid-black/[0.02] bg-[size:60px_60px]" />

      <div className="relative w-full max-w-md">
        {/* Back Button */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali ke Beranda
        </Link>

        <Card className="shadow-lg border bg-card">
          <CardHeader className="space-y-1 text-center">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-primary to-primary/80 rounded-md flex items-center justify-center mb-4 shadow-lg">
              <span className="text-primary-foreground text-2xl font-bold">H</span>
            </div>
            <CardTitle className="text-2xl font-bold text-foreground">
              Bergabung dengan HikariCha
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Buat akun baru Anda hari ini
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium text-foreground">
                  Nama Lengkap
                </Label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="h-11"
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-foreground">
                  Email
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="nama@example.com"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="h-11"
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-foreground">
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Minimal 6 karakter"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                    className="h-11 pr-10"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                    )}
                  </button>
                </div>

                {/* Password Requirements */}
                {formData.password && (
                  <div className="mt-2 space-y-1">
                    <div className="flex items-center gap-2 text-xs">
                      {formData.password.length >= 6 ? (
                        <Check className="h-3 w-3 text-green-500" />
                      ) : (
                        <X className="h-3 w-3 text-red-500" />
                      )}
                      <span className={formData.password.length >= 6 ? "text-green-600" : "text-red-600"}>
                        Minimal 6 karakter
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      {/[A-Z]/.test(formData.password) ? (
                        <Check className="h-3 w-3 text-green-500" />
                      ) : (
                        <X className="h-3 w-3 text-red-500" />
                      )}
                      <span className={/[A-Z]/.test(formData.password) ? "text-green-600" : "text-red-600"}>
                        1 huruf besar
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      {/[a-z]/.test(formData.password) ? (
                        <Check className="h-3 w-3 text-green-500" />
                      ) : (
                        <X className="h-3 w-3 text-red-500" />
                      )}
                      <span className={/[a-z]/.test(formData.password) ? "text-green-600" : "text-red-600"}>
                        1 huruf kecil
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      {/\d/.test(formData.password) ? (
                        <Check className="h-3 w-3 text-green-500" />
                      ) : (
                        <X className="h-3 w-3 text-red-500" />
                      )}
                      <span className={/\d/.test(formData.password) ? "text-green-600" : "text-red-600"}>
                        1 angka
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm font-medium text-foreground">
                  Konfirmasi Password
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Ulangi password"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    required
                    className="h-11 pr-10"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                    )}
                  </button>
                </div>
                {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                  <p className="text-xs text-destructive">Password tidak cocok</p>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-foreground flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Verifikasi Keamanan
                </Label>
                <div className="flex justify-center">
                  <ReCAPTCHA
                    sitekey="6LfLIeErAAAAACRRcYQYvLq584DjbTrNLOvoXreg"
                    onChange={(value) => setCaptchaValue(value)}
                    onExpired={() => setCaptchaValue(null)}
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-medium disabled:opacity-50"
                disabled={isLoading || !isFormValid}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Mendaftar...
                  </>
                ) : (
                  "Daftar Sekarang"
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Sudah punya akun?{" "}
                <Link
                  href="/auth/login"
                  className="font-medium text-primary hover:text-primary/80 transition-colors"
                >
                  Masuk
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}