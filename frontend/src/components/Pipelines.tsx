import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Pipeline } from '../services/api';
import apiClient from '../services/api';

interface PipelinesProps {
  userCbid: string;
  selectedPipelineId?: string;
  onPipelineSelect?: (pipelineId: string) => void;
  onPipelineCreate?: (pipelineId: string) => void;
}

const Pipelines: React.FC<PipelinesProps> = ({ 
  userCbid,
  selectedPipelineId,
  onPipelineSelect,
  onPipelineCreate
}) => {
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [lastFetchTime, setLastFetchTime] = useState<number>(0);
  const fetchingRef = useRef<boolean>(false);

  useEffect(() => {
    if (userCbid) {
      fetchPipelines();
    }
  }, [userCbid]);

  const fetchPipelines = useCallback(async () => {
    const now = Date.now();
    if (now - lastFetchTime < 1000 || fetchingRef.current) { // Prevent calls within 1 second or if already fetching
      return;
    }
    setLastFetchTime(now);
    fetchingRef.current = true;

    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.getAllPipelines(userCbid);
      
      if (response.success && response.data) {
        setPipelines(response.data);
      } else {
        setError(response.error || 'Failed to fetch pipelines');
      }
    } catch (error) {
      console.error('Error fetching pipelines:', error);
      setError('Failed to fetch pipelines');
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  }, [userCbid, lastFetchTime]);

  const handleCreatePipeline = async () => {
    try {
      setCreating(true);
      setError(null);
      
      // Prompt user for pipeline name
      const pipelineName = prompt('Enter a name for the new pipeline:') || undefined;
      
      const response = await apiClient.createPipeline(userCbid, pipelineName);
      
      if (response.success && response.data) {
        // Refresh the pipelines list
        await fetchPipelines();
        // Notify parent component
        if (onPipelineCreate) {
          onPipelineCreate(response.data.cbId);
        }
      } else {
        setError(response.error || 'Failed to create pipeline');
      }
    } catch (error) {
      console.error('Error creating pipeline:', error);
      setError('Failed to create pipeline');
    } finally {
      setCreating(false);
    }
  };

  const handlePipelineClick = (pipelineId: string) => {
    if (onPipelineSelect) {
      onPipelineSelect(pipelineId);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const pipelineDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    
    if (pipelineDate.getTime() === today.getTime()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  return (
    <div className="border-t border-gray-200">
      {/* Pipelines Header */}
      <div className="px-4 py-2 bg-gray-100 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Pipelines</h3>
        <button
          onClick={handleCreatePipeline}
          disabled={creating}
          className="text-xs bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white font-medium py-1 px-2 rounded transition-colors duration-200 flex items-center"
        >
          {creating ? (
            <>
              <svg className="animate-spin -ml-1 mr-1 h-3 w-3 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 714 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Creating...
            </>
          ) : (
            <>
              <svg className="mr-1 h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New
            </>
          )}
        </button>
      </div>

      {/* Pipelines List */}
      <div className="h-64 overflow-y-auto">
        {loading ? (
          <div className="p-4 text-center text-gray-500">
            <svg className="animate-spin mx-auto h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 818-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 714 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="mt-2 text-xs">Loading pipelines...</p>
          </div>
        ) : error ? (
          <div className="p-4 text-center text-red-500">
            <svg className="mx-auto h-6 w-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.996-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <p className="mt-2 text-xs">{error}</p>
            <button
              onClick={fetchPipelines}
              className="mt-2 text-blue-600 hover:text-blue-700 text-xs"
            >
              Try again
            </button>
          </div>
        ) : pipelines.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            <svg className="mx-auto h-8 w-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <p className="mt-2 text-xs">No pipelines yet</p>
            <p className="text-xs text-gray-400 mt-1">Create your first pipeline</p>
          </div>
        ) : (
          <div className="py-2">
            {pipelines.map((pipeline) => (
              <div
                key={pipeline.cbId}
                onClick={() => handlePipelineClick(pipeline.cbId)}
                className={`mx-2 mb-1 p-2 rounded-md cursor-pointer transition-colors duration-150 ${
                  selectedPipelineId === pipeline.cbId
                    ? 'bg-purple-100 border border-purple-200'
                    : 'hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center justify-between">
                                       <div className="flex-1 min-w-0">
                       <p className="text-xs font-medium text-gray-900 truncate">
                         {pipeline.name.trim() || `Pipeline ${pipeline.cbId.slice(-6)}`}
                       </p>
                       <p className="text-xs text-gray-500">
                         {formatDate(pipeline.createdAt)}
                       </p>
                       {pipeline.parentThread && (
                         <p className="text-xs text-purple-600">
                           → Thread {pipeline.parentThread.cbId.slice(-6)}
                         </p>
                       )}
                     </div>
                  {selectedPipelineId === pipeline.cbId && (
                    <div className="ml-2 flex-shrink-0">
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Pipelines; 