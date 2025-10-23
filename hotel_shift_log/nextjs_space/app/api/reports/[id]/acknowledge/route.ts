
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const reportId = params.id

    // Check if report exists
    const report = await prisma.shiftReport.findUnique({
      where: { id: reportId },
    })

    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 })
    }

    // Check if user already acknowledged this report
    const existingAcknowledgement = await prisma.reportAcknowledgement.findUnique({
      where: {
        shiftReportId_userId: {
          shiftReportId: reportId,
          userId: session.user.id,
        },
      },
    })

    if (existingAcknowledgement) {
      return NextResponse.json({ error: 'Report already acknowledged' }, { status: 400 })
    }

    // Create acknowledgement
    await prisma.reportAcknowledgement.create({
      data: {
        shiftReportId: reportId,
        userId: session.user.id,
      },
    })

    // Fetch updated report with acknowledgements
    const updatedReport = await prisma.shiftReport.findUnique({
      where: { id: reportId },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            username: true,
            role: true,
          },
        },
        acknowledgements: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                username: true,
                role: true,
              },
            },
          },
          orderBy: {
            acknowledgedAt: 'asc',
          },
        },
        comments: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
                username: true,
                role: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    })

    return NextResponse.json(updatedReport)
  } catch (error) {
    console.error('Error acknowledging report:', error)
    return NextResponse.json(
      { error: 'Failed to acknowledge report' },
      { status: 500 }
    )
  }
}
