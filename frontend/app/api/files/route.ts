import { NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { getCurrentUser, hashPassword } from '@/lib/auth'

export async function GET() {
  try {
    let user = await getCurrentUser()
    
    // If no user, get demo user
    if (!user) {
      const demoEmail = 'demo@decibel.ai'
      user = await prisma.user.findUnique({
        where: { email: demoEmail },
        select: {
          id: true,
          email: true,
          name: true,
          createdAt: true,
        },
      })
    }

    if (!user) {
      return NextResponse.json({ files: [] })
    }

    const files = await prisma.file.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ files })
  } catch (error) {
    console.error('Get files error:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    let user = await getCurrentUser()
    
    // If no user, create or get a default demo user
    if (!user) {
      const demoEmail = 'demo@decibel.ai'
      user = await prisma.user.findUnique({
        where: { email: demoEmail },
        select: {
          id: true,
          email: true,
          name: true,
          createdAt: true,
        },
      })
      
      if (!user) {
        // Create demo user if it doesn't exist
        user = await prisma.user.create({
          data: {
            email: demoEmail,
            password: await hashPassword('demo'),
            name: 'Demo User',
          },
          select: {
            id: true,
            email: true,
            name: true,
            createdAt: true,
          },
        })
      }
    }

    const { name, duration } = await request.json()

    const file = await prisma.file.create({
      data: {
        userId: user.id,
        name,
        duration: duration || 0,
        status: 'uploaded',
      },
    })

    return NextResponse.json({ file })
  } catch (error) {
    console.error('Create file error:', error)
    return NextResponse.json({ message: 'Internal server error', error: String(error) }, { status: 500 })
  }
}


