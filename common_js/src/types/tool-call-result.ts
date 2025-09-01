export interface IToolCall {
  call_tool(): Promise<ToolCallResult>;
  validate(): Promise<void>;
  getBlobPath(): string;
}

// Interface for tool call input (used by chat_js)
export interface IToolCallInput {
  id: string;
  name: string;
  arguments: Record<string, any>;
}

// Tool call result factory
export class ToolCallResult {
  constructor(
    public status: 'success' | 'error' | 'scheduled',
    public tool_name: string,
    public tool_call_id: string,
    public thread_id: bigint,
    public content?: any,
    public error_type?: string,
    public error_message?: string,
    public status_code?: number | null,
    public model_handle_name?: string | null,
    public scheduled_task_id?: bigint | null,
  ) {}

  static error(
    tool_name: string, 
    tool_call_id: string,
    thread_id: bigint,
    error_type: string, 
    error_message: string, 
    status_code?: number
  ): ToolCallResult {
    return new ToolCallResult(
      'error', 
      tool_name, 
      tool_call_id, 
      thread_id, 
      undefined, 
      error_type, 
      error_message, 
      status_code
    );
  }

  static success(tool_name: string, content: any, tool_call_id: string, thread_id: bigint): ToolCallResult {
    return new ToolCallResult('success', tool_name, tool_call_id, thread_id, content);
  }
  
  static scheduled(
    tool_name: string, 
    tool_call_id: string,
    thread_id: bigint,
    model_handle_name: string,
    scheduled_task_id: bigint
  ): ToolCallResult {
    return new ToolCallResult('scheduled', tool_name, tool_call_id, thread_id, undefined, undefined, undefined, undefined, model_handle_name, scheduled_task_id);
  }

  as_api_response(): Record<string, any> {
    return {
      status: this.status,
      tool_name: this.tool_name,
      tool_call_id: this.tool_call_id,
      thread_id: this.thread_id,
      content: this.content,
      error_type: this.error_type,
      error_message: this.error_message,
      status_code: this.status_code,
      model_handle_name: this.model_handle_name,
      scheduled_task_id: this.scheduled_task_id,
    };
  }

  static from_api_response(api_response: Record<string, any>): ToolCallResult {
    return new ToolCallResult(
      api_response.status,
      api_response.tool_name,
      api_response.tool_call_id,
      api_response.thread_id,
      api_response.content,
      api_response.error_type,
      api_response.error_message,
      api_response.status_code,
      api_response.model_handle_name,
      api_response.scheduled_task_id
    );
  }

  as_api_response_json(): string {
    return JSON.stringify(this.as_api_response(), (key, value) => {
      if (typeof value === 'bigint') {
        return value.toString();
      }
      return value;
    });
  }
  
  as_cc_tc_response_json(): string {
    return JSON.stringify(this.as_cc_tc_response(), (key, value) => {
      if (typeof value === 'bigint') {
        return value.toString();
      }
      return value;
    });
  }

  as_cc_tc_response(): Record<string, any> {
    if (this.status === 'success') {
      return {
        ...this.content,
        status: "success",
      };
    } else if (this.status === 'error') {
      return {
        status: "error",
        error_type: this.error_type, 
        error_message: this.error_message,
        status_code: this.status_code
      };
    } else if (this.status === 'scheduled') {
      return {
        status: "scheduled",
        handle: this.model_handle_name,
      };
    }
    throw new Error("Invalid status");
  }

  to_dict_w_truncated_content_for_logging(): Record<string, any> {
    const dict_struct = this.as_api_response();
    if (this.status === 'success') {
      dict_struct.content = this.content ? this.content.slice(0, 100) + (this.content.length > 100 ? '...' : '') : undefined;
    } 
    return dict_struct;
  }

  /**
   * Serializes the ToolCallResult for logging purposes
   * Handles BigInt serialization and provides a clean, readable format
   * @returns A string representation suitable for loggers
   */
  toLoggableString(): string {
    // Create a log-friendly version that handles BigInt
    const logData = {
      status: this.status,
      tool_name: this.tool_name,
      tool_call_id: this.tool_call_id,
      thread_id: this.thread_id.toString(), // Convert BigInt to string
      ...(this.status === 'success' 
        ? { content: this.content }
        : { 
            error_type: this.error_type, 
            error_message: this.error_message,
            status_code: this.status_code 
          }
      )
    };

    return JSON.stringify(logData, null, 2);
  }

  /**
   * Creates a compact log message for quick logging
   * @returns A short, single-line log message
   */
  toLogMessage(): string {
    const base = `${this.status.toUpperCase()} - ${this.tool_name} (${this.tool_call_id}) - Thread: ${this.thread_id}`;
    
    if (this.status === 'success') {
      return `${base} - Content: ${this.content ? 'Available' : 'None'}`;
    } else {
      return `${base} - Error: ${this.error_type} - ${this.error_message}`;
    }
  }
}

// Tool Description interface
export interface ToolDescription {
  type: string;
  function: {
    name: string;
    description: string;
    parameters: {
      type: string;
      properties: Record<string, any>;
    };
  };
} 