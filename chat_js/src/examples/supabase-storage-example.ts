import { SupabaseStorageService } from 'coralbricks-common';

/**
 * Example of how to use SupabaseStorageService in chat_js
 */
export class SupabaseStorageExample {
  private storageService: SupabaseStorageService;

  constructor() {
    // Create an instance of the storage service
    this.storageService = new SupabaseStorageService();
  }

  /**
   * Example: Cache some data
   */
  async cacheData(cacheKey: string, data: any[]): Promise<void> {
    try {
      await this.storageService.cache(cacheKey, data);
      console.log(`Successfully cached data for key: ${cacheKey}`);
    } catch (error) {
      console.error(`Failed to cache data: ${error}`);
    }
  }

  /**
   * Example: Retrieve cached data
   */
  async getCachedData(cacheKey: string): Promise<any[] | null> {
    try {
      const data = await this.storageService.tryCache(cacheKey);
      if (data) {
        console.log(`Cache hit for key: ${cacheKey}, found ${data.length} items`);
      } else {
        console.log(`Cache miss for key: ${cacheKey}`);
      }
      return data;
    } catch (error) {
      console.error(`Failed to retrieve cached data: ${error}`);
      return null;
    }
  }

  /**
   * Example: Clear cache for a specific key
   */
  async clearCache(cacheKey: string): Promise<void> {
    try {
      await this.storageService.clearCache(cacheKey);
      console.log(`Cleared cache for key: ${cacheKey}`);
    } catch (error) {
      console.error(`Failed to clear cache: ${error}`);
    }
  }

  /**
   * Example: Get cache statistics
   */
  async getCacheStats(): Promise<void> {
    try {
      const stats = await this.storageService.getCacheStats();
      console.log(`Cache stats:`, stats);
    } catch (error) {
      console.error(`Failed to get cache stats: ${error}`);
    }
  }

  /**
   * Example: List all cached files
   */
  async listCachedFiles(): Promise<void> {
    try {
      const files = await this.storageService.listCachedFiles();
      console.log(`Cached files:`, files);
    } catch (error) {
      console.error(`Failed to list cached files: ${error}`);
    }
  }
}

// Usage example
export async function runExample() {
  const example = new SupabaseStorageExample();
  
  // Cache some sample data
  const sampleData = [
    { id: 1, name: 'Item 1', timestamp: new Date().toISOString() },
    { id: 2, name: 'Item 2', timestamp: new Date().toISOString() }
  ];
  
  const cacheKey = 'sample-data-' + Date.now();
  
  // Cache the data
  await example.cacheData(cacheKey, sampleData);
  
  // Retrieve the cached data
  const retrievedData = await example.getCachedData(cacheKey);
  console.log('Retrieved data:', retrievedData);
  
  // Get cache statistics
  await example.getCacheStats();
  
  // List cached files
  await example.listCachedFiles();
  
  // Clean up - clear the cache
  await example.clearCache(cacheKey);
}

// Export for use in other files
export default SupabaseStorageExample; 