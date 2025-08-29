import React from 'react';
import Threads from './Threads';
import Pipelines from './Pipelines';

interface SidebarProps {
  userCbid: string;
  selectedThreadId?: string;
  selectedPipelineId?: string;
  onThreadSelect?: (threadId: string) => void;
  onThreadCreate?: (threadId: string) => void;
  onPipelineSelect?: (pipelineId: string) => void;
  onPipelineCreate?: (pipelineId: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  userCbid,
  selectedThreadId,
  selectedPipelineId,
  onThreadSelect, 
  onThreadCreate,
  onPipelineSelect,
  onPipelineCreate
}) => {
  return (
    <div className="w-80 bg-gray-50 border-r border-gray-200 flex flex-col h-full">
      {/* Threads section with its own scroll */}
      <div className="flex-shrink-0">
        <Threads
          userCbid={userCbid}
          selectedThreadId={selectedThreadId}
          onThreadSelect={onThreadSelect}
          onThreadCreate={onThreadCreate}
        />
      </div>
      
      {/* Pipelines section with its own scroll */}
      <div className="flex-1 min-h-0">
        <Pipelines
          userCbid={userCbid}
          selectedPipelineId={selectedPipelineId}
          onPipelineSelect={onPipelineSelect}
          onPipelineCreate={onPipelineCreate}
        />
      </div>
    </div>
  );
};

export default Sidebar; 