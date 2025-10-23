
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { Priority } from '@prisma/client'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { sanitizeFilename } from '@/lib/security'
import { sendHighPriorityAlert } from '@/lib/email'

export const dynamic = 'force-dynamic'

// Maximum total file size per report (90MB for 3 files x 30MB each)
const MAX_TOTAL_FILE_SIZE = 90 * 1024 * 1024

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    
    const priority = formData.get('priority') as Priority
    const bodyText = formData.get('bodyText') as string
    const notedRooms = JSON.parse(formData.get('notedRooms') as string)
    const stayoverRooms = JSON.parse(formData.get('stayoverRooms') as string)
    
    // Parse numeric fields - use null if empty string
    const arrivalsStr = (formData.get('arrivals') as string)?.trim()
    const departuresStr = (formData.get('departures') as string)?.trim()
    const occupancyStr = (formData.get('occupancyPercentage') as string)?.trim()
    
    const arrivals = arrivalsStr ? parseInt(arrivalsStr) : null
    const departures = departuresStr ? parseInt(departuresStr) : null
    const occupancyPercentage = occupancyStr ? parseFloat(occupancyStr) : null
    
    const files = formData.getAll('files') as File[]

    // Check daily post limit
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

    if (dailyTracker && dailyTracker.postCount >= 25) {
      return NextResponse.json(
        { error: 'Daily limit of 25 reports reached' },
        { status: 400 }
      )
    }

    // Validate total file size
    const totalFileSize = files.reduce((sum, file) => sum + file.size, 0)
    if (totalFileSize > MAX_TOTAL_FILE_SIZE) {
      return NextResponse.json(
        { error: `Total file size exceeds ${MAX_TOTAL_FILE_SIZE / (1024 * 1024)}MB limit` },
        { status: 400 }
      )
    }

    // Ensure uploads directory exists
    const uploadsDir = path.join(process.cwd(), 'uploads')
    try {
      await mkdir(uploadsDir, { recursive: true })
    } catch (error) {
      // Directory might already exist
    }

    // Handle file uploads with sanitization
    const attachments = []
    for (const file of files) {
      if (file.size > 0) {
        const sanitizedOriginalName = sanitizeFilename(file.name)
        const timestamp = Date.now()
        const randomStr = Math.random().toString(36).substring(7)
        const ext = path.extname(sanitizedOriginalName)
        const filename = `${timestamp}-${randomStr}${ext}`
        const filepath = path.join(uploadsDir, filename)
        
        const buffer = Buffer.from(await file.arrayBuffer())
        await writeFile(filepath, buffer)
        
        attachments.push({
          filename,
          originalName: sanitizedOriginalName,
          mimeType: file.type,
          size: file.size,
          uploadPath: filepath
        })
      }
    }

    // Create the shift report
    const shiftReport = await prisma.shiftReport.create({
      data: {
        authorId: session.user.id,
        authorName: session.user.name || 'Unknown User',
        priority,
        bodyText: bodyText || null,
        notedRooms,
        stayoverRooms,
        arrivals,
        departures,
        occupancyPercentage,
        attachments: {
          create: attachments
        }
      }
    })

    // Update daily post tracker
    await prisma.dailyPostTracker.upsert({
      where: {
        userId_date: {
          userId: session.user.id,
          date: today
        }
      },
      update: {
        postCount: {
          increment: 1
        }
      },
      create: {
        userId: session.user.id,
        date: today,
        postCount: 1
      }
    })

    // Send email alert for high priority reports
    if (priority === Priority.HIGH) {
      try {
        await sendHighPriorityAlert({
          id: shiftReport.id,
          authorName: session.user.name || 'Unknown User',
          bodyText: bodyText || null,
          createdAt: shiftReport.createdAt,
        })
      } catch (emailError) {
        console.error('Failed to send email alert:', emailError)
        // Don't fail the request if email fails
      }
    }

    return NextResponse.json({ 
      message: 'Report created successfully',
      reportId: shiftReport.id 
    })
  } catch (error) {
    console.error('Error creating report:', error)
    return NextResponse.json(
      { error: 'Failed to create report' },
      { status: 500 }
    )
  }
}
