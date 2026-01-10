"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { 
  Mic, 
  Moon,
  Sun,
  Volume2,
  Type,
  Save,
  Loader2,
  Check
} from "lucide-react"
import { cn } from "@/lib/utils"

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    theme: 'dark',
    playbackSpeed: 1.0,
    transcriptDensity: 'normal',
    fontSize: 'medium'
  })
  const [isSaving, setIsSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const handleSave = async () => {
    setIsSaving(true)
    
    // Simulate save
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    setIsSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const playbackSpeeds = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0]
  const densityOptions = ['compact', 'normal', 'comfortable']
  const fontSizes = ['small', 'medium', 'large']

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
        <div className="max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
            <p className="text-white/60 mb-8">Customize your DECIBEL experience</p>
          </motion.div>

          <div className="space-y-6">
            {/* Theme */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="p-6 rounded-2xl bg-white/5 border border-white/10"
            >
              <div className="flex items-center gap-3 mb-4">
                {settings.theme === 'dark' ? (
                  <Moon className="w-5 h-5 text-white/70" />
                ) : (
                  <Sun className="w-5 h-5 text-white/70" />
                )}
                <h2 className="font-semibold text-white">Theme</h2>
              </div>
              <div className="flex gap-2">
                {['dark', 'light'].map((theme) => (
                  <button
                    key={theme}
                    onClick={() => setSettings({ ...settings, theme })}
                    className={cn(
                      "flex-1 py-2.5 rounded-xl text-sm font-medium transition-all",
                      settings.theme === theme
                        ? "bg-white text-black"
                        : "bg-white/10 text-white/70 hover:bg-white/20"
                    )}
                  >
                    {theme.charAt(0).toUpperCase() + theme.slice(1)}
                  </button>
                ))}
              </div>
            </motion.div>

            {/* Playback Speed */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
              className="p-6 rounded-2xl bg-white/5 border border-white/10"
            >
              <div className="flex items-center gap-3 mb-4">
                <Volume2 className="w-5 h-5 text-white/70" />
                <h2 className="font-semibold text-white">Default Playback Speed</h2>
              </div>
              <div className="flex gap-2 flex-wrap">
                {playbackSpeeds.map((speed) => (
                  <button
                    key={speed}
                    onClick={() => setSettings({ ...settings, playbackSpeed: speed })}
                    className={cn(
                      "px-4 py-2 rounded-xl text-sm font-medium transition-all",
                      settings.playbackSpeed === speed
                        ? "bg-white text-black"
                        : "bg-white/10 text-white/70 hover:bg-white/20"
                    )}
                  >
                    {speed}x
                  </button>
                ))}
              </div>
            </motion.div>

            {/* Transcript Density */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.3 }}
              className="p-6 rounded-2xl bg-white/5 border border-white/10"
            >
              <div className="flex items-center gap-3 mb-4">
                <Type className="w-5 h-5 text-white/70" />
                <h2 className="font-semibold text-white">Transcript Density</h2>
              </div>
              <div className="flex gap-2">
                {densityOptions.map((density) => (
                  <button
                    key={density}
                    onClick={() => setSettings({ ...settings, transcriptDensity: density })}
                    className={cn(
                      "flex-1 py-2.5 rounded-xl text-sm font-medium transition-all capitalize",
                      settings.transcriptDensity === density
                        ? "bg-white text-black"
                        : "bg-white/10 text-white/70 hover:bg-white/20"
                    )}
                  >
                    {density}
                  </button>
                ))}
              </div>
            </motion.div>

            {/* Font Size */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.4 }}
              className="p-6 rounded-2xl bg-white/5 border border-white/10"
            >
              <div className="flex items-center gap-3 mb-4">
                <Type className="w-5 h-5 text-white/70" />
                <h2 className="font-semibold text-white">Font Size</h2>
              </div>
              <div className="flex gap-2">
                {fontSizes.map((size) => (
                  <button
                    key={size}
                    onClick={() => setSettings({ ...settings, fontSize: size })}
                    className={cn(
                      "flex-1 py-2.5 rounded-xl text-sm font-medium transition-all capitalize",
                      settings.fontSize === size
                        ? "bg-white text-black"
                        : "bg-white/10 text-white/70 hover:bg-white/20"
                    )}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </motion.div>

            {/* Save Button */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="w-full py-3 rounded-xl bg-white text-black font-medium hover:bg-white/90 transition-colors flex items-center justify-center gap-2"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : saved ? (
                  <>
                    <Check className="w-4 h-4" />
                    Saved!
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save Settings
                  </>
                )}
              </button>
            </motion.div>
          </div>
        </div>
      </div>
    </main>
  )
}



