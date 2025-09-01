import express from 'express';
import { log } from '../utils/logger';
import { ModelEventService, ModelEvent } from 'coralbricks-common/src/prisma/modelEventService';

// Extended interface that includes the tasks relation
interface ModelEventWithTasks extends ModelEvent {
  tasks: any[];
}

const router = express.Router();

// GET /intern/message/model_events?messageId=123
router.get('/message/model_events', async (req, res) => {
  try {
    const messageId = req.query.messageId;
    
    if (!messageId || typeof messageId !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Missing or invalid messageId parameter',
        message: 'Please provide a valid messageId as a query parameter'
      });
    }
    
    log.info(`Fetching model events for message ID: ${messageId}`, { messageId });
    
    // Convert messageId to BigInt for database query
    const messageIdBigInt = BigInt(messageId);
    
    // Get model events from database
    const modelEventService = ModelEventService.getInstance();
    const modelEvents = await modelEventService.getModelEventsByAssistantMessageId(messageIdBigInt) as ModelEventWithTasks[];
    
    // Transform the data to match the frontend expectations
    const transformedEvents = modelEvents.map(event => {
      // Debug logging to see what fields are available
      log.info('Raw event data:', {
        cbId: event.cbId,
        systemPrompt: event.systemPrompt,
        inputPrompt: event.inputPrompt,
        toolCalls: event.toolCalls,
        threadId: event.threadId,
        senderId: event.senderId,
        responseContent: event.responseContent
      });
      
      return {
        id: Number(event.cbId),
        message_id: messageId,
        event_type: 'model_event',
        timestamp: event.createdAt.toISOString(),
        model_name: event.modelId || 'unknown',
        request_data: {
          system_prompt: event.systemPrompt,
          input_prompt: event.inputPrompt,
          tool_calls: event.toolCalls,
          thread_id: event.threadId ? event.threadId.toString() : null,
          sender_id: event.senderId ? event.senderId.toString() : null,
          profile_id: event.cbProfileId ? event.cbProfileId.toString() : null
        },
        response_data: {
          response_content: event.responseContent,
          tasks: event.tasks || []
        }
      };
    });
    
    return res.json({
      success: true,
      message: `Model events for message ID: ${messageId}`,
      data: {
        message_id: messageId,
        total_events: transformedEvents.length,
        events: transformedEvents
      }
    });
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    log.error(`Error fetching model events: ${errorMessage}`, { 
      error: String(error)
    });
    
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch model events',
      message: errorMessage
    });
  }
});




export default router; 