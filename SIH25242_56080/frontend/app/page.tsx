"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import dynamic from "next/dynamic"
import { 
  AudioWaveform, 
  Users, 
  Languages, 
  Shield, 
  Brain, 
  FileText,
  ArrowRight,
  Mic,
  Activity,
  MessageSquare,
  Layers,
  Sparkles,
  Zap,
  Globe,
  Eye,
  Target,
  BookOpen,
  Code,
  GitBranch,
  Database
} from "lucide-react"

// Dynamic imports for animated components to avoid SSR/hydration issues
const BackgroundPaths = dynamic(() => import("@/components/ui/background-paths").then(mod => ({ default: mod.BackgroundPaths })), {
  ssr: false
})

const features = [
  {
    icon: Layers,
    title: "End-to-End Audio Intelligence",
    description: "Understands speech, events, emotions, and threats with comprehensive analysis.",
    gradient: "from-purple-500 to-pink-500",
    bgGradient: "from-purple-500/20 to-pink-500/20",
    details: "From raw waveform to structured insights — our unified perception-reasoning pipeline processes audio through 6 specialized expert modules.",
    stats: "6 Expert Modules"
  },
  {
    icon: Activity,
    title: "Forensic-Grade Audio Breakdown",
    description: "Deepfake detection, event separation, and detailed scene mapping capabilities.",
    gradient: "from-red-500 to-orange-500",
    bgGradient: "from-red-500/20 to-orange-500/20",
    details: "Detect voice cloning, audio splicing, and manipulation with 97.6% accuracy on synthetic audio detection.",
    stats: "97.6% Detection"
  },
  {
    icon: Globe,
    title: "Multilingual Intelligence",
    description: "Indic + Asian languages support, code-mix friendly transcription and translation.",
    gradient: "from-cyan-500 to-blue-500",
    bgGradient: "from-cyan-500/20 to-blue-500/20",
    details: "Native support for Hindi, Tamil, Bengali, Telugu + 10 more languages with seamless code-mixing recognition.",
    stats: "14+ Languages"
  },
  {
    icon: AudioWaveform,
    title: "Interactive Dashboard",
    description: "Real-time waveform, speaker diarization, translations, and event visualization.",
    gradient: "from-green-500 to-emerald-500",
    bgGradient: "from-green-500/20 to-emerald-500/20",
    details: "Visualize foreground/background separation, speaker timelines, emotion curves, and audio events in one unified interface.",
    stats: "Real-time Sync"
  },
  {
    icon: MessageSquare,
    title: "AI Analyst",
    description: "Ask questions about your audio and get structured, intelligent insights instantly.",
    gradient: "from-violet-500 to-purple-500",
    bgGradient: "from-violet-500/20 to-purple-500/20",
    details: "Conversational QnA powered by audio-grounded LLM reasoning. Ask about speakers, events, emotions, or request summaries.",
    stats: "Context-Aware"
  },
  {
    icon: FileText,
    title: "Multi-File Workspace",
    description: "Compare speakers and events across multiple recordings with ease.",
    gradient: "from-amber-500 to-yellow-500",
    bgGradient: "from-amber-500/20 to-yellow-500/20",
    details: "Upload multiple files, tag speakers, and cross-reference voices, events, and patterns across your entire audio library.",
    stats: "Cross-Analysis"
  }
]

const techStack = [
  { 
    name: "Mixture-of-Experts (MoE)", 
    description: "Sparse model activation for optimal performance",
    details: "Task-specialized expert routing using cross-attention scores between audio embeddings and textual query features. Enables selective activation of only required experts at inference, reducing computational overhead while maintaining high-capacity reasoning.",
    highlights: ["Sparse activation paradigm", "Dynamic gated re-routing", "Scalable architecture", "On-premise efficient"]
  },
  { 
    name: "Unified Audio LM", 
    description: "Speech + events + reasoning in one model",
    details: "End-to-End Audio Language Model that unifies perception and reasoning into a single differentiable architecture. Features streaming attention for real-time responsiveness and KV Cache for efficient autoregressive decoding.",
    highlights: ["Streaming attention", "KV Cache optimization", "Adapter-based extensibility", "Real-time inference"]
  },
  { 
    name: "Multilingual Indic", 
    description: "Optimized for Asian & Indian languages",
    details: "Robust multilingual understanding including Indic and broader Asian languages. Handles code-mixing, dialectal shifts, and culturally rooted expressions for accurate interpretation of linguistically diverse audio.",
    highlights: ["Code-mix friendly", "Dialect support", "Cultural context", "Regional accents"]
  },
  { 
    name: "Edge Compatible", 
    description: "Efficient inference on resource-constrained devices",
    details: "Designed for on-premise environments with strict resource constraints and latency budgets. Lightweight task adapters enable efficient deployment without expanding the core model footprint.",
    highlights: ["Low latency", "Resource efficient", "On-premise ready", "Lightweight adapters"]
  },
  { 
    name: "Forensic Pipeline", 
    description: "Deepfake detection & threat analysis",
    details: "Comprehensive forensic-grade analysis detecting audio tampering, voice cloning, splicing artifacts, and unnatural transitions. Flags recordings with mismatched background signatures or speaker anomalies.",
    highlights: ["Tampering detection", "Voice clone analysis", "Artifact identification", "Authenticity scoring"]
  },
  { 
    name: "Speaker Diarization", 
    description: "Multi-speaker tagging & re-identification",
    details: "Advanced multi-speaker segmentation that tags each unique speaker while marking noise and silence portions. Enables speaker-wise analysis and comparison across multiple recordings.",
    highlights: ["Speaker tagging", "Segment isolation", "Re-identification", "Timeline mapping"]
  },
]

const pipelineSteps = [
  "Preprocessing & Noise Reduction",
  "Foreground / Background Separation",
  "Automatic Speech Recognition",
  "Speaker Diarization",
  "Event Detection & Classification",
  "Emotion Analysis",
  "Multi-language Translation",
  "Contextual Reasoning",
  "Threat Ranking & Prioritization",
  "Report Generation & Export"
]

const smoothScroll = (id: string) => {
  const element = document.getElementById(id)
  if (element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

export default function DecibelLandingPage() {
  return (
    <main className="relative min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#0d0d1a] to-[#0a0a0f] text-white overflow-x-hidden">
      {/* Animated Background - ONLY SVG PATHS */}
      <div className="absolute inset-0">
        <BackgroundPaths />
      </div>
      
      {/* Overlay */}
      <div className="fixed inset-0 z-[1] bg-black/40 pointer-events-none" />

      {/* Glass Navbar with Smooth Scroll */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4 bg-white/5 backdrop-blur-md border-b border-white/5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/30 to-blue-500/30 flex items-center justify-center border border-white/20 group-hover:border-purple-400/50 transition-all group-hover:scale-110 duration-300">
              <svg 
                viewBox="0 0 46 48" 
                fill="none" 
                className="w-6 h-6"
                xmlns="http://www.w3.org/2000/svg"
              >
                {/* Left outer bar */}
                <rect x="2" y="16" width="6" height="16" rx="3" fill="url(#logo-gradient)" />
                {/* Left inner bar */}
                <rect x="11" y="10" width="6" height="28" rx="3" fill="url(#logo-gradient)" />
                {/* Center bar */}
                <rect x="20" y="4" width="6" height="40" rx="3" fill="url(#logo-gradient)" />
                {/* Right inner bar */}
                <rect x="29" y="10" width="6" height="28" rx="3" fill="url(#logo-gradient)" />
                {/* Right outer bar */}
                <rect x="38" y="16" width="6" height="16" rx="3" fill="url(#logo-gradient)" />
                <defs>
                  <linearGradient id="logo-gradient" x1="0" y1="0" x2="0" y2="48" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#a78bfa" />
                    <stop offset="50%" stopColor="#c084fc" />
                    <stop offset="100%" stopColor="#e879f9" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <span className="text-xl font-bold tracking-wide">DECIBEL</span>
          </Link>
          
          <div className="hidden md:flex items-center gap-8">
            <button 
              onClick={() => smoothScroll('features')}
              className="text-sm text-white/70 hover:text-white transition-colors hover:underline underline-offset-4"
            >
              Features
            </button>
            <button 
              onClick={() => smoothScroll('technology')}
              className="text-sm text-white/70 hover:text-white transition-colors hover:underline underline-offset-4"
            >
              Technology
            </button>
            <button 
              onClick={() => smoothScroll('documentation')}
              className="text-sm text-white/70 hover:text-white transition-colors hover:underline underline-offset-4"
            >
              Documentation
            </button>
            <button 
              onClick={() => smoothScroll('about')}
              className="text-sm text-white/70 hover:text-white transition-colors hover:underline underline-offset-4"
            >
              About Us
            </button>
          </div>

          <Link 
            href="/upload"
            className="px-6 py-2.5 rounded-xl bg-white text-black text-sm font-medium hover:bg-white/90 hover:shadow-[0_0_20px_rgba(255,255,255,0.3)] transition-all"
          >
            Start Analyzing
          </Link>
        </div>
      </nav>

      {/* Hero Section - SEPARATE FROM BACKGROUND */}
      <section className="relative z-20 min-h-screen flex items-center justify-center px-6 pt-20">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <span className="inline-block px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm text-white/70 mb-8 backdrop-blur-sm">
              ✨ Beyond Transcription
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="text-5xl md:text-7xl font-bold leading-tight mb-6"
          >
            We Decode{" "}
            <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
              Intent
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-lg md:text-xl text-white/60 max-w-2xl mx-auto mb-10"
          >
            DECIBEL converts raw audio into structured, explainable intelligence - 
            from speakers to events to reasoning.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link
              href="/upload"
              className="group px-8 py-4 rounded-2xl bg-white text-black font-medium flex items-center gap-2 hover:bg-white/90 hover:shadow-[0_0_30px_rgba(255,255,255,0.4)] transition-all"
            >
              Start Analyzing
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <button
              onClick={() => smoothScroll('documentation')}
              className="px-8 py-4 rounded-2xl border border-white/20 text-white font-medium hover:bg-white/5 hover:border-white/40 transition-all backdrop-blur-sm"
            >
              Documentation
            </button>
          </motion.div>

          {/* Know More About Dataset Link */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="mt-12"
          >
            <Link
              href="/dataset"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-400 hover:text-purple-300 hover:bg-purple-500/20 hover:border-purple-400/50 transition-all group cursor-pointer"
            >
              <Database className="w-4 h-4" />
              <span className="text-sm font-medium uppercase tracking-wider">Know More About Dataset</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative z-10 py-32 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <motion.span 
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="inline-block px-4 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-400 text-xs font-medium uppercase tracking-wider mb-6"
            >
              Capabilities
            </motion.span>
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">
              Beyond Transcription
            </h2>
            <p className="text-white/50 max-w-3xl mx-auto text-lg md:text-xl leading-relaxed">
              Extract <span className="text-white/80">speakers</span>, <span className="text-white/80">emotions</span>, <span className="text-white/80">events</span>, and <span className="text-white/80">threats</span> from any audio. 
              Our perception-to-reasoning pipeline turns sound into structured, actionable intelligence.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: idx * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ y: -8, scale: 1.02 }}
                className="group relative p-6 rounded-3xl bg-white/[0.03] border border-white/10 hover:border-transparent backdrop-blur-xl overflow-hidden cursor-pointer"
              >
                {/* Animated gradient border on hover */}
                <div className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} style={{ padding: '1px' }}>
                  <div className="absolute inset-[1px] rounded-3xl bg-[#0a0a0f]" />
                </div>
                
                {/* Glow effect */}
                <div className={`absolute -inset-1 bg-gradient-to-r ${feature.gradient} rounded-3xl blur-xl opacity-0 group-hover:opacity-20 transition-opacity duration-500`} />
                
                {/* Content */}
                <div className="relative z-10">
                  {/* Icon with animated background */}
                  <div className="relative mb-5">
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.bgGradient} flex items-center justify-center border border-white/10 group-hover:border-white/20 transition-all duration-300 group-hover:scale-110`}>
                      <feature.icon className={`w-7 h-7 bg-gradient-to-r ${feature.gradient} bg-clip-text`} style={{ color: 'transparent', background: `linear-gradient(to right, var(--tw-gradient-stops))` }} />
                      <feature.icon className={`w-7 h-7 absolute opacity-100`} style={{ color: `rgb(168 85 247)` }} />
                    </div>
                    {/* Stats badge */}
                    <div className="absolute -top-2 -right-2 px-2.5 py-1 rounded-full bg-white/10 border border-white/20 text-[10px] font-semibold text-white/70 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                      {feature.stats}
                    </div>
                  </div>
                  
                  {/* Title */}
                  <h3 className="text-lg font-semibold mb-2 text-white group-hover:text-white transition-colors">
                    {feature.title}
                  </h3>
                  
                  {/* Description - changes on hover */}
                  <p className="text-white/50 text-sm leading-relaxed group-hover:hidden">
                    {feature.description}
                  </p>
                  <p className="text-white/60 text-sm leading-relaxed hidden group-hover:block">
                    {feature.details}
                  </p>
                  
                  {/* Learn more indicator */}
                  <div className="mt-4 flex items-center gap-2 text-xs font-medium opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                    <span className={`bg-gradient-to-r ${feature.gradient} bg-clip-text text-transparent`}>Explore feature</span>
                    <ArrowRight className="w-3 h-3 text-purple-400 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Bottom CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            viewport={{ once: true }}
            className="mt-16 text-center"
          >
            <Link
              href="/upload"
              className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium hover:from-purple-500 hover:to-pink-500 hover:shadow-[0_0_40px_rgba(168,85,247,0.4)] transition-all duration-300 group"
            >
              <Mic className="w-5 h-5" />
              Try All Features
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Technology Section */}
      <section id="technology" className="relative z-10 py-32 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Advanced Technology Stack
            </h2>
            <p className="text-white/60 max-w-2xl mx-auto text-lg">
              Powered by cutting-edge machine learning models and optimized inference engines. Hover to learn more.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {techStack.map((tech, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                viewport={{ once: true }}
                className="group relative"
              >
                <div className="p-6 rounded-3xl bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 hover:border-blue-500/50 backdrop-blur-xl hover:shadow-[0_0_30px_rgba(59,130,246,0.15)] transition-all duration-300 h-full">
                  <p className="text-white font-semibold mb-2 group-hover:text-blue-300 transition-colors">{tech.name}</p>
                  <p className="text-white/50 text-sm mb-3">{tech.description}</p>
                  
                  {/* Hover Details */}
                  <div className="max-h-0 overflow-hidden group-hover:max-h-[300px] transition-all duration-500 ease-in-out">
                    <div className="pt-3 border-t border-white/10">
                      <p className="text-white/60 text-xs leading-relaxed mb-3">{tech.details}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {tech.highlights.map((highlight, hIdx) => (
                          <span 
                            key={hIdx}
                            className="px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-medium"
                          >
                            {highlight}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Documentation Section */}
      <section id="documentation" className="relative z-10 py-32 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Model Documentation & Metrics
            </h2>
            <p className="text-white/60 max-w-2xl mx-auto text-lg">
              Comprehensive analysis pipeline with near-SOTA performance on focused audio understanding tasks.
            </p>
          </motion.div>

          {/* Pipeline Steps */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-16">
            {pipelineSteps.map((step, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: idx % 2 === 0 ? -20 : 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: idx * 0.05 }}
                viewport={{ once: true }}
                className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-green-500/50 backdrop-blur-xl hover:shadow-[0_0_20px_rgba(34,197,94,0.15)] transition-all duration-300 flex items-center gap-4"
              >
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center flex-shrink-0 border border-white/10">
                  <span className="text-sm font-bold text-green-400">{idx + 1}</span>
                </div>
                <p className="text-white/80 text-sm font-medium">{step}</p>
              </motion.div>
            ))}
          </div>

          {/* Metrics & Results Tables */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="mb-16"
          >
            <h3 className="text-2xl font-bold mb-6 text-center">Performance Metrics</h3>
            
            {/* Expert Modules Performance */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl">
                <h4 className="text-lg font-semibold mb-4 text-purple-400">Expert Modules</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="text-left py-2 text-white/70">Module</th>
                        <th className="text-right py-2 text-white/70">Capability</th>
                      </tr>
                    </thead>
                    <tbody className="text-white/60">
                      <tr className="border-b border-white/5">
                        <td className="py-2">Audio Events Detection</td>
                        <td className="text-right text-green-400">FG/BG Separation</td>
                      </tr>
                      <tr className="border-b border-white/5">
                        <td className="py-2">Language Detection</td>
                        <td className="text-right text-green-400">Multilingual Indic</td>
                      </tr>
                      <tr className="border-b border-white/5">
                        <td className="py-2">Emotion Trace Analysis</td>
                        <td className="text-right text-green-400">Timestamped</td>
                      </tr>
                      <tr className="border-b border-white/5">
                        <td className="py-2">Deepfake Detection</td>
                        <td className="text-right text-green-400">Forensic-grade</td>
                      </tr>
                      <tr className="border-b border-white/5">
                        <td className="py-2">Speaker Diarization</td>
                        <td className="text-right text-green-400">Multi-speaker</td>
                      </tr>
                      <tr className="border-b border-white/5">
                        <td className="py-2">Transcription</td>
                        <td className="text-right text-green-400">With Translation</td>
                      </tr>
                      <tr className="border-b border-white/5">
                        <td className="py-2">QnA Reasoning</td>
                        <td className="text-right text-green-400">Multi-turn</td>
                      </tr>
                      <tr>
                        <td className="py-2">Report Generation</td>
                        <td className="text-right text-green-400">Downloadable</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl">
                <h4 className="text-lg font-semibold mb-4 text-blue-400">Dataset Statistics</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="text-left py-2 text-white/70">Metric</th>
                        <th className="text-right py-2 text-white/70">Value</th>
                      </tr>
                    </thead>
                    <tbody className="text-white/60">
                      <tr className="border-b border-white/5">
                        <td className="py-2">Languages Supported</td>
                        <td className="text-right text-cyan-400">15+ Indic</td>
                      </tr>
                      <tr className="border-b border-white/5">
                        <td className="py-2">Audio Quality Filtering</td>
                        <td className="text-right text-cyan-400">SNR-based</td>
                      </tr>
                      <tr className="border-b border-white/5">
                        <td className="py-2">Speaker Demographics</td>
                        <td className="text-right text-cyan-400">Balanced</td>
                      </tr>
                      <tr className="border-b border-white/5">
                        <td className="py-2">Noise Variability</td>
                        <td className="text-right text-cyan-400">Real-world</td>
                      </tr>
                      <tr className="border-b border-white/5">
                        <td className="py-2">QnA Pairs</td>
                        <td className="text-right text-cyan-400">Generated</td>
                      </tr>
                      <tr className="border-b border-white/5">
                        <td className="py-2">Augmentation</td>
                        <td className="text-right text-cyan-400">Context-aware</td>
                      </tr>
                      <tr className="border-b border-white/5">
                        <td className="py-2">Manifest Format</td>
                        <td className="text-right text-cyan-400">JSONL</td>
                      </tr>
                      <tr>
                        <td className="py-2">Quality Metrics</td>
                        <td className="text-right text-cyan-400">WER/CER</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Architecture Comparison */}
            <div className="p-6 rounded-2xl bg-gradient-to-br from-purple-500/5 to-blue-500/5 border border-white/10 backdrop-blur-xl">
              <h4 className="text-lg font-semibold mb-4 text-center">Architecture Comparison</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-4 rounded-xl bg-white/5 border border-purple-500/20">
                  <h5 className="font-semibold text-purple-400 mb-3">MoE Architecture</h5>
                  <ul className="space-y-2 text-sm text-white/60">
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span>
                      Selective expert activation
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span>
                      High interpretability
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span>
                      Modular updates possible
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-yellow-400"></span>
                      Sequential routing latency
                    </li>
                  </ul>
                </div>
                <div className="p-4 rounded-xl bg-white/5 border border-blue-500/20">
                  <h5 className="font-semibold text-blue-400 mb-3">End-to-End ALM</h5>
                  <ul className="space-y-2 text-sm text-white/60">
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                      Lower inference latency
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                      Unified reasoning
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                      Streaming attention
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-yellow-400"></span>
                      Requires large-scale training
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="flex flex-wrap items-center justify-center gap-4"
          >
            <button className="px-6 py-3 rounded-xl bg-white/10 border border-white/20 hover:bg-white/15 hover:border-white/30 transition-all backdrop-blur-xl flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              Open API Spec
            </button>
            <button className="px-6 py-3 rounded-xl bg-white/10 border border-white/20 hover:bg-white/15 hover:border-white/30 transition-all backdrop-blur-xl flex items-center gap-2">
              <Code className="w-4 h-4" />
              JSON Contract
            </button>
            <button className="px-6 py-3 rounded-xl bg-white/10 border border-white/20 hover:bg-white/15 hover:border-white/30 transition-all backdrop-blur-xl flex items-center gap-2">
              <GitBranch className="w-4 h-4" />
              Architecture Diagram
            </button>
          </motion.div>
        </div>
      </section>

      {/* About Us Section */}
      <section id="about" className="relative z-10 py-32 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              About DECIBEL
            </h2>
            <p className="text-white/60 max-w-3xl mx-auto text-lg">
              Pioneering Asia's first comprehensive Audio Language Model transforming how machines perceive, understand, and reason about sound.
            </p>
          </motion.div>

          {/* Main About Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="p-8 md:p-12 rounded-3xl bg-gradient-to-br from-purple-500/10 via-white/5 to-blue-500/10 border border-white/10 backdrop-blur-xl mb-8"
          >
            <div className="flex flex-col md:flex-row items-start gap-8">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500/30 to-pink-500/30 flex items-center justify-center border border-white/20 flex-shrink-0">
                <Sparkles className="w-10 h-10 text-purple-400" />
              </div>
              <div>
                <h3 className="text-2xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  Team Gradient Ascent
                </h3>
                <p className="text-white/70 leading-relaxed mb-6">
                  We are building Asia's first Audio Language Model designed to revolutionize how machines understand sound. 
                  Unlike traditional ASR systems that merely transcribe, <strong className="text-white">DECIBEL decodes intent</strong>,
                  understanding not just what was said, but who said it, how they felt, what was happening around them, 
                  and whether the audio is even authentic.
                </p>
                <p className="text-white/70 leading-relaxed">
                  Our mission is to bridge the gap between human auditory cognition and machine intelligence, 
                  making audio as searchable, analyzable, and actionable as text. We're tackling the hard problems 
                  that traditional systems fail at: <span className="text-cyan-400">noisy environments</span>, 
                  <span className="text-purple-400"> regional dialects</span>, 
                  <span className="text-pink-400"> overlapping speech</span>, and 
                  <span className="text-green-400"> forensic-grade authenticity verification</span>.
                </p>
              </div>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl hover:border-purple-500/50 hover:shadow-[0_0_30px_rgba(168,85,247,0.15)] transition-all duration-300 text-center"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center mb-4 border border-white/10 mx-auto">
                <Brain className="w-6 h-6 text-purple-400" />
              </div>
              <h4 className="text-lg font-semibold mb-2">Deep Understanding</h4>
              <p className="text-white/50 text-sm leading-relaxed">
                From perception to reasoning, complete cognitive audio analysis
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              viewport={{ once: true }}
              className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl hover:border-cyan-500/50 hover:shadow-[0_0_30px_rgba(6,182,212,0.15)] transition-all duration-300 text-center"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center mb-4 border border-white/10 mx-auto">
                <Globe className="w-6 h-6 text-cyan-400" />
              </div>
              <h4 className="text-lg font-semibold mb-2">Multilingual First</h4>
              <p className="text-white/50 text-sm leading-relaxed">
                Native support for Indic & Asian languages with code-mixing
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
              className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl hover:border-green-500/50 hover:shadow-[0_0_30px_rgba(34,197,94,0.15)] transition-all duration-300 text-center"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center mb-4 border border-white/10 mx-auto">
                <Shield className="w-6 h-6 text-green-400" />
              </div>
              <h4 className="text-lg font-semibold mb-2">Forensic Grade</h4>
              <p className="text-white/50 text-sm leading-relaxed">
                Deepfake detection, tampering analysis & authenticity scoring
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              viewport={{ once: true }}
              className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl hover:border-orange-500/50 hover:shadow-[0_0_30px_rgba(249,115,22,0.15)] transition-all duration-300 text-center"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500/20 to-amber-500/20 flex items-center justify-center mb-4 border border-white/10 mx-auto">
                <Zap className="w-6 h-6 text-orange-400" />
              </div>
              <h4 className="text-lg font-semibold mb-2">Edge Ready</h4>
              <p className="text-white/50 text-sm leading-relaxed">
                Optimized for on-premise deployment with low latency
              </p>
            </motion.div>
          </div>

          {/* Use Cases */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h3 className="text-2xl font-bold mb-6 text-center">Real-World Impact</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 rounded-2xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20 backdrop-blur-xl">
                <h4 className="font-semibold text-blue-400 mb-3 flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Bridging the Digital Divide
                </h4>
                <p className="text-white/60 text-sm leading-relaxed">
                  Enabling voice-first AI interaction for rural and sub-urban communities. 
                  Our system understands regional accents, incomplete sentences, and culturally rooted expressions,
                  making AI accessible to those who need it most through agricultural advisory, healthcare triage, 
                  banking assistance, and government helplines.
                </p>
              </div>
              <div className="p-6 rounded-2xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 backdrop-blur-xl">
                <h4 className="font-semibold text-purple-400 mb-3 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  Enhanced CRM Automation
                </h4>
                <p className="text-white/60 text-sm leading-relaxed">
                  Transforming customer handling with context-aware call resolution. 
                  Integrated speech transcription, speaker diarization, sentiment detection, and intelligent routing, 
                  reducing wait times, increasing resolution accuracy, and improving customer satisfaction 
                  across high-volume call centers.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 py-32 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="p-12 rounded-3xl bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-white/10 backdrop-blur-xl text-center hover:border-purple-500/30 hover:shadow-[0_0_50px_rgba(168,85,247,0.2)] transition-all duration-500"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to Decode Your Audio?
            </h2>
            <p className="text-white/60 mb-8 max-w-xl mx-auto">
              Upload your first file and experience the power of AI-driven audio intelligence.
            </p>
            <Link
              href="/upload"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-white text-black font-medium hover:bg-white/90 hover:shadow-[0_0_30px_rgba(255,255,255,0.4)] transition-all"
            >
              Start Analyzing
              <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 py-16 px-6 border-t border-white/10 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            {/* Logo & Description */}
            <div className="col-span-1 md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <svg 
                  viewBox="0 0 46 48" 
                  fill="none" 
                  className="w-6 h-6"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  {/* Left outer bar */}
                  <rect x="2" y="16" width="6" height="16" rx="3" fill="url(#footer-gradient)" />
                  {/* Left inner bar */}
                  <rect x="11" y="10" width="6" height="28" rx="3" fill="url(#footer-gradient)" />
                  {/* Center bar */}
                  <rect x="20" y="4" width="6" height="40" rx="3" fill="url(#footer-gradient)" />
                  {/* Right inner bar */}
                  <rect x="29" y="10" width="6" height="28" rx="3" fill="url(#footer-gradient)" />
                  {/* Right outer bar */}
                  <rect x="38" y="16" width="6" height="16" rx="3" fill="url(#footer-gradient)" />
                  <defs>
                    <linearGradient id="footer-gradient" x1="0" y1="0" x2="0" y2="48" gradientUnits="userSpaceOnUse">
                      <stop offset="0%" stopColor="#a78bfa" />
                      <stop offset="50%" stopColor="#c084fc" />
                      <stop offset="100%" stopColor="#e879f9" />
                    </linearGradient>
                  </defs>
                </svg>
                <span className="text-white/80 font-bold text-lg">DECIBEL</span>
              </div>
              <p className="text-white/40 text-sm leading-relaxed">
                Advanced Audio Intelligence Platform
              </p>
            </div>

            {/* Features */}
            <div>
              <h3 className="text-white font-semibold mb-4">Features</h3>
              <ul className="space-y-2">
                <li>
                  <button 
                    onClick={() => smoothScroll('features')}
                    className="text-white/50 hover:text-white/80 text-sm transition-colors"
                  >
                    Overview
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => smoothScroll('technology')}
                    className="text-white/50 hover:text-white/80 text-sm transition-colors"
                  >
                    Audio Analysis
                  </button>
                </li>
                <li>
                  <Link href="/workspace" className="text-white/50 hover:text-white/80 text-sm transition-colors">
                    Workspace
                  </Link>
                </li>
                <li>
                  <Link href="/reports" className="text-white/50 hover:text-white/80 text-sm transition-colors">
                    Reports
                  </Link>
                </li>
              </ul>
            </div>

            {/* Technology */}
            <div>
              <h3 className="text-white font-semibold mb-4">Technology</h3>
              <ul className="space-y-2">
                <li>
                  <button 
                    onClick={() => smoothScroll('technology')}
                    className="text-white/50 hover:text-white/80 text-sm transition-colors"
                  >
                    Tech Stack
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => smoothScroll('documentation')}
                    className="text-white/50 hover:text-white/80 text-sm transition-colors"
                  >
                    Documentation
                  </button>
                </li>
                <li>
                  <Link href="/upload" className="text-white/50 hover:text-white/80 text-sm transition-colors">
                    Get Started
                  </Link>
                </li>
              </ul>
            </div>

            {/* About */}
            <div>
              <h3 className="text-white font-semibold mb-4">About</h3>
              <ul className="space-y-2">
                <li>
                  <button 
                    onClick={() => smoothScroll('about')}
                    className="text-white/50 hover:text-white/80 text-sm transition-colors"
                  >
                    Gradient Ascent
                  </button>
                </li>
                <li>
                  <Link href="/settings" className="text-white/50 hover:text-white/80 text-sm transition-colors">
                    Settings
                  </Link>
                </li>
                <li>
                  <Link href="/login" className="text-white/50 hover:text-white/80 text-sm transition-colors">
                    Sign In
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-white/30 text-sm">
              © 2025 DECIBEL by <span className="text-white/50 font-medium">Gradient Ascent</span>. Advanced Audio Intelligence.
            </p>
            <div className="flex items-center gap-6">
              <Link href="/" className="text-white/30 hover:text-white/60 text-sm transition-colors">
                Privacy
              </Link>
              <Link href="/" className="text-white/30 hover:text-white/60 text-sm transition-colors">
                Terms
              </Link>
              <Link href="/" className="text-white/30 hover:text-white/60 text-sm transition-colors">
                Support
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </main>
  )
}
