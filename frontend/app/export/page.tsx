"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { 
  Mic, 
  FileJson,
  FileText,
  Download,
  Check,
  Loader2
} from "lucide-react"
import { cn } from "@/lib/utils"

const exportFormats = [
  {
    id: 'json',
    name: 'JSON',
    description: 'Full analysis data in JSON format',
    icon: FileJson,
    available: true
  },
  {
    id: 'pdf',
    name: 'PDF Report',
    description: 'Formatted report with visualizations',
    icon: FileText,
    available: true
  },
  {
    id: 'txt',
    name: 'Plain Text',
    description: 'Transcript only in plain text',
    icon: FileText,
    available: true
  },
  {
    id: 'srt',
    name: 'SRT Subtitles',
    description: 'Subtitles file with timestamps',
    icon: FileText,
    available: true
  }
]

export default function ExportPage() {
  const [selectedFormat, setSelectedFormat] = useState<string | null>(null)
  const [isExporting, setIsExporting] = useState(false)
  const [exportComplete, setExportComplete] = useState(false)

  const handleExport = async () => {
    if (!selectedFormat) return

    setIsExporting(true)
    
    // Simulate export
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    setIsExporting(false)
    setExportComplete(true)
    
    setTimeout(() => setExportComplete(false), 3000)
  }

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
            <h1 className="text-3xl font-bold text-white mb-2">Export</h1>
            <p className="text-white/60 mb-8">Download your analysis data in various formats</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            {exportFormats.map((format, idx) => (
              <motion.button
                key={format.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: idx * 0.1 }}
                onClick={() => setSelectedFormat(format.id)}
                disabled={!format.available}
                className={cn(
                  "p-4 rounded-2xl border text-left transition-all",
                  selectedFormat === format.id
                    ? "bg-purple-500/20 border-purple-500/50"
                    : "bg-white/5 border-white/10 hover:border-white/20",
                  !format.available && "opacity-50 cursor-not-allowed"
                )}
              >
                <div className="flex items-start gap-3">
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center",
                    selectedFormat === format.id
                      ? "bg-purple-500/30"
                      : "bg-white/10"
                  )}>
                    <format.icon className={cn(
                      "w-5 h-5",
                      selectedFormat === format.id
                        ? "text-purple-400"
                        : "text-white/70"
                    )} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-white">{format.name}</h3>
                      {selectedFormat === format.id && (
                        <div className="w-5 h-5 rounded-full bg-purple-500 flex items-center justify-center">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </div>
                    <p className="text-white/50 text-sm mt-1">{format.description}</p>
                  </div>
                </div>
              </motion.button>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <button
              onClick={handleExport}
              disabled={!selectedFormat || isExporting}
              className={cn(
                "w-full py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2",
                selectedFormat
                  ? "bg-white text-black hover:bg-white/90"
                  : "bg-white/10 text-white/50 cursor-not-allowed"
              )}
            >
              {isExporting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Exporting...
                </>
              ) : exportComplete ? (
                <>
                  <Check className="w-4 h-4" />
                  Export Complete!
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Export Selected Format
                </>
              )}
            </button>
          </motion.div>

          <p className="text-white/30 text-sm text-center mt-4">
            Select a file from the workspace to export specific analysis data
          </p>
        </div>
      </div>
    </main>
  )
}



