# Chat-JS Service - Docker Setup

This guide explains how to run the CoralBricks chat_js service using Docker.

## Overview

The chat_js service provides:
- Real-time WebSocket chat functionality
- QuickBooks integration for chat operations
- Intent processing and session management
- Tool execution and conversation memory

## Prerequisites

- Docker installed on your system
- Environment variables configured

## Quick Start

1. **Navigate to chat_js directory**
   ```bash
   cd chat_js
   ```

2. **Set up environment variables**
   ```bash
   cp env.example .env
   # Edit .env with your actual values
   ```

3. **Build the Docker image**
   ```bash
   # Production build (compiled TypeScript)
   docker build -t coralbricks-chat .
   
   # Development build (ts-node)
   docker build -f Dockerfile.dev -t coralbricks-chat:dev .
   ```

4. **Run the container**
   ```bash
   # Production
   docker run -p 3004:3004 --env-file .env coralbricks-chat
   
   # Development
   docker run -p 3004:3004 --env-file .env coralbricks-chat:dev
   ```

5. **Access the service**
   - WebSocket: ws://localhost:3004
   - Status API: http://localhost:3004/api/status
   - Clients API: http://localhost:3004/api/clients

## Environment Variables

Create `.env` file with:
```env
NODE_ENV=development
PORT=3004
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
LOG_LEVEL=debug
LOG_FILE=logs/chat-service.log
```

## Build Modes

### Production Mode (Default)
- **Multi-stage Docker build**
- **Compiled TypeScript**: Runs `npm run build` (tsc)
- **Optimized image**: Production dependencies only
- **Entry point**: `node dist/server.js`
- **Use case**: Production deployments

### Development Mode
- **Single-stage Docker build**
- **TypeScript runtime**: Uses `ts-node`
- **Full dependencies**: Includes dev dependencies
- **Entry point**: `npm start` (ts-node server.ts)
- **Use case**: Development and debugging

## Docker Commands

### Production Build
```bash
# Build production image
docker build -t coralbricks-chat .

# Run production container
docker run -p 3004:3004 --env-file .env coralbricks-chat

# Run in background
docker run -d -p 3004:3004 --env-file .env --name chat coralbricks-chat
```

### Development Build
```bash
# Build development image
docker build -f Dockerfile.dev -t coralbricks-chat:dev .

# Run development container
docker run -p 3004:3004 --env-file .env coralbricks-chat:dev

# Run with code mounting (for live changes)
docker run -p 3004:3004 --env-file .env -v $(pwd):/app coralbricks-chat:dev
```

### Management
```bash
# Stop container
docker stop chat

# Remove container
docker rm chat

# View logs
docker logs chat
docker logs -f chat  # Follow logs

# Access container shell
docker exec -it chat sh
```

## Service Architecture

### Production Mode
- **Base Image**: Node.js 18 Alpine (multi-stage)
- **Build Process**: TypeScript compilation (`tsc`)
- **Runtime**: Compiled JavaScript
- **Dependencies**: Production only
- **Size**: Optimized/smaller

### Development Mode  
- **Base Image**: Node.js 18 Alpine (single-stage)
- **Build Process**: Direct TypeScript execution
- **Runtime**: ts-node
- **Dependencies**: Full (dev + production)
- **Size**: Larger but includes debugging tools

## Available Endpoints

### REST API
- `GET /api/status` - Service health and statistics
- `GET /api/clients` - Connected WebSocket clients info

### WebSocket
- Connect to `ws://localhost:3004` for real-time chat
- Supports session management and intent processing
- Handles tool execution and conversation memory

## Integration

### QuickBooks Integration
The service integrates with QuickBooks for:
- Financial data queries
- Report generation
- Data analysis and insights

### Session Management
- Maintains conversation state per WebSocket connection
- Handles user authentication and thread management
- Supports intent recognition and processing

## Troubleshooting

### Common Issues

1. **Port already in use**
   ```bash
   # Check what's using port 3004
   lsof -i :3004
   
   # Use different port
   docker run -p 3005:3004 --env-file .env coralbricks-chat
   ```

2. **Environment variables not loaded**
   ```bash
   # Verify .env file exists
   cat .env
   
   # Check environment inside container
   docker run --env-file .env coralbricks-chat env
   ```

3. **WebSocket connection issues**
   ```bash
   # Check container logs
   docker logs chat
   
   # Test status endpoint
   curl http://localhost:3004/api/status
   ```

4. **TypeScript compilation errors (production)**
   ```bash
   # Try development mode instead
   docker build -f Dockerfile.dev -t coralbricks-chat:dev .
   docker run -p 3004:3004 --env-file .env coralbricks-chat:dev
   ```

## Production Deployment

### Recommended Production Setup
```bash
# Build with version tag
docker build -t coralbricks-chat:v1.0.0 .

# Run with resource limits
docker run -d \
  --name chat-prod \
  -p 3004:3004 \
  --env-file .env \
  --memory=1g \
  --cpus=1.0 \
  --restart=unless-stopped \
  coralbricks-chat:v1.0.0
```

### Production Considerations
1. **Resource limits**: Set appropriate memory/CPU limits
2. **Persistent logs**: Mount log directory for persistence
3. **Health monitoring**: Use the `/api/status` endpoint
4. **Environment security**: Use Docker secrets for sensitive data
5. **Scaling**: Consider multiple instances behind a load balancer
6. **WebSocket persistence**: Plan for connection state management

## Development Workflow

### Local Development
```bash
# Build development image
docker build -f Dockerfile.dev -t coralbricks-chat:dev .

# Run with file watching (if supported)
docker run -p 3004:3004 --env-file .env -v $(pwd):/app coralbricks-chat:dev

# Access logs in real-time
docker logs -f chat
```

### Testing
```bash
# Run tests in container
docker run --env-file .env coralbricks-chat npm test

# Run with coverage
docker run --env-file .env coralbricks-chat npm run test:coverage
```

## Security Considerations

- Container runs as non-root user (nodejs:1001)
- Environment variables for sensitive configuration
- Health checks for monitoring
- Proper WebSocket security practices
- File permissions managed in container 