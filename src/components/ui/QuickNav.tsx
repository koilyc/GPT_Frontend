import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LayersIcon, ClockIcon } from 'lucide-react';
import { useRecentWorkspaces } from '../../hooks';

interface QuickNavProps {
  currentWorkspaceId?: number;
  currentProjectId?: number;
}

export const QuickNav: React.FC<QuickNavProps> = ({ currentWorkspaceId }) => {
  const navigate = useNavigate();
  const { recentWorkspaces, isLoading, getTimeAgo } = useRecentWorkspaces();

  // Show top 10 recent workspaces
  const displayWorkspaces = recentWorkspaces.slice(0, 10);

  if (isLoading) {
    return (
      <div className="px-3 py-2 text-xs text-gray-500">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  if (displayWorkspaces.length === 0) {
    return (
      <div className="px-3 py-2 text-xs text-gray-500">
        No recent workspaces
      </div>
    );
  }

  return (
    <div className="space-y-0.5 py-2">
      <div className="px-3 pb-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center space-x-1">
        <ClockIcon className="w-3 h-3" />
        <span>Recent</span>
      </div>
      
      {displayWorkspaces.map((workspace) => {
        const isActive = workspace.id === currentWorkspaceId;
        
        return (
          <button
            key={workspace.id}
            onClick={() => navigate(`/workspaces/${workspace.id}`)}
            className={`w-full flex items-center space-x-2 px-3 py-2 rounded-md text-sm transition-colors group ${
              isActive
                ? 'bg-gray-800 dark:bg-gray-700 text-white font-medium'
                : 'text-gray-400 hover:bg-gray-800/50 dark:hover:bg-gray-700/50 hover:text-white'
            }`}
            title={`${workspace.name}${workspace.lastAccessed ? ` • ${getTimeAgo(workspace.lastAccessed)}` : ''}`}
          >
            <LayersIcon className={`w-4 h-4 flex-shrink-0 ${
              isActive 
                ? 'text-purple-400' 
                : 'text-gray-500 group-hover:text-purple-400'
            }`} />
            <span className="truncate flex-1 text-left">{workspace.name}</span>
            {isActive && (
              <div className="w-1.5 h-1.5 rounded-full bg-purple-400 flex-shrink-0" />
            )}
          </button>
        );
      })}
    </div>
  );
};
