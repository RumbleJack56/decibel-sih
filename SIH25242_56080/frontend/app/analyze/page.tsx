import { AnalysisContent } from "@/components/analysis-content"

// Mock user object for components that require it
const mockUser = {
  id: "demo-user",
  email: "demo@example.com",
} as any

export default async function AnalyzePage() {
  return <AnalysisContent user={mockUser} />
}
