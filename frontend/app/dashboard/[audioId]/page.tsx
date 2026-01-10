"use client"

import { useState, useEffect, use, useRef, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import { useAudioStore } from "@/contexts/audio-store"
import WaveSurfer from "wavesurfer.js"
import { 
  runEmotionAnalysis,
  runDeepfakeAnalysis,
  runBackgroundAnalysis,
  runASR,
  runASRDiarization,
  askQuestion, 
  getForegroundBackgroundAudioUrls,
  downloadForensicsPDF,
  APIClientError,
  TranscriptSegment,
  EmotionAnalysisResponse,
  DeepfakeAnalysisResponse,
  BackgroundAnalysisResponse,
  ASRDiarizationResponse,
  SpeakerInfo,
  SpeakerSegment,
} from "@/lib/api"
import { 
  Mic, 
  Play, 
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Layers,
  MessageSquare,
  Send,
  ChevronDown,
  Globe,
  User,
  Bot,
  Loader2,
  AlertCircle,
  Eye,
  EyeOff,
  RefreshCw,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Heart,
  Smile,
  Frown,
  Meh,
  Angry,
  CheckCircle,
  XCircle,
  FileDown,
  Zap,
  Activity,
} from "lucide-react"
import { cn } from "@/lib/utils"

// Speaker colors for diarization - vibrant chat bubble colors
const SPEAKER_COLORS: Record<string, { bg: string; border: string; text: string; light: string }> = {
  SPEAKER_00: { bg: "bg-violet-500/20", border: "border-violet-500/50", text: "text-violet-400", light: "#8B5CF6" },
  SPEAKER_01: { bg: "bg-emerald-500/20", border: "border-emerald-500/50", text: "text-emerald-400", light: "#10B981" },
  SPEAKER_02: { bg: "bg-amber-500/20", border: "border-amber-500/50", text: "text-amber-400", light: "#F59E0B" },
  SPEAKER_03: { bg: "bg-rose-500/20", border: "border-rose-500/50", text: "text-rose-400", light: "#F43F5E" },
  SPEAKER_04: { bg: "bg-cyan-500/20", border: "border-cyan-500/50", text: "text-cyan-400", light: "#06B6D4" },
  SPEAKER_05: { bg: "bg-pink-500/20", border: "border-pink-500/50", text: "text-pink-400", light: "#EC4899" },
}

// Emotion colors for mood wheel
const EMOTION_WHEEL_COLORS: Record<string, { color: string; ringColor: string; label: string }> = {
  'ang': { color: '#EF4444', ringColor: 'stroke-red-500', label: 'Angry' },
  'angry': { color: '#EF4444', ringColor: 'stroke-red-500', label: 'Angry' },
  'fear': { color: '#A855F7', ringColor: 'stroke-purple-500', label: 'Fear' },
  'hap': { color: '#FACC15', ringColor: 'stroke-yellow-400', label: 'Happy' },
  'happy': { color: '#FACC15', ringColor: 'stroke-yellow-400', label: 'Happy' },
  'neu': { color: '#3B82F6', ringColor: 'stroke-blue-500', label: 'Neutral' },
  'neutral': { color: '#3B82F6', ringColor: 'stroke-blue-500', label: 'Neutral' },
  'sad': { color: '#22C55E', ringColor: 'stroke-green-500', label: 'Sad' },
  'sadness': { color: '#22C55E', ringColor: 'stroke-green-500', label: 'Sad' },
}

const languages = [
  { code: "en", name: "English" },
  { code: "es", name: "Gujrati" },
  { code: "fr", name: "Marathi" },
  { code: "de", name: "Punjabi" },
  { code: "hi", name: "Hindi" },
  { code: "zh", name: "Mandarin" },
]

interface ChatMessage {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

export default function AudioDashboardPage({ params }: { params: Promise<{ audioId: string }> }) {
  const { audioId } = use(params)
  const { getAudioFile, updateAnalysis, getAnalysis } = useAudioStore()
  
  // Get the uploaded audio file
  const audioFile = getAudioFile(audioId)
  
  // Individual analysis states (separate for each endpoint)
  const [asrData, setAsrData] = useState<ASRDiarizationResponse | null>(null)
  const [diarizationData, setDiarizationData] = useState<ASRDiarizationResponse | null>(null)
  const [emotionData, setEmotionData] = useState<EmotionAnalysisResponse | null>(null)
  const [deepfakeData, setDeepfakeData] = useState<DeepfakeAnalysisResponse | null>(null)
  const [backgroundData, setBackgroundData] = useState<BackgroundAnalysisResponse | null>(null)
  
  // Loading states for each endpoint
  const [isAsrLoading, setIsAsrLoading] = useState(false)
  const [isDiarizationLoading, setIsDiarizationLoading] = useState(false)
  const [isEmotionLoading, setIsEmotionLoading] = useState(false)
  const [isDeepfakeLoading, setIsDeepfakeLoading] = useState(false)
  const [isBackgroundLoading, setIsBackgroundLoading] = useState(false)
  
  // Error states
  const [asrError, setAsrError] = useState<string | null>(null)
  const [diarizationError, setDiarizationError] = useState<string | null>(null)
  const [emotionError, setEmotionError] = useState<string | null>(null)
  const [deepfakeError, setDeepfakeError] = useState<string | null>(null)
  const [backgroundError, setBackgroundError] = useState<string | null>(null)
  
  // WaveSurfer refs for stacked waveforms (FG above, BG below)
  const fgWaveformContainerRef = useRef<HTMLDivElement>(null)
  const bgWaveformContainerRef = useRef<HTMLDivElement>(null)
  const fgWavesurferRef = useRef<WaveSurfer | null>(null)
  const bgWavesurferRef = useRef<WaveSurfer | null>(null)
  const [isWaveformReady, setIsWaveformReady] = useState(false)
  const [isWaveformLoading, setIsWaveformLoading] = useState(true)
  const [waveformError, setWaveformError] = useState<string | null>(null)
  
  // Active track state for toggle - which waveform is currently "active" (highlighted and playing)
  const [activeTrack, setActiveTrack] = useState<'fg' | 'bg'>('fg')
  
  // Track visibility and volume
  const [fgVisible, setFgVisible] = useState(true)
  const [bgVisible, setBgVisible] = useState(true)
  const [fgVolume, setFgVolume] = useState(1)
  const [bgVolume, setBgVolume] = useState(0.3)
  
  // Report generation state
  const [isDownloadingReport, setIsDownloadingReport] = useState(false)
  const [reportError, setReportError] = useState<string | null>(null)
  
  // Audio state
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(0.8)
  const [isMuted, setIsMuted] = useState(false)
  
  // Transcript state
  const [selectedLanguage, setSelectedLanguage] = useState("en")
  const [isLanguageOpen, setIsLanguageOpen] = useState(false)
  const [activeTranscriptId, setActiveTranscriptId] = useState<number | null>(null)
  
  // Chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: "1",
      role: "assistant",
      content: "Hello! I'm your Audio Language Model assistant. Ask me anything about this audio file - I can help analyze speakers, emotions, content, and more.",
      timestamp: new Date(),
    },
  ])
  const [chatInput, setChatInput] = useState("")
  const [isSending, setIsSending] = useState(false)
  
  // Refs
  const chatContainerRef = useRef<HTMLDivElement>(null)
  
  // Animation states
  const [isLoaded, setIsLoaded] = useState(false)
  
  // Foreground/Background audio URLs
  const [fgAudioUrl, setFgAudioUrl] = useState<string | null>(null)
  const [bgAudioUrl, setBgAudioUrl] = useState<string | null>(null)
  const [isFgBgLoading, setIsFgBgLoading] = useState(false)
  const [fgBgError, setFgBgError] = useState<string | null>(null)
  
  // Button click handler for ASR - POST /asr
  const handleFetchASR = async () => {
    if (!audioId || isAsrLoading) return
    
    setIsAsrLoading(true)
    setAsrError(null)
    
    try {
      const result = await runASR(audioId)
      setAsrData(result)
    } catch (error) {
      console.error('ASR error:', error)
      const message = error instanceof APIClientError ? error.message : 'Failed to get transcript'
      setAsrError(message)
    } finally {
      setIsAsrLoading(false)
    }
  }
  
  // Button click handler for ASR Diarization - POST /asr_diarization
  const handleFetchDiarization = async () => {
    if (!audioId || isDiarizationLoading) return
    
    setIsDiarizationLoading(true)
    setDiarizationError(null)
    
    try {
      const result = await runASRDiarization(audioId)
      console.log('Diarization API Response:', JSON.stringify(result, null, 2))
      setDiarizationData(result)
    } catch (error) {
      console.error('Diarization error:', error)
      const message = error instanceof APIClientError ? error.message : 'Failed to get speaker diarization'
      setDiarizationError(message)
    } finally {
      setIsDiarizationLoading(false)
    }
  }
  
  // Button click handler for Emotion Analysis - POST /emotion
  const handleFetchEmotion = async () => {
    if (!audioId || isEmotionLoading) return
    
    setIsEmotionLoading(true)
    setEmotionError(null)
    
    try {
      const result = await runEmotionAnalysis(audioId)
      console.log('Emotion API Response:', JSON.stringify(result, null, 2))
      setEmotionData(result)
    } catch (error) {
      console.error('Emotion error:', error)
      const message = error instanceof APIClientError ? error.message : 'Failed to analyze emotion'
      setEmotionError(message)
    } finally {
      setIsEmotionLoading(false)
    }
  }
  
  // Button click handler for Deepfake Analysis - POST /deepfake
  const handleFetchDeepfake = async () => {
    if (!audioId || isDeepfakeLoading) return
    
    setIsDeepfakeLoading(true)
    setDeepfakeError(null)
    
    try {
      const result = await runDeepfakeAnalysis(audioId)
      setDeepfakeData(result)
    } catch (error) {
      console.error('Deepfake error:', error)
      const message = error instanceof APIClientError ? error.message : 'Failed to analyze authenticity'
      setDeepfakeError(message)
    } finally {
      setIsDeepfakeLoading(false)
    }
  }
  
  // Button click handler for Background Analysis - POST /background
  const handleFetchBackground = async () => {
    if (!audioId || isBackgroundLoading) return
    
    setIsBackgroundLoading(true)
    setBackgroundError(null)
    
    try {
      const result = await runBackgroundAnalysis(audioId)
      setBackgroundData(result)
    } catch (error) {
      console.error('Background error:', error)
      const message = error instanceof APIClientError ? error.message : 'Failed to analyze background'
      setBackgroundError(message)
    } finally {
      setIsBackgroundLoading(false)
    }
  }
  
  // Button click handler for Foreground/Background Waveform Separation
  const handleFetchFgBgWaveforms = async () => {
    if (!audioId || isFgBgLoading) return
    
    setIsFgBgLoading(true)
    setFgBgError(null)
    
    try {
      const result = await getForegroundBackgroundAudioUrls(audioId)
      console.log('FG/BG separation result:', result)
      
      // Validate the URLs before setting them
      if (!result.foregroundUrl || !result.backgroundUrl) {
        throw new Error('Invalid audio URLs returned from separation')
      }
      
      // Update duration if available
      if (result.durationSec && isFinite(result.durationSec)) {
        setDuration(result.durationSec)
      }
      
      setFgAudioUrl(result.foregroundUrl)
      setBgAudioUrl(result.backgroundUrl)
      
      // Reinitialize waveforms with separated audio
      if (fgWavesurferRef.current) {
        fgWavesurferRef.current.destroy()
        fgWavesurferRef.current = null
      }
      if (bgWavesurferRef.current) {
        bgWavesurferRef.current.destroy()
        bgWavesurferRef.current = null
      }
      setIsWaveformReady(false)
    } catch (error) {
      console.error('FG/BG separation error:', error)
      const message = error instanceof APIClientError ? error.message : 'Failed to separate foreground/background'
      setFgBgError(message)
    } finally {
      setIsFgBgLoading(false)
    }
  }
  
  // Download Report handler - calls /forensics_pdf endpoint and downloads PDF
  const handleDownloadReport = async () => {
    if (!audioFile || isDownloadingReport) return
    
    setIsDownloadingReport(true)
    setReportError(null)
    
    try {
      // Get the audio file as a Blob
      let fileToSend: File | Blob
      
      if (audioFile.blob) {
        fileToSend = audioFile.blob
      } else if (audioFile.url) {
        // Fetch the audio from URL and convert to blob
        const response = await fetch(audioFile.url)
        if (!response.ok) {
          throw new Error('Failed to fetch audio file')
        }
        fileToSend = await response.blob()
      } else {
        throw new Error('No audio file available')
      }
      
      // Call the /forensics_pdf endpoint
      const pdfBlob = await downloadForensicsPDF(fileToSend)
      
      // Create download link
      const url = URL.createObjectURL(pdfBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = `DECIBEL_Forensics_Report_${audioId.slice(0, 8)}_${new Date().toISOString().split('T')[0]}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      
    } catch (error) {
      console.error('Report download error:', error)
      const message = error instanceof APIClientError ? error.message : 'Failed to download report'
      setReportError(message)
    } finally {
      setIsDownloadingReport(false)
    }
  }
  
  // Initialize stacked WaveSurfer waveforms (FG above, BG below)
  useEffect(() => {
    // Clean up previous instances
    if (fgWavesurferRef.current) {
      fgWavesurferRef.current.destroy()
      fgWavesurferRef.current = null
    }
    if (bgWavesurferRef.current) {
      bgWavesurferRef.current.destroy()
      bgWavesurferRef.current = null
    }
    
    setIsWaveformLoading(true)
    setWaveformError(null)
    setIsWaveformReady(false)
    
    const initWaveforms = async () => {
      try {
        // Check if we have an audio file
        if (!audioFile?.url && !audioFile?.blob) {
          setWaveformError('No audio file found. Please upload an audio file first.')
          setIsWaveformLoading(false)
          return
        }
        
        // Get the original audio URL
        const originalUrl = audioFile.url || (audioFile.blob ? URL.createObjectURL(audioFile.blob) : '')
        
        if (!originalUrl) {
          setWaveformError('Invalid audio URL')
          setIsWaveformLoading(false)
          return
        }
        
        console.log('Initializing waveforms:', { originalUrl, fgAudioUrl, bgAudioUrl, hasSeparated: !!(fgAudioUrl && bgAudioUrl) })
        
        // Check if we have separated audio
        const hasSeparatedAudio = !!(fgAudioUrl && bgAudioUrl)
        
        if (hasSeparatedAudio && fgWaveformContainerRef.current && bgWaveformContainerRef.current) {
          // Create TWO STACKED waveforms for separated FG/BG audio
          
          // Create foreground WaveSurfer (top - cyan colored)
          const fgWavesurfer = WaveSurfer.create({
            container: fgWaveformContainerRef.current,
            waveColor: 'rgba(6, 182, 212, 0.9)', // Cyan
            progressColor: 'rgba(6, 182, 212, 1)',
            height: 80,
            barWidth: 2,
            barGap: 1,
            barRadius: 2,
            cursorColor: '#ffffff',
            cursorWidth: 2,
            normalize: true,
            interact: false, // Disable click-to-seek - we control playback manually
          })
          
          // Create background WaveSurfer (bottom - pink/magenta colored)
          const bgWavesurfer = WaveSurfer.create({
            container: bgWaveformContainerRef.current,
            waveColor: 'rgba(236, 72, 153, 0.9)', // Pink
            progressColor: 'rgba(236, 72, 153, 1)',
            height: 80,
            barWidth: 2,
            barGap: 1,
            barRadius: 2,
            cursorColor: '#ffffff',
            cursorWidth: 2,
            normalize: true,
            interact: false, // Disable click-to-seek - we control playback manually
          })
          
          fgWavesurferRef.current = fgWavesurfer
          bgWavesurferRef.current = bgWavesurfer
          
          // Set initial volumes - only FG plays by default (activeTrack defaults to 'fg')
          fgWavesurfer.setVolume(1)
          bgWavesurfer.setVolume(0) // BG starts muted
          
          let fgReady = false
          let bgReady = false
          
          const checkBothReady = () => {
            if (fgReady && bgReady) {
              setIsWaveformReady(true)
              setIsWaveformLoading(false)
              const audioDuration = fgWavesurfer.getDuration()
              if (isFinite(audioDuration) && audioDuration > 0) {
                setDuration(audioDuration)
              } else if (audioFile.duration && isFinite(audioFile.duration)) {
                setDuration(audioFile.duration)
              }
            }
          }
          
          fgWavesurfer.on('ready', () => {
            fgReady = true
            checkBothReady()
          })
          
          bgWavesurfer.on('ready', () => {
            bgReady = true
            checkBothReady()
          })
          
          // Only update currentTime from the active track - no cross-syncing
          fgWavesurfer.on('timeupdate', (time) => {
            if (isFinite(time)) {
              setCurrentTime(time)
            }
          })
          
          // BG also updates time when it's playing
          bgWavesurfer.on('timeupdate', (time) => {
            if (isFinite(time)) {
              setCurrentTime(time)
            }
          })
          
          fgWavesurfer.on('finish', () => {
            setIsPlaying(false)
          })
          
          bgWavesurfer.on('finish', () => {
            setIsPlaying(false)
          })
          
          fgWavesurfer.on('error', (err) => {
            console.error('FG Wavesurfer error:', err)
            setWaveformError('Error loading foreground audio')
            setIsWaveformLoading(false)
          })
          
          bgWavesurfer.on('error', (err) => {
            console.error('BG Wavesurfer error:', err)
            setWaveformError('Error loading background audio')
            setIsWaveformLoading(false)
          })
          
          // Load separated audio files
          await Promise.all([
            fgWavesurfer.load(fgAudioUrl),
            bgWavesurfer.load(bgAudioUrl)
          ])
          
        } else if (fgWaveformContainerRef.current) {
          // Create SINGLE waveform for original audio (before separation)
          const fgWavesurfer = WaveSurfer.create({
            container: fgWaveformContainerRef.current,
            waveColor: 'rgba(139, 92, 246, 0.8)', // Purple for original
            progressColor: 'rgba(139, 92, 246, 1)',
            height: 100,
            barWidth: 2,
            barGap: 1,
            barRadius: 2,
            cursorColor: '#ffffff',
            cursorWidth: 2,
            normalize: true,
          })
          
          fgWavesurferRef.current = fgWavesurfer
          
          fgWavesurfer.on('ready', () => {
            setIsWaveformReady(true)
            setIsWaveformLoading(false)
            const audioDuration = fgWavesurfer.getDuration()
            if (isFinite(audioDuration) && audioDuration > 0) {
              setDuration(audioDuration)
            } else if (audioFile.duration && isFinite(audioFile.duration)) {
              setDuration(audioFile.duration)
            }
          })
          
          fgWavesurfer.on('timeupdate', (time) => {
            if (isFinite(time)) {
              setCurrentTime(time)
            }
          })
          
          fgWavesurfer.on('finish', () => {
            setIsPlaying(false)
          })
          
          fgWavesurfer.on('error', (err) => {
            console.error('Wavesurfer error:', err)
            setWaveformError('Error loading audio')
            setIsWaveformLoading(false)
          })
          
          // Load original audio
          await fgWavesurfer.load(originalUrl)
        } else {
          setWaveformError('Waveform container not ready')
          setIsWaveformLoading(false)
        }
        
      } catch (error) {
        console.error('Error initializing waveforms:', error)
        setWaveformError('Failed to initialize audio player')
        setIsWaveformLoading(false)
      }
    }
    
    // Small delay to ensure DOM is ready
    const timer = setTimeout(initWaveforms, 100)
    
    return () => {
      clearTimeout(timer)
      fgWavesurferRef.current?.destroy()
      fgWavesurferRef.current = null
      bgWavesurferRef.current?.destroy()
      bgWavesurferRef.current = null
    }
  }, [audioFile?.url, audioFile?.blob, fgAudioUrl, bgAudioUrl])
  
  // Update waveform colors based on active track (only when we have separated audio)
  useEffect(() => {
    // Only apply when we have both waveforms (separated audio)
    if (fgWavesurferRef.current && bgWavesurferRef.current && isWaveformReady && fgAudioUrl && bgAudioUrl) {
      // Update FG waveform colors
      fgWavesurferRef.current.setOptions({
        waveColor: activeTrack === 'fg' ? 'rgba(6, 182, 212, 0.9)' : 'rgba(6, 182, 212, 0.25)',
        progressColor: activeTrack === 'fg' ? 'rgba(6, 182, 212, 1)' : 'rgba(6, 182, 212, 0.4)',
      })
      
      // Update BG waveform colors
      bgWavesurferRef.current.setOptions({
        waveColor: activeTrack === 'bg' ? 'rgba(236, 72, 153, 0.9)' : 'rgba(236, 72, 153, 0.25)',
        progressColor: activeTrack === 'bg' ? 'rgba(236, 72, 153, 1)' : 'rgba(236, 72, 153, 0.4)',
      })
    }
  }, [activeTrack, isWaveformReady, fgAudioUrl, bgAudioUrl])
  
  // Update track volumes based on active track - ONLY active track plays
  useEffect(() => {
    if (!fgWavesurferRef.current || !isWaveformReady) return
    
    // Check if we have separated audio (two waveforms)
    if (bgWavesurferRef.current && fgAudioUrl && bgAudioUrl) {
      // ONLY the active track gets volume, inactive track is muted
      const fgVol = isMuted ? 0 : (activeTrack === 'fg' ? volume : 0)
      const bgVol = isMuted ? 0 : (activeTrack === 'bg' ? volume : 0)
      
      fgWavesurferRef.current.setVolume(fgVol)
      bgWavesurferRef.current.setVolume(bgVol)
    } else {
      // Single waveform - just use master volume
      const vol = isMuted ? 0 : volume
      fgWavesurferRef.current.setVolume(vol)
    }
  }, [volume, isMuted, activeTrack, isWaveformReady, fgAudioUrl, bgAudioUrl])
  
  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => setIsLoaded(true), 300)
    return () => clearTimeout(timer)
  }, [])

  // Format time helper
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // Toggle between FG and BG - switches which track is playing
  const handleToggleFgBg = () => {
    const newTrack = activeTrack === 'fg' ? 'bg' : 'fg'
    
    // If currently playing, switch which track is playing and sync position
    if (isPlaying && fgAudioUrl && bgAudioUrl) {
      if (newTrack === 'fg') {
        // Switching to FG: set FG position to current time, then play FG and pause BG
        fgWavesurferRef.current?.setTime(currentTime)
        bgWavesurferRef.current?.pause()
        fgWavesurferRef.current?.play()
      } else {
        // Switching to BG: set BG position to current time, then play BG and pause FG
        bgWavesurferRef.current?.setTime(currentTime)
        fgWavesurferRef.current?.pause()
        bgWavesurferRef.current?.play()
      }
    } else if (fgAudioUrl && bgAudioUrl) {
      // Not playing, but sync positions anyway when switching
      if (newTrack === 'fg') {
        fgWavesurferRef.current?.setTime(currentTime)
      } else {
        bgWavesurferRef.current?.setTime(currentTime)
      }
    }
    
    setActiveTrack(newTrack)
  }

  // Time update interval for tracking current playback position from ACTIVE track
  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null
    
    if (isPlaying) {
      intervalId = setInterval(() => {
        const hasSeparatedAudio = !!(fgAudioUrl && bgAudioUrl)
        let time = 0
        
        // Get time from the active track
        if (hasSeparatedAudio) {
          if (activeTrack === 'fg' && fgWavesurferRef.current) {
            time = fgWavesurferRef.current.getCurrentTime()
          } else if (activeTrack === 'bg' && bgWavesurferRef.current) {
            time = bgWavesurferRef.current.getCurrentTime()
          }
        } else if (fgWavesurferRef.current) {
          time = fgWavesurferRef.current.getCurrentTime()
        }
        
        // Only update if time is finite
        if (isFinite(time)) {
          setCurrentTime(time)
        }
        
        // Check if playback finished (only if duration is valid)
        if (isFinite(duration) && duration > 0 && time >= duration - 0.1) {
          setIsPlaying(false)
          fgWavesurferRef.current?.pause()
          bgWavesurferRef.current?.pause()
        }
      }, 100)
    }
    
    return () => {
      if (intervalId) clearInterval(intervalId)
    }
  }, [isPlaying, duration, activeTrack, fgAudioUrl, bgAudioUrl])

  // Play/Pause - only plays the SELECTED/ACTIVE track
  const togglePlay = () => {
    if (!isWaveformReady) return
    
    // Determine which wavesurfer to use based on active track and availability
    const hasSeparatedAudio = !!(fgAudioUrl && bgAudioUrl && fgWavesurferRef.current && bgWavesurferRef.current)
    
    if (isPlaying) {
      // Pause all
      fgWavesurferRef.current?.pause()
      bgWavesurferRef.current?.pause()
      setIsPlaying(false)
    } else {
      if (hasSeparatedAudio) {
        // Only play the active track, keep the other paused
        if (activeTrack === 'fg') {
          fgWavesurferRef.current?.play()
          bgWavesurferRef.current?.pause()
        } else {
          bgWavesurferRef.current?.play()
          fgWavesurferRef.current?.pause()
        }
      } else {
        // Single waveform mode - just play the foreground
        fgWavesurferRef.current?.play()
      }
      setIsPlaying(true)
    }
  }
  
  // Skip backward 5 seconds - only affects active track
  const skipBackward = () => {
    if (!isWaveformReady) return
    
    const newTime = Math.max(0, currentTime - 5)
    const hasSeparatedAudio = !!(fgAudioUrl && bgAudioUrl)
    
    if (hasSeparatedAudio) {
      // Only update the active track
      if (activeTrack === 'fg') {
        fgWavesurferRef.current?.setTime(newTime)
      } else {
        bgWavesurferRef.current?.setTime(newTime)
      }
    } else {
      fgWavesurferRef.current?.setTime(newTime)
    }
    setCurrentTime(newTime)
  }
  
  // Skip forward 5 seconds - only affects active track
  const skipForward = () => {
    if (!isWaveformReady) return
    
    const newTime = Math.min(duration, currentTime + 5)
    const hasSeparatedAudio = !!(fgAudioUrl && bgAudioUrl)
    
    if (hasSeparatedAudio) {
      // Only update the active track
      if (activeTrack === 'fg') {
        fgWavesurferRef.current?.setTime(newTime)
      } else {
        bgWavesurferRef.current?.setTime(newTime)
      }
    } else {
      fgWavesurferRef.current?.setTime(newTime)
    }
    setCurrentTime(newTime)
  }

  // Send chat message - uses QnA API
  const handleSendMessage = async () => {
    if (!chatInput.trim() || isSending) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: chatInput.trim(),
      timestamp: new Date(),
    }

    setChatMessages(prev => [...prev, userMessage])
    const question = chatInput.trim()
    setChatInput("")
    setIsSending(true)

    try {
      // Call the QnA API
      const response = await askQuestion(audioId, question)
      
      const aiResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: response.answer,
        timestamp: new Date(),
      }
      setChatMessages(prev => [...prev, aiResponse])
    } catch (error) {
      console.error('QnA error:', error)
      const errorMessage = error instanceof APIClientError 
        ? error.message 
        : 'Failed to get response. Please try again.'
      
      const aiResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `Sorry, I encountered an error: ${errorMessage}`,
        timestamp: new Date(),
      }
      setChatMessages(prev => [...prev, aiResponse])
    } finally {
      setIsSending(false)
    }
  }

  // Scroll chat to bottom
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
    }
  }, [chatMessages])

  // Container animation variants
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.15,
        duration: 0.5,
        ease: [0.25, 0.46, 0.45, 0.94] as const // easeOut bezier curve
      }
    })
  }

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
          <Link 
            href="/workspace"
            className="text-white/60 hover:text-white transition-colors text-sm"
          >
            ← Back to Workspace
          </Link>
        </div>
      </nav>

      <div className="pt-24 pb-8 px-6">
        <div className="max-w-7xl mx-auto space-y-6">
          
          {/* ============================================ */}
          {/* MULTITRACK WAVEFORM SECTION */}
          {/* ============================================ */}
          <motion.div
            custom={0}
            initial="hidden"
            animate={isLoaded ? "visible" : "hidden"}
            variants={containerVariants}
            className="rounded-2xl bg-white/5 border border-white/10 overflow-hidden backdrop-blur-sm"
          >
            {/* Track Controls Header */}
            <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                {/* Toggle FG/BG Button - Main toggle for switching active track */}
                <button
                  onClick={handleToggleFgBg}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 text-white text-sm font-medium border",
                    activeTrack === 'fg' 
                      ? "bg-gradient-to-r from-cyan-500/30 to-cyan-500/10 border-cyan-500/50 hover:from-cyan-500/40 hover:to-cyan-500/20"
                      : "bg-gradient-to-r from-pink-500/30 to-pink-500/10 border-pink-500/50 hover:from-pink-500/40 hover:to-pink-500/20"
                  )}
                >
                  <Layers className="w-4 h-4" />
                  <span>TOGGLE FO/BG</span>
                  <span className={cn(
                    "ml-1 px-2 py-0.5 rounded text-xs font-bold",
                    activeTrack === 'fg' ? "bg-cyan-500/30 text-cyan-300" : "bg-pink-500/30 text-pink-300"
                  )}>
                    {activeTrack === 'fg' ? 'FG' : 'BG'}
                  </span>
                </button>
                
                {/* Separate Audio Button */}
                {!fgAudioUrl && !isFgBgLoading && (
                  <button
                    onClick={handleFetchFgBgWaveforms}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-purple-500/20 to-cyan-500/20 hover:from-purple-500/30 hover:to-cyan-500/30 border border-purple-500/30 transition-colors text-white text-sm font-medium"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Separate Audio
                  </button>
                )}
                {isFgBgLoading && (
                  <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 text-white/50 text-sm">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Separating audio...
                  </div>
                )}
                {fgAudioUrl && (
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-500/20 text-green-400 text-xs font-medium">
                    <CheckCircle className="w-3 h-3" />
                    Audio Separated
                  </div>
                )}
                {fgBgError && (
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500/20 text-red-400 text-xs font-medium">
                    <AlertCircle className="w-3 h-3" />
                    {fgBgError}
                </div>
              )}
              
              {/* Download Report Button */}
              <button
                onClick={handleDownloadReport}
                disabled={isDownloadingReport || !audioFile}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-500/20 to-green-500/20 hover:from-emerald-500/30 hover:to-green-500/30 border border-emerald-500/30 transition-colors text-white text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDownloadingReport ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Downloading...
                  </>
                ) : (
                  <>
                    <FileDown className="w-4 h-4" />
                    DOWNLOAD REPORT
                  </>
                )}
              </button>
              {reportError && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500/20 text-red-400 text-xs font-medium">
                  <AlertCircle className="w-3 h-3" />
                  {reportError}
                </div>
              )}
            </div>
            
            {/* Track Legend and Volume Controls */}
            <div className="flex items-center gap-4">
                {/* Foreground track */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setFgVisible(!fgVisible)}
                    className={cn(
                      "flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all duration-300 text-sm",
                      fgVisible 
                        ? activeTrack === 'fg' 
                          ? "bg-cyan-500/30 text-cyan-300 border border-cyan-500/40" 
                          : "bg-cyan-500/10 text-cyan-300/60 border border-cyan-500/20"
                        : "bg-white/5 text-white/40"
                    )}
                  >
                    {fgVisible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    <span className={cn(
                      "w-2 h-2 rounded-full transition-all duration-300",
                      activeTrack === 'fg' ? "bg-cyan-400" : "bg-cyan-400/40"
                    )} />
                    FG
                  </button>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.1}
                    value={fgVolume}
                    onChange={(e) => setFgVolume(parseFloat(e.target.value))}
                    className="w-16 h-1 accent-cyan-500"
                  />
                </div>
                
                {/* Background track */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setBgVisible(!bgVisible)}
                    className={cn(
                      "flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all duration-300 text-sm",
                      bgVisible 
                        ? activeTrack === 'bg' 
                          ? "bg-pink-500/30 text-pink-300 border border-pink-500/40" 
                          : "bg-pink-500/10 text-pink-300/60 border border-pink-500/20"
                        : "bg-white/5 text-white/40"
                    )}
                  >
                    {bgVisible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    <span className={cn(
                      "w-2 h-2 rounded-full transition-all duration-300",
                      activeTrack === 'bg' ? "bg-pink-400" : "bg-pink-400/40"
                    )} />
                    BG
                  </button>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.1}
                    value={bgVolume}
                    onChange={(e) => setBgVolume(parseFloat(e.target.value))}
                    className="w-16 h-1 accent-pink-500"
                  />
                </div>
              </div>
            </div>

            {/* Waveform Display */}
            <div className="p-6">
              {/* Audio file info */}
              {audioFile && (
                <div className="mb-4 flex items-center gap-2 text-white/60 text-sm">
                  <Mic className="w-4 h-4" />
                  <span>{audioFile.name}</span>
                  {duration > 0 && <span className="text-white/40">• {formatTime(duration)}</span>}
                </div>
              )}
              
              {/* Track legend - shows when we have separated audio */}
              {fgAudioUrl && bgAudioUrl && (
                <div className="flex items-center gap-6 mb-3">
                  <div className={cn(
                    "flex items-center gap-2 text-xs transition-all duration-300",
                    activeTrack === 'fg' ? "opacity-100" : "opacity-40"
                  )}>
                    <span className={cn(
                      "w-3 h-3 rounded-full transition-all duration-300",
                      activeTrack === 'fg' ? "bg-cyan-400 shadow-lg shadow-cyan-500/50" : "bg-cyan-400/50"
                    )} />
                    <span className={cn(
                      "transition-all duration-300",
                      activeTrack === 'fg' ? "text-cyan-300 font-medium" : "text-cyan-300/50"
                    )}>Foreground (Speech/Voice)</span>
                  </div>
                  <div className={cn(
                    "flex items-center gap-2 text-xs transition-all duration-300",
                    activeTrack === 'bg' ? "opacity-100" : "opacity-40"
                  )}>
                    <span className={cn(
                      "w-3 h-3 rounded-full transition-all duration-300",
                      activeTrack === 'bg' ? "bg-pink-400 shadow-lg shadow-pink-500/50" : "bg-pink-400/50"
                    )} />
                    <span className={cn(
                      "transition-all duration-300",
                      activeTrack === 'bg' ? "text-pink-300 font-medium" : "text-pink-300/50"
                    )}>Background (Ambient/Noise)</span>
                  </div>
                  <div className="ml-auto text-xs text-white/40">
                    Active: <span className={activeTrack === 'fg' ? "text-cyan-400" : "text-pink-400"}>{activeTrack === 'fg' ? 'Foreground' : 'Background'}</span>
                  </div>
                </div>
              )}
              
              <div 
                className="relative rounded-xl overflow-hidden"
                style={{ background: 'linear-gradient(180deg, rgba(13,13,26,0.8) 0%, rgba(10,10,15,0.9) 100%)' }}
              >
                {/* Loading state */}
                {isWaveformLoading && (
                  <div className="absolute inset-0 flex items-center justify-center z-10 bg-black/50">
                    <div className="flex items-center gap-3 text-white/70">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Loading audio waveform...</span>
                    </div>
                  </div>
                )}
                
                {/* Error state */}
                {waveformError && (
                  <div className="absolute inset-0 flex items-center justify-center z-10 bg-black/50 min-h-[120px]">
                    <div className="flex flex-col items-center gap-3 text-center px-4">
                      <AlertCircle className="w-8 h-8 text-red-400" />
                      <span className="text-white/70">{waveformError}</span>
                      <Link 
                        href="/upload"
                        className="px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 rounded-lg text-purple-300 text-sm transition-colors"
                      >
                        Go to Upload
                      </Link>
                    </div>
                  </div>
                )}
                
                {/* Stacked waveforms - FG on top, BG below */}
                <div className="space-y-2 p-3">
                  {/* Foreground Waveform */}
                  <div className={cn(
                    "rounded-lg p-2 transition-all duration-300",
                    activeTrack === 'fg' ? "bg-cyan-500/10 ring-1 ring-cyan-500/30" : "bg-white/5",
                    fgAudioUrl && bgAudioUrl ? "" : "bg-purple-500/10"
                  )}>
                    {fgAudioUrl && bgAudioUrl && (
                      <div className="flex items-center justify-between mb-1 px-1">
                        <span className={cn(
                          "text-xs font-medium",
                          activeTrack === 'fg' ? "text-cyan-400" : "text-cyan-400/50"
                        )}>
                          FOREGROUND
                        </span>
                        <button
                          onClick={() => setActiveTrack('fg')}
                          className={cn(
                            "text-xs px-2 py-0.5 rounded transition-colors",
                            activeTrack === 'fg' ? "bg-cyan-500/30 text-cyan-300" : "bg-white/10 text-white/50 hover:bg-white/20"
                          )}
                        >
                          {activeTrack === 'fg' ? '● ACTIVE' : 'SELECT'}
                        </button>
                      </div>
                    )}
                    <div 
                      ref={fgWaveformContainerRef}
                      className={cn(
                        "w-full",
                        fgAudioUrl && bgAudioUrl ? "min-h-[80px]" : "min-h-[100px]"
                      )}
                    />
                  </div>
                  
                  {/* Background Waveform - only show when separated */}
                  {fgAudioUrl && bgAudioUrl && (
                    <div className={cn(
                      "rounded-lg p-2 transition-all duration-300",
                      activeTrack === 'bg' ? "bg-pink-500/10 ring-1 ring-pink-500/30" : "bg-white/5"
                    )}>
                      <div className="flex items-center justify-between mb-1 px-1">
                        <span className={cn(
                          "text-xs font-medium",
                          activeTrack === 'bg' ? "text-pink-400" : "text-pink-400/50"
                        )}>
                          BACKGROUND
                        </span>
                        <button
                          onClick={() => setActiveTrack('bg')}
                          className={cn(
                            "text-xs px-2 py-0.5 rounded transition-colors",
                            activeTrack === 'bg' ? "bg-pink-500/30 text-pink-300" : "bg-white/10 text-white/50 hover:bg-white/20"
                          )}
                        >
                          {activeTrack === 'bg' ? '● ACTIVE' : 'SELECT'}
                        </button>
                      </div>
                      <div 
                        ref={bgWaveformContainerRef}
                        className="w-full min-h-[80px]"
                      />
                    </div>
                  )}
                </div>
                
                {/* Overlay gradient for visual polish */}
                <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/10 via-transparent to-black/5" />
              </div>

              {/* Playback Controls */}
              <div className="mt-6 flex items-center justify-center gap-4">
                <button 
                  onClick={skipBackward}
                  disabled={!isWaveformReady}
                  className="p-2 rounded-full hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <SkipBack className="w-5 h-5 text-white/70" />
                </button>
                
                <button 
                  onClick={togglePlay}
                  disabled={!isWaveformReady}
                  className="p-4 rounded-full bg-white/10 hover:bg-white/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isPlaying ? (
                    <Pause className="w-6 h-6 text-white" />
                  ) : (
                    <Play className="w-6 h-6 text-white ml-0.5" />
                  )}
                </button>
                
                <button 
                  onClick={skipForward}
                  disabled={!isWaveformReady}
                  className="p-2 rounded-full hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <SkipForward className="w-5 h-5 text-white/70" />
                </button>

                {/* Current time display */}
                <div className="ml-4 text-white/70 text-sm font-mono">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </div>

                <div className="ml-6 flex items-center gap-2">
                  <button onClick={() => setIsMuted(!isMuted)}>
                    {isMuted ? (
                      <VolumeX className="w-5 h-5 text-white/50" />
                    ) : (
                      <Volume2 className="w-5 h-5 text-white/70" />
                    )}
                  </button>
                  <input 
                    type="range"
                    min={0}
                    max={1}
                    step={0.1}
                    value={isMuted ? 0 : volume}
                    onChange={(e) => {
                      setVolume(parseFloat(e.target.value))
                      setIsMuted(false)
                    }}
                    className="w-20 accent-purple-500"
                  />
                </div>

                <div className="ml-auto text-white/60 text-sm font-mono">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </div>
              </div>
            </div>
          </motion.div>

          {/* ============================================ */}
          {/* DEEPFAKE & EMOTION ANALYSIS SECTION */}
          {/* ============================================ */}
          <motion.div
            custom={1}
            initial="hidden"
            animate={isLoaded ? "visible" : "hidden"}
            variants={containerVariants}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          >
            {/* Deepfake/Authenticity Analysis Box */}
            <div className="rounded-2xl bg-white/5 border border-white/10 overflow-hidden backdrop-blur-sm p-6">
              <div className="flex items-center gap-3 mb-4">
                <Shield className="w-5 h-5 text-cyan-400" />
                <h3 className="text-white font-semibold uppercase tracking-wider text-sm">Audio Authenticity</h3>
                {isDeepfakeLoading && <Loader2 className="w-4 h-4 text-white/50 animate-spin ml-auto" />}
                {!deepfakeData && !isDeepfakeLoading && (
                  <button
                    onClick={handleFetchDeepfake}
                    className="ml-auto px-3 py-1.5 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5"
                  >
                    <Play className="w-3 h-3" />
                    Run Analysis
                  </button>
                )}
              </div>
              
              {deepfakeError ? (
                <div className="flex items-center gap-3 p-4 bg-red-500/10 rounded-xl border border-red-500/20">
                  <AlertCircle className="w-5 h-5 text-red-400" />
                  <p className="text-red-300 text-sm">{deepfakeError}</p>
                </div>
              ) : isDeepfakeLoading ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 text-cyan-400 animate-spin mb-3" />
                  <p className="text-white/50 text-sm">Analyzing authenticity...</p>
                </div>
              ) : deepfakeData ? (
                <div className="space-y-4">
                  {/* Main Result */}
                  <div className={cn(
                    "p-4 rounded-xl border flex items-center gap-4",
                    deepfakeData.prediction.label.toLowerCase() === 'real' 
                      ? "bg-green-500/10 border-green-500/30"
                      : deepfakeData.prediction.label.toLowerCase() === 'fake'
                      ? "bg-red-500/10 border-red-500/30"
                      : "bg-amber-500/10 border-amber-500/30"
                  )}>
                    {deepfakeData.prediction.label.toLowerCase() === 'real' ? (
                      <ShieldCheck className="w-10 h-10 text-green-400" />
                    ) : deepfakeData.prediction.label.toLowerCase() === 'fake' ? (
                      <ShieldAlert className="w-10 h-10 text-red-400" />
                    ) : (
                      <Shield className="w-10 h-10 text-amber-400" />
                    )}
                    <div className="flex-1">
                      <div className={cn(
                        "text-2xl font-bold uppercase",
                        deepfakeData.prediction.label.toLowerCase() === 'real' 
                          ? "text-green-400"
                          : deepfakeData.prediction.label.toLowerCase() === 'fake'
                          ? "text-red-400"
                          : "text-amber-400"
                      )}>
                        {deepfakeData.prediction.label}
                      </div>
                      <div className="text-white/50 text-sm">
                        Confidence: {(deepfakeData.prediction.score * 100).toFixed(1)}%
                      </div>
                    </div>
                    {deepfakeData.prediction.label.toLowerCase() === 'real' ? (
                      <CheckCircle className="w-6 h-6 text-green-400" />
                    ) : (
                      <XCircle className="w-6 h-6 text-red-400" />
                    )}
                  </div>
                  
                  {/* Top K Predictions */}
                  {deepfakeData.top_k && deepfakeData.top_k.length > 1 && (
                    <div className="pt-3 border-t border-white/10">
                      <div className="text-white/40 text-xs uppercase mb-2">All Predictions</div>
                      <div className="space-y-2">
                        {deepfakeData.top_k.map((pred, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <span className="text-white/60 text-sm w-16">{pred.label}</span>
                            <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                              <div 
                                className={cn(
                                  "h-full rounded-full transition-all",
                                  pred.label.toLowerCase() === 'real' ? "bg-green-500" : "bg-red-500"
                                )}
                                style={{ width: `${pred.score * 100}%` }}
                              />
                            </div>
                            <span className="text-white/40 text-xs w-12 text-right">
                              {(pred.score * 100).toFixed(1)}%
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8">
                  <Shield className="w-8 h-8 text-white/20 mb-3" />
                  <p className="text-white/50 text-sm">No authenticity data available</p>
                </div>
              )}
            </div>

            {/* Emotion Analysis Box - Enhanced with Mood Wheel */}
            <div className="rounded-2xl bg-white/5 border border-white/10 overflow-hidden backdrop-blur-sm p-6">
              <div className="flex items-center gap-3 mb-4">
                <Heart className="w-5 h-5 text-pink-400" />
                <h3 className="text-white font-semibold uppercase tracking-wider text-sm">Emotion Analysis</h3>
                {isEmotionLoading && <Loader2 className="w-4 h-4 text-white/50 animate-spin ml-auto" />}
                {!emotionData && !isEmotionLoading && (
                  <button
                    onClick={handleFetchEmotion}
                    className="ml-auto px-3 py-1.5 bg-pink-500/20 hover:bg-pink-500/30 text-pink-400 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5"
                  >
                    <Play className="w-3 h-3" />
                    Run Analysis
                  </button>
                )}
                {emotionData && !isEmotionLoading && (
                  <button
                    onClick={handleFetchEmotion}
                    className="ml-auto px-2 py-1 bg-white/10 hover:bg-white/20 text-white/50 rounded-lg text-xs transition-colors"
                  >
                    <RefreshCw className="w-3 h-3" />
                  </button>
                )}
              </div>
              
              {emotionError ? (
                <div className="flex items-center gap-3 p-4 bg-red-500/10 rounded-xl border border-red-500/20">
                  <AlertCircle className="w-5 h-5 text-red-400" />
                  <p className="text-red-300 text-sm">{emotionError}</p>
                </div>
              ) : isEmotionLoading ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 text-pink-400 animate-spin mb-3" />
                  <p className="text-white/50 text-sm">Analyzing emotions...</p>
                </div>
              ) : emotionData ? (
                <div className="space-y-6">
                  {(() => {
                    // Parse emotion data - handle multiple formats
                    const prediction = (emotionData as any).prediction
                    const probabilitiesArray = (emotionData as any).probabilities
                    const timeline = emotionData.timeline || []
                    
                    // Build emotion stats
                    let emotionStats: { emotion: string; percentage: number; color: string; label: string }[] = []
                    
                    if (prediction && probabilitiesArray && Array.isArray(probabilitiesArray)) {
                      emotionStats = probabilitiesArray.map((p: { label: string; score: number }) => {
                        const wheelConfig = EMOTION_WHEEL_COLORS[p.label.toLowerCase()] || { color: '#8B5CF6', label: p.label }
                        return {
                          emotion: p.label,
                          percentage: p.score * 100,
                          color: wheelConfig.color,
                          label: wheelConfig.label
                        }
                      }).sort((a: { percentage: number }, b: { percentage: number }) => b.percentage - a.percentage)
                    } else if (timeline.length > 0) {
                      const counts: Record<string, number> = {}
                      timeline.forEach(t => {
                        const e = t.smoothed_emotion || t.raw_emotion
                        if (e) counts[e] = (counts[e] || 0) + 1
                      })
                      const total = timeline.length
                      emotionStats = Object.entries(counts).map(([emotion, count]) => {
                        const wheelConfig = EMOTION_WHEEL_COLORS[emotion.toLowerCase()] || { color: '#8B5CF6', label: emotion }
                        return {
                          emotion,
                          percentage: (count / total) * 100,
                          color: wheelConfig.color,
                          label: wheelConfig.label
                        }
                      }).sort((a, b) => b.percentage - a.percentage)
                    }

                    const dominantEmotion = emotionStats[0]
                    const totalPercentage = emotionStats.reduce((sum, e) => sum + e.percentage, 0)
                    
                    // Calculate ring segments
                    let cumulativePercentage = 0
                    const ringSegments = emotionStats.map(stat => {
                      const startAngle = (cumulativePercentage / totalPercentage) * 360
                      const endAngle = ((cumulativePercentage + stat.percentage) / totalPercentage) * 360
                      cumulativePercentage += stat.percentage
                      return { ...stat, startAngle, endAngle }
                    })

                    return (
                      <>
                        {/* Mood Wheel + Legend */}
                        <div className="flex items-center gap-6">
                          {/* SVG Mood Ring */}
                          <div className="relative w-36 h-36 flex-shrink-0">
                            <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                              {/* Background circle */}
                              <circle
                                cx="50"
                                cy="50"
                                r="40"
                                fill="none"
                                stroke="rgba(255,255,255,0.1)"
                                strokeWidth="12"
                              />
                              {/* Emotion segments */}
                              {ringSegments.map((segment, idx) => {
                                const radius = 40
                                const circumference = 2 * Math.PI * radius
                                const segmentLength = ((segment.endAngle - segment.startAngle) / 360) * circumference
                                const offset = (segment.startAngle / 360) * circumference
                                
                                return (
                                  <circle
                                    key={idx}
                                    cx="50"
                                    cy="50"
                                    r={radius}
                                    fill="none"
                                    stroke={segment.color}
                                    strokeWidth="12"
                                    strokeDasharray={`${segmentLength} ${circumference - segmentLength}`}
                                    strokeDashoffset={-offset}
                                    className="transition-all duration-500 hover:opacity-80 cursor-pointer"
                                    style={{ filter: 'drop-shadow(0 0 3px ' + segment.color + '40)' }}
                                  >
                                    <title>{segment.label}: {segment.percentage.toFixed(1)}%</title>
                                  </circle>
                                )
                              })}
                            </svg>
                            {/* Center content */}
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                              {dominantEmotion && (
                                <>
                                  <span className="text-2xl mb-1">
                                    {dominantEmotion.emotion === 'ang' || dominantEmotion.emotion === 'angry' ? '😠' :
                                     dominantEmotion.emotion === 'hap' || dominantEmotion.emotion === 'happy' ? '😊' :
                                     dominantEmotion.emotion === 'sad' || dominantEmotion.emotion === 'sadness' ? '😢' :
                                     dominantEmotion.emotion === 'fear' ? '😨' : '😐'}
                                  </span>
                                  <span className="text-white/80 text-xs font-medium">{dominantEmotion.label}</span>
                                </>
                              )}
                            </div>
                          </div>
                          
                          {/* Legend */}
                          <div className="flex-1 space-y-2">
                            <div className="text-white/40 text-xs uppercase tracking-wider mb-3">Distribution</div>
                            {emotionStats.map((stat, idx) => (
                              <div 
                                key={idx} 
                                className="flex items-center gap-3 group cursor-pointer hover:bg-white/5 rounded-lg p-1.5 -m-1.5 transition-colors"
                                onClick={() => {
                                  // Find first timeline entry with this emotion and seek to it
                                  if (timeline.length > 0) {
                                    const entry = timeline.find(t => 
                                      (t.smoothed_emotion || t.raw_emotion)?.toLowerCase() === stat.emotion.toLowerCase()
                                    )
                                    if (entry && fgWavesurferRef.current) {
                                      fgWavesurferRef.current.setTime(entry.start_time || 0)
                                      setCurrentTime(entry.start_time || 0)
                                    }
                                  }
                                }}
                              >
                                <div 
                                  className="w-3 h-3 rounded-full flex-shrink-0"
                                  style={{ backgroundColor: stat.color, boxShadow: `0 0 8px ${stat.color}40` }}
                                />
                                <span className="text-white/70 text-sm flex-1">{stat.label}</span>
                                <span className="text-white/50 text-sm font-mono">{stat.percentage.toFixed(1)}%</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Emotion Timeline Bar */}
                        {timeline.length > 0 && (
                          <div className="space-y-2">
                            <div className="text-white/40 text-xs uppercase tracking-wider">Timeline</div>
                            <div className="relative group">
                              <div className="h-6 rounded-full overflow-hidden flex bg-white/5 cursor-pointer">
                                {timeline.map((item, idx) => {
                                  const emotion = item.smoothed_emotion || item.raw_emotion || 'neu'
                                  const wheelConfig = EMOTION_WHEEL_COLORS[emotion.toLowerCase()] || { color: '#8B5CF6', label: emotion }
                                  const totalDuration = timeline[timeline.length - 1]?.end_time || 1
                                  const width = ((item.end_time - item.start_time) / totalDuration) * 100
                                  
                                  return (
                                    <div
                                      key={idx}
                                      className="h-full transition-all hover:brightness-125"
                                      style={{ 
                                        width: `${width}%`, 
                                        minWidth: '2px',
                                        backgroundColor: wheelConfig.color + '80'
                                      }}
                                      title={`${wheelConfig.label} (${item.start_time?.toFixed(1)}s - ${item.end_time?.toFixed(1)}s)`}
                                      onClick={() => {
                                        if (fgWavesurferRef.current) {
                                          fgWavesurferRef.current.setTime(item.start_time || 0)
                                          setCurrentTime(item.start_time || 0)
                                        }
                                      }}
                                    />
                                  )
                                })}
                              </div>
                              <div className="flex justify-between mt-1">
                                <span className="text-white/30 text-[10px]">0:00</span>
                                <span className="text-white/30 text-[10px]">
                                  {formatTime(timeline[timeline.length - 1]?.end_time || 0)}
                                </span>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* No data */}
                        {emotionStats.length === 0 && (
                          <div className="text-center py-6 bg-white/5 rounded-xl">
                            <Heart className="w-8 h-8 text-white/20 mx-auto mb-2" />
                            <p className="text-white/50 text-sm">No emotion data detected</p>
                          </div>
                        )}
                      </>
                    )
                  })()}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8">
                  <Heart className="w-8 h-8 text-white/20 mb-3" />
                  <p className="text-white/50 text-sm">Click "Run Analysis" to analyze emotions</p>
                </div>
              )}
            </div>
          </motion.div>

          {/* ============================================ */}
          {/* BACKGROUND EVENTS ANALYSIS SECTION - HIDDEN FOR NOW */}
          {/* ============================================ */}
          {false && (
          <motion.div
            custom={1.5}
            initial="hidden"
            animate={isLoaded ? "visible" : "hidden"}
            variants={containerVariants}
            className="rounded-2xl bg-white/5 border border-white/10 overflow-hidden backdrop-blur-sm p-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <Layers className="w-5 h-5 text-emerald-400" />
              <h3 className="text-white font-semibold uppercase tracking-wider text-sm">Background Events & Scene Analysis</h3>
              {isBackgroundLoading && <Loader2 className="w-4 h-4 text-white/50 animate-spin ml-auto" />}
              {!backgroundData && !isBackgroundLoading && (
                <button
                  onClick={handleFetchBackground}
                  className="ml-auto px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5"
                >
                  <Play className="w-3 h-3" />
                  Run Analysis
                </button>
              )}
            </div>

            {backgroundError ? (
              <div className="flex items-center gap-3 p-4 bg-red-500/10 rounded-xl border border-red-500/20">
                <AlertCircle className="w-5 h-5 text-red-400" />
                <p className="text-red-300 text-sm">{backgroundError}</p>
              </div>
            ) : isBackgroundLoading ? (
              <div className="flex flex-col items-center justify-center py-8">
                <Loader2 className="w-6 h-6 text-emerald-400 animate-spin mb-3" />
                <p className="text-white/50 text-sm">Analyzing background sounds and events...</p>
              </div>
            ) : backgroundData ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Environment Info */}
                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                  <div className="text-white/50 text-xs uppercase tracking-wider mb-3">Environment</div>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                      <Globe className="w-6 h-6 text-emerald-400" />
                    </div>
                    <div className="flex-1">
                      <div className="text-white font-semibold text-lg capitalize">
                        {backgroundData.environment?.primary || 'Unknown'}
                      </div>
                      <div className="text-white/50 text-xs">
                        {backgroundData.environment?.confidence 
                          ? `${(backgroundData.environment.confidence * 100).toFixed(1)}% confidence`
                          : 'Primary scene detected'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Events Summary */}
                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                  <div className="text-white/50 text-xs uppercase tracking-wider mb-3">Events Detected</div>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                      <Activity className="w-6 h-6 text-blue-400" />
                    </div>
                    <div className="flex-1">
                      <div className="text-white font-semibold text-lg">
                        {backgroundData.events?.length || 0} Events
                      </div>
                      <div className="text-white/50 text-xs">
                        {backgroundData.threats?.length || 0} potential threats
                      </div>
                    </div>
                  </div>
                </div>

                {/* Processing Stats */}
                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                  <div className="text-white/50 text-xs uppercase tracking-wider mb-3">Analysis Stats</div>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
                      <Zap className="w-6 h-6 text-purple-400" />
                    </div>
                    <div className="flex-1">
                      <div className="text-white font-semibold text-lg">
                        {backgroundData.scene_analysis?.total_time_ms 
                          ? `${(backgroundData.scene_analysis.total_time_ms / 1000).toFixed(2)}s`
                          : 'N/A'}
                      </div>
                      <div className="text-white/50 text-xs">
                        Processing time
                      </div>
                    </div>
                  </div>
                </div>

                {/* Events Timeline */}
                {backgroundData.events && backgroundData.events.length > 0 && (
                  <div className="lg:col-span-3 p-4 rounded-xl bg-white/5 border border-white/10">
                    <div className="text-white/50 text-xs uppercase tracking-wider mb-4">Event Timeline</div>
                    <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                      {backgroundData.events.map((event, idx) => (
                        <div 
                          key={idx} 
                          className={cn(
                            "flex items-center gap-3 p-3 rounded-lg border transition-colors",
                            event.is_threat 
                              ? "bg-red-500/10 border-red-500/30 hover:bg-red-500/15" 
                              : "bg-white/5 border-white/10 hover:bg-white/10"
                          )}
                        >
                          {/* Time */}
                          <div className="text-white/40 text-xs font-mono w-28 shrink-0">
                            {event.start_time.toFixed(1)}s → {event.end_time.toFixed(1)}s
                          </div>
                          
                          {/* Event Label */}
                          <div className="flex-1 flex items-center gap-2">
                            <span className={cn(
                              "font-medium",
                              event.is_threat ? "text-red-400" : "text-white"
                            )}>
                              {event.label}
                            </span>
                            {event.is_threat && (
                              <span className={cn(
                                "px-2 py-0.5 rounded text-[10px] font-semibold uppercase",
                                event.threat_priority === 'CRITICAL' && "bg-red-500/30 text-red-300",
                                event.threat_priority === 'HIGH' && "bg-orange-500/30 text-orange-300",
                                event.threat_priority === 'MEDIUM' && "bg-amber-500/30 text-amber-300",
                                event.threat_priority === 'NONE' && "bg-gray-500/30 text-gray-300"
                              )}>
                                {event.threat_priority}
                              </span>
                            )}
                          </div>
                          
                          {/* Confidence */}
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden">
                              <div 
                                className={cn(
                                  "h-full rounded-full",
                                  event.is_threat ? "bg-red-500" : "bg-emerald-500"
                                )}
                                style={{ width: `${event.confidence * 100}%` }}
                              />
                            </div>
                            <span className="text-white/40 text-xs w-12 text-right">
                              {(event.confidence * 100).toFixed(0)}%
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Threats Section */}
                {backgroundData.threats && backgroundData.threats.length > 0 && (
                  <div className="lg:col-span-3 p-4 rounded-xl bg-red-500/10 border border-red-500/30">
                    <div className="flex items-center gap-2 mb-4">
                      <ShieldAlert className="w-5 h-5 text-red-400" />
                      <span className="text-red-400 text-xs uppercase tracking-wider font-semibold">
                        Threat Alerts ({backgroundData.threats.length})
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {backgroundData.threats.map((threat, idx) => (
                        <div 
                          key={idx} 
                          className="p-3 rounded-lg bg-red-500/10 border border-red-500/20"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-red-300 font-medium">{threat.label}</span>
                            <span className={cn(
                              "px-2 py-0.5 rounded text-[10px] font-semibold uppercase",
                              threat.threat_priority === 'CRITICAL' && "bg-red-500/40 text-red-200",
                              threat.threat_priority === 'HIGH' && "bg-orange-500/40 text-orange-200",
                              threat.threat_priority === 'MEDIUM' && "bg-amber-500/40 text-amber-200"
                            )}>
                              {threat.threat_priority}
                            </span>
                          </div>
                          <div className="text-white/50 text-xs">
                            {threat.start_time.toFixed(1)}s - {threat.end_time.toFixed(1)}s • {(threat.confidence * 100).toFixed(0)}% confidence
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* No Events */}
                {(!backgroundData.events || backgroundData.events.length === 0) && (
                  <div className="lg:col-span-3 text-center py-6 bg-white/5 rounded-xl">
                    <Layers className="w-8 h-8 text-white/20 mx-auto mb-2" />
                    <p className="text-white/50 text-sm">No significant background events detected</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8">
                <Layers className="w-8 h-8 text-white/20 mb-3" />
                <p className="text-white/50 text-sm">Click "Run Analysis" to detect background events and scene</p>
              </div>
            )}
          </motion.div>
          )}

          {/* ============================================ */}
          {/* BOTTOM SECTION - Diarization & Chat */}
          {/* ============================================ */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* LEFT: Diarization Panel */}
            <motion.div
              custom={2}
              initial="hidden"
              animate={isLoaded ? "visible" : "hidden"}
              variants={containerVariants}
              className="rounded-2xl bg-white/5 border border-white/10 overflow-hidden backdrop-blur-sm flex flex-col h-[500px]"
            >
              <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between shrink-0">
                <h2 className="text-white font-semibold uppercase tracking-wider text-sm">Speaker Diarization</h2>
                <div className="flex items-center gap-2">
                  {isDiarizationLoading && (
                    <div className="flex items-center gap-2 text-white/50 text-xs">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Loading...
                    </div>
                  )}
                  {!diarizationData && !isDiarizationLoading && (
                    <button
                      onClick={handleFetchDiarization}
                      className="px-3 py-1.5 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5"
                    >
                      <Play className="w-3 h-3" />
                      Run Diarization
                    </button>
                  )}
                  {diarizationData && (
                    <button
                      onClick={handleFetchDiarization}
                      className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white/60 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5"
                    >
                      <RefreshCw className="w-3 h-3" />
                      Refresh
                    </button>
                  )}
                </div>
              </div>

              {/* Metadata Summary */}
              {diarizationData?.metadata && (
                <div className="px-6 py-3 border-b border-white/10 bg-white/5 shrink-0">
                  <div className="flex flex-wrap gap-4 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-white/40">Speakers:</span>
                      <span className="text-purple-400 font-semibold">{diarizationData.metadata.num_speakers}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-white/40">Language:</span>
                      <span className="text-cyan-400 font-semibold uppercase">{diarizationData.metadata.language}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-white/40">Duration:</span>
                      <span className="text-white/70">{formatTime(diarizationData.metadata.total_duration || 0)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-white/40">Segments:</span>
                      <span className="text-white/70">{diarizationData.metadata.num_segments}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Diarization Content - Chat Bubble Style */}
              <div className="p-4 space-y-4 flex-1 overflow-y-auto min-h-0">
                {diarizationError ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <AlertCircle className="w-8 h-8 text-red-400 mb-3" />
                    <p className="text-white/70 text-sm">{diarizationError}</p>
                    <button
                      onClick={handleFetchDiarization}
                      className="mt-4 px-4 py-2 bg-white/10 rounded-lg text-white/70 text-sm hover:bg-white/20 transition-colors flex items-center gap-2"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Retry
                    </button>
                  </div>
                ) : isDiarizationLoading ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 text-purple-400 animate-spin mb-4" />
                    <p className="text-white/60 text-sm">Running speaker diarization...</p>
                    <p className="text-white/40 text-xs mt-1">Identifying speakers and transcribing...</p>
                  </div>
                ) : diarizationData?.speakers ? (
                  // Chat Bubble Style Diarization
                  (() => {
                    // Collect all segments with speaker info
                    const allSegments: Array<{
                      speakerId: string;
                      segment: SpeakerSegment;
                      speakerNumber: number;
                    }> = [];
                    
                    // Helper to get speaker number from ID
                    const getSpeakerNumber = (speakerId: string): number => {
                      const match = speakerId.match(/(\d+)$/);
                      if (match) {
                        return parseInt(match[1], 10);
                      }
                      return Object.keys(diarizationData.speakers).sort().indexOf(speakerId);
                    };
                    
                    // Flatten segments from all speakers
                    Object.entries(diarizationData.speakers).forEach(([speakerId, speakerInfo]: [string, SpeakerInfo]) => {
                      speakerInfo.segments.forEach((segment) => {
                        allSegments.push({
                          speakerId,
                          segment,
                          speakerNumber: getSpeakerNumber(speakerId),
                        });
                      });
                    });
                    
                    // Sort by start_time for chronological order
                    allSegments.sort((a, b) => a.segment.start_time - b.segment.start_time);
                    
                    // Get unique speakers for legend
                    const uniqueSpeakers = [...new Set(allSegments.map(s => s.speakerId))].sort();

                    // Default color fallback
                    const defaultColor = { bg: "bg-purple-500/20", border: "border-purple-500/50", text: "text-purple-400", light: "#8B5CF6" };
                    
                    return (
                      <div className="space-y-4">
                        {/* Speaker Legend */}
                        <div className="flex flex-wrap gap-2 p-3 rounded-xl bg-white/5 border border-white/10 sticky top-0 z-10 backdrop-blur-sm">
                          {uniqueSpeakers.map((speakerId) => {
                            const speakerColorObj = SPEAKER_COLORS[speakerId] || defaultColor;
                            const speakerColor = speakerColorObj.light;
                            const speakerNum = getSpeakerNumber(speakerId);
                            return (
                              <div 
                                key={speakerId}
                                className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium"
                                style={{ 
                                  backgroundColor: `${speakerColor}20`,
                                  border: `1px solid ${speakerColor}40`
                                }}
                              >
                                <div 
                                  className="w-2.5 h-2.5 rounded-full"
                                  style={{ backgroundColor: speakerColor }}
                                />
                                <span style={{ color: speakerColor }}>Speaker {speakerNum}</span>
                              </div>
                            );
                          })}
                        </div>

                        {/* Chat Bubbles */}
                        <div className="space-y-3">
                          {allSegments.map((item, index) => {
                            const speakerColorObj = SPEAKER_COLORS[item.speakerId] || defaultColor;
                            const speakerColor = speakerColorObj.light;
                            const isEvenSpeaker = item.speakerNumber % 2 === 0;
                            const segmentDuration = item.segment.end_time - item.segment.start_time;
                            
                            return (
                              <motion.div
                                key={`segment-${item.segment.segment_id}-${index}`}
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                transition={{ delay: index * 0.02, type: "spring", stiffness: 200 }}
                                className={cn(
                                  "flex",
                                  isEvenSpeaker ? "justify-end" : "justify-start"
                                )}
                              >
                                <div 
                                  className={cn(
                                    "max-w-[85%] cursor-pointer group transition-all duration-200",
                                    "hover:scale-[1.02] active:scale-[0.98]"
                                  )}
                                  onClick={() => {
                                    if (fgWavesurferRef.current && bgWavesurferRef.current && isWaveformReady) {
                                      fgWavesurferRef.current.setTime(item.segment.start_time);
                                      bgWavesurferRef.current.setTime(item.segment.start_time);
                                      setCurrentTime(item.segment.start_time);
                                    }
                                  }}
                                >
                                  {/* Chat Bubble */}
                                  <div 
                                    className={cn(
                                      "relative p-3 rounded-2xl shadow-lg",
                                      isEvenSpeaker 
                                        ? "rounded-br-md" 
                                        : "rounded-bl-md"
                                    )}
                                    style={{ 
                                      backgroundColor: `${speakerColor}15`,
                                      border: `1px solid ${speakerColor}30`,
                                      boxShadow: `0 4px 20px ${speakerColor}10`
                                    }}
                                  >
                                    {/* Speaker Badge & Timestamp */}
                                    <div className={cn(
                                      "flex items-center gap-2 mb-2",
                                      isEvenSpeaker ? "flex-row-reverse" : "flex-row"
                                    )}>
                                      <div 
                                        className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
                                        style={{ 
                                          backgroundColor: `${speakerColor}30`,
                                          color: speakerColor
                                        }}
                                      >
                                        <div 
                                          className="w-1.5 h-1.5 rounded-full animate-pulse"
                                          style={{ backgroundColor: speakerColor }}
                                        />
                                        Speaker {item.speakerNumber}
                                      </div>
                                      <div className="flex items-center gap-1 text-white/40 text-[10px] font-mono">
                                        <Play className="w-2.5 h-2.5" />
                                        {formatTime(item.segment.start_time)}
                                        <span className="text-white/20">•</span>
                                        <span className="text-white/30">{segmentDuration.toFixed(1)}s</span>
                                      </div>
                                    </div>
                                    
                                    {/* Transcript Text */}
                                    <div 
                                      className="text-sm leading-relaxed"
                                      style={{ color: `${speakerColor}E0` }}
                                    >
                                      {item.segment.text}
                                    </div>
                                    
                                    {/* English Translation if available */}
                                    {item.segment.translation_en && (
                                      <div 
                                        className="mt-2 pt-2 text-xs italic"
                                        style={{ 
                                          borderTop: `1px dashed ${speakerColor}30`,
                                          color: `${speakerColor}80`
                                        }}
                                      >
                                        <span className="text-white/30 mr-1 not-italic text-[10px]">EN:</span>
                                        {item.segment.translation_en}
                                      </div>
                                    )}
                                  </div>

                                  {/* Timestamp Tail */}
                                  <div className={cn(
                                    "flex items-center gap-1 mt-1 text-[9px] text-white/30",
                                    isEvenSpeaker ? "justify-end pr-2" : "justify-start pl-2"
                                  )}>
                                    <span>{formatTime(item.segment.start_time)} → {formatTime(item.segment.end_time)}</span>
                                  </div>
                                </div>
                              </motion.div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <MessageSquare className="w-8 h-8 text-white/20 mb-3" />
                    <p className="text-white/50 text-sm">No diarization available yet</p>
                    <p className="text-white/30 text-xs mt-1">Click "Run Diarization" to identify speakers</p>
                  </div>
                )}
              </div>
            </motion.div>

            {/* RIGHT: ALM Chat Panel - Enhanced UI */}
            <motion.div
              custom={3}
              initial="hidden"
              animate={isLoaded ? "visible" : "hidden"}
              variants={containerVariants}
              className="rounded-2xl bg-gradient-to-b from-white/[0.08] to-white/[0.02] border border-white/10 overflow-hidden backdrop-blur-sm flex flex-col h-[500px]"
            >
              {/* Header */}
              <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between shrink-0 bg-white/[0.02]">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500/30 to-cyan-500/20 flex items-center justify-center border border-purple-500/20">
                    <Bot className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <h2 className="text-white font-semibold text-sm">ALM Assistant</h2>
                    <p className="text-white/40 text-[10px]">Ask questions about this audio</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-emerald-400 text-[10px] font-medium">Online</span>
                </div>
              </div>

              {/* Chat Messages */}
              <div 
                ref={chatContainerRef}
                className="flex-1 p-4 space-y-4 overflow-y-auto min-h-0"
              >
                {chatMessages.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full text-center py-8">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500/20 to-cyan-500/10 flex items-center justify-center mb-4 border border-purple-500/20">
                      <MessageSquare className="w-8 h-8 text-purple-400/60" />
                    </div>
                    <p className="text-white/50 text-sm font-medium mb-1">Start a conversation</p>
                    <p className="text-white/30 text-xs max-w-[200px]">Ask about speakers, emotions, transcript, or any insights from this audio</p>
                    
                    {/* Quick prompts */}
                    <div className="flex flex-wrap gap-2 mt-4 justify-center">
                      {["Summarize this audio", "Who are the speakers?", "What emotions detected?"].map((prompt) => (
                        <button
                          key={prompt}
                          onClick={() => setChatInput(prompt)}
                          className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/50 text-[10px] hover:bg-white/10 hover:text-white/70 transition-all"
                        >
                          {prompt}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {chatMessages.map((message, index) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ delay: index * 0.05, type: "spring", stiffness: 200 }}
                    className={cn(
                      "flex gap-3",
                      message.role === "user" ? "flex-row-reverse" : ""
                    )}
                  >
                    {/* Avatar */}
                    <div className={cn(
                      "w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-lg",
                      message.role === "user" 
                        ? "bg-gradient-to-br from-purple-500/40 to-purple-600/30 border border-purple-500/30" 
                        : "bg-gradient-to-br from-cyan-500/30 to-blue-500/20 border border-cyan-500/20"
                    )}>
                      {message.role === "user" ? (
                        <User className="w-4 h-4 text-purple-300" />
                      ) : (
                        <Bot className="w-4 h-4 text-cyan-300" />
                      )}
                    </div>

                    {/* Message Bubble */}
                    <div className={cn(
                      "flex-1 max-w-[80%]",
                      message.role === "user" ? "text-right" : ""
                    )}>
                      <div className={cn(
                        "inline-block p-3.5 rounded-2xl text-sm leading-relaxed shadow-lg",
                        message.role === "user"
                          ? "bg-gradient-to-br from-purple-500/30 to-purple-600/20 text-white/90 rounded-br-md border border-purple-500/20"
                          : "bg-gradient-to-br from-white/10 to-white/5 text-white/80 rounded-bl-md border border-white/10"
                      )}>
                        {message.content}
                      </div>
                      <div 
                        className={cn(
                          "text-[10px] text-white/30 mt-1.5 px-1",
                          message.role === "user" ? "text-right" : ""
                        )}
                        suppressHydrationWarning
                      >
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </motion.div>
                ))}

                {/* Typing indicator */}
                {isSending && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex gap-3"
                  >
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-500/30 to-blue-500/20 flex items-center justify-center border border-cyan-500/20">
                      <Bot className="w-4 h-4 text-cyan-300" />
                    </div>
                    <div className="bg-gradient-to-br from-white/10 to-white/5 px-4 py-3 rounded-2xl rounded-bl-md border border-white/10">
                      <div className="flex gap-1.5 items-center">
                        <span className="w-2 h-2 bg-cyan-400/60 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                        <span className="w-2 h-2 bg-cyan-400/60 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                        <span className="w-2 h-2 bg-cyan-400/60 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Chat Input - Enhanced */}
              <div className="p-4 border-t border-white/10 shrink-0 mt-auto bg-gradient-to-t from-black/20 to-transparent">
                <div className="flex items-center gap-2">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSendMessage()}
                      placeholder="Type your message..."
                      className="w-full px-4 py-3 pr-12 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 text-sm focus:outline-none focus:border-purple-500/50 focus:bg-white/[0.08] transition-all"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-white/20 text-[10px]">
                      ⏎
                    </div>
                  </div>
                  <button
                    onClick={handleSendMessage}
                    disabled={!chatInput.trim() || isSending}
                    className={cn(
                      "p-3 rounded-xl transition-all duration-200 shadow-lg",
                      chatInput.trim() && !isSending
                        ? "bg-gradient-to-br from-purple-500 to-purple-600 hover:from-purple-400 hover:to-purple-500 text-white"
                        : "bg-white/5 text-white/30 cursor-not-allowed"
                    )}
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </motion.div>
          </div>

        </div>
      </div>

      {/* Decorative gradient */}
      <div className="fixed bottom-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-[120px] pointer-events-none" />
    </main>
  )
}
