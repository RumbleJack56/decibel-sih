"use client"

import { useState, useEffect, use, useRef, useCallback } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAudioStore } from "@/contexts/audio-store"
import { runFullAnalysis, APIClientError } from "@/lib/api"
import { FullAnalysisResponse } from "@/lib/api/types"
import { 
  Mic, 
  CheckCircle2, 
  Loader2,
  AudioWaveform,
  Users,
  Activity,
  Layers,
  MessageSquare,
  AlertTriangle,
  XCircle,
  RefreshCw
} from "lucide-react"

const processingSteps = [
  { id: 'upload', label: 'Audio uploaded', icon: AudioWaveform, minProgress: 5 },
  { id: 'preprocessing', label: 'Preprocessing audio', icon: AudioWaveform, minProgress: 15 },
  { id: 'transcription', label: 'Transcribing speech', icon: MessageSquare, minProgress: 30 },
  { id: 'diarization', label: 'Identifying speakers', icon: Users, minProgress: 45 },
  { id: 'events', label: 'Detecting events', icon: Activity, minProgress: 60 },
  { id: 'emotion', label: 'Analyzing emotions', icon: Layers, minProgress: 75 },
  { id: 'deepfake', label: 'Deepfake detection', icon: AlertTriangle, minProgress: 85 },
  { id: 'finalizing', label: 'Finalizing analysis', icon: CheckCircle2, minProgress: 95 },
]

export default function ProcessingPage({ params }: { params: Promise<{ fileId: string }> }) {
  const { fileId } = use(params)
  const [currentStep, setCurrentStep] = useState(0)
  const [progress, setProgress] = useState(5)
  const [status, setStatus] = useState<'processing' | 'completed' | 'failed'>('processing')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [partialFailures, setPartialFailures] = useState<string[]>([])
  
  const { getAudioFile, updateAnalysis, getAnalysis } = useAudioStore()
  const router = useRouter()
  const analysisStarted = useRef(false)
  const progressInterval = useRef<NodeJS.Timeout | null>(null)

  const startProgressAnimation = useCallback(() => {
    let currentProgress = 5
    progressInterval.current = setInterval(() => {
      if (currentProgress < 90) {
        const increment = Math.random() * 2 + 0.5
        currentProgress = Math.min(currentProgress + increment, 90)
        setProgress(currentProgress)
        
        const newStep = processingSteps.findIndex(
          (step, idx) => 
            currentProgress >= step.minProgress && 
            (idx === processingSteps.length - 1 || currentProgress < processingSteps[idx + 1].minProgress)
        )
        if (newStep >= 0) {
          setCurrentStep(newStep)
        }
      }
    }, 500)
  }, [])

  const stopProgressAnimation = useCallback(() => {
    if (progressInterval.current) {
      clearInterval(progressInterval.current)
      progressInterval.current = null
    }
  }, [])

  useEffect(() => {
    if (analysisStarted.current) return
    analysisStarted.current = true

    const audioFile = getAudioFile(fileId)
    const existingAnalysis = getAnalysis(fileId)
    
    const runAnalysis = async () => {
      startProgressAnimation()
      
      try {
        const result: FullAnalysisResponse = await runFullAnalysis(fileId, audioFile?.blob)
        
        stopProgressAnimation()
        
        const failures: string[] = []
        let hasTranscript = true
        let hasEmotion = true
        let hasDeepfake = true
        let hasEvents = true
        
        if (!result.transcript || result.transcript.length === 0) {
          failures.push('Transcript')
          hasTranscript = false
        }
        if (!result.emotion_analysis || !result.emotion_analysis.timeline) {
          failures.push('Emotion analysis')
          hasEmotion = false
        }
        if (!result.deepfake_analysis || !result.deepfake_analysis.prediction) {
          failures.push('Deepfake detection')
          hasDeepfake = false
        }
        if (!result.events || result.events.length === 0) {
          failures.push('Event detection')
          hasEvents = false
        }
        
        setPartialFailures(failures)
        
        updateAnalysis(fileId, {
          analysis: result,
          status: 'completed',
          hasTranscript,
          hasEmotion,
          hasDeepfake,
          hasEvents,
        })
        
        await fetch('/api/analysis', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            audioId: fileId,
            audioName: audioFile?.name || existingAnalysis?.audioName || 'audio.wav',
            analysisData: result,
            status: 'completed',
            hasTranscript,
            hasEmotion,
            hasDeepfake,
            hasEvents,
          }),
        })
        
        setProgress(100)
        setCurrentStep(processingSteps.length - 1)
        setStatus('completed')
        
        setTimeout(() => {
          router.push(`/analysis/${fileId}`)
        }, 1000)
        
      } catch (error) {
        stopProgressAnimation()
        console.error('Analysis failed:', error)
        
        let errorMsg = 'Analysis failed. Please try again.'
        
        if (error instanceof APIClientError) {
          errorMsg = error.message
        }
        
        setStatus('failed')
        setErrorMessage(errorMsg)
        
        updateAnalysis(fileId, {
          status: 'failed',
          error: errorMsg,
        })
        
        await fetch('/api/analysis', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            audioId: fileId,
            audioName: audioFile?.name || existingAnalysis?.audioName || 'audio.wav',
            status: 'failed',
            errorMessage: errorMsg,
            hasTranscript: false,
            hasEmotion: false,
            hasDeepfake: false,
            hasEvents: false,
          }),
        })
      }
    }

    runAnalysis()
    
    return () => {
      stopProgressAnimation()
    }
  }, [fileId, getAudioFile, getAnalysis, updateAnalysis, router, startProgressAnimation, stopProgressAnimation])

  const retry = () => {
    analysisStarted.current = false
    setStatus('processing')
    setProgress(5)
    setCurrentStep(0)
    setErrorMessage(null)
    setPartialFailures([])
    router.refresh()
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#0d0d1a] to-[#0a0a0f] flex items-center justify-center">
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center">
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
        </div>
      </nav>

      <div className="w-full max-w-xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          {status === 'failed' ? (
            <>
              <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
                <XCircle className="w-8 h-8 text-red-400" />
              </div>
              <h1 className="text-3xl font-bold text-white mb-2">Analysis Failed</h1>
              <p className="text-white/60 mb-6">{errorMessage}</p>
              <button
                onClick={retry}
                className="px-6 py-3 rounded-xl bg-white text-black font-medium hover:bg-white/90 transition-colors inline-flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Try Again
              </button>
            </>
          ) : status === 'completed' ? (
            <>
              <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-green-400" />
              </div>
              <h1 className="text-3xl font-bold text-white mb-2">Analysis Complete</h1>
              <p className="text-white/60">Redirecting to results...</p>
              {partialFailures.length > 0 && (
                <div className="mt-4 p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/30">
                  <p className="text-yellow-400 text-sm">
                    <AlertTriangle className="w-4 h-4 inline mr-2" />
                    Some analyses were unavailable: {partialFailures.join(', ')}
                  </p>
                </div>
              )}
            </>
          ) : (
            <>
              <h1 className="text-3xl font-bold text-white mb-2">Processing Audio</h1>
              <p className="text-white/60">Running full analysis pipeline...</p>
            </>
          )}
        </motion.div>

        {status === 'processing' && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="mb-8"
            >
              <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-purple-500 to-blue-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
              <div className="flex justify-between mt-2">
                <span className="text-white/50 text-sm">{Math.round(progress)}% complete</span>
                <span className="text-white/50 text-sm">
                  Step {currentStep + 1} of {processingSteps.length}
                </span>
              </div>
            </motion.div>

            <div className="space-y-3">
              {processingSteps.map((step, idx) => {
                const isCompleted = idx < currentStep || (idx === currentStep && progress >= step.minProgress + 10)
                const isCurrent = idx === currentStep && !isCompleted
                const StepIcon = step.icon

                return (
                  <motion.div
                    key={step.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className={`
                      flex items-center gap-4 p-4 rounded-xl border transition-all
                      ${isCompleted 
                        ? 'bg-green-500/10 border-green-500/30' 
                        : isCurrent 
                          ? 'bg-purple-500/10 border-purple-500/30' 
                          : 'bg-white/5 border-white/10'}
                    `}
                  >
                    <div className={`
                      w-10 h-10 rounded-lg flex items-center justify-center
                      ${isCompleted 
                        ? 'bg-green-500/20' 
                        : isCurrent 
                          ? 'bg-purple-500/20' 
                          : 'bg-white/10'}
                    `}>
                      {isCompleted ? (
                        <CheckCircle2 className="w-5 h-5 text-green-400" />
                      ) : isCurrent ? (
                        <Loader2 className="w-5 h-5 text-purple-400 animate-spin" />
                      ) : (
                        <StepIcon className="w-5 h-5 text-white/40" />
                      )}
                    </div>
                    <span className={`
                      font-medium
                      ${isCompleted 
                        ? 'text-green-400' 
                        : isCurrent 
                          ? 'text-white' 
                          : 'text-white/40'}
                    `}>
                      {step.label}
                    </span>
                  </motion.div>
                )
              })}
            </div>
          </>
        )}

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8 text-center"
        >
          <Link
            href="/workspace"
            className="text-white/50 hover:text-white text-sm transition-colors"
          >
            ← Back to Workspace
          </Link>
        </motion.div>
      </div>
    </main>
  )
}
