# One Piece TCG Digital App - API Documentation

## 🌐 Available APIs and Data Sources

### Primary APIs

#### 1. API TCG - One Piece Cards
**Base URL**: `https://apitcg.com/api/one-piece`

**Description**: Comprehensive database of One Piece TCG cards with detailed information including images, rarity, effects, and pricing.

**Key Endpoints**:
```
GET /cards
GET /cards/{id}
GET /cards/search
GET /sets
GET /sets/{id}
```

**Rate Limits**: 
- Free tier: 100 requests/hour
- Paid tier: 1000 requests/hour

**Authentication**: API key required
**Documentation**: https://docs.apitcg.com/api-reference/cards

**Sample Response**:
```json
{
  "data": [
    {
      "id": "OP01-001",
      "name": "Monkey D. Luffy",
      "set": "Romance Dawn",
      "rarity": "Leader",
      "type": "Character",
      "cost": 0,
      "power": 5000,
      "attribute": "Straw Hat Pirates",
      "color": "Red",
      "effect": "This character can attack the opponent's Leader even if there are other characters in play.",
      "image": "https://images.apitcg.com/op01-001.jpg",
      "price": {
        "low": 2.50,
        "mid": 3.00,
        "high": 4.00
      }
    }
  ],
  "pagination": {
    "page": 1,
    "per_page": 20,
    "total": 1000
  }
}
```

#### 2. OPTCG API
**Base URL**: `https://optcg-api.ryanmichaelhirst.us`

**Description**: RESTful API providing access to all One Piece trading cards with daily price updates.

**Key Endpoints**:
```
GET /cards
GET /cards/{id}
GET /sets
GET /search
GET /prices
```

**Rate Limits**: 
- No rate limits specified
- Free to use

**Authentication**: None required
**Documentation**: https://optcg-api.ryanmichaelhirst.us

**Sample Response**:
```json
{
  "cards": [
    {
      "id": "OP01-001",
      "name": "Monkey D. Luffy",
      "set": "Romance Dawn",
      "number": "001",
      "rarity": "Leader",
      "type": "Character",
      "cost": 0,
      "power": 5000,
      "counter": 1000,
      "attribute": "Straw Hat Pirates",
      "color": "Red",
      "effect": "This character can attack the opponent's Leader even if there are other characters in play.",
      "image": "https://optcg-api.ryanmichaelhirst.us/images/op01-001.jpg",
      "prices": {
        "tcgplayer": 3.50,
        "ebay": 3.25,
        "trollandtoad": 3.75
      }
    }
  ]
}
```

#### 3. One Piece TCG API (LinkerG)
**Base URL**: `https://onepiece-tcg-api.herokuapp.com`

**Description**: RESTful API built with NestJS, providing data up to OP-07 with JWT authentication.

**Key Endpoints**:
```
GET /cards
GET /cards/{id}
GET /sets
GET /search
POST /auth/login
POST /auth/register
```

**Rate Limits**: 
- Not specified
- JWT authentication required

**Authentication**: JWT Bearer token
**Documentation**: https://github.com/LinkerG/onepiece-tcg-api

**Sample Response**:
```json
{
  "cards": [
    {
      "id": "OP01-001",
      "name": "Monkey D. Luffy",
      "set": "Romance Dawn",
      "rarity": "Leader",
      "type": "Character",
      "cost": 0,
      "power": 5000,
      "counter": 1000,
      "attribute": "Straw Hat Pirates",
      "color": "Red",
      "effect": "This character can attack the opponent's Leader even if there are other characters in play.",
      "image": "https://onepiece-tcg-api.herokuapp.com/images/op01-001.jpg",
      "createdAt": "2023-01-01T00:00:00.000Z",
      "updatedAt": "2023-01-01T00:00:00.000Z"
    }
  ]
}
```

### Secondary APIs

#### 4. One Piece API (General)
**Base URL**: `https://www.onepieceapi.com`

**Description**: General One Piece character and world information (not TCG specific).

**Use Case**: Character backgrounds, story information, world building
**Status**: In development
**Documentation**: https://www.onepieceapi.com

#### 5. Jikan API (MyAnimeList)
**Base URL**: `https://api.jikan.moe/v4`

**Description**: Unofficial MyAnimeList API for One Piece anime/manga data.

**Use Case**: Character images, anime references, fan art
**Rate Limits**: 3 requests/second
**Authentication**: None required

## 🗄️ Data Management Strategy

### Primary Data Source
**API TCG** will be the primary source for card data due to:
- Comprehensive card database
- High-quality images
- Regular updates
- Pricing information
- Professional API documentation

### Fallback Strategy
1. **OPTCG API** as secondary source
2. **One Piece TCG API (LinkerG)** as tertiary source
3. **Manual data entry** for missing cards

### Data Synchronization
```typescript
interface CardSyncStrategy {
  primary: 'apitcg';
  fallback: ['optcg', 'linkerg'];
  syncInterval: 'daily';
  validationRules: {
    requiredFields: ['id', 'name', 'set', 'rarity', 'type'];
    imageQuality: 'high';
    priceAccuracy: 'within_24h';
  };
}
```

## 🔄 API Integration Architecture

### Data Layer
```typescript
interface CardDataService {
  // Primary API calls
  fetchCards(filters: CardFilters): Promise<Card[]>;
  fetchCardById(id: string): Promise<Card>;
  searchCards(query: string): Promise<Card[]>;
  
  // Fallback handling
  fetchWithFallback(id: string): Promise<Card>;
  validateCardData(card: Card): boolean;
  
  // Caching
  cacheCard(card: Card): void;
  getCachedCard(id: string): Card | null;
}
```

### Error Handling
```typescript
interface APIErrorHandler {
  handleRateLimit(): Promise<void>;
  handleTimeout(): Promise<void>;
  handleNetworkError(): Promise<void>;
  fallbackToSecondary(): Promise<Card[]>;
  logError(error: Error, context: string): void;
}
```

## 📊 Data Models

### Card Model
```typescript
interface Card {
  id: string;
  name: string;
  set: string;
  setCode: string;
  number: string;
  rarity: Rarity;
  type: CardType;
  cost?: number;
  power?: number;
  counter?: number;
  attribute?: string;
  color: Color;
  effect?: string;
  flavorText?: string;
  image: {
    small: string;
    medium: string;
    large: string;
  };
  prices: {
    low: number;
    mid: number;
    high: number;
    market: number;
  };
  legality: {
    standard: boolean;
    expanded: boolean;
    unlimited: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

enum Rarity {
  COMMON = 'Common',
  UNCOMMON = 'Uncommon',
  RARE = 'Rare',
  SUPER_RARE = 'Super Rare',
  SECRET_RARE = 'Secret Rare',
  LEADER = 'Leader',
  PROMO = 'Promo'
}

enum CardType {
  CHARACTER = 'Character',
  EVENT = 'Event',
  STAGE = 'Stage',
  DON = 'Don'
}

enum Color {
  RED = 'Red',
  GREEN = 'Green',
  BLUE = 'Blue',
  PURPLE = 'Purple',
  BLACK = 'Black',
  YELLOW = 'Yellow'
}
```

### Set Model
```typescript
interface Set {
  id: string;
  name: string;
  code: string;
  releaseDate: Date;
  totalCards: number;
  image: string;
  description: string;
  isActive: boolean;
  cards: Card[];
}
```

## 🔧 Implementation Plan

### Phase 1: API Integration Setup
1. Set up API client libraries
2. Implement authentication for paid APIs
3. Create data models and interfaces
4. Set up error handling and logging

### Phase 2: Data Synchronization
1. Implement primary API integration
2. Add fallback API support
3. Create data validation system
4. Set up caching layer

### Phase 3: Data Processing
1. Implement data transformation
2. Add image processing and optimization
3. Create search and filtering
4. Set up real-time updates

### Phase 4: Testing & Optimization
1. Load testing for API calls
2. Performance optimization
3. Error handling testing
4. Data accuracy validation

## 📈 Monitoring & Analytics

### API Usage Metrics
- Request count per API
- Response times
- Error rates
- Rate limit hits
- Cache hit rates

### Data Quality Metrics
- Card completeness
- Image availability
- Price accuracy
- Update frequency

### Cost Tracking
- API usage costs
- Storage costs
- CDN costs
- Processing costs

## 🚨 Rate Limiting Strategy

### Implementation
```typescript
interface RateLimiter {
  apitcg: {
    requestsPerHour: 100;
    burstLimit: 10;
    retryAfter: 3600;
  };
  optcg: {
    requestsPerMinute: 60;
    burstLimit: 5;
    retryAfter: 60;
  };
  linkerg: {
    requestsPerMinute: 30;
    burstLimit: 3;
    retryAfter: 60;
  };
}
```

### Caching Strategy
- **Redis**: API responses cached for 1 hour
- **CDN**: Images cached for 30 days
- **Database**: Card data cached indefinitely
- **Memory**: Frequently accessed data cached for 5 minutes

## 🔐 Security Considerations

### API Key Management
- Environment variables for API keys
- Key rotation every 90 days
- Separate keys for different environments
- Monitoring for key usage

### Data Privacy
- No PII in API requests
- Encrypted data transmission
- Secure storage of API keys
- Regular security audits

### Error Handling
- No sensitive data in error logs
- Rate limit information sanitized
- Graceful degradation on API failures
- User-friendly error messages
