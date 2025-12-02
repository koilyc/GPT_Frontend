import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store';
import { useWorkspaceDetail, useTrainingJobs, useRecentWorkspaces } from '../../hooks';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Layout } from '../layout/Layout';
import { LoadingState } from '../ui/LoadingState';
import { EmptyState } from '../ui/EmptyState';
import { TrainingJobCard } from '../training/TrainingJobCard';
import { 
  PlusIcon, 
  FolderIcon, 
  DatabaseIcon, 
  BrainIcon,
  ImageIcon,
  UsersIcon,
  SettingsIcon,
  Zap
} from 'lucide-react';

// Types for component forms
interface CreateProjectForm {
  name: string;
  description: string;
  type: 'classification' | 'detection' | 'segmentation';
}

interface CreateDatasetForm {
  name: string;
  description: string;
}

export const WorkspaceDetailPage: React.FC = () => {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();

  // UI state - ALL HOOKS MUST BE CALLED FIRST
  const [activeTab, setActiveTab] = useState<'overview' | 'projects' | 'datasets' | 'training-jobs'>('overview');
  const [createProjectMode, setCreateProjectMode] = useState(false);
  const [createDatasetMode, setCreateDatasetMode] = useState(false);

  // Form state
  const [projectForm, setProjectForm] = useState<CreateProjectForm>({
    name: '',
    description: '',
    type: 'classification',
  });

  const [datasetForm, setDatasetForm] = useState<CreateDatasetForm>({
    name: '',
    description: '',
  });

  // Use the custom hook for workspace data management (must be called unconditionally)
  const {
    workspace,
    projects,
    datasets,
    loading,
    error,
    totalImages,
    recentProjects,
    loadWorkspaceData,
    createProject,
    createDataset,
  } = useWorkspaceDetail(workspaceId || '');

  // Recent workspaces hook
  const { addToRecent } = useRecentWorkspaces();

  // Training jobs hook
  const { trainingJobs, loading: trainingJobsLoading, error: trainingJobsError } = useTrainingJobs(workspaceId ? parseInt(workspaceId) : undefined);

  // Add workspace to recent list when it's loaded
  useEffect(() => {
    if (workspace) {
      addToRecent(workspace);
    }
  }, [workspace, addToRecent]);

  // Tab configuration
  const tabs = useMemo(() => [
    { id: 'overview' as const, label: 'Overview', icon: FolderIcon, count: null },
    { id: 'projects' as const, label: 'Projects', icon: BrainIcon, count: projects?.length || 0 },
    { id: 'datasets' as const, label: 'Datasets', icon: DatabaseIcon, count: datasets?.length || 0 },
    { id: 'training-jobs' as const, label: 'Training Jobs', icon: Zap, count: trainingJobs?.length || 0 },
  ], [projects, datasets, trainingJobs]);

  // Event handlers
  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createProject(projectForm);
      setCreateProjectMode(false);
      setProjectForm({ name: '', description: '', type: 'classification' });
    } catch (error) {
      console.error('Failed to create project:', error);
    }
  };

  const handleCreateDataset = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createDataset(datasetForm);
      setCreateDatasetMode(false);
      setDatasetForm({ name: '', description: '' });
    } catch (error) {
      console.error('Failed to create dataset:', error);
    }
  };

  const handleViewDataset = (datasetId: number) => {
    const targetPath = `/workspaces/${workspaceId}/datasets/${datasetId}`;
    navigate(targetPath);
  };

  // CONDITIONAL RENDERS AFTER ALL HOOKS
  // Early return if no workspaceId
  if (!workspaceId) {
    return (
      <Layout>
        <EmptyState 
          icon={FolderIcon}
          title="Invalid Workspace"
          description="Workspace ID is required"
          action={{
            label: "Back to Workspaces",
            onClick: () => navigate('/workspaces')
          }}
        />
      </Layout>
    );
  }

  // Authentication check
  if (!isAuthenticated) {
    return (
      <Layout>
        <EmptyState 
          icon={SettingsIcon}
          title="Authentication Required"
          description="Please log in to access this workspace"
          action={{
            label: "Go to Login",
            onClick: () => navigate('/login')
          }}
        />
      </Layout>
    );
  }

  // Loading state
  if (loading) {
    return (
      <Layout>
        <LoadingState />
      </Layout>
    );
  }

  // Error state
  if (error) {
    return (
      <Layout>
        <EmptyState 
          icon={SettingsIcon}
          title="Error Loading Workspace"
          description={error}
          action={{
            label: "Retry",
            onClick: loadWorkspaceData
          }}
        />
      </Layout>
    );
  }

  // Workspace not found
  if (!workspace) {
    return (
      <Layout>
        <EmptyState 
          icon={FolderIcon}
          title="Workspace Not Found"
          description="The workspace you're looking for doesn't exist or you don't have access to it."
          action={{
            label: "Back to Workspaces",
            onClick: () => navigate('/workspaces')
          }}
        />
      </Layout>
    );
  }

  // Render functions

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Workspace Info */}
      <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-700">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-b border-gray-100 dark:border-gray-700">
          <CardTitle className="flex items-center space-x-2">
            <FolderIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            <span className="text-gray-900 dark:text-gray-100">{workspace.name}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Description</p>
              <p className="text-gray-900 dark:text-gray-100">{workspace.description || 'No description provided'}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Subscription</p>
              <div className="flex items-center space-x-2">
                <UsersIcon className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                <span className="text-gray-900 dark:text-gray-100 capitalize">{workspace.subscription_name || 'Free'}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-blue-50 dark:from-gray-800 dark:to-blue-900/20 hover:shadow-xl transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <BrainIcon className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{projects.length}</p>
                <p className="text-gray-600 dark:text-gray-400">Projects</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-green-50 dark:from-gray-800 dark:to-green-900/20 hover:shadow-xl transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <DatabaseIcon className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{datasets.length}</p>
                <p className="text-gray-600 dark:text-gray-400">Datasets</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-purple-50 dark:from-gray-800 dark:to-purple-900/20 hover:shadow-xl transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <ImageIcon className="w-8 h-8 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {totalImages}
                </p>
                <p className="text-gray-600 dark:text-gray-400">Total Images</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-indigo-50 dark:from-gray-800 dark:to-indigo-900/20 hover:shadow-xl transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                <Zap className="w-8 h-8 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {trainingJobs ? trainingJobs.length : 0}
                </p>
                <p className="text-gray-600 dark:text-gray-400">Training Jobs</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Projects */}
      <div className="mt-8">
        <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-700">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-b border-gray-100 dark:border-gray-700">
            <CardTitle className="flex items-center space-x-2">
              <BrainIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              <span className="text-gray-900 dark:text-gray-100">Recent Projects</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
          {recentProjects.length > 0 ? (
            <div className="space-y-3">
              {recentProjects.map((project) => (
                <div key={project.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-200">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded">
                      <BrainIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100">{project.name}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {project.type} • {project.image_count} images • {project.task_count} tasks
                      </p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">View</Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">No projects yet. Create your first project!</p>
          )}
        </CardContent>
      </Card>
      </div>
    </div>
  );

  const renderProjects = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Projects</h2>
        <Button onClick={() => setCreateProjectMode(true)} className="flex items-center space-x-2">
          <PlusIcon className="w-4 h-4" />
          <span>New Project</span>
        </Button>
      </div>

      {createProjectMode && (
        <Card className="bg-gradient-to-br from-white to-blue-50 dark:from-gray-800 dark:to-blue-900/20 border-blue-200 dark:border-blue-700/50">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-b border-blue-100 dark:border-blue-700">
            <CardTitle className="text-blue-900 dark:text-blue-100">Create New Project</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateProject} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Name</label>
                <Input
                  value={projectForm.name}
                  onChange={(e) => setProjectForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter project name"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description</label>
                <Input
                  value={projectForm.description}
                  onChange={(e) => setProjectForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter project description"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Project Type</label>
                <select
                  value={projectForm.type}
                  onChange={(e) => setProjectForm(prev => ({ ...prev, type: e.target.value as any }))}
                  className="w-full px-3 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400"
                >
                  <option value="classification">Classification</option>
                  <option value="detection">Object Detection</option>
                  <option value="segmentation">Segmentation</option>
                </select>
              </div>
              <div className="flex space-x-3">
                <Button type="submit" className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white">
                  Create Project
                </Button>
                <Button type="button" variant="outline" onClick={() => setCreateProjectMode(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((project) => (
          <Card key={project.id} className="hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-white to-blue-50 dark:from-gray-800 dark:to-blue-900/20">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900/40 dark:to-indigo-900/40 rounded-lg shadow-sm">
                  <BrainIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <span className="text-xs bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 text-gray-700 dark:text-gray-300 px-3 py-1.5 rounded-full uppercase font-medium shadow-sm border border-gray-200 dark:border-gray-600">
                  {project.type}
                </span>
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">{project.name}</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">{project.description || 'No description'}</p>
              <div className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
                <div className="flex justify-between">
                  <span>Images:</span>
                  <span>{project.image_count}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tasks:</span>
                  <span>{project.task_count}</span>
                </div>
                <div className="flex justify-between">
                  <span>Owner:</span>
                  <span>User {project.owned_by}</span>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                <Button className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 dark:from-blue-500 dark:to-indigo-500 dark:hover:from-blue-600 dark:hover:to-indigo-600 text-white shadow-sm hover:shadow-md transition-all duration-200" variant="primary">
                  Open Project
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {projects.length === 0 && !createProjectMode && (
        <Card>
          <CardContent className="p-12 text-center">
            <BrainIcon className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No projects yet</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">Create your first AI vision project to get started with image classification, object detection, or segmentation.</p>
            <Button 
              onClick={() => setCreateProjectMode(true)}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
            >
              <PlusIcon className="w-4 h-4 mr-2" />
              Create Project
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );

  const renderDatasets = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Datasets</h2>
        <Button onClick={() => setCreateDatasetMode(true)} className="flex items-center space-x-2">
          <PlusIcon className="w-4 h-4" />
          <span>New Dataset</span>
        </Button>
      </div>

      {createDatasetMode && (
        <Card className="bg-gradient-to-br from-white to-green-50 dark:from-gray-800 dark:to-green-900/20 border-green-200 dark:border-green-700/50">
          <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-b border-green-100 dark:border-green-700">
            <CardTitle className="text-green-900 dark:text-green-100">Create New Dataset</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateDataset} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Name</label>
                <Input
                  value={datasetForm.name}
                  onChange={(e) => setDatasetForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter dataset name"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description</label>
                <Input
                  value={datasetForm.description}
                  onChange={(e) => setDatasetForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter dataset description"
                />
              </div>
              <div className="flex space-x-3">
                <Button type="submit" className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white">
                  Create Dataset
                </Button>
                <Button type="button" variant="outline" onClick={() => setCreateDatasetMode(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {datasets.map((dataset) => (
          <Card key={dataset.id} className="hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-white to-green-50 dark:from-gray-800 dark:to-green-900/20">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/40 dark:to-emerald-900/40 rounded-lg shadow-sm">
                  <DatabaseIcon className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <span className="text-xs bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 text-gray-700 dark:text-gray-300 px-3 py-1.5 rounded-full uppercase font-medium shadow-sm border border-gray-200 dark:border-gray-600">
                  Dataset
                </span>
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">{dataset.name}</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">{dataset.description || 'No description'}</p>
              
              {dataset.project_names && dataset.project_names.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Associated Projects:</p>
                  <div className="flex flex-wrap gap-1">
                    {dataset.project_names.slice(0, 2).map((projectName, index) => (
                      <span key={index} className="text-xs bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900/40 dark:to-indigo-900/40 text-blue-800 dark:text-blue-300 px-2 py-1 rounded-full font-medium shadow-sm border border-blue-200 dark:border-blue-700/50">
                        {projectName}
                      </span>
                    ))}
                    {dataset.project_names.length > 2 && (
                      <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-2 py-1 rounded-full font-medium">
                        +{dataset.project_names.length - 2}
                      </span>
                    )}
                  </div>
                </div>
              )}
              
              <div className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
                <div className="flex justify-between">
                  <span>Projects:</span>
                  <span>{dataset.project_count}</span>
                </div>
                <div className="flex justify-between">
                  <span>Created by:</span>
                  <span>User {dataset.created_by}</span>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                <Button 
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 dark:from-green-500 dark:to-emerald-500 dark:hover:from-green-600 dark:hover:to-emerald-600 text-white shadow-sm hover:shadow-md transition-all duration-200"
                  onClick={() => handleViewDataset(dataset.id)}
                >
                  View Dataset
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {datasets.length === 0 && !createDatasetMode && (
        <Card>
          <CardContent className="p-12 text-center">
            <DatabaseIcon className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No datasets yet</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">Create your first dataset to organize and manage your training data.</p>
            <Button 
              onClick={() => setCreateDatasetMode(true)}
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
            >
              <PlusIcon className="w-4 h-4 mr-2" />
              Create Dataset
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );

  const renderTrainingJobs = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Training Jobs</h2>
        <Button 
          onClick={() => navigate(`/workspaces/${workspaceId}/projects`)} 
          className="flex items-center space-x-2"
        >
          <PlusIcon className="w-4 h-4" />
          <span>New Training Job</span>
        </Button>
      </div>

      {trainingJobsLoading ? (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading training jobs...</p>
          </CardContent>
        </Card>
      ) : trainingJobsError ? (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-red-900 dark:text-red-100 mb-2">Error Loading Training Jobs</h3>
            <p className="text-red-600 dark:text-red-400 mb-4">{trainingJobsError}</p>
            <Button onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </CardContent>
        </Card>
      ) : trainingJobs && trainingJobs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {trainingJobs.map((job) => (
            <TrainingJobCard
              key={job.id}
              job={job}
              onView={(job) => navigate(`/workspaces/${workspaceId}/projects/${job.project_id}/training-jobs/${job.id}`)}
            />
          ))}
        </div>
      ) : (
        // Only show empty state if we're not loading and there's no error
        !trainingJobsLoading && !trainingJobsError && (
          <Card>
            <CardContent className="p-12 text-center">
              <Zap className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No training jobs yet</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">Create your first training job to start training AI models for your projects.</p>
              <Button 
                onClick={() => navigate(`/workspaces/${workspaceId}/projects`)}
                className="bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white"
              >
                <PlusIcon className="w-4 h-4 mr-2" />
                Start Training
              </Button>
            </CardContent>
          </Card>
        )
      )}
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverview();
      case 'projects':
        return renderProjects();
      case 'datasets':
        return renderDatasets();
      case 'training-jobs':
        return renderTrainingJobs();
      default:
        return renderOverview();
    }
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
        <div className="max-w-7xl mx-auto p-6">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{workspace.name}</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">{workspace.description || 'Workspace details and management'}</p>
              </div>
              <Button variant="outline" className="flex items-center space-x-2">
                <SettingsIcon className="w-4 h-4" />
                <span>Settings</span>
              </Button>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200 dark:border-gray-700 mb-6 overflow-hidden">
            <nav className="flex space-x-8 min-w-0">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm transition-all duration-200 whitespace-nowrap flex-shrink-0 ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400 dark:border-blue-400'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <tab.icon className="w-5 h-5 flex-shrink-0" />
                  <span className="flex-shrink-0">{tab.label}</span>
                  {tab.count !== null && (
                    <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                      activeTab === tab.id
                        ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                    }`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          {renderTabContent()}
        </div>
      </div>
    </Layout>
  );
};
