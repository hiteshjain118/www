import { ToolCallResult, IToolCall, ToolDescription } from '../../src/types/tool-call-result';

describe('ToolCallResult', () => {
  const mockThreadId = BigInt(123456789);
  const mockToolCallId = 'test-tool-call-123';
  const mockToolName = 'test_tool';

  describe('Constructor', () => {
    it('should create a success ToolCallResult with all required fields', () => {
      const content = { result: 'success', data: [1, 2, 3] };
      const result = new ToolCallResult(
        'success',
        mockToolName,
        mockToolCallId,
        mockThreadId,
        content
      );

      expect(result.status).toBe('success');
      expect(result.tool_name).toBe(mockToolName);
      expect(result.tool_call_id).toBe(mockToolCallId);
      expect(result.thread_id).toBe(mockThreadId);
      expect(result.content).toEqual(content);
      expect(result.error_type).toBeUndefined();
      expect(result.error_message).toBeUndefined();
      expect(result.status_code).toBeUndefined();
    });

    it('should create an error ToolCallResult with all required fields', () => {
      const errorType = 'ValidationError';
      const errorMessage = 'Invalid input parameters';
      const statusCode = 400;
      
      const result = new ToolCallResult(
        'error',
        mockToolName,
        mockToolCallId,
        mockThreadId,
        undefined,
        errorType,
        errorMessage,
        statusCode
      );

      expect(result.status).toBe('error');
      expect(result.tool_name).toBe(mockToolName);
      expect(result.tool_call_id).toBe(mockToolCallId);
      expect(result.thread_id).toBe(mockThreadId);
      expect(result.content).toBeUndefined();
      expect(result.error_type).toBe(errorType);
      expect(result.error_message).toBe(errorMessage);
      expect(result.status_code).toBe(statusCode);
    });
  });

  describe('Static Factory Methods', () => {
    describe('success', () => {
      it('should create a success ToolCallResult using static method', () => {
        const content = { message: 'Operation completed successfully' };
        const result = ToolCallResult.success(
          mockToolName,
          content,
          mockToolCallId,
          mockThreadId
        );

        expect(result.status).toBe('success');
        expect(result.tool_name).toBe(mockToolName);
        expect(result.content).toEqual(content);
        expect(result.tool_call_id).toBe(mockToolCallId);
        expect(result.thread_id).toBe(mockThreadId);
      });

      it('should handle null content', () => {
        const result = ToolCallResult.success(
          mockToolName,
          null,
          mockToolCallId,
          mockThreadId
        );

        expect(result.status).toBe('success');
        expect(result.content).toBeNull();
      });

      it('should handle undefined content', () => {
        const result = ToolCallResult.success(
          mockToolName,
          undefined,
          mockToolCallId,
          mockThreadId
        );

        expect(result.status).toBe('success');
        expect(result.content).toBeUndefined();
      });
    });

    describe('error', () => {
      it('should create an error ToolCallResult using static method', () => {
        const errorType = 'NetworkError';
        const errorMessage = 'Connection timeout';
        const statusCode = 500;

        const result = ToolCallResult.error(
          mockToolName,
          mockToolCallId,
          mockThreadId,
          errorType,
          errorMessage,
          statusCode
        );

        expect(result.status).toBe('error');
        expect(result.tool_name).toBe(mockToolName);
        expect(result.tool_call_id).toBe(mockToolCallId);
        expect(result.thread_id).toBe(mockThreadId);
        expect(result.error_type).toBe(errorType);
        expect(result.error_message).toBe(errorMessage);
        expect(result.status_code).toBe(statusCode);
        expect(result.content).toBeUndefined();
      });

      it('should create error without status code', () => {
        const result = ToolCallResult.error(
          mockToolName,
          mockToolCallId,
          mockThreadId,
          'ValidationError',
          'Invalid input'
        );

        expect(result.status).toBe('error');
        expect(result.status_code).toBeUndefined();
      });
    });

    describe('scheduled', () => {
      it('should create a scheduled ToolCallResult', () => {
        const modelHandleName = 'scheduled-job-handle';
        const scheduledTaskId = BigInt(987654321);

        const result = ToolCallResult.scheduled(
          mockToolName,
          mockToolCallId,
          mockThreadId,
          modelHandleName,
          scheduledTaskId
        );

        expect(result.status).toBe('scheduled');
        expect(result.tool_name).toBe(mockToolName);
        expect(result.model_handle_name).toBe(modelHandleName);
        expect(result.scheduled_task_id).toBe(scheduledTaskId);
        expect(result.tool_call_id).toBe(mockToolCallId);
        expect(result.thread_id).toBe(mockThreadId);
      });
    });
  });

  describe('as_api_response', () => {
    it('should return correct dictionary for success result', () => {
      const content = { data: 'test data', count: 42 };
      const result = new ToolCallResult(
        'success',
        mockToolName,
        mockToolCallId,
        mockThreadId,
        content
      );

      const dict = result.as_api_response();

      expect(dict).toEqual({
        status: 'success',
        tool_name: mockToolName,
        tool_call_id: mockToolCallId,
        thread_id: mockThreadId,
        content: content
      });
    });

    it('should return correct dictionary for error result', () => {
      const result = new ToolCallResult(
        'error',
        mockToolName,
        mockToolCallId,
        mockThreadId,
        undefined,
        'ValidationError',
        'Invalid input',
        400
      );

      const dict = result.as_api_response();

      expect(dict).toEqual({
        status: 'error',
        tool_name: mockToolName,
        tool_call_id: mockToolCallId,
        thread_id: mockThreadId,
        content: undefined,
        error_type: 'ValidationError',
        error_message: 'Invalid input',
        status_code: 400
      });
    });
  });

  describe('to_dict_w_truncated_content_for_logging', () => {
    it('should truncate long content for success result', () => {
      const longContent = 'A'.repeat(150);
      const result = new ToolCallResult(
        'success',
        mockToolName,
        mockToolCallId,
        mockThreadId,
        longContent
      );

      const dict = result.to_dict_w_truncated_content_for_logging();

      expect(dict.content).toBe('A'.repeat(100) + '...');
    });

    it('should not truncate short content', () => {
      const shortContent = 'Short content';
      const result = new ToolCallResult(
        'success',
        mockToolName,
        mockToolCallId,
        mockThreadId,
        shortContent
      );

      const dict = result.to_dict_w_truncated_content_for_logging();

      expect(dict.content).toBe(shortContent);
    });

    it('should handle null content', () => {
      const result = new ToolCallResult(
        'success',
        mockToolName,
        mockToolCallId,
        mockThreadId,
        null
      );

      const dict = result.to_dict_w_truncated_content_for_logging();

      expect(dict.content).toBeUndefined();
    });

    it('should handle undefined content', () => {
      const result = new ToolCallResult(
        'success',
        mockToolName,
        mockToolCallId,
        mockThreadId,
        undefined
      );

      const dict = result.to_dict_w_truncated_content_for_logging();

      expect(dict.content).toBeUndefined();
    });
  });

  describe('as_api_response_json', () => {
    it('should serialize success result to JSON', () => {
      const content = { data: [1, 2, 3] };
      const result = new ToolCallResult(
        'success',
        mockToolName,
        mockToolCallId,
        mockThreadId,
        content
      );

      const json = result.as_api_response_json();
      const parsed = JSON.parse(json);

      expect(parsed.status).toBe('success');
      expect(parsed.tool_name).toBe(mockToolName);
      expect(parsed.tool_call_id).toBe(mockToolCallId);
      expect(parsed.thread_id).toBe(mockThreadId.toString()); // BigInt should be converted to string
      expect(parsed.content).toEqual({data: [1, 2, 3]});
    });

    it('should serialize error result to JSON', () => {
      const result = new ToolCallResult(
        'error',
        mockToolName,
        mockToolCallId,
        mockThreadId,
        undefined,
        'NetworkError',
        'Connection failed',
        500
      );

      const json = result.as_api_response_json();
      const parsed = JSON.parse(json);

      expect(parsed.status).toBe('error');
      expect(parsed.tool_name).toBe(mockToolName);
      expect(parsed.tool_call_id).toBe(mockToolCallId);
      expect(parsed.thread_id).toBe(mockThreadId.toString());
      expect(parsed.error_type).toBe('NetworkError');
      expect(parsed.error_message).toBe('Connection failed');
      expect(parsed.status_code).toBe(500);
    });

    it('should handle BigInt values in content', () => {
      const contentWithBigInt = {
        id: BigInt(123456789),
        count: 42,
        nested: {
          bigValue: BigInt(987654321)
        }
      };

      const result = new ToolCallResult(
        'success',
        mockToolName,
        mockToolCallId,
        mockThreadId,
        contentWithBigInt
      );

      const json = result.as_api_response_json();
      const parsed = JSON.parse(json);

      expect(parsed.thread_id).toBe(mockThreadId.toString());
      expect(parsed.content.id).toBe('123456789');
      expect(parsed.content.count).toBe(42);
      expect(parsed.content.nested.bigValue).toBe('987654321');
    });
  });

  describe('toLoggableString', () => {
    it('should return loggable string for success result', () => {
      const content = { message: 'Operation successful' };
      const result = new ToolCallResult(
        'success',
        mockToolName,
        mockToolCallId,
        mockThreadId,
        content
      );

      const logString = result.toLoggableString();
      const parsed = JSON.parse(logString);

      expect(parsed.status).toBe('success');
      expect(parsed.thread_id).toBe(mockThreadId.toString());
      expect(parsed.content).toEqual(content);
    });

    it('should return loggable string for error result', () => {
      const result = new ToolCallResult(
        'error',
        mockToolName,
        mockToolCallId,
        mockThreadId,
        undefined,
        'ValidationError',
        'Invalid input',
        400
      );

      const logString = result.toLoggableString();
      const parsed = JSON.parse(logString);

      expect(parsed.status).toBe('error');
      expect(parsed.thread_id).toBe(mockThreadId.toString());
      expect(parsed.error_type).toBe('ValidationError');
      expect(parsed.error_message).toBe('Invalid input');
      expect(parsed.status_code).toBe(400);
    });
  });

  describe('toLogMessage', () => {
    it('should return compact log message for success result', () => {
      const result = new ToolCallResult(
        'success',
        mockToolName,
        mockToolCallId,
        mockThreadId,
        'Some content'
      );

      const logMessage = result.toLogMessage();

      expect(logMessage).toContain('SUCCESS');
      expect(logMessage).toContain(mockToolName);
      expect(logMessage).toContain(mockToolCallId);
      expect(logMessage).toContain(mockThreadId.toString());
      expect(logMessage).toContain('Content: Available');
    });

    it('should return compact log message for error result', () => {
      const result = new ToolCallResult(
        'error',
        mockToolName,
        mockToolCallId,
        mockThreadId,
        undefined,
        'NetworkError',
        'Connection failed'
      );

      const logMessage = result.toLogMessage();

      expect(logMessage).toContain('ERROR');
      expect(logMessage).toContain(mockToolName);
      expect(logMessage).toContain(mockToolCallId);
      expect(logMessage).toContain(mockThreadId.toString());
      expect(logMessage).toContain('NetworkError');
      expect(logMessage).toContain('Connection failed');
    });

    it('should handle null content in log message', () => {
      const result = new ToolCallResult(
        'success',
        mockToolName,
        mockToolCallId,
        mockThreadId,
        null
      );

      const logMessage = result.toLogMessage();

      expect(logMessage).toContain('Content: None');
    });
  });

  describe('from_api_response', () => {
    it('should create success ToolCallResult from dictionary', () => {
      const dict = {
        status: 'success',
        tool_name: mockToolName,
        tool_call_id: mockToolCallId,
        thread_id: mockThreadId,
        content: { data: 'test' }
      };

      const result = ToolCallResult.from_api_response(dict);

      expect(result.status).toBe('success');
      expect(result.tool_name).toBe(mockToolName);
      expect(result.tool_call_id).toBe(mockToolCallId);
      expect(result.thread_id).toBe(mockThreadId);
      expect(result.content).toEqual({ data: 'test' });
    });

    it('should create error ToolCallResult from dictionary', () => {
      const dict = {
        status: 'error',
        tool_name: mockToolName,
        tool_call_id: mockToolCallId,
        thread_id: mockThreadId,
        content: undefined,
        error_type: 'ValidationError',
        error_message: 'Invalid input',
        status_code: 400
      };

      const result = ToolCallResult.from_api_response(dict);

      expect(result.status).toBe('error');
      expect(result.tool_name).toBe(mockToolName);
      expect(result.tool_call_id).toBe(mockToolCallId);
      expect(result.thread_id).toBe(mockThreadId);
      expect(result.error_type).toBe('ValidationError');
      expect(result.error_message).toBe('Invalid input');
      expect(result.status_code).toBe(400);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle empty string content', () => {
      const result = new ToolCallResult(
        'success',
        mockToolName,
        mockToolCallId,
        mockThreadId,
        ''
      );

      expect(result.content).toBe('');
      expect(result.as_api_response().content).toBe('');
    });

    it('should handle zero BigInt thread_id', () => {
      const zeroThreadId = BigInt(0);
      const result = new ToolCallResult(
        'success',
        mockToolName,
        mockToolCallId,
        zeroThreadId,
        'content'
      );

      expect(result.thread_id).toBe(zeroThreadId);
      expect(result.as_api_response_json()).toContain('"thread_id":"0"');
    });

    it('should handle very large BigInt thread_id', () => {
      const largeThreadId = BigInt('9223372036854775807'); // Max safe BigInt
      const result = new ToolCallResult(
        'success',
        mockToolName,
        mockToolCallId,
        largeThreadId,
        'content'
      );

      expect(result.thread_id).toBe(largeThreadId);
      expect(result.as_api_response_json()).toContain('"thread_id":"9223372036854775807"');
    });

    it('should handle complex nested objects with BigInt', () => {
      const complexContent = {
        users: [
          { id: BigInt(1), name: 'Alice' },
          { id: BigInt(2), name: 'Bob' }
        ],
        metadata: {
          total: BigInt(100),
          page: 1,
          nested: {
            count: BigInt(50)
          }
        }
      };

      const result = new ToolCallResult(
        'success',
        mockToolName,
        mockToolCallId,
        mockThreadId,
        complexContent
      );

      const json = result.as_api_response_json();
      const parsed = JSON.parse(json);

      expect(parsed.content.users[0].id).toBe('1');
      expect(parsed.content.users[1].id).toBe('2');
      expect(parsed.content.metadata.total).toBe('100');
      expect(parsed.content.metadata.nested.count).toBe('50');
    });
  });

  describe('as_cc_tc_response', () => {
    it('should return correct response for success result', () => {
      const content = { data: 'test data', count: 42, nested: { value: 'test' } };
      const result = new ToolCallResult(
        'success',
        mockToolName,
        mockToolCallId,
        mockThreadId,
        content
      );

      const response = result.as_cc_tc_response();

      expect(response).toEqual({
        data: 'test data',
        count: 42,
        nested: { value: 'test' },
        status: 'success'
      });
    });

    it('should return correct response for error result', () => {
      const result = new ToolCallResult(
        'error',
        mockToolName,
        mockToolCallId,
        mockThreadId,
        undefined,
        'ValidationError',
        'Invalid input',
        400
      );

      const response = result.as_cc_tc_response();

      expect(response).toEqual({
        status: 'error',
        error_type: 'ValidationError',
        error_message: 'Invalid input',
        status_code: 400
      });
    });

    it('should handle null content in success result', () => {
      const result = new ToolCallResult(
        'success',
        mockToolName,
        mockToolCallId,
        mockThreadId,
        null
      );

      const response = result.as_cc_tc_response();

      expect(response).toEqual({
        
        status: 'success'
      });
    });

    it('should handle undefined content in success result', () => {
      const result = new ToolCallResult(
        'success',
        mockToolName,
        mockToolCallId,
        mockThreadId,
        undefined
      );

      const response = result.as_cc_tc_response();

      expect(response).toEqual({
        status: 'success'
      });
    });

    it('should handle empty object content', () => {
      const result = new ToolCallResult(
        'success',
        mockToolName,
        mockToolCallId,
        mockThreadId,
        {}
      );

      const response = result.as_cc_tc_response();

      expect(response).toEqual({
        status: 'success'
      });
    });

    it('should handle array content', () => {
      const content = [1, 2, 3, { nested: 'value' }];
      const result = new ToolCallResult(
        'success',
        mockToolName,
        mockToolCallId,
        mockThreadId,
        content
      );

      const response = result.as_cc_tc_response();

      expect(response).toEqual({
        0: 1,
        1: 2,
        2: 3,
        3: { nested: 'value' },
        status: 'success'
      });
    });

    it('should handle error without status code', () => {
      const result = new ToolCallResult(
        'error',
        mockToolName,
        mockToolCallId,
        mockThreadId,
        undefined,
        'NetworkError',
        'Connection failed'
      );

      const response = result.as_cc_tc_response();

      expect(response).toEqual({
        status: 'error',
        error_type: 'NetworkError',
        error_message: 'Connection failed',
        status_code: undefined
      });
    });
  });

  describe('as_cc_tc_response_json', () => {
    it('should serialize success result to JSON', () => {
      const content = { data: [1, 2, 3], message: 'Success' };
      const result = new ToolCallResult(
        'success',
        mockToolName,
        mockToolCallId,
        mockThreadId,
        content
      );

      const json = result.as_cc_tc_response_json();
      const parsed = JSON.parse(json);

      expect(parsed).toEqual({
        data: [1, 2, 3],
        message: 'Success',
        status: 'success'
      });
    });
    
    it('should serialize scheduled result to JSON', () => {
      const modelHandleName = 'scheduled-job-handle';
      const scheduledTaskId = BigInt(987654321);
      const result = ToolCallResult.scheduled(
        mockToolName,
        mockToolCallId,
        mockThreadId,
        modelHandleName,
        scheduledTaskId
      );

      const json = result.as_cc_tc_response_json();
      const parsed = JSON.parse(json);

      expect(parsed).toEqual({
        status: 'scheduled',
        handle: modelHandleName,
      });
      expect(result.scheduled_task_id).toBe(scheduledTaskId);
      expect(result.model_handle_name).toBe(modelHandleName);
    });

    it('should serialize error result to JSON', () => {
      const result = new ToolCallResult(
        'error',
        mockToolName,
        mockToolCallId,
        mockThreadId,
        undefined,
        'ValidationError',
        'Invalid input',
        400
      );

      const json = result.as_cc_tc_response_json();
      const parsed = JSON.parse(json);

      expect(parsed).toEqual({
        status: 'error',
        error_type: 'ValidationError',
        error_message: 'Invalid input',
        status_code: 400
      });
    });

    it('should handle BigInt values in content', () => {
      const contentWithBigInt = {
        id: BigInt(123456789),
        count: 42,
        nested: {
          bigValue: BigInt(987654321)
        }
      };

      const result = new ToolCallResult(
        'success',
        mockToolName,
        mockToolCallId,
        mockThreadId,
        contentWithBigInt
      );

      const json = result.as_cc_tc_response_json();
      const parsed = JSON.parse(json);

      expect(parsed.id).toBe('123456789');
      expect(parsed.count).toBe(42);
      expect(parsed.nested.bigValue).toBe('987654321');
      expect(parsed.status).toBe('success');
    });

    it('should handle null content in JSON', () => {
      const result = new ToolCallResult(
        'success',
        mockToolName,
        mockToolCallId,
        mockThreadId,
        null
      );

      const json = result.as_cc_tc_response_json();
      const parsed = JSON.parse(json);

      expect(parsed).toEqual({
        
        status: 'success'
      });
    });

    it('should handle undefined content in JSON', () => {
      const result = new ToolCallResult(
        'success',
        mockToolName,
        mockToolCallId,
        mockThreadId,
        undefined
      );

      const json = result.as_cc_tc_response_json();
      const parsed = JSON.parse(json);

      expect(parsed).toEqual({
        status: 'success'
      });
    });

    it('should handle complex nested objects with BigInt', () => {
      const complexContent = {
        users: [
          { id: BigInt(1), name: 'Alice' },
          { id: BigInt(2), name: 'Bob' }
        ],
        metadata: {
          total: BigInt(100),
          page: 1,
          nested: {
            count: BigInt(50)
          }
        }
      };

      const result = new ToolCallResult(
        'success',
        mockToolName,
        mockToolCallId,
        mockThreadId,
        complexContent
      );

      const json = result.as_cc_tc_response_json();
      const parsed = JSON.parse(json);

      expect(parsed.users[0].id).toBe('1');
      expect(parsed.users[1].id).toBe('2');
      expect(parsed.metadata.total).toBe('100');
      expect(parsed.metadata.nested.count).toBe('50');
      expect(parsed.status).toBe('success');
    });

    it('should handle error with null status code', () => {
      const result = new ToolCallResult(
        'error',
        mockToolName,
        mockToolCallId,
        mockThreadId,
        undefined,
        'ServerError',
        'Internal server error',
        null
      );

      const json = result.as_cc_tc_response_json();
      const parsed = JSON.parse(json);

      expect(parsed).toEqual({
        status: 'error',
        error_type: 'ServerError',
        error_message: 'Internal server error',
        status_code: null
      });
    });
  });

});

describe('ToolDescription Interface', () => {
  it('should have correct structure', () => {
    const toolDescription: ToolDescription = {
      type: 'function',
      function: {
        name: 'test_function',
        description: 'A test function',
        parameters: {
          type: 'object',
          properties: {
            param1: { type: 'string' },
            param2: { type: 'number' }
          }
        }
      }
    };

    expect(toolDescription.type).toBe('function');
    expect(toolDescription.function.name).toBe('test_function');
    expect(toolDescription.function.description).toBe('A test function');
    expect(toolDescription.function.parameters.type).toBe('object');
    expect(toolDescription.function.parameters.properties.param1.type).toBe('string');
    expect(toolDescription.function.parameters.properties.param2.type).toBe('number');
  });
}); 