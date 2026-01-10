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
  Send,
  UserIcon,
  Bot,
} from "lucide-react"

interface ChatContentProps {
  user: User
}

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
}

const suggestedQuestions = [
  "Summarize the key points from the meeting",
  "Who spoke the most in the recording?",
  "What action items were discussed?",
  "Identify the main topics covered",
]

export function ChatContent({ user }: ChatContentProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [input, setInput] = useState("")
  const [messages, setMessages] = useState<Message[]>([])

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

  const handleSend = () => {
    if (!input.trim()) return

    const userMessage: Message = { id: Date.now().toString(), role: "user", content: input }
    setMessages((prev) => [...prev, userMessage])

    // Simulate AI response
    setTimeout(() => {
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content:
          "I understand you're asking about audio analysis. This is a demo response. In production, this would connect to an AI backend to provide intelligent answers about your processed audio files.",
      }
      setMessages((prev) => [...prev, aiMessage])
    }, 1000)

    setInput("")
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

        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="p-4 md:p-6 border-b border-white/10">
            <h1 className="text-xl font-open-sans-custom text-white">AI Chat Assistant</h1>
            <p className="text-[#C0C0C0] text-sm">Ask questions about your audio files</p>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
            {messages.length === 0 ? (
              <div className="text-center py-12">
                <Bot className="w-16 h-16 text-[#7C3AED] mx-auto mb-4" />
                <h3 className="text-white font-open-sans-custom text-lg mb-2">Start a Conversation</h3>
                <p className="text-[#C0C0C0] text-sm mb-6">Ask me anything about your processed audio files</p>
                <div className="flex flex-wrap justify-center gap-2">
                  {suggestedQuestions.map((q, idx) => (
                    <button
                      key={idx}
                      onClick={() => setInput(q)}
                      className="px-4 py-2 rounded-full border border-white/10 text-[#C0C0C0] text-sm hover:bg-white/5 hover:text-white transition-colors"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((msg) => (
                <div key={msg.id} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  {msg.role === "assistant" && (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#00D4FF] to-[#7C3AED] flex items-center justify-center flex-shrink-0">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                  )}
                  <div
                    className={`max-w-[70%] p-4 rounded-2xl ${
                      msg.role === "user"
                        ? "bg-gradient-to-r from-[#00D4FF] to-[#7C3AED] text-white"
                        : "bg-[#1A1A1A]/80 border border-white/10 text-[#C0C0C0]"
                    }`}
                  >
                    <p className="text-sm">{msg.content}</p>
                  </div>
                  {msg.role === "user" && (
                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                      <UserIcon className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Input */}
          <div className="p-4 md:p-6 border-t border-white/10">
            <div className="flex items-center gap-2 p-3 rounded-xl bg-[#1A1A1A]/80 border border-white/10">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder="Type your message..."
                className="flex-1 bg-transparent text-white text-sm focus:outline-none"
              />
              <button
                onClick={handleSend}
                className="p-2 rounded-lg bg-gradient-to-r from-[#00D4FF] to-[#7C3AED] hover:opacity-90 transition-opacity"
              >
                <Send className="w-4 h-4 text-white" />
              </button>
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
