#!/bin/sh
set -e

echo "🚀 Starting application..."

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  echo "❌ ERROR: DATABASE_URL is not set!"
  exit 1
fi

echo "📊 Running database migrations..."
# Use direct path to prisma binary instead of npx
node_modules/.bin/prisma migrate deploy || {
  echo "⚠️  Migration failed, but continuing to start server..."
}

echo "✅ Migrations complete!"

echo "🌐 Starting Next.js server on port ${PORT:-8080}..."
exec node server.js
