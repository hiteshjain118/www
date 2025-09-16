# CoralBricks Internal Tools API

This document describes the internal tools API that runs on a separate port for internal service communication.

## Overview

The Internal Tools API provides a REST interface for executing QuickBooks tools from other services like `chat_js`. It runs on a separate port (default: 3001) and is designed for internal service-to-service communication.

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   chat_js       │    │  Internal API   │    │   QuickBooks    │
│                 │    │  (Port 3001)    │    │      API        │
│  Tool Requests  ├────┤                 ├────┤                 │
│                 │    │  Tool Execution │    │  Data Retrieval │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Configuration

### Environment Variables

```bash
# Main API port (default: 3000)
PORT=3000

# Internal tools API port (default: 3001)
INTERNAL_PORT=3001

# Other existing environment variables...
```

### Starting the Servers

```bash
# Start both main API and internal tools API
npm start

# Start only the internal tools API (development)
npm run dev:internal

# Start only the internal tools API (production)
npm run start:internal
```

## API Endpoints

### Base URL
```
http://localhost:3001
```

### 1. Get Available Tools

**GET /tools**

Returns all available tool descriptions for LLM integration.

```bash
curl http://localhost:3001/tools
```

**Response:**
```json
{
  "success": true,
  "tools": [
    {
      "name": "qb_data_size_retriever",
      "description": {
        "type": "function",
        "function": {
          "name": "qb_data_size_retriever",
          "description": "Retrieve number of rows in a query from Quickbooks",
          "parameters": {
            "type": "object",
            "properties": {
              "query": {
                "type": "string",
                "description": "The query to retrieve number of rows from Quickbooks"
              }
            }
          }
        }
      }
    },
    // ... other tools
  ],
  "count": 3
}
```

### 2. Execute Tools

**POST /:toolName**

Executes a specific tool with provided arguments.

#### Common Parameters

All tool executions require:
- `cbid`: User ID (string)
- `qbo_profile_id`: QuickBooks profile ID (string)
- Tool-specific parameters

#### QB Data Size Retriever

**POST /qb_data_size_retriever**

```bash
curl -X POST http://localhost:3001/qb_data_size_retriever \
  -H "Content-Type: application/json" \
  -d '{
    "cbid": "123",
    "qbo_profile_id": "456",
    "query": "SELECT COUNT(*) FROM Bill WHERE TxnDate >= '\'2024-01-01'\''"
  }'
```

#### QB Data Schema Retriever

**POST /qb_data_schema_retriever**

```bash
curl -X POST http://localhost:3001/qb_data_schema_retriever \
  -H "Content-Type: application/json" \
  -d '{
    "cbid": "123",
    "qbo_profile_id": "456",
    "table_name": "Bill"
  }'
```

#### QB User Data Retriever

**POST /qb_user_data_retriever**

```bash
curl -X POST http://localhost:3001/qb_user_data_retriever \
  -H "Content-Type: application/json" \
  -d '{
    "cbid": "123",
    "qbo_profile_id": "456",
    "endpoint": "/query",
    "parameters": {
      "query": "SELECT * FROM Bill WHERE TxnDate >= '\'2024-01-01'\' ORDER BY TxnDate"
    },
    "expected_row_count": 50
  }'
```

### 3. Health Check

**GET /health**

```bash
curl http://localhost:3001/health
```

**Response:**
```json
{
  "status": "healthy",
  "service": "coralbricks-internal-tools-api",
  "timestamp": "2025-01-27T10:30:00.000Z",
  "uptime": 3600
}
```

### 4. API Information

**GET /**

Returns API documentation and usage information.

## Client Integration

### TypeScript Client

```typescript
import { InternalToolsClient } from './src/examples/internal-api-client';

const client = new InternalToolsClient(); // Uses default port 3001

// Get available tools
const tools = await client.getAvailableTools();

// Execute a tool
const result = await client.executeQBDataSizeRetriever(
  'user_cbid',
  'qbo_profile_id', 
  'SELECT COUNT(*) FROM Item'
);
```

### chat_js Integration Example

```typescript
// In chat_js tool-call-runner.ts
import axios from 'axios';

const INTERNAL_API_BASE = 'http://localhost:3001';

async function executeInternalTool(toolName: string, args: any) {
  const response = await axios.post(`${INTERNAL_API_BASE}/${toolName}`, {
    cbid: 'user_cbid',
    qbo_profile_id: 'user_qbo_profile_id',
    ...args
  });
  
  return response.data;
}

// Replace existing tool execution with internal API calls
if (tool_name === 'qb_data_size_retriever') {
  result = await executeInternalTool('qb_data_size_retriever', tool_arguments);
}
```

## Error Handling

### Error Response Format

```json
{
  "success": false,
  "error": "Error description",
  "tool_name": "qb_data_size_retriever",
  "message": "Detailed error message"
}
```

### Common Error Codes

- **400 Bad Request**: Missing required parameters
- **404 Not Found**: Tool not found
- **500 Internal Server Error**: Tool execution failed

## Security

- **Localhost Only**: Internal API binds to `127.0.0.1` only
- **No Authentication**: Designed for trusted internal service communication
- **CORS Permissive**: Allows all origins for internal use

## Available Tools

| Tool Name | Description | Required Parameters |
|-----------|-------------|-------------------|
| `qb_data_size_retriever` | Get row count from QB queries | `query` |
| `qb_data_schema_retriever` | Get table schema information | `table_name` |
| `qb_user_data_retriever` | Retrieve user data from QB | `endpoint`, `parameters`, `expected_row_count` |

## Development

### Adding New Tools

1. **Create Tool Class**: Implement `IToolCall` interface
2. **Add to Registry**: Update `TOOL_REGISTRY` in `/routes/tools.ts`
3. **Add Switch Case**: Add tool instantiation logic
4. **Update Client**: Add method to `InternalToolsClient`
5. **Update Documentation**: Add to this README

### Testing

```bash
# Start internal server only
npm run dev:internal

# Test with example client
npx tsx src/examples/internal-api-client.ts

# Test with curl
curl http://localhost:3001/tools
```

## Production Deployment

### Environment Setup
```bash
INTERNAL_PORT=3001
NODE_ENV=production
```

### Process Management
```bash
# Start both servers
npm start

# Or start separately
npm run start:internal &  # Internal API in background
npm run start            # Main API in foreground
```

### Health Monitoring

Monitor both services:
- Main API: `http://localhost:3000/health`
- Internal API: `http://localhost:3001/health`

## Troubleshooting

### Common Issues

1. **Port Already in Use**
   ```bash
   Error: listen EADDRINUSE: address already in use :::3001
   ```
   Solution: Change `INTERNAL_PORT` or kill existing process

2. **Tool Execution Fails**
   - Check QB profile connection
   - Verify user permissions
   - Check tool-specific parameters

3. **Connection Refused**
   - Ensure internal server is running
   - Check firewall settings
   - Verify port configuration

### Logs

Internal API logs are prefixed with `[INTERNAL]`:
```
[INTERNAL] POST /qb_data_size_retriever
``` 