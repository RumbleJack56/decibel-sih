import { UploadConfirmContent } from "@/components/upload-confirm-content"

// Mock user object for components that require it
const mockUser = {
  id: "demo-user",
  email: "demo@example.com",
} as any

export default async function UploadConfirmPage() {
  return <UploadConfirmContent user={mockUser} />
}
