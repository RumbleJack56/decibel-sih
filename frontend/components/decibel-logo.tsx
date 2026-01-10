"use client"

import React from "react"
import { cn } from "@/lib/utils"

interface DecibelLogoProps {
  className?: string
  showText?: boolean
  textClassName?: string
  iconOnly?: boolean
  size?: "sm" | "md" | "lg" | "xl"
}

// The DECIBEL audio wave bars logo
export function DecibelLogo({ 
  className = "", 
  showText = true, 
  textClassName = "",
  iconOnly = false,
  size = "md"
}: DecibelLogoProps) {
  const sizeClasses = {
    sm: { icon: "w-6 h-6", text: "text-sm" },
    md: { icon: "w-8 h-8", text: "text-xl" },
    lg: { icon: "w-10 h-10", text: "text-2xl" },
    xl: { icon: "w-12 h-12", text: "text-3xl" },
  }

  const iconSize = sizeClasses[size].icon
  const textSize = sizeClasses[size].text

  if (iconOnly) {
    return <DecibelLogoIcon className={cn(iconSize, className)} />
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <DecibelLogoIcon className={iconSize} />
      {showText && (
        <span className={cn(
          "font-bold tracking-wider text-white",
          textSize,
          textClassName
        )}>
          DECIBEL
        </span>
      )}
    </div>
  )
}

// Just the icon part - audio wave bars
export function DecibelLogoIcon({ className = "" }: { className?: string }) {
  return (
    <svg 
      viewBox="0 0 40 48" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={cn("flex-shrink-0", className)}
    >
      {/* Left outer bar - shortest, rounded */}
      <rect 
        x="2" 
        y="16" 
        width="6" 
        height="16" 
        rx="3" 
        fill="currentColor"
        className="text-white"
      />
      
      {/* Left inner bar - medium height */}
      <rect 
        x="11" 
        y="10" 
        width="6" 
        height="28" 
        rx="3" 
        fill="currentColor"
        className="text-white"
      />
      
      {/* Center bar - tallest */}
      <rect 
        x="20" 
        y="4" 
        width="6" 
        height="40" 
        rx="3" 
        fill="currentColor"
        className="text-white"
      />
      
      {/* Right inner bar - medium height */}
      <rect 
        x="29" 
        y="10" 
        width="6" 
        height="28" 
        rx="3" 
        fill="currentColor"
        className="text-white"
      />
      
      {/* Right outer bar - shortest, rounded */}
      <rect 
        x="38" 
        y="16" 
        width="6" 
        height="16" 
        rx="3" 
        fill="currentColor"
        className="text-white"
      />
    </svg>
  )
}

// Gradient version of the logo icon
export function DecibelLogoIconGradient({ className = "" }: { className?: string }) {
  const gradientId = React.useId()
  
  return (
    <svg 
      viewBox="0 0 46 48" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={cn("flex-shrink-0", className)}
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="48" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#A855F7" />
          <stop offset="50%" stopColor="#8B5CF6" />
          <stop offset="100%" stopColor="#6366F1" />
        </linearGradient>
      </defs>
      
      {/* Left outer bar */}
      <rect 
        x="2" 
        y="16" 
        width="6" 
        height="16" 
        rx="3" 
        fill={`url(#${gradientId})`}
      />
      
      {/* Left inner bar */}
      <rect 
        x="11" 
        y="10" 
        width="6" 
        height="28" 
        rx="3" 
        fill={`url(#${gradientId})`}
      />
      
      {/* Center bar */}
      <rect 
        x="20" 
        y="4" 
        width="6" 
        height="40" 
        rx="3" 
        fill={`url(#${gradientId})`}
      />
      
      {/* Right inner bar */}
      <rect 
        x="29" 
        y="10" 
        width="6" 
        height="28" 
        rx="3" 
        fill={`url(#${gradientId})`}
      />
      
      {/* Right outer bar */}
      <rect 
        x="38" 
        y="16" 
        width="6" 
        height="16" 
        rx="3" 
        fill={`url(#${gradientId})`}
      />
    </svg>
  )
}

export default DecibelLogo
