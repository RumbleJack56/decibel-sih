"use client"
import { useState, useEffect } from "react"
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
  Play,
  CheckSquare,
  Square,
} from "lucide-react"

interface UploadConfirmContentProps {
  user: User
}

interface StoredFile {
  id: string
  name: string
  size: number
  type: string
}

export function UploadConfirmContent({ user }: UploadConfirmContentProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [files, setFiles] = useState<StoredFile[]>([])
  const [options, setOptions] = useState({
    diarization: true,
    transcription: true,
    translation: false,
    audioEvents: true,
    enhancedAnalysis: false,
  })

  useEffect(() => {
    const stored = sessionStorage.getItem("uploadFiles")
    if (stored) {
      setFiles(JSON.parse(stored))
    } else {
      router.push("/upload")
    }
  }, [router])

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

  const toggleOption = (key: keyof typeof options) => {
    setOptions((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const handleStartProcessing = () => {
    sessionStorage.setItem("processingOptions", JSON.stringify(options))
    router.push("/processing")
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B"
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB"
    return (bytes / (1024 * 1024)).toFixed(1) + " MB"
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
          <div className="max-w-4xl mx-auto">
            <div className="mb-8">
              <h1 className="text-2xl font-open-sans-custom text-white mb-2">Confirm Processing Options</h1>
              <p className="text-[#C0C0C0] font-open-sans-custom">Review your files and select processing options</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Files */}
              <div className="rounded-2xl border border-white/10 bg-[#1A1A1A]/80 backdrop-blur-sm p-6">
                <h3 className="text-white font-open-sans-custom font-semibold mb-4">
                  Files to Process ({files.length})
                </h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {files.map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center gap-3 p-3 rounded-lg bg-[#0D0D0D] border border-white/10"
                    >
                      <FileAudio className="w-6 h-6 text-[#00D4FF]" />
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-open-sans-custom text-sm truncate">{file.name}</p>
                        <p className="text-[#C0C0C0] text-xs">{formatFileSize(file.size)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Options */}
              <div className="rounded-2xl border border-white/10 bg-[#1A1A1A]/80 backdrop-blur-sm p-6">
                <h3 className="text-white font-open-sans-custom font-semibold mb-4">Processing Options</h3>
                <div className="space-y-3">
                  {[
                    { key: "diarization", label: "Speaker Diarization", desc: "Identify different speakers" },
                    { key: "transcription", label: "Transcription", desc: "Convert speech to text" },
                    { key: "translation", label: "Translation", desc: "Translate to English" },
                    { key: "audioEvents", label: "Audio Events", desc: "Detect non-speech sounds" },
                    { key: "enhancedAnalysis", label: "Enhanced Analysis", desc: "AI-powered insights" },
                  ].map((opt) => (
                    <button
                      key={opt.key}
                      onClick={() => toggleOption(opt.key as keyof typeof options)}
                      className="w-full flex items-center gap-3 p-3 rounded-lg bg-[#0D0D0D] border border-white/10 hover:bg-white/5 transition-colors text-left"
                    >
                      {options[opt.key as keyof typeof options] ? (
                        <CheckSquare className="w-5 h-5 text-[#00D4FF]" />
                      ) : (
                        <Square className="w-5 h-5 text-[#C0C0C0]" />
                      )}
                      <div>
                        <p className="text-white font-open-sans-custom text-sm">{opt.label}</p>
                        <p className="text-[#C0C0C0] text-xs">{opt.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={handleStartProcessing}
              className="mt-6 w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-gradient-to-r from-[#00D4FF] to-[#7C3AED] text-white font-open-sans-custom hover:opacity-90 transition-opacity"
            >
              <Play className="w-5 h-5" />
              Start Processing
            </button>
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
