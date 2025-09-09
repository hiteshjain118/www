import * as crypto from 'crypto';
import { AxiosResponse, AxiosError } from 'axios';
import { HTTPRetriever } from '../services/httpRetriever';
import { IRemoteHTTPConnection } from '../types';
import { IToolCall, ToolCallResult, ToolDescription } from 'coralbricks-common';
import { log } from '../utils/logger';
import { QBProfile } from '../types/profiles';
import { QBHttpConnection } from './qbHttpConnection';
import { assert } from 'console';

export class QBDataSizeRetriever extends HTTPRetriever implements IToolCall {
  private query: string;
  private qbo_profile: QBProfile;
  private thread_id: bigint;

  constructor(
    qbo_profile: QBProfile,
    thread_id: bigint,
    caller_id: string,
    query: string,
  ) {
    super(new QBHttpConnection(qbo_profile), caller_id);
    this.query = query;
    this.qbo_profile = qbo_profile;
    this.thread_id = thread_id;
  }

  async validate(): Promise<void> {
    assert(await this.qbo_profile.getValidAccessTokenWithRefresh() !== null); 
    assert(
        this.query.includes('COUNT(*)'), 
        "Query is invalid, should be like SELECT COUNT(*) FROM Bill WHERE TxnDate = '2025-01-01'"
    );
    if (this.query.includes('BETWEEN')) {
      throw new Error('BETWEEN clause is not supported');
    }
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
      query: this.query
    };
  }

  getBlobPath(): string {
    return this._cache_key();
  }

  protected _to_json(response: AxiosResponse): [Record<string, any>, number] {
    const response_json = response.data;
    const queryResponseKey = this.extract_query_response_key();
    const queryResponse = response_json?.QueryResponse || {};
    const items = queryResponse[queryResponseKey] || [];
    
    return [response_json, items.length];
  }

  extract_query_response_key(): string {
    // Find the position of FROM in the original query (case-insensitive)
    const from_index = this.query.toUpperCase().indexOf('FROM');
    if (from_index !== -1) {
      // Extract everything after FROM
      const from_part = this.query.slice(from_index + 4).trim();
      // Handle cases where there might be WHERE, ORDER BY, etc. after the table name
      const table_name = from_part.split(/\s+/)[0].trim();
      return table_name;
    }
    return "Unknown";
  }

  protected _cache_key(): string {
    const params_hash_6chars = crypto
      .createHash('sha256')
      .update(JSON.stringify(this.query))
      .digest('hex')
      .slice(0, 6);
    return `qb_data_size_retriever_${this.qbo_profile.cbId}_${this.extract_query_response_key()}_${params_hash_6chars}`;
  }

  api_summary(): string {
    return "Makes HTTP calls to retrieve number of rows in a query";
  }

  async call_tool(): Promise<ToolCallResult> {
    await this.validate();
    const responses = await this.retrieve();
      
    if (responses.length === 0 || Object.keys(responses[0]?.QueryResponse || {}).length === 0) {
    return ToolCallResult.error(
        QBDataSizeRetriever.tool_name(),
        this.caller_id,
        this.thread_id,
        "NoData",
        "No data found"
    );
    }

    return ToolCallResult.success(
    QBDataSizeRetriever.tool_name(),
    responses[0],
    this.caller_id,
    this.thread_id
    );
  }

  static tool_name(): string {
    return "qb_data_size_retriever";
  }

  static tool_description(): ToolDescription {
    return {
      type: "function",
      function: {
        name: QBDataSizeRetriever.tool_name(),
        description: "Retrieve number of rows in a query from Quickbooks using Quickbooks HTTP platform API",
        parameters: {
          type: "object",
          properties: {
            query: {
              type: "string",
              description: "The query to retrieve number of rows from Quickbooks"
            }
          }
        }
      }
    };
  }
} 