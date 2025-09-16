# Installation & Setup Guide

## Prerequisites

### Required Software
- **Node.js** 20+ and npm
- **Docker** and Docker Compose
- **gcloud CLI** (for deployment)
- **Git**

### Google Cloud Setup
1. **Create Google Cloud Project** with billing enabled
2. **Enable APIs**:
   - Cloud Build API
   - Cloud Run API
   - Container Registry API
3. **Set Environment Variable**:
   ```bash
   export GOOGLE_CLOUD_PROJECT=your-project-id
   ```

## Quick Start

### 1. Clone and Install
```bash
git clone <repository-url>
cd www
```

### 2. Install Dependencies
```bash
# Backend
cd backend && npm install && cd ..

# Chat Service
cd chat_js && npm install && cd ..

# Frontend
cd frontend && npm install && cd ..

# Common (shared library)
cd common_js && npm install && cd ..
```

### 3. Environment Configuration

#### Backend (.env)
```bash
cd backend
cp .env.example .env
# Edit backend/.env with your configuration
```

#### Chat Service (.env)
```bash
cd chat_js
cp env.example .env
# Edit chat_js/.env with your configuration
```

#### Frontend (.env)
```bash
cd frontend
cp env.example .env.local
# Edit frontend/.env.local with your configuration
```

### 4. Local Development

#### Option A: Individual Services
```bash
# Terminal 1: Backend
cd backend && npm run dev

# Terminal 2: Chat Service
cd chat_js && npm run dev

# Terminal 3: Frontend
cd frontend && npm run dev
```

#### Option B: Docker Compose
```bash
# Development environment
docker-compose -f docker-compose.dev.yml up

# Production environment
docker-compose up
```

#### Option C: Start Script
```bash
cd scripts && ./start.sh
```

## Environment Variables

### Required Variables

#### Backend
```bash
DATABASE_URL=postgresql://user:password@host:port/database
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
QBO_CLIENT_ID=your-quickbooks-client-id
QBO_CLIENT_SECRET=your-quickbooks-client-secret
```

#### Chat Service
```bash
OPENAI_API_KEY=your-openai-api-key
INTERNAL_API_URL=http://localhost:3010  # Backend URL
DATABASE_URL=postgresql://user:password@host:port/database
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

#### Frontend
```bash
VITE_BACKEND_API_URL=http://localhost:3010
VITE_CHAT_WEBSOCKET_URL=ws://localhost:3004
VITE_NODE_ENV=development
```

### Optional Variables
```bash
# Logging
LOG_LEVEL=info
LOG_FILE=logs/app.log

# Security
JWT_SECRET=your-jwt-secret
RATE_LIMIT_ENABLED=true
MAX_CONNECTIONS_PER_IP=10

# Session Management
SESSION_TIMEOUT=3600000
MAX_SESSIONS=1000
```

## Database Setup

### Using Supabase (Recommended)
1. Create account at [supabase.com](https://supabase.com)
2. Create new project
3. Get URL and service role key from project settings
4. Run Prisma migrations:
   ```bash
   cd common_js
   npx prisma migrate deploy
   npx prisma generate
   ```

### Using Local PostgreSQL
```bash
# Install PostgreSQL
# Create database
createdb coralbricks

# Set DATABASE_URL
DATABASE_URL=postgresql://username:password@localhost:5432/coralbricks

# Run migrations
cd common_js
npx prisma migrate deploy
npx prisma generate
```

## QuickBooks Setup

1. **Create QuickBooks App** at [developer.intuit.com](https://developer.intuit.com)
2. **Get Credentials**: Client ID and Client Secret
3. **Set Redirect URI**: `https://your-domain.com/qbo/callback`
4. **Add to Environment**: Update `QBO_CLIENT_ID` and `QBO_CLIENT_SECRET`

For detailed QuickBooks setup, see [docs/quickbooks.md](quickbooks.md).

## Deployment Setup

### Google Cloud Authentication
```bash
# Install gcloud CLI
# Authenticate
gcloud auth login
gcloud auth application-default login

# Set project
gcloud config set project your-project-id
export GOOGLE_CLOUD_PROJECT=your-project-id
```

### Deploy to Google Cloud
```bash
# Deploy all services
./deploy.sh

# Or individual services
cd backend && ./deploy.sh
cd chat_js && ./deploy.sh
```

For detailed deployment instructions, see [docs/deployment.md](deployment.md).

## Verification

### Check Services
```bash
# Backend
curl http://localhost:3010/health

# Chat Service
curl http://localhost:3004/api/status

# Frontend
open http://localhost:3001
```

### Check Database Connection
```bash
cd common_js
npx prisma studio  # Opens database browser
```

## Troubleshooting

### Common Issues

#### Port Conflicts
```bash
# Check what's using ports
lsof -i :3001  # Frontend
lsof -i :3004  # Chat
lsof -i :3010  # Backend
```

#### Database Connection
```bash
# Test Prisma connection
cd common_js
npx prisma db push --preview-feature
```

#### Docker Issues
```bash
# Clean Docker
docker system prune -a
docker-compose down -v
```

#### Permission Issues
```bash
# Fix script permissions
chmod +x scripts/*.sh
chmod +x backend/deploy.sh
chmod +x chat_js/deploy.sh
```

### Environment Validation
Use the validation script:
```bash
cd scripts && ./validate-docker.sh
```

### Get Help
- Check service-specific docs in [docs/](README.md)
- View logs in each service's logs directory
- Check individual service README files

## Next Steps

1. **Complete Setup**: [docs/quickbooks.md](quickbooks.md) for QBO integration
2. **Deploy**: [docs/deployment.md](deployment.md) for production deployment
3. **Develop**: See individual service documentation in [docs/](README.md)
