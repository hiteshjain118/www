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
    thread_id: bigint,
    protected qboProfile: QBProfile,
  ) {
    super(thread_id);
  }

  public getToolInstance(
    tool_call_id: string,
    tool_name: string,
    tool_args: any,
  ): IToolCall {
    switch (tool_name) {
      case 'qb_data_size_retriever':
        if (!tool_args.query) {
          throw new Error('Missing required parameter for qb_data_size_retriever: query');
        }
        return new QBDataSizeRetriever(
          this.qboProfile,
          this.threadId,
          tool_call_id,
          tool_args.query
        );
        
      case 'qb_data_schema_retriever':
        if (!tool_args.table_name) {
          throw new Error('Missing required parameter for qb_data_schema_retriever: table_name');
        }
        return new QBDataSchemaRetriever(
          this.qboProfile,
          this.threadId,
          tool_call_id,
          tool_args.table_name
        );
        
      case 'qb_user_data_retriever':
        if (!tool_args.endpoint || !tool_args.parameters || tool_args.expected_row_count === undefined) {
          throw new Error('Missing required parameters for qb_user_data_retriever: endpoint, parameters, expected_row_count');
        }
        return new QBUserDataRetriever(
          this.qboProfile,
          this.threadId,
          tool_call_id,
          tool_args.endpoint,
          tool_args.parameters,
          tool_args.expected_row_count
        );
        
      default:
        throw new Error('Tool implementation not found');
    }
  }
} 
