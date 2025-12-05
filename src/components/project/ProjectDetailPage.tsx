import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  BrainIcon, 
  ImageIcon, 
  TagIcon, 
  PlayIcon, 
  PlusIcon,
  EditIcon,
  TrashIcon,
  LayersIcon,
  ArrowLeftIcon
} from 'lucide-react';
import { Layout } from '../layout/Layout';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { LoadingState } from '../ui/LoadingState';
import { StatCard } from '../ui/StatCard';
import { Breadcrumb } from '../ui/Breadcrumb';
import { projectAPI, categoryAPI, workspaceAPI } from '../../api';
import type { Project, Category, Workspace } from '../../types';

export const ProjectDetailPage: React.FC = () => {
  const { workspaceId, projectId } = useParams<{ workspaceId: string; projectId: string }>();
  const navigate = useNavigate();
  
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [imageCount, setImageCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'categories' | 'images'>('overview');
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategory, setNewCategory] = useState({ name: '', color: '#3B82F6' });

  useEffect(() => {
    loadProjectData();
  }, [workspaceId, projectId]);

  const loadProjectData = async () => {
    if (!workspaceId || !projectId) return;
    
    try {
      setLoading(true);
      const [workspaceData, projectData, categoriesData, imagesData] = await Promise.all([
        workspaceAPI.getById(parseInt(workspaceId)),
        projectAPI.getById(parseInt(workspaceId), parseInt(projectId)),
        categoryAPI.getAll(parseInt(workspaceId), parseInt(projectId)),
        projectAPI.getImages(parseInt(workspaceId), parseInt(projectId), { limit: 1 })
      ]);
      
      setWorkspace(workspaceData);
      setProject(projectData);
      setCategories(Array.isArray(categoriesData) ? categoriesData : []);
      setImageCount(imagesData.total_count);
    } catch (error) {
      console.error('Failed to load project data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspaceId || !projectId) return;

    try {
      await categoryAPI.create(parseInt(workspaceId), parseInt(projectId), {
        name: newCategory.name,
        color: newCategory.color
      });
      setNewCategory({ name: '', color: '#3B82F6' });
      setShowAddCategory(false);
      loadProjectData();
    } catch (error) {
      console.error('Failed to create category:', error);
    }
  };

  const handleDeleteCategory = async (categoryId: number) => {
    if (!workspaceId || !projectId || !confirm('Are you sure you want to delete this category?')) return;

    try {
      await categoryAPI.delete(parseInt(workspaceId), parseInt(projectId), categoryId);
      loadProjectData();
    } catch (error) {
      console.error('Failed to delete category:', error);
    }
  };

  const handleStartTraining = () => {
    navigate(`/workspaces/${workspaceId}/projects/${projectId}/train`);
  };

  if (loading) {
    return (
      <Layout>
        <LoadingState message="Loading project..." />
      </Layout>
    );
  }

  if (!project) {
    return (
      <Layout>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Project not found</h2>
        </div>
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
                  { label: workspace?.name || 'Workspace', href: `/workspaces/${workspaceId}` },
                  { label: project.name, active: true }
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
                <div className="flex items-center space-x-4 mb-2">
                  <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl shadow-lg">
                    <BrainIcon className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100">
                      {project.name}
                    </h1>
                    <p className="text-lg text-gray-600 dark:text-gray-400 mt-1">
                      {project.description || 'AI Training Project'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-4 mt-4">
                  <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full text-sm font-medium">
                    {project.type}
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    Created {new Date(project.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  onClick={() => navigate(`/workspaces/${workspaceId}/projects/${projectId}/annotate`)}
                >
                  <EditIcon className="w-4 h-4 mr-2" />
                  Annotate Images
                </Button>
                <Button
                  className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
                  onClick={handleStartTraining}
                >
                  <PlayIcon className="w-4 h-4 mr-2" />
                  Start Training
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <StatCard
              title="Total Images"
              value={imageCount}
              icon={ImageIcon}
              iconColor="text-white"
              iconBgColor="bg-blue-500"
            />
            <StatCard
              title="Categories"
              value={categories.length}
              icon={TagIcon}
              iconColor="text-white"
              iconBgColor="bg-purple-500"
            />
            <StatCard
              title="Labeled"
              value={0}
              icon={LayersIcon}
              iconColor="text-white"
              iconBgColor="bg-green-500"
            />
            <StatCard
              title="Training Jobs"
              value={project.task_count || 0}
              icon={BrainIcon}
              iconColor="text-white"
              iconBgColor="bg-orange-500"
            />
          </div>

          {/* Tabs */}
          <div className="mb-6">
            <div className="border-b border-gray-200 dark:border-gray-700">
              <nav className="-mb-px flex space-x-8">
                {[
                  { id: 'overview', label: 'Overview' },
                  { id: 'categories', label: 'Categories' },
                  { id: 'images', label: 'Images' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`
                      py-4 px-1 border-b-2 font-medium text-sm transition-colors
                      ${activeTab === tab.id
                        ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                      }
                    `}
                  >
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Content */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Project Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Project Type</p>
                      <p className="text-lg font-medium text-gray-900 dark:text-gray-100">{project.type}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Dataset</p>
                      <p className="text-lg font-medium text-gray-900 dark:text-gray-100">
                        {project.dataset_id ? `Dataset #${project.dataset_id}` : 'No dataset'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Created At</p>
                      <p className="text-lg font-medium text-gray-900 dark:text-gray-100">
                        {new Date(project.created_at).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Last Updated</p>
                      <p className="text-lg font-medium text-gray-900 dark:text-gray-100">
                        {new Date(project.updated_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'categories' && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Categories ({categories.length})</CardTitle>
                  <Button onClick={() => setShowAddCategory(true)} size="sm">
                    <PlusIcon className="w-4 h-4 mr-2" />
                    Add Category
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {showAddCategory && (
                  <form onSubmit={handleAddCategory} className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-end space-x-4">
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Category Name
                        </label>
                        <Input
                          value={newCategory.name}
                          onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                          placeholder="e.g., Cat, Dog, Car"
                          required
                        />
                      </div>
                      <div className="w-32">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Color
                        </label>
                        <input
                          type="color"
                          value={newCategory.color}
                          onChange={(e) => setNewCategory({ ...newCategory, color: e.target.value })}
                          className="w-full h-10 rounded border-2 border-gray-300 dark:border-gray-600"
                        />
                      </div>
                      <Button type="submit">Add</Button>
                      <Button type="button" variant="outline" onClick={() => setShowAddCategory(false)}>
                        Cancel
                      </Button>
                    </div>
                  </form>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {categories.map((category) => (
                    <div
                      key={category.id}
                      className="p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div
                            className="w-8 h-8 rounded"
                            style={{ backgroundColor: category.category_metadata?.color || '#3B82F6' }}
                          />
                          <div>
                            <p className="font-medium text-gray-900 dark:text-gray-100">{category.name}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              ID: {category.id}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteCategory(category.id)}
                          className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                {categories.length === 0 && !showAddCategory && (
                  <div className="text-center py-12">
                    <TagIcon className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                      No categories yet
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-4">
                      Create categories to start labeling your images
                    </p>
                    <Button onClick={() => setShowAddCategory(true)}>
                      <PlusIcon className="w-4 h-4 mr-2" />
                      Create First Category
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {activeTab === 'images' && (
            <Card>
              <CardHeader>
                <CardTitle>Project Images ({imageCount})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <ImageIcon className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400 mb-4">
                    Image gallery view coming soon
                  </p>
                  <Button onClick={() => navigate(`/workspaces/${workspaceId}/projects/${projectId}/annotate`)}>
                    <EditIcon className="w-4 h-4 mr-2" />
                    Start Annotating
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </Layout>
  );
};
