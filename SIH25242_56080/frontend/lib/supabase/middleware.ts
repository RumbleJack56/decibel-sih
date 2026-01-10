import { NextResponse, type NextRequest } from "next/server"

export async function updateSession(request: NextRequest) {
  // Authentication handled by DECIBEL's own auth system
  // Allow all requests to proceed - auth is handled at the page level
  return NextResponse.next({
    request,
  })
}
