
-- AlterTable: Add authorName fields and make authorId nullable
-- Step 1: Add authorName column (nullable at first)
ALTER TABLE "shift_reports" ADD COLUMN IF NOT EXISTS "authorName" TEXT;
ALTER TABLE "comments" ADD COLUMN IF NOT EXISTS "authorName" TEXT;

-- Step 2: Populate authorName from existing user data
UPDATE "shift_reports" sr
SET "authorName" = u.name
FROM "users" u
WHERE sr."authorId" = u.id AND sr."authorName" IS NULL;

UPDATE "comments" c
SET "authorName" = u.name
FROM "users" u
WHERE c."authorId" = u.id AND c."authorName" IS NULL;

-- Step 3: Set default for any remaining null values (in case user was already deleted)
UPDATE "shift_reports" SET "authorName" = '[Deleted User]' WHERE "authorName" IS NULL;
UPDATE "comments" SET "authorName" = '[Deleted User]' WHERE "authorName" IS NULL;

-- Step 4: Make authorName NOT NULL
ALTER TABLE "shift_reports" ALTER COLUMN "authorName" SET NOT NULL;
ALTER TABLE "comments" ALTER COLUMN "authorName" SET NOT NULL;

-- Step 5: Make authorId nullable and update constraints
ALTER TABLE "shift_reports" ALTER COLUMN "authorId" DROP NOT NULL;
ALTER TABLE "comments" ALTER COLUMN "authorId" DROP NOT NULL;

-- Step 6: Drop and recreate foreign key constraints with ON DELETE SET NULL
ALTER TABLE "shift_reports" DROP CONSTRAINT IF EXISTS "shift_reports_authorId_fkey";
ALTER TABLE "shift_reports" ADD CONSTRAINT "shift_reports_authorId_fkey" 
  FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "comments" DROP CONSTRAINT IF EXISTS "comments_authorId_fkey";
ALTER TABLE "comments" ADD CONSTRAINT "comments_authorId_fkey" 
  FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
