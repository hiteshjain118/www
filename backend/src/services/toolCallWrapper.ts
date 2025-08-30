import { AxiosError } from "axios";
import { IToolCall, ToolCallResult } from "coralbricks-common";
import { log } from "../utils/logger";
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

export class ToolCallWrapper {
  constructor(
    private threadId: bigint, 
    private toolCallId: string, 
    private tool_name: string,
    private toolArgs: any,
    private qboProfile: QBProfile,
    private query_type: string
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
        ).to_dict()
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
        ).to_dict()
      );
      return;
    }

    const tool_call_result = await this.wrap();
    const status = tool_call_result.status === 'success' ? 200 : 500;
    res.status(status).json(tool_call_result.to_dict());
  }

  async wrap(): Promise<ToolCallResult> {
    let tool_call_result: ToolCallResult;
    try {
      const tool_instance = this.get_tool_instance();
      
      if (this.query_type === "retrieve") {
        tool_call_result = await tool_instance.call_tool();
      } else {
        await tool_instance.validate();
        tool_call_result = ToolCallResult.success(this.tool_name, {}, this.toolCallId, this.threadId);
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