import { AxiosError } from "axios";
import { IToolCall, TaskService, TaskStatus, ToolCallResult } from "coralbricks-common";
import { enhancedLogger as log } from "../utils/logger";
import { Response } from "express";
import { QBProfile } from "../types/profiles";
import { QBDataSchemaRetriever } from "../qbo/qbDataSchemaRetriever";
import { QBDataSizeRetriever } from "../qbo/qbDataSizeRetriever";
import { QBUserDataRetriever } from "../qbo/qbUserDataRetriever";

// Tool registry - maps tool names to their string identifiers
export const TOOL_REGISTRY = {
  'qb_data_size_retriever': QBDataSizeRetriever.tool_description(),
  'qb_data_schema_retriever': QBDataSchemaRetriever.tool_description(),
  'qb_user_data_retriever': QBUserDataRetriever.tool_description()
} as const;

export enum QueryType {
  RETRIEVE = "retrieve",
  SCHEDULE = "schedule",
  VALIDATE = "validate"
}

export class ToolCallWrapper {
  constructor(
    private threadId: bigint, 
    private toolCallId: string, 
    private tool_name: string,
    private toolArgs: any,
    private qboProfile: QBProfile,
    private query_type: QueryType,
    private scheduled_delay_ms: number = 1  
  ) {}

  async run(res: Response): Promise<void> {
    // Validate required parameters
    if (!this.threadId || !this.toolCallId || !this.tool_name) {
      res.status(400).json(
        ToolCallResult.error(
          this.tool_name,
          this.toolCallId,
          this.threadId,
          "MissingRequiredParameter",
          "Missing required parameter: thread_id, tool_call_id, tool_name"
        ).as_api_response()
      );
      return;
    }

    // Validate tool exists
    if (!(this.tool_name in TOOL_REGISTRY)) {
      res.status(404).json(
        ToolCallResult.error(
          this.tool_name,
          this.toolCallId,
          this.threadId,
          "ToolNotFound",
          "Tool not found"
        ).as_api_response()
      );
      return;
    }

    const tool_call_result = await this.wrap();
    const status = tool_call_result.status === 'success' ? 200 : 500;
    res.status(status).json(tool_call_result.as_api_response());
  }

  async wrap(): Promise<ToolCallResult> {
    let tool_call_result: ToolCallResult;
    try {
      const tool_instance = this.get_tool_instance();
      
      if (this.query_type === QueryType.VALIDATE) {
        await tool_instance.validate();
        tool_call_result = ToolCallResult.success(this.tool_name, {}, this.toolCallId, this.threadId);
      } else if (this.query_type === QueryType.SCHEDULE) {
        await tool_instance.validate();
        const task = await TaskService.getInstance().createTask({
          threadId: this.threadId,
          toolCallId: this.toolCallId,
          toolCallName: this.tool_name,
          toolCallArgs: this.toolArgs,
          handleForModel: this.toolCallId + '_' + this.tool_name,
        });
        tool_call_result = ToolCallResult.scheduled(this.tool_name, this.toolCallId, this.threadId, task.handleForModel, task.cbId);
        // schedule to run tool in background 
        setTimeout(async () => {
          try {
            tool_call_result = await tool_instance.call_tool();
            await TaskService.getInstance().updateTaskStatus(task.cbId, TaskStatus.COMPLETED);
          } catch (error) {
            await TaskService.getInstance().updateTaskStatus(task.cbId, TaskStatus.FAILED);
            log.error(`Error executing tool ${this.tool_name} in task ${task.cbId}, threadId: ${this.threadId}, toolCallId: ${this.toolCallId}, error: ${error}`);
          }
        }, this.scheduled_delay_ms);
      } else if (this.query_type === QueryType.RETRIEVE) {
        tool_call_result = await tool_instance.call_tool();
      } else {
        throw new Error("Invalid query type");
      }
    } catch (error) {
      if (error instanceof AxiosError) {
        tool_call_result = ToolCallResult.error(
          this.tool_name,
          this.toolCallId,
          this.threadId,
          error.constructor.name,
          error.message,
          error.response?.status
        );
        log.error(`HTTP error while executing tool ${this.tool_name}: ${tool_call_result.toLogMessage()}`);
        log.debug(`Detailed error info: ${tool_call_result.toLoggableString()}`);
      } else {
        tool_call_result = ToolCallResult.error(
          this.tool_name,
          this.toolCallId,
          this.threadId,
          error instanceof Error ? error.constructor.name : 'UnknownError',
          error instanceof Error ? error.message : 'Unknown error'
        );
        log.error(`Error executing tool ${this.tool_name}: ${tool_call_result.toLogMessage()}`);
        log.debug(`Detailed error info: ${tool_call_result.toLoggableString()}`);
      }
    }
    return tool_call_result;
  }

  get_tool_instance(): IToolCall {
    switch (this.tool_name) {
      case 'qb_data_size_retriever':
        if (!this.toolArgs.query) {
          throw new Error('Missing required parameter for qb_data_size_retriever: query');
        }
        return new QBDataSizeRetriever(
          this.qboProfile,
          this.threadId,
          this.toolCallId,
          this.toolArgs.query
        );
        
      case 'qb_data_schema_retriever':
        if (!this.toolArgs.table_name) {
          throw new Error('Missing required parameter for qb_data_schema_retriever: table_name');
        }
        return new QBDataSchemaRetriever(
          this.qboProfile,
          this.threadId,
          this.toolCallId,
          this.toolArgs.table_name
        );
        
      case 'qb_user_data_retriever':
        if (!this.toolArgs.endpoint || !this.toolArgs.parameters || this.toolArgs.expected_row_count === undefined) {
          throw new Error('Missing required parameters for qb_user_data_retriever: endpoint, parameters, expected_row_count');
        }
        return new QBUserDataRetriever(
          this.qboProfile,
          this.threadId,
          this.toolCallId,
          this.toolArgs.endpoint,
          this.toolArgs.parameters,
          this.toolArgs.expected_row_count
        );
        
      default:
        throw new Error('Tool implementation not found');
    }
  }
} 