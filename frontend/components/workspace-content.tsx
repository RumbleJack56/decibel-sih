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
  CheckSquare,
  Square,
  GitCompare,
  FileText,
} from "lucide-react"

interface WorkspaceContentProps {
  user: User
}

const demoFiles = [
  { id: "1", name: "Team Meeting.mp3", speakers: 4, duration: "45:32" },
  { id: "2", name: "Customer Interview.wav", speakers: 2, duration: "23:18" },
  { id: "3", name: "Podcast Episode.m4a", speakers: 3, duration: "1:12:45" },
]

export function WorkspaceContent({ user }: WorkspaceContentProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<string[]>([])

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

  const toggleFile = (id: string) => {
    setSelectedFiles((prev) => (prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]))
  }

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
            <div className="mb-8">
              <h1 className="text-2xl font-open-sans-custom text-white mb-2">Multi-File Workspace</h1>
              <p className="text-[#C0C0C0] font-open-sans-custom">Compare transcripts and run cross-file analysis</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* File Selection */}
              <div className="lg:col-span-2 rounded-2xl border border-white/10 bg-[#1A1A1A]/80 backdrop-blur-sm p-6">
                <h3 className="text-white font-open-sans-custom font-semibold mb-4">Select Files to Compare</h3>
                <div className="space-y-2">
                  {demoFiles.map((file) => (
                    <button
                      key={file.id}
                      onClick={() => toggleFile(file.id)}
                      className={`w-full flex items-center gap-3 p-4 rounded-xl border transition-colors ${
                        selectedFiles.includes(file.id)
                          ? "border-[#00D4FF]/50 bg-[#00D4FF]/10"
                          : "border-white/10 bg-[#0D0D0D] hover:bg-white/5"
                      }`}
                    >
                      {selectedFiles.includes(file.id) ? (
                        <CheckSquare className="w-5 h-5 text-[#00D4FF]" />
                      ) : (
                        <Square className="w-5 h-5 text-[#C0C0C0]" />
                      )}
                      <FileAudio className="w-6 h-6 text-[#7C3AED]" />
                      <div className="flex-1 text-left">
                        <p className="text-white text-sm">{file.name}</p>
                        <p className="text-[#C0C0C0] text-xs">
                          {file.speakers} speakers · {file.duration}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="rounded-2xl border border-white/10 bg-[#1A1A1A]/80 backdrop-blur-sm p-6">
                <h3 className="text-white font-open-sans-custom font-semibold mb-4">Actions</h3>
                <p className="text-[#C0C0C0] text-sm mb-4">
                  {selectedFiles.length === 0
                    ? "Select files to enable comparison"
                    : `${selectedFiles.length} file(s) selected`}
                </p>
                <div className="space-y-3">
                  <button
                    disabled={selectedFiles.length < 2}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-[#00D4FF] to-[#7C3AED] text-white font-open-sans-custom text-sm hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <GitCompare className="w-4 h-4" />
                    Compare Files
                  </button>
                  <button
                    disabled={selectedFiles.length < 2}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-white/10 text-white font-open-sans-custom text-sm hover:bg-white/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <FileText className="w-4 h-4" />
                    Generate Report
                  </button>
                </div>
              </div>

              {/* Cross-File Q&A */}
              <div className="lg:col-span-3 rounded-2xl border border-white/10 bg-[#1A1A1A]/80 backdrop-blur-sm p-6">
                <h3 className="text-white font-open-sans-custom font-semibold mb-4">Cross-File Q&A</h3>
                <div className="flex items-center gap-2 p-3 rounded-lg bg-[#0D0D0D] border border-white/10">
                  <input
                    type="text"
                    placeholder="Ask a question across all selected files..."
                    className="flex-1 bg-transparent text-[#C0C0C0] text-sm focus:outline-none"
                    disabled={selectedFiles.length === 0}
                  />
                  <button
                    disabled={selectedFiles.length === 0}
                    className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#00D4FF] to-[#7C3AED] text-white text-sm disabled:opacity-50"
                  >
                    Ask
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
      viewBox="0 0 46 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="flex-shrink-0"
    >
      <rect x="2" y="16" width="6" height="16" rx="3" fill="currentColor" />
      <rect x="11" y="10" width="6" height="28" rx="3" fill="currentColor" />
      <rect x="20" y="4" width="6" height="40" rx="3" fill="currentColor" />
      <rect x="29" y="10" width="6" height="28" rx="3" fill="currentColor" />
      <rect x="38" y="16" width="6" height="16" rx="3" fill="currentColor" />
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
      viewBox="0 0 46 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="flex-shrink-0"
    >
      <rect x="2" y="16" width="6" height="16" rx="3" fill="currentColor" />
      <rect x="11" y="10" width="6" height="28" rx="3" fill="currentColor" />
      <rect x="20" y="4" width="6" height="40" rx="3" fill="currentColor" />
      <rect x="29" y="10" width="6" height="28" rx="3" fill="currentColor" />
      <rect x="38" y="16" width="6" height="16" rx="3" fill="currentColor" />
    </svg>
  </Link>
)
