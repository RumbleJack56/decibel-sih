"use client"

import { useState, useEffect } from "react"
import { Scene } from "@/components/ui/hero-section"
import { useRouter } from "next/navigation"
import type { User } from "@supabase/supabase-js"
import { motion } from "framer-motion"
import { CheckCircle, Loader2 } from "lucide-react"

interface ProcessingContentProps {
  user: User
}

const processingSteps = [
  { id: 1, label: "Uploading files", duration: 2000 },
  { id: 2, label: "Analyzing audio", duration: 3000 },
  { id: 3, label: "Speaker diarization", duration: 4000 },
  { id: 4, label: "Transcribing speech", duration: 3000 },
  { id: 5, label: "Detecting audio events", duration: 2000 },
  { id: 6, label: "Generating insights", duration: 2000 },
]

export function ProcessingContent({ user }: ProcessingContentProps) {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(0)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const totalSteps = processingSteps.length
    let stepIndex = 0

    const processStep = () => {
      if (stepIndex < totalSteps) {
        setCurrentStep(stepIndex + 1)
        setProgress(((stepIndex + 1) / totalSteps) * 100)

        setTimeout(() => {
          stepIndex++
          processStep()
        }, processingSteps[stepIndex].duration)
      } else {
        // Processing complete, redirect to results
        setTimeout(() => {
          router.push("/results/demo-job-123")
        }, 1000)
      }
    }

    processStep()
  }, [router])

  return (
    <main className="relative min-h-screen overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <Scene />
      </div>
      <div className="fixed inset-0 z-[5] bg-black/60" />

      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-lg">
          <div className="rounded-2xl border border-white/10 bg-[#1A1A1A]/80 backdrop-blur-sm p-8">
            {/* Animated Waveform */}
            <div className="flex justify-center mb-8">
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ repeat: Number.POSITIVE_INFINITY, duration: 2 }}
                className="w-24 h-24 rounded-full bg-gradient-to-r from-[#00D4FF] to-[#7C3AED] flex items-center justify-center"
              >
                <svg width="48" height="48" viewBox="0 0 32 32" fill="none" className="text-white">
                  <rect x="2" y="12" width="3" height="8" rx="1.5" fill="currentColor" opacity="0.6">
                    <animate attributeName="height" values="8;16;8" dur="0.8s" repeatCount="indefinite" />
                    <animate attributeName="y" values="12;8;12" dur="0.8s" repeatCount="indefinite" />
                  </rect>
                  <rect x="7" y="8" width="3" height="16" rx="1.5" fill="currentColor" opacity="0.8">
                    <animate attributeName="height" values="16;8;16" dur="0.6s" repeatCount="indefinite" />
                    <animate attributeName="y" values="8;12;8" dur="0.6s" repeatCount="indefinite" />
                  </rect>
                  <rect x="12" y="4" width="3" height="24" rx="1.5" fill="currentColor">
                    <animate attributeName="height" values="24;12;24" dur="0.7s" repeatCount="indefinite" />
                    <animate attributeName="y" values="4;10;4" dur="0.7s" repeatCount="indefinite" />
                  </rect>
                  <rect x="17" y="8" width="3" height="16" rx="1.5" fill="currentColor" opacity="0.8">
                    <animate attributeName="height" values="16;20;16" dur="0.5s" repeatCount="indefinite" />
                    <animate attributeName="y" values="8;6;8" dur="0.5s" repeatCount="indefinite" />
                  </rect>
                  <rect x="22" y="10" width="3" height="12" rx="1.5" fill="currentColor" opacity="0.7">
                    <animate attributeName="height" values="12;18;12" dur="0.9s" repeatCount="indefinite" />
                    <animate attributeName="y" values="10;7;10" dur="0.9s" repeatCount="indefinite" />
                  </rect>
                  <rect x="27" y="13" width="3" height="6" rx="1.5" fill="currentColor" opacity="0.5">
                    <animate attributeName="height" values="6;14;6" dur="0.65s" repeatCount="indefinite" />
                    <animate attributeName="y" values="13;9;13" dur="0.65s" repeatCount="indefinite" />
                  </rect>
                </svg>
              </motion.div>
            </div>

            <h2 className="text-xl font-open-sans-custom text-white text-center mb-2">Processing Your Audio</h2>
            <p className="text-[#C0C0C0] font-open-sans-custom text-center text-sm mb-8">
              Please wait while we analyze your files
            </p>

            {/* Progress Bar */}
            <div className="h-2 rounded-full bg-[#0D0D0D] mb-6 overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-[#00D4FF] to-[#7C3AED]"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>

            {/* Steps */}
            <div className="space-y-3">
              {processingSteps.map((step, idx) => (
                <div
                  key={step.id}
                  className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                    currentStep > idx
                      ? "bg-[#00D4FF]/10 border border-[#00D4FF]/30"
                      : currentStep === idx + 1
                        ? "bg-[#7C3AED]/10 border border-[#7C3AED]/30"
                        : "bg-[#0D0D0D] border border-white/10"
                  }`}
                >
                  {currentStep > idx ? (
                    <CheckCircle className="w-5 h-5 text-[#00D4FF]" />
                  ) : currentStep === idx + 1 ? (
                    <Loader2 className="w-5 h-5 text-[#7C3AED] animate-spin" />
                  ) : (
                    <div className="w-5 h-5 rounded-full border border-white/20" />
                  )}
                  <span
                    className={`font-open-sans-custom text-sm ${
                      currentStep >= idx + 1 ? "text-white" : "text-[#C0C0C0]"
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
