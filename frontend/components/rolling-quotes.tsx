"use client"

import { useEffect, useState } from "react"

const quotes = [
  "I make noise mean something.",
  "I turn sound into intelligence.",
  "Waveforms whisper. Models listen.",
  "Signal in. Meaning out.",
  "Entropy is just another puzzle.",
  "Noise is my raw material.",
  "Everything is a signal.",
]

export function RollingQuotes() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const interval = setInterval(() => {
      setIsVisible(false)
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % quotes.length)
        setIsVisible(true)
      }, 500)
    }, 4000)

    return () => clearInterval(interval)
  }, [])

  return (
    <p
      className={`text-[#C0C0C0] font-serif italic text-lg transition-opacity duration-500 ${
        isVisible ? "opacity-100" : "opacity-0"
      }`}
    >
      "{quotes[currentIndex]}"
    </p>
  )
}
