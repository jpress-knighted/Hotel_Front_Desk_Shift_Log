
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { UserRole, CommentType } from '@prisma/client'
import { writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'
import { sanitizeFilename } from '@/lib/security'

const ALLOWED_FILE_EXTENSIONS = [
  // Images
  '.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg',
  // Documents
  '.pdf',
  '.doc', '.docx',
  '.xls', '.xlsx',
  '.ppt', '.pptx',
  // Text & Data
  '.txt', '.csv',
  // Archives
  '.zip'
]

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user can comment
    if (session.user.role !== UserRole.MANAGER && session.user.role !== UserRole.SUPER_ADMIN) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const formData = await request.formData()
    const shiftReportId = formData.get('shiftReportId') as string
    const content = formData.get('content') as string
    const commentType = formData.get('commentType') as CommentType
    const imageFile = formData.get('image') as File | null

    if (!shiftReportId) {
      return NextResponse.json({ error: 'Missing report ID' }, { status: 400 })
    }

    // Either content or file must be provided
    if (!content?.trim() && !imageFile) {
      return NextResponse.json({ error: 'Either text or file is required' }, { status: 400 })
    }

    // Validate content length (400 characters max)
    if (content && content.length > 400) {
      return NextResponse.json({ error: 'Comment must not exceed 400 characters' }, { status: 400 })
    }

    // Validate comment type
    if (commentType && !Object.values(CommentType).includes(commentType)) {
      return NextResponse.json({ error: 'Invalid comment type' }, { status: 400 })
    }

    // Check if report exists
    const report = await prisma.shiftReport.findUnique({
      where: { id: shiftReportId }
    })

    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 })
    }

    // Check if user has reached their max comment limit (30 per manager per report)
    const userCommentCount = await prisma.comment.count({
      where: { 
        shiftReportId,
        authorId: session.user.id
      }
    })

    if (userCommentCount >= 30) {
      return NextResponse.json({ error: 'You have reached the maximum number of comments (30) for this report' }, { status: 400 })
    }

    let imageUrl = null

    // Handle file upload if provided
    if (imageFile) {
      // Sanitize filename first
      const sanitizedOriginalName = sanitizeFilename(imageFile.name)
      
      // Validate file type by extension
      const fileName = sanitizedOriginalName.toLowerCase()
      const fileExtension = fileName.split('.').pop() || ''
      const fileExtensionWithDot = '.' + fileExtension
      
      if (!ALLOWED_FILE_EXTENSIONS.includes(fileExtensionWithDot)) {
        return NextResponse.json({ error: 'File type not allowed. Please upload images, PDFs, Office documents, text files, or ZIP files.' }, { status: 400 })
      }

      // Validate file size (30MB max)
      if (imageFile.size > 30 * 1024 * 1024) {
        return NextResponse.json({ error: 'File size must be less than 30MB' }, { status: 400 })
      }

      const uploadsDir = path.join(process.cwd(), 'uploads', 'comments')
      
      // Create uploads directory if it doesn't exist
      if (!existsSync(uploadsDir)) {
        await mkdir(uploadsDir, { recursive: true })
      }

      const buffer = await imageFile.arrayBuffer()
      const filename = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExtension}`
      const filepath = path.join(uploadsDir, filename)

      await writeFile(filepath, Buffer.from(buffer))
      imageUrl = `/api/files/comments/${filename}`
    }

    const comment = await prisma.comment.create({
      data: {
        shiftReportId,
        authorId: session.user.id,
        authorName: session.user.name || 'Unknown User',
        content: imageUrl ? '' : content.trim(), // Empty content if file is provided
        commentType: commentType || CommentType.PUBLIC,
        imageUrl,
        originalFileName: imageFile ? imageFile.name : null
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

    return NextResponse.json(comment)
  } catch (error) {
    console.error('Error creating comment:', error)
    return NextResponse.json(
      { error: 'Failed to create comment' },
      { status: 500 }
    )
  }
}
