"use client"

import type React from "react"

import { createClient } from "@/lib/supabase/client"
import { Scene } from "@/components/ui/hero-section"
import { RollingQuotes } from "@/components/rolling-quotes"
import { X } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { motion } from "framer-motion"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) throw error
      router.push("/dashboard")
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <Scene />
      </div>
      <div className="fixed inset-0 z-[5] bg-black/60" />

      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-4xl rounded-[24px] border border-white/10 bg-[#1A1A1A] overflow-hidden"
        >
          <div className="grid md:grid-cols-2">
            {/* Left side - Welcome */}
            <div className="p-8 md:p-12 flex flex-col justify-between border-r border-white/10">
              <div>
                <Link href="/" className="flex items-center gap-2 text-white mb-8">
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 32 32"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="text-white"
                  >
                    <rect x="2" y="12" width="3" height="8" rx="1.5" fill="currentColor" opacity="0.6" />
                    <rect x="7" y="8" width="3" height="16" rx="1.5" fill="currentColor" opacity="0.8" />
                    <rect x="12" y="4" width="3" height="24" rx="1.5" fill="currentColor" />
                    <rect x="17" y="8" width="3" height="16" rx="1.5" fill="currentColor" opacity="0.8" />
                    <rect x="22" y="10" width="3" height="12" rx="1.5" fill="currentColor" opacity="0.7" />
                    <rect x="27" y="13" width="3" height="6" rx="1.5" fill="currentColor" opacity="0.5" />
                  </svg>
                  <span className="text-lg font-open-sans-custom tracking-wider">DECIBEL</span>
                </Link>
                <h1 className="text-3xl md:text-4xl font-open-sans-custom text-white mb-4">Welcome Back</h1>
                <p className="text-[#C0C0C0] font-open-sans-custom leading-relaxed">
                  Sign in to continue analyzing your audio data and extracting actionable intelligence.
                </p>
              </div>

              <div className="mt-12 p-6 rounded-xl bg-white/5 border border-white/10">
                <RollingQuotes />
              </div>
            </div>

            {/* Right side - Form */}
            <div className="p-8 md:p-12 relative">
              <Link
                href="/"
                className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </Link>

              <h2 className="text-2xl font-open-sans-custom text-white mb-2">Sign in to your account</h2>
              <p className="text-[#C0C0C0] font-open-sans-custom mb-8">Enter your credentials below</p>

              <form onSubmit={handleLogin} className="space-y-6">
                <div>
                  <label className="block text-[#C0C0C0] font-open-sans-custom text-sm mb-2">Email address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full px-4 py-3 rounded-lg bg-[#0D0D0D] border border-white/10 text-[#C0C0C0] placeholder:text-gray-500 focus:outline-none focus:border-white/30 transition-colors font-open-sans-custom"
                    placeholder="you@company.com"
                  />
                </div>

                <div>
                  <label className="block text-[#C0C0C0] font-open-sans-custom text-sm mb-2">Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full px-4 py-3 rounded-lg bg-[#0D0D0D] border border-white/10 text-[#C0C0C0] placeholder:text-gray-500 focus:outline-none focus:border-white/30 transition-colors font-open-sans-custom"
                    placeholder="Enter your password"
                  />
                </div>

                {error && (
                  <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
                    <p className="text-sm text-red-400">{error}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 rounded-lg bg-white text-black font-open-sans-custom hover:bg-gray-100 transition-colors disabled:opacity-50"
                >
                  {isLoading ? "Signing in..." : "Sign In"}
                </button>

                <p className="text-center text-[#C0C0C0] text-sm font-open-sans-custom">
                  Don't have an account?{" "}
                  <Link href="/auth/sign-up" className="text-white hover:underline">
                    Sign up
                  </Link>
                </p>
              </form>
            </div>
          </div>
        </motion.div>
      </div>
    </main>
  )
}
