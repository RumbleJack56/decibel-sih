import { createBrowserClient } from "@supabase/ssr"

export function createClient() {
  // Check if valid Supabase credentials are configured
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  // Only create client if valid URL (not placeholder)
  if (!supabaseUrl || !supabaseAnonKey || 
      supabaseUrl.includes("placeholder") || 
      supabaseUrl === "your-project-url-here" ||
      supabaseAnonKey === "your-anon-key-here") {
    // Return a mock client that won't cause errors
    return createBrowserClient("https://placeholder.supabase.co", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYWNlaG9sZGVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NDUxOTI4MDAsImV4cCI6MTk2MDc2ODgwMH0.placeholder")
  }
  
  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}
