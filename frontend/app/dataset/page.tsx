"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { 
  Database,
  Users,
  Globe,
  MapPin,
  Clock,
  FileAudio,
  CheckCircle,
  XCircle,
  Download,
  ExternalLink,
  ArrowLeft,
  Mic,
  Shield,
  Brain,
  MessageSquare,
  BarChart3,
  Layers,
  GitBranch,
  Sparkles
} from "lucide-react"

const datasetStats = [
  { label: "Total Speech Duration", value: "1,684 Hours", icon: Clock },
  { label: "Total Utterances", value: "~900,000", icon: FileAudio },
  { label: "Languages Covered", value: "13 Indic-Asian", icon: Globe },
  { label: "Total Speakers", value: "1,218", icon: Users },
  { label: "Geographic Coverage", value: "203 Districts", icon: MapPin },
  { label: "Gender Balance", value: "~50-50 M/F", icon: Users },
]

const comparisonData = [
  { feature: "ASR (Recognition)", ours: true, mucs: false, msr: true, cv: true, iisc: true },
  { feature: "SID (Speaker ID)", ours: true, mucs: false, msr: false, cv: false, iisc: false },
  { feature: "LID (Language ID)", ours: true, mucs: false, msr: false, cv: false, iisc: false },
  { feature: "ASV (Verification)", ours: true, mucs: false, msr: false, cv: false, iisc: false },
  { feature: "AED (Event Detect)", ours: true, mucs: false, msr: false, cv: false, iisc: false },
  { feature: "ETA (Emotion Trace)", ours: true, mucs: false, msr: false, cv: false, iisc: false },
  { feature: "# Langs Supported", ours: "12+", mucs: "6", msr: "3", cv: "6", iisc: "6" },
]

const pipelineSteps = {
  audio: [
    { title: "Incompatibility Testing", desc: "Automated checks for file integrity, metadata consistency, and acoustic validity (SNR, clipping)" },
    { title: "Quality Selection", desc: "Filtering based on WER/CER metrics and objective quality standards to remove unintelligible audio" },
    { title: "Context-Aware Augmentation", desc: "Noise injection, occlusion, masking, and equalizer simulations applied when semantically relevant" },
  ],
  qa: [
    { title: "Closed-Ended QnA", value: "1.9M Pairs", desc: "Classification and captioning from AudioSet-Strong, VGGSound, and Clotho" },
    { title: "Open-Ended QnA", value: "3.7M Pairs", desc: "Temporal reasoning, acoustic feature analysis, and complex event detection" },
    { title: "Total Instructional Data", value: "5.6M QA Pairs", desc: "Chain of Thought reasoning and role-based prompting" },
  ]
}

const useCases = [
  { icon: Globe, title: "Rural Accessibility", desc: "Bridging the digital divide for users with low literacy via voice-first Indic language interfaces" },
  { icon: Shield, title: "Forensic Analysis", desc: "Deepfake detection, audio tampering analysis, and speaker identification for defense and intelligence" },
  { icon: MessageSquare, title: "CRM Automation", desc: "Sentiment analysis and automated query resolution in high-volume call centers" },
]

export default function DatasetPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#0d0d1a] to-[#0a0a0f] text-white">
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
            href="/"
            className="flex items-center gap-2 text-white/60 hover:text-white transition-colors text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
        </div>
      </nav>

      <div className="pt-28 pb-20 px-6">
        <div className="max-w-6xl mx-auto">
          
          {/* Hero Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-sm mb-6">
              <Database className="w-4 h-4" />
              Project Gradient Ascent
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              Large-Scale Multilingual
              <span className="block bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
                Audio Reasoning Dataset
              </span>
            </h1>
            <p className="text-lg text-white/60 max-w-3xl mx-auto mb-8">
              A comprehensive, high-quality audio dataset engineered for Unified Audio Understanding with 
              <span className="text-white font-semibold"> 1,684 hours</span> of data across 
              <span className="text-white font-semibold"> 13 Indic-Asian languages</span>, captured from 
              <span className="text-white font-semibold"> 1,218 speakers</span> across 
              <span className="text-white font-semibold"> 203 districts</span>.
            </p>
            
            {/* CTA Buttons */}
            <div className="flex items-center justify-center gap-4 flex-wrap">
              <a 
                href="https://www.kaggle.com/datasets/shyyshawarma/indic-decibel-aqa-v0-1"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold hover:shadow-[0_0_30px_rgba(168,85,247,0.4)] transition-all"
              >
                <Download className="w-5 h-5" />
                Download from Kaggle
                <ExternalLink className="w-4 h-4" />
              </a>
              <Link
                href="/upload"
                className="flex items-center gap-2 px-8 py-4 rounded-xl bg-white/10 border border-white/20 text-white font-semibold hover:bg-white/20 transition-all"
              >
                Try DECIBEL
              </Link>
            </div>
          </motion.div>

          {/* Quick Nav */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex items-center justify-center gap-4 flex-wrap mb-16"
          >
            {[
              { label: "Statistics", href: "#statistics" },
              { label: "Comparison", href: "#comparison" },
              { label: "Pipeline", href: "#pipeline" },
              { label: "Sample", href: "#sample" },
              { label: "Use Cases", href: "#usecases" },
            ].map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white/70 text-sm hover:bg-white/10 hover:text-white transition-all"
              >
                {item.label}
              </a>
            ))}
          </motion.div>

          {/* Statistics Section */}
          <motion.section
            id="statistics"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-20"
          >
            <h2 className="text-2xl font-bold mb-8 flex items-center gap-3">
              <BarChart3 className="w-6 h-6 text-purple-400" />
              Dataset Statistics & Distribution
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {datasetStats.map((stat, idx) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-purple-500/30 transition-all group"
                >
                  <stat.icon className="w-8 h-8 text-purple-400 mb-3 group-hover:scale-110 transition-transform" />
                  <div className="text-2xl md:text-3xl font-bold text-white mb-1">{stat.value}</div>
                  <div className="text-white/50 text-sm">{stat.label}</div>
                </motion.div>
              ))}
            </div>
            <p className="mt-6 text-white/60 text-sm">
              <span className="text-purple-400 font-medium">Demographics:</span> The dataset captures a wide age distribution (spanning 10 to 80+ years) and diverse regional accents to mitigate the "digital divide" often present in traditional LLM systems.
            </p>
          </motion.section>

          {/* Comparison Section */}
          <motion.section
            id="comparison"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-20"
          >
            <h2 className="text-2xl font-bold mb-8 flex items-center gap-3">
              <Layers className="w-6 h-6 text-pink-400" />
              Comparison with Existing Benchmarks
            </h2>
            <p className="text-white/60 mb-6">
              Our dataset is the <span className="text-white font-semibold">only one</span> to provide comprehensive coverage across all major audio tasks.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-4 px-4 text-white/70 font-medium">Feature / Task</th>
                    <th className="text-center py-4 px-4 text-purple-400 font-bold">Ours</th>
                    <th className="text-center py-4 px-4 text-white/50">MUCS</th>
                    <th className="text-center py-4 px-4 text-white/50">MSR</th>
                    <th className="text-center py-4 px-4 text-white/50">CommonVoice</th>
                    <th className="text-center py-4 px-4 text-white/50">IISc</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonData.map((row, idx) => (
                    <tr key={row.feature} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="py-3 px-4 text-white/80">{row.feature}</td>
                      <td className="py-3 px-4 text-center">
                        {typeof row.ours === 'boolean' ? (
                          row.ours ? <CheckCircle className="w-5 h-5 text-green-400 mx-auto" /> : <XCircle className="w-5 h-5 text-red-400/50 mx-auto" />
                        ) : (
                          <span className="text-purple-400 font-bold">{row.ours}</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {typeof row.mucs === 'boolean' ? (
                          row.mucs ? <CheckCircle className="w-5 h-5 text-green-400 mx-auto" /> : <XCircle className="w-5 h-5 text-white/20 mx-auto" />
                        ) : (
                          <span className="text-white/50">{row.mucs}</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {typeof row.msr === 'boolean' ? (
                          row.msr ? <CheckCircle className="w-5 h-5 text-green-400 mx-auto" /> : <XCircle className="w-5 h-5 text-white/20 mx-auto" />
                        ) : (
                          <span className="text-white/50">{row.msr}</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {typeof row.cv === 'boolean' ? (
                          row.cv ? <CheckCircle className="w-5 h-5 text-green-400 mx-auto" /> : <XCircle className="w-5 h-5 text-white/20 mx-auto" />
                        ) : (
                          <span className="text-white/50">{row.cv}</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {typeof row.iisc === 'boolean' ? (
                          row.iisc ? <CheckCircle className="w-5 h-5 text-green-400 mx-auto" /> : <XCircle className="w-5 h-5 text-white/20 mx-auto" />
                        ) : (
                          <span className="text-white/50">{row.iisc}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.section>

          {/* Pipeline Section */}
          <motion.section
            id="pipeline"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-20"
          >
            <h2 className="text-2xl font-bold mb-8 flex items-center gap-3">
              <GitBranch className="w-6 h-6 text-cyan-400" />
              Dataset Construction Pipeline
            </h2>
            <p className="text-white/60 mb-8">
              To ensure forensic-grade quality, we implemented a dual-stream processing pipeline covering <span className="text-white font-semibold">Audio Preparation</span> and <span className="text-white font-semibold">Question-Answer Generation</span>.
            </p>
            
            <div className="grid md:grid-cols-2 gap-6">
              {/* Audio Preparation */}
              <div className="p-6 rounded-2xl bg-gradient-to-br from-purple-500/10 to-transparent border border-purple-500/20">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <FileAudio className="w-5 h-5 text-purple-400" />
                  Audio Preparation
                </h3>
                <div className="space-y-4">
                  {pipelineSteps.audio.map((step, idx) => (
                    <div key={idx} className="flex gap-3">
                      <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 text-xs font-bold shrink-0 mt-0.5">
                        {idx + 1}
                      </div>
                      <div>
                        <div className="text-white font-medium">{step.title}</div>
                        <div className="text-white/50 text-sm">{step.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* QnA Preparation */}
              <div className="p-6 rounded-2xl bg-gradient-to-br from-pink-500/10 to-transparent border border-pink-500/20">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Brain className="w-5 h-5 text-pink-400" />
                  Instruction Tuning (QnA)
                </h3>
                <div className="space-y-4">
                  {pipelineSteps.qa.map((step, idx) => (
                    <div key={idx} className="flex gap-3">
                      <div className="w-6 h-6 rounded-full bg-pink-500/20 flex items-center justify-center text-pink-400 text-xs font-bold shrink-0 mt-0.5">
                        {idx + 1}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-white font-medium">{step.title}</span>
                          <span className="px-2 py-0.5 rounded bg-pink-500/20 text-pink-300 text-xs">{step.value}</span>
                        </div>
                        <div className="text-white/50 text-sm">{step.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.section>

          {/* Sample Section */}
          <motion.section
            id="sample"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-20"
          >
            <h2 className="text-2xl font-bold mb-8 flex items-center gap-3">
              <Sparkles className="w-6 h-6 text-amber-400" />
              Data Sample & Annotation Format
            </h2>
            <p className="text-white/60 mb-6">
              Each data point is rich with metadata, including transcription, translation, paralinguistic analysis, and reasoning tracks.
            </p>
            
            <div className="rounded-2xl bg-white/5 border border-white/10 overflow-hidden">
              {/* Sample Header */}
              <div className="px-6 py-4 bg-amber-500/10 border-b border-white/10">
                <div className="flex items-center gap-2 text-amber-400 font-semibold">
                  <FileAudio className="w-5 h-5" />
                  Sample ID: Punjab_Interview_04
                </div>
                <p className="text-white/60 text-sm mt-1">
                  A tense Punjabi political interview where a host questions an elderly guest about 1984 and Operation Blue Star.
                </p>
              </div>
              
              {/* Transcription */}
              <div className="p-6 border-b border-white/10">
                <h4 className="text-sm font-semibold text-white/70 uppercase tracking-wider mb-4">Transcription (Segment)</h4>
                <div className="space-y-3">
                  <div className="p-3 rounded-lg bg-purple-500/10 border-l-2 border-purple-500">
                    <span className="text-purple-400 text-sm font-medium">[Guest]:</span>
                    <p className="text-white/80 text-sm mt-1">"Professor Harpal Singh Pannu is considered a great scholar... Jarnail Singh left his Mehta Chowk camp and made Darbar Sahib his battleground."</p>
                  </div>
                  <div className="p-3 rounded-lg bg-pink-500/10 border-l-2 border-pink-500">
                    <span className="text-pink-400 text-sm font-medium">[Interviewer]:</span>
                    <p className="text-white/80 text-sm mt-1">"Where did those weapons come from? AK-47s, Sten guns... no one is allowed to keep them without the permission of the Government of India."</p>
                  </div>
                </div>
              </div>

              {/* Annotations */}
              <div className="p-6">
                <h4 className="text-sm font-semibold text-white/70 uppercase tracking-wider mb-4">Forensic & Paralinguistic Annotations</h4>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-white/5">
                    <div className="text-cyan-400 text-sm font-medium mb-2">Emotion Trace</div>
                    <p className="text-white/70 text-sm">High-arousal, confrontational. Guest is defensive; Interviewer is skeptical and demanding proof.</p>
                  </div>
                  <div className="p-4 rounded-xl bg-white/5">
                    <div className="text-green-400 text-sm font-medium mb-2">Acoustic Features</div>
                    <p className="text-white/70 text-sm">Interviewer: Smooth, professional broadcasting voice. Guest: Elderly, gravelly, raspy texture. Environment: High-quality studio recording.</p>
                  </div>
                  <div className="p-4 rounded-xl bg-white/5">
                    <div className="text-amber-400 text-sm font-medium mb-2">Speaker Diarization</div>
                    <p className="text-white/70 text-sm">Dyadic Interaction. Guest holds long narrative periods; Interviewer interjects for fact-checking, shifting tempo from monologue to debate.</p>
                  </div>
                  <div className="p-4 rounded-xl bg-white/5">
                    <div className="text-purple-400 text-sm font-medium mb-2">Open-Ended Reasoning</div>
                    <p className="text-white/70 text-sm">The guest resolves conflict by dismissing written records as "lies" and prioritizing his eyewitness testimony over historical texts.</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.section>

          {/* Use Cases Section */}
          <motion.section
            id="usecases"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-20"
          >
            <h2 className="text-2xl font-bold mb-8 flex items-center gap-3">
              <Shield className="w-6 h-6 text-green-400" />
              Usage & Applications
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              {useCases.map((useCase, idx) => (
                <motion.div
                  key={useCase.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-green-500/30 transition-all group"
                >
                  <useCase.icon className="w-10 h-10 text-green-400 mb-4 group-hover:scale-110 transition-transform" />
                  <h3 className="text-lg font-semibold text-white mb-2">{useCase.title}</h3>
                  <p className="text-white/60 text-sm">{useCase.desc}</p>
                </motion.div>
              ))}
            </div>
          </motion.section>

          {/* Limitations */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-20"
          >
            <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
              <h3 className="text-lg font-semibold text-white mb-4">Current Limitations</h3>
              <ul className="space-y-2 text-white/60 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-amber-400">•</span>
                  While significantly more diverse than previous datasets, high-quality real-world audio data remains limited in quantity compared to text corpora.
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-400">•</span>
                  The MoE architecture fueled by this data can suffer from latency due to sequential expert routing.
                </li>
              </ul>
            </div>
          </motion.section>

          {/* Final CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <h2 className="text-2xl font-bold mb-4">Ready to Explore?</h2>
            <p className="text-white/60 mb-8">Download the dataset from Kaggle or try DECIBEL to see it in action.</p>
            <div className="flex items-center justify-center gap-4 flex-wrap">
              <a 
                href="https://www.kaggle.com/datasets/shyyshawarma/indic-decibel-aqa-v0-1"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold hover:shadow-[0_0_30px_rgba(168,85,247,0.4)] transition-all"
              >
                <Download className="w-5 h-5" />
                Download from Kaggle
                <ExternalLink className="w-4 h-4" />
              </a>
              <Link
                href="/upload"
                className="flex items-center gap-2 px-8 py-4 rounded-xl bg-white text-black font-semibold hover:bg-white/90 transition-all"
              >
                Try DECIBEL
              </Link>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8 px-6">
        <div className="max-w-6xl mx-auto text-center text-white/40 text-sm">
          <p>Team Gradient Ascent (ID: 56080) • SIH Project</p>
          <p className="mt-2">DECIBEL - Large-Scale Multilingual Audio Reasoning Dataset</p>
        </div>
      </footer>
    </main>
  )
}
