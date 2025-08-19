#!/bin/bash

echo "�� Setting up AI School Assistant..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 20+ first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
    echo "❌ Node.js version 20+ is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js version: $(node -v)"

# Check if pnpm is installed
if ! command -v pnpm &> /dev/null; then
    echo "📦 Installing pnpm..."
    npm install -g pnpm
fi

echo "✅ pnpm version: $(pnpm --version)"

# Install dependencies
echo "📦 Installing dependencies..."
pnpm install

# Setup environment
if [ ! -f "server/.env" ]; then
    echo "⚙️  Setting up environment file..."
    cp server/.env.example server/.env
    echo "📝 Please edit server/.env and add your OpenAI API key and JWT secret"
    echo "   Required: OPENAI_API_KEY, JWT_SECRET"
    echo "   Optional: SCHOOL_NAME, APP_PORT, etc."
fi

# Setup database
echo "🗄️  Setting up database..."
cd server
pnpm prisma generate
pnpm prisma migrate dev --name init

# Seed super admin
echo "👤 Creating super admin..."
pnpm run seed

cd ..

echo ""
echo "🎉 Setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit server/.env and add your OpenAI API key"
echo "2. Start the application: pnpm dev"
echo "3. Access at: http://localhost:5173"
echo "4. Login with: admin / admin123"
echo ""
echo "For LAN access:"
echo "- Backend: http://YOUR_IP:3000"
echo "- Frontend: http://YOUR_IP:5173"
echo ""
echo "⚠️  Remember to change the default admin password!"
