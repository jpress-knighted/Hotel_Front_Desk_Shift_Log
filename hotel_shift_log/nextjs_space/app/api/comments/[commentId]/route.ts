
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { UserRole, CommentType } from '@prisma/client'

// PATCH endpoint for hiding/unhiding comments (managers can hide public comments)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { commentId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user can hide comments
    if (session.user.role !== UserRole.MANAGER && session.user.role !== UserRole.SUPER_ADMIN) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { isHidden } = await request.json()

    if (typeof isHidden !== 'boolean') {
      return NextResponse.json({ error: 'isHidden must be a boolean' }, { status: 400 })
    }

    // Find the comment
    const existingComment = await prisma.comment.findUnique({
      where: { id: params.commentId }
    })

    if (!existingComment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 })
    }

    // Only public comments can be hidden
    if (existingComment.commentType !== CommentType.PUBLIC) {
      return NextResponse.json({ error: 'Only public comments can be hidden' }, { status: 400 })
    }

    // Managers can only hide their own comments
    if (session.user.role === UserRole.MANAGER && existingComment.authorId !== session.user.id) {
      return NextResponse.json({ error: 'You can only hide your own comments' }, { status: 403 })
    }

    const updatedComment = await prisma.comment.update({
      where: { id: params.commentId },
      data: {
        isHidden
      },
      include: {
        author: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    return NextResponse.json(updatedComment)
  } catch (error) {
    console.error('Error hiding comment:', error)
    return NextResponse.json(
      { error: 'Failed to hide comment' },
      { status: 500 }
    )
  }
}

// DELETE endpoint for deleting comments (only super admin can delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { commentId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only super admin can delete comments
    if (session.user.role !== UserRole.SUPER_ADMIN) {
      return NextResponse.json({ error: 'Only super admins can delete comments' }, { status: 403 })
    }

    // Find the comment
    const existingComment = await prisma.comment.findUnique({
      where: { id: params.commentId }
    })

    if (!existingComment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 })
    }

    await prisma.comment.delete({
      where: { id: params.commentId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting comment:', error)
    return NextResponse.json(
      { error: 'Failed to delete comment' },
      { status: 500 }
    )
  }
}
