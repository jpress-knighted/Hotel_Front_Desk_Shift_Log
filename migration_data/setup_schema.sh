
#!/bin/bash

# Setup database schema in Cloud SQL using Prisma
# This script should be run from the project root

set -e

echo "🔧 Setting up database schema in Cloud SQL..."
echo "════════════════════════════════════════════"

# Check if we're in the right directory
if [ ! -f "nextjs_space/prisma/schema.prisma" ]; then
    echo "❌ Error: Must run this script from the hotel_shift_log directory"
    exit 1
fi

# Temporary .env file for Cloud SQL
ENV_FILE="nextjs_space/.env.cloudsql"

if [ ! -f "$ENV_FILE" ]; then
    echo "❌ Error: $ENV_FILE not found"
    echo "   Please create it with the correct DATABASE_URL"
    exit 1
fi

echo "📖 Using database configuration from $ENV_FILE"
echo ""

cd nextjs_space

# Load Cloud SQL environment
export $(cat .env.cloudsql | grep -v '^#' | xargs)

echo "1️⃣  Generating Prisma Client..."
npx prisma generate

echo ""
echo "2️⃣  Pushing schema to Cloud SQL database..."
npx prisma db push --accept-data-loss

echo ""
echo "3️⃣  Verifying schema..."
npx prisma db pull --print

echo ""
echo "✅ Schema setup complete!"
echo ""
echo "Next steps:"
echo "  1. Run the import script to load your data"
echo "  2. Update Cloud Run environment variables"
echo "  3. Deploy your application"
