import React, { useState } from 'react';
import { useWorkspaces, useForm, useRecentWorkspaces } from '../../hooks';
import { Layout } from '../layout/Layout';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { LoadingState } from '../ui/LoadingState';
import { EmptyState } from '../ui/EmptyState';
import { WorkspaceCard } from '../ui/WorkspaceCard';
import { Pagination } from '../ui/Pagination';
import { SearchBar } from '../ui/SearchBar';
import { PlusIcon, FolderIcon, XIcon, SortAscIcon, SortDescIcon } from 'lucide-react';
import type { CreateWorkspaceRequest } from '../../types';

export const WorkspacePage: React.FC = () => {
  const { 
    workspaces, 
    totalCount,
    isLoading, 
    params,
    createWorkspace,
    goToPage,
    changePageSize,
    searchWorkspaces,
    sortWorkspaces
  } = useWorkspaces({ page: 1, limit: 12 }); // 使用網格布局適合的數量
  
  const { addToRecent } = useRecentWorkspaces();
  
  const [createMode, setCreateMode] = useState(false);
  const [sortField, setSortField] = useState<string>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const form = useForm<CreateWorkspaceRequest>({
    initialValues: {
      name: '',
      description: '',
    },
    validate: (values) => {
      const errors: Partial<Record<keyof CreateWorkspaceRequest, string>> = {};
      if (!values.name.trim()) {
        errors.name = 'Workspace name is required';
      }
      return errors;
    },
    onSubmit: async (values) => {
      await createWorkspace(values);
      setCreateMode(false);
    },
  });

  const handleSort = (field: string) => {
    const newOrder = sortField === field && sortOrder === 'asc' ? 'desc' : 'asc';
    setSortField(field);
    setSortOrder(newOrder);
    sortWorkspaces(field, newOrder);
  };

  if (isLoading) {
    return (
      <Layout>
        <LoadingState />
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
                  Workspaces 🏢
                </h1>
                <p className="text-lg text-gray-600 dark:text-gray-400">
                  Create and manage your AI vision workspaces. ({totalCount} workspaces)
                </p>
              </div>
              <Button 
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 dark:from-blue-500 dark:to-indigo-500 dark:hover:from-blue-600 dark:hover:to-indigo-600 text-white px-6 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                onClick={() => setCreateMode(true)}
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Create Workspace
              </Button>
            </div>

            {/* 搜尋和排序工具列 */}
            <div className="mt-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="flex-1 max-w-md">
                <SearchBar
                  placeholder="搜尋 workspace..."
                  onSearch={searchWorkspaces}
                  defaultValue={params.search || ''}
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">排序：</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSort('name')}
                  className="flex items-center space-x-1"
                >
                  <span>名稱</span>
                  {sortField === 'name' && (
                    sortOrder === 'asc' ? 
                      <SortAscIcon className="w-4 h-4" /> : 
                      <SortDescIcon className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Create Workspace Modal */}
          {createMode && (
            <Card className="mb-8 shadow-lg border-0 bg-white dark:bg-gray-800">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-b border-gray-100 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center">
                    <PlusIcon className="h-6 w-6 text-blue-600 dark:text-blue-400 mr-2" />
                    Create New Workspace
                  </CardTitle>
                  <Button 
                    variant="outline"
                    onClick={() => {
                      setCreateMode(false);
                      form.reset();
                    }}
                    className="p-2"
                  >
                    <XIcon className="h-5 w-5" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <form onSubmit={form.handleSubmit} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Workspace Name *
                    </label>
                    <Input
                      value={form.values.name}
                      onChange={(e) => form.setValue('name', e.target.value)}
                      placeholder="Enter workspace name"
                      className={form.errors.name ? 'border-red-500' : ''}
                    />
                    {form.errors.name && (
                      <p className="text-red-500 text-sm mt-1">{form.errors.name}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <Input
                      value={form.values.description || ''}
                      onChange={(e) => form.setValue('description', e.target.value)}
                      placeholder="Enter workspace description (optional)"
                    />
                  </div>

                  <div className="flex space-x-4">
                    <Button
                      type="submit"
                      disabled={form.isSubmitting}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors duration-200"
                    >
                      {form.isSubmitting ? 'Creating...' : 'Create Workspace'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setCreateMode(false);
                        form.reset();
                      }}
                      className="px-6 py-2"
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Workspaces Grid */}
          <Card className="shadow-lg border-0 bg-white dark:bg-gray-800">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-b border-gray-100 dark:border-gray-700">
              <CardTitle className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center">
                <FolderIcon className="h-6 w-6 text-blue-600 dark:text-blue-400 mr-2" />
                All Workspaces
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {workspaces.length === 0 ? (
                <div className="p-6">
                  <EmptyState
                    icon={FolderIcon}
                    title="No workspaces found"
                    description={
                      params.search 
                        ? `No workspaces found matching "${params.search}". Try adjusting your search terms.`
                        : "Create your first workspace to start organizing your AI vision projects and datasets."
                    }
                    action={{
                      label: "Create Your First Workspace",
                      onClick: () => setCreateMode(true)
                    }}
                  />
                </div>
              ) : (
                <>
                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {workspaces.map((workspace) => (
                        <WorkspaceCard 
                          key={workspace.id} 
                          workspace={workspace} 
                          onWorkspaceClick={addToRecent}
                        />
                      ))}
                    </div>
                  </div>
                  
                  {/* 分頁控制 */}
                  {totalCount > params.limit! && (
                    <Pagination
                      currentPage={params.page || 1}
                      totalCount={totalCount}
                      pageSize={params.limit || 12}
                      onPageChange={goToPage}
                      onPageSizeChange={changePageSize}
                    />
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};
