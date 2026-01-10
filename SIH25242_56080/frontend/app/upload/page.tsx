"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAudioStore } from "@/contexts/audio-store"
import { uploadAudioBytes, APIClientError } from "@/lib/api"
import { 
  Upload, 
  Mic, 
  FileAudio, 
  X, 
  Play, 
  Pause,
  ArrowRight,
  Loader2,
  Circle,
  Square,
  Sparkles,
  FileText,
  Users,
  Activity
} from "lucide-react"

export default function UploadPage() {
  const [mode, setMode] = useState<'upload' | 'record'>('upload')
  const [isDragging, setIsDragging] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [duration, setDuration] = useState<number>(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null)
  const [audioChunks, setAudioChunks] = useState<Blob[]>([])
  const [uploadedAudioId, setUploadedAudioId] = useState<string | null>(null) // Store audio_id after upload
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const waveformRef = useRef<HTMLDivElement>(null)
  const wavesurferRef = useRef<any>(null)
  const audioRef = useRef<HTMLAudioElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { addAudioFile, addAnalysis } = useAudioStore()
  const router = useRouter()

  // Initialize WaveSurfer for preview
  useEffect(() => {
    if (!waveformRef.current || !audioUrl) return

    // Delay initialization to allow container animation to complete
    const timer = setTimeout(async () => {
      const WaveSurfer = (await import('wavesurfer.js')).default
      
      if (wavesurferRef.current) {
        wavesurferRef.current.destroy()
      }

      const ws = WaveSurfer.create({
        container: waveformRef.current!,
        height: 80,
        waveColor: 'rgba(255, 255, 255, 0.3)',
        progressColor: 'rgba(147, 51, 234, 0.7)',
        cursorColor: '#fff',
        barWidth: 2,
        barGap: 1,
        barRadius: 2,
        normalize: true,
      })

      wavesurferRef.current = ws

      ws.on('play', () => setIsPlaying(true))
      ws.on('pause', () => setIsPlaying(false))
      ws.on('finish', () => setIsPlaying(false))

      ws.load(audioUrl)
    }, 700) // Wait for animation to complete (delay: 0.2 + duration: 0.4 = 0.6s + buffer)

    return () => {
      clearTimeout(timer)
      wavesurferRef.current?.destroy()
    }
  }, [audioUrl])

  // Helper function to convert audio blob to WAV format
  const convertToWav = async (audioBlob: Blob): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const audioContext = new AudioContext()
      const reader = new FileReader()
      
      reader.onload = async () => {
        try {
          const arrayBuffer = reader.result as ArrayBuffer
          const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)
          
          // Get audio data
          const numberOfChannels = 1 // Mono for simplicity
          const sampleRate = audioBuffer.sampleRate
          const length = audioBuffer.length
          
          // Get channel data (mix to mono if stereo)
          let samples: Float32Array
          if (audioBuffer.numberOfChannels > 1) {
            samples = new Float32Array(length)
            const left = audioBuffer.getChannelData(0)
            const right = audioBuffer.getChannelData(1)
            for (let i = 0; i < length; i++) {
              samples[i] = (left[i] + right[i]) / 2
            }
          } else {
            samples = audioBuffer.getChannelData(0)
          }
          
          // Create WAV file
          const bitsPerSample = 16
          const bytesPerSample = bitsPerSample / 8
          const blockAlign = numberOfChannels * bytesPerSample
          const byteRate = sampleRate * blockAlign
          const dataSize = samples.length * bytesPerSample
          const bufferSize = 44 + dataSize
          
          const buffer = new ArrayBuffer(bufferSize)
          const view = new DataView(buffer)
          
          // Write WAV header
          const writeString = (offset: number, string: string) => {
            for (let i = 0; i < string.length; i++) {
              view.setUint8(offset + i, string.charCodeAt(i))
            }
          }
          
          writeString(0, 'RIFF')
          view.setUint32(4, 36 + dataSize, true)
          writeString(8, 'WAVE')
          writeString(12, 'fmt ')
          view.setUint32(16, 16, true)
          view.setUint16(20, 1, true)
          view.setUint16(22, numberOfChannels, true)
          view.setUint32(24, sampleRate, true)
          view.setUint32(28, byteRate, true)
          view.setUint16(32, blockAlign, true)
          view.setUint16(34, bitsPerSample, true)
          writeString(36, 'data')
          view.setUint32(40, dataSize, true)
          
          // Write audio data
          let offset = 44
          for (let i = 0; i < samples.length; i++) {
            const sample = Math.max(-1, Math.min(1, samples[i]))
            const int16Sample = sample < 0 ? sample * 0x8000 : sample * 0x7FFF
            view.setInt16(offset, int16Sample, true)
            offset += 2
          }
          
          const wavBlob = new Blob([buffer], { type: 'audio/wav' })
          audioContext.close()
          resolve(wavBlob)
        } catch (error) {
          audioContext.close()
          reject(error)
        }
      }
      
      reader.onerror = () => reject(reader.error)
      reader.readAsArrayBuffer(audioBlob)
    })
  }

  // Recording functions
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      const chunks: Blob[] = []

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data)
        }
      }

      recorder.onstop = async () => {
        const webmBlob = new Blob(chunks, { type: 'audio/webm' })
        
        try {
          // Convert WebM to WAV for backend compatibility
          console.log('[Recording] Converting WebM to WAV...')
          const wavBlob = await convertToWav(webmBlob)
          console.log('[Recording] Conversion complete, WAV size:', wavBlob.size)
          
          const url = URL.createObjectURL(wavBlob)
          setAudioUrl(url)
          
          // Create a WAV file from the blob
          const file = new File([wavBlob], `recording-${Date.now()}.wav`, { type: 'audio/wav' })
          setSelectedFile(file)
          
          // Get duration
          const audio = new Audio(url)
          audio.addEventListener('loadedmetadata', () => {
            setDuration(audio.duration)
          })
        } catch (conversionError) {
          console.error('[Recording] Conversion failed, using WebM:', conversionError)
          // Fallback to WebM if conversion fails
          const url = URL.createObjectURL(webmBlob)
          setAudioUrl(url)
          const file = new File([webmBlob], `recording-${Date.now()}.webm`, { type: 'audio/webm' })
          setSelectedFile(file)
          
          const audio = new Audio(url)
          audio.addEventListener('loadedmetadata', () => {
            setDuration(audio.duration)
          })
        }

        // Stop all tracks
        stream.getTracks().forEach(track => track.stop())
      }

      setMediaRecorder(recorder)
      setAudioChunks([])
      recorder.start()
      setIsRecording(true)
      setRecordingTime(0)

      // Start timer
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)
    } catch (error) {
      console.error('Failed to start recording:', error)
      alert('Failed to access microphone. Please check permissions.')
    }
  }

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop()
      setIsRecording(false)
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current)
        recordingIntervalRef.current = null
      }
    }
  }

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    
    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleFileSelect(files[0])
    }
  }, [])

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith('audio/')) {
      alert('Please select an audio file')
      return
    }

    setSelectedFile(file)
    
    // Create object URL for preview
    const url = URL.createObjectURL(file)
    setAudioUrl(url)

    // Get duration using Audio element
    const audio = new Audio(url)
    audio.addEventListener('loadedmetadata', () => {
      setDuration(audio.duration)
    })
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileSelect(e.target.files[0])
    }
  }

  const clearFile = () => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl)
    }
    setSelectedFile(null)
    setAudioUrl(null)
    setDuration(0)
    setUploadedAudioId(null) // Reset audio_id when clearing
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const togglePlay = () => {
    wavesurferRef.current?.playPause()
  }

  const handleUpload = async () => {
    if (!selectedFile) return

    setIsUploading(true)

    try {
      // Upload audio to backend API using POST /upload_bytes
      const uploadResponse = await uploadAudioBytes(selectedFile)
      const audio_id = uploadResponse.audio_id
      
      // Save audio_id in state for further use
      setUploadedAudioId(audio_id)
      console.log('[Upload] Audio uploaded successfully, audio_id:', audio_id)

      // Store blob in memory context for local playback
      const blob = new Blob([await selectedFile.arrayBuffer()], { type: selectedFile.type })
      addAudioFile(audio_id, selectedFile.name, blob, duration || 0)

      // Add initial analysis entry
      addAnalysis(audio_id, {
        audioName: selectedFile.name,
        status: 'processing',
        hasTranscript: false,
        hasEmotion: false,
        hasDeepfake: false,
        hasEvents: false,
      })

      // Navigate to the dashboard page with the audio_id
      router.push(`/dashboard/${audio_id}`)
    } catch (error) {
      console.error('Upload error:', error)
      if (error instanceof APIClientError) {
        alert(`Upload failed: ${error.message}`)
      } else {
        alert('Something went wrong. Please try again.')
      }
    } finally {
      setIsUploading(false)
    }
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Mouse position for interactive effects
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY })
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  return (
    <main className="min-h-screen h-screen bg-[#030308] flex flex-col relative overflow-hidden">
      {/* Dynamic Gradient Background that follows mouse */}
      <div 
        className="fixed inset-0 pointer-events-none transition-all duration-700 ease-out"
        style={{
          background: `
            radial-gradient(800px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(139, 92, 246, 0.07), transparent 40%),
            radial-gradient(600px circle at ${mousePosition.x * 0.5}px ${mousePosition.y * 0.5}px, rgba(59, 130, 246, 0.05), transparent 40%),
            radial-gradient(400px circle at ${mousePosition.x * 1.2}px ${mousePosition.y * 1.2}px, rgba(236, 72, 153, 0.04), transparent 40%)
          `
        }}
      />
      
      {/* Animated mesh gradient background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {/* Floating gradient orbs with complex animations */}
        <motion.div 
          className="absolute w-[600px] h-[600px] rounded-full blur-[120px]"
          style={{
            background: 'radial-gradient(circle, rgba(139, 92, 246, 0.15) 0%, rgba(139, 92, 246, 0.05) 50%, transparent 70%)',
          }}
          animate={{
            x: ['-10%', '60%', '20%', '-10%'],
            y: ['-20%', '30%', '60%', '-20%'],
            scale: [1, 1.2, 0.9, 1],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div 
          className="absolute w-[500px] h-[500px] rounded-full blur-[100px]"
          style={{
            background: 'radial-gradient(circle, rgba(59, 130, 246, 0.12) 0%, rgba(59, 130, 246, 0.04) 50%, transparent 70%)',
          }}
          animate={{
            x: ['80%', '20%', '50%', '80%'],
            y: ['70%', '20%', '50%', '70%'],
            scale: [1.1, 0.9, 1.2, 1.1],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div 
          className="absolute w-[400px] h-[400px] rounded-full blur-[80px]"
          style={{
            background: 'radial-gradient(circle, rgba(236, 72, 153, 0.1) 0%, rgba(236, 72, 153, 0.03) 50%, transparent 70%)',
          }}
          animate={{
            x: ['40%', '70%', '10%', '40%'],
            y: ['50%', '10%', '80%', '50%'],
            scale: [0.9, 1.3, 1, 0.9],
          }}
          transition={{
            duration: 22,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        
        {/* Animated grid pattern */}
        <div className="absolute inset-0 opacity-[0.015]">
          <div className="absolute inset-0" style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px',
          }} />
        </div>
        
        {/* Floating particles */}
        {[...Array(30)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-white/20"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -100, 0],
              opacity: [0, 1, 0],
              scale: [0, 1, 0],
            }}
            transition={{
              duration: 4 + Math.random() * 4,
              repeat: Infinity,
              delay: Math.random() * 4,
              ease: "easeInOut",
            }}
          />
        ))}
        
        {/* Animated sound wave visualization - full width */}
        <svg className="absolute bottom-0 left-0 right-0 h-64 opacity-[0.06]" preserveAspectRatio="none" viewBox="0 0 1440 320">
          <defs>
            <linearGradient id="wave-grad-1" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0" />
              <stop offset="50%" stopColor="#a78bfa" stopOpacity="1" />
              <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="wave-grad-2" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0" />
              <stop offset="50%" stopColor="#60a5fa" stopOpacity="1" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="wave-grad-3" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ec4899" stopOpacity="0" />
              <stop offset="50%" stopColor="#f472b6" stopOpacity="1" />
              <stop offset="100%" stopColor="#ec4899" stopOpacity="0" />
            </linearGradient>
          </defs>
          {[1, 2, 3].map((n) => (
            <motion.path
              key={n}
              fill="none"
              stroke={`url(#wave-grad-${n})`}
              strokeWidth="2"
              animate={{
                d: [
                  `M0 ${160 + n * 30} Q 360 ${120 + n * 30} 720 ${160 + n * 30} T 1440 ${160 + n * 30}`,
                  `M0 ${160 + n * 30} Q 360 ${200 + n * 30} 720 ${160 + n * 30} T 1440 ${160 + n * 30}`,
                  `M0 ${160 + n * 30} Q 360 ${120 + n * 30} 720 ${160 + n * 30} T 1440 ${160 + n * 30}`,
                ],
              }}
              transition={{
                duration: 4 + n,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          ))}
        </svg>
        
        {/* Vertical audio spectrum bars - more dramatic */}
        <div className="absolute bottom-0 left-0 right-0 h-48 flex items-end justify-center gap-[3px] opacity-[0.08]">
          {[...Array(80)].map((_, i) => (
            <motion.div
              key={i}
              className="w-[2px] rounded-full"
              style={{
                background: `linear-gradient(to top, 
                  ${i % 3 === 0 ? '#8b5cf6' : i % 3 === 1 ? '#3b82f6' : '#ec4899'}, 
                  transparent
                )`,
              }}
              animate={{ 
                height: [
                  8,
                  20 + Math.sin(i * 0.3) * 40 + Math.random() * 60,
                  8
                ]
              }}
              transition={{
                duration: 0.8 + Math.random() * 0.8,
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 0.02,
              }}
            />
          ))}
        </div>
        
        {/* Circular pulse rings */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          {[...Array(4)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full border border-purple-500/10"
              style={{
                width: 200 + i * 150,
                height: 200 + i * 150,
                left: -(100 + i * 75),
                top: -(100 + i * 75),
              }}
              animate={{
                scale: [1, 1.1, 1],
                opacity: [0.1, 0.2, 0.1],
              }}
              transition={{
                duration: 3 + i * 0.5,
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 0.4,
              }}
            />
          ))}
        </div>
        
        {/* Glowing orb in center */}
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-purple-400/50 blur-sm"
          animate={{
            scale: [1, 1.5, 1],
            opacity: [0.5, 0.8, 0.5],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </div>
      
      {/* Navigation - glassmorphism style */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-3">
        <motion.div 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="max-w-7xl mx-auto flex items-center justify-between bg-white/[0.03] backdrop-blur-xl rounded-2xl border border-white/[0.08] px-5 py-2.5 shadow-2xl shadow-black/20"
        >
          <Link href="/" className="flex items-center gap-3 group">
            <motion.div 
              whileHover={{ scale: 1.1, rotate: 5 }}
              whileTap={{ scale: 0.95 }}
              className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/30 to-blue-500/30 flex items-center justify-center border border-white/20 group-hover:border-purple-400/50 transition-all group-hover:shadow-lg group-hover:shadow-purple-500/20"
            >
              <svg 
                viewBox="0 0 46 48"
                fill="none" 
                className="w-6 h-6"
                xmlns="http://www.w3.org/2000/svg"
              >
                <defs>
                  <linearGradient id="logo-gradient-upload" x1="0" y1="0" x2="0" y2="48" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#a78bfa" />
                    <stop offset="50%" stopColor="#c084fc" />
                    <stop offset="100%" stopColor="#e879f9" />
                  </linearGradient>
                </defs>
                <motion.rect x="2" y="16" width="6" height="16" rx="3" fill="url(#logo-gradient-upload)" initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} transition={{ duration: 0.4, delay: 0.2 }} style={{ transformOrigin: "center" }} />
                <motion.rect x="11" y="10" width="6" height="28" rx="3" fill="url(#logo-gradient-upload)" initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} transition={{ duration: 0.4, delay: 0.1 }} style={{ transformOrigin: "center" }} />
                <motion.rect x="20" y="4" width="6" height="40" rx="3" fill="url(#logo-gradient-upload)" initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} transition={{ duration: 0.4 }} style={{ transformOrigin: "center" }} />
                <motion.rect x="29" y="10" width="6" height="28" rx="3" fill="url(#logo-gradient-upload)" initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} transition={{ duration: 0.4, delay: 0.1 }} style={{ transformOrigin: "center" }} />
                <motion.rect x="38" y="16" width="6" height="16" rx="3" fill="url(#logo-gradient-upload)" initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} transition={{ duration: 0.4, delay: 0.2 }} style={{ transformOrigin: "center" }} />
              </svg>
            </motion.div>
            <span className="text-xl font-bold tracking-wide bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">DECIBEL</span>
          </Link>
          <Link 
            href="/"
            className="text-sm text-white/50 hover:text-white transition-all duration-300 flex items-center gap-2 group px-4 py-2 rounded-lg hover:bg-white/5"
          >
            <ArrowRight className="w-4 h-4 rotate-180 group-hover:-translate-x-1 transition-transform" />
            Back to Home
          </Link>
        </motion.div>
      </nav>

      <div className="flex-1 flex flex-col items-center justify-center px-6 pt-20 pb-4 overflow-y-auto relative z-10">
        <div className="w-full max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="text-center mb-8"
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.1, type: "spring" }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-purple-500/10 via-blue-500/10 to-pink-500/10 border border-purple-500/20 mb-5 backdrop-blur-sm"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              >
                <Sparkles className="w-4 h-4 text-purple-400" />
              </motion.div>
              <span className="text-sm text-purple-300 font-medium">AI-Powered Analysis</span>
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="w-2 h-2 rounded-full bg-green-400"
              />
            </motion.div>
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-5xl font-bold mb-3 tracking-tight"
            >
              <span className="bg-gradient-to-r from-white via-white to-white/50 bg-clip-text text-transparent">
                {mode === 'upload' ? 'Upload Your Audio' : 'Record Audio'}
              </span>
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="text-white/40 text-lg max-w-lg mx-auto"
            >
              {mode === 'upload' 
                ? 'Drop your audio file to unlock deep insights with AI' 
                : 'Capture audio directly from your microphone'}
            </motion.p>
          </motion.div>

          {/* Mode Toggle - Enhanced */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.35, ease: "easeOut" }}
            className="flex justify-center mb-8"
          >
            <div className="relative flex items-center gap-1 p-1.5 bg-white/[0.03] rounded-2xl border border-white/[0.08] backdrop-blur-xl shadow-2xl shadow-black/20">
              {/* Animated background slider */}
              <motion.div
                className="absolute top-1.5 bottom-1.5 rounded-xl bg-gradient-to-r from-white to-white/90 shadow-lg"
                initial={false}
                animate={{
                  left: mode === 'upload' ? '6px' : '50%',
                  width: 'calc(50% - 8px)',
                }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              />
              <button
                onClick={() => {
                  setMode('upload')
                  clearFile()
                }}
                className={`
                  relative z-10 px-8 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center gap-2 text-sm
                  ${mode === 'upload' ? 'text-black' : 'text-white/50 hover:text-white'}
                `}
              >
                <Upload className="w-4 h-4" />
                Upload File
              </button>
              <button
                onClick={() => {
                  setMode('record')
                  clearFile()
                }}
                className={`
                  relative z-10 px-8 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center gap-2 text-sm
                  ${mode === 'record' ? 'text-black' : 'text-white/50 hover:text-white'}
                `}
              >
                <Mic className="w-4 h-4" />
                Record Audio
              </button>
            </div>
          </motion.div>

          {/* Upload or Record Area */}
          {mode === 'upload' && !selectedFile ? (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`
                relative p-12 rounded-3xl border-2 border-dashed cursor-pointer transition-all duration-500 overflow-hidden group
                ${isDragging 
                  ? 'border-purple-400 bg-purple-500/10 scale-[1.02]' 
                  : 'border-white/10 bg-white/[0.02] hover:border-purple-400/30 hover:bg-white/[0.03]'}
              `}
            >
              {/* Animated corner accents */}
              <div className="absolute top-0 left-0 w-20 h-20 border-t-2 border-l-2 border-purple-500/20 rounded-tl-3xl transition-all duration-500 group-hover:border-purple-400/40 group-hover:w-24 group-hover:h-24" />
              <div className="absolute top-0 right-0 w-20 h-20 border-t-2 border-r-2 border-blue-500/20 rounded-tr-3xl transition-all duration-500 group-hover:border-blue-400/40 group-hover:w-24 group-hover:h-24" />
              <div className="absolute bottom-0 left-0 w-20 h-20 border-b-2 border-l-2 border-pink-500/20 rounded-bl-3xl transition-all duration-500 group-hover:border-pink-400/40 group-hover:w-24 group-hover:h-24" />
              <div className="absolute bottom-0 right-0 w-20 h-20 border-b-2 border-r-2 border-cyan-500/20 rounded-br-3xl transition-all duration-500 group-hover:border-cyan-400/40 group-hover:w-24 group-hover:h-24" />
              
              {/* Animated gradient background */}
              <motion.div 
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{
                  background: 'radial-gradient(circle at center, rgba(139, 92, 246, 0.05) 0%, transparent 70%)'
                }}
              />
              
              {/* Floating particles on hover */}
              <div className="absolute inset-0 pointer-events-none">
                {[...Array(6)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-1 h-1 rounded-full bg-purple-400/40 opacity-0 group-hover:opacity-100"
                    style={{
                      left: `${20 + i * 12}%`,
                      top: '50%',
                    }}
                    animate={{
                      y: [0, -30, 0],
                      opacity: [0, 1, 0],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      delay: i * 0.2,
                    }}
                  />
                ))}
              </div>
              
              <div className="relative flex flex-col items-center text-center">
                <motion.div 
                  animate={{ 
                    y: isDragging ? -12 : 0,
                    scale: isDragging ? 1.1 : 1,
                    rotate: isDragging ? [0, -5, 5, 0] : 0,
                  }}
                  transition={{ duration: 0.4, type: "spring" }}
                  className={`
                    w-20 h-20 rounded-2xl flex items-center justify-center mb-6 transition-all duration-500
                    ${isDragging 
                      ? 'bg-gradient-to-br from-purple-500/40 to-blue-500/40 border-purple-400/60 shadow-xl shadow-purple-500/20' 
                      : 'bg-gradient-to-br from-white/10 to-white/5 border-white/10 group-hover:from-purple-500/20 group-hover:to-blue-500/20 group-hover:border-purple-400/30'}
                    border
                  `}
                >
                  <motion.div
                    animate={isDragging ? { rotate: [0, -10, 10, 0] } : {}}
                    transition={{ duration: 0.5, repeat: isDragging ? Infinity : 0 }}
                  >
                    <Upload className={`w-9 h-9 transition-colors duration-300 ${isDragging ? 'text-purple-300' : 'text-white/40 group-hover:text-purple-300'}`} />
                  </motion.div>
                </motion.div>
                <motion.p 
                  className="text-white font-bold text-2xl mb-2"
                  animate={{ scale: isDragging ? 1.05 : 1 }}
                >
                  {isDragging ? '✨ Release to upload' : 'Drop your audio file here'}
                </motion.p>
                <p className="text-white/40 text-sm mb-6">
                  or click anywhere to browse your files
                </p>
                <div className="flex items-center gap-2 text-white/30 text-xs">
                  {['MP3', 'WAV', 'M4A', 'FLAC', 'OGG'].map((format, idx) => (
                    <motion.span 
                      key={format}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 + idx * 0.05 }}
                      className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-purple-500/10 hover:border-purple-500/20 transition-all duration-300"
                    >
                      {format}
                    </motion.span>
                  ))}
                </div>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*"
                onChange={handleInputChange}
                className="hidden"
              />
            </motion.div>
          ) : mode === 'record' && !selectedFile ? (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="relative p-12 rounded-3xl border border-white/10 bg-white/[0.02] overflow-hidden"
            >
              {/* Recording pulse rings */}
              {isRecording && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  {[...Array(3)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute w-32 h-32 rounded-full border-2 border-red-500/30"
                      initial={{ scale: 1, opacity: 0.5 }}
                      animate={{ scale: 2 + i * 0.5, opacity: 0 }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        delay: i * 0.4,
                        ease: "easeOut",
                      }}
                    />
                  ))}
                </div>
              )}
              
              {/* Background gradient animation for recording */}
              <motion.div 
                className="absolute inset-0"
                animate={{
                  background: isRecording 
                    ? [
                        'radial-gradient(circle at center, rgba(239, 68, 68, 0.1) 0%, transparent 60%)',
                        'radial-gradient(circle at center, rgba(239, 68, 68, 0.15) 0%, transparent 70%)',
                        'radial-gradient(circle at center, rgba(239, 68, 68, 0.1) 0%, transparent 60%)',
                      ]
                    : 'radial-gradient(circle at center, transparent 0%, transparent 100%)'
                }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
              
              <div className="relative flex flex-col items-center text-center">
                <motion.div 
                  animate={{ 
                    scale: isRecording ? [1, 1.15, 1] : 1,
                    boxShadow: isRecording 
                      ? ['0 0 0 0 rgba(239, 68, 68, 0.4)', '0 0 40px 20px rgba(239, 68, 68, 0)', '0 0 0 0 rgba(239, 68, 68, 0.4)']
                      : '0 0 0 0 rgba(239, 68, 68, 0)'
                  }}
                  transition={{ duration: 1.2, repeat: isRecording ? Infinity : 0 }}
                  className={`
                    w-28 h-28 rounded-full flex items-center justify-center mb-6 transition-all duration-500
                    ${isRecording 
                      ? 'bg-gradient-to-br from-red-500/40 to-red-600/30 border-red-400/60' 
                      : 'bg-gradient-to-br from-white/10 to-white/5 border-white/10 hover:from-red-500/10 hover:border-red-400/30'}
                    border-2
                  `}
                >
                  <motion.div
                    animate={isRecording ? { scale: [1, 0.9, 1] } : {}}
                    transition={{ duration: 0.5, repeat: isRecording ? Infinity : 0 }}
                  >
                    <Mic className={`w-12 h-12 transition-colors duration-300 ${isRecording ? 'text-red-400' : 'text-white/40'}`} />
                  </motion.div>
                </motion.div>
                
                {isRecording ? (
                  <>
                    <div className="flex items-center gap-3 mb-3">
                      <motion.span 
                        className="relative flex h-3 w-3"
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 0.5, repeat: Infinity }}
                      >
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                      </motion.span>
                      <motion.p 
                        className="text-white font-bold text-2xl tabular-nums"
                        animate={{ opacity: [1, 0.7, 1] }}
                        transition={{ duration: 1, repeat: Infinity }}
                      >
                        Recording... {formatDuration(recordingTime)}
                      </motion.p>
                    </div>
                    
                    {/* Audio visualizer bars */}
                    <div className="flex items-center justify-center gap-1 h-8 mb-6">
                      {[...Array(12)].map((_, i) => (
                        <motion.div
                          key={i}
                          className="w-1 bg-red-400 rounded-full"
                          animate={{
                            height: [4, 20 + Math.random() * 20, 4],
                          }}
                          transition={{
                            duration: 0.4 + Math.random() * 0.3,
                            repeat: Infinity,
                            delay: i * 0.05,
                          }}
                        />
                      ))}
                    </div>
                    
                    <p className="text-white/40 text-sm mb-6">
                      Speak clearly into your microphone
                    </p>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={stopRecording}
                      className="flex items-center gap-2 px-10 py-4 rounded-2xl bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold transition-all duration-300 shadow-xl shadow-red-500/30"
                    >
                      <Square className="w-5 h-5" />
                      Stop Recording
                    </motion.button>
                  </>
                ) : (
                  <>
                    <p className="text-white font-bold text-2xl mb-2">
                      Ready to record
                    </p>
                    <p className="text-white/40 text-sm mb-8">
                      Click the button below to start recording
                    </p>
                    <motion.button
                      whileHover={{ scale: 1.02, boxShadow: '0 20px 40px -10px rgba(255,255,255,0.2)' }}
                      whileTap={{ scale: 0.98 }}
                      onClick={startRecording}
                      className="flex items-center gap-3 px-10 py-4 rounded-2xl bg-white text-black font-bold transition-all duration-300 shadow-xl shadow-white/20"
                    >
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      >
                        <Circle className="w-5 h-5 text-red-500 fill-red-500" />
                      </motion.div>
                      Start Recording
                    </motion.button>
                  </>
                )}
              </div>
            </motion.div>
          ) : selectedFile && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="relative p-8 rounded-3xl bg-white/[0.03] border border-white/10 backdrop-blur-xl overflow-hidden"
            >
              {/* Animated gradient border effect */}
              <div className="absolute inset-0 rounded-3xl p-[1px] overflow-hidden">
                <motion.div
                  className="absolute inset-0"
                  animate={{
                    background: [
                      'linear-gradient(0deg, rgba(139, 92, 246, 0.3) 0%, transparent 50%, rgba(59, 130, 246, 0.3) 100%)',
                      'linear-gradient(90deg, rgba(139, 92, 246, 0.3) 0%, transparent 50%, rgba(59, 130, 246, 0.3) 100%)',
                      'linear-gradient(180deg, rgba(139, 92, 246, 0.3) 0%, transparent 50%, rgba(59, 130, 246, 0.3) 100%)',
                      'linear-gradient(270deg, rgba(139, 92, 246, 0.3) 0%, transparent 50%, rgba(59, 130, 246, 0.3) 100%)',
                      'linear-gradient(360deg, rgba(139, 92, 246, 0.3) 0%, transparent 50%, rgba(59, 130, 246, 0.3) 100%)',
                    ]
                  }}
                  transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                />
              </div>
              
              {/* File Info */}
              <div className="relative flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <motion.div 
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", stiffness: 200, damping: 15 }}
                    className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500/30 to-blue-500/20 flex items-center justify-center border border-purple-500/30 shadow-lg shadow-purple-500/10"
                  >
                    <FileAudio className="w-7 h-7 text-purple-400" />
                  </motion.div>
                  <div>
                    <motion.p 
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="text-white font-bold text-lg mb-1"
                    >
                      {selectedFile.name}
                    </motion.p>
                    <motion.div 
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 }}
                      className="flex items-center gap-3 text-white/40 text-sm"
                    >
                      <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10">
                        {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10">
                        {formatDuration(duration)}
                      </span>
                    </motion.div>
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={clearFile}
                  className="p-3 rounded-xl hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all duration-300 group"
                >
                  <X className="w-5 h-5 text-white/40 group-hover:text-red-400 transition-colors" />
                </motion.button>
              </div>

              {/* Waveform Preview */}
              <motion.div 
                initial={{ opacity: 0, scaleY: 0 }}
                animate={{ opacity: 1, scaleY: 1 }}
                transition={{ delay: 0.2, duration: 0.4 }}
                className="relative mb-6"
              >
                <div 
                  ref={waveformRef} 
                  className="w-full rounded-2xl overflow-hidden bg-black/50 border border-white/5"
                  style={{ minHeight: 100 }}
                />
                {/* Gradient overlay on waveform */}
                <div className="absolute inset-0 pointer-events-none rounded-2xl bg-gradient-to-r from-purple-500/5 via-transparent to-blue-500/5" />
              </motion.div>

              {/* Controls */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="relative flex items-center justify-between"
              >
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={togglePlay}
                  className="flex items-center gap-2 px-5 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all duration-300"
                >
                  {isPlaying ? (
                    <Pause className="w-5 h-5 text-white" />
                  ) : (
                    <Play className="w-5 h-5 text-white" />
                  )}
                  <span className="text-white font-semibold">{isPlaying ? 'Pause' : 'Preview'}</span>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02, boxShadow: '0 20px 40px -10px rgba(255,255,255,0.3)' }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleUpload}
                  disabled={isUploading}
                  className="flex items-center gap-3 px-8 py-3 rounded-xl bg-gradient-to-r from-white via-white to-white/90 text-black font-bold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-white/20"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Analyzing...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      <span>Start Analysis</span>
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </motion.button>
              </motion.div>
            </motion.div>
          )}


          {/* Info Cards - Enhanced with more visual effects */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="grid grid-cols-3 gap-4 mt-8"
          >
            {[
              { title: "Transcription", desc: "Word-level accuracy", Icon: FileText, color: "from-blue-500 to-cyan-500", bgColor: "bg-blue-500/10", borderColor: "border-blue-500/20", hoverBorder: "group-hover:border-blue-400/40" },
              { title: "Diarization", desc: "Speaker identification", Icon: Users, color: "from-purple-500 to-pink-500", bgColor: "bg-purple-500/10", borderColor: "border-purple-500/20", hoverBorder: "group-hover:border-purple-400/40" },
              { title: "Analysis", desc: "Events & emotions", Icon: Activity, color: "from-emerald-500 to-teal-500", bgColor: "bg-emerald-500/10", borderColor: "border-emerald-500/20", hoverBorder: "group-hover:border-emerald-400/40" },
            ].map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.55 + idx * 0.1, type: "spring" }}
                whileHover={{ y: -5, scale: 1.02 }}
                className={`group relative p-5 rounded-2xl bg-white/[0.02] border ${item.borderColor} ${item.hoverBorder} hover:bg-white/[0.04] transition-all duration-500 cursor-default overflow-hidden`}
              >
                {/* Animated gradient background on hover */}
                <motion.div 
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{
                    background: `radial-gradient(circle at center, ${item.bgColor.replace('bg-', 'rgba(').replace('/10', ', 0.1)')} 0%, transparent 70%)`
                  }}
                />
                
                {/* Floating particles */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                  {[...Array(3)].map((_, i) => (
                    <motion.div
                      key={i}
                      className={`absolute w-1 h-1 rounded-full ${item.bgColor.replace('/10', '/40')} opacity-0 group-hover:opacity-100`}
                      style={{
                        left: `${30 + i * 20}%`,
                        top: '80%',
                      }}
                      animate={{
                        y: [0, -40, 0],
                        opacity: [0, 1, 0],
                      }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        delay: i * 0.3,
                      }}
                    />
                  ))}
                </div>
                
                <div className="relative flex items-center gap-4">
                  <motion.div 
                    whileHover={{ rotate: [0, -10, 10, 0] }}
                    transition={{ duration: 0.5 }}
                    className={`w-11 h-11 rounded-xl ${item.bgColor} flex items-center justify-center border ${item.borderColor} transition-all duration-300`}
                  >
                    <item.Icon className={`w-5 h-5 bg-gradient-to-r ${item.color} bg-clip-text text-transparent`} style={{ color: item.color.includes('blue') ? '#60a5fa' : item.color.includes('purple') ? '#a78bfa' : '#34d399' }} />
                  </motion.div>
                  <div>
                    <p className="text-white font-semibold text-sm mb-0.5">{item.title}</p>
                    <p className="text-white/40 text-xs">{item.desc}</p>
                  </div>
                </div>
                
                {/* Shine effect on hover */}
                <motion.div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100"
                  initial={{ x: '-100%' }}
                  whileHover={{ x: '100%' }}
                  transition={{ duration: 0.6 }}
                  style={{
                    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent)',
                  }}
                />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </main>
  )
}
