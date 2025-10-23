
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { Priority, UserRole, CommentType } from '@prisma/client'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '25')
    const priority = searchParams.get('priority')
    const hasAttachments = searchParams.get('hasAttachments') === 'true'
    const hasComments = searchParams.get('hasComments') === 'true'
    const hasStayovers = searchParams.get('hasStayovers') === 'true'
    const searchText = searchParams.get('searchText')
    const employeeFilter = searchParams.get('employeeFilter')
    const notedRoom = searchParams.get('notedRoom')
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')
    const showArchived = searchParams.get('showArchived') === 'true'
    const hideUnarchived = searchParams.get('hideUnarchived') === 'true'
    const resolvedStatus = searchParams.get('resolvedStatus') || 'all'

    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}

    // Handle archived reports visibility
    if (session.user.role === 'EMPLOYEE') {
      // Staff users should only see non-archived reports
      where.isHidden = false
    } else {
      // For Managers and Super Admins, handle archive filters
      if (showArchived && hideUnarchived) {
        // Both checked: show only archived reports
        where.isHidden = true
      } else if (showArchived && !hideUnarchived) {
        // Show archived only: show all reports (no filter)
        // Don't set isHidden filter
      } else if (!showArchived && hideUnarchived) {
        // Neither checked: show nothing (impossible condition)
        where.id = 'impossible-id-that-will-never-match'
      } else {
        // Default: hide archived reports (show only unarchived)
        where.isHidden = false
      }
    }

    if (priority && priority !== 'all') {
      where.priority = priority as Priority
    }

    // Add resolved status filter
    if (resolvedStatus === 'resolved') {
      where.isResolved = true
    } else if (resolvedStatus === 'unresolved') {
      where.isResolved = false
    }
    // If 'all', don't add any filter

    if (employeeFilter && employeeFilter !== 'all') {
      where.authorId = employeeFilter
    }

    if (notedRoom) {
      where.notedRooms = {
        has: parseInt(notedRoom)
      }
    }

    if (dateFrom || dateTo) {
      where.createdAt = {}
      if (dateFrom) {
        where.createdAt.gte = new Date(dateFrom)
      }
      if (dateTo) {
        // Add one day to include the entire end date
        const endDate = new Date(dateTo)
        endDate.setDate(endDate.getDate() + 1)
        where.createdAt.lt = endDate
      }
    }

    if (searchText) {
      where.OR = [
        {
          bodyText: {
            contains: searchText,
            mode: 'insensitive'
          }
        },
        {
          attachments: {
            some: {
              originalName: {
                contains: searchText,
                mode: 'insensitive'
              }
            }
          }
        }
      ]
    }

    if (hasAttachments) {
      where.attachments = {
        some: {}
      }
    }

    if (hasComments) {
      // Employees should only see reports with public comments
      // Managers and Super Admins see reports with any comments
      if (session.user.role === UserRole.EMPLOYEE) {
        where.comments = {
          some: {
            commentType: CommentType.PUBLIC,
            isHidden: false
          }
        }
      } else {
        where.comments = {
          some: {}
        }
      }
    }

    if (hasStayovers) {
      where.stayoverRooms = {
        isEmpty: false
      }
    }

    // Build comments filter based on user role
    let commentsWhere: any = {}
    
    if (session.user.role === UserRole.EMPLOYEE) {
      // Staff users should only see non-hidden public comments
      commentsWhere = {
        commentType: CommentType.PUBLIC,
        isHidden: false
      }
    } else {
      // Managers and Super Admins can see all comments
      // No filtering needed
    }

    const reports = await prisma.shiftReport.findMany({
      where,
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
          where: commentsWhere,
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
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip,
      take: limit + 1 // Take one extra to check if there are more
    })

    const hasMore = reports.length > limit
    const finalReports = hasMore ? reports.slice(0, limit) : reports

    return NextResponse.json({
      reports: finalReports,
      hasMore,
      page,
      limit
    })
  } catch (error) {
    console.error('Error fetching reports:', error)
    return NextResponse.json(
      { error: 'Failed to fetch reports' },
      { status: 500 }
    )
  }
}
