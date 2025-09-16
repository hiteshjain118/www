import { QBServerPrompt } from './qb-server-prompt';
import * as fs from 'fs';
import { TMessage } from './types/modelio';
import { ToolCallResult } from 'coralbricks-common';

export class QBServerSuccessPrompt extends QBServerPrompt {
  private conversation_file_name: string;
  private messages: Array<{
    role: 'system' | 'user' | 'assistant' | 'tool';
    content: string;
    tool_call_id?: string;
    name?: string;
  }>;

  constructor(logger: any) {
    super(logger);
    const timestamp_int = Math.floor(Date.now() / 1000);
    this.conversation_file_name = `conversation_${timestamp_int}.jsonl`;
    this.messages = [
      {
        role: 'system',
        content: this.get_system_prompt()
      },
    ];
  }

  private append_to_conversation_log(): void {
    try {
      const logContent = this.messages
        .map(message => JSON.stringify(message))
        .join('\n') + '\n';
      fs.appendFileSync(this.conversation_file_name, logContent);
    } catch (error) {
      this.logger.error('Error writing to conversation log:', error);
    }
  }

  add_user_turn(userTurn: TMessage): void {
    this.messages.push({
      role: 'user',
      content: userTurn.content
    });
    this.append_to_conversation_log();
  }

  get_json_conversation_after_system_prompt(): string {
    return JSON.stringify(this.messages.slice(1));
  }

  get_messages(): Array<{
      role: 'system' | 'user' | 'assistant' | 'tool';
      content: string;
  }> {
    return this.messages;
  }

  add_tool_outputs(toolCalls: Record<string, ToolCallResult>): void {
    for (const [tool_call_id, tool_call] of Object.entries(toolCalls)) {
      this.add_tool_output(tool_call_id, tool_call);
    }
  }

  add_tool_output(toolCallId: string, toolOutput: ToolCallResult): void {
    this.messages.push({
      role: 'tool',
      content: toolOutput.as_cc_tc_response_json(),
      tool_call_id: toolCallId,
      name: toolOutput.tool_name
    });
    this.append_to_conversation_log();
  }

  add_chat_completion_message(message: any): void {
    if (!message) {
      this.logger.warn('Attempted to add null/undefined message to conversation');
      return;
    }
    
    if (!message.role) {
      this.logger.warn('Attempted to add message without role property:', message);
      return;
    }
    
    this.messages.push(message);
    this.append_to_conversation_log();
  }

  pretty_print_conversation(): void {
    
    this.logger.info('='.repeat(80));
    this.logger.info('CONVERSATION HISTORY');
    this.logger.info('='.repeat(80));
    
    let message_count = 0;
    for (const message of this.messages) {
      if (!message) {
        this.logger.warn('Found null/undefined message in conversation history');
        continue;
      }
      
      if (!message.role) {
        this.logger.warn('Found message without role property:', message);
        continue;
      }
      
      if (message.role === 'system') {
        continue;
      }
      
      message_count++;
      
      // Handle different message types
      if (message.role === 'user') {
        this.logger.info(`[${message_count}] USER: ${message.content}`);
      } else if (message.role === 'assistant') {
        this.logger.info(`[${message_count}] ASSISTANT: ${message.content}`);
      } else if (message.role === 'tool') {
        const tool_call_id = message.tool_call_id || 'unknown';
        const tool_name = message.name || 'unknown';
        const content = message.content.length > 100 
          ? `${message.content.substring(0, 100)}...${message.content.length}`
          : message.content;
        this.logger.info(`[${message_count}] TOOL CALL RESULT (ID: ${tool_call_id}, Tool: ${tool_name}): ${content}`);
      }
      
      this.logger.info(''); // Empty line between messages
    }
    
    this.logger.info('='.repeat(80));
    this.logger.info(`Total Messages (excluding system): ${message_count}`);
    this.logger.info('='.repeat(80));
  }
} 