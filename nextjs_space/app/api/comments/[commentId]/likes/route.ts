
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { commentId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { commentId } = params

    // Get all likes with user details
    const likes = await prisma.commentLike.findMany({
      where: { commentId },
      include: {
        comment: {
          include: {
            author: {
              select: {
                id: true
              }
            }
          }
        }
      }
    })

    // Get user details for each like
    const userIds = likes.map((like: { userId: string }) => like.userId)
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: {
        id: true,
        name: true,
        username: true
      }
    })

    // Map user IDs to names
    const userMap = new Map(users.map((u: { id: string; name: string; username: string }) => [u.id, u.name || u.username]))
    const likedByNames = userIds.map((id: string) => userMap.get(id) || 'Unknown User')

    return NextResponse.json({ likedBy: likedByNames })
  } catch (error) {
    console.error('Error fetching comment likes:', error)
    return NextResponse.json({ error: 'Failed to fetch likes' }, { status: 500 })
  }
}
