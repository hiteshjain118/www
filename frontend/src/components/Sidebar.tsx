import React from 'react';
import { DocumentIcon } from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import Threads from './Threads';

interface SidebarProps {
  userCbid: string;
  selectedThreadId?: string;
  selectedPipelineId?: string;
  onThreadSelect?: (threadId: string) => void;
  onThreadCreate?: (threadId: string) => void;
  onPipelineSelect?: (pipelineId: string) => void;
  onPipelineCreate?: (pipelineId: string) => void;
  showDemoThread?: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  userCbid,
  selectedThreadId,
  selectedPipelineId,
  onThreadSelect, 
  onThreadCreate,
  onPipelineSelect,
  onPipelineCreate,
  showDemoThread = false
}) => {
  const navigate = useNavigate();
  
  const handleDemoDashboardClick = (dashboardType: string) => {
    // Navigate to demo dashboard route using window.location to trigger route change
    window.location.href = `/demo/${dashboardType}`;
  };
  return (
    <div className="w-64 bg-gray-50 border-r border-gray-200 flex flex-col h-full overflow-hidden">
      {/* Threads section */}
      <div className="flex-shrink-0">
        <Threads
          userCbid={userCbid}
          selectedThreadId={selectedThreadId}
          onThreadSelect={onThreadSelect}
          onThreadCreate={onThreadCreate}
          showDemoThread={showDemoThread}
        />
      </div>
      
      {/* Dashboards section - Only show on demo pages */}
      {showDemoThread && (
        <div className="flex-shrink-0">
          {/* Dashboards Header */}
          <div className="px-4 py-2 border-b border-gray-200 bg-gray-100">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Dashboards</h3>
          </div>

          {/* Dashboards List */}
          <div className="py-2">
            <div
              onClick={() => handleDemoDashboardClick('dashboard')}
              className={`mx-2 mb-1 p-2 rounded-md cursor-pointer transition-colors duration-150 ${
                selectedThreadId === 'demo-dashboard'
                  ? 'bg-blue-100 border border-blue-200'
                  : 'hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-900 truncate">
                    May Launch Promotions
                  </p>
                </div>
                {selectedThreadId === 'demo-dashboard' && (
                  <div className="ml-2 flex-shrink-0">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notebooks Section - Only show on demo pages */}
      {showDemoThread && (
        <div className="flex-shrink-0">
          <div className="px-4 py-2 border-b border-gray-200 bg-gray-100">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Notebooks</h3>
          </div>
          <div className="py-2">
            <div
              onClick={() => navigate('/demo/notebook/metrics')}
              className={`mx-2 mb-1 p-2 rounded-md cursor-pointer transition-colors duration-150 ${
                selectedThreadId === 'notebook-metrics'
                  ? 'bg-blue-100 border border-blue-200'
                  : 'hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-900 truncate">
                    Launch Promotions
                  </p>
                </div>
                {selectedThreadId === 'notebook-metrics' && (
                  <div className="ml-2 flex-shrink-0">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  </div>
                )}
              </div>
            </div>

            <div
              onClick={() => navigate('/demo/notebook/churn')}
              className={`mx-2 mb-1 p-2 rounded-md cursor-pointer transition-colors duration-150 ${
                selectedThreadId === 'notebook-churn'
                  ? 'bg-blue-100 border border-blue-200'
                  : 'hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-900 truncate">
                    User Churn Predictor - ticket prioritization
                  </p>
                </div>
                {selectedThreadId === 'notebook-churn' && (
                  <div className="ml-2 flex-shrink-0">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sidebar; 