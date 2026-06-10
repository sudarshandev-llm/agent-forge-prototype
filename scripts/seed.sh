#!/bin/bash
set -euo pipefail

echo "🌱 Seeding AgentForge database..."

# Check if .env exists
if [ ! -f apps/api/.env ]; then
  echo "❌ apps/api/.env not found. Run scripts/setup.sh first."
  exit 1
fi

# Run seed script
echo "📦 Running Prisma seed..."
npx tsx apps/api/prisma/seed.ts

echo ""
echo "✅ Database seeded successfully!"
echo ""
echo "Default admin account:"
echo "  Email: admin@agentforge.ai"
echo ""
echo "You can now start the development server:"
echo "  npm run dev"
