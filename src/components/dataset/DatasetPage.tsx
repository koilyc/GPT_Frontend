import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FolderIcon, PlusIcon, XIcon, ImageIcon, UploadIcon, ArrowLeftIcon } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { LoadingState } from '../ui/LoadingState';
import { EmptyState } from '../ui/EmptyState';
import { StatCard } from '../ui/StatCard';
import { Layout } from '../layout/Layout';
import { Breadcrumb } from '../ui/Breadcrumb';
import { useDatasets } from '../../hooks/useDatasets';
import { useWorkspaces } from '../../hooks/useWorkspaces';
import { useForm } from '../../hooks/useForm';
import { imageAPI } from '../../api';
import type { CreateDatasetRequest } from '../../types';

export const DatasetPage: React.FC = () => {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const navigate = useNavigate();
  const { workspaces } = useWorkspaces();
  const { datasets, isLoading, createDataset } = useDatasets(workspaceId);
  const [createMode, setCreateMode] = useState(false);
  const [imageCount, setImageCount] = useState<Record<number, number>>({});

  const workspace = workspaceId ? workspaces.find(w => w.id === parseInt(workspaceId)) : null;

  const form = useForm<CreateDatasetRequest>({
    initialValues: {
      name: '',
      description: '',
    },
    validate: (values) => {
      const errors: Partial<Record<keyof CreateDatasetRequest, string>> = {};
      if (!values.name.trim()) {
        errors.name = 'Dataset name is required';
      }
      return errors;
    },
    onSubmit: async (values) => {
      await createDataset(values);
      setCreateMode(false);
    },
  });

  // Load image count for each dataset
  useEffect(() => {
    const loadImageCounts = async () => {
      if (!workspaceId || datasets.length === 0) return;
      
      const counts: Record<number, number> = {};
      await Promise.all(
        datasets.map(async (dataset) => {
          try {
            const result = await imageAPI.getAll(parseInt(workspaceId), dataset.id, { limit: 1 });
            counts[dataset.id] = result.total_count;
          } catch (error) {
            console.error(`Failed to load image count for dataset ${dataset.id}:`, error);
            counts[dataset.id] = 0;
          }
        })
      );
      setImageCount(counts);
    };

    loadImageCounts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceId, datasets.length, datasets.map(d => d.id).join(',')]);

  if (isLoading) {
    return (
      <Layout>
        <LoadingState message="Loading datasets..." />
      </Layout>
    );
  }

  if (!workspace) {
    return (
      <Layout>
        <EmptyState
          icon={FolderIcon}
          title="Workspace not found"
          description="The workspace you're looking for doesn't exist or you don't have access to it."
        />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Breadcrumb Navigation */}
            <div className="flex items-center justify-between mb-6">
              <Breadcrumb 
                items={[
                  { label: 'Workspaces', href: '/workspaces' },
                  { label: workspace.name, href: `/workspaces/${workspaceId}` },
                  { label: 'Datasets', active: true }
                ]}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(`/workspaces/${workspaceId}`)}
                className="flex items-center space-x-2"
              >
                <ArrowLeftIcon className="w-4 h-4" />
                <span>Back to Workspace</span>
              </Button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                  {workspace.name} Datasets 📊
                </h1>
                <p className="text-lg text-gray-600 dark:text-gray-400">
                  Upload and manage image datasets for AI training.
                </p>
              </div>
              <Button 
                className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 dark:from-purple-500 dark:to-indigo-500 dark:hover:from-purple-600 dark:hover:to-indigo-600 text-white px-6 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                onClick={() => setCreateMode(true)}
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Create Dataset
              </Button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <StatCard
              title="Total Datasets"
              value={datasets.length}
              icon={FolderIcon}
              iconColor="text-white"
              iconBgColor="bg-purple-500"
            />
            <StatCard
              title="Total Images"
              value={Object.values(imageCount).reduce((sum, count) => sum + count, 0)}
              icon={ImageIcon}
              iconColor="text-white"
              iconBgColor="bg-blue-500"
            />
            <StatCard
              title="Storage"
              value="0 MB" // TODO: Add actual storage count
              icon={UploadIcon}
              iconColor="text-white"
              iconBgColor="bg-green-500"
            />
          </div>

          {/* Create Dataset Modal */}
          {createMode && (
            <Card className="mb-8 shadow-lg border-0 bg-white">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-indigo-50 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl font-bold text-gray-900 flex items-center">
                    <PlusIcon className="h-6 w-6 text-purple-600 mr-2" />
                    Create New Dataset
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
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Dataset Name *
                    </label>
                    <Input
                      value={form.values.name}
                      onChange={(e) => form.setValue('name', e.target.value)}
                      placeholder="Enter dataset name"
                      className={form.errors.name ? 'border-red-500' : ''}
                    />
                    {form.errors.name && (
                      <p className="text-red-500 text-sm mt-1">{form.errors.name}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Description
                    </label>
                    <Input
                      value={form.values.description || ''}
                      onChange={(e) => form.setValue('description', e.target.value)}
                      placeholder="Enter dataset description (optional)"
                    />
                  </div>

                  <div className="flex space-x-4">
                    <Button
                      type="submit"
                      disabled={form.isSubmitting}
                      className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg transition-colors duration-200"
                    >
                      {form.isSubmitting ? 'Creating...' : 'Create Dataset'}
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

          {/* Datasets Grid */}
          <Card className="shadow-lg border-0 bg-white">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-indigo-50 border-b border-gray-100">
              <CardTitle className="text-xl font-bold text-gray-900 flex items-center">
                <FolderIcon className="h-6 w-6 text-purple-600 mr-2" />
                All Datasets ({datasets.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {datasets.length === 0 ? (
                <EmptyState
                  icon={FolderIcon}
                  title="No datasets yet"
                  description="Create your first dataset to start uploading and organizing images for AI training."
                  action={{
                    label: "Create Your First Dataset",
                    onClick: () => setCreateMode(true)
                  }}
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {datasets.map((dataset) => (
                    <Card key={dataset.id} className="hover:shadow-lg transition-shadow duration-200 border-2 border-gray-300 dark:border-gray-600 hover:border-purple-300 dark:hover:border-purple-500">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-indigo-600 dark:from-purple-500 dark:to-indigo-500 rounded-xl flex items-center justify-center">
                            <FolderIcon className="w-6 h-6 text-white" />
                          </div>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">{dataset.name}</h3>
                        {dataset.description && (
                          <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">{dataset.description}</p>
                        )}
                        
                        {/* Stats */}
                        <div className="flex items-center gap-4 mb-4">
                          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                            <ImageIcon className="w-4 h-4 mr-1 text-blue-500" />
                            <span>{imageCount[dataset.id] ?? '...'} images</span>
                          </div>
                          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                            <FolderIcon className="w-4 h-4 mr-1 text-purple-500" />
                            <span>{dataset.project_count ?? 0} projects</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-4">
                          <span>Created {dataset.created_at ? new Date(dataset.created_at).toLocaleDateString() : 'Not available'}</span>
                        </div>
                        <div className="space-y-2">
                          <Button
                            className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                            onClick={() => window.location.href = `/workspaces/${workspaceId}/datasets/${dataset.id}`}
                          >
                            View Dataset
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};
