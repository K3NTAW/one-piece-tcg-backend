# One Piece TCG - Development Guide

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- PostgreSQL 13+
- Redis 6+
- Git

### Setup
1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd one-piece-tcg
   ```

2. **Run the setup script**
   ```bash
   ./setup.sh
   ```

3. **Configure environment variables**
   ```bash
   cp env.example .env
   # Edit .env with your configuration
   ```

4. **Set up the database**
   ```bash
   cd apps/backend
   npx prisma migrate dev
   npx prisma db seed
   ```

5. **Start development servers**
   ```bash
   # Terminal 1 - Backend
   cd apps/backend
   npm run start:dev

   # Terminal 2 - Frontend
   cd apps/frontend
   npm run dev
   ```

## 📁 Project Structure

```
one-piece-tcg/
├── apps/
│   ├── backend/          # NestJS API server
│   ├── frontend/         # Next.js web app
│   └── mobile/           # React Native app
├── packages/
│   ├── shared/           # Shared utilities
│   └── ui/               # Shared UI components
├── docs/                 # Documentation
└── scripts/              # Development scripts
```

## 🛠️ Development Commands

### Root Level
```bash
npm run dev          # Start all development servers
npm run build        # Build all applications
npm run test         # Run all tests
npm run lint         # Lint all code
npm run type-check   # Type check all TypeScript
```

### Backend (apps/backend)
```bash
npm run start:dev    # Start development server
npm run build        # Build for production
npm run test         # Run tests
npm run db:generate  # Generate Prisma client
npm run db:push      # Push schema to database
npm run db:migrate   # Run database migrations
npm run db:seed      # Seed database with sample data
```

### Frontend (apps/frontend)
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Lint code
```

## 🗄️ Database

### Prisma Commands
```bash
# Generate Prisma client
npx prisma generate

# Create a new migration
npx prisma migrate dev --name migration_name

# Reset database
npx prisma migrate reset

# Open Prisma Studio
npx prisma studio
```

### Database Schema
The database schema is defined in `apps/backend/prisma/schema.prisma`. Key models include:
- `User` - User accounts and profiles
- `Card` - One Piece TCG cards
- `Deck` - User-created decks
- `Game` - Game sessions and matches
- `Collection` - User card collections

## 🔧 API Development

### Available Endpoints
- `GET /health` - Health check
- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `GET /cards` - Get all cards
- `GET /cards/search` - Search cards
- `GET /users/profile` - Get user profile
- `GET /decks` - Get user decks

### API Documentation
Once the backend is running, visit:
- Swagger UI: http://localhost:3001/api/docs
- Health Check: http://localhost:3001/health

## 🎨 Frontend Development

### Tech Stack
- **Framework**: Next.js 14 with App Router
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Data Fetching**: TanStack Query
- **Forms**: React Hook Form + Zod
- **UI Components**: Custom components with Radix UI

### Key Features
- Responsive design for all screen sizes
- Dark/light theme support
- One Piece themed design system
- Card animations and effects
- Real-time multiplayer support

## 📱 Mobile Development

### React Native Setup
```bash
cd apps/mobile
npm install
npx react-native run-ios     # iOS simulator
npx react-native run-android # Android emulator
```

### Mobile Features
- Cross-platform iOS/Android support
- Offline deck building
- Push notifications
- Touch-optimized UI
- Biometric authentication

## 🔌 API Integration

### One Piece TCG APIs
The app integrates with multiple APIs for card data:

1. **API TCG** (Primary)
   - Base URL: `https://apitcg.com/api/one-piece`
   - Rate Limit: 100 requests/hour (free)
   - Features: Complete card database with images

2. **OPTCG API** (Secondary)
   - Base URL: `https://optcg-api.ryanmichaelhirst.us`
   - Rate Limit: None
   - Features: Daily price updates

3. **One Piece TCG API** (Tertiary)
   - Base URL: `https://onepiece-tcg-api.herokuapp.com`
   - Rate Limit: Not specified
   - Features: JWT authentication

### API Configuration
Update your `.env` file with API keys:
```env
APITCG_API_KEY=your-api-key
OPTCG_API_URL=https://optcg-api.ryanmichaelhirst.us
ONEPIECE_TCG_API_URL=https://onepiece-tcg-api.herokuapp.com
```

## 🧪 Testing

### Backend Testing
```bash
cd apps/backend
npm run test              # Unit tests
npm run test:e2e          # End-to-end tests
npm run test:cov          # Coverage report
```

### Frontend Testing
```bash
cd apps/frontend
npm run test              # Jest tests
npm run test:watch        # Watch mode
```

## 🚀 Deployment

### Backend Deployment
1. Build the application
2. Set up PostgreSQL database
3. Run migrations
4. Deploy to your preferred platform (AWS, Vercel, etc.)

### Frontend Deployment
1. Build the application
2. Deploy to Vercel, Netlify, or similar
3. Configure environment variables

### Mobile Deployment
1. Build for iOS/Android
2. Submit to App Store/Google Play
3. Configure push notifications

## 🐛 Debugging

### Backend Debugging
- Use `console.log()` for basic debugging
- Use VS Code debugger with breakpoints
- Check logs in terminal output
- Use Prisma Studio for database inspection

### Frontend Debugging
- Use React DevTools browser extension
- Use Next.js built-in error overlay
- Check browser console for errors
- Use Network tab for API debugging

### Common Issues
1. **Database connection errors**: Check PostgreSQL is running and credentials are correct
2. **API errors**: Verify API keys and rate limits
3. **Build errors**: Check TypeScript errors and missing dependencies
4. **Port conflicts**: Ensure ports 3000 and 3001 are available

## 📚 Additional Resources

- [NestJS Documentation](https://docs.nestjs.com/)
- [Next.js Documentation](https://nextjs.org/docs)
- [React Native Documentation](https://reactnative.dev/docs/getting-started)
- [Prisma Documentation](https://www.prisma.io/docs/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [One Piece TCG Official Rules](https://www.bandai.co.jp/cardgame/onepiece/)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📞 Support

For questions or issues:
- Check the documentation
- Search existing issues
- Create a new issue with detailed information
- Join our Discord community (coming soon)

---

**Happy coding! 🏴‍☠️**
