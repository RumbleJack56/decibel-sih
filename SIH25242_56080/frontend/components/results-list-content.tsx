"use client"

import { useState } from "react"
import { Scene } from "@/components/ui/hero-section"
import { createClient } from "@/lib/supabase/client"
import { useRouter, usePathname } from "next/navigation"
import type { User } from "@supabase/supabase-js"
import Link from "next/link"
import { AnimatedSidebar, SidebarBody, SidebarLink } from "@/components/ui/animated-sidebar"
import { motion } from "framer-motion"
import {
  Home,
  Upload,
  FolderOpen,
  BarChart2,
  MessageSquare,
  Settings,
  LogOut,
  Layers,
  FileAudio,
  Clock,
  Users,
  ArrowRight,
} from "lucide-react"

interface ResultsListContentProps {
  user: User
}

// Demo results data
const demoResults = [
  { id: "demo-job-123", name: "Team Meeting Recording.mp3", duration: "45:32", speakers: 4, date: "2024-01-15" },
  { id: "demo-job-124", name: "Customer Interview.wav", duration: "23:18", speakers: 2, date: "2024-01-14" },
  { id: "demo-job-125", name: "Podcast Episode 12.m4a", duration: "1:12:45", speakers: 3, date: "2024-01-12" },
]

export function ResultsListContent({ user }: ResultsListContentProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/")
  }

  const navLinks = [
    { label: "Home", href: "/dashboard", icon: <Home className="w-5 h-5 flex-shrink-0" /> },
    { label: "Upload", href: "/upload", icon: <Upload className="w-5 h-5 flex-shrink-0" /> },
    { label: "Results", href: "/results", icon: <FolderOpen className="w-5 h-5 flex-shrink-0" /> },
    { label: "Analysis", href: "/analyze", icon: <BarChart2 className="w-5 h-5 flex-shrink-0" /> },
    { label: "Workspace", href: "/workspace", icon: <Layers className="w-5 h-5 flex-shrink-0" /> },
    { label: "Chat", href: "/chat", icon: <MessageSquare className="w-5 h-5 flex-shrink-0" /> },
    { label: "Settings", href: "/settings", icon: <Settings className="w-5 h-5 flex-shrink-0" /> },
  ]

  return (
    <main className="relative min-h-screen overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <Scene />
      </div>
      <div className="fixed inset-0 z-[5] bg-black/60" />

      <div className="relative z-10 min-h-screen flex flex-col md:flex-row">
        <AnimatedSidebar open={sidebarOpen} setOpen={setSidebarOpen} animate={true}>
          <SidebarBody className="justify-between gap-10">
            <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
              {sidebarOpen ? <Logo /> : <LogoIcon />}
              <nav className="mt-8 flex flex-col gap-2">
                {navLinks.map((link, idx) => (
                  <SidebarLink key={idx} link={link} active={pathname === link.href} />
                ))}
              </nav>
            </div>
            <div>
              <button
                onClick={handleSignOut}
                className="flex items-center gap-3 px-3 py-3 rounded-lg text-[#C0C0C0] hover:bg-white/5 hover:text-white transition-colors w-full"
              >
                <LogOut className="w-5 h-5 flex-shrink-0" />
                <motion.span
                  animate={{ display: sidebarOpen ? "inline-block" : "none", opacity: sidebarOpen ? 1 : 0 }}
                  className="text-sm font-open-sans-custom whitespace-pre"
                >
                  Sign Out
                </motion.span>
              </button>
            </div>
          </SidebarBody>
        </AnimatedSidebar>

        <div className="flex-1 p-4 md:p-8 overflow-auto">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-2xl font-open-sans-custom text-white mb-2">Processed Results</h1>
                <p className="text-[#C0C0C0] font-open-sans-custom">View and analyze your processed audio files</p>
              </div>
              <Link
                href="/upload"
                className="flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-[#00D4FF] to-[#7C3AED] text-white font-open-sans-custom text-sm hover:opacity-90 transition-opacity"
              >
                <Upload className="w-4 h-4" />
                Upload New
              </Link>
            </div>

            {demoResults.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {demoResults.map((result) => (
                  <Link
                    key={result.id}
                    href={`/results/${result.id}`}
                    className="group rounded-2xl border border-white/10 bg-[#1A1A1A]/80 backdrop-blur-sm p-6 hover:border-[#00D4FF]/50 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <FileAudio className="w-10 h-10 text-[#00D4FF]" />
                      <ArrowRight className="w-5 h-5 text-[#C0C0C0] group-hover:text-[#00D4FF] transition-colors" />
                    </div>
                    <h3 className="text-white font-open-sans-custom font-semibold mb-2 truncate">{result.name}</h3>
                    <div className="flex items-center gap-4 text-[#C0C0C0] text-sm">
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" /> {result.duration}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-4 h-4" /> {result.speakers} speakers
                      </span>
                    </div>
                    <p className="text-gray-500 text-xs mt-2">{result.date}</p>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-white/10 bg-[#1A1A1A]/80 backdrop-blur-sm p-12 text-center">
                <FileAudio className="w-16 h-16 text-[#C0C0C0] mx-auto mb-4" />
                <h3 className="text-white font-open-sans-custom text-lg mb-2">No results yet</h3>
                <p className="text-[#C0C0C0] font-open-sans-custom mb-4">
                  Upload and process audio files to see results here
                </p>
                <Link
                  href="/upload"
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-[#00D4FF] to-[#7C3AED] text-white font-open-sans-custom text-sm hover:opacity-90 transition-opacity"
                >
                  <Upload className="w-4 h-4" />
                  Upload Audio
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}

const Logo = () => (
  <Link href="/dashboard" className="font-normal flex space-x-2 items-center text-sm text-white py-1 relative z-20">
    <svg
      width="24"
      height="24"
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="flex-shrink-0"
    >
      <rect x="2" y="12" width="3" height="8" rx="1.5" fill="currentColor" opacity="0.6" />
      <rect x="7" y="8" width="3" height="16" rx="1.5" fill="currentColor" opacity="0.8" />
      <rect x="12" y="4" width="3" height="24" rx="1.5" fill="currentColor" />
      <rect x="17" y="8" width="3" height="16" rx="1.5" fill="currentColor" opacity="0.8" />
      <rect x="22" y="10" width="3" height="12" rx="1.5" fill="currentColor" opacity="0.7" />
      <rect x="27" y="13" width="3" height="6" rx="1.5" fill="currentColor" opacity="0.5" />
    </svg>
    <motion.span
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="font-open-sans-custom text-lg tracking-wider text-white whitespace-pre"
    >
      DECIBEL
    </motion.span>
  </Link>
)

const LogoIcon = () => (
  <Link href="/dashboard" className="font-normal flex space-x-2 items-center text-sm text-white py-1 relative z-20">
    <svg
      width="24"
      height="24"
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="flex-shrink-0"
    >
      <rect x="2" y="12" width="3" height="8" rx="1.5" fill="currentColor" opacity="0.6" />
      <rect x="7" y="8" width="3" height="16" rx="1.5" fill="currentColor" opacity="0.8" />
      <rect x="12" y="4" width="3" height="24" rx="1.5" fill="currentColor" />
      <rect x="17" y="8" width="3" height="16" rx="1.5" fill="currentColor" opacity="0.8" />
      <rect x="22" y="10" width="3" height="12" rx="1.5" fill="currentColor" opacity="0.7" />
      <rect x="27" y="13" width="3" height="6" rx="1.5" fill="currentColor" opacity="0.5" />
    </svg>
  </Link>
)
