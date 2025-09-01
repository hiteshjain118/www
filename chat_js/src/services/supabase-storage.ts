import { SupabaseStorageService } from 'coralbricks-common';
import config from '../../config';

/**
 * Chat JS Supabase Storage Service Wrapper
 * Provides easy access to Supabase storage functionality
 */
export class ChatSupabaseStorage {
  private static instance: ChatSupabaseStorage;
  private storageService: SupabaseStorageService;

  private constructor() {
    // Initialize the storage service with config from chat_js
    this.storageService = new SupabaseStorageService();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): ChatSupabaseStorage {
    if (!ChatSupabaseStorage.instance) {
      ChatSupabaseStorage.instance = new ChatSupabaseStorage();
    }
    return ChatSupabaseStorage.instance;
  }

  /**
   * Cache chat messages or responses
   */
  async cacheChatData(cacheKey: string, data: any[]): Promise<void> {
    try {
      await this.storageService.cache(cacheKey, data);
      console.log(`[ChatStorage] Cached ${data.length} items for key: ${cacheKey}`);
    } catch (error) {
      console.error(`[ChatStorage] Failed to cache data: ${error}`);
      throw error;
    }
  }

  /**
   * Retrieve cached chat data
   */
  async getCachedChatData(cacheKey: string): Promise<any[] | null> {
    try {
      const data = await this.storageService.tryCache(cacheKey);
      if (data) {
        console.log(`[ChatStorage] Cache hit for key: ${cacheKey}, found ${data.length} items`);
      } else {
        console.log(`[ChatStorage] Cache miss for key: ${cacheKey}`);
      }
      return data;
    } catch (error) {
      console.error(`[ChatStorage] Failed to retrieve cached data: ${error}`);
      return null;
    }
  }

  /**
   * Cache conversation history
   */
  async cacheConversation(threadId: string, messages: any[]): Promise<void> {
    const cacheKey = `conversation-${threadId}`;
    await this.cacheChatData(cacheKey, messages);
  }

  /**
   * Get cached conversation history
   */
  async getCachedConversation(threadId: string): Promise<any[] | null> {
    const cacheKey = `conversation-${threadId}`;
    return await this.getCachedChatData(cacheKey);
  }

  /**
   * Cache tool call results
   */
  async cacheToolCallResult(toolCallId: string, result: any): Promise<void> {
    const cacheKey = `tool-call-${toolCallId}`;
    await this.cacheChatData(cacheKey, [result]);
  }

  /**
   * Get cached tool call result
   */
  async getCachedToolCallResult(toolCallId: string): Promise<any[] | null> {
    const cacheKey = `tool-call-${toolCallId}`;
    return await this.getCachedChatData(cacheKey);
  }

  /**
   * Cache user session data
   */
  async cacheUserSession(userId: string, sessionData: any): Promise<void> {
    const cacheKey = `user-session-${userId}`;
    await this.cacheChatData(cacheKey, [sessionData]);
  }

  /**
   * Get cached user session data
   */
  async getCachedUserSession(userId: string): Promise<any[] | null> {
    const cacheKey = `user-session-${userId}`;
    return await this.getCachedChatData(cacheKey);
  }

  /**
   * Clear cache for a specific key
   */
  async clearCache(cacheKey: string): Promise<void> {
    try {
      await this.storageService.clearCache(cacheKey);
      console.log(`[ChatStorage] Cleared cache for key: ${cacheKey}`);
    } catch (error) {
      console.error(`[ChatStorage] Failed to clear cache: ${error}`);
      throw error;
    }
  }

  /**
   * Get storage statistics
   */
  async getStorageStats(): Promise<any> {
    try {
      const stats = await this.storageService.getCacheStats();
      console.log(`[ChatStorage] Storage stats:`, stats);
      return stats;
    } catch (error) {
      console.error(`[ChatStorage] Failed to get storage stats: ${error}`);
      return null;
    }
  }

  /**
   * List all cached files
   */
  async listCachedFiles(): Promise<string[]> {
    try {
      const files = await this.storageService.listCachedFiles();
      console.log(`[ChatStorage] Found ${files.length} cached files`);
      return files;
    } catch (error) {
      console.error(`[ChatStorage] Failed to list cached files: ${error}`);
      return [];
    }
  }

  /**
   * Clear all cache (use with caution)
   */
  async clearAllCache(): Promise<void> {
    try {
      await this.storageService.clearAllCache();
      console.log(`[ChatStorage] Cleared all cache`);
    } catch (error) {
      console.error(`[ChatStorage] Failed to clear all cache: ${error}`);
      throw error;
    }
  }
}

// Export singleton instance
export const chatStorage = ChatSupabaseStorage.getInstance();

// Export the class for testing or direct instantiation
export default ChatSupabaseStorage; 