
/**
 * Generate SQL schema from Prisma schema
 * This creates a SQL file that can be manually executed in Cloud SQL
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔧 Generating SQL schema from Prisma...\n');

try {
  // Generate SQL schema using Prisma migrate
  console.log('📝 Creating SQL schema file...');
  
  const schemaPath = path.join(__dirname, '..', 'nextjs_space', 'prisma', 'schema.prisma');
  const outputPath = path.join(__dirname, 'schema.sql');
  
  // Try to generate SQL using prisma migrate diff
  try {
    const result = execSync(
      `cd ../nextjs_space && npx prisma migrate diff --from-empty --to-schema-datamodel ./prisma/schema.prisma --script`,
      { encoding: 'utf-8', cwd: __dirname }
    );
    
    fs.writeFileSync(outputPath, result);
    console.log('✅ SQL schema generated successfully!');
    console.log(`📄 File saved to: ${outputPath}`);
    console.log('\n📋 You can now run this SQL directly in Cloud SQL console or psql:\n');
    console.log(`   psql "postgresql://hotel-shift-log-db:ebf4vem5mzx8yuy*FJE@34.133.148.252:5432/hotelshiftlog" < schema.sql`);
    
  } catch (diffError) {
    console.log('⚠️  Prisma migrate diff not available, creating manual schema...\n');
    
    // Manual schema based on Prisma schema
    const manualSchema = `
-- Generated Schema for Hotel Shift Log
-- Database: hotelshiftlog
-- Generated: ${new Date().toISOString()}

-- Create ENUMs
CREATE TYPE "UserRole" AS ENUM ('SUPER_ADMIN', 'MANAGER', 'EMPLOYEE');
CREATE TYPE "Priority" AS ENUM ('NONE', 'LOW', 'MEDIUM', 'HIGH');
CREATE TYPE "CommentType" AS ENUM ('PUBLIC', 'MANAGER_NOTE');

-- Create tables
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'EMPLOYEE',
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "receivesHighPriorityEmails" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "shift_reports" (
    "id" TEXT NOT NULL,
    "authorId" TEXT,
    "authorName" TEXT NOT NULL,
    "priority" "Priority" NOT NULL DEFAULT 'NONE',
    "bodyText" TEXT,
    "notedRooms" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
    "stayoverRooms" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
    "arrivals" INTEGER DEFAULT 0,
    "departures" INTEGER DEFAULT 0,
    "occupancyPercentage" DOUBLE PRECISION DEFAULT 0,
    "isHidden" BOOLEAN NOT NULL DEFAULT false,
    "isResolved" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shift_reports_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "attachments" (
    "id" TEXT NOT NULL,
    "shiftReportId" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "uploadPath" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "attachments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "comments" (
    "id" TEXT NOT NULL,
    "shiftReportId" TEXT NOT NULL,
    "authorId" TEXT,
    "authorName" TEXT NOT NULL,
    "content" VARCHAR(200) NOT NULL,
    "commentType" "CommentType" NOT NULL DEFAULT 'PUBLIC',
    "isHidden" BOOLEAN NOT NULL DEFAULT false,
    "imageUrl" TEXT,
    "originalFileName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "comments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "comment_likes" (
    "id" TEXT NOT NULL,
    "commentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "comment_likes_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "daily_post_trackers" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "postCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "daily_post_trackers_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "report_acknowledgements" (
    "id" TEXT NOT NULL,
    "shiftReportId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "acknowledgedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "report_acknowledgements_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "accounts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "verification_tokens" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- Create Unique Indexes
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE UNIQUE INDEX "comment_likes_commentId_userId_key" ON "comment_likes"("commentId", "userId");
CREATE UNIQUE INDEX "daily_post_trackers_userId_date_key" ON "daily_post_trackers"("userId", "date");
CREATE UNIQUE INDEX "report_acknowledgements_shiftReportId_userId_key" ON "report_acknowledgements"("shiftReportId", "userId");
CREATE UNIQUE INDEX "accounts_provider_providerAccountId_key" ON "accounts"("provider", "providerAccountId");
CREATE UNIQUE INDEX "sessions_sessionToken_key" ON "sessions"("sessionToken");
CREATE UNIQUE INDEX "verification_tokens_token_key" ON "verification_tokens"("token");
CREATE UNIQUE INDEX "verification_tokens_identifier_token_key" ON "verification_tokens"("identifier", "token");

-- Add Foreign Keys
ALTER TABLE "shift_reports" ADD CONSTRAINT "shift_reports_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_shiftReportId_fkey" FOREIGN KEY ("shiftReportId") REFERENCES "shift_reports"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "comments" ADD CONSTRAINT "comments_shiftReportId_fkey" FOREIGN KEY ("shiftReportId") REFERENCES "shift_reports"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "comments" ADD CONSTRAINT "comments_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "comment_likes" ADD CONSTRAINT "comment_likes_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "daily_post_trackers" ADD CONSTRAINT "daily_post_trackers_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "report_acknowledgements" ADD CONSTRAINT "report_acknowledgements_shiftReportId_fkey" FOREIGN KEY ("shiftReportId") REFERENCES "shift_reports"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "report_acknowledgements" ADD CONSTRAINT "report_acknowledgements_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Grant permissions
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO "hotel-shift-log-db";
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO "hotel-shift-log-db";

-- Done
SELECT 'Schema created successfully!' as status;
`;
    
    fs.writeFileSync(outputPath, manualSchema);
    console.log('✅ Manual SQL schema created successfully!');
    console.log(`📄 File saved to: ${outputPath}\n`);
    console.log('📋 To apply this schema to Cloud SQL:\n');
    console.log('Option 1: Using psql command line:');
    console.log(`   psql "postgresql://hotel-shift-log-db:ebf4vem5mzx8yuy*FJE@34.133.148.252:5432/hotelshiftlog" < ${outputPath}\n`);
    console.log('Option 2: Using Cloud SQL console:');
    console.log('   1. Go to Cloud SQL console');
    console.log('   2. Open the hotel-shift-log-db instance');
    console.log('   3. Click "Import"');
    console.log(`   4. Upload ${outputPath}`);
    console.log('   5. Select database: hotelshiftlog');
    console.log('   6. Click "Import"\n');
  }
  
} catch (error) {
  console.error('❌ Error generating schema:', error.message);
  process.exit(1);
}
