import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store';
import { useWorkspaces } from '../../hooks';
import { Layout } from '../layout/Layout';
import { Button } from '../ui/Button';
import { StatCard } from '../ui/StatCard';
import { Card, CardContent } from '../ui/Card';
import { LoadingState } from '../ui/LoadingState';
import { RecentWorkspaces } from '../workspace/RecentWorkspaces';
import { 
  PlusIcon, 
  FolderIcon, 
  SettingsIcon,
  StarIcon
} from 'lucide-react';export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { totalCount, isLoading } = useWorkspaces({ offset: 0, limit: 3, order_by: 'id', desc: false });
  
  // Get current time for greeting
  const currentHour = new Date().getHours();
  const getGreeting = () => {
    if (currentHour < 12) return 'Good morning';
    if (currentHour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  if (isLoading) {
    return (
      <Layout>
        <LoadingState message="Loading dashboard..." />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                  {getGreeting()}, {user?.username || user?.email || 'User'}! 👋
                </h1>
                <p className="text-lg text-gray-600 dark:text-gray-400">
                  Welcome to your AI Vision Platform. Let's build something amazing today.
                </p>
              </div>
              <div className="flex space-x-3">
                <Button 
                  variant="outline"
                  onClick={() => navigate('/settings')}
                  className="flex items-center space-x-2"
                >
                  <SettingsIcon className="h-4 w-4" />
                  <span>Settings</span>
                </Button>
                <Button 
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 dark:from-blue-500 dark:to-indigo-500 dark:hover:from-blue-600 dark:hover:to-indigo-600 text-white px-6 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
                  onClick={() => navigate('/workspaces')}
                >
                  <PlusIcon className="h-5 w-5 mr-2" />
                  New Workspace
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Overview Stats */}
          <div className="mb-8">
            <StatCard
              title="Total Workspaces"
              value={totalCount.toString()}
              icon={FolderIcon}
              iconColor="text-white"
              iconBgColor="bg-gradient-to-r from-blue-500 to-blue-600"
            />
          </div>

          <div className="space-y-8">
            {/* Recent Workspaces */}
            <RecentWorkspaces />
          </div>

          {/* Getting Started Tips */}
          <Card className="mt-8 shadow-lg border-0 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/10 dark:to-indigo-900/10 border-blue-200 dark:border-blue-700">
            <CardContent className="p-6">
              <div className="flex items-start space-x-4">
                <div className="p-3 bg-blue-600 rounded-full">
                  <StarIcon className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">
                    Ready to get started?
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Create your first workspace to begin organizing your AI vision projects. You can upload datasets, train models, and collaborate with your team all in one place.
                  </p>
                  <div className="flex space-x-3">
                    <Button 
                      onClick={() => navigate('/workspaces')}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      Create Workspace
                    </Button>
                    <Button 
                      variant="outline"
                      className="border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white"
                    >
                      View Tutorial
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};
