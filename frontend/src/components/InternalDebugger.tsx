import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { log } from '../utils/logger';

interface ModelEvent {
  id: number;
  message_id: string;
  event_type: string;
  timestamp: string;
  model_name: string;
  request_data: any;
  response_data: any;
}

interface ModelEventsResponse {
  success: boolean;
  message: string;
  data: {
    message_id: string;
    total_events: number;
    events: ModelEvent[];
  };
}

// Component for rendering input prompt list
const InputPromptList = React.forwardRef<{ expandAll: () => void; collapseAll: () => void }, { inputPrompt: string | any }>(
  ({ inputPrompt }, ref) => {
    const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());

    const toggleExpanded = (index: number) => {
      const newExpanded = new Set(expandedItems);
      if (newExpanded.has(index)) {
        newExpanded.delete(index);
      } else {
        newExpanded.add(index);
      }
      setExpandedItems(newExpanded);
    };

    // Parse the input prompt - it could be a string or already parsed JSON
    let parsedPrompt: any[] = [];
    try {
      if (typeof inputPrompt === 'string') {
        parsedPrompt = JSON.parse(inputPrompt);
      } else if (Array.isArray(inputPrompt)) {
        parsedPrompt = inputPrompt;
      }
    } catch (error) {
      console.error('Failed to parse input prompt:', error);
      return (
        <div className="text-red-600 text-sm">
          Error parsing input prompt: {String(error)}
        </div>
      );
    }

    if (!Array.isArray(parsedPrompt) || parsedPrompt.length === 0) {
      return (
        <div className="text-gray-500 text-sm">
          No input prompt data available
        </div>
      );
    }

    const expandAll = () => {
      const newExpanded = new Set<number>();
      parsedPrompt.forEach((_, index) => newExpanded.add(index));
      setExpandedItems(newExpanded);
    };

    const collapseAll = () => {
      setExpandedItems(new Set());
    };

    // Expose methods to parent component
    React.useImperativeHandle(ref, () => ({
      expandAll,
      collapseAll
    }));

    return (
      <div className="space-y-3">
        {parsedPrompt.map((item, index) => (
          <div key={index} className="border rounded-md p-3 bg-gray-50">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-3">
                <span className="text-sm font-medium text-gray-600">#{index + 1}</span>
                <span className="text-sm font-semibold text-blue-600 capitalize">
                  {item.role === 'tool' ? `Tool ${item.name || 'Unknown'}` : `Role: ${item.role || 'Unknown'}`}
                </span>
              </div>
              <button
                onClick={() => toggleExpanded(index)}
                className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
              >
                {expandedItems.has(index) ? 'Collapse' : 'Expand'}
              </button>
            </div>
            
                      {expandedItems.has(index) && (
            <div className="mt-3">
              <pre className="bg-white p-3 rounded text-sm whitespace-pre-wrap break-words border">
                {JSON.stringify({
                  ...item,
                  role: undefined // Remove role from expanded content since it's already shown in header
                }, null, 2)}
              </pre>
            </div>
          )}
          </div>
        ))}
      </div>
    );
  }
);

// Component for rendering system prompt with expand/collapse
const SystemPrompt = React.forwardRef<{ toggle: () => void; isExpanded: boolean }, { systemPrompt: string }>(
  ({ systemPrompt }, ref) => {
    const [isExpanded, setIsExpanded] = useState(false);

    const toggle = () => {
      setIsExpanded(!isExpanded);
    };

    // Expose toggle method and state to parent component
    React.useImperativeHandle(ref, () => ({
      toggle,
      isExpanded
    }));

    if (!isExpanded) {
      return (
        <div className="text-gray-500 text-sm italic">
          Click "Expand" to view system prompt
        </div>
      );
    }

    return (
      <pre className="bg-gray-50 p-3 rounded text-sm whitespace-pre-wrap break-words">
        {systemPrompt}
      </pre>
    );
  }
);



const InternalDebugger: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [modelEvents, setModelEvents] = useState<ModelEvent[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  
  // Refs for input prompt list components
  const inputPromptListRefs = useRef<{ [key: number]: { expandAll: () => void; collapseAll: () => void } | null }>({});
  
  // Refs for system prompt components
  const systemPromptRefs = useRef<{ [key: number]: { toggle: () => void; isExpanded: boolean } | null }>({});
  
  // Get messageId from URL query parameter
  const messageId = searchParams.get('messageId') || '';

  const API_BASE_URL = 'http://localhost:3001'; // Internal server port

  const fetchModelEvents = async (id: string) => {
    if (!id.trim()) {
      setError('Please enter a message ID');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE_URL}/intern/message/model_events?messageId=${id}`);
      const data: ModelEventsResponse = await response.json();

      if (data.success) {
        setModelEvents(data.data.events);
        log.info(`Fetched ${data.data.total_events} model events for message ID: ${id}`);
      } else {
        setError(data.message || 'Failed to fetch model events');
        setModelEvents([]);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Network error';
      setError(`Error fetching model events: ${errorMessage}`);
      setModelEvents([]);
      log.error('Error fetching model events:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (messageId.trim()) {
      fetchModelEvents(messageId);
    }
  };

  // Auto-fetch when messageId changes in URL
  useEffect(() => {
    if (messageId.trim()) {
      fetchModelEvents(messageId);
    }
  }, [messageId]);



  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const renderModelEvent = (event: ModelEvent) => (
    <div key={event.id} className="bg-white rounded-lg shadow-md p-6 mb-4 border-l-4 border-blue-500">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 capitalize">
            {event.event_type.replace('_', ' ')}
          </h3>
          <p className="text-sm text-gray-600">
            Model: <span className="font-mono bg-gray-100 px-2 py-1 rounded">{event.model_name}</span>
          </p>
        </div>
        <span className="text-sm text-gray-500">
          {formatTimestamp(event.timestamp)}
        </span>
      </div>

      {/* System Prompt Section */}
      {event.request_data?.system_prompt && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-md font-medium text-gray-800">System Prompt</h4>
            <button
              onClick={() => {
                const eventIndex = modelEvents.findIndex(e => e.id === event.id);
                if (eventIndex !== -1) {
                  const systemPromptRef = systemPromptRefs.current[eventIndex];
                  if (systemPromptRef) {
                    systemPromptRef.toggle();
                  }
                }
              }}
              className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              {(() => {
                const eventIndex = modelEvents.findIndex(e => e.id === event.id);
                if (eventIndex !== -1 && systemPromptRefs.current[eventIndex]) {
                  return systemPromptRefs.current[eventIndex]?.isExpanded ? "Collapse" : "Expand";
                }
                return "Expand";
              })()}
            </button>
          </div>
          <SystemPrompt 
            ref={(el) => {
              const eventIndex = modelEvents.findIndex(e => e.id === event.id);
              if (eventIndex !== -1) {
                systemPromptRefs.current[eventIndex] = el;
              }
            }}
            systemPrompt={event.request_data.system_prompt}
          />
        </div>
      )}

      {/* Input Prompt Section */}
      {event.request_data?.input_prompt && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-md font-medium text-gray-800">Input Prompt</h4>
            <div className="flex space-x-2">
              <button
                onClick={() => {
                  // Find the InputPromptList component for this event and expand all
                  const eventIndex = modelEvents.findIndex(e => e.id === event.id);
                  if (eventIndex !== -1 && inputPromptListRefs.current[eventIndex]) {
                    inputPromptListRefs.current[eventIndex]?.expandAll();
                  }
                }}
                className="px-3 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
              >
                Expand All
              </button>
              <button
                onClick={() => {
                  // Find the InputPromptList component for this event and collapse all
                  const eventIndex = modelEvents.findIndex(e => e.id === event.id);
                  if (eventIndex !== -1 && inputPromptListRefs.current[eventIndex]) {
                    inputPromptListRefs.current[eventIndex]?.collapseAll();
                  }
                }}
                className="px-3 py-1 text-xs bg-orange-600 text-white rounded hover:bg-orange-700 transition-colors"
              >
                Collapse All
              </button>
            </div>
          </div>
          <InputPromptList 
            ref={(el) => {
              const eventIndex = modelEvents.findIndex(e => e.id === event.id);
              if (eventIndex !== -1) {
                inputPromptListRefs.current[eventIndex] = el;
              }
            }}
            inputPrompt={event.request_data.input_prompt}
          />
        </div>
      )}

      {/* Tool Calls Section */}
      {event.request_data?.tool_calls && (
        <div className="mb-4">
          <h4 className="text-md font-medium text-gray-800 mb-2">Tool Calls</h4>
          <div className="space-y-2">
            {Array.isArray(event.request_data.tool_calls) ? event.request_data.tool_calls.map((toolCall: any, index: number) => (
              <div key={index} className="bg-gray-50 p-3 rounded border">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-blue-600">
                    Tool: {toolCall.function?.name || toolCall.name || 'Unknown'}
                  </span>
                  <span className="text-xs text-gray-500">ID: {toolCall.id || index}</span>
                </div>
                <pre className="text-sm whitespace-pre-wrap break-words">
                  {JSON.stringify(toolCall, null, 2)}
                </pre>
              </div>
            )) : (
              <pre className="bg-gray-50 p-3 rounded text-sm whitespace-pre-wrap break-words">
                {JSON.stringify(event.request_data.tool_calls, null, 2)}
              </pre>
            )}
          </div>
        </div>
      )}

      {event.response_data && (
        <div>
          <h4 className="text-md font-medium text-gray-800 mb-2">Response Data</h4>
          <pre className="bg-gray-50 p-3 rounded text-sm whitespace-pre-wrap break-words">
            {JSON.stringify(event.response_data, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Internal Debugger</h1>
        <p className="text-gray-600">Debug model events and API interactions</p>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Search Model Events</h2>
        
        <form onSubmit={handleSearch} className="flex gap-4 mb-6">
                      <input
              type="text"
              value={messageId}
              onChange={(e) => setSearchParams({ messageId: e.target.value })}
              placeholder="Enter message ID (e.g., 123456789)"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </form>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {modelEvents.length > 0 && (
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Model Events for Message ID: <span className="font-mono bg-blue-100 px-2 py-1 rounded">{messageId}</span>
            </h3>
            
            {/* IDs Display */}
            <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              {modelEvents[0]?.request_data?.thread_id && (
                <div className="p-3 bg-gray-50 rounded-md border">
                  <span className="text-sm font-medium text-gray-700">Thread ID: </span>
                  <span className="font-mono text-sm text-gray-900 bg-white px-2 py-1 rounded border">
                    {modelEvents[0].request_data.thread_id}
                  </span>
                </div>
              )}
              {modelEvents[0]?.request_data?.sender_id && (
                <div className="p-3 bg-gray-50 rounded-md border">
                  <span className="text-sm font-medium text-gray-700">Sender ID: </span>
                  <span className="font-mono text-sm text-gray-900 bg-white px-2 py-1 rounded border">
                    {modelEvents[0].request_data.sender_id}
                  </span>
                </div>
              )}
              {modelEvents[0]?.request_data?.profile_id && (
                <div className="p-3 bg-gray-50 rounded-md border">
                  <span className="text-sm font-medium text-gray-700">Profile ID: </span>
                  <span className="font-mono text-sm text-gray-900 bg-white px-2 py-1 rounded border">
                    {modelEvents[0].request_data.profile_id}
                  </span>
                </div>
              )}
            </div>
            
            <div className="space-y-4">
              {modelEvents.map(renderModelEvent)}
            </div>
          </div>
        )}

        {!loading && !error && modelEvents.length === 0 && messageId && (
          <div className="text-center py-8 text-gray-500">
            <p>No model events found for this message ID.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default InternalDebugger; 