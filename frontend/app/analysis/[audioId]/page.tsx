"use client"

import { useState, useEffect, use } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { useAudioStore } from "@/contexts/audio-store"
import { FullAnalysisResponse, TranscriptSegment, BackgroundEvent, EmotionTimelineItem } from "@/lib/api/types"
import { 
  Mic, 
  Users,
  Activity,
  AlertTriangle,
  Shield,
  MessageSquare,
  Clock,
  Volume2,
  ChevronDown,
  ChevronUp,
  Play,
  Pause,
  Download,
  FileText,
  BarChart3,
  Smile,
  Frown,
  Meh,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Loader2
} from "lucide-react"

// Color mapping for speakers
const speakerColors = [
  'bg-pink-500/20 text-pink-400 border-pink-500/30',
  'bg-blue-500/20 text-blue-400 border-blue-500/30',
  'bg-green-500/20 text-green-400 border-green-500/30',
  'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  'bg-purple-500/20 text-purple-400 border-purple-500/30',
  'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
]

// Emotion icons mapping
const emotionIcons: Record<string, typeof Smile> = {
  'hap': Smile,
  'happy': Smile,
  'sad': Frown,
  'ang': AlertCircle,
  'angry': AlertCircle,
  'neu': Meh,
  'neutral': Meh,
}

const threatPriorityColors: Record<string, string> = {
  'CRITICAL': 'bg-red-500/20 text-red-400 border-red-500/30',
  'HIGH': 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  'MEDIUM': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  'NONE': 'bg-green-500/20 text-green-400 border-green-500/30',
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

export default function AnalysisDashboard({ params }: { params: Promise<{ audioId: string }> }) {
  const { audioId } = use(params)
  const [analysis, setAnalysis] = useState<FullAnalysisResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'transcript' | 'events' | 'emotions' | 'threats'>('transcript')
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    metadata: true,
    speakers: true,
    deepfake: true,
    environment: true,
  })
  
  const { getAnalysis, getAudioFile } = useAudioStore()
  const audioFile = getAudioFile(audioId)

  useEffect(() => {
    const loadAnalysis = async () => {
      // First check memory store
      const storedAnalysis = getAnalysis(audioId)
      if (storedAnalysis?.analysis) {
        setAnalysis(storedAnalysis.analysis)
        setLoading(false)
        return
      }

      // Then try to fetch from database
      try {
        const response = await fetch(`/api/analysis?audioId=${audioId}`)
        if (response.ok) {
          const data = await response.json()
          if (data.analysisData) {
            setAnalysis(data.analysisData)
          } else {
            setError('Analysis data not found')
          }
        } else if (response.status === 404) {
          setError('Analysis not found. Please upload and process the audio first.')
        } else {
          setError('Failed to load analysis')
        }
      } catch (err) {
        console.error('Error loading analysis:', err)
        setError('Failed to load analysis')
      } finally {
        setLoading(false)
      }
    }

    loadAnalysis()
  }, [audioId, getAnalysis])

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }))
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#0d0d1a] to-[#0a0a0f] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-purple-500 animate-spin mx-auto mb-4" />
          <p className="text-white/60">Loading analysis...</p>
        </div>
      </main>
    )
  }

  if (error || !analysis) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#0d0d1a] to-[#0a0a0f] flex items-center justify-center">
        <div className="text-center max-w-md px-6">
          <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Error Loading Analysis</h1>
          <p className="text-white/60 mb-6">{error || 'Analysis data not available'}</p>
          <Link
            href="/upload"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-purple-500 hover:bg-purple-600 text-white transition-colors"
          >
            Upload New Audio
          </Link>
        </div>
      </main>
    )
  }

  const { metadata, speakers, transcript, events, threat_timeline, environment_context, emotion_analysis, deepfake_analysis } = analysis

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#0d0d1a] to-[#0a0a0f]">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4 bg-black/40 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
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
            <Link href="/workspace" className="text-white/60 hover:text-white transition-colors text-sm">
              Workspace
            </Link>
            <Link href="/reports" className="text-white/60 hover:text-white transition-colors text-sm">
              Reports
            </Link>
            <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-white text-sm">
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>
      </nav>

      <div className="pt-24 pb-12 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-3xl font-bold text-white mb-2">
              {audioFile?.name || metadata?.audio_file || 'Audio Analysis'}
            </h1>
            <p className="text-white/60">
              Complete analysis results • {formatTime(metadata?.total_duration || 0)} duration • {metadata?.num_speakers || 0} speakers
            </p>
          </motion.div>

          {/* Quick Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8"
          >
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <Clock className="w-5 h-5 text-purple-400 mb-2" />
              <p className="text-2xl font-bold text-white">{formatTime(metadata?.total_duration || 0)}</p>
              <p className="text-white/50 text-sm">Duration</p>
            </div>
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <Users className="w-5 h-5 text-blue-400 mb-2" />
              <p className="text-2xl font-bold text-white">{metadata?.num_speakers || 0}</p>
              <p className="text-white/50 text-sm">Speakers</p>
            </div>
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <MessageSquare className="w-5 h-5 text-green-400 mb-2" />
              <p className="text-2xl font-bold text-white">{metadata?.num_segments || 0}</p>
              <p className="text-white/50 text-sm">Segments</p>
            </div>
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <Activity className="w-5 h-5 text-yellow-400 mb-2" />
              <p className="text-2xl font-bold text-white">{events?.length || 0}</p>
              <p className="text-white/50 text-sm">Events</p>
            </div>
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <AlertTriangle className="w-5 h-5 text-red-400 mb-2" />
              <p className="text-2xl font-bold text-white">{threat_timeline?.length || 0}</p>
              <p className="text-white/50 text-sm">Threats</p>
            </div>
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <Shield className={`w-5 h-5 mb-2 ${deepfake_analysis?.prediction?.label === 'real' ? 'text-green-400' : 'text-red-400'}`} />
              <p className={`text-2xl font-bold ${deepfake_analysis?.prediction?.label === 'real' ? 'text-green-400' : 'text-red-400'}`}>
                {deepfake_analysis?.prediction?.label === 'real' ? 'Real' : 'Fake'}
              </p>
              <p className="text-white/50 text-sm">Authenticity</p>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content Area */}
            <div className="lg:col-span-2 space-y-6">
              {/* Tab Navigation */}
              <div className="flex gap-2 p-1 bg-white/5 rounded-xl">
                {(['transcript', 'events', 'emotions', 'threats'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                      activeTab === tab
                        ? 'bg-purple-500 text-white'
                        : 'text-white/60 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </div>

              {/* Transcript Tab */}
              {activeTab === 'transcript' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-3"
                >
                  {transcript && transcript.length > 0 ? (
                    transcript.map((segment: TranscriptSegment, idx: number) => {
                      const speakerIndex = parseInt(segment.speaker.replace('SPEAKER_', '')) || 0
                      const colorClass = speakerColors[speakerIndex % speakerColors.length]
                      
                      return (
                        <div
                          key={segment.segment_id || idx}
                          className="p-4 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 transition-all"
                        >
                          <div className="flex items-center gap-3 mb-2">
                            <span className={`px-2 py-1 rounded-lg text-xs font-medium border ${colorClass}`}>
                              {segment.speaker}
                            </span>
                            <span className="text-white/40 text-xs">
                              {formatTime(segment.start_time)} - {formatTime(segment.end_time)}
                            </span>
                          </div>
                          <p className="text-white/90">{segment.text}</p>
                        </div>
                      )
                    })
                  ) : (
                    <div className="p-8 text-center text-white/40">
                      <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No transcript available</p>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Events Tab */}
              {activeTab === 'events' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-3"
                >
                  {events && events.length > 0 ? (
                    events.map((event: BackgroundEvent, idx: number) => (
                      <div
                        key={idx}
                        className={`p-4 rounded-xl border transition-all ${
                          event.is_threat
                            ? threatPriorityColors[event.threat_priority] || 'bg-white/5 border-white/10'
                            : 'bg-white/5 border-white/10 hover:border-white/20'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <Activity className={`w-5 h-5 ${event.is_threat ? 'text-red-400' : 'text-blue-400'}`} />
                            <span className="font-medium text-white">{event.label}</span>
                            {event.is_threat && (
                              <span className={`px-2 py-0.5 rounded text-xs font-medium ${threatPriorityColors[event.threat_priority]}`}>
                                {event.threat_priority}
                              </span>
                            )}
                          </div>
                          <span className="text-white/40 text-sm">
                            {formatTime(event.start_time)} - {formatTime(event.end_time)}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                          <span className="text-white/60">
                            Confidence: {(event.confidence * 100).toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center text-white/40">
                      <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No events detected</p>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Emotions Tab */}
              {activeTab === 'emotions' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-3"
                >
                  {emotion_analysis?.timeline && emotion_analysis.timeline.length > 0 ? (
                    emotion_analysis.timeline.map((item: EmotionTimelineItem, idx: number) => {
                      const EmotionIcon = emotionIcons[item.smoothed_emotion] || Meh
                      
                      return (
                        <div
                          key={idx}
                          className="p-4 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 transition-all"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                              <EmotionIcon className="w-5 h-5 text-yellow-400" />
                              <span className="font-medium text-white capitalize">
                                {item.smoothed_emotion}
                              </span>
                              {item.is_silence && (
                                <span className="px-2 py-0.5 rounded bg-white/10 text-white/50 text-xs">
                                  Silence
                                </span>
                              )}
                            </div>
                            <span className="text-white/40 text-sm">
                              {formatTime(item.start_time)} - {formatTime(item.end_time)}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-sm">
                            <span className="text-white/60">
                              Confidence: {(item.confidence * 100).toFixed(1)}%
                            </span>
                            <span className="text-white/40">
                              Raw: {item.raw_emotion}
                            </span>
                          </div>
                        </div>
                      )
                    })
                  ) : (
                    <div className="p-8 text-center text-white/40">
                      <Smile className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No emotion data available</p>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Threats Tab */}
              {activeTab === 'threats' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-3"
                >
                  {threat_timeline && threat_timeline.length > 0 ? (
                    threat_timeline.map((threat: BackgroundEvent, idx: number) => (
                      <div
                        key={idx}
                        className={`p-4 rounded-xl border ${threatPriorityColors[threat.threat_priority]}`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <AlertTriangle className="w-5 h-5" />
                            <span className="font-medium">{threat.label}</span>
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${threatPriorityColors[threat.threat_priority]}`}>
                              {threat.threat_priority}
                            </span>
                          </div>
                          <span className="opacity-60 text-sm">
                            {formatTime(threat.start_time)} - {formatTime(threat.end_time)}
                          </span>
                        </div>
                        <div className="text-sm opacity-80">
                          Confidence: {(threat.confidence * 100).toFixed(1)}%
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center text-white/40">
                      <CheckCircle2 className="w-12 h-12 mx-auto mb-4 text-green-400 opacity-50" />
                      <p>No threats detected</p>
                    </div>
                  )}
                </motion.div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Deepfake Analysis */}
              <div className="rounded-xl bg-white/5 border border-white/10 overflow-hidden">
                <button
                  onClick={() => toggleSection('deepfake')}
                  className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Shield className="w-5 h-5 text-purple-400" />
                    <span className="font-medium text-white">Deepfake Analysis</span>
                  </div>
                  {expandedSections.deepfake ? (
                    <ChevronUp className="w-5 h-5 text-white/40" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-white/40" />
                  )}
                </button>
                {expandedSections.deepfake && deepfake_analysis && (
                  <div className="p-4 pt-0 space-y-3">
                    <div className={`p-4 rounded-lg ${
                      deepfake_analysis.prediction?.label === 'real'
                        ? 'bg-green-500/10 border border-green-500/30'
                        : 'bg-red-500/10 border border-red-500/30'
                    }`}>
                      <div className="flex items-center gap-2 mb-2">
                        {deepfake_analysis.prediction?.label === 'real' ? (
                          <CheckCircle2 className="w-5 h-5 text-green-400" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-400" />
                        )}
                        <span className={`font-medium ${
                          deepfake_analysis.prediction?.label === 'real' ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {deepfake_analysis.prediction?.label === 'real' ? 'Authentic Audio' : 'Potential Deepfake'}
                        </span>
                      </div>
                      <p className="text-white/60 text-sm">
                        Confidence: {((deepfake_analysis.prediction?.score || 0) * 100).toFixed(1)}%
                      </p>
                    </div>
                    <p className="text-white/40 text-xs">
                      Model: {deepfake_analysis.model}
                    </p>
                  </div>
                )}
              </div>

              {/* Environment Context */}
              <div className="rounded-xl bg-white/5 border border-white/10 overflow-hidden">
                <button
                  onClick={() => toggleSection('environment')}
                  className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Volume2 className="w-5 h-5 text-blue-400" />
                    <span className="font-medium text-white">Environment</span>
                  </div>
                  {expandedSections.environment ? (
                    <ChevronUp className="w-5 h-5 text-white/40" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-white/40" />
                  )}
                </button>
                {expandedSections.environment && environment_context && (
                  <div className="p-4 pt-0 space-y-3">
                    <div className="p-3 rounded-lg bg-white/5">
                      <p className="text-white/40 text-xs mb-1">Primary Environment</p>
                      <p className="text-white font-medium">{environment_context.primary_environment || 'Unknown'}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-white/5">
                      <p className="text-white/40 text-xs mb-1">Confidence</p>
                      <p className="text-white">{((environment_context.environment_confidence || 0) * 100).toFixed(1)}%</p>
                    </div>
                    {environment_context.threat_detected && (
                      <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30">
                        <p className="text-red-400 text-sm font-medium">
                          {environment_context.threat_count} threat(s) detected
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Speakers */}
              <div className="rounded-xl bg-white/5 border border-white/10 overflow-hidden">
                <button
                  onClick={() => toggleSection('speakers')}
                  className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Users className="w-5 h-5 text-green-400" />
                    <span className="font-medium text-white">Speakers</span>
                  </div>
                  {expandedSections.speakers ? (
                    <ChevronUp className="w-5 h-5 text-white/40" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-white/40" />
                  )}
                </button>
                {expandedSections.speakers && speakers && (
                  <div className="p-4 pt-0 space-y-2">
                    {Object.entries(speakers).map(([speakerId, info], idx) => {
                      const colorClass = speakerColors[idx % speakerColors.length]
                      return (
                        <div key={speakerId} className={`p-3 rounded-lg border ${colorClass}`}>
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{speakerId}</span>
                            <span className="text-sm opacity-80">
                              {formatTime(info.total_duration)}
                            </span>
                          </div>
                          <p className="text-xs opacity-60 mt-1">
                            {info.segments?.length || 0} segments
                          </p>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Metadata */}
              <div className="rounded-xl bg-white/5 border border-white/10 overflow-hidden">
                <button
                  onClick={() => toggleSection('metadata')}
                  className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <BarChart3 className="w-5 h-5 text-yellow-400" />
                    <span className="font-medium text-white">Metadata</span>
                  </div>
                  {expandedSections.metadata ? (
                    <ChevronUp className="w-5 h-5 text-white/40" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-white/40" />
                  )}
                </button>
                {expandedSections.metadata && metadata && (
                  <div className="p-4 pt-0 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-white/40">Sample Rate</span>
                      <span className="text-white">{metadata.sample_rate} Hz</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/40">Language</span>
                      <span className="text-white">{metadata.language || 'Unknown'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/40">Speech Duration</span>
                      <span className="text-white">{formatTime(metadata.total_speech_duration || 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/40">Audio ID</span>
                      <span className="text-white/60 text-xs truncate max-w-32">{audioId}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
