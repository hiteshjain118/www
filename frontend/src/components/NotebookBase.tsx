import React, { useState } from 'react';
import { 
  PlayIcon,
  StopIcon,
  DocumentIcon,
  CheckCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

export interface NotebookCell {
  id: string;
  type: 'code' | 'markdown' | 'output';
  content: string;
  output?: string;
  isExecuting?: boolean;
  executionCount?: number;
  language?: string;
}

interface NotebookBaseProps {
  title: string;
  subtitle: string;
  cells: NotebookCell[];
  onExecuteCell?: (cellId: string) => void;
}

const NotebookBase: React.FC<NotebookBaseProps> = ({ 
  title, 
  subtitle, 
  cells, 
  onExecuteCell 
}) => {
  const [executingCells, setExecutingCells] = useState<Set<string>>(new Set());

  const handleExecuteCell = (cellId: string) => {
    if (onExecuteCell) {
      setExecutingCells(prev => new Set([...prev, cellId]));
      onExecuteCell(cellId);
      
      // Simulate execution time
      setTimeout(() => {
        setExecutingCells(prev => {
          const newSet = new Set(prev);
          newSet.delete(cellId);
          return newSet;
        });
      }, 1500);
    }
  };

  const renderCell = (cell: NotebookCell, index: number) => {
    const isExecuting = executingCells.has(cell.id);
    
    if (cell.type === 'markdown') {
      return (
        <div key={cell.id} className="mb-4">
          <div className="bg-white border border-gray-200 rounded-lg">
            <div className="p-4">
              <div className="prose prose-sm max-w-none">
                <div dangerouslySetInnerHTML={{ __html: cell.content }} />
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (cell.type === 'code') {
      return (
        <div key={cell.id} className="mb-4">
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            {/* Cell Header */}
            <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-b border-gray-200">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-mono text-gray-500">
                  [{cell.executionCount || ' '}]:
                </span>
                <span className="text-xs text-gray-600">{cell.language || 'python'}</span>
              </div>
              <div className="flex items-center space-x-2">
                {isExecuting ? (
                  <div className="flex items-center space-x-1">
                    <ClockIcon className="h-4 w-4 text-yellow-500 animate-spin" />
                    <span className="text-xs text-yellow-600">Running...</span>
                  </div>
                ) : (
                  <button
                    onClick={() => handleExecuteCell(cell.id)}
                    className="flex items-center space-x-1 px-2 py-1 text-xs bg-blue-100 text-blue-700 hover:bg-blue-200 rounded transition-colors"
                  >
                    <PlayIcon className="h-3 w-3" />
                    <span>Run</span>
                  </button>
                )}
              </div>
            </div>
            
            {/* Code Content */}
            <div className="p-4">
              <pre className="text-sm bg-gray-900 text-gray-100 p-3 rounded overflow-x-auto">
                <code>{cell.content}</code>
              </pre>
            </div>
            
            {/* Output */}
            {cell.output && (
              <div className="border-t border-gray-200">
                <div className="px-4 py-2 bg-gray-50">
                  <div className="flex items-center space-x-2">
                    <CheckCircleIcon className="h-4 w-4 text-green-500" />
                    <span className="text-xs text-gray-600">Output:</span>
                  </div>
                </div>
                <div className="p-4">
                  <div className="bg-white border border-gray-200 rounded p-3">
                    <pre className="text-sm whitespace-pre-wrap text-gray-800">
                      {cell.output}
                    </pre>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Notebook Header */}
      <div className="border-b border-gray-200 p-4 bg-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <DocumentIcon className="h-5 w-5 text-orange-500" />
            <div>
              <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
              <p className="text-sm text-gray-500">{subtitle}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span className="text-xs text-green-600">Kernel Ready</span>
            </div>
          </div>
        </div>
      </div>

      {/* Notebook Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto">
          {cells.map((cell, index) => renderCell(cell, index))}
        </div>
      </div>

      {/* Notebook Footer */}
      <div className="border-t border-gray-200 p-3 bg-gray-50">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center space-x-4">
            <span>Python 3.9.7</span>
            <span>•</span>
            <span>{cells.filter(c => c.type === 'code').length} cells</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div>
            <span>Connected</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotebookBase; 