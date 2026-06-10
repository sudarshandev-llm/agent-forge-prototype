#!/bin/bash
set -euo pipefail

echo "🚀 Setting up AgentForge development environment..."

# Check prerequisites
command -v node >/dev/null 2>&1 || { echo "❌ Node.js is required but not installed."; exit 1; }
command -v npm >/dev/null 2>&1 || { echo "❌ npm is required but not installed."; exit 1; }

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
  echo "❌ Node.js >= 20 is required. Current version: $(node -v)"
  exit 1
fi

echo "✅ Node.js $(node -v) detected"

# Install dependencies
echo "📦 Installing dependencies..."
npm ci

# Setup environment files
if [ ! -f apps/api/.env ]; then
  cp apps/api/.env.example apps/api/.env
  echo "✅ Created apps/api/.env from example"
fi

if [ ! -f apps/web/.env ]; then
  cp apps/web/.env.example apps/web/.env
  echo "✅ Created apps/web/.env from example"
fi

if [ ! -f apps/worker/.env ]; then
  cp apps/worker/.env.example apps/worker/.env
  echo "✅ Created apps/worker/.env from example"
fi

# Generate Prisma client
echo "🗄️  Generating Prisma client..."
npx prisma generate --schema=apps/api/prisma/schema.prisma

# Run database migrations
echo "🗄️  Running database migrations..."
npx prisma migrate dev --schema=apps/api/prisma/schema.prisma --name init 2>/dev/null || echo "ℹ️  Migration skipped (may already exist)"

# Build shared package
echo "🔨 Building shared package..."
npm run build -w packages/shared

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "  1. Update apps/api/.env with your configuration"
echo "  2. Update apps/web/.env with your Clerk keys"
echo "  3. Start development: npm run dev"
echo "  4. Open http://localhost:3000"
