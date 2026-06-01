#!/bin/bash

# One Piece TCG Development Setup Script
echo "🏴‍☠️ Setting up One Piece TCG Development Environment..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js version: $(node -v)"

# Install root dependencies
echo "📦 Installing root dependencies..."
npm install

# Install backend dependencies
echo "🔧 Installing backend dependencies..."
cd apps/backend
npm install

# Generate Prisma client
echo "🗄️ Generating Prisma client..."
npx prisma generate

# Install frontend dependencies
echo "🎨 Installing frontend dependencies..."
cd ../frontend
npm install

# Go back to root
cd ../..

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cp env.example .env
    echo "⚠️  Please update .env file with your configuration"
fi

echo ""
echo "🎉 Setup complete!"
echo ""
echo "Next steps:"
echo "1. Update .env file with your database and API keys"
echo "2. Set up PostgreSQL database"
echo "3. Run database migrations: cd apps/backend && npx prisma migrate dev"
echo "4. Start development servers:"
echo "   - Backend: cd apps/backend && npm run start:dev"
echo "   - Frontend: cd apps/frontend && npm run dev"
echo ""
echo "🚀 Happy coding!"
