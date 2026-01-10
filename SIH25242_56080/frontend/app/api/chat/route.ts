import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// GET /api/chat - Get chat history for a user and/or audio
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get('userId')
    const audioId = searchParams.get('audioId')

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      )
    }

    const where: { userId: string; audioId?: string } = { userId }
    if (audioId) {
      where.audioId = audioId
    }

    const chatHistory = await prisma.chatHistory.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100, // Limit to last 100 messages
    })

    return NextResponse.json({ chatHistory })
  } catch (error) {
    console.error('Error fetching chat history:', error)
    return NextResponse.json(
      { error: 'Failed to fetch chat history' },
      { status: 500 }
    )
  }
}

// POST /api/chat - Save a new chat message
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, audioId, question, response } = body

    if (!userId || !audioId || !question || !response) {
      return NextResponse.json(
        { error: 'userId, audioId, question, and response are required' },
        { status: 400 }
      )
    }

    const chatEntry = await prisma.chatHistory.create({
      data: {
        userId,
        audioId,
        question,
        response,
      },
    })

    return NextResponse.json({ chatEntry }, { status: 201 })
  } catch (error) {
    console.error('Error saving chat message:', error)
    return NextResponse.json(
      { error: 'Failed to save chat message' },
      { status: 500 }
    )
  }
}

// DELETE /api/chat - Delete chat history
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get('userId')
    const audioId = searchParams.get('audioId')
    const chatId = searchParams.get('id')

    if (chatId) {
      // Delete specific chat entry
      await prisma.chatHistory.delete({
        where: { id: parseInt(chatId) },
      })
    } else if (userId && audioId) {
      // Delete all chat entries for a specific audio
      await prisma.chatHistory.deleteMany({
        where: { userId, audioId },
      })
    } else if (userId) {
      // Delete all chat entries for a user
      await prisma.chatHistory.deleteMany({
        where: { userId },
      })
    } else {
      return NextResponse.json(
        { error: 'id, userId, or userId+audioId is required' },
        { status: 400 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting chat history:', error)
    return NextResponse.json(
      { error: 'Failed to delete chat history' },
      { status: 500 }
    )
  }
}
