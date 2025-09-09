import * as crypto from 'crypto';
import { AxiosResponse, AxiosError } from 'axios';
import { HTTPRetriever } from '../services/httpRetriever';
import { IRemoteHTTPConnection } from '../types';
import { IToolCall, ToolCallResult, ToolDescription } from 'coralbricks-common';
import { log } from '../utils/logger';
import { QBProfile } from '../types/profiles';
import { QBHttpConnection } from './qbHttpConnection';
import { assert } from 'console';

export class QBDataSchemaRetriever extends HTTPRetriever implements IToolCall {
  private table_name: string;
  private qbo_profile: QBProfile;
  private thread_id: bigint;

  constructor(
    qbo_profile: QBProfile,
    thread_id: bigint,
    caller_id: string,
    table_name: string,
  ) {
    super(new QBHttpConnection(qbo_profile), caller_id);
    this.table_name = table_name;
    this.qbo_profile = qbo_profile;
    this.thread_id = thread_id;
  }

  async validate(): Promise<void> {
    assert(await this.qbo_profile.getValidAccessTokenWithRefresh() !== null, "Invalid access token");
    assert(this.table_name.length > 0, "Table name is required");
  }

  getModelHandleName(): string {
    throw new Error('Not implemented');
  }
  
  protected _get_base_url(): string {
    return `${this.qbo_profile.get_base_url()}${this._get_endpoint()}`;
  }

  protected _get_endpoint(): string {
    return "/query";
  }

  protected _get_params(): Record<string, any> {
    return {
      query: `SELECT * FROM ${this.table_name} MAXRESULTS 1`
    };
  }

  protected _to_json(response: AxiosResponse): [Record<string, any>, number] {
    const response_json = response.data;
    const queryResponseKey = this.extract_query_response_key();
    const queryResponse = response_json?.QueryResponse || {};
    const items = queryResponse[queryResponseKey] || [];
    
    return [response_json, items.length];
  }

  extract_query_response_key(): string {
    return this.table_name;
  }

  protected _cache_key(): string {
    return `qb_data_schema_retriever_${this.qbo_profile.cbId}_${this.table_name}`;
  }

  getBlobPath(): string {
    return this._cache_key();
  }
  
  api_summary(): string {
    return "Makes HTTP calls to retrieve data schema from Quickbooks";
  }

  async call_tool(): Promise<ToolCallResult> {
    await this.validate();
    const responses = await this.retrieve();
      
    if (responses.length === 0 || Object.keys(responses[0]?.QueryResponse || {}).length === 0) {
      return ToolCallResult.error(
        QBDataSchemaRetriever.tool_name(),
        this.caller_id,
        this.thread_id,
        "NoData",
        "No data found"
      );
    }

    return ToolCallResult.success(
      QBDataSchemaRetriever.tool_name(),
      responses[0],
      this.caller_id,
      this.thread_id
    );
  }

  static tool_name(): string {
    return "qb_data_schema_retriever";
  }

  static tool_description(): ToolDescription {
    return {
      type: "function",
      function: {
        name: QBDataSchemaRetriever.tool_name(),
        description: "Retrieve data schema from Quickbooks using Quickbooks HTTP platform API",
        parameters: {
          type: "object",
          properties: {
            table_name: {
              type: "string",
              description: "The name of the table to retrieve data schema for"
            }
          }
        }
      }
    };
  }
} 