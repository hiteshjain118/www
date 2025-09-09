import { ToolCallWrapper, QueryType, ToolDescription, log } from 'coralbricks-common';
import { IToolCall, ToolCallResult } from 'coralbricks-common';
import { TaskService, TaskStatus } from 'coralbricks-common';
import * as ts from 'typescript';
import { runInNewContext } from 'vm';
import { SupabaseStorageService } from 'coralbricks-common';


export class TypeScriptExecutor implements IToolCall {
  constructor(
    private typescriptCode: string, 
    private threadId: bigint,
    private toolCallId: string,
    private baseContext: any = {}
  ) {
  }

  getModelHandleName(): string {
    throw new Error('Not implemented');
  }

  getBlobPath(): string {
    throw new Error('Not implemented');
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
    // First validate the code
    await this.validate();

    // await this.addUserData({});
    
    // Compile TypeScript to JavaScript using CommonJS for VM compatibility
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
    
    // Execute the code which should run the function and return the result directly
    const resultPromise = runInNewContext(javascriptCode, this.baseContext, {
      timeout: 30000, // 30 second timeout
      displayErrors: true
    });

    // If the result is a promise, await it
    const output = resultPromise && typeof resultPromise.then === 'function' 
      ? await resultPromise 
      : resultPromise;

    return ToolCallResult.success(
      'typescript_executor',
      { output, executed_code: this.typescriptCode },
      this.toolCallId,
      this.threadId
    );
  }

  static tool_description(): ToolDescription {
    return {
      type: "function",
      function: {
        name: 'typescript_executor',
        description: "Execute TypeScript code",
        parameters: {
          type: "object",
          properties: {
            typescript_code: {
              type: "string",
              description: "The TypeScript code to execute"
            }
          }
        }
      }
    };
  }
}

export class TCWrapperExecutor extends ToolCallWrapper {
  private modelHandleToBlobPath: Record<string, string> = {}
  private supabaseStorageService: SupabaseStorageService;
  private userData: Record<string, any[]> = {};
  private baseContext: any = {};
  constructor(
    thread_id: bigint,
  ) {
    super(thread_id);
    
    // pretty print the typescript code to the log with indents
    this.supabaseStorageService = new SupabaseStorageService();
    this.baseContext = {
      __userData: this.userData,
    };
    this.modelHandleToBlobPath = {};
    this.userData = {};
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
      // CommonJS globals needed for compiled TypeScript
      exports: {},
      module: { exports: {} },
      require: (id: string) => {
        // Basic require implementation for common modules
        switch (id) {
          case 'util':
            return require('util');
          case 'crypto':
            return require('crypto');
          case 'path':
            return require('path');
          case 'fs':
            return require('fs');
          case 'os':
            return require('os');
          case 'url':
            return require('url');
          case 'querystring':
            return require('querystring');
          default:
            throw new Error(`Module '${id}' is not available in the sandbox environment`);
        }
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

  async upsertUserData(): Promise<void> {
    for (const modelHandle of Object.keys(this.modelHandleToBlobPath)) {
      if (this.userData[modelHandle]) {
        continue;
      }
      const blobPath = this.modelHandleToBlobPath[modelHandle] as string;
      const blob = await this.supabaseStorageService.tryCache(blobPath);
      this.userData[modelHandle] = blob || [];

      log.info(`User data added for model handle: ${modelHandle} with ${this.userData[modelHandle].length} records`);
    }

    this.baseContext.__userData = this.userData;
  }

  public async waitForDependencies(
    depends_on_task_ids: bigint[] = []
  ): Promise<void> {
    if (depends_on_task_ids.length === 0) {
      return;
    }
    
    log.info(`Waiting for dependencies: ${JSON.stringify(depends_on_task_ids)}`);
    const taskService = TaskService.getInstance();
    
    // Wait for all dependent tasks to complete
    while (true) {
      const allCompleted = await Promise.all(
        depends_on_task_ids.map(async (taskId) => {
          const task = await taskService.getTask(taskId);
          if (task && task.status === TaskStatus.COMPLETED) {
            this.modelHandleToBlobPath[task.handleForModel] = task.blobPath;
            return true;
          }
          return false;
        })
      );

      if (allCompleted.every(completed => completed)) {
        log.info(`All dependencies completed: ${JSON.stringify(depends_on_task_ids)}`);
        break;
      } else {
              // Wait 1 second before checking again
        log.info(`Still waiting for dependencies - will wait for 1 second: ${JSON.stringify(depends_on_task_ids)}`);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    await this.upsertUserData();
  }

  protected getToolInstance(
    tool_call_id: string,
    tool_name: string,
    tool_args: any,
  ): IToolCall {
    if (!tool_args.typescript_code) {
      throw new Error('Missing required parameter: typescript_code');
    }

    log.info(`Typescript code: ${tool_args.typescript_code.split('\n').map((line: string) => '  ' + line).join('\n')}`);
    
    return new TypeScriptExecutor(
        tool_args.typescript_code, 
        this.threadId, 
        tool_call_id, 
        this.baseContext
    );
  }
} 