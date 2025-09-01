import { ToolCallWrapper, QueryType } from 'coralbricks-common';
import { IToolCall, ToolCallResult } from 'coralbricks-common';
import { TaskService, TaskStatus } from 'coralbricks-common';
import * as ts from 'typescript';
import { runInNewContext } from 'vm';
import { SupabaseStorageService } from 'coralbricks-common';


export class TypeScriptExecutor implements IToolCall {
  private modelHandleToBlobPath: Record<string, string>;
  private supabaseStorageService: SupabaseStorageService;
  private userData: Record<string, any[]> = {};
  private baseContext: any = {}
  constructor(
    private typescriptCode: string, 
    private threadId: bigint,
    private toolCallId: string,
    modelHandleToBlobPath: Record<string, string>,
  ) {
    this.modelHandleToBlobPath = modelHandleToBlobPath;
    this.supabaseStorageService = new SupabaseStorageService();
    this.prepareUserData();
    this.baseContext = {
      __userData: this.userData,
      console: {
        log: (...args: any[]) => console.log('[Tool Execution]:', ...args),
        error: (...args: any[]) => console.error('[Tool Execution Error]:', ...args),
        warn: (...args: any[]) => console.warn('[Tool Execution Warning]:', ...args),
        info: (...args: any[]) => console.info('[Tool Execution Info]:', ...args)
      },
      setTimeout,
      setInterval,
      clearTimeout,
      clearInterval,
      Buffer,
      process: {
        env: process.env,
        platform: process.platform,
        arch: process.arch,
        version: process.version
      },
      // Add any other global objects that might be needed
      Math,
      Date,
      JSON,
      Array,
      Object,
      String,
      Number,
      Boolean,
      RegExp,
      Error,
      Promise,
      Map,
      Set,
      WeakMap,
      WeakSet,
      Symbol,
      Proxy,
      Reflect,
      Int8Array,
      Uint8Array,
      Uint8ClampedArray,
      Int16Array,
      Uint16Array,
      Int32Array,
      Uint32Array,
      Float32Array,
      Float64Array,
      BigInt64Array,
      BigUint64Array,
      DataView,
      ArrayBuffer,
      SharedArrayBuffer,
      Atomics,
      WebAssembly
    };
  }

  getBlobPath(): string {
    throw new Error('Not implemented');
  }

  async prepareUserData(): Promise<void> {
    for (const modelHandle of Object.keys(this.modelHandleToBlobPath)) {
      const blobPath = this.modelHandleToBlobPath[modelHandle] as string;
      const blob = await this.supabaseStorageService.tryCache(blobPath);
      this.userData[modelHandle] = blob || [];
    }
  }

  async validate(): Promise<void> {
    // Compile the TypeScript code to check for syntax errors
    const result = ts.transpileModule(this.typescriptCode, {
      compilerOptions: {
        target: ts.ScriptTarget.ES2020,
        module: ts.ModuleKind.CommonJS,
        strict: true,
        esModuleInterop: true,
        skipLibCheck: true,
        forceConsistentCasingInFileNames: true,
        resolveJsonModule: true,
        experimentalDecorators: true,
        emitDecoratorMetadata: true
      }
    });

    if (result.diagnostics && result.diagnostics.length > 0) {
      const errors = result.diagnostics.map(diagnostic => {
        const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n');
        return `${diagnostic.file?.fileName || 'unknown'}:${diagnostic.start}: ${message}`;
      }).join('\n');
      throw new Error(`TypeScript compilation failed:\n${errors}`);
    }
  }

  async call_tool(): Promise<ToolCallResult> {
    try {
      // First validate the code
      await this.validate();

      // Compile TypeScript to JavaScript
      const result = ts.transpileModule(this.typescriptCode, {
        compilerOptions: {
          target: ts.ScriptTarget.ES2020,
          module: ts.ModuleKind.CommonJS,
          strict: true,
          esModuleInterop: true,
          skipLibCheck: true,
          forceConsistentCasingInFileNames: true,
          resolveJsonModule: true,
          experimentalDecorators: true,
          emitDecoratorMetadata: true
        }
      });

      const javascriptCode = result.outputText;
      
      // Execute the code
      const output = runInNewContext(javascriptCode, this.baseContext, {
        timeout: 30000, // 30 second timeout
        displayErrors: true
      });

      return ToolCallResult.success(
        'typescript_executor',
        { output, executed_code: this.typescriptCode },
        this.toolCallId,
        this.threadId
      );
    } catch (error) {
      return ToolCallResult.error(
        'typescript_executor',
        this.toolCallId,
        this.threadId,
        error instanceof Error ? error.constructor.name : 'UnknownError',
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
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

export class TCWrapperExecutor extends ToolCallWrapper {
  private typescriptCode: string;
  private modelHandleToBlobStorage: Record<string, string> = {}
  constructor(
    thread_id: bigint,
    tool_call_id: string,
    tool_name: string,
    tool_args: any,
    query_type_enum: QueryType,
    scheduled_delay_ms: number = 1,
    depends_on_task_ids: bigint[] = []
  ) {
    super(thread_id, tool_call_id, tool_name, tool_args, query_type_enum, scheduled_delay_ms, depends_on_task_ids);
    
    if (!tool_args.typescript_code) {
      throw new Error('Missing required parameter: typescript_code');
    }
    
    this.typescriptCode = tool_args.typescript_code;
  }

  protected async waitForDependencies(): Promise<void> {
    if (this.dependsOnTaskIds.length === 0) {
      return;
    }

    const taskService = TaskService.getInstance();
    
    // Wait for all dependent tasks to complete
    while (true) {
      const allCompleted = await Promise.all(
        this.dependsOnTaskIds.map(async (taskId) => {
          const task = await taskService.getTask(taskId);
          if (task && task.status === TaskStatus.COMPLETED) {
            this.modelHandleToBlobStorage[task.handleForModel] = task.blobPath;
            return true;
          }
          return false;
        })
      );

      if (allCompleted.every(completed => completed)) {
        break;
      }

      // Wait 1 second before checking again
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  protected get_tool_instance(): IToolCall {
    return new TypeScriptExecutor(
        this.typescriptCode, 
        this.threadId, 
        this.toolCallId, 
        this.modelHandleToBlobStorage
    );
  }

  async wrap(): Promise<ToolCallResult> {
    // Wait for dependencies before proceeding
    await this.waitForDependencies();

    // Call the parent wrap method
    return super.wrap();
  }
} 