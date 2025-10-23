
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { UserRole } from '@prisma/client'

export async function POST(
  request: NextRequest,
  { params }: { params: { commentId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { commentId } = params

    // Check if comment exists
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
    })

    if (!comment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 })
    }

    // Users cannot like their own comments
    if (comment.authorId === session.user.id) {
      return NextResponse.json({ error: 'Cannot like your own comment' }, { status: 403 })
    }

    // Check if already liked - likes are permanent and cannot be undone
    const existingLike = await prisma.commentLike.findUnique({
      where: {
        commentId_userId: {
          commentId,
          userId: session.user.id,
        },
      },
    })

    if (existingLike) {
      // Already liked - return success without doing anything
      return NextResponse.json({ liked: true, alreadyLiked: true })
    }

    // Add like
    await prisma.commentLike.create({
      data: {
        commentId,
        userId: session.user.id,
      },
    })
    
    return NextResponse.json({ liked: true, alreadyLiked: false })
  } catch (error) {
    console.error('Error toggling comment like:', error)
    return NextResponse.json({ error: 'Failed to toggle like' }, { status: 500 })
  }
}
