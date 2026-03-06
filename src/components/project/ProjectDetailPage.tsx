import React, { useState, useEffect, useCallback } from 'react';
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
  ArrowLeftIcon,
  SparklesIcon,
} from 'lucide-react';
import { Layout } from '../layout/Layout';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { LoadingState } from '../ui/LoadingState';
import { StatCard } from '../ui/StatCard';
import { Breadcrumb } from '../ui/Breadcrumb';
import { Pagination } from '../ui/Pagination';
import { projectAPI, categoryAPI, workspaceAPI, imageAPI } from '../../api';
import type { Project, Category, Workspace, ProjectImage } from '../../types';

export const ProjectDetailPage: React.FC = () => {
  const { workspaceId, projectId } = useParams<{ workspaceId: string; projectId: string }>();
  const navigate = useNavigate();

  const workspaceIdNum = workspaceId ? parseInt(workspaceId, 10) : undefined;
  const projectIdNum = projectId ? parseInt(projectId, 10) : undefined;

  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'images' | 'categories'>('overview');

  const [projectImages, setProjectImages] = useState<ProjectImage[]>([]);
  const [imagesTotalCount, setImagesTotalCount] = useState(0);
  const [imagesLoading, setImagesLoading] = useState(false);
  const [imagesPage, setImagesPage] = useState(1);
  const [imagesPageSize, setImagesPageSize] = useState(20);
  const [thumbnailUrls, setThumbnailUrls] = useState<Record<number, string>>({});

  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategory, setNewCategory] = useState({ name: '', color: '#3B82F6' });

  const loadProjectMeta = useCallback(async () => {
    if (!workspaceIdNum || !projectIdNum) return;

    try {
      setLoading(true);
      const [workspaceData, projectData, categoriesData, imagesMeta] = await Promise.all([
        workspaceAPI.getById(workspaceIdNum),
        projectAPI.getById(workspaceIdNum, projectIdNum),
        categoryAPI.getAll(workspaceIdNum, projectIdNum),
        projectAPI.getImages(workspaceIdNum, projectIdNum, { limit: 1, offset: 0 }),
      ]);

      setWorkspace(workspaceData);
      setProject(projectData);
      setCategories(Array.isArray(categoriesData) ? categoriesData : []);
      setImagesTotalCount(imagesMeta.total_count || 0);
    } catch (error) {
      console.error('Failed to load project data:', error);
    } finally {
      setLoading(false);
    }
  }, [workspaceIdNum, projectIdNum]);

  const loadProjectImages = useCallback(async () => {
    if (!workspaceIdNum || !projectIdNum) return;

    try {
      setImagesLoading(true);
      const offset = (imagesPage - 1) * imagesPageSize;
      const response = await projectAPI.getImages(workspaceIdNum, projectIdNum, {
        limit: imagesPageSize,
        offset,
      });

      const images = response.Images || [];
      setProjectImages(images);
      setImagesTotalCount(response.total_count || 0);

      // Load image thumbnails for current page.
      const entries = await Promise.all(
        images.map(async (img) => {
          if (!img.dataset_id) {
            return [img.id, img.thumbnail_path || img.path || ''] as const;
          }
          try {
            const thumbnailResponse = await imageAPI.getThumbnailUrl(workspaceIdNum, img.dataset_id, img.id);
            return [img.id, thumbnailResponse.presigned_url] as const;
          } catch {
            try {
              const contentResponse = await imageAPI.getContentUrl(workspaceIdNum, img.dataset_id, img.id);
              return [img.id, contentResponse.presigned_url] as const;
            } catch {
              return [img.id, img.thumbnail_path || img.path || ''] as const;
            }
          }
        }),
      );

      const urls = Object.fromEntries(entries);
      setThumbnailUrls((prev) => ({ ...prev, ...urls }));
    } catch (error) {
      console.error('Failed to load project images:', error);
      setProjectImages([]);
      setImagesTotalCount(0);
    } finally {
      setImagesLoading(false);
    }
  }, [workspaceIdNum, projectIdNum, imagesPage, imagesPageSize]);

  useEffect(() => {
    loadProjectMeta();
  }, [loadProjectMeta]);

  useEffect(() => {
    if (activeTab === 'images') {
      loadProjectImages();
    }
  }, [activeTab, loadProjectImages]);

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspaceIdNum || !projectIdNum) return;

    try {
      await categoryAPI.create(workspaceIdNum, projectIdNum, {
        name: newCategory.name,
        color: newCategory.color,
      });
      setNewCategory({ name: '', color: '#3B82F6' });
      setShowAddCategory(false);
      await loadProjectMeta();
    } catch (error) {
      console.error('Failed to create category:', error);
    }
  };

  const handleDeleteCategory = async (categoryId: number) => {
    if (!workspaceIdNum || !projectIdNum) return;
    if (!confirm('Are you sure you want to delete this tag/category?')) return;

    try {
      await categoryAPI.delete(workspaceIdNum, projectIdNum, categoryId);
      await loadProjectMeta();
    } catch (error) {
      console.error('Failed to delete category:', error);
    }
  };

  const handleOpenAnnotate = (imageId?: number) => {
    const query = imageId ? `?imageId=${imageId}` : '';
    navigate(`/workspaces/${workspaceIdNum}/projects/${projectIdNum}/annotate${query}`);
  };

  const handleStartTraining = () => {
    navigate(`/workspaces/${workspaceIdNum}/projects/${projectIdNum}/training-jobs`);
  };

  if (loading) {
    return (
      <Layout>
        <LoadingState message="Loading project..." />
      </Layout>
    );
  }

  if (!project || !workspace) {
    return (
      <Layout>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Project not found</h2>
        </div>
      </Layout>
    );
  }

  const tabs: Array<{ id: 'overview' | 'images' | 'categories'; label: string }> = [
    { id: 'overview', label: 'Overview' },
    { id: 'images', label: 'Images & Annotation' },
    { id: 'categories', label: 'Tags / Categories' },
  ];

  return (
    <Layout>
      <div className="flex flex-col h-full bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
        <div className="flex-shrink-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex items-center justify-between mb-6">
              <Breadcrumb
                items={[
                  { label: 'Workspaces', href: '/workspaces' },
                  { label: workspace.name, href: `/workspaces/${workspaceIdNum}` },
                  { label: project.name, active: true },
                ]}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(`/workspaces/${workspaceIdNum}`)}
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
                    <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100">{project.name}</h1>
                    <p className="text-lg text-gray-600 dark:text-gray-400 mt-1">
                      {project.description || 'Build, tag, and annotate with a workflow-first project layout.'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 mt-3">
                  <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full text-sm font-medium">
                    {project.type}
                  </span>
                  <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-sm">
                    {imagesTotalCount} images
                  </span>
                  <span className="px-3 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300 rounded-full text-sm">
                    {categories.length} tags
                  </span>
                </div>
              </div>

              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  onClick={() => handleOpenAnnotate()}
                >
                  <EditIcon className="w-4 h-4 mr-2" />
                  Open Annotate
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

        <div className="flex-1 overflow-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <StatCard title="Images" value={imagesTotalCount} icon={ImageIcon} iconColor="text-white" iconBgColor="bg-blue-500" />
              <StatCard title="Tags" value={categories.length} icon={TagIcon} iconColor="text-white" iconBgColor="bg-purple-500" />
              <StatCard title="Training Jobs" value={project.task_count || 0} icon={BrainIcon} iconColor="text-white" iconBgColor="bg-orange-500" />
              <StatCard title="Labeled Assets" value={project.annotation_count || 0} icon={LayersIcon} iconColor="text-white" iconBgColor="bg-emerald-500" />
            </div>

            <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
              <nav className="-mb-px flex space-x-8">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>

            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle>Project Snapshot</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 text-sm">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-gray-500 dark:text-gray-400">Project Type</p>
                        <p className="text-gray-900 dark:text-gray-100 font-semibold capitalize">{project.type}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 dark:text-gray-400">Dataset ID</p>
                        <p className="text-gray-900 dark:text-gray-100 font-semibold">{project.dataset_id || '-'}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 dark:text-gray-400">Created</p>
                        <p className="text-gray-900 dark:text-gray-100 font-semibold">{new Date(project.created_at).toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 dark:text-gray-400">Updated</p>
                        <p className="text-gray-900 dark:text-gray-100 font-semibold">{new Date(project.updated_at).toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="pt-2">
                      <p className="text-gray-500 dark:text-gray-400">Description</p>
                      <p className="text-gray-900 dark:text-gray-100">{project.description || 'No description yet.'}</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <SparklesIcon className="w-5 h-5 text-indigo-500" />
                      Quick Actions
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button className="w-full" onClick={() => setActiveTab('images')}>
                      Browse Images
                    </Button>
                    <Button variant="outline" className="w-full" onClick={() => handleOpenAnnotate()}>
                      Annotate Workflow
                    </Button>
                    <Button variant="outline" className="w-full" onClick={() => setActiveTab('categories')}>
                      Manage Tags
                    </Button>
                    <Button className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white" onClick={handleStartTraining}>
                      Start Training
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab === 'images' && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Project Images ({imagesTotalCount})</CardTitle>
                      <Button variant="outline" onClick={loadProjectImages}>Refresh Images</Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {imagesLoading ? (
                      <LoadingState message="Loading project images..." />
                    ) : projectImages.length === 0 ? (
                      <div className="text-center py-12">
                        <ImageIcon className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No project images</h3>
                        <p className="text-gray-500 dark:text-gray-400">Add images to this project before annotation.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {projectImages.map((img) => (
                          <Card key={img.id} className="overflow-hidden border border-gray-200 dark:border-gray-700">
                            <div className="aspect-video bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                              {thumbnailUrls[img.id] ? (
                                <img
                                  src={thumbnailUrls[img.id]}
                                  alt={img.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <ImageIcon className="w-10 h-10 text-gray-400" />
                              )}
                            </div>
                            <CardContent className="p-3">
                              <p className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate" title={img.name}>{img.name}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Image ID: {img.id}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">Dataset: {img.dataset_id}</p>
                              <Button className="w-full mt-3" size="sm" onClick={() => handleOpenAnnotate(img.id)}>
                                <EditIcon className="w-4 h-4 mr-2" />
                                Annotate
                              </Button>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {imagesTotalCount > imagesPageSize && (
                  <Pagination
                    currentPage={imagesPage}
                    totalCount={imagesTotalCount}
                    pageSize={imagesPageSize}
                    onPageChange={setImagesPage}
                    onPageSizeChange={(newSize) => {
                      setImagesPageSize(newSize);
                      setImagesPage(1);
                    }}
                    gridConfig={{ cols: { sm: 1, md: 2, lg: 4, xl: 4 } }}
                  />
                )}
              </div>
            )}

            {activeTab === 'categories' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Quick Add Tag</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleAddCategory} className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tag Name</label>
                        <Input
                          value={newCategory.name}
                          onChange={(e) => setNewCategory((prev) => ({ ...prev, name: e.target.value }))}
                          placeholder="e.g. Scratch, Defect, Good"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Color</label>
                        <input
                          type="color"
                          value={newCategory.color}
                          onChange={(e) => setNewCategory((prev) => ({ ...prev, color: e.target.value }))}
                          className="w-full h-10 rounded border-2 border-gray-300 dark:border-gray-600"
                        />
                      </div>
                      <Button type="submit" className="w-full">
                        <PlusIcon className="w-4 h-4 mr-2" />
                        Add Tag
                      </Button>
                    </form>
                  </CardContent>
                </Card>

                <Card className="lg:col-span-2">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Tag Library ({categories.length})</CardTitle>
                      <Button variant="outline" onClick={() => setShowAddCategory((prev) => !prev)}>
                        {showAddCategory ? 'Hide Inline Form' : 'Show Inline Form'}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {showAddCategory && (
                      <form onSubmit={handleAddCategory} className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <Input
                            value={newCategory.name}
                            onChange={(e) => setNewCategory((prev) => ({ ...prev, name: e.target.value }))}
                            placeholder="Tag name"
                            required
                          />
                          <input
                            type="color"
                            value={newCategory.color}
                            onChange={(e) => setNewCategory((prev) => ({ ...prev, color: e.target.value }))}
                            className="w-full h-10 rounded border-2 border-gray-300 dark:border-gray-600"
                          />
                          <Button type="submit">Create</Button>
                        </div>
                      </form>
                    )}

                    {categories.length === 0 ? (
                      <div className="text-center py-12">
                        <TagIcon className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No tags yet</h3>
                        <p className="text-gray-500 dark:text-gray-400">Create your first tag to start annotation.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {categories.map((category) => (
                          <div key={category.id} className="p-3 border border-gray-200 dark:border-gray-600 rounded-lg flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-5 h-5 rounded" style={{ backgroundColor: category.category_metadata?.color || '#3B82F6' }} />
                              <div>
                                <p className="font-medium text-gray-900 dark:text-gray-100">{category.name}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">ID: {category.id}</p>
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
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};
