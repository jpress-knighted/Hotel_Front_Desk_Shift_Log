
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const dailyTracker = await prisma.dailyPostTracker.findUnique({
      where: {
        userId_date: {
          userId: session.user.id,
          date: today
        }
      }
    })

    return NextResponse.json({ 
      count: dailyTracker?.postCount || 0,
      limit: 10 
    })
  } catch (error) {
    console.error('Error fetching daily post count:', error)
    return NextResponse.json(
      { error: 'Failed to fetch daily post count' },
      { status: 500 }
    )
  }
}
