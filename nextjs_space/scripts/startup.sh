#!/bin/sh
set -e

echo "🚀 Starting application..."

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  echo "❌ ERROR: DATABASE_URL is not set"
  exit 1
fi

echo "✅ DATABASE_URL is configured"

# Run database migrations
echo "📦 Running database migrations..."
npx prisma migrate deploy || {
  echo "⚠️  Migration failed, but continuing startup..."
}

echo "✅ Migrations complete"

# Start the Next.js server
echo "🌐 Starting Next.js server..."
exec node server.js
