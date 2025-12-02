import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { FolderIcon, PlusIcon, XIcon, EyeIcon, SettingsIcon } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { LoadingState } from '../ui/LoadingState';
import { EmptyState } from '../ui/EmptyState';
import { StatCard } from '../ui/StatCard';
import { Layout } from '../layout/Layout';
import { useProjects } from '../../hooks/useProjects';
import { useWorkspaces } from '../../hooks/useWorkspaces';
import { useForm } from '../../hooks/useForm';
import type { CreateProjectRequest } from '../../types';

export const ProjectPage: React.FC = () => {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const { workspaces } = useWorkspaces();
  const { projects, isLoading, createProject } = useProjects(workspaceId);
  const [createMode, setCreateMode] = useState(false);

  const workspace = workspaceId ? workspaces.find(w => w.id === parseInt(workspaceId)) : null;

  const form = useForm<CreateProjectRequest>({
    initialValues: {
      name: '',
      description: '',
      workspace_id: workspaceId || '',
      type: 'classification',
    },
    validate: (values) => {
      const errors: Partial<Record<keyof CreateProjectRequest, string>> = {};
      if (!values.name.trim()) {
        errors.name = 'Project name is required';
      }
      if (!values.workspace_id) {
        errors.workspace_id = 'Workspace ID is required';
      }
      return errors;
    },
    onSubmit: async (values) => {
      await createProject(values);
      setCreateMode(false);
    },
  });

  if (isLoading) {
    return (
      <Layout>
        <LoadingState message="Loading projects..." />
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
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                  {workspace.name} Projects 📁
                </h1>
                <p className="text-lg text-gray-600 dark:text-gray-400">
                  Manage AI vision projects in this workspace.
                </p>
              </div>
              <Button 
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 dark:from-green-500 dark:to-emerald-500 dark:hover:from-green-600 dark:hover:to-emerald-600 text-white px-6 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                onClick={() => setCreateMode(true)}
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Create Project
              </Button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <StatCard
              title="Total Projects"
              value={projects.length}
              icon={FolderIcon}
              iconColor="text-white"
              iconBgColor="bg-blue-500"
            />
            <StatCard
              title="Active Projects"
              value={projects.length} // You can add status logic here
              icon={EyeIcon}
              iconColor="text-white"
              iconBgColor="bg-green-500"
            />
            <StatCard
              title="Configuration"
              value="Settings"
              icon={SettingsIcon}
              iconColor="text-white"
              iconBgColor="bg-purple-500"
            />
          </div>

          {/* Create Project Modal */}
          {createMode && (
            <Card className="mb-8 shadow-lg border-0 bg-white">
              <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl font-bold text-gray-900 flex items-center">
                    <PlusIcon className="h-6 w-6 text-green-600 mr-2" />
                    Create New Project
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
                      Project Name *
                    </label>
                    <Input
                      value={form.values.name}
                      onChange={(e) => form.setValue('name', e.target.value)}
                      placeholder="Enter project name"
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
                      placeholder="Enter project description (optional)"
                    />
                  </div>

                  <div className="flex space-x-4">
                    <Button
                      type="submit"
                      disabled={form.isSubmitting}
                      className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg transition-colors duration-200"
                    >
                      {form.isSubmitting ? 'Creating...' : 'Create Project'}
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

          {/* Projects Grid */}
          <Card className="shadow-lg border-0 bg-white">
            <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b border-gray-100">
              <CardTitle className="text-xl font-bold text-gray-900 flex items-center">
                <FolderIcon className="h-6 w-6 text-green-600 mr-2" />
                All Projects ({projects.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {projects.length === 0 ? (
                <EmptyState
                  icon={FolderIcon}
                  title="No projects yet"
                  description="Create your first project to start building AI vision models and managing datasets."
                  action={{
                    label: "Create Your First Project",
                    onClick: () => setCreateMode(true)
                  }}
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {projects.map((project) => (
                    <Card key={project.id} className="hover:shadow-lg transition-shadow duration-200 border border-gray-200">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="w-12 h-12 bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl flex items-center justify-center">
                            <FolderIcon className="w-6 h-6 text-white" />
                          </div>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">{project.name}</h3>
                        {project.description && (
                          <p className="text-gray-600 text-sm mb-4">{project.description}</p>
                        )}
                        <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                          <span>Created {new Date(project.created_at || '').toLocaleDateString()}</span>
                        </div>
                        <div className="space-y-2">
                          <Button
                            className="w-full bg-green-600 hover:bg-green-700 text-white"
                            onClick={() => window.location.href = `/workspaces/${workspaceId}/projects/${project.id}`}
                          >
                            Open Project
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
