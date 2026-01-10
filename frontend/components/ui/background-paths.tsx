"use client"

import { motion } from "framer-motion"
import { useState, useEffect, useMemo } from "react"

interface PathData {
  d: string
  delay: number
}

function FloatingPath({ d, delay = 0 }: { d: string; delay?: number }) {
  return (
    <motion.path
      d={d}
      fill="none"
      stroke="url(#gradient)"
      strokeWidth="1"
      strokeLinecap="round"
      initial={{ pathLength: 0, opacity: 0 }}
      animate={{
        pathLength: [0, 1, 0],
        opacity: [0.1, 0.3, 0.1],
      }}
      transition={{
        duration: 8,
        ease: "easeInOut",
        delay: delay,
        repeat: Infinity,
      }}
    />
  )
}

export function BackgroundPaths() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Generate paths only on client side to avoid hydration mismatch
  const paths = useMemo(() => {
    if (!mounted) return []
    
    return Array.from({ length: 6 }).map((_, index) => {
      const y = 200 + index * 80
      const amplitude = 30 + Math.random() * 20
      const frequency = 0.01 + Math.random() * 0.02
      const phase = Math.random() * Math.PI * 2

      let d = `M 0 ${y}`
      for (let x = 0; x <= 1200; x += 5) {
        const yOffset = Math.sin(x * frequency + phase) * amplitude
        d += ` L ${x} ${y + yOffset}`
      }

      return { d, delay: index * 0.3 }
    })
  }, [mounted])

  const barAnimations = useMemo(() => {
    if (!mounted) return []
    return Array.from({ length: 20 }).map(() => ({
      scaleY: 0.8 + Math.random() * 0.4,
      duration: 1.5 + Math.random(),
    }))
  }, [mounted])

  if (!mounted) {
    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none bg-gradient-to-br from-purple-900/10 to-blue-900/10" />
    )
  }

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <svg
        className="w-full h-full"
        viewBox="0 0 1200 800"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(102, 126, 234, 0.5)" />
            <stop offset="50%" stopColor="rgba(118, 75, 162, 0.5)" />
            <stop offset="100%" stopColor="rgba(102, 126, 234, 0.5)" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <g filter="url(#glow)">
          {/* Audio waveform-like paths */}
          {paths.map((path, i) => (
            <FloatingPath key={i} d={path.d} delay={path.delay} />
          ))}

          {/* Decorative sound wave circles */}
          {[1, 2, 3].map((ring) => (
            <motion.circle
              key={ring}
              cx="600"
              cy="400"
              r={150 + ring * 80}
              fill="none"
              stroke="url(#gradient)"
              strokeWidth="0.5"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{
                opacity: [0, 0.2, 0],
                scale: [0.8, 1.2, 0.8],
              }}
              transition={{
                duration: 4 + ring,
                repeat: Infinity,
                delay: ring * 0.5,
                ease: "easeInOut",
              }}
            />
          ))}

          {/* Frequency bars */}
          {barAnimations.map((anim, i) => (
            <motion.rect
              key={`bar-${i}`}
              x={100 + i * 50}
              y={350}
              width="3"
              height="100"
              fill="url(#gradient)"
              initial={{ scaleY: 0.3, opacity: 0.1 }}
              animate={{
                scaleY: [0.3, anim.scaleY, 0.3],
                opacity: [0.1, 0.3, 0.1],
              }}
              transition={{
                duration: anim.duration,
                repeat: Infinity,
                delay: i * 0.1,
                ease: "easeInOut",
              }}
              style={{ transformOrigin: "center bottom" }}
            />
          ))}
        </g>
      </svg>
    </div>
  )
}
