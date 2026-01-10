"use client"

import type React from "react"
import { useState } from "react"
import { Scene } from "@/components/ui/hero-section"
import { createClient } from "@/lib/supabase/client"
import { useRouter, usePathname } from "next/navigation"
import { RollingQuotes } from "@/components/rolling-quotes"
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
  Download,
  Filter,
  Share2,
  Sparkles,
  Pencil,
  ImageIcon,
  LogOut,
  Layers,
} from "lucide-react"

interface DashboardContentProps {
  user: User
}

export function DashboardContent({ user }: DashboardContentProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/")
  }

  const navLinks = [
    {
      label: "Home",
      href: "/dashboard",
      icon: <Home className="w-5 h-5 flex-shrink-0" />,
    },
    {
      label: "Upload",
      href: "/upload",
      icon: <Upload className="w-5 h-5 flex-shrink-0" />,
    },
    {
      label: "Results",
      href: "/results",
      icon: <FolderOpen className="w-5 h-5 flex-shrink-0" />,
    },
    {
      label: "Analysis",
      href: "/analyze",
      icon: <BarChart2 className="w-5 h-5 flex-shrink-0" />,
    },
    {
      label: "Workspace",
      href: "/workspace",
      icon: <Layers className="w-5 h-5 flex-shrink-0" />,
    },
    {
      label: "Chat",
      href: "/chat",
      icon: <MessageSquare className="w-5 h-5 flex-shrink-0" />,
    },
    {
      label: "Settings",
      href: "/settings",
      icon: <Settings className="w-5 h-5 flex-shrink-0" />,
    },
  ]

  return (
    <main className="relative min-h-screen overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <Scene />
      </div>
      <div className="fixed inset-0 z-[5] bg-black/60" />

      <div className="relative z-10 min-h-screen">
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
                  animate={{
                    display: sidebarOpen ? "inline-block" : "none",
                    opacity: sidebarOpen ? 1 : 0,
                  }}
                  className="text-sm font-open-sans-custom whitespace-pre"
                >
                  Sign Out
                </motion.span>
              </button>
            </div>
          </SidebarBody>
        </AnimatedSidebar>

        <div className="md:ml-[70px] p-4 md:p-8 pt-16 md:pt-8 min-h-screen">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
              <div>
                <h1 className="text-2xl font-open-sans-custom text-white mb-2">
                  Welcome back, {user.email?.split("@")[0] || "User"}
                </h1>
                <p className="text-[#C0C0C0] font-open-sans-custom">Here's your audio analysis overview</p>
              </div>
              <button className="flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-[#00D4FF] to-[#7C3AED] text-white font-open-sans-custom text-sm hover:opacity-90 transition-opacity shadow-lg">
                <Download className="w-4 h-4" />
                Download Report
              </button>
            </div>

            {/* Dashboard Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Interactive Timeline */}
              <div className="lg:col-span-2 rounded-2xl border border-white/10 bg-[#1A1A1A]/80 backdrop-blur-sm p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                  <h3 className="text-white font-open-sans-custom font-semibold italic">Interactive Timeline</h3>
                  <div className="flex gap-2 flex-wrap">
                    <button className="px-3 py-1.5 rounded-lg border border-white/10 text-white text-xs font-open-sans-custom hover:bg-white/5 transition-colors flex items-center gap-1">
                      <Download className="w-3 h-3" /> Export Data
                    </button>
                    <button className="px-3 py-1.5 rounded-lg border border-white/10 text-white text-xs font-open-sans-custom hover:bg-white/5 transition-colors flex items-center gap-1">
                      <Share2 className="w-3 h-3" /> Share View
                    </button>
                    <button className="px-3 py-1.5 rounded-lg border border-white/10 text-white text-xs font-open-sans-custom hover:bg-white/5 transition-colors flex items-center gap-1">
                      <Filter className="w-3 h-3" /> Filter
                    </button>
                  </div>
                </div>

                {/* Waveform Visualization */}
                <div className="h-32 rounded-xl bg-[#0D0D0D] border border-white/10 flex items-center justify-center relative overflow-hidden">
                  <WaveformVisualization />
                </div>
              </div>

              {/* Dominance Chart */}
              <div className="rounded-2xl border border-white/10 bg-[#1A1A1A]/80 backdrop-blur-sm p-6">
                <h3 className="text-white font-open-sans-custom font-semibold mb-6">Dominance chart</h3>
                <div className="flex flex-col items-center">
                  <div className="relative w-32 h-32">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle cx="64" cy="64" r="56" stroke="rgba(255,255,255,0.1)" strokeWidth="12" fill="none" />
                      <circle
                        cx="64"
                        cy="64"
                        r="56"
                        stroke="url(#gradient)"
                        strokeWidth="12"
                        fill="none"
                        strokeDasharray="352"
                        strokeDashoffset="0"
                        strokeLinecap="round"
                      />
                      <defs>
                        <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#00D4FF" />
                          <stop offset="100%" stopColor="#7C3AED" />
                        </linearGradient>
                      </defs>
                    </svg>
                  </div>
                  <div className="mt-4 text-center">
                    <p className="text-white font-open-sans-custom font-semibold">Dominance</p>
                    <div className="flex justify-between text-xs text-[#C0C0C0] mt-2 w-full">
                      <span>All stano: 300</span>
                      <span>100%</span>
                    </div>
                    <div className="flex justify-between text-xs text-[#C0C0C0] w-full">
                      <span></span>
                      <span>High: 300</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Smart Transcript */}
              <div className="rounded-2xl border border-white/10 bg-[#1A1A1A]/80 backdrop-blur-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-white font-open-sans-custom font-semibold">Smart Transcript</h3>
                  <div className="flex gap-2">
                    <button className="px-3 py-1.5 rounded-lg border border-white/10 text-white text-xs font-open-sans-custom hover:bg-white/5 transition-colors">
                      Add Note
                    </button>
                    <button className="px-3 py-1.5 rounded-lg border border-white/10 text-white text-xs font-open-sans-custom hover:bg-white/5 transition-colors">
                      Print
                    </button>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="p-3 rounded-lg bg-[#0D0D0D] border border-white/10">
                    <p className="text-[#C0C0C0] text-sm font-open-sans-custom">
                      Hello, whether you and have prompts actione using project!
                    </p>
                    <p className="text-xs text-gray-500 mt-1">chat-300</p>
                  </div>
                  <div className="p-3 rounded-lg bg-[#0D0D0D] border border-white/10">
                    <p className="text-[#C0C0C0] text-sm font-open-sans-custom">
                      We're a the best to color design and tooks for you.
                    </p>
                    <p className="text-xs text-gray-500 mt-1">chat-300</p>
                  </div>
                </div>
              </div>

              {/* Magic Tools */}
              <div className="rounded-2xl border border-white/10 bg-[#1A1A1A]/80 backdrop-blur-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-white font-open-sans-custom font-semibold">Magic Tools</h3>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <ToolButton icon={Sparkles} label="Magic Tools" />
                  <ToolButton icon={Pencil} label="Edit Prompt" />
                  <ToolButton icon={ImageIcon} label="Find Images" />
                </div>
              </div>

              {/* AI Analyst */}
              <div className="rounded-2xl border border-white/10 bg-[#1A1A1A]/80 backdrop-blur-sm p-6">
                <h3 className="text-white font-open-sans-custom font-semibold mb-2">AI Analyst</h3>
                <p className="text-[#C0C0C0] text-sm font-open-sans-custom mb-4">
                  AI Analyst is a marn test development, in unents, to, you can accsam your Viinds, and more.
                </p>
                <div className="flex gap-2 mb-4">
                  <button className="px-3 py-1.5 rounded-lg border border-white/10 text-white text-xs font-open-sans-custom hover:bg-white/5 transition-colors">
                    View Full Report
                  </button>
                  <button className="px-3 py-1.5 rounded-lg border border-white/10 text-white text-xs font-open-sans-custom hover:bg-white/5 transition-colors">
                    Generate Insights
                  </button>
                </div>
                <div className="flex items-center gap-2 p-3 rounded-lg bg-[#0D0D0D] border border-white/10">
                  <input
                    type="text"
                    placeholder="Type your cot here..."
                    className="flex-1 bg-transparent text-[#C0C0C0] text-sm focus:outline-none font-open-sans-custom"
                  />
                  <button className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
                    <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M5 12h14M12 5l7 7-7 7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* Rolling Quote */}
            <div className="mt-8 p-6 rounded-2xl border border-white/10 bg-[#1A1A1A]/80 backdrop-blur-sm text-center">
              <RollingQuotes />
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

const Logo = () => {
  return (
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
}

const LogoIcon = () => {
  return (
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
}

function ToolButton({
  icon: Icon,
  label,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
}) {
  return (
    <button className="flex flex-col items-center gap-2 p-3 rounded-lg bg-[#0D0D0D] border border-white/10 hover:bg-white/5 transition-colors">
      <Icon className="w-5 h-5 text-white" />
      <span className="text-[#C0C0C0] text-xs font-open-sans-custom">{label}</span>
    </button>
  )
}

function WaveformVisualization() {
  return (
    <svg className="w-full h-full" viewBox="0 0 400 80" preserveAspectRatio="none">
      <defs>
        <linearGradient id="waveGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#00D4FF" stopOpacity="0.3" />
          <stop offset="50%" stopColor="#7C3AED" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#00D4FF" stopOpacity="0.3" />
        </linearGradient>
      </defs>
      <path
        d="M0,40 Q20,30 40,40 T80,40 T120,35 T160,45 T200,40 T240,38 T280,42 T320,40 T360,38 T400,40"
        stroke="url(#waveGradient)"
        strokeWidth="2"
        fill="none"
      />
      <path
        d="M0,40 Q20,50 40,40 T80,40 T120,45 T160,35 T200,40 T240,42 T280,38 T320,40 T360,42 T400,40"
        stroke="url(#waveGradient)"
        strokeWidth="2"
        fill="none"
      />
    </svg>
  )
}
