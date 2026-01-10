import { ResultsDetailContent } from "@/components/results-detail-content"

// Mock user object for components that require it
const mockUser = {
  id: "demo-user",
  email: "demo@example.com",
} as any

export default async function ResultsDetailPage({ params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await params
  return <ResultsDetailContent user={mockUser} jobId={jobId} />
}
