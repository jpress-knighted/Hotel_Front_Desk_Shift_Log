
/**
 * Script to clear all reports, comments, attachments, and related data
 * while preserving user accounts for production deployment.
 * 
 * Usage: yarn tsx scripts/clear-reports-data.ts
 */

import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function clearReportsData() {
  try {
    console.log('🗑️  Starting data cleanup...\n')

    // Delete in the correct order to respect foreign key constraints
    
    console.log('1. Deleting comment likes...')
    const commentLikes = await prisma.commentLike.deleteMany({})
    console.log(`   ✓ Deleted ${commentLikes.count} comment likes`)

    console.log('2. Deleting report acknowledgements...')
    const acknowledgements = await prisma.reportAcknowledgement.deleteMany({})
    console.log(`   ✓ Deleted ${acknowledgements.count} report acknowledgements`)

    console.log('3. Deleting comments...')
    const comments = await prisma.comment.deleteMany({})
    console.log(`   ✓ Deleted ${comments.count} comments`)

    console.log('4. Deleting attachments...')
    const attachments = await prisma.attachment.deleteMany({})
    console.log(`   ✓ Deleted ${attachments.count} attachments`)

    console.log('5. Deleting shift reports...')
    const reports = await prisma.shiftReport.deleteMany({})
    console.log(`   ✓ Deleted ${reports.count} shift reports`)

    console.log('6. Resetting daily post trackers...')
    const trackers = await prisma.dailyPostTracker.deleteMany({})
    console.log(`   ✓ Deleted ${trackers.count} daily post trackers`)

    // Get user count for verification
    const userCount = await prisma.user.count()
    console.log(`\n✅ Data cleanup complete!`)
    console.log(`📊 ${userCount} user accounts preserved`)
    console.log(`\nThe database is now ready for production with a clean slate.`)

  } catch (error) {
    console.error('❌ Error during data cleanup:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Execute the cleanup
clearReportsData()
  .catch((error) => {
    console.error('Failed to clear data:', error)
    process.exit(1)
  })
