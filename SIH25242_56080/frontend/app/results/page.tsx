import { ResultsListContent } from "@/components/results-list-content"

// Mock user object for components that require it
const mockUser = {
  id: "demo-user",
  email: "demo@example.com",
} as any

export default async function ResultsPage() {
  return <ResultsListContent user={mockUser} />
}
