import { Router, Request, Response } from 'express';
import { log } from '../utils/logger';
import { CBUser, QBOProfile } from '../types/profiles';
import { ToolCallWrapper } from '../services/toolCallWrapper';
import { TOOL_REGISTRY } from '../services/toolCallWrapper';

const router = Router();

/**
 * GET /
 * Returns information about the tools API
 */
router.get('/', (req: Request, res: Response) => {
  res.json({
    service: 'CoralBricks Internal Tools API',
    version: '1.0.0',
    description: 'Internal API for QuickBooks tool execution',
    endpoints: {
      'GET /tools': 'Get all available tool descriptions',
      'POST /:toolName': 'Execute or validate a specific tool'
    },
    available_tools: Object.keys(TOOL_REGISTRY),
    usage: {
      tool_execution: {
        method: 'POST',
        path: '/:toolName',
        required_body: {
          cbid: 'string (user ID)',
          tool_call_id: 'string',
          thread_id: 'string',
          validate: 'boolean (optional, defaults to false)',
          '...tool_args': 'tool-specific arguments'
        },
        description: 'Set validate: true to validate without executing, omit or set to false to execute'
      }
    }
  });
});

/**
 * GET /tools
 * Returns all available tool descriptions for LLM integration
 */
router.get('/tools', (req: Request, res: Response) => {
  try {
    // const tools = Object.keys(TOOL_REGISTRY).map((toolName) => ({
    //   name: toolName,
    //   description: TOOL_REGISTRY[toolName]
    // }));
    const tools: any[] = []
    for (const [tool_name, tool_description] of Object.entries(TOOL_REGISTRY)) {
      tools.push( tool_description);
    }
    res.json({
      success: true,
      tools: tools,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    log.error(`Error getting tool descriptions: ${errorMessage}`);
    res.status(500).json({
      success: false,
      error: 'Failed to get tool descriptions',
      message: errorMessage
    });
  }
});

/**
 * POST /:toolName
 * Executes or validates a specific tool with provided arguments
 * Expected body: { tool_call_id: string, thread_id: string, cbid: string, validate?: boolean, ...tool_specific_args }
 */
router.post('/:toolName', async (req: Request, res: Response) => {
  const { toolName } = req.params;
  const { tool_call_id, thread_id, cbid, validate = false, ...toolArgs } = req.body;
  const startTime = Date.now();
  const requestId = req.headers['x-request-id'] as string;
  
  // Enhanced logging for tool execution
  log.info(`[TOOL] Executing ${toolName}`, {
    requestId,
    toolName,
    tool_call_id,
    thread_id,
    cbid,
    validate,
    toolArgs,
    body: req.body
  });

  try {
    // Validate required parameters
    if (!cbid || !tool_call_id || !thread_id) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameter: cbid, tool_call_id, thread_id'
      });
    }

    // Load QBO profile
    const viewerContext = { cbid: BigInt(cbid) };
    const cb_owner = await CBUser.load_profile(viewerContext, BigInt(cbid));
    const qboProfile = await QBOProfile.load_any_from_cb_owner(viewerContext, cb_owner);

    // Determine query type based on validate parameter
    const queryType = validate ? "validate" : "retrieve";

    // Create wrapper and execute/validate the tool
    const wrapper = new ToolCallWrapper(
      thread_id, 
      tool_call_id, 
      toolName, 
      toolArgs, 
      qboProfile, 
      queryType
    );
    
    
    await wrapper.run(res);
    const duration = Date.now() - startTime;
    
    log.info(`[TOOL] Completed ${toolName}`, {
      requestId,
      toolName,
      duration: `${duration}ms`,
      status: 'success'
    });
    return;

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const action = req.body.validate ? 'validating' : 'executing';
    
    log.error(`[TOOL] Error ${action} tool ${toolName}`, {
      requestId,
      toolName,
      action,
      error: errorMessage,
      body: req.body,
      stack: error instanceof Error ? error.stack : undefined
    });
    
    res.status(500).json({
      success: false,
      error: `Tool ${action} failed`,
      message: errorMessage
    });
    return;
  }
});



export default router; 