"use client"

import { Button } from "@/components/ui/button"
import Link from "next/link"

export function FloatingNavbar() {
  const scrollToSection = (sectionId: string) => {
    const section = document.getElementById(sectionId)
    if (section) {
      section.scrollIntoView({ behavior: "smooth", block: "start" })
    }
  }

  return (
    <nav className="fixed left-0 right-0 top-0 z-50 px-4 py-4">
      <div className="mx-auto max-w-7xl rounded-2xl border-2 border-white/10 bg-white/5 px-6 py-4 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="cursor-pointer">
            <div className="flex items-center gap-2 text-white [text-shadow:_0_2px_8px_rgb(0_0_0_/_40%)]">
              <svg
                width="32"
                height="32"
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
              <span className="text-xl font-open-sans-custom tracking-wider">DECIBEL</span>
            </div>
          </Link>

          {/* Navigation Links */}
          <div className="hidden items-center gap-8 md:flex">
            <button
              onClick={() => scrollToSection("features")}
              className="text-sm font-open-sans-custom text-gray-300 transition-colors hover:text-white [text-shadow:_0_2px_6px_rgb(0_0_0_/_40%)]"
            >
              Features
            </button>
            <button
              onClick={() => scrollToSection("technology")}
              className="text-sm font-open-sans-custom text-gray-300 transition-colors hover:text-white [text-shadow:_0_2px_6px_rgb(0_0_0_/_40%)]"
            >
              Technology
            </button>
            <Link
              href="/documentation"
              className="text-sm font-open-sans-custom text-gray-300 transition-colors hover:text-white [text-shadow:_0_2px_6px_rgb(0_0_0_/_40%)]"
            >
              Documentation
            </Link>
            <button
              onClick={() => scrollToSection("signup")}
              className="text-sm font-open-sans-custom text-gray-300 transition-colors hover:text-white [text-shadow:_0_2px_6px_rgb(0_0_0_/_40%)]"
            >
              Contact
            </button>
          </div>

          {/* CTA Button - Always show Dashboard */}
          <Link href="/dashboard">
            <Button
              size="sm"
              className="bg-white text-black hover:bg-gray-100 [text-shadow:_0_1px_2px_rgb(0_0_0_/_10%)] font-open-sans-custom"
            >
              Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </nav>
  )
}
