import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from './Card';
import { Button } from './Button';
import { FolderIcon, SettingsIcon } from 'lucide-react';
import type { Workspace } from '../../types';

interface WorkspaceCardProps {
  workspace: Workspace;
  onWorkspaceClick?: (workspace: Workspace) => void;
}

export const WorkspaceCard: React.FC<WorkspaceCardProps> = ({ workspace, onWorkspaceClick }) => {
  const navigate = useNavigate();

  const handleWorkspaceClick = () => {
    if (onWorkspaceClick) {
      onWorkspaceClick(workspace);
    }
    navigate(`/workspaces/${workspace.id}`);
  };

  return (
    <Card
      className="border-2 border-gray-300 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-400 hover:shadow-lg cursor-pointer transition-all duration-200 group bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-700"
      onClick={handleWorkspaceClick}
    >
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="bg-blue-100 dark:bg-blue-900/30 group-hover:bg-blue-200 dark:group-hover:bg-blue-900/50 rounded-lg p-3 transition-colors duration-200">
            <FolderIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 px-2 py-1 rounded-full">
              Active
            </span>
            <button 
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-600 rounded transition-colors duration-200"
              onClick={(e) => {
                e.stopPropagation();
                // TODO: Add workspace settings
              }}
            >
              <SettingsIcon className="h-4 w-4 text-gray-400 dark:text-gray-500" />
            </button>
          </div>
        </div>
        
        <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100 group-hover:text-blue-900 dark:group-hover:text-blue-400 mb-2 transition-colors duration-200">
          {workspace.name}
        </h3>
        
        <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">
          {workspace.description || 'No description provided'}
        </p>
        
        <div className="space-y-2 text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center justify-between">
            <span>Subscription:</span>
            <span className="capitalize font-medium">{workspace.subscription_name || 'Free'}</span>
          </div>
        </div>
        
        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-600">
          <Button 
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded transition-colors duration-200"
            onClick={(e) => {
              e.stopPropagation();
              handleWorkspaceClick();
            }}
          >
            Open Workspace
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
