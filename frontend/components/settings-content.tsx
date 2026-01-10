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
  Moon,
  Sun,
  Globe,
  Bell,
  Shield,
  Key,
} from "lucide-react"

interface SettingsContentProps {
  user: User
}

export function SettingsContent({ user }: SettingsContentProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [darkMode, setDarkMode] = useState(true)
  const [notifications, setNotifications] = useState(true)

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
          <div className="max-w-3xl mx-auto">
            <div className="mb-8">
              <h1 className="text-2xl font-open-sans-custom text-white mb-2">Settings</h1>
              <p className="text-[#C0C0C0] font-open-sans-custom">Manage your preferences and account</p>
            </div>

            <div className="space-y-6">
              {/* Appearance */}
              <div className="rounded-2xl border border-white/10 bg-[#1A1A1A]/80 backdrop-blur-sm p-6">
                <h3 className="text-white font-open-sans-custom font-semibold mb-4 flex items-center gap-2">
                  {darkMode ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                  Appearance
                </h3>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white text-sm">Dark Mode</p>
                    <p className="text-[#C0C0C0] text-xs">Use dark theme throughout the app</p>
                  </div>
                  <button
                    onClick={() => setDarkMode(!darkMode)}
                    className={`w-12 h-6 rounded-full transition-colors ${darkMode ? "bg-[#00D4FF]" : "bg-white/20"}`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full bg-white transform transition-transform ${darkMode ? "translate-x-6" : "translate-x-0.5"}`}
                    />
                  </button>
                </div>
              </div>

              {/* Language */}
              <div className="rounded-2xl border border-white/10 bg-[#1A1A1A]/80 backdrop-blur-sm p-6">
                <h3 className="text-white font-open-sans-custom font-semibold mb-4 flex items-center gap-2">
                  <Globe className="w-5 h-5" />
                  Language & Translation
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-white text-sm block mb-2">Default Language</label>
                    <select className="w-full p-3 rounded-lg bg-[#0D0D0D] border border-white/10 text-white text-sm focus:outline-none">
                      <option>English</option>
                      <option>Spanish</option>
                      <option>French</option>
                      <option>German</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-white text-sm block mb-2">Translation Target</label>
                    <select className="w-full p-3 rounded-lg bg-[#0D0D0D] border border-white/10 text-white text-sm focus:outline-none">
                      <option>English</option>
                      <option>Spanish</option>
                      <option>French</option>
                      <option>German</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Notifications */}
              <div className="rounded-2xl border border-white/10 bg-[#1A1A1A]/80 backdrop-blur-sm p-6">
                <h3 className="text-white font-open-sans-custom font-semibold mb-4 flex items-center gap-2">
                  <Bell className="w-5 h-5" />
                  Notifications
                </h3>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white text-sm">Email Notifications</p>
                    <p className="text-[#C0C0C0] text-xs">Receive updates about processing status</p>
                  </div>
                  <button
                    onClick={() => setNotifications(!notifications)}
                    className={`w-12 h-6 rounded-full transition-colors ${notifications ? "bg-[#00D4FF]" : "bg-white/20"}`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full bg-white transform transition-transform ${notifications ? "translate-x-6" : "translate-x-0.5"}`}
                    />
                  </button>
                </div>
              </div>

              {/* Security */}
              <div className="rounded-2xl border border-white/10 bg-[#1A1A1A]/80 backdrop-blur-sm p-6">
                <h3 className="text-white font-open-sans-custom font-semibold mb-4 flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Security
                </h3>
                <div className="space-y-3">
                  <button className="w-full flex items-center justify-between p-3 rounded-lg bg-[#0D0D0D] border border-white/10 hover:bg-white/5 transition-colors">
                    <div className="flex items-center gap-3">
                      <Key className="w-5 h-5 text-[#C0C0C0]" />
                      <span className="text-white text-sm">Change Password</span>
                    </div>
                  </button>
                </div>
              </div>

              {/* Account Info */}
              <div className="rounded-2xl border border-white/10 bg-[#1A1A1A]/80 backdrop-blur-sm p-6">
                <h3 className="text-white font-open-sans-custom font-semibold mb-4">Account</h3>
                <div className="space-y-2">
                  <p className="text-[#C0C0C0] text-sm">Email: {user.email}</p>
                  <p className="text-[#C0C0C0] text-sm">User ID: {user.id.slice(0, 8)}...</p>
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
