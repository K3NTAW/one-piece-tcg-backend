# One Piece TCG Digital App - Technical Specification

## 🏗️ Architecture Overview

### System Architecture
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Mobile App    │    │   Web Client    │    │  Desktop App    │
│   (React Native)│    │   (Next.js)     │    │   (Electron)    │
└─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘
          │                      │                      │
          └──────────────────────┼──────────────────────┘
                                 │
                    ┌─────────────┴─────────────┐
                    │      API Gateway          │
                    │      (Kong/AWS API GW)    │
                    └─────────────┬─────────────┘
                                  │
                    ┌─────────────┴─────────────┐
                    │      Backend Services     │
                    │      (Node.js/NestJS)     │
                    └─────────────┬─────────────┘
                                  │
                    ┌─────────────┴─────────────┐
                    │      Database Layer       │
                    │   (PostgreSQL + Redis)    │
                    └───────────────────────────┘
```

## 🛠️ Technology Stack

### Frontend Technologies
- **Framework**: React Native (mobile) + Next.js (web) + Electron (desktop)
- **State Management**: Redux Toolkit + RTK Query
- **UI Library**: React Native Elements + Custom One Piece themed components
- **Animation**: React Native Reanimated 3 + Framer Motion
- **Styling**: Styled Components + Theme system
- **Navigation**: React Navigation (mobile) + Next.js Router (web)

### Backend Technologies
- **Runtime**: Node.js 18+
- **Framework**: NestJS (TypeScript)
- **Database**: PostgreSQL (primary) + Redis (caching/sessions)
- **ORM**: Prisma
- **Authentication**: JWT + OAuth2 (Google, Apple, Discord)
- **Real-time**: Socket.io
- **File Storage**: AWS S3 + CloudFront CDN
- **Search**: Elasticsearch (card search)

### Infrastructure
- **Cloud Provider**: AWS
- **Containerization**: Docker + Kubernetes
- **CI/CD**: GitHub Actions
- **Monitoring**: DataDog + Sentry
- **CDN**: CloudFront
- **Load Balancing**: Application Load Balancer

## 📊 Database Schema

### Core Tables

#### Users
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255),
  avatar_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  last_login TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  is_verified BOOLEAN DEFAULT false
);
```

#### Cards
```sql
CREATE TABLE cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_number VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  set_code VARCHAR(10) NOT NULL,
  rarity VARCHAR(20) NOT NULL,
  card_type VARCHAR(50) NOT NULL,
  cost INTEGER,
  power INTEGER,
  counter_power INTEGER,
  attribute VARCHAR(50),
  color VARCHAR(20),
  effect_text TEXT,
  flavor_text TEXT,
  image_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### User Collections
```sql
CREATE TABLE user_collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  card_id UUID REFERENCES cards(id) ON DELETE CASCADE,
  quantity INTEGER DEFAULT 1,
  foil_quantity INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, card_id)
);
```

#### Decks
```sql
CREATE TABLE decks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  is_public BOOLEAN DEFAULT false,
  is_valid BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### Deck Cards
```sql
CREATE TABLE deck_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deck_id UUID REFERENCES decks(id) ON DELETE CASCADE,
  card_id UUID REFERENCES cards(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(deck_id, card_id)
);
```

## 🔌 API Endpoints

### Authentication Endpoints
```
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
POST /api/auth/refresh
POST /api/auth/forgot-password
POST /api/auth/reset-password
```

### User Management
```
GET    /api/users/profile
PUT    /api/users/profile
GET    /api/users/collection
POST   /api/users/collection
PUT    /api/users/collection/:cardId
DELETE /api/users/collection/:cardId
```

### Card Management
```
GET /api/cards
GET /api/cards/:id
GET /api/cards/search
GET /api/cards/sets
GET /api/cards/rarities
```

### Deck Management
```
GET    /api/decks
POST   /api/decks
GET    /api/decks/:id
PUT    /api/decks/:id
DELETE /api/decks/:id
POST   /api/decks/:id/validate
```

### Game Management
```
GET    /api/games
POST   /api/games
GET    /api/games/:id
POST   /api/games/:id/join
POST   /api/games/:id/leave
POST   /api/games/:id/action
```

### Matchmaking
```
POST /api/matchmaking/queue
DELETE /api/matchmaking/queue
GET /api/matchmaking/status
```

## 🔄 Real-time Communication

### WebSocket Events

#### Game Events
```typescript
// Client to Server
interface GameAction {
  type: 'play_card' | 'attack' | 'defend' | 'use_ability' | 'end_turn';
  gameId: string;
  data: any;
  timestamp: number;
}

// Server to Client
interface GameUpdate {
  type: 'game_state' | 'player_action' | 'game_end';
  gameId: string;
  data: any;
  timestamp: number;
}
```

#### Matchmaking Events
```typescript
interface MatchmakingEvent {
  type: 'queued' | 'match_found' | 'match_cancelled';
  data: {
    queueId?: string;
    gameId?: string;
    opponent?: User;
  };
}
```

## 🔐 Security Considerations

### Authentication & Authorization
- JWT tokens with 15-minute expiration
- Refresh tokens with 7-day expiration
- Role-based access control (RBAC)
- Rate limiting on all endpoints
- Input validation and sanitization

### Data Protection
- Encryption at rest (AES-256)
- Encryption in transit (TLS 1.3)
- PII data anonymization
- GDPR compliance
- Regular security audits

### Game Security
- Server-side game state validation
- Anti-cheat measures
- Replay system for dispute resolution
- Secure random number generation

## 📱 Mobile App Architecture

### React Native Structure
```
src/
├── components/          # Reusable UI components
├── screens/            # Screen components
├── navigation/         # Navigation configuration
├── store/             # Redux store and slices
├── services/          # API services
├── utils/             # Utility functions
├── hooks/             # Custom React hooks
├── types/             # TypeScript type definitions
└── assets/            # Images, fonts, etc.
```

### Key Features
- Offline mode for deck building
- Push notifications for matches
- Biometric authentication
- Deep linking for sharing
- Background sync

## 🌐 Web App Architecture

### Next.js Structure
```
src/
├── app/               # App Router pages
├── components/        # Reusable components
├── lib/              # Utility libraries
├── hooks/            # Custom hooks
├── store/            # State management
├── types/            # TypeScript types
└── styles/           # Global styles
```

### Key Features
- Server-side rendering (SSR)
- Static site generation (SSG)
- Progressive Web App (PWA)
- SEO optimization
- Responsive design

## 🚀 Performance Optimization

### Frontend Optimization
- Code splitting and lazy loading
- Image optimization and caching
- Memoization of expensive calculations
- Virtual scrolling for large lists
- Bundle size optimization

### Backend Optimization
- Database query optimization
- Redis caching strategy
- CDN for static assets
- Connection pooling
- Horizontal scaling

### Real-time Optimization
- WebSocket connection pooling
- Message batching
- Compression for large payloads
- Heartbeat mechanism
- Reconnection logic

## 📊 Monitoring & Analytics

### Application Monitoring
- Error tracking (Sentry)
- Performance monitoring (DataDog)
- Uptime monitoring
- Database performance metrics
- API response times

### Business Analytics
- User engagement metrics
- Game completion rates
- Revenue tracking
- A/B testing framework
- Custom event tracking

## 🔧 Development Tools

### Code Quality
- ESLint + Prettier
- TypeScript strict mode
- Husky pre-commit hooks
- Jest for unit testing
- Cypress for E2E testing

### Deployment
- Docker containers
- Kubernetes orchestration
- GitHub Actions CI/CD
- Environment management
- Blue-green deployments
