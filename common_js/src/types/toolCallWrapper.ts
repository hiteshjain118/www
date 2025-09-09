import { IToolCall, ToolCallResult } from "./tool-call-result";
import { TaskService, TaskStatus } from "../prisma/taskService";
import { log } from "../utils/logger";

export enum QueryType {
  RETRIEVE = "retrieve",
  SCHEDULE = "schedule",
  VALIDATE = "validate",
  CREATE_PIPELINE = "create_pipeline"
}

export abstract class ToolCallWrapper {
  constructor(
    protected threadId: bigint, 
  ) {}

  async run(
    tool_call_id: string, 
    tool_args: any,
    tool_name: string,
    query_type: QueryType,
    scheduled_delay_ms: number = 1,
    res: any
  ): Promise<void> {
    const tool_call_result = await this.wrap(tool_call_id, tool_args, tool_name, query_type, scheduled_delay_ms);
    const status = tool_call_result.status !== 'error' ? 200 : 400;
    res.status(status).json(tool_call_result.as_api_response());
  }

  public async waitForDependencies(
    depends_on_task_ids: bigint[] = []
  ): Promise<void> {   
  }

  async wrap(
    tool_call_id: string, 
    tool_args: any,
    tool_name: string,
    query_type: QueryType,
    scheduled_delay_ms: number = 1,
  ): Promise<ToolCallResult> {
    let tool_call_result: ToolCallResult | undefined = undefined;
    try {
      log.info(`getting Tool instance: ${tool_name}`);
      console.log(`getting Tool instance: ${tool_name}`);

      const tool_instance = this.getToolInstance(tool_call_id, tool_name, tool_args);
      log.info(`Tool instance: ${tool_instance}`);
      console.log(`Tool instance: ${tool_instance}`);
      if (query_type === QueryType.VALIDATE) {
        await tool_instance.validate();
        tool_call_result = ToolCallResult.success(tool_name, {}, tool_call_id, this.threadId);
      } else if (query_type === QueryType.SCHEDULE) {
        await tool_instance.validate();
        const task = await TaskService.getInstance().createTask({
          threadId: this.threadId,
          toolCallId: tool_call_id,
          toolCallName: tool_name,
          toolCallArgs: tool_args,
          handleForModel: tool_instance.getModelHandleName(),
          blobPath: tool_instance.getBlobPath(),
        });
        tool_call_result = ToolCallResult.scheduled(tool_name, tool_call_id, this.threadId, task.handleForModel, task.cbId);
        // schedule to run tool in background 
        setTimeout(async () => {
          try {
            await tool_instance.call_tool();
            await TaskService.getInstance().updateTaskStatus(task.cbId, TaskStatus.COMPLETED);
          } catch (error) {
            await TaskService.getInstance().updateTaskStatus(task.cbId, TaskStatus.FAILED);
            log.error(`Error executing tool ${tool_name} in task ${task.cbId}, threadId: ${this.threadId}, toolCallId: ${tool_call_id}, error: ${error}`);
          }
        }, scheduled_delay_ms);
      } else if (query_type === QueryType.RETRIEVE) {
        tool_call_result = await tool_instance.call_tool();
      } else {
        throw new Error("Invalid query type");
      }
    } catch (error) {
      if (error && typeof error === 'object' && 'constructor' in error && error.constructor.name === 'AxiosError') {
        const axiosError = error as any;
        tool_call_result = ToolCallResult.error(
          tool_name,
          tool_call_id,
          this.threadId,
          axiosError.constructor.name,
          axiosError.message,
          axiosError.response?.status
        );
      } else {
        tool_call_result = ToolCallResult.error(
          tool_name,
          tool_call_id,
          this.threadId,
          error instanceof Error ? error.constructor.name : 'UnknownError',
          error instanceof Error ? error.message : 'Unknown error'
        );
      }
      const errorMessage = error instanceof Error ? error.message : String(error);
      const stackTrace = error instanceof Error ? error.stack || error.message : String(error);
      log.error(`Tool ${tool_call_id} name: ${tool_name} failed with error ${errorMessage} stack ${stackTrace}`);
    }
    return tool_call_result!;
  }

  protected abstract getToolInstance(
    tool_call_id: string, 
    tool_name: string,
    tool_args: any,
  ): IToolCall;
} 