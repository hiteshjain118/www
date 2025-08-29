# QBDataSizeRetriever TypeScript Implementation

This document describes the TypeScript port of the Python `qb_data_size_retriever.py` functionality for the `www/backend` directory.

## Overview

The `QBDataSizeRetriever` class provides functionality to retrieve the number of rows from QuickBooks data using COUNT(*) queries. This is a direct TypeScript translation of the Python implementation found in `builder/builder_package/core/qb_data_size_retriever.py`.

## Files Created

### Core Implementation
- `src/services/httpRetriever.ts` - Base class for HTTP API calls with caching and pagination
- `src/services/qbDataSizeRetriever.ts` - Main implementation of the data size retriever
- `src/services/qbHttpConnection.ts` - HTTP connection implementation for QuickBooks API
- `src/services/index.ts` - Updated to export new services

### Types and Interfaces
- `src/types/index.ts` - Updated with new interfaces:
  - `IToolCall` - Interface for tool call implementations
  - `ToolCallResult` - Class for tool call results with success/error handling
  - `IHTTPConnection` - Interface for HTTP connections
  - `IRetriever` - Interface for data retrievers
  - `ToolDescription` - Interface for tool descriptions
  - Updated `CBUser` interface with `base_url` property

### Examples and Documentation
- `src/examples/qbDataSizeRetrieverExample.ts` - Usage examples and demonstrations
- `QB_DATA_SIZE_RETRIEVER.md` - This documentation file

## Key Features

### 1. HTTP Retriever Base Class (`HTTPRetriever`)
- **Caching**: Supports file-based caching with JSONL format
- **Pagination**: Handles paginated API responses automatically
- **Authentication**: Manages Bearer token authentication
- **Error Handling**: Comprehensive error handling with logging

### 2. QB Data Size Retriever (`QBDataSizeRetriever`)
- **Query Validation**: Validates that queries contain `COUNT(*)`
- **Cache Key Generation**: Creates unique cache keys based on query content
- **Response Parsing**: Extracts table names and handles QuickBooks response format
- **Tool Interface**: Implements the `IToolCall` interface for LLM integration

### 3. HTTP Connection (`QBHttpConnection`)
- **Token Management**: Handles access token storage and validation
- **Authorization**: Manages authorization state
- **Platform Integration**: Provides platform-specific connection details

## Usage Example

```typescript
import { QBDataSizeRetriever, QBHttpConnection } from '../services';
import { CBUser, ViewerContext } from '../types';

// Create user context
const cbUser: CBUser = {
  // ... user properties
  base_url: "https://sandbox-quickbooks.api.intuit.com/v3/company/12345"
};

// Create connection with access token
const connection = new QBHttpConnection("12345", "access_token");

// Create retriever with COUNT query
const query = "SELECT COUNT(*) FROM Bill WHERE TxnDate = '2025-01-01'";
const retriever = new QBDataSizeRetriever(connection, cbUser, query);

// Execute the tool
const result = await retriever.call_tool();

if (result.status === 'success') {
  console.log('Data:', result.data);
} else {
  console.error('Error:', result.error_message);
}
```

## API Compatibility

The TypeScript implementation maintains API compatibility with the Python version:

| Python Method | TypeScript Method | Description |
|---------------|------------------|-------------|
| `is_query_valid()` | `is_query_valid()` | Validates query contains COUNT(*) |
| `extract_query_response_key()` | `extract_query_response_key()` | Extracts table name from query |
| `call_tool()` | `call_tool()` | Main tool execution method |
| `tool_name()` | `tool_name()` | Returns tool name identifier |
| `tool_description()` | `tool_description()` | Returns tool description for LLM |

## Error Handling

The implementation provides comprehensive error handling:

- **HTTP Errors**: Axios errors are caught and wrapped with status codes
- **Authentication Errors**: Invalid tokens and authorization failures
- **Validation Errors**: Invalid queries and malformed requests
- **Data Errors**: Empty responses and missing data handling

## Caching

The caching system works identically to the Python version:

- **File Format**: JSONL (JSON Lines) format
- **Cache Keys**: SHA-256 hash of query parameters (6 characters)
- **Cache Locations**: Configurable file paths or default naming
- **Cache Validation**: Automatic cache hit/miss detection

## Dependencies

- `axios` - HTTP client for API calls
- `crypto` - Hash generation for cache keys
- `fs` - File system operations for caching
- `winston` - Logging (via utils/logger)

## Integration Notes

1. **Authentication**: Requires valid QuickBooks OAuth access tokens
2. **Base URL**: CBUser must include the QuickBooks API base URL
3. **Tool Integration**: Implements IToolCall for LLM tool calling
4. **Async Operations**: All operations are Promise-based for async/await support

## Testing

To test the implementation:

```bash
# Run the example
npx ts-node src/examples/qbDataSizeRetrieverExample.ts

# Or import and use in your own tests
import { exampleUsage } from './examples/qbDataSizeRetrieverExample';
await exampleUsage();
```

## Future Enhancements

- [ ] Integration with existing QuickBooks authentication flow
- [ ] Advanced query validation (subqueries, joins, aliases)
- [ ] Token refresh automation
- [ ] Rate limiting for API calls
- [ ] Metrics and monitoring integration 