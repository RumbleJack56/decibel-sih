"use client"

import type React from "react"
import { useState, useCallback } from "react"
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
  X,
  CheckCircle,
} from "lucide-react"

interface UploadContentProps {
  user: User
}

interface UploadedFile {
  id: string
  name: string
  size: number
  type: string
  file: File
}

export function UploadContent({ user }: UploadContentProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [isDragging, setIsDragging] = useState(false)

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

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const droppedFiles = Array.from(e.dataTransfer.files).filter((file) => file.type.startsWith("audio/"))
    addFiles(droppedFiles)
  }, [])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files)
      addFiles(selectedFiles)
    }
  }

  const addFiles = (newFiles: File[]) => {
    const uploadedFiles: UploadedFile[] = newFiles.map((file) => ({
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      size: file.size,
      type: file.type,
      file,
    }))
    setFiles((prev) => [...prev, ...uploadedFiles])
  }

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id))
  }

  const handleContinue = () => {
    if (files.length > 0) {
      sessionStorage.setItem(
        "uploadFiles",
        JSON.stringify(
          files.map((f) => ({
            id: f.id,
            name: f.name,
            size: f.size,
            type: f.type,
          })),
        ),
      )
      router.push("/upload/confirm")
    }
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
              <h1 className="text-2xl font-open-sans-custom text-white mb-2">Upload Audio Files</h1>
              <p className="text-[#C0C0C0] font-open-sans-custom">Drag and drop your audio files or click to browse</p>
            </div>

            {/* Drop Zone */}
            <div
              onDrop={handleDrop}
              onDragOver={(e) => {
                e.preventDefault()
                setIsDragging(true)
              }}
              onDragLeave={() => setIsDragging(false)}
              className={`relative rounded-2xl border-2 border-dashed p-12 text-center transition-colors ${
                isDragging
                  ? "border-[#00D4FF] bg-[#00D4FF]/10"
                  : "border-white/20 bg-[#1A1A1A]/80 hover:border-white/40"
              }`}
            >
              <input
                type="file"
                accept="audio/*"
                multiple
                onChange={handleFileSelect}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <FileAudio className="w-16 h-16 text-[#C0C0C0] mx-auto mb-4" />
              <p className="text-white font-open-sans-custom text-lg mb-2">Drop your audio files here</p>
              <p className="text-[#C0C0C0] font-open-sans-custom text-sm">Supports MP3, WAV, M4A, FLAC, and more</p>
            </div>

            {/* File List */}
            {files.length > 0 && (
              <div className="mt-8 space-y-4">
                <h3 className="text-white font-open-sans-custom font-semibold">Selected Files ({files.length})</h3>
                <div className="space-y-2">
                  {files.map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center justify-between p-4 rounded-xl bg-[#1A1A1A]/80 border border-white/10"
                    >
                      <div className="flex items-center gap-3">
                        <FileAudio className="w-8 h-8 text-[#00D4FF]" />
                        <div>
                          <p className="text-white font-open-sans-custom text-sm">{file.name}</p>
                          <p className="text-[#C0C0C0] text-xs">{formatFileSize(file.size)}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => removeFile(file.id)}
                        className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                      >
                        <X className="w-4 h-4 text-[#C0C0C0]" />
                      </button>
                    </div>
                  ))}
                </div>

                <button
                  onClick={handleContinue}
                  className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-gradient-to-r from-[#00D4FF] to-[#7C3AED] text-white font-open-sans-custom hover:opacity-90 transition-opacity"
                >
                  <CheckCircle className="w-5 h-5" />
                  Continue to Processing Options
                </button>
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
