# One Piece TCG Digital App - System Architecture

## 🏗️ High-Level Architecture

```mermaid
graph TB
    subgraph "Client Layer"
        MA[Mobile App<br/>React Native]
        WA[Web App<br/>Next.js]
        DA[Desktop App<br/>Electron]
    end
    
    subgraph "API Gateway"
        AG[API Gateway<br/>Kong/AWS API Gateway]
        LB[Load Balancer<br/>AWS ALB]
    end
    
    subgraph "Backend Services"
        AS[Auth Service<br/>NestJS]
        GS[Game Service<br/>NestJS]
        CS[Collection Service<br/>NestJS]
        MS[Matchmaking Service<br/>NestJS]
        NS[Notification Service<br/>NestJS]
    end
    
    subgraph "Real-time Layer"
        WS[WebSocket Server<br/>Socket.io]
        RM[Redis Pub/Sub<br/>Real-time Events]
    end
    
    subgraph "Data Layer"
        PG[(PostgreSQL<br/>Primary Database)]
        RD[(Redis<br/>Cache & Sessions)]
        ES[(Elasticsearch<br/>Search Engine)]
    end
    
    subgraph "External Services"
        API[One Piece TCG APIs<br/>Card Data]
        CDN[CDN<br/>AWS CloudFront]
        S3[AWS S3<br/>File Storage]
    end
    
    subgraph "Infrastructure"
        K8s[Kubernetes<br/>Container Orchestration]
        MON[Monitoring<br/>DataDog + Sentry]
        LOG[Logging<br/>ELK Stack]
    end
    
    MA --> AG
    WA --> AG
    DA --> AG
    
    AG --> LB
    LB --> AS
    LB --> GS
    LB --> CS
    LB --> MS
    LB --> NS
    
    AS --> PG
    GS --> PG
    CS --> PG
    MS --> PG
    NS --> PG
    
    GS --> WS
    MS --> WS
    WS --> RM
    
    AS --> RD
    GS --> RD
    CS --> RD
    MS --> RD
    NS --> RD
    
    CS --> ES
    GS --> ES
    
    CS --> API
    GS --> API
    
    CS --> S3
    GS --> S3
    S3 --> CDN
    
    K8s --> AS
    K8s --> GS
    K8s --> CS
    K8s --> MS
    K8s --> NS
    K8s --> WS
    
    MON --> AS
    MON --> GS
    MON --> CS
    MON --> MS
    MON --> NS
    MON --> WS
    
    LOG --> AS
    LOG --> GS
    LOG --> CS
    LOG --> MS
    LOG --> NS
    LOG --> WS
```

## 📱 Client Architecture

### Mobile App (React Native)
```mermaid
graph TB
    subgraph "React Native App"
        NAV[Navigation<br/>React Navigation]
        STORE[State Management<br/>Redux Toolkit]
        API[API Client<br/>Axios + RTK Query]
        WS[WebSocket Client<br/>Socket.io Client]
    end
    
    subgraph "Screens"
        HOME[Home Screen]
        DECK[Deck Builder]
        GAME[Game Screen]
        COLL[Collection]
        PROFILE[Profile]
    end
    
    subgraph "Components"
        CARD[Card Component]
        DECKLIST[Deck List]
        GAMEBOARD[Game Board]
        CHAT[Chat Component]
    end
    
    NAV --> HOME
    NAV --> DECK
    NAV --> GAME
    NAV --> COLL
    NAV --> PROFILE
    
    STORE --> API
    STORE --> WS
    
    HOME --> CARD
    DECK --> CARD
    DECK --> DECKLIST
    GAME --> GAMEBOARD
    GAME --> CHAT
    COLL --> CARD
```

### Web App (Next.js)
```mermaid
graph TB
    subgraph "Next.js App"
        PAGES[Pages<br/>App Router]
        COMP[Components<br/>React Components]
        HOOKS[Hooks<br/>Custom Hooks]
        UTILS[Utils<br/>Helper Functions]
    end
    
    subgraph "Features"
        SSR[Server-Side Rendering]
        SSG[Static Site Generation]
        PWA[Progressive Web App]
        SEO[SEO Optimization]
    end
    
    subgraph "State Management"
        ZUSTAND[Zustand Store]
        REACT_QUERY[TanStack Query]
        CONTEXT[React Context]
    end
    
    PAGES --> COMP
    COMP --> HOOKS
    HOOKS --> UTILS
    
    PAGES --> SSR
    PAGES --> SSG
    PAGES --> PWA
    PAGES --> SEO
    
    COMP --> ZUSTAND
    COMP --> REACT_QUERY
    COMP --> CONTEXT
```

## 🔧 Backend Architecture

### Microservices Structure
```mermaid
graph TB
    subgraph "API Gateway"
        GW[Kong Gateway]
        AUTH[Authentication]
        RATE[Rate Limiting]
        LOG[Request Logging]
    end
    
    subgraph "Core Services"
        US[User Service]
        GS[Game Service]
        CS[Collection Service]
        MS[Matchmaking Service]
        NS[Notification Service]
    end
    
    subgraph "Supporting Services"
        FS[File Service]
        ES[Email Service]
        AS[Analytics Service]
        RS[Report Service]
    end
    
    subgraph "Data Services"
        DB[Database Service]
        CACHE[Cache Service]
        SEARCH[Search Service]
    end
    
    GW --> AUTH
    GW --> RATE
    GW --> LOG
    
    AUTH --> US
    RATE --> GS
    RATE --> CS
    RATE --> MS
    RATE --> NS
    
    US --> DB
    GS --> DB
    CS --> DB
    MS --> DB
    NS --> DB
    
    GS --> CACHE
    CS --> CACHE
    MS --> CACHE
    
    CS --> SEARCH
    GS --> SEARCH
    
    FS --> US
    ES --> US
    AS --> GS
    RS --> AS
```

### Database Architecture
```mermaid
erDiagram
    USERS ||--o{ USER_COLLECTIONS : has
    USERS ||--o{ DECKS : owns
    USERS ||--o{ GAMES : plays
    USERS ||--o{ FRIENDSHIPS : has
    
    CARDS ||--o{ USER_COLLECTIONS : in
    CARDS ||--o{ DECK_CARDS : in
    CARDS ||--o{ CARD_EFFECTS : has
    
    DECKS ||--o{ DECK_CARDS : contains
    DECKS ||--o{ DECK_SHARES : shared
    
    GAMES ||--o{ GAME_ACTIONS : contains
    GAMES ||--o{ GAME_PLAYERS : has
    
    USERS {
        uuid id PK
        string username
        string email
        string password_hash
        string avatar_url
        timestamp created_at
        timestamp updated_at
        boolean is_active
    }
    
    CARDS {
        uuid id PK
        string card_number
        string name
        string set_code
        string rarity
        string card_type
        integer cost
        integer power
        integer counter_power
        string attribute
        string color
        text effect_text
        string image_url
        timestamp created_at
    }
    
    DECKS {
        uuid id PK
        uuid user_id FK
        string name
        text description
        boolean is_public
        boolean is_valid
        timestamp created_at
    }
    
    GAMES {
        uuid id PK
        uuid player1_id FK
        uuid player2_id FK
        string status
        json game_state
        timestamp created_at
        timestamp updated_at
    }
```

## 🔄 Real-time Communication

### WebSocket Architecture
```mermaid
graph TB
    subgraph "Client Side"
        WC[WebSocket Client]
        EM[Event Manager]
        ST[State Sync]
    end
    
    subgraph "Server Side"
        WS[WebSocket Server]
        RM[Room Manager]
        EM_S[Event Manager]
        VAL[Validation]
    end
    
    subgraph "Message Types"
        GAME[Game Actions]
        CHAT[Chat Messages]
        NOTIF[Notifications]
        PING[Heartbeat]
    end
    
    WC --> WS
    WS --> RM
    RM --> EM_S
    EM_S --> VAL
    
    EM --> GAME
    EM --> CHAT
    EM --> NOTIF
    EM --> PING
    
    VAL --> GAME
    VAL --> CHAT
    VAL --> NOTIF
    VAL --> PING
```

### Event Flow
```mermaid
sequenceDiagram
    participant C1 as Client 1
    participant WS as WebSocket Server
    participant C2 as Client 2
    participant DB as Database
    
    C1->>WS: Play Card Action
    WS->>WS: Validate Action
    WS->>DB: Update Game State
    WS->>C1: Action Confirmed
    WS->>C2: Action Broadcast
    C2->>WS: Acknowledge
    WS->>C1: Opponent Acknowledged
```

## 🎮 Game Engine Architecture

### Game State Management
```mermaid
graph TB
    subgraph "Game Engine"
        GM[Game Manager]
        SM[State Manager]
        VM[Validation Manager]
        AM[Action Manager]
    end
    
    subgraph "Game Components"
        BOARD[Game Board]
        PLAYERS[Player States]
        DECK[Deck Manager]
        HAND[Hand Manager]
    end
    
    subgraph "Game Rules"
        CR[Card Rules]
        TR[Turn Rules]
        WR[Win Rules]
        ER[Effect Rules]
    end
    
    GM --> SM
    SM --> VM
    VM --> AM
    
    SM --> BOARD
    SM --> PLAYERS
    SM --> DECK
    SM --> HAND
    
    VM --> CR
    VM --> TR
    VM --> WR
    VM --> ER
    
    AM --> BOARD
    AM --> PLAYERS
    AM --> DECK
    AM --> HAND
```

### Card System Architecture
```mermaid
graph TB
    subgraph "Card System"
        CM[Card Manager]
        CE[Card Engine]
        CR[Card Renderer]
        CA[Card Animator]
    end
    
    subgraph "Card Types"
        LEADER[Leader Cards]
        CHARACTER[Character Cards]
        EVENT[Event Cards]
        STAGE[Stage Cards]
        DON[Don!! Cards]
    end
    
    subgraph "Card Effects"
        TE[Trigger Effects]
        AE[Activate Effects]
        CE_E[Counter Effects]
        PE[Passive Effects]
    end
    
    CM --> CE
    CE --> CR
    CR --> CA
    
    CE --> LEADER
    CE --> CHARACTER
    CE --> EVENT
    CE --> STAGE
    CE --> DON
    
    CE --> TE
    CE --> AE
    CE --> CE_E
    CE --> PE
```

## 🔐 Security Architecture

### Authentication Flow
```mermaid
sequenceDiagram
    participant C as Client
    participant AG as API Gateway
    participant AS as Auth Service
    participant DB as Database
    participant RD as Redis
    
    C->>AG: Login Request
    AG->>AS: Forward Request
    AS->>DB: Validate Credentials
    DB->>AS: User Data
    AS->>AS: Generate JWT
    AS->>RD: Store Session
    AS->>AG: JWT Token
    AG->>C: Return Token
    
    C->>AG: API Request + Token
    AG->>AS: Validate Token
    AS->>RD: Check Session
    RD->>AS: Session Valid
    AS->>AG: Token Valid
    AG->>C: API Response
```

### Security Layers
```mermaid
graph TB
    subgraph "Client Security"
        HTTPS[HTTPS/TLS]
        TOKEN[JWT Token]
        VALID[Input Validation]
    end
    
    subgraph "API Gateway Security"
        RATE[Rate Limiting]
        AUTH[Authentication]
        CORS[CORS Policy]
    end
    
    subgraph "Service Security"
        RBAC[Role-Based Access]
        VALID_S[Server Validation]
        ENCRYPT[Data Encryption]
    end
    
    subgraph "Database Security"
        CONN[Connection Encryption]
        BACKUP[Encrypted Backups]
        AUDIT[Audit Logging]
    end
    
    HTTPS --> RATE
    TOKEN --> AUTH
    VALID --> RBAC
    
    RATE --> CONN
    AUTH --> BACKUP
    CORS --> AUDIT
```

## 📊 Monitoring & Analytics

### Monitoring Stack
```mermaid
graph TB
    subgraph "Application Monitoring"
        APM[Application Performance Monitoring]
        ERR[Error Tracking]
        LOG[Log Aggregation]
        METRICS[Custom Metrics]
    end
    
    subgraph "Infrastructure Monitoring"
        CPU[CPU Usage]
        MEM[Memory Usage]
        DISK[Disk Usage]
        NET[Network Usage]
    end
    
    subgraph "Business Metrics"
        USERS[User Metrics]
        GAMES[Game Metrics]
        REVENUE[Revenue Metrics]
        ENGAGEMENT[Engagement Metrics]
    end
    
    subgraph "Alerting"
        PAGER[PagerDuty]
        SLACK[Slack Alerts]
        EMAIL[Email Alerts]
        DASH[Dashboard Alerts]
    end
    
    APM --> PAGER
    ERR --> SLACK
    LOG --> EMAIL
    METRICS --> DASH
    
    CPU --> PAGER
    MEM --> SLACK
    DISK --> EMAIL
    NET --> DASH
    
    USERS --> DASH
    GAMES --> DASH
    REVENUE --> DASH
    ENGAGEMENT --> DASH
```

## 🚀 Deployment Architecture

### Kubernetes Deployment
```mermaid
graph TB
    subgraph "Kubernetes Cluster"
        subgraph "Ingress Layer"
            ING[Ingress Controller]
            LB[Load Balancer]
        end
        
        subgraph "Application Layer"
            subgraph "Frontend Pods"
                WEB[Web App Pods]
                MOBILE[Mobile API Pods]
            end
            
            subgraph "Backend Pods"
                AUTH[Auth Service Pods]
                GAME[Game Service Pods]
                COLL[Collection Service Pods]
                MATCH[Matchmaking Service Pods]
            end
        end
        
        subgraph "Data Layer"
            PG[PostgreSQL Cluster]
            REDIS[Redis Cluster]
            ES[Elasticsearch Cluster]
        end
    end
    
    subgraph "External Services"
        CDN[CloudFront CDN]
        S3[AWS S3]
        MON[Monitoring Services]
    end
    
    ING --> LB
    LB --> WEB
    LB --> MOBILE
    LB --> AUTH
    LB --> GAME
    LB --> COLL
    LB --> MATCH
    
    AUTH --> PG
    GAME --> PG
    COLL --> PG
    MATCH --> PG
    
    AUTH --> REDIS
    GAME --> REDIS
    COLL --> REDIS
    MATCH --> REDIS
    
    COLL --> ES
    GAME --> ES
    
    WEB --> CDN
    MOBILE --> CDN
    CDN --> S3
    
    AUTH --> MON
    GAME --> MON
    COLL --> MON
    MATCH --> MON
```

## 🔄 CI/CD Pipeline

### Deployment Pipeline
```mermaid
graph LR
    subgraph "Development"
        DEV[Developer]
        GIT[Git Repository]
        PR[Pull Request]
    end
    
    subgraph "CI/CD Pipeline"
        BUILD[Build Stage]
        TEST[Test Stage]
        SEC[Security Scan]
        DEPLOY[Deploy Stage]
    end
    
    subgraph "Environments"
        DEV_ENV[Development]
        STAGING[Staging]
        PROD[Production]
    end
    
    DEV --> GIT
    GIT --> PR
    PR --> BUILD
    BUILD --> TEST
    TEST --> SEC
    SEC --> DEPLOY
    
    DEPLOY --> DEV_ENV
    DEPLOY --> STAGING
    DEPLOY --> PROD
```

## 📈 Scalability Architecture

### Horizontal Scaling
```mermaid
graph TB
    subgraph "Load Balancer"
        ALB[Application Load Balancer]
    end
    
    subgraph "Auto Scaling Groups"
        ASG1[Frontend ASG<br/>2-10 instances]
        ASG2[Backend ASG<br/>3-15 instances]
        ASG3[Database ASG<br/>2-5 instances]
    end
    
    subgraph "Database Scaling"
        READ[Read Replicas]
        WRITE[Write Master]
        CACHE[Redis Cluster]
    end
    
    ALB --> ASG1
    ALB --> ASG2
    ASG2 --> ASG3
    
    ASG3 --> READ
    ASG3 --> WRITE
    ASG2 --> CACHE
```

### Performance Optimization
- **CDN**: Global content delivery
- **Caching**: Multi-layer caching strategy
- **Database**: Read replicas and connection pooling
- **Microservices**: Independent scaling
- **Load Balancing**: Traffic distribution
- **Monitoring**: Real-time performance tracking
