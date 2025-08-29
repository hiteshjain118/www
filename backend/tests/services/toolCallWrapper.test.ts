import { Response } from 'express';
import { AxiosError } from 'axios';
import { IToolCall, ToolCallResult } from 'coralbricks-common';
import { ToolCallWrapper, TOOL_REGISTRY } from '../../src/services/toolCallWrapper';
import { QBOProfile } from '../../src/types/profiles';
import { QBDataSchemaRetriever } from '../../src/qbo/qbDataSchemaRetriever';
import { QBDataSizeRetriever } from '../../src/qbo/qbDataSizeRetriever';
import { QBUserDataRetriever } from '../../src/qbo/qbUserDataRetriever';
import { log } from '../../src/utils/logger';

// Mock dependencies
jest.mock('../../src/qbo/qbDataSchemaRetriever');
jest.mock('../../src/qbo/qbDataSizeRetriever');
jest.mock('../../src/qbo/qbUserDataRetriever');
jest.mock('../../src/utils/logger', () => ({
  log: {
    error: jest.fn(),
    info: jest.fn(),
    debug: jest.fn()
  }
}));

const MockedQBDataSchemaRetriever = QBDataSchemaRetriever as jest.MockedClass<typeof QBDataSchemaRetriever>;
const MockedQBDataSizeRetriever = QBDataSizeRetriever as jest.MockedClass<typeof QBDataSizeRetriever>;
const MockedQBUserDataRetriever = QBUserDataRetriever as jest.MockedClass<typeof QBUserDataRetriever>;

describe('ToolCallWrapper', () => {
  let mockResponse: jest.Mocked<Response>;
  let mockQBOProfile: jest.Mocked<QBOProfile>;
  let wrapper: ToolCallWrapper;
  
  const mockThreadId = BigInt(123);
  const mockToolCallId = 'test_tool_call_123';
  const mockCallerId = 'test_caller_456';

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock Express Response
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    } as any;

    // Mock QBOProfile
    mockQBOProfile = {
      cbId: BigInt(789),
      ownerId: BigInt(456),
      realmId: 'test_realm_123',
      accessToken: 'test_access_token',
      get_base_url: jest.fn().mockReturnValue('https://test.api.url'),
    } as any;

    // Setup static methods for tool descriptions
    MockedQBDataSchemaRetriever.tool_description = jest.fn().mockReturnValue('QB Data Schema Retriever');
    MockedQBDataSizeRetriever.tool_description = jest.fn().mockReturnValue('QB Data Size Retriever');
    MockedQBUserDataRetriever.tool_description = jest.fn().mockReturnValue('QB User Data Retriever');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('TOOL_REGISTRY', () => {
    it('should contain all expected tools', () => {
      expect(TOOL_REGISTRY).toHaveProperty('qb_data_size_retriever');
      expect(TOOL_REGISTRY).toHaveProperty('qb_data_schema_retriever');
      expect(TOOL_REGISTRY).toHaveProperty('qb_user_data_retriever');
    });

    it('should have tool descriptions available', () => {
      // Since the modules are mocked, the TOOL_REGISTRY will have the mocked descriptions
      expect(TOOL_REGISTRY).toHaveProperty('qb_data_schema_retriever');
      expect(TOOL_REGISTRY).toHaveProperty('qb_data_size_retriever');
      expect(TOOL_REGISTRY).toHaveProperty('qb_user_data_retriever');
    });
  });

  describe('constructor', () => {
    it('should initialize with correct properties', () => {
      const wrapper = new ToolCallWrapper(
        mockThreadId,
        mockToolCallId,
        'qb_data_size_retriever',
        { query: 'test query' },
        mockQBOProfile,
        'retrieve'
      );

      expect(wrapper).toBeDefined();
      expect(wrapper).toBeInstanceOf(ToolCallWrapper);
    });
  });

  describe('run method', () => {
    it('should return 400 error when threadId is missing', async () => {
      const wrapper = new ToolCallWrapper(
        null as any,
        mockToolCallId,
        'qb_data_size_retriever',
        { query: 'test' },
        mockQBOProfile,
        'retrieve'
      );

      await wrapper.run(mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'error',
          tool_name: 'qb_data_size_retriever',
          tool_call_id: mockToolCallId,
          content: expect.objectContaining({
            error_type: 'MissingRequiredParameter',
            error_message: 'Missing required parameter: thread_id, tool_call_id, tool_name'
          })
        })
      );
    });

    it('should return 400 error when toolCallId is missing', async () => {
      const wrapper = new ToolCallWrapper(
        mockThreadId,
        null as any,
        'qb_data_size_retriever',
        { query: 'test' },
        mockQBOProfile,
        'retrieve'
      );

      await wrapper.run(mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'error',
          tool_name: 'qb_data_size_retriever',
          content: expect.objectContaining({
            error_type: 'MissingRequiredParameter',
            error_message: 'Missing required parameter: thread_id, tool_call_id, tool_name'
          })
        })
      );
    });

    it('should return 400 error when tool_name is missing', async () => {
      const wrapper = new ToolCallWrapper(
        mockThreadId,
        mockToolCallId,
        null as any,
        { query: 'test' },
        mockQBOProfile,
        'retrieve'
      );

      await wrapper.run(mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'error',
          content: expect.objectContaining({
            error_type: 'MissingRequiredParameter',
            error_message: 'Missing required parameter: thread_id, tool_call_id, tool_name'
          })
        })
      );
    });

    it('should return 404 error when tool does not exist', async () => {
      const wrapper = new ToolCallWrapper(
        mockThreadId,
        mockToolCallId,
        'nonexistent_tool',
        { query: 'test' },
        mockQBOProfile,
        'retrieve'
      );

      await wrapper.run(mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'error',
          tool_name: 'nonexistent_tool',
          tool_call_id: mockToolCallId,
          content: expect.objectContaining({
            error_type: 'ToolNotFound',
            error_message: 'Tool not found'
          })
        })
      );
    });

    it('should call wrap method and respond with 200 for success', async () => {
      const wrapper = new ToolCallWrapper(
        mockThreadId,
        mockToolCallId,
        'qb_data_size_retriever',
        { query: 'test' },
        mockQBOProfile,
        'retrieve'
      );

      const mockResult = ToolCallResult.success('qb_data_size_retriever', { count: 100 }, mockToolCallId, mockThreadId);
      const mockToolInstance = {
        call_tool: jest.fn().mockResolvedValue(mockResult)
      };
      
      MockedQBDataSizeRetriever.mockImplementation(() => mockToolInstance as any);

      await wrapper.run(mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockToolInstance.call_tool).toHaveBeenCalled();
      expect(mockResponse.json).toHaveBeenCalledWith(mockResult.to_dict());
    });

    it('should respond with 500 for error ToolCallResult', async () => {
      const wrapper = new ToolCallWrapper(
        mockThreadId,
        mockToolCallId,
        'qb_data_size_retriever',
        { query: 'test' },
        mockQBOProfile,
        'retrieve'
      );

      const mockToolInstance = {
        call_tool: jest.fn().mockRejectedValue(new Error('Tool execution failed'))
      };
      
      MockedQBDataSizeRetriever.mockImplementation(() => mockToolInstance as any);

      await wrapper.run(mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'error',
          tool_name: 'qb_data_size_retriever',
          content: expect.objectContaining({
            error_type: 'Error',
            error_message: 'Tool execution failed'
          })
        })
      );
    });
  });

  describe('wrap method', () => {
    describe('retrieve query type', () => {
      it('should call tool and return ToolCallResult', async () => {
        const wrapper = new ToolCallWrapper(
          mockThreadId,
          mockToolCallId,
          'qb_data_size_retriever',
          { query: 'test' },
          mockQBOProfile,
          'retrieve'
        );

        const mockResult = ToolCallResult.success('qb_data_size_retriever', { count: 150 }, mockToolCallId, mockThreadId);
        const mockToolInstance = {
          call_tool: jest.fn().mockResolvedValue(mockResult)
        };

        MockedQBDataSizeRetriever.mockImplementation(() => mockToolInstance as any);

        const result = await wrapper.wrap();

        expect(mockToolInstance.call_tool).toHaveBeenCalled();
        expect(result).toBe(mockResult);
        expect(result.status).toBe('success');
      });
    });

    describe('validate query type', () => {
      it('should call validate and return success ToolCallResult with empty content', async () => {
        const wrapper = new ToolCallWrapper(
          mockThreadId,
          mockToolCallId,
          'qb_data_schema_retriever',
          { table_name: 'test_table' },
          mockQBOProfile,
          'validate'
        );

        const mockToolInstance = {
          validate: jest.fn().mockResolvedValue(undefined)
        };

        MockedQBDataSchemaRetriever.mockImplementation(() => mockToolInstance as any);

        const result = await wrapper.wrap();

        expect(mockToolInstance.validate).toHaveBeenCalled();
        expect(result.status).toBe('success');
        expect(result.tool_name).toBe('qb_data_schema_retriever');
        expect(result.tool_call_id).toBe(mockToolCallId);
        expect(result.thread_id).toBe(mockThreadId);
        expect(result.content).toEqual({});
      });
    });

    describe('error handling', () => {
      it('should handle AxiosError and return error ToolCallResult', async () => {
        const wrapper = new ToolCallWrapper(
          mockThreadId,
          mockToolCallId,
          'qb_data_size_retriever',
          { query: 'test' },
          mockQBOProfile,
          'retrieve'
        );

        const axiosError = new AxiosError('Network error');
        axiosError.response = { status: 500 } as any;

        const mockToolInstance = {
          call_tool: jest.fn().mockRejectedValue(axiosError)
        };

        MockedQBDataSizeRetriever.mockImplementation(() => mockToolInstance as any);

        const result = await wrapper.wrap();

        expect(log.error).toHaveBeenCalledWith(
          expect.stringContaining('HTTP error while executing tool qb_data_size_retriever')
        );
        expect(log.debug).toHaveBeenCalledWith(
          expect.stringContaining('Detailed error info')
        );
        expect(result.status).toBe('error');
        expect(result.tool_name).toBe('qb_data_size_retriever');
        expect(result.error_type).toBe('AxiosError');
        expect(result.error_message).toBe('Network error');
        expect(result.status_code).toBe(500);
      });

      it('should handle generic Error and return error ToolCallResult', async () => {
        const wrapper = new ToolCallWrapper(
          mockThreadId,
          mockToolCallId,
          'qb_data_size_retriever',
          { query: 'test' },
          mockQBOProfile,
          'retrieve'
        );

        const genericError = new Error('Something went wrong');

        const mockToolInstance = {
          call_tool: jest.fn().mockRejectedValue(genericError)
        };

        MockedQBDataSizeRetriever.mockImplementation(() => mockToolInstance as any);

        const result = await wrapper.wrap();

        expect(log.error).toHaveBeenCalledWith(
          expect.stringContaining('Error executing tool qb_data_size_retriever')
        );
        expect(log.debug).toHaveBeenCalledWith(
          expect.stringContaining('Detailed error info')
        );
        expect(result.status).toBe('error');
        expect(result.tool_name).toBe('qb_data_size_retriever');
        expect(result.error_type).toBe('Error');
        expect(result.error_message).toBe('Something went wrong');
      });

      it('should handle unknown error types and return error ToolCallResult', async () => {
        const wrapper = new ToolCallWrapper(
          mockThreadId,
          mockToolCallId,
          'qb_data_size_retriever',
          { query: 'test' },
          mockQBOProfile,
          'retrieve'
        );

        const unknownError = 'string error';

        const mockToolInstance = {
          call_tool: jest.fn().mockRejectedValue(unknownError)
        };

        MockedQBDataSizeRetriever.mockImplementation(() => mockToolInstance as any);

        const result = await wrapper.wrap();

        expect(log.error).toHaveBeenCalledWith(
          expect.stringContaining('Error executing tool qb_data_size_retriever')
        );
        expect(result.status).toBe('error');
        expect(result.tool_name).toBe('qb_data_size_retriever');
        expect(result.error_type).toBe('UnknownError');
        expect(result.error_message).toBe('Unknown error');
      });
    });
  });

  describe('get_tool_instance method', () => {
    describe('qb_data_size_retriever', () => {
      it('should create QBDataSizeRetriever instance with correct parameters', () => {
        const wrapper = new ToolCallWrapper(
          mockThreadId,
          mockToolCallId,
          'qb_data_size_retriever',
          { query: 'test query' },
          mockQBOProfile,
          'retrieve'
        );

        const instance = wrapper.get_tool_instance();

        expect(MockedQBDataSizeRetriever).toHaveBeenCalledWith(
          mockQBOProfile,
          mockThreadId,
          mockToolCallId,
          'test query'
        );
      });

      it('should throw error when query parameter is missing', () => {
        const wrapper = new ToolCallWrapper(
          mockThreadId,
          mockToolCallId,
          'qb_data_size_retriever',
          {},
          mockQBOProfile,
          'retrieve'
        );

        expect(() => wrapper.get_tool_instance()).toThrow(
          'Missing required parameter for qb_data_size_retriever: query'
        );
      });
    });

    describe('qb_data_schema_retriever', () => {
      it('should create QBDataSchemaRetriever instance with correct parameters', () => {
        const wrapper = new ToolCallWrapper(
          mockThreadId,
          mockToolCallId,
          'qb_data_schema_retriever',
          { table_name: 'test_table' },
          mockQBOProfile,
          'retrieve'
        );

        const instance = wrapper.get_tool_instance();

        expect(MockedQBDataSchemaRetriever).toHaveBeenCalledWith(
          mockQBOProfile,
          mockThreadId,
          mockToolCallId,
          'test_table'
        );
      });

      it('should throw error when table_name parameter is missing', () => {
        const wrapper = new ToolCallWrapper(
          mockThreadId,
          mockToolCallId,
          'qb_data_schema_retriever',
          {},
          mockQBOProfile,
          'retrieve'
        );

        expect(() => wrapper.get_tool_instance()).toThrow(
          'Missing required parameter for qb_data_schema_retriever: table_name'
        );
      });
    });

    describe('qb_user_data_retriever', () => {
      it('should create QBUserDataRetriever instance with correct parameters', () => {
        const wrapper = new ToolCallWrapper(
          mockThreadId,
          mockToolCallId,
          'qb_user_data_retriever',
          { 
            endpoint: 'test_endpoint',
            parameters: { key: 'value' },
            expected_row_count: 10
          },
          mockQBOProfile,
          'retrieve'
        );

        const instance = wrapper.get_tool_instance();

        expect(MockedQBUserDataRetriever).toHaveBeenCalledWith(
          mockQBOProfile,
          mockThreadId,
          mockToolCallId,
          'test_endpoint',
          { key: 'value' },
          10
        );
      });

      it('should throw error when endpoint parameter is missing', () => {
        const wrapper = new ToolCallWrapper(
          mockThreadId,
          mockToolCallId,
          'qb_user_data_retriever',
          { 
            parameters: { key: 'value' },
            expected_row_count: 10
          },
          mockQBOProfile,
          'retrieve'
        );

        expect(() => wrapper.get_tool_instance()).toThrow(
          'Missing required parameters for qb_user_data_retriever: endpoint, parameters, expected_row_count'
        );
      });

      it('should throw error when parameters parameter is missing', () => {
        const wrapper = new ToolCallWrapper(
          mockThreadId,
          mockToolCallId,
          'qb_user_data_retriever',
          { 
            endpoint: 'test_endpoint',
            expected_row_count: 10
          },
          mockQBOProfile,
          'retrieve'
        );

        expect(() => wrapper.get_tool_instance()).toThrow(
          'Missing required parameters for qb_user_data_retriever: endpoint, parameters, expected_row_count'
        );
      });

      it('should throw error when expected_row_count parameter is missing', () => {
        const wrapper = new ToolCallWrapper(
          mockThreadId,
          mockToolCallId,
          'qb_user_data_retriever',
          { 
            endpoint: 'test_endpoint',
            parameters: { key: 'value' }
          },
          mockQBOProfile,
          'retrieve'
        );

        expect(() => wrapper.get_tool_instance()).toThrow(
          'Missing required parameters for qb_user_data_retriever: endpoint, parameters, expected_row_count'
        );
      });

      it('should handle expected_row_count being 0', () => {
        const wrapper = new ToolCallWrapper(
          mockThreadId,
          mockToolCallId,
          'qb_user_data_retriever',
          { 
            endpoint: 'test_endpoint',
            parameters: { key: 'value' },
            expected_row_count: 0
          },
          mockQBOProfile,
          'retrieve'
        );

        const instance = wrapper.get_tool_instance();

        expect(MockedQBUserDataRetriever).toHaveBeenCalledWith(
          mockQBOProfile,
          mockThreadId,
          mockToolCallId,
          'test_endpoint',
          { key: 'value' },
          0
        );
      });
    });

    it('should throw error for unknown tool name', () => {
      const wrapper = new ToolCallWrapper(
        mockThreadId,
        mockToolCallId,
        'unknown_tool' as any,
        {},
        mockQBOProfile,
        'retrieve'
      );

      expect(() => wrapper.get_tool_instance()).toThrow(
        'Tool implementation not found'
      );
    });
  });

  describe('integration tests', () => {
    it('should handle complete flow for qb_data_size_retriever', async () => {
      const mockResult = ToolCallResult.success(
        'qb_data_size_retriever', 
        { count: 150 }, 
        mockToolCallId, 
        mockThreadId
      );

      const mockToolInstance = {
        call_tool: jest.fn().mockResolvedValue(mockResult)
      };

      MockedQBDataSizeRetriever.mockImplementation(() => mockToolInstance as any);

      const wrapper = new ToolCallWrapper(
        mockThreadId,
        mockToolCallId,
        'qb_data_size_retriever',
        { query: 'SELECT COUNT(*) FROM customers' },
        mockQBOProfile,
        'retrieve'
      );

      await wrapper.run(mockResponse);

      expect(MockedQBDataSizeRetriever).toHaveBeenCalledWith(
        mockQBOProfile,
        mockThreadId,
        mockToolCallId,
        'SELECT COUNT(*) FROM customers'
      );
      expect(mockToolInstance.call_tool).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(mockResult.to_dict());
    });

    it('should handle complete validation flow', async () => {
      const mockToolInstance = {
        validate: jest.fn().mockResolvedValue(undefined)
      };

      MockedQBDataSchemaRetriever.mockImplementation(() => mockToolInstance as any);

      const wrapper = new ToolCallWrapper(
        mockThreadId,
        mockToolCallId,
        'qb_data_schema_retriever',
        { table_name: 'customers' },
        mockQBOProfile,
        'validate'
      );

      await wrapper.run(mockResponse);

      expect(MockedQBDataSchemaRetriever).toHaveBeenCalledWith(
        mockQBOProfile,
        mockThreadId,
        mockToolCallId,
        'customers'
      );
      expect(mockToolInstance.validate).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'success',
          tool_name: 'qb_data_schema_retriever',
          tool_call_id: mockToolCallId,
          content: {}
        })
      );
    });
  });
}); 