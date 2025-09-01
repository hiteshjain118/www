import { AxiosResponse } from 'axios';
import axios from 'axios';
import { HTTPRetriever } from '../../src/services/httpRetriever';
import { IRemoteHTTPConnection } from '../../src/types';
import { SupabaseStorageService } from '../../src/services/supabaseStorage';
import { log } from '../../src/utils/logger';

// Mock dependencies
jest.mock('axios');
jest.mock('../../src/services/supabaseStorage');
jest.mock('../../src/utils/logger', () => ({
  log: {
    error: jest.fn(),
    info: jest.fn(),
    debug: jest.fn()
  }
}));

const mockedAxios = axios as jest.Mocked<typeof axios>;
const MockedSupabaseStorageService = SupabaseStorageService as jest.MockedClass<typeof SupabaseStorageService>;

// Create a concrete implementation of HTTPRetriever for testing
class TestHTTPRetriever extends HTTPRetriever {
  private baseUrl: string;
  private endpoint: string;
  private testParams: Record<string, any>;

  constructor(
    connection: IRemoteHTTPConnection,
    caller_id: string,
    baseUrl: string = 'https://api.test.com',
    endpoint: string = '/test-endpoint',
    params: Record<string, any> = {}
  ) {
    super(connection, caller_id);
    this.baseUrl = baseUrl;
    this.endpoint = endpoint;
    this.testParams = params;
  }

  protected _get_base_url(): string {
    return `${this.baseUrl}${this.endpoint}`;
  }

  protected _get_endpoint(): string {
    return this.endpoint;
  }

  protected _get_params(): Record<string, any> {
    return {
      ...this.testParams,
      maxresults: this.page_size,
      startposition: this.start_pos
    };
  }

  protected _to_json(response: AxiosResponse): [Record<string, any>, number] {
    const data = response.data;
    const items = data.items || [];
    return [data, items.length];
  }

  protected _cache_key(): string {
    return `test_cache_key_${this.caller_id}`;
  }

  api_summary(): string {
    return 'Test HTTP Retriever';
  }
}

describe('HTTPRetriever', () => {
  let mockConnection: jest.Mocked<IRemoteHTTPConnection>;
  let mockStorageService: jest.Mocked<SupabaseStorageService>;
  let retriever: TestHTTPRetriever;
  
  const mockCallerId = 'test_caller_123';
  const mockCbid = BigInt(456);

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock connection
    mockConnection = {
      authenticate: jest.fn(),
      get_cbid: jest.fn().mockReturnValue(mockCbid),
      get_platform_name: jest.fn().mockReturnValue('TestPlatform'),
      get_remote_user: jest.fn(),
      get_headers: jest.fn().mockResolvedValue({
        'Authorization': 'Bearer test-token',
        'Content-Type': 'application/json'
      })
    };

    // Mock storage service
    mockStorageService = {
      tryCache: jest.fn(),
      cache: jest.fn(),
    } as any;

    MockedSupabaseStorageService.mockImplementation(() => mockStorageService);

    // Create retriever instance
    retriever = new TestHTTPRetriever(mockConnection, mockCallerId);

    // Mock console methods
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
    jest.spyOn(console, 'debug').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with correct properties', () => {
      expect(retriever).toBeDefined();
      expect(retriever).toBeInstanceOf(HTTPRetriever);
      expect(MockedSupabaseStorageService).toHaveBeenCalledTimes(1);
    });

    it('should set default values correctly', () => {
      // Access protected properties through type assertion for testing
      const retrieverAny = retriever as any;
      expect(retrieverAny.connection).toBe(mockConnection);
      expect(retrieverAny.enable_cache).toBe(true);
      expect(retrieverAny.page_size).toBe(100);
      expect(retrieverAny.start_pos).toBe(1);
      expect(retrieverAny.caller_id).toBe(mockCallerId);
    });
  });

  describe('try_cache', () => {
    it('should return cached data when cache is enabled and data exists', async () => {
      const cachedData = [{ id: 1, name: 'test' }];
      mockStorageService.tryCache.mockResolvedValue(cachedData);

      const result = await retriever.try_cache();

      expect(result).toEqual(cachedData);
      expect(mockStorageService.tryCache).toHaveBeenCalledWith('test_cache_key_test_caller_123');
    });

    it('should return null when cache is disabled', async () => {
      // Disable cache
      (retriever as any).enable_cache = false;

      const result = await retriever.try_cache();

      expect(result).toBeNull();
      expect(mockStorageService.tryCache).not.toHaveBeenCalled();
    });

    it('should return null and log error when cache throws error', async () => {
      const error = new Error('Cache error');
      mockStorageService.tryCache.mockRejectedValue(error);

      const result = await retriever.try_cache();

      expect(result).toBeNull();
      expect(log.error).toHaveBeenCalledWith('Error reading from cache:', {
        error,
        caller_id: mockCallerId
      });
    });
  });

  describe('cache', () => {
    it('should cache responses when cache is enabled and responses exist', async () => {
      const responses = [{ id: 1 }, { id: 2 }];
      mockStorageService.cache.mockResolvedValue(undefined);

      await retriever.cache(responses);

      expect(mockStorageService.cache).toHaveBeenCalledWith(
        'test_cache_key_test_caller_123',
        responses
      );
    });

    it('should not cache when cache is disabled', async () => {
      (retriever as any).enable_cache = false;
      const responses = [{ id: 1 }];

      await retriever.cache(responses);

      expect(mockStorageService.cache).not.toHaveBeenCalled();
    });

    it('should not cache when responses array is empty', async () => {
      const responses: Record<string, any>[] = [];

      await retriever.cache(responses);

      expect(mockStorageService.cache).not.toHaveBeenCalled();
    });

    it('should log error but not throw when caching fails', async () => {
      const responses = [{ id: 1 }];
      const error = new Error('Cache save error');
      mockStorageService.cache.mockRejectedValue(error);

      await expect(retriever.cache(responses)).resolves.not.toThrow();

      expect(log.error).toHaveBeenCalledWith('Error saving to cache:', {
        error,
        caller_id: mockCallerId,
        response_count: responses.length
      });
    });
  });

  describe('retrieve', () => {
    it('should return cached data when available', async () => {
      const cachedData = [{ id: 1, cached: true }];
      mockConnection.authenticate.mockResolvedValue('token');
      mockStorageService.tryCache.mockResolvedValue(cachedData);

      const result = await retriever.retrieve();

      expect(result).toEqual(cachedData);
      expect(mockConnection.authenticate).toHaveBeenCalled();
      expect(mockStorageService.tryCache).toHaveBeenCalled();
      expect(mockedAxios.get).not.toHaveBeenCalled();
      expect(log.info).toHaveBeenCalledWith(
        expect.stringContaining('Retrieved 1 responses from cache'),
        { caller_id: mockCallerId }
      );
    });

    it('should fetch from API and cache when no cached data', async () => {
      const apiData = [{ id: 1, api: true }];
      mockConnection.authenticate.mockResolvedValue('token');
      mockStorageService.tryCache.mockResolvedValue(null);
      mockStorageService.cache.mockResolvedValue(undefined);
      
      mockedAxios.get.mockResolvedValue({
        data: { items: [{ id: 1 }] }
      } as AxiosResponse);

      const result = await retriever.retrieve();

      expect(mockConnection.authenticate).toHaveBeenCalled();
      expect(mockStorageService.tryCache).toHaveBeenCalled();
      expect(mockedAxios.get).toHaveBeenCalled();
      expect(mockStorageService.cache).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should throw error when authentication fails', async () => {
      mockConnection.authenticate.mockResolvedValue('');

      await expect(retriever.retrieve()).rejects.toThrow(
        `Access token is invalid. Please re-authenticate.`
      );

      expect(log.error).toHaveBeenCalledWith(
        'Access token is invalid. Please re-authenticate.',
        { caller_id: mockCallerId }
      );
    });
  });

  describe('_call_api_once', () => {
    it('should make API call with correct parameters', async () => {
      const mockResponse = {
        data: { items: [{ id: 1 }, { id: 2 }] }
      } as AxiosResponse;
      
      mockedAxios.get.mockResolvedValue(mockResponse);

      const result = await (retriever as any)._call_api_once();

      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://api.test.com/test-endpoint',
        {
          headers: {
            'Authorization': 'Bearer test-token',
            'Content-Type': 'application/json'
          },
          params: {
            maxresults: 100,
            startposition: 1
          }
        }
      );

      expect(result).toEqual([{ items: [{ id: 1 }, { id: 2 }] }, 2]);
      expect(log.info).toHaveBeenCalledWith(
        expect.stringContaining('Test HTTP Retriever call for key test_cache_key_test_caller_123 returned 2 items'),
      );
    });

    it('should log and throw error when API call fails', async () => {
      const error = new Error('API Error');
      mockedAxios.get.mockRejectedValue(error);

      await expect((retriever as any)._call_api_once()).rejects.toThrow('API Error');

      expect(log.error).toHaveBeenCalledWith(
        expect.stringContaining('API call failed'),
      );
    });
  });

  describe('_call_api', () => {
    it('should handle single page response', async () => {
      const mockResponse = {
        data: { items: [{ id: 1 }] }
      } as AxiosResponse;
      
      mockedAxios.get.mockResolvedValue(mockResponse);

      const result = await (retriever as any)._call_api();

      expect(result).toHaveLength(1);
      expect(mockedAxios.get).toHaveBeenCalledTimes(1);
    });

    it('should handle multiple page responses', async () => {
      const page1Response = {
        data: { items: new Array(100).fill({ id: 1 }) }
      } as AxiosResponse;
      
      const page2Response = {
        data: { items: [{ id: 2 }] }
      } as AxiosResponse;
      
      mockedAxios.get
        .mockResolvedValueOnce(page1Response)
        .mockResolvedValueOnce(page2Response);

      const result = await (retriever as any)._call_api();

      expect(result).toHaveLength(2);
      expect(mockedAxios.get).toHaveBeenCalledTimes(2);
      
      // Check that start_pos was incremented for second call
      expect(mockedAxios.get).toHaveBeenNthCalledWith(2,
        'https://api.test.com/test-endpoint',
        {
          headers: expect.any(Object),
          params: expect.objectContaining({
            startposition: 101
          })
        }
      );
    });
  });

  describe('abstract method implementations', () => {
    it('should implement _get_base_url correctly', () => {
      expect((retriever as any)._get_base_url()).toBe('https://api.test.com/test-endpoint');
    });

    it('should implement _get_endpoint correctly', () => {
      expect((retriever as any)._get_endpoint()).toBe('/test-endpoint');
    });

    it('should implement _get_params correctly', () => {
      const params = (retriever as any)._get_params();
      expect(params).toEqual({
        maxresults: 100,
        startposition: 1
      });
    });

    it('should implement _cache_key correctly', () => {
      expect((retriever as any)._cache_key()).toBe('test_cache_key_test_caller_123');
    });

    it('should implement api_summary correctly', () => {
      expect(retriever.api_summary()).toBe('Test HTTP Retriever');
    });
  });

  describe('custom parameters', () => {
    it('should use custom base URL and endpoint', () => {
      const customRetriever = new TestHTTPRetriever(
        mockConnection,
        mockCallerId,
        'https://custom.api.com',
        '/custom-endpoint'
      );

      expect((customRetriever as any)._get_base_url()).toBe('https://custom.api.com/custom-endpoint');
    });

    it('should include custom parameters in API calls', () => {
      const customParams = { filter: 'active', sort: 'name' };
      const customRetriever = new TestHTTPRetriever(
        mockConnection,
        mockCallerId,
        'https://api.test.com',
        '/test-endpoint',
        customParams
      );

      const params = (customRetriever as any)._get_params();
      expect(params).toEqual({
        filter: 'active',
        sort: 'name',
        maxresults: 100,
        startposition: 1
      });
    });
  });

  describe('pagination', () => {
    it('should handle custom page size', async () => {
      (retriever as any).page_size = 50;
      
      const mockResponse = {
        data: { items: [{ id: 1 }] }
      } as AxiosResponse;
      
      mockedAxios.get.mockResolvedValue(mockResponse);

      await (retriever as any)._call_api_once();

      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          params: expect.objectContaining({
            maxresults: 50
          })
        })
      );
    });

    it('should update start position for pagination', async () => {
      (retriever as any).start_pos = 200;
      
      const mockResponse = {
        data: { items: [{ id: 1 }] }
      } as AxiosResponse;
      
      mockedAxios.get.mockResolvedValue(mockResponse);

      await (retriever as any)._call_api_once();

      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          params: expect.objectContaining({
            startposition: 200
          })
        })
      );
    });
  });
}); 