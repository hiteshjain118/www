import React from 'react';
import { ChevronRightIcon, ChevronLeftIcon } from '@heroicons/react/24/outline';
import Pipelines from './Pipelines';

interface RightSidebarProps {
  userCbid: string;
  selectedPipelineId?: string;
  onPipelineSelect?: (pipelineId: string) => void;
  onPipelineCreate?: (pipelineId: string) => void;
  isCollapsed: boolean;
  onToggle: () => void;
  contextPipelines?: any[];
}

const RightSidebar: React.FC<RightSidebarProps> = ({
  userCbid,
  selectedPipelineId,
  onPipelineSelect,
  onPipelineCreate,
  isCollapsed,
  onToggle,
  contextPipelines
}) => {
  return (
    <>
      {/* Toggle Button */}
      <div className="flex-shrink-0 flex items-center justify-center w-6 bg-gray-100 border-l border-gray-200">
        <button
          onClick={onToggle}
          className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded transition-colors"
          title={isCollapsed ? "Show Pipelines" : "Hide Pipelines"}
        >
          {isCollapsed ? (
            <ChevronLeftIcon className="h-4 w-4" />
          ) : (
            <ChevronRightIcon className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Right Sidebar Content */}
      {!isCollapsed && (
        <div className="w-64 bg-gray-50 border-l border-gray-200 flex flex-col h-full">
          <Pipelines
            userCbid={userCbid}
            selectedPipelineId={selectedPipelineId}
            onPipelineSelect={onPipelineSelect}
            onPipelineCreate={onPipelineCreate}
            contextPipelines={contextPipelines}
          />
        </div>
      )}
    </>
  );
};

export default RightSidebar; 