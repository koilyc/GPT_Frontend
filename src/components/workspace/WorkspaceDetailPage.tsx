import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store';
import { useWorkspaceDetail, useTrainingJobs, useRecentWorkspaces } from '../../hooks';
import { imageAPI, workspaceAPI, quotaAPI } from '../../api';
import type { WorkspaceMember, QuotaResponse } from '../../types';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Layout } from '../layout/Layout';
import { LoadingState } from '../ui/LoadingState';
import { EmptyState } from '../ui/EmptyState';
import { TrainingJobCard } from '../training/TrainingJobCard';
import { Breadcrumb } from '../ui/Breadcrumb';
import { Pagination } from '../ui/Pagination';
import { 
  PlusIcon, 
  FolderIcon, 
  DatabaseIcon, 
  BrainIcon,
  ImageIcon,
  UsersIcon,
  SettingsIcon,
  Zap,
  ArrowLeftIcon,
  BarChart,
  TrashIcon,
  MailIcon
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
  const location = useLocation();
  const { isAuthenticated } = useAuthStore();

  // Check if there's a tab in the location state
  const initialTab = (location.state as { tab?: string })?.tab || 'overview';

  // UI state - ALL HOOKS MUST BE CALLED FIRST
  const [activeTab, setActiveTab] = useState<'overview' | 'projects' | 'datasets' | 'training-jobs' | 'members' | 'quotas'>(
    initialTab as 'overview' | 'projects' | 'datasets' | 'training-jobs' | 'members' | 'quotas'
  );
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [membersTotalCount, setMembersTotalCount] = useState(0);
  const [membersPage, setMembersPage] = useState(1);
  const [membersPageSize, setMembersPageSize] = useState(10);
  const [quotas, setQuotas] = useState<QuotaResponse[]>([]);
  const [quotasLoading, setQuotasLoading] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'manager' | 'member' | 'viewer'>('member');
  const [inviteLoading, setInviteLoading] = useState(false);
  
  // Pagination states (4x4 grid = 16 items per page)
  const [projectsPage, setProjectsPage] = useState(1);
  const [projectsPageSize, setProjectsPageSize] = useState(16);
  const [datasetsPage, setDatasetsPage] = useState(1);
  const [datasetsPageSize, setDatasetsPageSize] = useState(16);
  const [trainingJobsPage, setTrainingJobsPage] = useState(1);
  const [trainingJobsPageSize, setTrainingJobsPageSize] = useState(16);
  const [createProjectMode, setCreateProjectMode] = useState(false);
  const [createDatasetMode, setCreateDatasetMode] = useState(false);
  const [datasetImageCount, setDatasetImageCount] = useState<Record<number, number>>({});

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
    projectsTotalCount,
    datasets,
    datasetsTotalCount,
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
  const { trainingJobs, totalCount: trainingJobsTotalCount, loading: trainingJobsLoading, error: trainingJobsError } = useTrainingJobs(workspaceId ? parseInt(workspaceId) : undefined);

  // Add workspace to recent list when it's loaded
  useEffect(() => {
    if (workspace) {
      addToRecent(workspace);
    }
  }, [workspace, addToRecent]);

  // Load members count immediately when workspace is loaded
  useEffect(() => {
    if (workspaceId) {
      loadMembersCount();
    }
  }, [workspaceId]);

  // Update tab when location state changes
  useEffect(() => {
    const stateTab = (location.state as { tab?: string })?.tab;
    if (stateTab && ['overview', 'projects', 'datasets', 'training-jobs', 'members', 'quotas'].includes(stateTab)) {
      setActiveTab(stateTab as 'overview' | 'projects' | 'datasets' | 'training-jobs' | 'members' | 'quotas');
    }
  }, [location.state]);

  // Load members when Members tab is active or pagination changes
  useEffect(() => {
    if (activeTab === 'members' && workspaceId) {
      loadMembers();
    }
  }, [activeTab, workspaceId, membersPage, membersPageSize]);

  // Load quotas when Quotas tab is active
  useEffect(() => {
    if (activeTab === 'quotas' && workspaceId) {
      loadQuotas();
    }
  }, [activeTab, workspaceId]);

  const loadMembersCount = async () => {
    if (!workspaceId) return;
    try {
      const response = await workspaceAPI.getMembers(parseInt(workspaceId), { limit: 1, offset: 0 });
      setMembersTotalCount(response.total_count || 0);
    } catch (error) {
      console.error('Failed to load members count:', error);
    }
  };

  const loadMembers = async () => {
    if (!workspaceId) return;
    try {
      setMembersLoading(true);
      const offset = (membersPage - 1) * membersPageSize;
      const response = await workspaceAPI.getMembers(parseInt(workspaceId), { 
        limit: membersPageSize,
        offset: offset
      });
      setMembers(response.members || []);
      setMembersTotalCount(response.total_count || 0);
    } catch (error) {
      console.error('Failed to load members:', error);
    } finally {
      setMembersLoading(false);
    }
  };

  const loadQuotas = async () => {
    if (!workspaceId) return;
    try {
      setQuotasLoading(true);
      const data = await quotaAPI.getAllQuotas(parseInt(workspaceId));
      setQuotas(Array.isArray(data) ? data : [data]);
    } catch (error) {
      console.error('Failed to load quotas:', error);
    } finally {
      setQuotasLoading(false);
    }
  };

  // Load image count for each dataset
  useEffect(() => {
    const loadDatasetImageCounts = async () => {
      if (!workspaceId || !datasets || datasets.length === 0) return;
      
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
      setDatasetImageCount(counts);
    };

    loadDatasetImageCounts();
  }, [workspaceId, datasets]);

  // Tab configuration
  const tabs = useMemo(() => [
    { id: 'overview' as const, label: 'Overview', icon: FolderIcon, count: null },
    { id: 'projects' as const, label: 'Projects', icon: BrainIcon, count: projectsTotalCount },
    { id: 'datasets' as const, label: 'Datasets', icon: DatabaseIcon, count: datasetsTotalCount },
    { id: 'training-jobs' as const, label: 'Training Jobs', icon: Zap, count: trainingJobsTotalCount },
    { id: 'members' as const, label: 'Members', icon: UsersIcon, count: membersTotalCount },
    { id: 'quotas' as const, label: 'Quotas', icon: BarChart, count: null },
  ], [projectsTotalCount, datasetsTotalCount, trainingJobsTotalCount, membersTotalCount]);

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

  const handleViewProject = (projectId: number) => {
    const targetPath = `/workspaces/${workspaceId}/projects/${projectId}`;
    navigate(targetPath);
  };

  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspaceId || !inviteEmail) return;
    try {
      setInviteLoading(true);
      await workspaceAPI.inviteMembers(parseInt(workspaceId), {
        emails: [inviteEmail],
        role: inviteRole
      });
      setInviteEmail('');
      setInviteRole('member');
      await loadMembers();
      await loadMembersCount();
    } catch (error) {
      console.error('Failed to invite member:', error);
    } finally {
      setInviteLoading(false);
    }
  };

  const handleUpdateMemberRole = async (email: string, newRole: string) => {
    if (!workspaceId) return;
    try {
      await workspaceAPI.updateMemberRole(parseInt(workspaceId), email, newRole);
      await loadMembers();
    } catch (error) {
      console.error('Failed to update member role:', error);
    }
  };

  const handleDeleteMember = async (email: string) => {
    if (!workspaceId) return;
    if (!confirm(`Are you sure you want to remove ${email} from this workspace?`)) return;
    try {
      await workspaceAPI.deleteMember(parseInt(workspaceId), email);
      await loadMembers();
      await loadMembersCount();
    } catch (error) {
      console.error('Failed to delete member:', error);
    }
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
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{projectsTotalCount}</p>
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
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{datasetsTotalCount}</p>
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
                  {trainingJobsTotalCount}
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
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleViewProject(project.id)}
                  >
                    View
                  </Button>
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
      {/* Floating Action Button */}
      <button
        onClick={() => setCreateProjectMode(true)}
        className="fixed right-8 bottom-24 z-30 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-full p-4 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-110"
        title="New Project"
      >
        <PlusIcon className="w-6 h-6" />
      </button>

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

      {projects.length > 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {projects.slice((projectsPage - 1) * projectsPageSize, projectsPage * projectsPageSize).map((project) => (
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
                <Button 
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 dark:from-blue-500 dark:to-indigo-500 dark:hover:from-blue-600 dark:hover:to-indigo-600 text-white shadow-sm hover:shadow-md transition-all duration-200" 
                  onClick={() => handleViewProject(project.id)}
                >
                  Open Project
                </Button>
              </div>
            </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

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
      {/* Floating Action Button */}
      <button
        onClick={() => setCreateDatasetMode(true)}
        className="fixed right-8 bottom-24 z-30 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-full p-4 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-110"
        title="New Dataset"
      >
        <PlusIcon className="w-6 h-6" />
      </button>

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

      {datasets.length > 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {datasets.slice((datasetsPage - 1) * datasetsPageSize, datasetsPage * datasetsPageSize).map((dataset) => (
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
                  <span className="flex items-center">
                    <ImageIcon className="w-4 h-4 mr-1 text-blue-500" />
                    Images:
                  </span>
                  <span className="font-medium">{datasetImageCount[dataset.id] ?? '...'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Projects:</span>
                  <span className="font-medium">{dataset.project_count}</span>
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
        </>
      )}

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
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {trainingJobs.slice((trainingJobsPage - 1) * trainingJobsPageSize, trainingJobsPage * trainingJobsPageSize).map((job) => (
              <TrainingJobCard
                key={job.id}
                job={job}
                onView={(job) => navigate(`/workspaces/${workspaceId}/projects/${job.project_id}/training-jobs/${job.id}`)}
              />
            ))}
          </div>
        </>
      ) : (
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
      )}
    </div>
  );

  const renderMembers = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Workspace Members</h2>
      </div>

      {/* Invite Member Form */}
      <Card className="bg-gradient-to-br from-white to-blue-50 dark:from-gray-800 dark:to-blue-900/20 border-blue-200 dark:border-blue-700/50">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-b border-blue-100 dark:border-blue-700">
          <CardTitle className="text-blue-900 dark:text-blue-100 flex items-center space-x-2">
            <MailIcon className="w-5 h-5" />
            <span>Invite New Member</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleInviteMember} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email Address</label>
                <Input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="user@example.com"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Role</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as 'manager' | 'member' | 'viewer')}
                  className="w-full px-3 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="viewer">Viewer</option>
                  <option value="member">Member</option>
                  <option value="manager">Manager</option>
                </select>
              </div>
            </div>
            <Button 
              type="submit" 
              disabled={inviteLoading}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
            >
              {inviteLoading ? 'Inviting...' : 'Send Invitation'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Members List */}
      {membersLoading ? (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading members...</p>
          </CardContent>
        </Card>
      ) : members && members.length > 0 ? (
        <>
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Role
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {members.map((member) => (
                      <tr key={member.email} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 flex items-center justify-center text-white font-semibold">
                              {member.email.charAt(0).toUpperCase()}
                            </div>
                            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{member.email}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <select
                            value={member.role}
                            onChange={(e) => handleUpdateMemberRole(member.email, e.target.value)}
                            className="text-sm px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                          >
                            <option value="viewer">Viewer</option>
                            <option value="member">Member</option>
                            <option value="manager">Manager</option>
                          </select>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            !member.pending 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                              : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                          }`}>
                            {member.pending ? 'Pending' : 'Active'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteMember(member.email)}
                            className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
          
          <Pagination
            currentPage={membersPage}
            totalCount={membersTotalCount}
            pageSize={membersPageSize}
            onPageChange={setMembersPage}
            onPageSizeChange={setMembersPageSize}
          />
        </>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <UsersIcon className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No members yet</h3>
            <p className="text-gray-500 dark:text-gray-400">Invite team members to collaborate on this workspace.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );

  const renderQuotas = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Resource Quotas</h2>
        <Button 
          onClick={loadQuotas}
          variant="outline"
          size="sm"
          className="flex items-center space-x-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>Refresh</span>
        </Button>
      </div>

      {quotasLoading ? (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading quotas...</p>
          </CardContent>
        </Card>
      ) : quotas && quotas.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {quotas.map((quota, index) => {
            const usagePercentage = quota.limit > 0 ? (quota.current / quota.limit) * 100 : 0;
            const isWarning = usagePercentage > 80;
            const isDanger = usagePercentage > 95;
            
            return (
              <Card key={index} className={`hover:shadow-lg transition-all duration-300 ${
                isDanger 
                  ? 'bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border-red-300 dark:border-red-700'
                  : isWarning
                  ? 'bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 border-yellow-300 dark:border-yellow-700'
                  : 'bg-gradient-to-br from-white to-blue-50 dark:from-gray-800 dark:to-blue-900/20'
              }`}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`p-3 rounded-lg shadow-sm ${
                      isDanger
                        ? 'bg-gradient-to-r from-red-100 to-red-200 dark:from-red-900/40 dark:to-red-800/40'
                        : isWarning
                        ? 'bg-gradient-to-r from-yellow-100 to-yellow-200 dark:from-yellow-900/40 dark:to-yellow-800/40'
                        : 'bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900/40 dark:to-indigo-900/40'
                    }`}>
                      <BarChart className={`w-6 h-6 ${
                        isDanger
                          ? 'text-red-600 dark:text-red-400'
                          : isWarning
                          ? 'text-yellow-600 dark:text-yellow-400'
                          : 'text-blue-600 dark:text-blue-400'
                      }`} />
                    </div>
                    <span className={`text-xs px-3 py-1.5 rounded-full uppercase font-medium shadow-sm ${
                      isDanger
                        ? 'bg-red-200 text-red-800 dark:bg-red-800/40 dark:text-red-300'
                        : isWarning
                        ? 'bg-yellow-200 text-yellow-800 dark:bg-yellow-800/40 dark:text-yellow-300'
                        : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                    }`}>
                      {quota.resource_type}
                    </span>
                  </div>
                  
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2 capitalize">
                    {quota.resource_type.replace('_', ' ')}
                  </h3>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Usage:</span>
                      <span className="font-semibold text-gray-900 dark:text-gray-100">
                        {quota.current} / {quota.limit === -1 ? '∞' : quota.limit}
                      </span>
                    </div>
                    
                    {quota.limit > 0 && (
                      <>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
                          <div 
                            className={`h-2.5 rounded-full transition-all duration-500 ${
                              isDanger
                                ? 'bg-gradient-to-r from-red-500 to-red-600'
                                : isWarning
                                ? 'bg-gradient-to-r from-yellow-500 to-yellow-600'
                                : 'bg-gradient-to-r from-blue-500 to-indigo-500'
                            }`}
                            style={{ width: `${Math.min(usagePercentage, 100)}%` }}
                          ></div>
                        </div>
                        <p className={`text-sm font-medium ${
                          isDanger
                            ? 'text-red-600 dark:text-red-400'
                            : isWarning
                            ? 'text-yellow-600 dark:text-yellow-400'
                            : 'text-gray-600 dark:text-gray-400'
                        }`}>
                          {usagePercentage.toFixed(1)}% used
                        </p>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <BarChart className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No quota data available</h3>
            <p className="text-gray-500 dark:text-gray-400">Resource quota information is not available for this workspace.</p>
          </CardContent>
        </Card>
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
      case 'members':
        return renderMembers();
      case 'quotas':
        return renderQuotas();
      default:
        return renderOverview();
    }
  };

  return (
    <Layout>
      <div className="flex flex-col h-full bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
        {/* Fixed Header Container */}
        <div className="flex-shrink-0 bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="max-w-7xl mx-auto px-6 pt-6">
            {/* Breadcrumb Navigation */}
            <div className="flex items-center justify-between mb-4">
              <Breadcrumb 
                items={[
                  { label: 'Workspaces', href: '/workspaces' },
                  { label: workspace.name, active: true }
                ]}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/workspaces')}
                className="flex items-center space-x-2"
              >
                <ArrowLeftIcon className="w-4 h-4" />
                <span>Back to Workspaces</span>
              </Button>
            </div>

            {/* Header */}
            <div className="mb-4">
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
            <div className="border-b border-gray-200 dark:border-gray-700 overflow-hidden">
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
          </div>
        </div>
        {/* End Fixed Header */}

        {/* Scrollable Content with Fixed Pagination */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-auto">
            <div className="max-w-7xl mx-auto p-6">
              {/* Tab Content */}
              {renderTabContent()}
            </div>
          </div>
          {/* Fixed Pagination Bar at Bottom */}
          {(activeTab === 'projects' || activeTab === 'datasets' || activeTab === 'training-jobs') && (
            <div className="flex-shrink-0 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg">
              <div className="max-w-7xl mx-auto px-6 py-4">
                {activeTab === 'projects' && projectsTotalCount > projectsPageSize && (
                  <Pagination
                    currentPage={projectsPage}
                    totalCount={projectsTotalCount}
                    pageSize={projectsPageSize}
                    onPageChange={setProjectsPage}
                    onPageSizeChange={setProjectsPageSize}
                    gridConfig={{ cols: { sm: 1, md: 2, lg: 4, xl: 4 } }}
                  />
                )}
                {activeTab === 'datasets' && datasetsTotalCount > datasetsPageSize && (
                  <Pagination
                    currentPage={datasetsPage}
                    totalCount={datasetsTotalCount}
                    pageSize={datasetsPageSize}
                    onPageChange={setDatasetsPage}
                    onPageSizeChange={setDatasetsPageSize}
                    gridConfig={{ cols: { sm: 1, md: 2, lg: 4, xl: 4 } }}
                  />
                )}
                {activeTab === 'training-jobs' && trainingJobsTotalCount > trainingJobsPageSize && (
                  <Pagination
                    currentPage={trainingJobsPage}
                    totalCount={trainingJobsTotalCount}
                    pageSize={trainingJobsPageSize}
                    onPageChange={setTrainingJobsPage}
                    onPageSizeChange={setTrainingJobsPageSize}
                    gridConfig={{ cols: { sm: 1, md: 2, lg: 4, xl: 4 } }}
                  />
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};
