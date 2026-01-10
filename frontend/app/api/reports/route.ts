import { NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const reports = await prisma.report.findMany({
      where: { userId: user.id },
      include: { file: true },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ reports })
  } catch (error) {
    console.error('Get reports error:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { fileId, type, content } = await request.json()

    const report = await prisma.report.create({
      data: {
        userId: user.id,
        fileId: fileId || null,
        type: type || 'analysis',
        content: JSON.stringify(content),
      },
    })

    return NextResponse.json({ report })
  } catch (error) {
    console.error('Create report error:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}



