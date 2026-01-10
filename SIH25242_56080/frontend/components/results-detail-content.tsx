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
  Download,
  Share2,
  Filter,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  ArrowLeft,
  Users,
} from "lucide-react"

interface ResultsDetailContentProps {
  user: User
  jobId: string
}

// Demo transcript data
const demoTranscript = [
  { id: 1, speaker: "Speaker 1", text: "Hello, whether you and have prompts actione using project!", time: "00:00" },
  { id: 2, speaker: "Speaker 2", text: "We're a the best to color design and tooks for you.", time: "00:15" },
  { id: 3, speaker: "Speaker 1", text: "That sounds great! Let me show you what we can do.", time: "00:32" },
]

export function ResultsDetailContent({ user, jobId }: ResultsDetailContentProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)

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
                  <SidebarLink
                    key={idx}
                    link={link}
                    active={pathname.startsWith(link.href) && link.href !== "/dashboard"}
                  />
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
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
              <div className="flex items-center gap-4">
                <Link href="/results" className="p-2 rounded-lg hover:bg-white/10 transition-colors">
                  <ArrowLeft className="w-5 h-5 text-white" />
                </Link>
                <div>
                  <h1 className="text-xl font-open-sans-custom text-white">Team Meeting Recording.mp3</h1>
                  <p className="text-[#C0C0C0] text-sm">Job ID: {jobId}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#00D4FF] to-[#7C3AED] text-white font-open-sans-custom text-sm hover:opacity-90 transition-opacity">
                  <Download className="w-4 h-4" />
                  Export PDF
                </button>
              </div>
            </div>

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

                {/* Waveform */}
                <div className="h-24 rounded-xl bg-[#0D0D0D] border border-white/10 mb-4 overflow-hidden">
                  <svg className="w-full h-full" viewBox="0 0 400 60" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="waveGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#00D4FF" stopOpacity="0.5" />
                        <stop offset="50%" stopColor="#7C3AED" stopOpacity="0.7" />
                        <stop offset="100%" stopColor="#00D4FF" stopOpacity="0.5" />
                      </linearGradient>
                    </defs>
                    <path
                      d="M0,30 Q20,20 40,30 T80,30 T120,25 T160,35 T200,30 T240,28 T280,32 T320,30 T360,28 T400,30"
                      stroke="url(#waveGrad)"
                      strokeWidth="2"
                      fill="none"
                    />
                  </svg>
                </div>

                {/* Playback Controls */}
                <div className="flex items-center justify-center gap-4">
                  <button className="p-2 rounded-lg hover:bg-white/10 transition-colors">
                    <SkipBack className="w-5 h-5 text-white" />
                  </button>
                  <button
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="w-12 h-12 rounded-full bg-gradient-to-r from-[#00D4FF] to-[#7C3AED] flex items-center justify-center hover:opacity-90 transition-opacity"
                  >
                    {isPlaying ? (
                      <Pause className="w-5 h-5 text-white" />
                    ) : (
                      <Play className="w-5 h-5 text-white ml-0.5" />
                    )}
                  </button>
                  <button className="p-2 rounded-lg hover:bg-white/10 transition-colors">
                    <SkipForward className="w-5 h-5 text-white" />
                  </button>
                  <button className="p-2 rounded-lg hover:bg-white/10 transition-colors">
                    <Volume2 className="w-5 h-5 text-white" />
                  </button>
                </div>
              </div>

              {/* Dominance Chart */}
              <div className="rounded-2xl border border-white/10 bg-[#1A1A1A]/80 backdrop-blur-sm p-6">
                <h3 className="text-white font-open-sans-custom font-semibold mb-4">Speaker Dominance</h3>
                <div className="flex flex-col items-center">
                  <div className="relative w-28 h-28">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle cx="56" cy="56" r="48" stroke="rgba(255,255,255,0.1)" strokeWidth="10" fill="none" />
                      <circle
                        cx="56"
                        cy="56"
                        r="48"
                        stroke="url(#domGrad)"
                        strokeWidth="10"
                        fill="none"
                        strokeDasharray="302"
                        strokeDashoffset="0"
                        strokeLinecap="round"
                      />
                      <defs>
                        <linearGradient id="domGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#00D4FF" />
                          <stop offset="100%" stopColor="#7C3AED" />
                        </linearGradient>
                      </defs>
                    </svg>
                  </div>
                  <div className="mt-4 w-full space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-[#C0C0C0]">Speaker 1</span>
                      <span className="text-white">45%</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-[#C0C0C0]">Speaker 2</span>
                      <span className="text-white">35%</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-[#C0C0C0]">Speaker 3</span>
                      <span className="text-white">20%</span>
                    </div>
                  </div>
                </div>
                <Link
                  href={`/results/${jobId}/speaker/speaker-1`}
                  className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-white/10 text-white text-sm hover:bg-white/5 transition-colors"
                >
                  <Users className="w-4 h-4" />
                  View Speakers
                </Link>
              </div>

              {/* Smart Transcript */}
              <div className="lg:col-span-2 rounded-2xl border border-white/10 bg-[#1A1A1A]/80 backdrop-blur-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-white font-open-sans-custom font-semibold">Smart Transcript</h3>
                  <div className="flex gap-2">
                    <button className="px-3 py-1.5 rounded-lg border border-white/10 text-white text-xs hover:bg-white/5">
                      Add Note
                    </button>
                    <button className="px-3 py-1.5 rounded-lg border border-white/10 text-white text-xs hover:bg-white/5">
                      Print
                    </button>
                  </div>
                </div>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {demoTranscript.map((item) => (
                    <div key={item.id} className="p-3 rounded-lg bg-[#0D0D0D] border border-white/10">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[#00D4FF] text-xs font-semibold">{item.speaker}</span>
                        <span className="text-gray-500 text-xs">{item.time}</span>
                      </div>
                      <p className="text-[#C0C0C0] text-sm">{item.text}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* AI Analyst */}
              <div className="rounded-2xl border border-white/10 bg-[#1A1A1A]/80 backdrop-blur-sm p-6">
                <h3 className="text-white font-open-sans-custom font-semibold mb-2">AI Analyst</h3>
                <p className="text-[#C0C0C0] text-sm mb-4">Ask questions about this recording</p>
                <div className="flex gap-2 mb-4 flex-wrap">
                  <button className="px-3 py-1.5 rounded-lg border border-white/10 text-white text-xs hover:bg-white/5">
                    Summarize
                  </button>
                  <button className="px-3 py-1.5 rounded-lg border border-white/10 text-white text-xs hover:bg-white/5">
                    Key Topics
                  </button>
                </div>
                <div className="flex items-center gap-2 p-3 rounded-lg bg-[#0D0D0D] border border-white/10">
                  <input
                    type="text"
                    placeholder="Ask anything..."
                    className="flex-1 bg-transparent text-[#C0C0C0] text-sm focus:outline-none"
                  />
                  <button className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20">
                    <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M5 12h14M12 5l7 7-7 7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
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
