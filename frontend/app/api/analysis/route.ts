import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// GET /api/analysis - Get cached analysis data
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const audioId = searchParams.get('audioId')

    if (audioId) {
      // Get specific analysis
      const analysis = await prisma.analysisCache.findUnique({
        where: { audioId },
      })

      if (!analysis) {
        return NextResponse.json(
          { error: 'Analysis not found' },
          { status: 404 }
        )
      }

      return NextResponse.json({
        ...analysis,
        analysisData: JSON.parse(analysis.analysisData),
      })
    }

    // Get all analyses (list for workspace)
    const analyses = await prisma.analysisCache.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        audioId: true,
        audioName: true,
        status: true,
        hasTranscript: true,
        hasEmotion: true,
        hasDeepfake: true,
        hasEvents: true,
        createdAt: true,
        updatedAt: true,
        errorMessage: true,
      },
    })

    return NextResponse.json({ analyses })
  } catch (error) {
    console.error('Error fetching analysis:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analysis' },
      { status: 500 }
    )
  }
}

// POST /api/analysis - Save analysis data
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      audioId,
      audioName,
      analysisData,
      status = 'completed',
      errorMessage,
      hasTranscript = true,
      hasEmotion = true,
      hasDeepfake = true,
      hasEvents = true,
    } = body

    if (!audioId || !audioName) {
      return NextResponse.json(
        { error: 'audioId and audioName are required' },
        { status: 400 }
      )
    }

    const analysis = await prisma.analysisCache.upsert({
      where: { audioId },
      create: {
        audioId,
        audioName,
        analysisData: JSON.stringify(analysisData || {}),
        status,
        errorMessage,
        hasTranscript,
        hasEmotion,
        hasDeepfake,
        hasEvents,
      },
      update: {
        audioName,
        analysisData: JSON.stringify(analysisData || {}),
        status,
        errorMessage,
        hasTranscript,
        hasEmotion,
        hasDeepfake,
        hasEvents,
      },
    })

    return NextResponse.json({ analysis }, { status: 201 })
  } catch (error) {
    console.error('Error saving analysis:', error)
    return NextResponse.json(
      { error: 'Failed to save analysis' },
      { status: 500 }
    )
  }
}

// DELETE /api/analysis - Delete analysis data
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const audioId = searchParams.get('audioId')

    if (!audioId) {
      return NextResponse.json(
        { error: 'audioId is required' },
        { status: 400 }
      )
    }

    await prisma.analysisCache.delete({
      where: { audioId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting analysis:', error)
    return NextResponse.json(
      { error: 'Failed to delete analysis' },
      { status: 500 }
    )
  }
}
