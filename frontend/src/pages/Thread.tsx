import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import apiClient, { Thread as ThreadType, ThreadMessage } from '../services/api';
import websocketService, { WebSocketMessage } from '../services/websocket';
import { 
  PaperAirplaneIcon,
  SparklesIcon,
  ChatBubbleLeftRightIcon,
  WifiIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  threadId?: string;
  acknowledged?: boolean;
}

const Thread: React.FC = () => {
  const { threadId } = useParams<{ threadId: string }>();
  const { user, loading } = useAuth();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isThreadLoading, setIsThreadLoading] = useState(false);
  const [canSendMessage, setCanSendMessage] = useState(true);
  const [currentThread, setCurrentThread] = useState<ThreadType | null>(null);
  const [wsConnectionStatus, setWsConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');
  const [hasNewConnection, setHasNewConnection] = useState(false);
  
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  // Check if user can send a message (after assistant messages OR on new connections)
  const checkCanSendMessage = (messages: Message[], hasNewConnection: boolean): boolean => {
    if (messages.length === 0) return true; // Allow first message
    if (hasNewConnection) return true; // Allow message on new WebSocket connections
    const lastMessage = messages[messages.length - 1];
    return lastMessage.sender === 'ai'; // Can only send after AI messages
  };
  


  // Load thread data when threadId changes
  useEffect(() => {
    if (threadId && user?.cbid) {
      // Clear previous messages and show loading state
      setMessages([]);
      setIsThreadLoading(true);
      loadThread(threadId);
    } else if (user?.cbid) {
      // Initialize with welcome message if no specific thread
      initializeWelcomeMessage();
    }
  }, [threadId, user?.cbid]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Update canSendMessage state when messages change or connection status changes
  useEffect(() => {
    setCanSendMessage(checkCanSendMessage(messages, hasNewConnection));
  }, [messages, hasNewConnection]);



  // WebSocket connection management
  useEffect(() => {
    if (threadId && user?.cbid) {
      connectWebSocket(threadId, user.cbid);
    }

    return () => {
      // Cleanup WebSocket connection when component unmounts or thread changes
      websocketService.disconnect();
    };
  }, [threadId, user?.cbid]);

  const connectWebSocket = async (threadId: string, userId: string) => {
    try {
      setWsConnectionStatus('connecting');
      
      await websocketService.connect(threadId, userId, {
        onConnect: () => {
          console.log('WebSocket connected successfully');
          setWsConnectionStatus('connected');
          setHasNewConnection(true); // Enable sending on new connection
        },
        onDisconnect: () => {
          console.log('WebSocket disconnected');
          setWsConnectionStatus('disconnected');
        },
        onMessage: (wsMessage: WebSocketMessage) => {
          if (wsMessage.type === 'message_received') {
            // Handle message acknowledgment - show checkmark
            setMessages((prev: Message[]) => {
              const updated = prev.map((msg: Message) => {
                if (msg.id === 'temp-user-message') {
                  return { ...msg, acknowledged: true, id: wsMessage.messageId || msg.id };
                }
                return msg;
              });
              return updated;
            });
          } else if (wsMessage.type === 'chat' && wsMessage.message) {
            const aiMessage: Message = {
              id: `ai-${Date.now()}`,
              text: wsMessage.message,
              sender: 'ai',
              timestamp: new Date(wsMessage.timestamp || Date.now()),
              threadId: threadId,
              acknowledged: true // AI response is always delivered
            };
            
            // Make the message object immutable
            Object.freeze(aiMessage);
            setMessages((prev: Message[]) => [...prev, aiMessage]);
            setIsLoading(false);
          } else if (wsMessage.type === 'error') {
            const errorMessage: Message = {
              id: `error-${Date.now()}`,
              text: wsMessage.message || 'An error occurred while processing your request.',
              sender: 'ai',
              timestamp: new Date(wsMessage.timestamp || Date.now()),
              threadId: threadId,
              acknowledged: true // Error message is always delivered
            };
            
            // Make the message object immutable
            Object.freeze(errorMessage);
            setMessages((prev: Message[]) => [...prev, errorMessage]);
            setIsLoading(false);
          }
        },
        onError: (error) => {
          console.error('WebSocket error:', error);
          setWsConnectionStatus('error');
        }
      });
    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
      setWsConnectionStatus('error');
      
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        text: 'Failed to connect to AI agent builder. Please refresh the page and try again.',
        sender: 'ai',
        timestamp: new Date(),
        threadId: threadId,
        acknowledged: true // Error message is always delivered
      };
      
      // Make the message object immutable
      Object.freeze(errorMessage);
      setMessages((prev: Message[]) => [...prev, errorMessage]);
    }
  };

  const initializeWelcomeMessage = () => {
    const displayName = user?.email?.split('@')[0] || 'there';
    const welcomeMessage: Message = {
      id: 'welcome',
      text: `Hi ${displayName}! I'm your AI agent builder. Tell me what kind of agent you'd like to create and I'll help you build it step by step.`,
      sender: 'ai',
      timestamp: new Date(),
      acknowledged: true // Welcome message is always delivered
    };
    
    // Make the message object immutable
    Object.freeze(welcomeMessage);
    setMessages([welcomeMessage]);
    setIsThreadLoading(false);
  };

  const loadThread = async (threadId: string) => {
    try {
      if (!user?.cbid) return;
      
      const response = await apiClient.getThread(threadId, user.cbid);
      if (response.success && response.data) {
        setCurrentThread(response.data);
        
        // Convert thread messages to UI messages
        const threadMessages: Message[] = [];
        
        if (response.data.messages && response.data.messages.length > 0) {
          response.data.messages.forEach((msg: ThreadMessage) => {
            // Determine if this is a user or AI message based on sender_id
            // Use message.sender_id === logged in user's cb_id to detect user messages
            const isUserMessage = msg.sender_id === user.cbid;
            
            const messageObj = {
              id: msg.cbId,
              text: msg.body,
              sender: isUserMessage ? 'user' as const : 'ai' as const,
              timestamp: new Date(msg.createdAt),
              threadId: threadId,
              acknowledged: true // Mark all loaded messages as delivered
            };
            
            // Make the message object immutable to prevent mutation
            Object.freeze(messageObj);
            threadMessages.push(messageObj);
          });
        } else {
          // No messages yet, add welcome message
          const welcomeMessage: Message = {
            id: `welcome-${threadId}`,
            text: `Welcome back to Thread ${threadId.slice(-6)}! Continue building your agent...`,
            sender: 'ai',
            timestamp: new Date(),
            threadId: threadId,
            acknowledged: true // System message is always delivered
          };
          Object.freeze(welcomeMessage);
          threadMessages.push(welcomeMessage);
        }
        
        setMessages(threadMessages);
        setIsThreadLoading(false);
      }
    } catch (error) {
      console.error('Error loading thread:', error);
      // Show error message
      const errorMessage: Message = {
        id: `error-${threadId}`,
        text: `Error loading thread ${threadId.slice(-6)}. Starting fresh...`,
        sender: 'ai',
        timestamp: new Date(),
        threadId: threadId,
        acknowledged: true // System message is always delivered
      };
      setMessages([errorMessage]);
      setIsThreadLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !user?.cbid || !threadId || !canSendMessage) return;

    const messageText = inputMessage;
    const messageId = Date.now().toString();
    const userMessage: Message = {
      id: 'temp-user-message',
      text: messageText,
      sender: 'user',
      timestamp: new Date(),
      threadId: threadId,
      acknowledged: false
    };
    
    // Make the message object immutable
    Object.freeze(userMessage);

    console.log('📤 Creating user message:', userMessage);
    setMessages((prev: Message[]) => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);
    setHasNewConnection(false); // Reset new connection flag after sending message

    try {
      // Save user message to database
      await apiClient.createMessage(threadId, user.cbid, messageText);

      // Send message via WebSocket to chat_js server with messageId
      if (websocketService.isConnected()) {
        websocketService.sendMessage(messageText, threadId, messageId);
      } else {
        // Fallback: simulate AI response if WebSocket is not connected
        console.warn('WebSocket not connected, using fallback response');
        setTimeout(async () => {
          const aiResponseText = `I understand you want to create an agent that can ${messageText.toLowerCase()}. Let me help you design the workflow for this agent. What specific data sources or integrations do you need?`;
          
          const aiMessage: Message = {
            id: (Date.now() + 1).toString(),
            text: aiResponseText,
            sender: 'ai',
            timestamp: new Date(),
            threadId: threadId,
            acknowledged: true // Fallback AI response is always delivered
          };
          
          // Make the message object immutable
          Object.freeze(aiMessage);

          setMessages((prev: Message[]) => [...prev, aiMessage]);

          // Save AI message to database
          try {
            await apiClient.createMessage(threadId, user.cbid, aiResponseText, "0"); // Use "0" for AI receiver
          } catch (error) {
            console.error('Error saving AI message:', error);
          }
          
          setIsLoading(false);
        }, 1000);
      }

    } catch (error) {
      console.error('Error sending message:', error);
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "I'm sorry, I'm having trouble connecting to the server. Please check your connection and try again.",
        sender: 'ai',
        timestamp: new Date(),
        acknowledged: true // Error message is always delivered
      };
      
      // Make the message object immutable
      Object.freeze(errorMessage);

      setMessages((prev: Message[]) => [...prev, errorMessage]);
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getConnectionStatusIcon = () => {
    switch (wsConnectionStatus) {
      case 'connected':
        return <WifiIcon className="w-4 h-4 text-green-500" />;
      case 'connecting':
        return <WifiIcon className="w-4 h-4 text-yellow-500 animate-pulse" />;
      case 'error':
        return <ExclamationTriangleIcon className="w-4 h-4 text-red-500" />;
      default:
        return <WifiIcon className="w-4 h-4 text-gray-400" />;
    }
  };

  const getConnectionStatusText = () => {
    switch (wsConnectionStatus) {
      case 'connected':
        return 'Connected to AI';
      case 'connecting':
        return 'Connecting...';
      case 'error':
        return 'Connection error';
      default:
        return 'Disconnected';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-coral-50 to-brick-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-coral-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    // Don't return null, let the parent component handle redirect
    return (
      <div className="min-h-screen bg-gradient-to-br from-coral-50 to-brick-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-coral-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Please log in to continue...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex min-h-0">
      {/* Chat Panel */}
      <div className="w-full bg-white flex flex-col min-h-0">
        {/* Chat Header */}
        <div className="p-4 border-b border-gray-200 bg-white flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-coral-600 to-brick-600 rounded-full flex items-center justify-center">
                <ChatBubbleLeftRightIcon className="w-4 h-4 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">AI Agent Builder</h2>
                <p className="text-sm text-gray-500">
                  {currentThread && currentThread.cbId ? `Thread ${currentThread.cbId.toString().slice(-6)}` : 'New conversation'}
                </p>
              </div>
            </div>
            
            {/* Connection Status */}
            <div className="flex items-center space-x-2">
              {getConnectionStatusIcon()}
              <span className={`text-sm ${
                wsConnectionStatus === 'connected' ? 'text-green-600' :
                wsConnectionStatus === 'connecting' ? 'text-yellow-600' :
                wsConnectionStatus === 'error' ? 'text-red-600' :
                'text-gray-500'
              }`}>
                {getConnectionStatusText()}
              </span>
            </div>
          </div>
        </div>

        {/* Thread Loading Spinner */}
        {isThreadLoading && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-coral-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading thread...</p>
            </div>
          </div>
        )}

        {/* Messages - Only this area should scroll */}
        {!isThreadLoading && (
          <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
            {messages.map((message) => {
            const isUserMessage = message.sender === 'user';
            
            return (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${isUserMessage ? 'justify-end' : 'justify-start'}`}
              >
              <div className={`flex items-end space-x-2 ${isUserMessage ? '' : ''}`}>
                <div className={`max-w-xs lg:max-w-lg xl:max-w-xl px-4 py-2 rounded-lg ${
                  isUserMessage 
                    ? 'user-message' 
                    : message.id.startsWith('system') || message.id.startsWith('error')
                    ? 'bg-blue-50 text-blue-900 border border-blue-200'
                    : 'bg-gray-100 text-gray-900'
                }`}>

                  <div className="text-sm whitespace-pre-wrap">{message.text}</div>
                  <div className={`text-xs mt-1 ${isUserMessage ? 'timestamp' : 'opacity-70'}`}>
                    {message.timestamp.toLocaleTimeString()}
                  </div>
                </div>
                
                {/* Show acknowledgment status for user messages - to the right */}
                {isUserMessage && (
                  <div className="flex-shrink-0 mb-1 ml-2">
                    {message.acknowledged ? (
                      <div className="w-4 h-4 rounded-sm bg-gray-100 flex items-center justify-center" title="Message delivered">
                        <svg className="w-3 h-3 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    ) : (
                      <div className="w-4 h-4 rounded-sm border-2 border-gray-400 animate-pulse" title="Sending..."></div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          );
          })}
          
          <div ref={messagesEndRef} />
          
          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-start"
            >
              <div className="bg-gray-100 text-gray-900 px-4 py-2 rounded-lg">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </motion.div>
          )}
        </div>
        )}
        {/* Input */}
        <div className="p-4 border-t border-gray-200 bg-white flex-shrink-0">
          <div className="flex space-x-3">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={canSendMessage ? "Describe your agent idea and I'll help you build it..." : "Please wait for the AI to respond..."}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-coral-500 focus:border-transparent"
              disabled={!websocketService.isConnected() && wsConnectionStatus !== 'connecting' || isThreadLoading || !canSendMessage}
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isLoading || !websocketService.isConnected() || isThreadLoading || !canSendMessage}
              className="px-4 py-2 bg-gradient-to-r from-coral-600 to-brick-700 text-white rounded-lg hover:from-coral-700 hover:to-brick-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <PaperAirplaneIcon className="w-4 h-4" />
            </button>
          </div>
          
          {/* Connection warning */}
          {!websocketService.isConnected() && wsConnectionStatus !== 'connecting' && (
            <div className="mt-2 text-sm text-red-600 flex items-center space-x-1">
              <ExclamationTriangleIcon className="w-4 h-4" />
              <span>Not connected to AI. Messages may not be processed.</span>
            </div>
          )}
          
          {/* Turn-based chat warning */}
          {!canSendMessage && (
            <div className="mt-2 text-sm text-blue-600 flex items-center space-x-1">
              <ExclamationTriangleIcon className="w-4 h-4" />
              <span>Please wait for the AI to respond before sending another message.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Thread; 