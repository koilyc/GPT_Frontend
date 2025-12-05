import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useRecentWorkspaces } from '../../hooks';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { LoadingState } from '../ui/LoadingState';
import { EmptyState } from '../ui/EmptyState';
import { 
  ClockIcon, 
  FolderIcon, 
  XIcon, 
  ArrowRightIcon,
  StarIcon 
} from 'lucide-react';

export const RecentWorkspaces: React.FC = () => {
  const navigate = useNavigate();
  const { recentWorkspaces, isLoading, removeFromRecent, getTimeAgo } = useRecentWorkspaces();

  const handleWorkspaceClick = (workspaceId: number) => {
    navigate(`/workspaces/${workspaceId}`);
  };

  const handleRemoveFromRecent = (e: React.MouseEvent, workspaceId: number) => {
    e.stopPropagation();
    removeFromRecent(workspaceId);
  };

  if (isLoading) {
    return (
      <Card className="shadow-lg border-0 bg-white dark:bg-gray-800">
        <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-b border-gray-100 dark:border-gray-700">
          <CardTitle className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center">
            <ClockIcon className="h-6 w-6 text-purple-600 dark:text-purple-400 mr-2" />
            Recent Workspaces
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <LoadingState message="Loading recent workspaces..." />
        </CardContent>
      </Card>
    );
  }

  if (recentWorkspaces.length === 0) {
    return (
      <Card className="shadow-lg border-0 bg-white dark:bg-gray-800">
        <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-b border-gray-100 dark:border-gray-700">
          <CardTitle className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center">
            <ClockIcon className="h-6 w-6 text-purple-600 dark:text-purple-400 mr-2" />
            Recent Workspaces
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <EmptyState
            icon={ClockIcon}
            title="No Recent Workspaces"
            description="Start working on a workspace to see it appear here"
            action={{
              label: "Browse Workspaces",
              onClick: () => navigate('/workspaces')
            }}
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg border-0 bg-white dark:bg-gray-800">
      <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-b border-gray-100 dark:border-gray-700">
        <CardTitle className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center justify-between">
          <div className="flex items-center">
            <ClockIcon className="h-6 w-6 text-purple-600 dark:text-purple-400 mr-2" />
            Recent Workspaces
          </div>
          <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
            {recentWorkspaces.length} workspace{recentWorkspaces.length !== 1 ? 's' : ''}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-3">
          {recentWorkspaces.map((workspace, index) => (
            <div
              key={workspace.id}
              onClick={() => handleWorkspaceClick(workspace.id)}
              className="group bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/10 dark:to-pink-900/10 p-4 rounded-lg border border-purple-200 dark:border-purple-700/50 cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-[1.02] hover:from-purple-100 hover:to-pink-100 dark:hover:from-purple-900/20 dark:hover:to-pink-900/20"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3 flex-1">
                  <div className="relative">
                    <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg shadow-sm group-hover:shadow-md transition-shadow duration-200">
                      <FolderIcon className="h-5 w-5 text-white" />
                    </div>
                    {index === 0 && (
                      <div className="absolute -top-1 -right-1 p-1 bg-yellow-400 rounded-full">
                        <StarIcon className="h-3 w-3 text-yellow-800" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                        {workspace.name}
                      </h3>
                      {index === 0 && (
                        <span className="text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 px-2 py-1 rounded-full font-medium">
                          Most Recent
                        </span>
                      )}
                    </div>
                    {workspace.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 truncate mt-1">
                        {workspace.description}
                      </p>
                    )}
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                      Last accessed {getTimeAgo(workspace.lastAccessed)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2 ml-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => handleRemoveFromRecent(e, workspace.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 border-gray-300 hover:border-red-300 hover:text-red-600 dark:border-gray-600 dark:hover:border-red-600 dark:hover:text-red-400"
                  >
                    <XIcon className="h-4 w-4" />
                  </Button>
                  <ArrowRightIcon className="h-5 w-5 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors duration-200" />
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {recentWorkspaces.length > 0 && (
          <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button 
              variant="outline" 
              onClick={() => navigate('/workspaces')}
              className="w-full border-purple-200 text-purple-600 hover:bg-purple-50 hover:border-purple-300 dark:border-purple-700 dark:text-purple-400 dark:hover:bg-purple-900/20 dark:hover:border-purple-600"
            >
              View All Workspaces
              <ArrowRightIcon className="h-4 w-4 ml-2" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
