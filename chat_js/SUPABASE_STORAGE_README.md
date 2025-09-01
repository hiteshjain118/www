# Supabase Storage Integration in Chat JS

This document explains how to use the `SupabaseStorageService` from the `coralbricks-common` package in your `chat_js` application.

## Overview

The `SupabaseStorageService` provides cloud-based blob storage for caching HTTP responses, conversation history, tool call results, and other data. It replaces file-based caching with a scalable cloud solution.

## Setup

### 1. Environment Variables

Add the following environment variables to your `.env` file:

```bash
# Supabase Configuration (Required for SupabaseStorageService)
SUPABASE_URL=your_supabase_project_url_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here
```

### 2. Configuration

The `config.ts` file has been updated to include Supabase configuration:

```typescript
// Supabase Configuration
supabaseUrl: process.env.SUPABASE_URL || '',
supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
```

## Usage

### Direct Usage

You can use the `SupabaseStorageService` directly:

```typescript
import { SupabaseStorageService } from 'coralbricks-common';

const storageService = new SupabaseStorageService();

// Cache data
await storageService.cache('my-cache-key', [{ id: 1, data: 'example' }]);

// Retrieve cached data
const data = await storageService.tryCache('my-cache-key');

// Clear cache
await storageService.clearCache('my-cache-key');
```

### Using the Chat Wrapper

For chat-specific use cases, use the `ChatSupabaseStorage` wrapper:

```typescript
import { chatStorage } from './src/services/supabase-storage';

// Cache conversation history
await chatStorage.cacheConversation('thread-123', [
  { role: 'user', content: 'Hello' },
  { role: 'assistant', content: 'Hi there!' }
]);

// Get cached conversation
const conversation = await chatStorage.getCachedConversation('thread-123');

// Cache tool call results
await chatStorage.cacheToolCallResult('tool-call-456', {
  result: 'success',
  data: { /* ... */ }
});

// Cache user session data
await chatStorage.cacheUserSession('user-789', {
  preferences: { /* ... */ },
  lastActive: new Date()
});
```

## Available Methods

### SupabaseStorageService (Direct)

- `cache(cacheKey: string, responses: any[])` - Store data in cache
- `tryCache(cacheKey: string)` - Retrieve cached data
- `clearCache(cacheKey: string)` - Clear specific cache entry
- `clearAllCache()` - Clear all cache (use with caution)
- `getCacheStats()` - Get storage statistics
- `listCachedFiles()` - List all cached files

### ChatSupabaseStorage (Wrapper)

- `cacheChatData(cacheKey: string, data: any[])` - Cache generic chat data
- `getCachedChatData(cacheKey: string)` - Retrieve generic chat data
- `cacheConversation(threadId: string, messages: any[])` - Cache conversation history
- `getCachedConversation(threadId: string)` - Get cached conversation
- `cacheToolCallResult(toolCallId: string, result: any)` - Cache tool call results
- `getCachedToolCallResult(toolCallId: string)` - Get cached tool call result
- `cacheUserSession(userId: string, sessionData: any)` - Cache user session data
- `getCachedUserSession(userId: string)` - Get cached user session

## Examples

### Caching API Responses

```typescript
import { chatStorage } from './src/services/supabase-storage';

async function handleApiRequest(requestId: string, data: any) {
  // Check cache first
  const cachedResponse = await chatStorage.getCachedChatData(`api-${requestId}`);
  
  if (cachedResponse) {
    return cachedResponse[0]; // Return first item since we stored single response
  }
  
  // Make API call if not cached
  const response = await makeApiCall(data);
  
  // Cache the response
  await chatStorage.cacheChatData(`api-${requestId}`, [response]);
  
  return response;
}
```

### Managing Conversation History

```typescript
import { chatStorage } from './src/services/supabase-storage';

async function addMessageToConversation(threadId: string, message: any) {
  // Get existing conversation
  let conversation = await chatStorage.getCachedConversation(threadId) || [];
  
  // Add new message
  conversation.push(message);
  
  // Cache updated conversation
  await chatStorage.cacheConversation(threadId, conversation);
  
  return conversation;
}
```

### Tool Call Result Caching

```typescript
import { chatStorage } from './src/services/supabase-storage';

async function executeTool(toolCallId: string, toolArgs: any) {
  // Check if we have a cached result
  const cachedResult = await chatStorage.getCachedToolCallResult(toolCallId);
  
  if (cachedResult) {
    return cachedResult[0];
  }
  
  // Execute tool
  const result = await executeToolLogic(toolArgs);
  
  // Cache the result
  await chatStorage.cacheToolCallResult(toolCallId, result);
  
  return result;
}
```

## Testing

Run the integration tests to verify everything works:

```bash
npm test -- src/tests/supabase-storage.test.ts
```

## Error Handling

The service includes comprehensive error handling:

- Network errors are logged with context
- Failed operations return `null` or throw errors as appropriate
- All errors include helpful debugging information

## Performance Considerations

- Cache keys should be unique and descriptive
- Large data sets are automatically compressed
- The service includes built-in rate limiting and retry logic
- Consider TTL (Time To Live) for frequently changing data

## Troubleshooting

### Common Issues

1. **Authentication Errors**: Verify your Supabase service role key has storage permissions
2. **Bucket Creation Errors**: Ensure the service role can create buckets
3. **Network Timeouts**: Check your network connection and Supabase project status

### Debug Mode

Enable debug logging by setting the log level:

```typescript
// In your config or environment
LOG_LEVEL=debug
```

### Storage Statistics

Monitor your storage usage:

```typescript
const stats = await chatStorage.getStorageStats();
console.log('Storage usage:', stats);
```

## Migration from File-Based Caching

If you're migrating from file-based caching:

1. Replace file read/write operations with `cache()` and `tryCache()`
2. Update cache keys to be more descriptive
3. Test thoroughly with your existing data
4. Monitor performance and adjust as needed

## Support

For issues or questions:
1. Check the error logs for detailed information
2. Verify your Supabase configuration
3. Test with the provided examples
4. Review the `coralbricks-common` package documentation 