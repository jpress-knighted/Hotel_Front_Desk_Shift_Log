
/**
 * Security utilities for input validation and sanitization
 */

import path from 'path'

/**
 * Sanitize filename to prevent path traversal attacks
 */
export function sanitizeFilename(filename: string): string {
  // Remove any path components
  const basename = path.basename(filename)
  
  // Remove any characters that could be dangerous
  const sanitized = basename.replace(/[^a-zA-Z0-9._-]/g, '_')
  
  // Ensure filename is not empty and has reasonable length
  if (sanitized.length === 0) {
    return 'file_' + Date.now()
  }
  
  if (sanitized.length > 255) {
    return sanitized.substring(0, 255)
  }
  
  return sanitized
}

/**
 * Validate file path to prevent directory traversal
 */
export function validateFilePath(filepath: string, allowedDirectory: string): boolean {
  const resolvedPath = path.resolve(filepath)
  const resolvedAllowedDir = path.resolve(allowedDirectory)
  
  return resolvedPath.startsWith(resolvedAllowedDir)
}

/**
 * Get client IP address from request
 */
export function getClientIp(request: any): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0] ||
    request.headers.get('x-real-ip') ||
    request.ip ||
    'unknown'
  )
}

/**
 * Validate environment variables on startup
 */
export function validateEnvironment() {
  const required = [
    'DATABASE_URL',
    'NEXTAUTH_SECRET',
  ]

  const missing = required.filter(key => !process.env[key])

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
      'Please check your .env file.'
    )
  }

  // Validate NEXTAUTH_SECRET strength
  const secret = process.env.NEXTAUTH_SECRET
  if (secret && secret.length < 32) {
    console.warn('⚠️  NEXTAUTH_SECRET should be at least 32 characters for production use.')
  }

  // Check if email is configured
  const emailConfigured = process.env.SMTP_HOST && 
                          process.env.SMTP_USER && 
                          process.env.SMTP_PASSWORD

  if (!emailConfigured) {
    console.warn('⚠️  Email is not configured. High-priority notifications will not be sent.')
    console.warn('   Set SMTP_HOST, SMTP_USER, SMTP_PASSWORD, and SMTP_PORT to enable emails.')
  }
}
