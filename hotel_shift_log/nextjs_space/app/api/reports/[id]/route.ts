
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { UserRole } from '@prisma/client'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const reportId = params.id
    
    const report = await prisma.shiftReport.findUnique({
      where: { id: reportId },
      include: {
        author: {
          select: {
            name: true,
            username: true
          }
        },
        attachments: {
          select: {
            filename: true,
            originalName: true
          }
        },
        comments: {
          include: {
            author: {
              select: {
                id: true,
                name: true
              }
            },
            likes: {
              select: {
                userId: true
              }
            }
          },
          orderBy: {
            createdAt: 'asc'
          }
        },
        acknowledgements: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                username: true,
                role: true
              }
            }
          },
          orderBy: {
            acknowledgedAt: 'asc'
          }
        }
      }
    })

    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 })
    }

    return NextResponse.json(report)
  } catch (error) {
    console.error('Error fetching report:', error)
    return NextResponse.json(
      { error: 'Failed to fetch report' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Managers and Super Admins can hide reports
    if (session.user.role !== UserRole.MANAGER && session.user.role !== UserRole.SUPER_ADMIN) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const reportId = params.id
    const body = await request.json()
    const { isHidden } = body

    // Update the report's hidden status
    await prisma.shiftReport.update({
      where: { id: reportId },
      data: { isHidden }
    })

    return NextResponse.json({ message: 'Report updated successfully' })
  } catch (error) {
    console.error('Error updating report:', error)
    return NextResponse.json(
      { error: 'Failed to update report' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only super admin can delete reports
    if (session.user.role !== UserRole.SUPER_ADMIN) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const reportId = params.id

    // Delete the report (cascading deletes will handle comments and attachments)
    await prisma.shiftReport.delete({
      where: { id: reportId }
    })

    return NextResponse.json({ message: 'Report deleted successfully' })
  } catch (error) {
    console.error('Error deleting report:', error)
    return NextResponse.json(
      { error: 'Failed to delete report' },
      { status: 500 }
    )
  }
}
