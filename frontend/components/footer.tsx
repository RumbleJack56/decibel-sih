import Link from "next/link"
import { Layers, Cpu, Heart } from "lucide-react"

const footerLinks = {
  features: [
    { label: "Overview", href: "/features" },
    { label: "Audio Analysis", href: "/analyze" },
    { label: "Workspace", href: "/workspace" },
    { label: "Reports", href: "/reports" },
  ],
  technology: [
    { label: "Tech Stack", href: "/documentation" },
    { label: "Documentation", href: "/documentation" },
    { label: "Get Started", href: "/upload" },
  ],
  about: [
    { label: "Gradient Ascent", href: "#" },
    { label: "Settings", href: "/settings" },
    { label: "Sign In", href: "/login" },
  ],
}

// DECIBEL audio bars logo component
function DecibelLogoIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 46 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="footer-logo-gradient" x1="0" y1="0" x2="0" y2="48" gradientUnits="userSpaceOnUse">
          <stop stopColor="#a78bfa" />
          <stop offset="0.5" stopColor="#c084fc" />
          <stop offset="1" stopColor="#e879f9" />
        </linearGradient>
      </defs>
      <rect x="2" y="16" width="6" height="16" rx="3" fill="url(#footer-logo-gradient)" />
      <rect x="11" y="10" width="6" height="28" rx="3" fill="url(#footer-logo-gradient)" />
      <rect x="20" y="4" width="6" height="40" rx="3" fill="url(#footer-logo-gradient)" />
      <rect x="29" y="10" width="6" height="28" rx="3" fill="url(#footer-logo-gradient)" />
      <rect x="38" y="16" width="6" height="16" rx="3" fill="url(#footer-logo-gradient)" />
    </svg>
  )
}

// Animated audio bars for logo decoration
function AudioBars() {
  return (
    <div className="flex items-end gap-[2px] h-5">
      {[0.6, 1, 0.4, 0.8, 0.5].map((height, i) => (
        <div
          key={i}
          className="w-[3px] bg-gradient-to-t from-purple-500 to-pink-500 rounded-full animate-pulse"
          style={{
            height: `${height * 100}%`,
            animationDelay: `${i * 0.15}s`,
            animationDuration: '1s',
          }}
        />
      ))}
    </div>
  )
}

export function Footer() {
  return (
    <footer className="relative border-t border-white/[0.08] bg-[#0a0a0f]">
      <div className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-4 lg:grid-cols-5">
          {/* Logo and Description */}
          <div className="col-span-1 lg:col-span-2">
            <Link href="/" className="flex items-center gap-3 mb-5 group">
              <DecibelLogoIcon className="w-8 h-8" />
              <span className="text-xl font-bold tracking-wider text-white">DECIBEL</span>
            </Link>
            <p className="text-sm text-white/50 leading-relaxed max-w-xs mb-6">
              Advanced Audio Intelligence Platform - Decode intent, emotion, and authenticity from any audio.
            </p>
            <AudioBars />
          </div>

          {/* Features */}
          <div>
            <div className="flex items-center gap-2 mb-5">
              <Layers className="w-4 h-4 text-purple-400" />
              <h3 className="text-white font-semibold">Features</h3>
            </div>
            <ul className="space-y-3">
              {footerLinks.features.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-white/50 hover:text-white transition-colors flex items-center gap-2 group"
                  >
                    <span className="w-1 h-1 rounded-full bg-purple-500/50 group-hover:bg-purple-400 transition-colors" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Technology */}
          <div>
            <div className="flex items-center gap-2 mb-5">
              <Cpu className="w-4 h-4 text-blue-400" />
              <h3 className="text-white font-semibold">Technology</h3>
            </div>
            <ul className="space-y-3">
              {footerLinks.technology.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-white/50 hover:text-white transition-colors flex items-center gap-2 group"
                  >
                    <span className="w-1 h-1 rounded-full bg-blue-500/50 group-hover:bg-blue-400 transition-colors" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* About */}
          <div>
            <div className="flex items-center gap-2 mb-5">
              <Heart className="w-4 h-4 text-pink-400" />
              <h3 className="text-white font-semibold">About</h3>
            </div>
            <ul className="space-y-3">
              {footerLinks.about.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-white/50 hover:text-white transition-colors flex items-center gap-2 group"
                  >
                    <span className="w-1 h-1 rounded-full bg-pink-500/50 group-hover:bg-pink-400 transition-colors" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-16 pt-8 border-t border-white/[0.08] flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-white/40">
            <span>© 2025 DECIBEL by</span>
            <Link href="#" className="text-purple-400 hover:text-purple-300 transition-colors font-medium">
              Gradient Ascent
            </Link>
            <span className="mx-2">•</span>
            <span>Advanced Audio Intelligence</span>
          </div>
          <div className="flex gap-6">
            <Link
              href="/privacy"
              className="text-sm text-white/40 hover:text-white transition-colors"
            >
              Privacy
            </Link>
            <Link
              href="/terms"
              className="text-sm text-white/40 hover:text-white transition-colors"
            >
              Terms
            </Link>
            <Link
              href="/support"
              className="text-sm text-white/40 hover:text-white transition-colors"
            >
              Support
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
