import { AxiosError } from "axios";
import { IToolCall, TaskService, TaskStatus, ToolCallResult, QueryType, ToolCallWrapper } from "coralbricks-common";
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

// Export the concrete implementation class and types
export { TCWrapperBackend };
export { QueryType };

class TCWrapperBackend extends ToolCallWrapper {
  constructor(
    threadId: bigint,
    toolCallId: string,
    tool_name: string,
    toolArgs: any,
    protected qboProfile: QBProfile,
    query_type: QueryType,
    scheduled_delay_ms: number = 1,
    depends_on_task_ids: bigint[] = []
  ) {
    super(threadId, toolCallId, tool_name, toolArgs, query_type, scheduled_delay_ms, depends_on_task_ids);
  }

  public get_tool_instance(): IToolCall {
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
