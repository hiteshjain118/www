import { IToolCall, ToolCallResult } from "./tool-call-result";
import { TaskService, TaskStatus } from "../prisma/taskService";

export enum QueryType {
  RETRIEVE = "retrieve",
  SCHEDULE = "schedule",
  VALIDATE = "validate",
  CREATE_PIPELINE = "create_pipeline"
}

export abstract class ToolCallWrapper {
  constructor(
    protected threadId: bigint, 
    protected toolCallId: string, 
    protected toolName: string,
    protected toolArgs: any,
    protected queryType: QueryType,
    protected scheduledDelayMs: number = 1,
    protected dependsOnTaskIds: bigint[] = []
  ) {}

  async run(res: any): Promise<void> {
    const tool_call_result = await this.wrap();
    const status = tool_call_result.status === 'success' ? 200 : 500;
    res.status(status).json(tool_call_result.as_api_response());
  }

  async wrap(): Promise<ToolCallResult> {
    let tool_call_result: ToolCallResult;
    try {
      const tool_instance = this.get_tool_instance();
      
      if (this.queryType === QueryType.VALIDATE) {
        await tool_instance.validate();
        tool_call_result = ToolCallResult.success(this.toolName, {}, this.toolCallId, this.threadId);
      } else if (this.queryType === QueryType.SCHEDULE) {
        await tool_instance.validate();
        const task = await TaskService.getInstance().createTask({
          threadId: this.threadId,
          toolCallId: this.toolCallId,
          toolCallName: this.toolName,
          toolCallArgs: this.toolArgs,
          handleForModel: this.toolCallId + '_' + this.toolName,
          blobPath: tool_instance.getBlobPath(),
        });
        tool_call_result = ToolCallResult.scheduled(this.toolName, this.toolCallId, this.threadId, task.handleForModel, task.cbId);
        // schedule to run tool in background 
        setTimeout(async () => {
          try {
            await tool_instance.call_tool();
            await TaskService.getInstance().updateTaskStatus(task.cbId, TaskStatus.COMPLETED);
          } catch (error) {
            await TaskService.getInstance().updateTaskStatus(task.cbId, TaskStatus.FAILED);
            console.error(`Error executing tool ${this.toolName} in task ${task.cbId}, threadId: ${this.threadId}, toolCallId: ${this.toolCallId}, error: ${error}`);
          }
        }, this.scheduledDelayMs);
      } else if (this.queryType === QueryType.RETRIEVE) {
        tool_call_result = await tool_instance.call_tool();
      } else {
        throw new Error("Invalid query type");
      }
    } catch (error) {
      if (error && typeof error === 'object' && 'constructor' in error && error.constructor.name === 'AxiosError') {
        const axiosError = error as any;
        tool_call_result = ToolCallResult.error(
          this.toolName,
          this.toolCallId,
          this.threadId,
          axiosError.constructor.name,
          axiosError.message,
          axiosError.response?.status
        );
        console.error(`HTTP error while executing tool ${this.toolName}: ${tool_call_result.toLogMessage()}`);
        console.debug(`Detailed error info: ${tool_call_result.toLoggableString()}`);
      } else {
        tool_call_result = ToolCallResult.error(
          this.toolName,
          this.toolCallId,
          this.threadId,
          error instanceof Error ? error.constructor.name : 'UnknownError',
          error instanceof Error ? error.message : 'Unknown error'
        );
        console.error(`Error executing tool ${this.toolName}: ${tool_call_result.toLogMessage()}`);
        console.debug(`Detailed error info: ${tool_call_result.toLoggableString()}`);
      }
    }
    return tool_call_result;
  }

  protected abstract get_tool_instance(): IToolCall;
} 