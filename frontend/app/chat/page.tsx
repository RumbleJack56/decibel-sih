import { ChatContent } from "@/components/chat-content"

// Mock user object for components that require it
const mockUser = {
  id: "demo-user",
  email: "demo@example.com",
} as any

export default async function ChatPage() {
  return <ChatContent user={mockUser} />
}
