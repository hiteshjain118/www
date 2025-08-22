import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import apiClient, { Thread as ThreadType, ThreadMessage } from '../services/api';
import Sidebar from '../components/Sidebar';
import { 
  PaperAirplaneIcon,
  SparklesIcon,
  ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  threadId?: string;
}



const Thread: React.FC = () => {
  const { threadId } = useParams<{ threadId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentThread, setCurrentThread] = useState<ThreadType | null>(null);
  const [selectedThreadId, setSelectedThreadId] = useState<string | undefined>(threadId);
  
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!user || !user.cbid) {
      navigate('/login');
      return;
    }
  }, [user, navigate]);

  // Load thread data when threadId changes
  useEffect(() => {
    if (threadId && user?.cbid) {
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

  const initializeWelcomeMessage = () => {
    const displayName = user?.email?.split('@')[0] || 'there';
    const welcomeMessage: Message = {
      id: 'welcome',
      text: `Hi ${displayName}! I'm your AI agent builder. Tell me what kind of agent you'd like to create and I'll help you build it step by step.`,
      sender: 'ai',
      timestamp: new Date()
    };
    setMessages([welcomeMessage]);
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
            // Determine if this is a user or AI message based on senderId
            // For now, assume if senderId equals current user's cbid, it's user message
            const isUserMessage = msg.senderId === user.cbid;
            
            threadMessages.push({
              id: msg.cbId,
              text: msg.body,
              sender: isUserMessage ? 'user' : 'ai',
              timestamp: new Date(msg.createdAt),
              threadId: threadId
            });
          });
        } else {
          // No messages yet, add welcome message
          threadMessages.push({
            id: `welcome-${threadId}`,
            text: `Welcome back to Thread ${threadId.slice(-6)}! Continue building your agent...`,
            sender: 'ai',
            timestamp: new Date(),
            threadId: threadId
          });
        }
        
        setMessages(threadMessages);
      }
    } catch (error) {
      console.error('Error loading thread:', error);
      // Show error message
      const errorMessage: Message = {
        id: `error-${threadId}`,
        text: `Error loading thread ${threadId.slice(-6)}. Starting fresh...`,
        sender: 'ai',
        timestamp: new Date(),
        threadId: threadId
      };
      setMessages([errorMessage]);
    }
  };

  const handleThreadSelect = (newThreadId: string) => {
    setSelectedThreadId(newThreadId);
    navigate(`/thread/${newThreadId}`);
  };

  const handleThreadCreate = async (newThreadId: string) => {
    setSelectedThreadId(newThreadId);
    navigate(`/thread/${newThreadId}`);
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !user?.cbid) return;

    const messageText = inputMessage;
    const userMessage: Message = {
      id: Date.now().toString(),
      text: messageText,
      sender: 'user',
      timestamp: new Date(),
      threadId: selectedThreadId
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Save user message to database if we have a thread
      if (selectedThreadId) {
        await apiClient.createMessage(selectedThreadId, user.cbid, messageText);
      }

      // Simulate AI response for now
      setTimeout(async () => {
        const aiResponseText = `I understand you want to create an agent that can ${messageText.toLowerCase()}. Let me help you design the workflow for this agent. What specific data sources or integrations do you need?`;
        
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: aiResponseText,
          sender: 'ai',
          timestamp: new Date(),
          threadId: selectedThreadId
        };
        
        setMessages(prev => [...prev, aiMessage]);

        // Save AI message to database if we have a thread
        if (selectedThreadId) {
          try {
            await apiClient.createMessage(selectedThreadId, user.cbid, aiResponseText, "0"); // Use "0" for AI receiver
          } catch (error) {
            console.error('Error saving AI message:', error);
          }
        }
        
        setIsLoading(false);
      }, 1000);

    } catch (error) {
      console.error('Error sending message:', error);
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "I'm sorry, I'm having trouble connecting to the server. Please check your connection and try again.",
        sender: 'ai',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!user) {
    return null; // Will redirect to login
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-coral-50 to-brick-50 flex">
      {/* Left Panel - Threads Sidebar */}
      <Sidebar 
        userCbid={user.cbid}
        selectedThreadId={selectedThreadId}
        onThreadSelect={handleThreadSelect}
        onThreadCreate={handleThreadCreate}
                    onPipelineSelect={(pipelineId) => navigate(`/pipeline/${pipelineId}`)}
        onPipelineCreate={(pipelineId) => console.log('Pipeline created:', pipelineId)}
      />

      {/* Main Content - Agent Builder */}
      <div className="flex-1 flex">
        {/* Chat Panel */}
        <div className="w-3/5 bg-white flex flex-col border-r border-gray-200">
          {/* Chat Header */}
          <div className="p-4 border-b border-gray-200 bg-white">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-coral-600 to-brick-600 rounded-full flex items-center justify-center">
                <ChatBubbleLeftRightIcon className="w-4 h-4 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">AI Agent Builder</h2>
                <p className="text-sm text-gray-500">
                  {currentThread ? `Thread ${currentThread.cbId.slice(-6)}` : 'New conversation'}
                </p>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-xs lg:max-w-lg xl:max-w-xl px-4 py-2 rounded-lg ${
                  message.sender === 'user' 
                    ? 'bg-gradient-to-r from-coral-600 to-brick-600 text-white' 
                    : 'bg-gray-100 text-gray-900'
                }`}>
                  <div className="text-sm whitespace-pre-wrap">{message.text}</div>
                  <div className="text-xs mt-1 opacity-70">
                    {message.timestamp.toLocaleTimeString()}
                  </div>
                </div>
              </motion.div>
            ))}
            
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

          {/* Input */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex space-x-3">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Describe your agent idea and I'll help you build it..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-coral-500 focus:border-transparent"
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || isLoading}
                className="px-4 py-2 bg-gradient-to-r from-coral-600 to-brick-600 text-white rounded-lg hover:from-coral-700 hover:to-brick-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <PaperAirplaneIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Right Panel - Agent Preview */}
        <div className="w-2/5 bg-white flex flex-col">
          {/* Preview Header */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-full flex items-center justify-center">
                <SparklesIcon className="w-3 h-3 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 text-sm">Agent Preview</h3>
                <p className="text-xs text-gray-500">Your agent will appear here as you build it</p>
              </div>
            </div>
          </div>

          {/* Preview Content */}
          <div className="flex-1 p-4 flex items-center justify-center">
            <div className="text-center text-gray-400">
              <SparklesIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-sm">Start describing your agent to see the preview</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Thread; 