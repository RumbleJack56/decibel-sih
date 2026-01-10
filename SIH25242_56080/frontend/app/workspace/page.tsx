"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAudioStore } from "@/contexts/audio-store"
import { 
  Mic, 
  Plus, 
  Search, 
  FileAudio,
  Clock,
  Users,
  MoreVertical,
  Trash2,
  ExternalLink,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw
} from "lucide-react"
import { cn } from "@/lib/utils"

interface AnalysisEntry {
  id: number
  audioId: string
  audioName: string
  status: string
  hasTranscript: boolean
  hasEmotion: boolean
  hasDeepfake: boolean
  hasEvents: boolean
  createdAt: string
  updatedAt: string
  errorMessage?: string
}

export default function WorkspacePage() {
  const [analyses, setAnalyses] = useState<AnalysisEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string | null>(null)
  const router = useRouter()
  const { getAllAnalyses } = useAudioStore()

  useEffect(() => {
    loadAnalyses()
  }, [])

  const loadAnalyses = async () => {
    try {
      // First load from database
      const res = await fetch('/api/analysis')
      if (res.ok) {
        const { analyses: dbAnalyses } = await res.json()
        
        // Also get in-memory analyses
        const memoryAnalyses = getAllAnalyses()
        
        // Merge, preferring database entries but including memory-only entries
        const dbAudioIds = new Set(dbAnalyses.map((a: AnalysisEntry) => a.audioId))
        const memoryOnly = memoryAnalyses
          .filter(a => !dbAudioIds.has(a.audioId))
          .map(a => ({
            id: 0,
            audioId: a.audioId,
            audioName: a.audioName,
            status: a.status,
            hasTranscript: a.hasTranscript,
            hasEmotion: a.hasEmotion,
            hasDeepfake: a.hasDeepfake,
            hasEvents: a.hasEvents,
            createdAt: a.createdAt.toISOString(),
            updatedAt: a.createdAt.toISOString(),
            errorMessage: a.error,
          }))
        
        setAnalyses([...dbAnalyses, ...memoryOnly])
      }
    } catch (error) {
      console.error('Failed to load analyses:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const deleteAnalysis = async (audioId: string) => {
    if (!confirm('Are you sure you want to delete this analysis?')) return

    try {
      await fetch(`/api/analysis?audioId=${audioId}`, { method: 'DELETE' })
      setAnalyses(analyses.filter(a => a.audioId !== audioId))
    } catch (error) {
      console.error('Failed to delete analysis:', error)
    }
  }

  const filteredAnalyses = analyses.filter(analysis => {
    const matchesSearch = analysis.audioName.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = !statusFilter || analysis.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-4 h-4 text-green-400" />
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-400" />
      case 'processing':
        return <Loader2 className="w-4 h-4 text-yellow-400 animate-spin" />
      default:
        return <Clock className="w-4 h-4 text-white/50" />
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#0d0d1a] to-[#0a0a0f]">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4 bg-black/40 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center border border-white/10">
              <svg viewBox="0 0 46 48" fill="none" className="w-5 h-5" xmlns="http://www.w3.org/2000/svg">
                <rect x="2" y="16" width="6" height="16" rx="3" fill="white" />
                <rect x="11" y="10" width="6" height="28" rx="3" fill="white" />
                <rect x="20" y="4" width="6" height="40" rx="3" fill="white" />
                <rect x="29" y="10" width="6" height="28" rx="3" fill="white" />
                <rect x="38" y="16" width="6" height="16" rx="3" fill="white" />
              </svg>
            </div>
            <span className="text-xl font-bold text-white">DECIBEL</span>
          </Link>

          <div className="flex items-center gap-4">
            <button
              onClick={loadAnalyses}
              className="p-2 rounded-xl bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <Link
              href="/upload"
              className="px-4 py-2 rounded-xl bg-white text-black font-medium hover:bg-white/90 transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              New Upload
            </Link>
          </div>
        </div>
      </nav>

      <div className="pt-24 pb-12 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-3xl font-bold text-white mb-2">Workspace</h1>
            <p className="text-white/60 mb-8">Manage your audio analyses</p>
          </motion.div>

          {/* Filters */}
          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search analyses..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-purple-500/50"
              />
            </div>
            <select
              value={statusFilter || ''}
              onChange={(e) => setStatusFilter(e.target.value || null)}
              className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-purple-500/50"
            >
              <option value="">All Status</option>
              <option value="processing">Processing</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
            </select>
          </div>

          {/* Analyses Grid */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-white animate-spin" />
            </div>
          ) : filteredAnalyses.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <FileAudio className="w-12 h-12 text-white/20 mx-auto mb-4" />
              <p className="text-white/50 mb-4">No analyses found</p>
              <Link
                href="/upload"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Upload your first audio
              </Link>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredAnalyses.map((analysis, idx) => (
                <motion.div
                  key={analysis.audioId}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: idx * 0.05 }}
                  className="group p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 transition-all"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                      <FileAudio className="w-5 h-5 text-purple-400" />
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(analysis.status)}
                    </div>
                  </div>

                  <h3 className="font-medium text-white mb-1 truncate">{analysis.audioName}</h3>
                  
                  <div className="flex items-center gap-4 text-white/50 text-sm mb-3">
                    <span>{formatDate(analysis.createdAt)}</span>
                  </div>

                  {/* Partial Failure Indicators */}
                  {analysis.status === 'completed' && (!analysis.hasTranscript || !analysis.hasEmotion || !analysis.hasDeepfake || !analysis.hasEvents) && (
                    <div className="flex items-center gap-2 mb-3 flex-wrap">
                      {!analysis.hasTranscript && (
                        <span className="px-2 py-0.5 rounded text-xs bg-yellow-500/20 text-yellow-400 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          No Transcript
                        </span>
                      )}
                      {!analysis.hasEmotion && (
                        <span className="px-2 py-0.5 rounded text-xs bg-yellow-500/20 text-yellow-400 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          No Emotion
                        </span>
                      )}
                      {!analysis.hasDeepfake && (
                        <span className="px-2 py-0.5 rounded text-xs bg-yellow-500/20 text-yellow-400 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          No Deepfake
                        </span>
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <span className={cn(
                      "px-2 py-1 rounded-lg text-xs font-medium capitalize",
                      analysis.status === 'completed' 
                        ? "bg-green-500/20 text-green-400"
                        : analysis.status === 'processing'
                          ? "bg-yellow-500/20 text-yellow-400"
                          : analysis.status === 'failed'
                            ? "bg-red-500/20 text-red-400"
                            : "bg-white/10 text-white/60"
                    )}>
                      {analysis.status}
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => deleteAnalysis(analysis.audioId)}
                        className="p-2 rounded-lg hover:bg-red-500/20 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </button>
                      {analysis.status === 'completed' ? (
                        <Link
                          href={`/analysis/${analysis.audioId}`}
                          className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                        >
                          <ExternalLink className="w-4 h-4 text-white/70" />
                        </Link>
                      ) : analysis.status === 'processing' ? (
                        <Link
                          href={`/processing/${analysis.audioId}`}
                          className="px-3 py-1.5 rounded-lg bg-yellow-500/20 text-yellow-400 text-sm"
                        >
                          View Progress
                        </Link>
                      ) : analysis.status === 'failed' ? (
                        <Link
                          href={`/upload`}
                          className="px-3 py-1.5 rounded-lg bg-purple-500/20 text-purple-400 text-sm hover:bg-purple-500/30 transition-colors"
                        >
                          Retry
                        </Link>
                      ) : null}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  )
}



