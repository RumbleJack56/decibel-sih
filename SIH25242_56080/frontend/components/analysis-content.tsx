"use client"

import type React from "react"
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
  Download,
  LogOut,
  Layers,
  Users,
  Clock,
  Volume2,
  TrendingUp,
  Activity,
  Mic,
} from "lucide-react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
} from "recharts"

interface AnalysisContentProps {
  user: User
}

// Sample data for charts
const speakerData = [
  { name: "Speaker 1", talkTime: 245, segments: 42, avgPitch: 180 },
  { name: "Speaker 2", talkTime: 189, segments: 35, avgPitch: 220 },
  { name: "Speaker 3", talkTime: 156, segments: 28, avgPitch: 145 },
  { name: "Speaker 4", talkTime: 98, segments: 18, avgPitch: 195 },
]

const emotionData = [
  { name: "Neutral", value: 45, color: "#6B7280" },
  { name: "Happy", value: 25, color: "#10B981" },
  { name: "Engaged", value: 18, color: "#00D4FF" },
  { name: "Confused", value: 8, color: "#F59E0B" },
  { name: "Frustrated", value: 4, color: "#EF4444" },
]

const timelineData = [
  { time: "0:00", speaker1: 4, speaker2: 0, speaker3: 0, speaker4: 0 },
  { time: "1:00", speaker1: 2, speaker2: 5, speaker3: 0, speaker4: 0 },
  { time: "2:00", speaker1: 0, speaker2: 3, speaker3: 4, speaker4: 0 },
  { time: "3:00", speaker1: 5, speaker2: 0, speaker3: 2, speaker4: 3 },
  { time: "4:00", speaker1: 3, speaker2: 4, speaker3: 0, speaker4: 2 },
  { time: "5:00", speaker1: 0, speaker2: 2, speaker3: 5, speaker4: 4 },
  { time: "6:00", speaker1: 4, speaker2: 0, speaker3: 3, speaker4: 0 },
  { time: "7:00", speaker1: 2, speaker2: 5, speaker3: 0, speaker4: 3 },
]

const audioMetricsData = [
  { metric: "Clarity", value: 85 },
  { metric: "Noise Level", value: 15 },
  { metric: "Speech Rate", value: 72 },
  { metric: "Overlap", value: 8 },
  { metric: "Silence", value: 12 },
  { metric: "Energy", value: 78 },
]

const sentimentTrend = [
  { time: "0:00", positive: 60, negative: 20, neutral: 20 },
  { time: "1:00", positive: 55, negative: 25, neutral: 20 },
  { time: "2:00", positive: 70, negative: 15, neutral: 15 },
  { time: "3:00", positive: 45, negative: 35, neutral: 20 },
  { time: "4:00", positive: 65, negative: 20, neutral: 15 },
  { time: "5:00", positive: 80, negative: 10, neutral: 10 },
  { time: "6:00", positive: 75, negative: 15, neutral: 10 },
  { time: "7:00", positive: 85, negative: 5, neutral: 10 },
]

const COLORS = ["#00D4FF", "#7C3AED", "#10B981", "#F59E0B", "#EF4444"]

export function AnalysisContent({ user }: AnalysisContentProps) {
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
                  animate={{ display: sidebarOpen ? "inline-block" : "none", opacity: sidebarOpen ? 1 : 0 }}
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
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
              <div>
                <h1 className="text-2xl font-open-sans-custom text-white mb-2">Analysis Dashboard</h1>
                <p className="text-[#C0C0C0] font-open-sans-custom">Deep insights into your audio data</p>
              </div>
              <button className="flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-[#00D4FF] to-[#7C3AED] text-white font-open-sans-custom text-sm hover:opacity-90 transition-opacity shadow-lg">
                <Download className="w-4 h-4" />
                Download Report
              </button>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <StatCard icon={Users} label="Speakers Detected" value="4" trend="+2 from last" />
              <StatCard icon={Clock} label="Total Duration" value="7:32" trend="min analyzed" />
              <StatCard icon={Volume2} label="Avg Clarity" value="85%" trend="+5% improvement" />
              <StatCard icon={Activity} label="Engagement" value="78%" trend="High engagement" />
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Speaker Talk Time */}
              <div className="rounded-2xl border border-white/10 bg-[#1A1A1A]/80 backdrop-blur-sm p-6">
                <h3 className="text-white font-open-sans-custom font-semibold mb-6 flex items-center gap-2">
                  <Mic className="w-5 h-5 text-[#00D4FF]" />
                  Speaker Talk Time (seconds)
                </h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={speakerData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                      <XAxis type="number" stroke="#C0C0C0" fontSize={12} />
                      <YAxis dataKey="name" type="category" stroke="#C0C0C0" fontSize={12} width={80} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#1A1A1A",
                          border: "1px solid rgba(255,255,255,0.1)",
                          borderRadius: "8px",
                        }}
                        labelStyle={{ color: "#fff" }}
                      />
                      <Bar dataKey="talkTime" fill="url(#barGradient)" radius={[0, 4, 4, 0]} />
                      <defs>
                        <linearGradient id="barGradient" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="#00D4FF" />
                          <stop offset="100%" stopColor="#7C3AED" />
                        </linearGradient>
                      </defs>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Emotion Distribution */}
              <div className="rounded-2xl border border-white/10 bg-[#1A1A1A]/80 backdrop-blur-sm p-6">
                <h3 className="text-white font-open-sans-custom font-semibold mb-6 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-[#7C3AED]" />
                  Emotion Distribution
                </h3>
                <div className="h-64 flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={emotionData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {emotionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#1A1A1A",
                          border: "1px solid rgba(255,255,255,0.1)",
                          borderRadius: "8px",
                        }}
                      />
                      <Legend
                        verticalAlign="bottom"
                        height={36}
                        formatter={(value) => <span style={{ color: "#C0C0C0", fontSize: "12px" }}>{value}</span>}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Speaker Timeline */}
              <div className="lg:col-span-2 rounded-2xl border border-white/10 bg-[#1A1A1A]/80 backdrop-blur-sm p-6">
                <h3 className="text-white font-open-sans-custom font-semibold mb-6 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-[#10B981]" />
                  Speaker Activity Timeline
                </h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={timelineData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                      <XAxis dataKey="time" stroke="#C0C0C0" fontSize={12} />
                      <YAxis stroke="#C0C0C0" fontSize={12} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#1A1A1A",
                          border: "1px solid rgba(255,255,255,0.1)",
                          borderRadius: "8px",
                        }}
                        labelStyle={{ color: "#fff" }}
                      />
                      <Legend
                        formatter={(value) => <span style={{ color: "#C0C0C0", fontSize: "12px" }}>{value}</span>}
                      />
                      <Area
                        type="monotone"
                        dataKey="speaker1"
                        stackId="1"
                        stroke="#00D4FF"
                        fill="#00D4FF"
                        fillOpacity={0.6}
                        name="Speaker 1"
                      />
                      <Area
                        type="monotone"
                        dataKey="speaker2"
                        stackId="1"
                        stroke="#7C3AED"
                        fill="#7C3AED"
                        fillOpacity={0.6}
                        name="Speaker 2"
                      />
                      <Area
                        type="monotone"
                        dataKey="speaker3"
                        stackId="1"
                        stroke="#10B981"
                        fill="#10B981"
                        fillOpacity={0.6}
                        name="Speaker 3"
                      />
                      <Area
                        type="monotone"
                        dataKey="speaker4"
                        stackId="1"
                        stroke="#F59E0B"
                        fill="#F59E0B"
                        fillOpacity={0.6}
                        name="Speaker 4"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Audio Quality Radar */}
              <div className="rounded-2xl border border-white/10 bg-[#1A1A1A]/80 backdrop-blur-sm p-6">
                <h3 className="text-white font-open-sans-custom font-semibold mb-6 flex items-center gap-2">
                  <Volume2 className="w-5 h-5 text-[#00D4FF]" />
                  Audio Quality Metrics
                </h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={audioMetricsData}>
                      <PolarGrid stroke="rgba(255,255,255,0.1)" />
                      <PolarAngleAxis dataKey="metric" stroke="#C0C0C0" fontSize={11} />
                      <PolarRadiusAxis stroke="#C0C0C0" fontSize={10} />
                      <Radar name="Quality" dataKey="value" stroke="#00D4FF" fill="#00D4FF" fillOpacity={0.4} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Sentiment Trend */}
              <div className="rounded-2xl border border-white/10 bg-[#1A1A1A]/80 backdrop-blur-sm p-6">
                <h3 className="text-white font-open-sans-custom font-semibold mb-6 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-[#10B981]" />
                  Sentiment Trend Over Time
                </h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={sentimentTrend}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                      <XAxis dataKey="time" stroke="#C0C0C0" fontSize={12} />
                      <YAxis stroke="#C0C0C0" fontSize={12} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#1A1A1A",
                          border: "1px solid rgba(255,255,255,0.1)",
                          borderRadius: "8px",
                        }}
                        labelStyle={{ color: "#fff" }}
                      />
                      <Legend
                        formatter={(value) => <span style={{ color: "#C0C0C0", fontSize: "12px" }}>{value}</span>}
                      />
                      <Line
                        type="monotone"
                        dataKey="positive"
                        stroke="#10B981"
                        strokeWidth={2}
                        dot={false}
                        name="Positive"
                      />
                      <Line
                        type="monotone"
                        dataKey="negative"
                        stroke="#EF4444"
                        strokeWidth={2}
                        dot={false}
                        name="Negative"
                      />
                      <Line
                        type="monotone"
                        dataKey="neutral"
                        stroke="#6B7280"
                        strokeWidth={2}
                        dot={false}
                        name="Neutral"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Speaker Details Table */}
            <div className="rounded-2xl border border-white/10 bg-[#1A1A1A]/80 backdrop-blur-sm p-6">
              <h3 className="text-white font-open-sans-custom font-semibold mb-6 flex items-center gap-2">
                <Users className="w-5 h-5 text-[#7C3AED]" />
                Speaker Details
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left text-[#C0C0C0] font-open-sans-custom text-sm py-3 px-4">Speaker</th>
                      <th className="text-left text-[#C0C0C0] font-open-sans-custom text-sm py-3 px-4">Talk Time</th>
                      <th className="text-left text-[#C0C0C0] font-open-sans-custom text-sm py-3 px-4">Segments</th>
                      <th className="text-left text-[#C0C0C0] font-open-sans-custom text-sm py-3 px-4">
                        Avg Pitch (Hz)
                      </th>
                      <th className="text-left text-[#C0C0C0] font-open-sans-custom text-sm py-3 px-4">Contribution</th>
                    </tr>
                  </thead>
                  <tbody>
                    {speakerData.map((speaker, idx) => {
                      const total = speakerData.reduce((acc, s) => acc + s.talkTime, 0)
                      const percentage = ((speaker.talkTime / total) * 100).toFixed(1)
                      return (
                        <tr key={idx} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-3">
                              <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                              />
                              <span className="text-white font-open-sans-custom">{speaker.name}</span>
                            </div>
                          </td>
                          <td className="py-4 px-4 text-[#C0C0C0] font-open-sans-custom">
                            {Math.floor(speaker.talkTime / 60)}:{(speaker.talkTime % 60).toString().padStart(2, "0")}
                          </td>
                          <td className="py-4 px-4 text-[#C0C0C0] font-open-sans-custom">{speaker.segments}</td>
                          <td className="py-4 px-4 text-[#C0C0C0] font-open-sans-custom">{speaker.avgPitch} Hz</td>
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                                <div
                                  className="h-full rounded-full"
                                  style={{
                                    width: `${percentage}%`,
                                    background: `linear-gradient(to right, #00D4FF, #7C3AED)`,
                                  }}
                                />
                              </div>
                              <span className="text-[#C0C0C0] font-open-sans-custom text-sm w-12">{percentage}%</span>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

function StatCard({
  icon: Icon,
  label,
  value,
  trend,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
  trend: string
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-[#1A1A1A]/80 backdrop-blur-sm p-4">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#00D4FF]/20 to-[#7C3AED]/20 flex items-center justify-center">
          <Icon className="w-5 h-5 text-[#00D4FF]" />
        </div>
        <span className="text-[#C0C0C0] font-open-sans-custom text-sm">{label}</span>
      </div>
      <p className="text-2xl font-open-sans-custom text-white font-semibold">{value}</p>
      <p className="text-xs text-[#C0C0C0]/70 font-open-sans-custom mt-1">{trend}</p>
    </div>
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
