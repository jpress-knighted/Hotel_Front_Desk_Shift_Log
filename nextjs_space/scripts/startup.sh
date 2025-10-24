
#!/bin/sh
set -e

echo "🚀 Starting application..."

echo "📊 Running database migrations..."
npx prisma migrate deploy

echo "✅ Migrations complete!"

echo "🌐 Starting Next.js server..."
exec node server.js
