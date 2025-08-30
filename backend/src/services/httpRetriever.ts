import crypto from 'crypto';
import axios, { AxiosResponse } from 'axios';
import { IRemoteHTTPConnection, IRetriever } from '../types';
import { enhancedLogger as log } from '../utils/logger';
import { SupabaseStorageService } from './supabaseStorage';

export abstract class HTTPRetriever implements IRetriever {
  protected connection: IRemoteHTTPConnection;
  protected enable_cache: boolean;
  protected page_size: number = 100;
  protected start_pos: number = 1;
  protected caller_id: string;
  protected storageService: SupabaseStorageService;
  
  constructor(
    connection: IRemoteHTTPConnection,
    caller_id: string
  ) {
    this.connection = connection;
    this.enable_cache = true;
    this.caller_id = caller_id;
    this.storageService = new SupabaseStorageService();
  }

  async try_cache(): Promise<any[] | null> {
    if (!this.enable_cache) {
      return null;
    }
    
    try {
      const cacheKey = this._cache_key();
      return await this.storageService.tryCache(cacheKey);
    } catch (error) {
      log.error('Error reading from cache:', { error, caller_id: this.caller_id });
      return null;
    }
  }

  async cache(responses: Record<string, any>[]): Promise<void> {
    if (!this.enable_cache || responses.length === 0) {
      return;
    }
    
    try {
      const cacheKey = this._cache_key();
      await this.storageService.cache(cacheKey, responses);
    } catch (error) {
      log.error('Error saving to cache:', { 
        error, 
        caller_id: this.caller_id,
        response_count: responses.length 
      });
      // Don't throw error - caching failure shouldn't break the main flow
    }
  }
  
  async retrieve(): Promise<any> {
    if (!await this.connection.authenticate()) {
      const error = `Access token is invalid. Please re-authenticate.`;
      log.error(error, { caller_id: this.caller_id });
      throw new Error(error);
    }

    let responses = await this.try_cache();
    if (responses === null) {
      responses = await this._call_api();
      await this.cache(responses);
    } else {
      log.info(`Retrieved ${responses.length} responses from cache for cache key ${this._cache_key()}`, { caller_id: this.caller_id });
    }

    return responses;
  }

  private async _call_api(): Promise<Record<string, any>[]> {
    const responses: Record<string, any>[] = [];
    
    while (true) {
      const [paginated_response, num_items] = await this._call_api_once();
      responses.push(paginated_response);
      
      if (num_items < this.page_size) {
        break;
      }
      this.start_pos += this.page_size;
    }

    return responses;
  }

  private async _call_api_once(): Promise<[Record<string, any>, number]> {
    const url = this._get_base_url();
    const params = this._get_params();
    
    try {
      const response = await axios.get(url, {
        headers: await this.connection.get_headers(),
        params: params
      });
      
      const [json_response, num_items] = this._to_json(response);

      log.info(
        `${this.api_summary()} call for key ${this._cache_key()} returned ${num_items} items` +
        ` url: ${url}` +
        ` params: ${JSON.stringify(params)}` +
        ` start_pos: ${this.start_pos}` +
        ` page_size: ${this.page_size} caller_id: ${this.caller_id}`
      );

      return [json_response, num_items];
    } catch (error) {
      log.error(`API call failed: ${error} caller_id: ${this.caller_id}` +
        ` url: ${url}` +
        ` params: ${JSON.stringify(params)}` +
        ` start_pos: ${this.start_pos}` +
        ` page_size: ${this.page_size}`
      );
      throw error;
    }
  }

  protected abstract _get_base_url(): string
  // Abstract methods that must be implemented by subclasses
  protected abstract _get_endpoint(): string;
  protected abstract _get_params(): Record<string, any>;
  protected abstract _to_json(response: AxiosResponse): [Record<string, any>, number];
  protected abstract _cache_key(): string;

  api_summary(): string {
    return "Base class to handle auth and batching logic for CB HTTP API";
  }
} 