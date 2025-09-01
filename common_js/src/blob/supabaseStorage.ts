import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { config } from '../config';
import { log } from '../utils/logger';

/**
 * Supabase Storage Service for caching HTTP responses
 * Replaces file-based caching with cloud blob storage
 */
export class SupabaseStorageService {
  private client: SupabaseClient;
  private bucketName: string = 'http-cache';

  constructor() {
    this.client = createClient(
      config.supabaseUrl,
      config.supabaseServiceRoleKey // Use service role key for server-side operations
    );
  }

  /**
   * Ensure the storage bucket exists
   */
  private async ensureBucket(): Promise<void> {
    try {
      const { data: buckets, error: listError } = await this.client.storage.listBuckets();
      
      if (listError) {
        throw new Error(`Failed to list buckets: ${listError.message}`);
      }

      const bucketExists = buckets?.some((bucket: any) => bucket.name === this.bucketName);
      
      if (!bucketExists) {
        const { error: createError } = await this.client.storage.createBucket(this.bucketName, {
          public: false,
          allowedMimeTypes: ['application/json', 'text/plain'],
          fileSizeLimit: 50 * 1024 * 1024 // 50MB limit
        });

        if (createError) {
          throw new Error(`Failed to create bucket: ${createError.message}`);
        }

        log.info(`Created storage bucket: ${this.bucketName}`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      log.error(`Failed to ensure Supabase storage bucket '${this.bucketName}' exists: ${errorMessage}`, {
        error,
        bucketName: this.bucketName,
        supabaseUrl: config.supabaseUrl,
        action: 'Verify Supabase credentials and bucket permissions'
      });
      
      // Provide actionable error context
      throw new Error(
        `Supabase storage bucket initialization failed: ${errorMessage}. ` +
        `Check that the Supabase service role key has storage permissions and can list/create buckets in project: ${config.supabaseUrl}`
      );
    }
  }

  /**
   * Generate a blob path for a cache key
   */
  private getBlobPath(cacheKey: string): string {
    return `${cacheKey}.jsonl`;
  }

  /**
   * Try to retrieve cached data from Supabase Storage
   */
  async tryCache(cacheKey: string): Promise<any[] | null> {
    try {
      await this.ensureBucket();
      
      const blobPath = this.getBlobPath(cacheKey);
      
      const { data, error } = await this.client.storage
        .from(this.bucketName)
        .download(blobPath);

      if (error) {
        if (error.message.includes('Object not found')) {
          log.info(`Cache miss for key: ${cacheKey}`);
          return null;
        }
        throw new Error(`Failed to download cache: ${error.message}`);
      }

      if (!data) {
        return null;
      }

      // Convert blob to text
      const fileContent = await data.text();
      
      // Parse JSONL format
      const responses = fileContent
        .split('\n')
        .filter((line: string) => line.trim())
        .map((line: string) => JSON.parse(line));

      log.info(`Cache hit for key: ${cacheKey}, found ${responses.length} responses`);

      return responses;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      log.error(`Failed to read from cache for key '${cacheKey}': ${errorMessage}`, {
        error,
        cacheKey,
        bucketName: this.bucketName,
        supabaseUrl: config.supabaseUrl
      });
      return null;
    }
  }

  /**
   * Store data in Supabase Storage cache
   */
  async cache(cacheKey: string, responses: Record<string, any>[]): Promise<void> {
    try {
      await this.ensureBucket();

      const blobPath = this.getBlobPath(cacheKey);
      
      // Convert responses to JSONL format
      const lines = responses.map(response => JSON.stringify(response)).join('\n') + '\n';
      const blob = new Blob([lines], { type: 'application/json' });

      const { error } = await this.client.storage
        .from(this.bucketName)
        .upload(blobPath, blob, {
          cacheControl: '3600', // Cache for 1 hour
          upsert: true // Overwrite if exists
        });

      if (error) {
        throw new Error(`Failed to upload cache: ${error.message}`);
      }

      log.info(`Cached ${responses.length} responses for key: ${cacheKey}`, { 
        blob_path: blobPath,
        size_bytes: blob.size
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      log.error(`Failed to save to cache for key '${cacheKey}': ${errorMessage}`, { 
        error, 
        cacheKey, 
        responseCount: responses.length 
      });
      throw error;
    }
  }

  /**
   * Clear cache for a specific key
   */
  async clearCache(cacheKey: string): Promise<void> {
    try {
      const blobPath = this.getBlobPath(cacheKey);
      
      const { error } = await this.client.storage
        .from(this.bucketName)
        .remove([blobPath]);

      if (error) {
        throw new Error(`Failed to clear cache: ${error.message}`);
      }

      log.info(`Cleared cache for key: ${cacheKey}`);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      log.error(`Failed to clear cache for key '${cacheKey}': ${errorMessage}`, { 
        error, 
        cacheKey 
      });
      throw error;
    }
  }

  /**
   * List all cached files (useful for debugging)
   */
  async listCachedFiles(): Promise<string[]> {
    try {
      const { data, error } = await this.client.storage
        .from(this.bucketName)
        .list('', {
          limit: 100,
          sortBy: { column: 'created_at', order: 'desc' }
        });

      if (error) {
        throw new Error(`Failed to list cached files: ${error.message}`);
      }

      return data?.map((file: any) => file.name) || [];

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      log.error(`Failed to list cached files: ${errorMessage}`, { 
        error,
        bucketName: this.bucketName,
        supabaseUrl: config.supabaseUrl
      });
      return [];
    }
  }

  /**
   * Clear all cache files (use with caution)
   */
  async clearAllCache(): Promise<void> {
    try {
      const files = await this.listCachedFiles();
      
      if (files.length === 0) {
        log.info('No cache files to clear');
        return;
      }

      const { error } = await this.client.storage
        .from(this.bucketName)
        .remove(files);

      if (error) {
        throw new Error(`Failed to clear all cache: ${error.message}`);
      }

      log.info(`Cleared ${files.length} cache files`);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      log.error(`Failed to clear all cache: ${errorMessage}`, { 
        error,
        bucketName: this.bucketName,
        supabaseUrl: config.supabaseUrl
      });
      throw error;
    }
  }

  /**
   * Get cache statistics
   */
  async getCacheStats(): Promise<{
    fileCount: number;
    totalSize: number;
    files: Array<{ name: string; size: number; createdAt: string }>;
  }> {
    try {
      const { data, error } = await this.client.storage
        .from(this.bucketName)
        .list('', {
          limit: 1000,
          sortBy: { column: 'created_at', order: 'desc' }
        });

      if (error) {
        throw new Error(`Failed to get cache stats: ${error.message}`);
      }

      const files = data || [];
      const totalSize = files.reduce((sum: number, file: any) => sum + (file.metadata?.size || 0), 0);

      return {
        fileCount: files.length,
        totalSize,
        files: files.map((file: any) => ({
          name: file.name,
          size: file.metadata?.size || 0,
          createdAt: file.created_at || ''
        }))
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      log.error(`Failed to get cache stats: ${errorMessage}`, { 
        error,
        bucketName: this.bucketName,
        supabaseUrl: config.supabaseUrl
      });
      return { fileCount: 0, totalSize: 0, files: [] };
    }
  }
} 