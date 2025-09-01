import * as crypto from 'crypto';
import { AxiosResponse, AxiosError } from 'axios';
import { HTTPRetriever } from '../services/httpRetriever';
import { IRemoteHTTPConnection } from '../types';
import { IToolCall, ToolCallResult, ToolDescription } from 'coralbricks-common';
import { log } from '../utils/logger';
import { QBProfile } from '../types/profiles';
import { QBHttpConnection } from './qbHttpConnection';

export class QBUserDataRetriever extends HTTPRetriever implements IToolCall {
  private endpoint: string;
  private params: Record<string, any>;
  private expected_row_count: number;
  private qbo_profile: QBProfile;
  private thread_id: bigint;

  constructor(
    qbo_profile: QBProfile,
    thread_id: bigint,
    caller_id: string,
    endpoint: string,
    params: Record<string, any>,
    expected_row_count: number,
  ) {
    super(new QBHttpConnection(qbo_profile), caller_id);
    this.endpoint = endpoint;
    this.params = params;
    this.expected_row_count = expected_row_count;
    this.qbo_profile = qbo_profile;
    this.thread_id = thread_id;
  }

  async validate(): Promise<void> {
    const query = this.params?.query?.toUpperCase() || '';
    
    if (!query.includes('SELECT *')) {
      throw new Error('Please select all columns by doing SELECT *');
    }
    
    if (!query.includes('ORDER BY')) {
      throw new Error('ORDER BY clause is missing');
    }
    
    if (this.expected_row_count === null || this.expected_row_count === undefined || this.expected_row_count < 0) {
      throw new Error('Expected row count must be provided and greater than or equal to 0');
    }
    
    if (this.expected_row_count > 1000) {
      throw new Error('Expected row count must be less than 1000');
    }
  }

  protected _get_base_url(): string {
    return `${this.qbo_profile.get_base_url()}${this._get_endpoint()}`;
  }

  protected _get_endpoint(): string {
    // Ensure endpoint starts with a forward slash for proper URL construction
    if (!this.endpoint.startsWith('/')) {
      return `/${this.endpoint}`;
    }
    return this.endpoint;
  }

  protected _get_params(): Record<string, any> {
    return {
      query: `${this.params.query} STARTPOSITION ${this.start_pos} MAXRESULTS ${this.page_size}`
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
    const query = this.params?.query || '';
    
    // Find the position of FROM in the original query (case-insensitive)
    const from_index = query.toUpperCase().indexOf('FROM');
    if (from_index !== -1) {
      // Extract everything after FROM
      const from_part = query.slice(from_index + 4).trim();
      // Handle cases where there might be WHERE, ORDER BY, etc. after the table name
      const table_name = from_part.split(/\s+/)[0].trim();
      return table_name;
    }
    return "Unknown";
  }

  getBlobPath(): string {
    return this._cache_key();
  }
  
  protected _cache_key(): string {
    const params_hash_6chars = crypto
      .createHash('sha256')
      .update(JSON.stringify(this.params))
      .digest('hex')
      .slice(0, 6);
    return `qb_user_data_retriever_${this.endpoint}_${this.extract_query_response_key()}_${params_hash_6chars}`;
  }

  api_summary(): string {
    return "Makes QB HTTP calls using endpoint and params to get user data";
  }

  async call_tool(): Promise<ToolCallResult> {
    await this.validate();
    const responses = await this.retrieve();
    
    if (responses.length === 0 || Object.keys(responses[0]?.QueryResponse || {}).length === 0) {
      return ToolCallResult.error(
        QBUserDataRetriever.tool_name(),
        this.caller_id,
        this.thread_id,
        "NoData",
        "No data found"
      );
    }
    
    return ToolCallResult.success(
      QBUserDataRetriever.tool_name(),
      responses,
      this.caller_id,
      this.thread_id
    );
  }

  static tool_name(): string {
    return "qb_user_data_retriever";
  }

  static tool_description(): ToolDescription {
    return {
      type: "function",
      function: {
        name: QBUserDataRetriever.tool_name(),
        description: "Retrieve user's data from Quickbooks using Quickbooks HTTP platform API",
        parameters: {
          type: "object",
          properties: {
            endpoint: {
              type: "string",
              description: "The endpoint to query"
            },
            parameters: {
              type: "object",
              description: "HTTP parameters for querying the endpoint"
            },
            expected_row_count: {
              type: "integer",
              description: "The expected number of rows to be returned from the query"
            }
          }
        }
      }
    };
  }
} 