"use client"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import { Send, Loader2, Sparkles, X, Maximize2, Minimize2, FileText, Users, Activity } from "lucide-react"

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface AudioChatInterfaceProps {
  waveformComponent: React.ReactNode
  audioFile: {
    name: string
    duration: number
  }
  onSendMessage: (message: string) => Promise<string>
}

export function AudioChatInterface({ waveformComponent, audioFile, onSendMessage }: AudioChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: `Hi! I'm your audio analysis assistant. I've loaded "${audioFile.name}". Ask me anything about this audio file - transcripts, speakers, events, or any insights you'd like!`,
      timestamp: new Date()
    }
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isWaveformExpanded, setIsWaveformExpanded] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = async () => {
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    try {
      const response = await onSendMessage(input.trim())
      
      const assistantMessage: Message = {
        role: 'assistant',
        content: response,
        timestamp: new Date()
      }
      
      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      console.error('Failed to send message:', error)
      const errorMessage: Message = {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
      inputRef.current?.focus()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const suggestedQuestions = [
    "What are the main topics discussed?",
    "Summarize the conversation",
    "Who are the speakers?",
    "What events were detected?",
  ]

  // Check if user has sent any messages (more than just the initial assistant message)
  const hasUserMessages = messages.some(msg => msg.role === 'user')

  const featureClouds = [
    { icon: FileText, label: "Transcription", desc: "Word-level accuracy", delay: 0 },
    { icon: Users, label: "Diarization", desc: "Speaker identification", delay: 0.2 },
    { icon: Activity, label: "Analysis", desc: "Events & emotions", delay: 0.4 },
  ]

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-[#0a0a0f] via-[#0d0d1a] to-[#0a0a0f] relative overflow-hidden">
      {/* Pinned Waveform Header */}
      <motion.div 
        initial={{ height: 200 }}
        animate={{ height: isWaveformExpanded ? 400 : 200 }}
        className="border-b border-white/10 bg-black/40 backdrop-blur-xl flex-shrink-0 relative z-10"
      >
        <div className="h-full p-4">
          <div className="flex items-center justify-between mb-2">
            <Link href="/decibel" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/30 to-blue-500/30 flex items-center justify-center border border-white/20 group-hover:border-purple-400/50 transition-all group-hover:scale-110 duration-300">
                <svg 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  className="w-6 h-6"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path 
                    d="M2 12C2 12 4 8 6 8C8 8 8 12 10 12C12 12 12 6 14 6C16 6 16 14 18 14C20 14 20 10 22 10" 
                    stroke="url(#logo-gradient-header)" 
                    strokeWidth="2.5" 
                    strokeLinecap="round"
                    className="group-hover:stroke-purple-300 transition-colors"
                  />
                  <path 
                    d="M2 16C2 16 4 12 6 12C8 12 8 16 10 16C12 16 12 10 14 10C16 10 16 18 18 18C20 18 20 14 22 14" 
                    stroke="url(#logo-gradient-header)" 
                    strokeWidth="2" 
                    strokeLinecap="round"
                    opacity="0.5"
                    className="group-hover:opacity-70 transition-opacity"
                  />
                  <defs>
                    <linearGradient id="logo-gradient-header" x1="2" y1="12" x2="22" y2="12">
                      <stop offset="0%" stopColor="#a78bfa" />
                      <stop offset="50%" stopColor="#c084fc" />
                      <stop offset="100%" stopColor="#e879f9" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
              <span className="text-xl font-bold tracking-wide text-white">DECIBEL</span>
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <h2 className="text-white font-semibold">{audioFile.name}</h2>
            </div>
            <button
              onClick={() => setIsWaveformExpanded(!isWaveformExpanded)}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              {isWaveformExpanded ? (
                <Minimize2 className="w-4 h-4 text-white/60" />
              ) : (
                <Maximize2 className="w-4 h-4 text-white/60" />
              )}
            </button>
          </div>
          <div className="h-[calc(100%-3rem)]">
            {waveformComponent}
          </div>
        </div>
      </motion.div>

      {/* Static Feature Clouds - Only show when no user messages */}
      <AnimatePresence>
        {!hasUserMessages && (
          <div className="absolute inset-0 pointer-events-none z-[5] overflow-hidden flex items-center justify-center">
            <div className="flex items-center justify-center gap-4 flex-wrap max-w-5xl px-4">
              {featureClouds.map((cloud, idx) => (
                <motion.div
                  key={cloud.label}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{
                    opacity: { duration: 0.4, delay: cloud.delay },
                    scale: { duration: 0.4, delay: cloud.delay },
                  }}
                  className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-4 text-center w-[180px] shadow-lg shadow-purple-500/10"
                >
                  <cloud.icon className="w-7 h-7 text-purple-400 mx-auto mb-2" />
                  <h3 className="text-white font-semibold mb-1 text-base">{cloud.label}</h3>
                  <p className="text-white/60 text-xs">{cloud.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-6 relative z-20">
        <div className="max-w-4xl mx-auto space-y-6">
          <AnimatePresence>
            {messages.map((message, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`
                    max-w-[80%] rounded-2xl px-5 py-3
                    ${message.role === 'user'
                      ? 'bg-purple-500/20 border border-purple-500/30 text-white'
                      : 'bg-white/5 border border-white/10 text-white/90'
                    }
                  `}
                >
                  {message.role === 'assistant' && (
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="w-4 h-4 text-purple-400" />
                      <span className="text-xs text-white/50 font-medium">AI Assistant</span>
                    </div>
                  )}
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                  <p className="text-xs text-white/30 mt-2">
                    {message.timestamp.toLocaleTimeString()}
                  </p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-start"
            >
              <div className="bg-white/5 border border-white/10 rounded-2xl px-5 py-3">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 text-purple-400 animate-spin" />
                  <span className="text-sm text-white/60">Analyzing...</span>
                </div>
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Suggested Questions (show only if no messages from user yet) */}
      {messages.length === 1 && (
        <div className="px-6 pb-2">
          <div className="max-w-4xl mx-auto">
            <p className="text-xs text-white/40 mb-3">Suggested questions:</p>
            <div className="flex flex-wrap gap-2">
              {suggestedQuestions.map((question, idx) => (
                <button
                  key={idx}
                  onClick={() => setInput(question)}
                  className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-white/70 hover:bg-white/10 hover:text-white transition-colors"
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="border-t border-white/10 bg-black/40 backdrop-blur-xl p-4 flex-shrink-0">
        <div className="max-w-4xl mx-auto">
          <div className="relative flex items-end gap-3">
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask anything about this audio file..."
                rows={1}
                disabled={isLoading}
                className="
                  w-full px-4 py-3 pr-12 rounded-2xl
                  bg-white/10 border border-white/20
                  text-white placeholder-white/40
                  focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50
                  resize-none min-h-[48px] max-h-32
                  disabled:opacity-50 disabled:cursor-not-allowed
                "
                style={{ 
                  height: 'auto',
                  overflowY: input.split('\n').length > 3 ? 'auto' : 'hidden'
                }}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement
                  target.style.height = 'auto'
                  target.style.height = Math.min(target.scrollHeight, 128) + 'px'
                }}
              />
              <div className="absolute right-2 bottom-2 text-xs text-white/30">
                {input.length > 0 && `${input.length} chars`}
              </div>
            </div>
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="
                p-3 rounded-xl
                bg-purple-500 hover:bg-purple-600
                disabled:opacity-50 disabled:cursor-not-allowed
                transition-all flex items-center justify-center
                hover:shadow-[0_0_20px_rgba(168,85,247,0.5)]
              "
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 text-white animate-spin" />
              ) : (
                <Send className="w-5 h-5 text-white" />
              )}
            </button>
          </div>
          <p className="text-xs text-white/30 mt-2 text-center">
            Press Enter to send, Shift+Enter for new line
          </p>
        </div>
      </div>
    </div>
  )
}

