    describe('schedule query type', () => {
      it('should call validate, create task, and return success with handle', async () => {
        const wrapper = new ToolCallWrapper(
          mockThreadId,
          mockToolCallId,
          'qb_data_size_retriever',
          { query: 'test query' },
          mockQBOProfile,
          QueryType.SCHEDULE,
          100 // scheduled_delay_ms
        );

        const mockResult = ToolCallResult.success('qb_data_size_retriever', { count: 100 }, mockToolCallId, mockThreadId);
        const mockToolInstance = {
          validate: jest.fn().mockResolvedValue(undefined),
          call_tool: jest.fn().mockResolvedValue(mockResult)
        };

        const mockTask = {
          cbId: 'task-123',
          handleForModel: 'test_tool_call_123qb_data_size_retriever'
        };

        // Mock TaskService
        const mockTaskService = {
          getInstance: jest.fn().mockReturnValue({
            createTask: jest.fn().mockResolvedValue(mockTask),
            updateTaskStatus: jest.fn().mockResolvedValue(undefined)
          })
        };

        // Mock TaskService import
        jest.doMock('coralbricks-common', () => ({
          ...jest.requireActual('coralbricks-common'),
          TaskService: mockTaskService
        }));

        MockedQBDataSizeRetriever.mockImplementation(() => mockToolInstance as any);

        const result = await wrapper.wrap();

        expect(mockToolInstance.validate).toHaveBeenCalled();
        expect(mockTaskService.getInstance().createTask).toHaveBeenCalledWith({
          threadId: mockThreadId,
          toolCallId: mockToolCallId,
          toolCallName: 'qb_data_size_retriever',
          toolCallArgs: { query: 'test query' },
          handleForModel: 'test_tool_call_123qb_data_size_retriever'
        });
        expect(result.status).toBe('success');
        expect(result.tool_name).toBe('qb_data_size_retriever');
        expect(result.tool_call_id).toBe(mockToolCallId);
        expect(result.thread_id).toBe(mockThreadId);
        expect(result.content).toEqual({
          handle_name: 'test_tool_call_123qb_data_size_retriever'
        });
      });

      it('should handle validation error during schedule', async () => {
        const wrapper = new ToolCallWrapper(
          mockThreadId,
          mockToolCallId,
          'qb_data_schema_retriever',
          { table_name: 'test_table' },
          mockQBOProfile,
          QueryType.SCHEDULE
        );

        const validationError = new Error('Validation failed');
        const mockToolInstance = {
          validate: jest.fn().mockRejectedValue(validationError)
        };

        MockedQBDataSchemaRetriever.mockImplementation(() => mockToolInstance as any);

        const result = await wrapper.wrap();

        expect(mockToolInstance.validate).toHaveBeenCalled();
        expect(result.status).toBe('error');
        expect(result.error_type).toBe('Error');
        expect(result.error_message).toBe('Validation failed');
      });

      it('should handle task creation error during schedule', async () => {
        const wrapper = new ToolCallWrapper(
          mockThreadId,
          mockToolCallId,
          'qb_user_data_retriever',
          { endpoint: 'test', parameters: {}, expected_row_count: 10 },
          mockQBOProfile,
          QueryType.SCHEDULE
        );

        const mockToolInstance = {
          validate: jest.fn().mockResolvedValue(undefined)
        };

        const taskCreationError = new Error('Task creation failed');
        const mockTaskService = {
          getInstance: jest.fn().mockReturnValue({
            createTask: jest.fn().mockRejectedValue(taskCreationError)
          })
        };

        jest.doMock('coralbricks-common', () => ({
          ...jest.requireActual('coralbricks-common'),
          TaskService: mockTaskService
        }));

        MockedQBUserDataRetriever.mockImplementation(() => mockToolInstance as any);

        const result = await wrapper.wrap();

        expect(mockToolInstance.validate).toHaveBeenCalled();
        expect(result.status).toBe('error');
        expect(result.error_type).toBe('Error');
        expect(result.error_message).toBe('Task creation failed');
      });

      it('should schedule background execution with setTimeout', async () => {
        jest.useFakeTimers();
        
        const wrapper = new ToolCallWrapper(
          mockThreadId,
          mockToolCallId,
          'qb_data_size_retriever',
          { query: 'test query' },
          mockQBOProfile,
          QueryType.SCHEDULE,
          1000 // 1 second delay
        );

        const mockResult = ToolCallResult.success('qb_data_size_retriever', { count: 100 }, mockToolCallId, mockThreadId);
        const mockToolInstance = {
          validate: jest.fn().mockResolvedValue(undefined),
          call_tool: jest.fn().mockResolvedValue(mockResult)
        };

        const mockTask = {
          cbId: 'task-123',
          handleForModel: 'test_tool_call_123qb_data_size_retriever'
        };

        const mockTaskService = {
          getInstance: jest.fn().mockReturnValue({
            createTask: jest.fn().mockResolvedValue(mockTask),
            updateTaskStatus: jest.fn().mockResolvedValue(undefined)
          })
        };

        jest.doMock('coralbricks-common', () => ({
          ...jest.requireActual('coralbricks-common'),
          TaskService: mockTaskService
        }));

        MockedQBDataSizeRetriever.mockImplementation(() => mockToolInstance as any);

        const result = await wrapper.wrap();

        // Verify initial result
        expect(result.status).toBe('success');
        expect(mockToolInstance.call_tool).not.toHaveBeenCalled();

        // Fast-forward time to trigger setTimeout
        jest.advanceTimersByTime(1000);

        // Wait for async operations
        await new Promise(resolve => setImmediate(resolve));

        // Verify background execution
        expect(mockToolInstance.call_tool).toHaveBeenCalled();
        expect(mockTaskService.getInstance().updateTaskStatus).toHaveBeenCalledWith('task-123', 'COMPLETED');

        jest.useRealTimers();
      });

      it('should handle background execution error and update task status to FAILED', async () => {
        jest.useFakeTimers();
        
        const wrapper = new ToolCallWrapper(
          mockThreadId,
          mockToolCallId,
          'qb_data_size_retriever',
          { query: 'test query' },
          mockQBOProfile,
          QueryType.SCHEDULE,
          500
        );

        const backgroundError = new Error('Background execution failed');
        const mockToolInstance = {
          validate: jest.fn().mockResolvedValue(undefined),
          call_tool: jest.fn().mockRejectedValue(backgroundError)
        };

        const mockTask = {
          cbId: 'task-456',
          handleForModel: 'test_tool_call_123qb_data_size_retriever'
        };

        const mockTaskService = {
          getInstance: jest.fn().mockReturnValue({
            createTask: jest.fn().mockResolvedValue(mockTask),
            updateTaskStatus: jest.fn().mockResolvedValue(undefined)
          })
        };

        jest.doMock('coralbricks-common', () => ({
          ...jest.requireActual('coralbricks-common'),
          TaskService: mockTaskService
        }));

        MockedQBDataSizeRetriever.mockImplementation(() => mockToolInstance as any);

        const result = await wrapper.wrap();

        // Verify initial result
        expect(result.status).toBe('success');

        // Fast-forward time to trigger setTimeout
        jest.advanceTimersByTime(500);

        // Wait for async operations
        await new Promise(resolve => setImmediate(resolve));

        // Verify error handling
        expect(mockToolInstance.call_tool).toHaveBeenCalled();
        expect(mockTaskService.getInstance().updateTaskStatus).toHaveBeenCalledWith('task-456', 'FAILED');
        expect(log.error).toHaveBeenCalledWith(
          expect.stringContaining('Error executing tool qb_data_size_retriever in task task-456')
        );

        jest.useRealTimers();
      });

      it('should use default scheduled_delay_ms when not provided', async () => {
        const wrapper = new ToolCallWrapper(
          mockThreadId,
          mockToolCallId,
          'qb_data_size_retriever',
          { query: 'test query' },
          mockQBOProfile,
          QueryType.SCHEDULE
          // No scheduled_delay_ms provided, should use default of 1
        );

        const mockResult = ToolCallResult.success('qb_data_size_retriever', { count: 100 }, mockToolCallId, mockThreadId);
        const mockToolInstance = {
          validate: jest.fn().mockResolvedValue(undefined),
          call_tool: jest.fn().mockResolvedValue(mockResult)
        };

        const mockTask = {
          cbId: 'task-default',
          handleForModel: 'test_tool_call_123qb_data_size_retriever'
        };

        const mockTaskService = {
          getInstance: jest.fn().mockReturnValue({
            createTask: jest.fn().mockResolvedValue(mockTask),
            updateTaskStatus: jest.fn().mockResolvedValue(undefined)
          })
        };

        jest.doMock('coralbricks-common', () => ({
          ...jest.requireActual('coralbricks-common'),
          TaskService: mockTaskService
        }));

        MockedQBDataSizeRetriever.mockImplementation(() => mockToolInstance as any);

        const result = await wrapper.wrap();

        expect(result.status).toBe('success');
        expect(mockTaskService.getInstance().createTask).toHaveBeenCalled();
      });
    });

