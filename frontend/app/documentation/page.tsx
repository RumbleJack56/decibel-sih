import { Scene } from "@/components/ui/hero-section"
import { FloatingNavbar } from "@/components/floating-navbar"
import { Badge } from "@/components/ui/badge"
import { Book, Code, Zap, FileText } from "lucide-react"
import Link from "next/link"

const docs = [
  {
    icon: Book,
    title: "Getting Started",
    description: "Learn the basics of DECIBEL and set up your first project.",
    href: "/documentation/getting-started",
  },
  {
    icon: Code,
    title: "API Reference",
    description: "Complete API documentation with examples and code snippets.",
    href: "/documentation/api",
  },
  {
    icon: Zap,
    title: "Quick Start Guide",
    description: "Get up and running with DECIBEL in under 5 minutes.",
    href: "/documentation/quickstart",
  },
  {
    icon: FileText,
    title: "Tutorials",
    description: "Step-by-step guides for common use cases and integrations.",
    href: "/documentation/tutorials",
  },
]

export default function DocumentationPage() {
  return (
    <main className="relative min-h-screen overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <Scene />
      </div>
      <div className="fixed inset-0 z-[5] bg-black/50" />
      <FloatingNavbar />

      <div className="relative z-10 pt-32 pb-20 px-4">
        <div className="mx-auto max-w-4xl">
          <div className="text-center mb-16">
            <Badge className="bg-white/10 text-white border-white/20 backdrop-blur-sm mb-4">Documentation</Badge>
            <h1 className="text-4xl md:text-6xl font-open-sans-custom text-white mb-6 [text-shadow:_0_4px_20px_rgb(0_0_0_/_60%)]">
              DECIBEL Documentation
            </h1>
            <p className="text-lg text-gray-300 font-open-sans-custom max-w-2xl mx-auto [text-shadow:_0_2px_10px_rgb(0_0_0_/_50%)]">
              Everything you need to integrate and use DECIBEL in your applications.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {docs.map((doc, index) => (
              <Link key={index} href={doc.href}>
                <div className="p-6 rounded-2xl border-2 border-white/10 bg-white/5 backdrop-blur-sm hover:bg-white/10 transition-all duration-300 h-full">
                  <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center mb-4">
                    <doc.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-white font-open-sans-custom text-xl mb-2">{doc.title}</h3>
                  <p className="text-gray-300 text-sm font-open-sans-custom leading-relaxed">{doc.description}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </main>
  )
}
