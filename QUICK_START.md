# 🚀 One Piece TCG - Quick Start Guide

## ✅ What's Already Set Up

- ✅ **Backend**: NestJS API with authentication, database, and file upload
- ✅ **Frontend**: Next.js web app with One Piece theming
- ✅ **Database**: PostgreSQL schema with Prisma ORM
- ✅ **Dependencies**: All packages installed and ready
- ✅ **File Storage**: Cloudinary integration (free alternative to AWS)

## 🎯 Minimum Setup to Get Running

### 1. Database Setup
Choose one option:

#### Option A: Local PostgreSQL
```bash
# Install PostgreSQL (macOS)
brew install postgresql
brew services start postgresql

# Create database
createdb onepiece_tcg
```

#### Option B: Docker (Easiest)
```bash
# Run PostgreSQL in Docker
docker run --name postgres-onepiece -e POSTGRES_PASSWORD=password -e POSTGRES_DB=onepiece_tcg -p 5432:5432 -d postgres:15
```

#### Option C: Cloud Database (Free)
- **Supabase**: https://supabase.com (Free tier: 500MB)
- **Neon**: https://neon.tech (Free tier: 3GB)
- **Railway**: https://railway.app (Free tier: 1GB)

### 2. Environment Configuration
```bash
# Copy environment file
cp env.example .env

# Edit .env with your database URL
nano .env
```

**Minimum required .env settings:**
```env
# Database (REQUIRED)
DATABASE_URL="postgresql://username:password@localhost:5432/onepiece_tcg"

# JWT Secrets (REQUIRED - generate random strings)
JWT_SECRET="your-super-secret-jwt-key-here-make-it-long-and-random"
JWT_REFRESH_SECRET="your-super-secret-refresh-key-here-different-from-above"

# App URLs (REQUIRED)
FRONTEND_URL="http://localhost:3000"
API_URL="http://localhost:3001"
NODE_ENV="development"
```

### 3. Database Migration
```bash
cd apps/backend
npx prisma generate
npx prisma db push
```

### 4. Start Development Servers
```bash
# Terminal 1 - Backend API
cd apps/backend
npm run start:dev

# Terminal 2 - Frontend Web App
cd apps/frontend
npm run dev
```

## 🌐 Access Your App

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **API Documentation**: http://localhost:3001/api/docs
- **Health Check**: http://localhost:3001/health

## 🎮 What You Can Do Now

### ✅ Working Features
- **User Registration/Login** - Create accounts and authenticate
- **Card Database** - Browse One Piece TCG cards
- **Deck Building** - Create and manage decks
- **Collection Management** - Track your cards
- **API Documentation** - Full Swagger docs at `/api/docs`

### 🔧 Optional Additions

#### File Storage (Cloudinary - Free)
```env
# Add to .env for image uploads
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"
```

#### One Piece TCG APIs (Free)
```env
# Add to .env for real card data
OPTCG_API_URL="https://optcg-api.ryanmichaelhirst.us"
ONEPIECE_TCG_API_URL="https://onepiece-tcg-api.herokuapp.com"
```

#### OAuth Login (Optional)
```env
# Add to .env for social login
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

## 🐛 Troubleshooting

### Database Connection Issues
```bash
# Check if PostgreSQL is running
brew services list | grep postgresql

# Start PostgreSQL
brew services start postgresql

# Test connection
psql -h localhost -U your_username -d onepiece_tcg
```

### Port Already in Use
```bash
# Check what's using port 3001
lsof -i :3001

# Kill the process
kill -9 <PID>
```

### Prisma Issues
```bash
# Reset database
npx prisma migrate reset

# Generate client
npx prisma generate

# Push schema
npx prisma db push
```

## 🎯 Next Steps

1. **Test the API** - Visit http://localhost:3001/api/docs
2. **Create a user** - Register at http://localhost:3000
3. **Explore cards** - Browse the card database
4. **Build a deck** - Create your first deck
5. **Add real card data** - Integrate with One Piece TCG APIs

## 📚 Development Commands

```bash
# Backend
cd apps/backend
npm run start:dev    # Start development server
npm run build        # Build for production
npm run test         # Run tests
npm run db:generate  # Generate Prisma client
npm run db:push      # Push schema to database

# Frontend
cd apps/frontend
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
```

## 🆘 Need Help?

- **Documentation**: Check the `/docs` folder
- **API Docs**: http://localhost:3001/api/docs
- **Database**: Use Prisma Studio (`npx prisma studio`)
- **Issues**: Check the terminal output for errors

---

**You're all set! 🏴‍☠️ Start building your One Piece TCG app!**
