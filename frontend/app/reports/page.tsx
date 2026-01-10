"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { 
  Mic, 
  FileText,
  Download,
  Eye,
  Calendar,
  Loader2,
  X,
  AlertTriangle,
  CheckCircle2,
  Users,
  Brain,
  Shield,
  FileAudio
} from "lucide-react"
import { cn } from "@/lib/utils"

interface AnalysisReport {
  id: number
  audioId: string
  audioName: string
  status: string
  hasTranscript: boolean
  hasEmotion: boolean
  hasDeepfake: boolean
  hasEvents: boolean
  analysisData: string | null
  createdAt: string
  updatedAt: string
}

interface ParsedAnalysis {
  transcript?: {
    text?: string
    segments?: Array<{ speaker?: string; text?: string; start?: number; end?: number }>
  }
  emotions?: {
    segments?: Array<{ emotion?: string; confidence?: number; start?: number; end?: number }>
  }
  deepfake?: {
    is_fake?: boolean
    confidence?: number
    details?: string
  }
  events?: {
    events?: Array<{ type?: string; timestamp?: number; confidence?: number }>
    threats?: Array<{ type?: string; severity?: string; timestamp?: number }>
  }
  metadata?: {
    duration?: number
    sample_rate?: number
    channels?: number
  }
}

export default function ReportsPage() {
  const [analyses, setAnalyses] = useState<AnalysisReport[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedAnalysis, setSelectedAnalysis] = useState<AnalysisReport | null>(null)

  useEffect(() => {
    loadAnalyses()
  }, [])

  const loadAnalyses = async () => {
    try {
      const res = await fetch('/api/analysis')
      if (res.ok) {
        const { analyses } = await res.json()
        // Only show completed analyses in reports
        setAnalyses(analyses.filter((a: AnalysisReport) => a.status === 'completed' && a.analysisData))
      }
    } catch (error) {
      console.error('Failed to load analyses:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const parseAnalysisData = (dataString: string | null): ParsedAnalysis | null => {
    if (!dataString) return null
    try {
      return JSON.parse(dataString)
    } catch {
      return null
    }
  }

  const downloadReport = (analysis: AnalysisReport, format: 'json' | 'txt' = 'json') => {
    const data = parseAnalysisData(analysis.analysisData)
    if (!data) return

    if (format === 'json') {
      const blob = new Blob([JSON.stringify({
        audioId: analysis.audioId,
        audioName: analysis.audioName,
        generatedAt: new Date().toISOString(),
        analysis: data
      }, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `decibel-report-${analysis.audioId}.json`
      a.click()
      URL.revokeObjectURL(url)
    } else {
      // Generate text report
      let text = `DECIBEL AUDIO ANALYSIS REPORT\n`
      text += `================================\n\n`
      text += `Audio: ${analysis.audioName}\n`
      text += `Audio ID: ${analysis.audioId}\n`
      text += `Generated: ${new Date().toISOString()}\n\n`

      if (data.transcript?.text) {
        text += `TRANSCRIPT\n----------\n${data.transcript.text}\n\n`
      }

      if (data.deepfake) {
        text += `DEEPFAKE ANALYSIS\n-----------------\n`
        text += `Detection: ${data.deepfake.is_fake ? 'SYNTHETIC DETECTED' : 'AUTHENTIC'}\n`
        text += `Confidence: ${((data.deepfake.confidence || 0) * 100).toFixed(1)}%\n\n`
      }

      if (data.emotions?.segments?.length) {
        text += `EMOTION ANALYSIS\n----------------\n`
        data.emotions.segments.forEach((seg, i) => {
          text += `[${seg.start?.toFixed(1)}s - ${seg.end?.toFixed(1)}s] ${seg.emotion} (${((seg.confidence || 0) * 100).toFixed(0)}%)\n`
        })
        text += `\n`
      }

      if (data.events?.threats?.length) {
        text += `THREAT DETECTION\n----------------\n`
        data.events.threats.forEach(threat => {
          text += `- ${threat.type} (${threat.severity}) at ${threat.timestamp?.toFixed(1)}s\n`
        })
        text += `\n`
      }

      const blob = new Blob([text], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `decibel-report-${analysis.audioId}.txt`
      a.click()
      URL.revokeObjectURL(url)
    }
  }

  const getAnalysisSummary = (analysis: AnalysisReport) => {
    const data = parseAnalysisData(analysis.analysisData)
    if (!data) return null

    return {
      speakers: data.transcript?.segments 
        ? new Set(data.transcript.segments.map(s => s.speaker)).size 
        : 0,
      emotions: data.emotions?.segments?.length || 0,
      threats: data.events?.threats?.length || 0,
      isFake: data.deepfake?.is_fake || false
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
          <Link
            href="/workspace"
            className="text-white/60 hover:text-white transition-colors"
          >
            Back to Workspace
          </Link>
        </div>
      </nav>

      <div className="pt-24 pb-12 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-3xl font-bold text-white mb-2">Reports</h1>
            <p className="text-white/60 mb-8">View and download analysis reports</p>
          </motion.div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-white animate-spin" />
            </div>
          ) : analyses.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <FileText className="w-12 h-12 text-white/20 mx-auto mb-4" />
              <p className="text-white/50 mb-4">No reports available yet</p>
              <p className="text-white/30 text-sm mb-6">
                Process an audio file to generate analysis reports
              </p>
              <Link
                href="/upload"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-colors"
              >
                <FileAudio className="w-4 h-4" />
                Upload Audio
              </Link>
            </motion.div>
          ) : (
            <div className="space-y-4">
              {analyses.map((analysis, idx) => {
                const summary = getAnalysisSummary(analysis)
                return (
                  <motion.div
                    key={analysis.audioId}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: idx * 0.05 }}
                    className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
                          <FileText className="w-6 h-6 text-purple-400" />
                        </div>
                        <div>
                          <h3 className="font-medium text-white">
                            {analysis.audioName}
                          </h3>
                          <div className="flex items-center gap-4 text-white/50 text-sm mt-1">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5" />
                              {formatDate(analysis.createdAt)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setSelectedAnalysis(analysis)}
                          className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                          title="Preview"
                        >
                          <Eye className="w-5 h-5 text-white/70" />
                        </button>
                        <button
                          onClick={() => downloadReport(analysis, 'json')}
                          className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                          title="Download JSON"
                        >
                          <Download className="w-5 h-5 text-white/70" />
                        </button>
                      </div>
                    </div>

                    {/* Analysis Summary */}
                    {summary && (
                      <div className="mt-4 pt-4 border-t border-white/10 flex items-center gap-4">
                        {summary.speakers > 0 && (
                          <span className="flex items-center gap-1.5 text-sm text-white/60">
                            <Users className="w-4 h-4" />
                            {summary.speakers} speaker{summary.speakers !== 1 ? 's' : ''}
                          </span>
                        )}
                        {summary.emotions > 0 && (
                          <span className="flex items-center gap-1.5 text-sm text-white/60">
                            <Brain className="w-4 h-4" />
                            {summary.emotions} emotion segments
                          </span>
                        )}
                        {summary.threats > 0 && (
                          <span className="flex items-center gap-1.5 text-sm text-red-400">
                            <AlertTriangle className="w-4 h-4" />
                            {summary.threats} threat{summary.threats !== 1 ? 's' : ''}
                          </span>
                        )}
                        <span className={cn(
                          "flex items-center gap-1.5 text-sm",
                          summary.isFake ? "text-red-400" : "text-green-400"
                        )}>
                          <Shield className="w-4 h-4" />
                          {summary.isFake ? 'Synthetic' : 'Authentic'}
                        </span>
                      </div>
                    )}

                    {/* Partial Failure Indicators */}
                    {(!analysis.hasTranscript || !analysis.hasEmotion || !analysis.hasDeepfake || !analysis.hasEvents) && (
                      <div className="mt-3 flex items-center gap-2 flex-wrap">
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
                  </motion.div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Preview Modal */}
      {selectedAnalysis && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-3xl max-h-[80vh] rounded-2xl bg-[#1a1a2e] border border-white/10 overflow-hidden"
          >
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <div>
                <h2 className="text-lg font-semibold text-white">Analysis Report</h2>
                <p className="text-white/50 text-sm">{selectedAnalysis.audioName}</p>
              </div>
              <button
                onClick={() => setSelectedAnalysis(null)}
                className="p-2 rounded-lg hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5 text-white/70" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto max-h-[60vh]">
              {(() => {
                const data = parseAnalysisData(selectedAnalysis.analysisData)
                if (!data) return <p className="text-white/50">No data available</p>
                
                return (
                  <div className="space-y-6">
                    {/* Deepfake Section */}
                    {data.deepfake && (
                      <div className="p-4 rounded-xl bg-white/5">
                        <h3 className="text-white font-medium mb-3 flex items-center gap-2">
                          <Shield className="w-4 h-4" />
                          Authenticity Analysis
                        </h3>
                        <div className={cn(
                          "p-3 rounded-lg",
                          data.deepfake.is_fake ? "bg-red-500/20" : "bg-green-500/20"
                        )}>
                          <p className={cn(
                            "font-medium",
                            data.deepfake.is_fake ? "text-red-400" : "text-green-400"
                          )}>
                            {data.deepfake.is_fake ? '⚠️ Synthetic Audio Detected' : '✓ Audio Appears Authentic'}
                          </p>
                          <p className="text-white/60 text-sm mt-1">
                            Confidence: {((data.deepfake.confidence || 0) * 100).toFixed(1)}%
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Transcript Section */}
                    {data.transcript?.text && (
                      <div className="p-4 rounded-xl bg-white/5">
                        <h3 className="text-white font-medium mb-3">Transcript</h3>
                        <p className="text-white/70 text-sm leading-relaxed whitespace-pre-wrap">
                          {data.transcript.text}
                        </p>
                      </div>
                    )}

                    {/* Emotions Section */}
                    {data.emotions?.segments && data.emotions.segments.length > 0 && (
                      <div className="p-4 rounded-xl bg-white/5">
                        <h3 className="text-white font-medium mb-3">Emotion Analysis</h3>
                        <div className="space-y-2">
                          {data.emotions.segments.slice(0, 10).map((seg, i) => (
                            <div key={i} className="flex items-center justify-between text-sm">
                              <span className="text-white/70">
                                [{seg.start?.toFixed(1)}s - {seg.end?.toFixed(1)}s]
                              </span>
                              <span className="text-white">{seg.emotion}</span>
                              <span className="text-white/50">{((seg.confidence || 0) * 100).toFixed(0)}%</span>
                            </div>
                          ))}
                          {(data.emotions.segments.length || 0) > 10 && (
                            <p className="text-white/40 text-xs">
                              ... and {data.emotions.segments.length - 10} more segments
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Threats Section */}
                    {data.events?.threats && data.events.threats.length > 0 && (
                      <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                        <h3 className="text-red-400 font-medium mb-3 flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4" />
                          Detected Threats
                        </h3>
                        <div className="space-y-2">
                          {data.events.threats.map((threat, i) => (
                            <div key={i} className="flex items-center justify-between text-sm">
                              <span className="text-white">{threat.type}</span>
                              <span className={cn(
                                "px-2 py-0.5 rounded",
                                threat.severity === 'high' ? "bg-red-500/30 text-red-300" :
                                threat.severity === 'medium' ? "bg-yellow-500/30 text-yellow-300" :
                                "bg-white/20 text-white/70"
                              )}>
                                {threat.severity}
                              </span>
                              <span className="text-white/50">{threat.timestamp?.toFixed(1)}s</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Raw JSON */}
                    <details className="group">
                      <summary className="text-white/50 text-sm cursor-pointer hover:text-white/70">
                        View Raw JSON
                      </summary>
                      <pre className="mt-3 p-4 rounded-xl bg-black/30 text-white/60 text-xs overflow-x-auto">
                        {JSON.stringify(data, null, 2)}
                      </pre>
                    </details>
                  </div>
                )
              })()}
            </div>
            <div className="p-4 border-t border-white/10 flex gap-3">
              <button
                onClick={() => downloadReport(selectedAnalysis, 'json')}
                className="flex-1 py-2.5 rounded-xl bg-white text-black font-medium hover:bg-white/90 transition-colors flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                Download JSON
              </button>
              <button
                onClick={() => downloadReport(selectedAnalysis, 'txt')}
                className="flex-1 py-2.5 rounded-xl bg-white/10 text-white font-medium hover:bg-white/20 transition-colors flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                Download TXT
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </main>
  )
}



