
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

    // Only managers and super admins can resolve reports
    if (session.user.role !== 'MANAGER' && session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const reportId = params.id

    // Check if report exists
    const report = await prisma.shiftReport.findUnique({
      where: { id: reportId },
    })

    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 })
    }

    if (report.isResolved) {
      return NextResponse.json({ error: 'Report already resolved' }, { status: 400 })
    }

    // Mark report as resolved
    const updatedReport = await prisma.shiftReport.update({
      where: { id: reportId },
      data: { isResolved: true },
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
    console.error('Error resolving report:', error)
    return NextResponse.json(
      { error: 'Failed to resolve report' },
      { status: 500 }
    )
  }
}
