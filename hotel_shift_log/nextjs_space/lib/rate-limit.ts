
/**
 * Rate limiting utility for API endpoints
 * Protects against brute force attacks and API abuse
 */

import { NextRequest } from 'next/server'

interface RateLimitOptions {
  interval: number // Time window in milliseconds
  uniqueTokenPerInterval: number // Max requests per interval
}

const rateLimit = (options: RateLimitOptions) => {
  const tokenCache = new Map<string, number[]>()

  return {
    check: (req: NextRequest, limit: number, token: string): Promise<void> =>
      new Promise((resolve, reject) => {
        const now = Date.now()
        const tokenCount = tokenCache.get(token) || [0]
        const windowStart = now - options.interval

        // Filter out old entries
        const validTokens = tokenCount.filter(timestamp => timestamp > windowStart)

        if (validTokens.length >= limit) {
          reject(new Error('Rate limit exceeded'))
        } else {
          validTokens.push(now)
          tokenCache.set(token, validTokens)

          // Clean up old entries periodically
          if (tokenCache.size > options.uniqueTokenPerInterval) {
            const oldestKey = Array.from(tokenCache.keys())[0]
            tokenCache.delete(oldestKey)
          }

          resolve()
        }
      }),
  }
}

// Login rate limiter: 5 attempts per 15 minutes per IP
export const loginRateLimiter = rateLimit({
  interval: 15 * 60 * 1000, // 15 minutes
  uniqueTokenPerInterval: 500, // Max 500 unique IPs tracked
})

// API rate limiter: 100 requests per minute per user
export const apiRateLimiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 500, // Max 500 unique users tracked
})
