import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { 
  PaperAirplaneIcon,
  ChatBubbleLeftRightIcon,
  WifiIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

export interface TableAttachment {
  type: 'table';
  rows: (string | number)[][];
  columns: string[];
  title: string;
}

export interface DemoMessage {
  id: string;
  role: 'user' | 'agent';
  content: string;
  timestamp: Date;
  actions?: string[];
  attachment?: TableAttachment[];
  code?: string;
}

interface DemoProps {
  title: string;
  messages: DemoMessage[];
}

const Demo: React.FC<DemoProps> = ({ title, messages }) => {
  const { user, loading } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isCodeModalOpen, setIsCodeModalOpen] = useState(false);
  const [selectedCode, setSelectedCode] = useState<string>('');
  const [isTableModalOpen, setIsTableModalOpen] = useState(false);
  const [selectedTable, setSelectedTable] = useState<TableAttachment | null>(null);

  // Auto-scroll to bottom when component mounts
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // Handle escape key to close modals
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsCodeModalOpen(false);
        setIsTableModalOpen(false);
      }
    };

    if (isCodeModalOpen || isTableModalOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isCodeModalOpen, isTableModalOpen]);

  const openCodeModal = (code: string) => {
    setSelectedCode(code);
    setIsCodeModalOpen(true);
  };

  const closeCodeModal = () => {
    setIsCodeModalOpen(false);
    setSelectedCode('');
  };

  const openTableModal = (table: TableAttachment) => {
    setSelectedTable(table);
    setIsTableModalOpen(true);
  };

  const closeTableModal = () => {
    setIsTableModalOpen(false);
    setSelectedTable(null);
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

  const renderTable = (table: TableAttachment) => (
    <div className="mt-3 overflow-x-auto">
      <table className="min-w-full bg-white border border-gray-200 rounded-lg">
        <thead className="bg-gray-50">
          <tr>
            {table.columns.map((column, index) => (
              <th key={index} className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {table.rows.map((row, rowIndex) => (
            <tr key={rowIndex} className="hover:bg-gray-50">
              {row.map((cell, cellIndex) => (
                <td key={cellIndex} className="px-4 py-2 text-sm text-gray-900 border-b">
                  {typeof cell === 'number' ? cell.toLocaleString() : cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderActions = (actions: string[], code?: string, attachment?: TableAttachment[]) => (
    <div className="mt-2 flex flex-wrap gap-2">
      {actions.map((action, index) => (
        <button
          key={index}
          onClick={() => {
            if (action === 'View Code' && code) {
              openCodeModal(code);
            } else if (action === 'See All' && attachment && attachment[0]) {
              openTableModal(attachment[0]);
            }
          }}
          className="text-xs text-gray-500 hover:text-gray-700 underline transition-colors cursor-pointer"
        >
          {action}
        </button>
      ))}
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="border-b border-gray-200 p-4 bg-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <ChatBubbleLeftRightIcon className="h-5 w-5 text-gray-500 mr-2" />
            <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
          </div>
          <div className="flex items-center space-x-2">
            <div className="flex items-center">
              <WifiIcon className="h-4 w-4 text-green-500 mr-1" />
              <span className="text-xs text-green-600">Connected</span>
            </div>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 min-h-0">
        {messages.map((message) => {
          const isUserMessage = message.role === 'user';
          
          return (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${isUserMessage ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex items-end space-x-2 ${isUserMessage ? '' : ''}`}>
                <div className="flex flex-col">
                  <div className={`max-w-md lg:max-w-4xl xl:max-w-6xl px-4 py-2 rounded-lg ${
                    isUserMessage 
                      ? 'user-message' 
                      : 'bg-gray-100 text-gray-900'
                  }`}>
                    <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                    <div className={`text-xs mt-1 ${isUserMessage ? 'timestamp' : 'opacity-70'}`}>
                      {message.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                  
                  {/* Render actions outside the bubble */}
                  {message.actions && renderActions(message.actions, message.code, message.attachment)}
                </div>
                
                {/* Show acknowledgment status for user messages */}
                {isUserMessage && (
                  <div className="flex-shrink-0 mb-1 ml-2">
                    <div className="w-4 h-4 rounded-sm bg-gray-100 flex items-center justify-center" title="Message delivered">
                      <svg className="w-3 h-3 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-200 p-4 bg-white">
        <div className="flex items-center space-x-2">
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="This is a demo - input is disabled"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-coral-500 focus:border-transparent resize-none bg-gray-50 text-gray-500"
              disabled
            />
          </div>
          <button
            className="p-2 bg-gray-300 text-gray-500 rounded-lg cursor-not-allowed"
            disabled
          >
            <PaperAirplaneIcon className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-2 text-xs text-gray-500 text-center">
          This is a demo conversation. Input is disabled.
        </div>
      </div>

      {/* Code Modal */}
      {isCodeModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={closeCodeModal}>
          <div className="bg-white rounded-lg max-w-4xl max-h-[80vh] w-full mx-4 flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">Code</h3>
              <button
                onClick={closeCodeModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-4">
              <div className="bg-gray-900 text-gray-100 rounded-lg p-4 text-sm overflow-x-auto">
                <pre>{selectedCode.trim()}</pre>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Table Modal */}
      {isTableModalOpen && selectedTable && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={closeTableModal}>
          <div className="bg-white rounded-lg max-w-6xl max-h-[80vh] w-full mx-4 flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">{selectedTable.title}</h3>
              <button
                onClick={closeTableModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-4">
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                  <thead className="bg-gray-50">
                    <tr>
                      {selectedTable.columns.map((column, index) => (
                        <th key={index} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                          {column}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {selectedTable.rows.map((row, rowIndex) => (
                      <tr key={rowIndex} className="hover:bg-gray-50">
                        {row.map((cell, cellIndex) => (
                          <td key={cellIndex} className="px-6 py-4 text-sm text-gray-900 border-b">
                            {typeof cell === 'number' ? cell.toLocaleString() : cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="border-t border-gray-200 p-4 bg-gray-50">
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => {
                    // Handle continue in notebook action
                    console.log('Continue in notebook clicked');
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Continue in notebook
                </button>
                <button
                  onClick={() => {
                    // Handle add to dashboard action
                    console.log('Add to dashboard clicked');
                  }}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 transition-colors"
                >
                  Add to dashboard
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Demo; 