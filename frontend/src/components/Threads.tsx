import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Thread } from '../services/api';
import apiClient from '../services/api';

interface ThreadsProps {
  userCbid: string;
  selectedThreadId?: string;
  onThreadSelect?: (threadId: string) => void;
  onThreadCreate?: (threadId: string) => void;
}

const Threads: React.FC<ThreadsProps> = ({ 
  userCbid,
  selectedThreadId,
  onThreadSelect, 
  onThreadCreate
}) => {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [lastFetchTime, setLastFetchTime] = useState<number>(0);
  const fetchingRef = useRef<boolean>(false);

  useEffect(() => {
    if (userCbid) {
      fetchThreads();
    }
  }, [userCbid]);

  const fetchThreads = useCallback(async () => {
    const now = Date.now();
    if (now - lastFetchTime < 1000 || fetchingRef.current) { // Prevent calls within 1 second or if already fetching
      return;
    }
    setLastFetchTime(now);
    fetchingRef.current = true;

    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.getAllThreads(userCbid);
      
      if (response.success && response.data) {
        setThreads(response.data);
      } else {
        setError(response.error || 'Failed to fetch threads');
      }
    } catch (error) {
      console.error('Error fetching threads:', error);
      setError('Failed to fetch threads');
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  }, [userCbid, lastFetchTime]);

  const handleCreateThread = async () => {
    try {
      setCreating(true);
      setError(null);
      const response = await apiClient.createThread(userCbid);
      
      if (response.success && response.data) {
        // Refresh the threads list
        await fetchThreads();
        // Notify parent component
        if (onThreadCreate) {
          onThreadCreate(response.data.cbId);
        }
      } else {
        setError(response.error || 'Failed to create thread');
      }
    } catch (error) {
      console.error('Error creating thread:', error);
      setError('Failed to create thread');
    } finally {
      setCreating(false);
    }
  };

  const handleThreadClick = (threadId: string) => {
    if (onThreadSelect) {
      onThreadSelect(threadId);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const threadDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    
    if (threadDate.getTime() === today.getTime()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  return (
    <>
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-white">
        <button
          onClick={handleCreateThread}
          disabled={creating}
          className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center"
        >
          {creating ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 714 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Creating...
            </>
          ) : (
            <>
              <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create New Thread
            </>
          )}
        </button>
      </div>

      {/* Threads Section */}
      <div>
        {/* Threads Header */}
        <div className="px-4 py-2 border-b border-gray-200 bg-gray-100">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Threads</h3>
        </div>

        {/* Threads List - Fixed height with scroll */}
        <div className="h-64 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-gray-500">
              <svg className="animate-spin mx-auto h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 714 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p className="mt-2 text-xs">Loading threads...</p>
            </div>
          ) : error ? (
            <div className="p-4 text-center text-red-500">
              <svg className="mx-auto h-6 w-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.996-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <p className="mt-2 text-xs">{error}</p>
              <button
                onClick={fetchThreads}
                className="mt-2 text-blue-600 hover:text-blue-700 text-xs"
              >
                Try again
              </button>
            </div>
          ) : threads.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              <svg className="mx-auto h-8 w-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <p className="mt-2 text-xs">No threads yet</p>
              <p className="text-xs text-gray-400 mt-1">Create your first thread</p>
            </div>
          ) : (
            <div className="py-2">
              {threads.map((thread) => (
                <div
                  key={thread.cbId}
                  onClick={() => handleThreadClick(thread.cbId)}
                  className={`mx-2 mb-1 p-2 rounded-md cursor-pointer transition-colors duration-150 ${
                    selectedThreadId === thread.cbId
                      ? 'bg-blue-100 border border-blue-200'
                      : 'hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-900 truncate">
                        Thread {thread.cbId.slice(-6)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatDate(thread.createdAt)}
                      </p>
                    </div>
                    {selectedThreadId === thread.cbId && (
                      <div className="ml-2 flex-shrink-0">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Threads; 