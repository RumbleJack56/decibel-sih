import { ProcessingContent } from "@/components/processing-content"

// Mock user object for components that require it
const mockUser = {
  id: "demo-user",
  email: "demo@example.com",
} as any

export default async function ProcessingPage() {
  return <ProcessingContent user={mockUser} />
}
