"use client"

import { Scene } from "@/components/ui/hero-section"
import Link from "next/link"
import { CheckCircle } from "lucide-react"

export default function SignUpSuccessPage() {
  return (
    <main className="relative min-h-screen overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <Scene />
      </div>
      <div className="fixed inset-0 z-[5] bg-black/60" />

      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-[24px] border border-white/10 bg-[#1A1A1A] overflow-hidden p-8 md:p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8 text-green-400" />
          </div>
          <h1 className="text-2xl md:text-3xl font-open-sans-custom text-white mb-4">Thank you for signing up!</h1>
          <p className="text-[#C0C0C0] font-open-sans-custom mb-8">
            Please check your email to confirm your account before signing in.
          </p>
          <Link
            href="/auth/login"
            className="inline-block px-8 py-3 rounded-lg bg-white text-black font-open-sans-custom hover:bg-gray-100 transition-colors"
          >
            Back to Login
          </Link>
        </div>
      </div>
    </main>
  )
}
