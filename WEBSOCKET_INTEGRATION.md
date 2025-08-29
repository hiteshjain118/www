# WebSocket Integration with chat_js Server

This document describes the WebSocket integration between the www frontend and the chat_js server for real-time AI agent building conversations.

## Overview

When a user loads a thread in the www frontend, they automatically connect to the chat_js WebSocket server. This enables real-time communication with the AI agent builder.

## Port Configuration

- **Frontend (www/frontend)**: Port 3002
- **Backend (www/backend)**: Port 3001  
- **chat_js WebSocket Server**: Port 3004

## Architecture

```
www Frontend (React) ←→ WebSocket ←→ chat_js Server (Node.js)
   Port 3002                        Port 3004
     (Thread.tsx)                    (server.js)
```

## Implementation

### Thread.tsx Integration

The `Thread.tsx` component in `www/frontend/src/pages/Thread.tsx` includes:

1. **Automatic WebSocket Connection**: When a thread is loaded, connects to `ws://localhost:3004`
2. **Real-time Messaging**: User messages are sent via WebSocket to chat_js server
3. **Connection Status**: Visual indicator showing connection state (connected, connecting, error, disconnected)
4. **Message Handling**: Processes AI responses received via WebSocket
5. **Error Handling**: Graceful fallback when WebSocket is unavailable

### WebSocket Service

The `WebSocketService` class in `www/frontend/src/services/websocket.ts` manages:

- Connection lifecycle (connect, disconnect, reconnect)
- Message routing between Thread.tsx and chat_js server
- Automatic reconnection with exponential backoff
- Error handling and status reporting

### chat_js Server

The server at `chat_js/server.js` handles:

- Thread-based WebSocket connections with query parameters `?threadId=X&userId=Y`
- Session management per thread
- Message processing through AI agent builder
- Automatic session cleanup when clients disconnect

## Usage

### Starting the Servers

1. **chat_js server** (port 3004):
   ```bash
   cd chat_js
   npm start
   ```

2. **www backend** (port 3001):
   ```bash
   cd www/backend
   npm run dev
   ```

3. **www frontend** (port 3002):
   ```bash
   cd www/frontend
   npm run dev
   ```

### User Flow

1. User navigates to `/thread/{threadId}` in the frontend
2. Thread.tsx automatically connects to WebSocket with threadId and userId
3. Connection status is displayed in the chat header
4. User can send messages through the chat interface
5. Messages are processed by chat_js AI agent and responses appear in real-time

## Message Flow

```
User Input → Thread.tsx → WebSocket → chat_js → AI Processing → WebSocket → Thread.tsx → UI Update
```

## Configuration

Frontend WebSocket URL is configured in `www/frontend/src/config/index.ts`:

```typescript
export const config: Config = {
  backendApiUrl: 'http://localhost:3001',
  chatWebSocketUrl: 'ws://localhost:3004',
  environment: 'development',
};
```

## Status Indicators

The Thread.tsx component shows connection status:

- 🟢 **Connected**: WebSocket connected and ready
- 🟡 **Connecting**: Attempting to connect
- 🔴 **Error**: Connection failed
- ⚫ **Disconnected**: Not connected

## Error Handling

- **Connection Failed**: Shows error message and disables input
- **Connection Lost**: Automatically attempts reconnection
- **Fallback Mode**: When WebSocket unavailable, input is disabled with warning 