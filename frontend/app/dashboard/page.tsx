import { DashboardContent } from "@/components/dashboard-content"

// Mock user object for components that require it
const mockUser = {
  id: "demo-user",
  email: "demo@example.com",
} as any

export default async function DashboardPage() {
  return <DashboardContent user={mockUser} />
}
