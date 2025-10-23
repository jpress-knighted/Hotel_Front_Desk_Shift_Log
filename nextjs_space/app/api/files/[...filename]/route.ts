
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { readFile } from 'fs/promises'
import path from 'path'
import mime from 'mime-types'
import { validateFilePath } from '@/lib/security'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { filename: string[] } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const filename = params.filename.join('/')
    
    // Prevent path traversal by validating the resolved path
    const uploadsDir = path.join(process.cwd(), 'uploads')
    const filepath = path.join(uploadsDir, filename)
    
    // Security check: ensure the file is within the uploads directory
    if (!validateFilePath(filepath, uploadsDir)) {
      console.warn(`⚠️  Path traversal attempt detected: ${filename}`)
      return NextResponse.json({ error: 'Invalid file path' }, { status: 403 })
    }

    try {
      const fileBuffer = await readFile(filepath)
      const mimeType = mime.lookup(filepath) || 'application/octet-stream'
      
      // Sanitize the filename for Content-Disposition header
      const safeBasename = path.basename(filename).replace(/[^\w\s.-]/g, '_')

      return new NextResponse(fileBuffer, {
        headers: {
          'Content-Type': mimeType,
          'Content-Disposition': `attachment; filename="${safeBasename}"`,
          'X-Content-Type-Options': 'nosniff',
        },
      })
    } catch (fileError) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }
  } catch (error) {
    console.error('Error serving file:', error)
    return NextResponse.json(
      { error: 'Failed to serve file' },
      { status: 500 }
    )
  }
}
