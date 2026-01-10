"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { 
  Mic, 
  BarChart2, 
  Users,
  Activity,
  Clock,
  Volume2,
  Smile,
  TrendingUp
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
  AreaChart,
  Area,
} from "recharts"

// Mock data for charts
const sentimentData = [
  { time: '0:00', positive: 60, negative: 20, neutral: 20 },
  { time: '1:00', positive: 55, negative: 25, neutral: 20 },
  { time: '2:00', positive: 70, negative: 15, neutral: 15 },
  { time: '3:00', positive: 45, negative: 35, neutral: 20 },
  { time: '4:00', positive: 65, negative: 20, neutral: 15 },
  { time: '5:00', positive: 80, negative: 10, neutral: 10 },
]

const speakerTalkTime = [
  { name: 'Speaker 1', minutes: 12.5, color: '#ff4da6' },
  { name: 'Speaker 2', minutes: 8.3, color: '#6ef78b' },
  { name: 'Speaker 3', minutes: 5.2, color: '#4da6ff' },
]

const emotionDistribution = [
  { name: 'Neutral', value: 45, color: '#6B7280' },
  { name: 'Happy', value: 25, color: '#10B981' },
  { name: 'Engaged', value: 18, color: '#667eea' },
  { name: 'Confused', value: 8, color: '#F59E0B' },
  { name: 'Frustrated', value: 4, color: '#EF4444' },
]

const eventFrequency = [
  { event: 'Speech', count: 156 },
  { event: 'Pause', count: 42 },
  { event: 'Laughter', count: 12 },
  { event: 'Background', count: 28 },
  { event: 'Question', count: 18 },
]

const silenceHeatmap = Array.from({ length: 20 }, (_, i) => ({
  segment: i + 1,
  silence: Math.random() * 30,
}))

export default function AnalysisPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#0d0d1a] to-[#0a0a0f]">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4 bg-black/40 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center border border-white/10">
              <Mic className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white">DECIBEL</span>
          </Link>
          <Link
            href="/workspace"
            className="text-white/60 hover:text-white transition-colors"
          >
            Back to Workspace
          </Link>
        </div>
      </nav>

      <div className="pt-24 pb-12 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-3xl font-bold text-white mb-2">Global Analysis</h1>
            <p className="text-white/60 mb-8">Aggregate insights across all your audio files</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Total Files', value: '24', icon: Volume2, color: 'purple' },
              { label: 'Total Duration', value: '4h 32m', icon: Clock, color: 'blue' },
              { label: 'Speakers Identified', value: '47', icon: Users, color: 'green' },
              { label: 'Events Detected', value: '156', icon: Activity, color: 'orange' },
            ].map((stat, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: idx * 0.1 }}
                className="p-4 rounded-2xl bg-white/5 border border-white/10"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className={`w-10 h-10 rounded-xl bg-${stat.color}-500/20 flex items-center justify-center`}>
                    <stat.icon className={`w-5 h-5 text-${stat.color}-400`} />
                  </div>
                </div>
                <p className="text-white/50 text-sm">{stat.label}</p>
                <p className="text-2xl font-bold text-white">{stat.value}</p>
              </motion.div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Sentiment Timeline */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="p-6 rounded-2xl bg-white/5 border border-white/10"
            >
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-white/70" />
                Sentiment Timeline
              </h2>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={sentimentData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis dataKey="time" stroke="#666" />
                    <YAxis stroke="#666" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1a1a2e',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '8px',
                      }}
                    />
                    <Area type="monotone" dataKey="positive" stackId="1" stroke="#10B981" fill="#10B981" fillOpacity={0.3} />
                    <Area type="monotone" dataKey="neutral" stackId="1" stroke="#6B7280" fill="#6B7280" fillOpacity={0.3} />
                    <Area type="monotone" dataKey="negative" stackId="1" stroke="#EF4444" fill="#EF4444" fillOpacity={0.3} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            {/* Speaker Talk Time */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="p-6 rounded-2xl bg-white/5 border border-white/10"
            >
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-white/70" />
                Speaker Talk Time
              </h2>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={speakerTalkTime} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis type="number" stroke="#666" />
                    <YAxis dataKey="name" type="category" stroke="#666" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1a1a2e',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '8px',
                      }}
                    />
                    <Bar dataKey="minutes" radius={[0, 8, 8, 0]}>
                      {speakerTalkTime.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            {/* Emotion Distribution */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="p-6 rounded-2xl bg-white/5 border border-white/10"
            >
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Smile className="w-5 h-5 text-white/70" />
                Emotion Distribution
              </h2>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={emotionDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {emotionDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1a1a2e',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '8px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap gap-3 justify-center mt-4">
                {emotionDistribution.map((item) => (
                  <div key={item.name} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-white/60 text-sm">{item.name}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Event Frequency */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="p-6 rounded-2xl bg-white/5 border border-white/10"
            >
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5 text-white/70" />
                Event Frequency
              </h2>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={eventFrequency}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis dataKey="event" stroke="#666" />
                    <YAxis stroke="#666" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1a1a2e',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '8px',
                      }}
                    />
                    <Bar dataKey="count" fill="#667eea" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </main>
  )
}



