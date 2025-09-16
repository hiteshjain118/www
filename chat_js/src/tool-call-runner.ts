import { 
  ToolCallResult,
  QueryType,
  contextLogger,
} from 'coralbricks-common';
import { ChatCompletionMessageCustomToolCall, ChatCompletionMessageToolCall } from 'openai/resources/chat/completions';
import axios from 'axios';
import { PrismaService, Task } from 'coralbricks-common';
import { TCWrapperExecutor, TypeScriptExecutor } from './tcWrapperExecutor';

export class ToolCallRunner {
  private threadId: bigint;
  private cbProfileId: bigint;
  private internalApiUrl: string;
  private enabledTools: string[];
  private enabledToolDescriptions: Array<{
    type: "function";
    function: {
      name: string;
      description: string;
      parameters: {
        type: string;
        properties: Record<string, any>;
        required: string[];
      };
    };
  }>;
  private retrievalTasksScheduled: bigint[] = [];
  private tcWrapperExecutor: TCWrapperExecutor;
  public logger: any;
  constructor(thread_id: bigint, cb_profile_id: bigint) {
    this.threadId = thread_id;
    this.cbProfileId = cb_profile_id;
    this.internalApiUrl = process.env.INTERNAL_API_URL || 'http://localhost:3001';
    this.enabledTools = [];
    this.enabledToolDescriptions = [];
    this.tcWrapperExecutor = new TCWrapperExecutor(this.threadId);
    this.logger = contextLogger(this.threadId, this.cbProfileId);
  }

  async run_tools(toolCalls: ChatCompletionMessageToolCall[] | ChatCompletionMessageCustomToolCall[]): Promise<Record<string, ToolCallResult>> {
    const tool_calls: Record<string, ToolCallResult> = {};
    
    // Create an array of promises for parallel execution
    const toolCallPromises = toolCalls.map(async (tool_call) => {
      // Handle both standard and custom tool calls
      if (tool_call.type === 'function' && 'function' in tool_call) {
        const result = await this.run_tool(tool_call.id, tool_call.function.name, tool_call.function.arguments);
        return { id: tool_call.id, result };
      }
      // Return error for invalid tool calls instead of null
      const errorResult = ToolCallResult.error(
        'unknown_tool',
        tool_call.id,
        this.threadId,
        "InvalidToolType",
        `Tool call type ${tool_call.type} is not supported`
      );
      return { id: tool_call.id, result: errorResult };
    });

    // Wait for all tool calls to complete
    const results = await Promise.all(toolCallPromises);
    
    // Populate the results object
    results.forEach(item => {
      tool_calls[item.id] = item.result;
    });
    
    return tool_calls;
  }

  // use direct types of toolCall.id, toolCall.function.name, toolCall.function.arguments
  async run_tool(
    tool_call_id: string, 
    tool_name: string, 
    tool_arguments: string,
  ): Promise<ToolCallResult> {
    let result: ToolCallResult;
   const start_time = Date.now();
    try {
      const tool_arguments_json = JSON.parse(tool_arguments);      
      if (tool_name === 'typescript_executor') {
        result = await this.run_typescript_executor(tool_call_id, tool_name, tool_arguments_json);
      } else if (['qb_data_schema_retriever', 'qb_data_size_retriever'].includes(tool_name)) {
        result = await this.callInternalAPI(tool_name, tool_call_id, tool_arguments_json, "retrieve");
      } else if(tool_name === 'qb_user_data_retriever') {
        result = await this.callInternalAPI(tool_name, tool_call_id, tool_arguments_json, "schedule");
        this.retrievalTasksScheduled.push(result.scheduled_task_id as bigint);
      } else {
        throw new Error(`Tool ${tool_name} not found`);
      }
    } catch (error) {
      result = ToolCallResult.error(
        tool_name,
        tool_call_id,
        this.threadId,
        error instanceof Error ? error.constructor.name : "ToolCallError",
        error instanceof Error ? error.message : String(error)
      );
      const error_message = error instanceof Error ? error.message : String(error);
      const stack_trace = error instanceof Error ? error.stack || error.message : String(error);
      this.logger.error(`Tool ${tool_call_id} failed with error ${error_message} stack ${stack_trace}`);
    }
    const duration_ms = Date.now() - start_time;
    this.logger.info(`Tool ID:${tool_call_id} name:${tool_name} took ${duration_ms}ms`);
    
    return result;
  }

  /**
   * Call the internal backend API for QB tools
   */
  public async callInternalAPI(
    tool_name: string, 
    tool_call_id: string, 
    tool_arguments: Record<string, any>,
    query_type: "retrieve" | "schedule" = "retrieve"
  ): Promise<ToolCallResult> {
      const requestBody = {
        cbid: this.cbProfileId.toString(),
        thread_id: this.threadId.toString(),
        tool_call_id: tool_call_id,
        query_type: query_type,
        ...tool_arguments
      };

      this.logger.info(`Running tool call id:${tool_call_id} name:${tool_name} with arguments ${JSON.stringify(tool_arguments)} for thread ${this.threadId}`);
      
      const response = await axios.post(`${this.internalApiUrl}/${tool_name}`, requestBody, {
        headers: {
          'Content-Type': 'application/json',
          'X-Internal-Service': 'chat_js'
        },
        timeout: 30000 // 30 second timeout
      }).then((response) => {
        this.logger.info(`Tool call ${tool_name} returned response ${`status: ${response.status}, data: ${JSON.stringify(response.data)}`}`);
        return ToolCallResult.from_api_response(response.data);
      }).catch((error) => {
        const error_response = error.response;
        this.logger.error(`Tool call ${tool_name} returned error ${`status: ${error_response.status}, data: ${JSON.stringify(error_response.data)}`}`);
        return ToolCallResult.from_api_response(error_response.data);
      });
      return response;
  
  }

  private async run_typescript_executor(tool_call_id: string, tool_name: string, tool_arguments: Record<string, any>): Promise<ToolCallResult> {
    await this.tcWrapperExecutor.waitForDependencies(this.retrievalTasksScheduled);
    return await this.tcWrapperExecutor.wrap(tool_call_id, tool_arguments, tool_name, QueryType.RETRIEVE, 0);
  }

  async get_enabled_tools(): Promise<string[]> {
    if (this.enabledTools.length > 0) {
      return this.enabledTools;
    }
    
    const enabledToolDescriptions = await this.get_enabled_tool_descriptions();
    this.enabledTools = enabledToolDescriptions.map((tool) => tool.function.name);
    return this.enabledTools;
  }
  
  async get_enabled_tool_descriptions(): Promise<Array<{
    type: "function";
    function: {
      name: string;
      description: string;
      parameters: {
        type: string;
        properties: Record<string, any>;
        required: string[];
      };
    };
  }>> {
    if (this.enabledToolDescriptions.length > 0) {
      return this.enabledToolDescriptions;
    }
    
    const response = await axios.get(`${this.internalApiUrl}/tools?cbid=${this.cbProfileId}`, {
      headers: {
        'X-Internal-Service': 'chat_js'
      },
      timeout: 10000
    });

    if (response.data.success && response.data.tools) {
      // Backend now returns proper OpenAI tool format
      const backendTools = response.data.tools;
      
      // Cache the tool descriptions
      this.enabledToolDescriptions = [...backendTools, TypeScriptExecutor.tool_description()];
      return this.enabledToolDescriptions;
    }

    throw new Error('Failed to fetch tools from internal API, chat_js not available');
  }
} 