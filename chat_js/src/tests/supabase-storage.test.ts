import { SupabaseStorageService } from 'coralbricks-common';
import { ChatSupabaseStorage } from '../services/supabase-storage';

describe('SupabaseStorageService Integration', () => {
  let storageService: SupabaseStorageService;
  let chatStorage: ChatSupabaseStorage;

  beforeEach(() => {
    storageService = new SupabaseStorageService();
    chatStorage = ChatSupabaseStorage.getInstance();
  });

  describe('SupabaseStorageService', () => {
    it('should be able to create an instance', () => {
      expect(storageService).toBeInstanceOf(SupabaseStorageService);
    });

    it('should have required methods', () => {
      expect(typeof storageService.tryCache).toBe('function');
      expect(typeof storageService.cache).toBe('function');
      expect(typeof storageService.clearCache).toBe('function');
      expect(typeof storageService.getCacheStats).toBe('function');
    });
  });

  describe('ChatSupabaseStorage', () => {
    it('should be able to create an instance', () => {
      expect(chatStorage).toBeInstanceOf(ChatSupabaseStorage);
    });

    it('should have required methods', () => {
      expect(typeof chatStorage.cacheChatData).toBe('function');
      expect(typeof chatStorage.getCachedChatData).toBe('function');
      expect(typeof chatStorage.cacheConversation).toBe('function');
      expect(typeof chatStorage.getCachedConversation).toBe('function');
    });

    it('should return singleton instance', () => {
      const instance1 = ChatSupabaseStorage.getInstance();
      const instance2 = ChatSupabaseStorage.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('Integration Tests', () => {
    const testCacheKey = 'test-integration-' + Date.now();
    const testData = [
      { id: 1, message: 'Test message 1' },
      { id: 2, message: 'Test message 2' }
    ];

    afterEach(async () => {
      try {
        await storageService.clearCache(testCacheKey);
      } catch (error) {
        // Ignore cleanup errors
      }
    });

    it('should be able to cache and retrieve data', async () => {
      // Cache data
      await storageService.cache(testCacheKey, testData);
      
      // Retrieve data
      const retrievedData = await storageService.tryCache(testCacheKey);
      
      expect(retrievedData).toEqual(testData);
    }, 10000); // 10 second timeout for network operations

    it('should handle cache misses gracefully', async () => {
      const nonExistentKey = 'non-existent-key-' + Date.now();
      const retrievedData = await storageService.tryCache(nonExistentKey);
      
      expect(retrievedData).toBeNull();
    }, 10000);

    it('should be able to clear cache', async () => {
      // Cache data first
      await storageService.cache(testCacheKey, testData);
      
      // Verify data exists
      const retrievedData = await storageService.tryCache(testCacheKey);
      expect(retrievedData).toEqual(testData);
      
      // Clear cache
      await storageService.clearCache(testCacheKey);
      
      // Verify data is gone
      const clearedData = await storageService.tryCache(testCacheKey);
      expect(clearedData).toBeNull();
    }, 15000);
  });
}); 