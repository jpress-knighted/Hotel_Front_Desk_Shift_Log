#!/bin/sh
set -e

echo "🚀 Starting application..."

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  echo "❌ ERROR: DATABASE_URL is not set!"
  exit 1
fi

echo "📊 DATABASE_URL is set (first 30 chars): ${DATABASE_URL:0:30}..."

echo "📊 Checking Prisma setup..."
ls -la prisma/ || echo "⚠️  No prisma directory found"
ls -la node_modules/.prisma/ || echo "⚠️  No .prisma directory found"

echo "📊 Running database migrations..."
# Use direct path to prisma binary instead of npx
node_modules/.bin/prisma migrate deploy 2>&1 || {
  echo "⚠️  Migration failed with exit code $?, but continuing to start server..."
  echo "⚠️  This might cause 500 errors if database is not initialized!"
}

echo "✅ Migration step complete!"

echo "🔍 Verifying database connection..."
node_modules/.bin/prisma db pull --force 2>&1 || {
  echo "⚠️  Database connection check failed - this will likely cause 500 errors!"
}

echo "🌐 Starting Next.js server on port ${PORT:-8080}..."
exec node server.js
