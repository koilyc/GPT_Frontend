import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { ImageIcon, PlusIcon, XIcon, UploadIcon, TrashIcon } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { EmptyState } from '../ui/EmptyState';
import { StatCard } from '../ui/StatCard';
import { Layout } from '../layout/Layout';
import { useProjects } from '../../hooks/useProjects';
import type { Image } from '../../types';

export const ImageManagementPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const { projects } = useProjects();
  const [images, setImages] = useState<Image[]>([]);
  const [uploadMode, setUploadMode] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [uploading, setUploading] = useState(false);

  const project = projectId ? projects.find(p => p.id === parseInt(projectId)) : null;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedFiles(e.target.files);
  };

  const handleUpload = async () => {
    if (!selectedFiles || selectedFiles.length === 0) return;

    setUploading(true);
    try {
      // Mock upload - replace with actual API call
      console.log('Uploading files:', selectedFiles);
      // const uploadedImages = await imageAPI.upload(projectId!, selectedFiles);
      // setImages(prev => [...prev, ...uploadedImages]);
      setSelectedFiles(null);
      setUploadMode(false);
    } catch (error) {
      console.error('Failed to upload images:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (imageId: string) => {
    if (!confirm('Are you sure you want to delete this image?')) return;

    try {
      // Mock delete - replace with actual API call
      console.log('Deleting image:', imageId);
      // await imageAPI.delete(imageId);
      setImages(prev => prev.filter(img => img.id !== imageId));
    } catch (error) {
      console.error('Failed to delete image:', error);
    }
  };

  if (!project) {
    return (
      <Layout>
        <EmptyState
          icon={ImageIcon}
          title="Project not found"
          description="The project you're looking for doesn't exist or you don't have access to it."
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
                  {project.name} Images 🖼️
                </h1>
                <p className="text-lg text-gray-600 dark:text-gray-400">
                  Upload and manage images for your AI vision project.
                </p>
              </div>
              <Button 
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                onClick={() => setUploadMode(true)}
              >
                <UploadIcon className="h-5 w-5 mr-2" />
                Upload Images
              </Button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <StatCard
              title="Total Images"
              value={images.length}
              icon={ImageIcon}
              iconColor="text-white"
              iconBgColor="bg-blue-500"
            />
            <StatCard
              title="Labeled"
              value={images.filter(() => false).length} // Add actual labeled logic
              icon={PlusIcon}
              iconColor="text-white"
              iconBgColor="bg-green-500"
            />
            <StatCard
              title="Unlabeled"
              value={images.filter(() => true).length} // Add actual unlabeled logic
              icon={XIcon}
              iconColor="text-white"
              iconBgColor="bg-orange-500"
            />
            <StatCard
              title="Training"
              value="Ready"
              icon={TrashIcon}
              iconColor="text-white"
              iconBgColor="bg-purple-500"
            />
          </div>

          {/* Upload Modal */}
          {uploadMode && (
            <Card className="mb-8 shadow-lg border-0 bg-white dark:bg-gray-800">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-b border-gray-100 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center">
                    <UploadIcon className="h-6 w-6 text-purple-600 dark:text-purple-400 mr-2" />
                    Upload Images
                  </CardTitle>
                  <Button 
                    variant="outline"
                    onClick={() => {
                      setUploadMode(false);
                      setSelectedFiles(null);
                    }}
                    className="p-2"
                  >
                    <XIcon className="h-5 w-5" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Images
                    </label>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                    />
                    {selectedFiles && selectedFiles.length > 0 && (
                      <p className="text-sm text-gray-600 mt-2">
                        {selectedFiles.length} file(s) selected
                      </p>
                    )}
                  </div>

                  <div className="flex space-x-4">
                    <Button
                      onClick={handleUpload}
                      disabled={!selectedFiles || selectedFiles.length === 0 || uploading}
                      className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg transition-colors duration-200"
                    >
                      {uploading ? 'Uploading...' : 'Upload Images'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setUploadMode(false);
                        setSelectedFiles(null);
                      }}
                      className="px-6 py-2"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Images Grid */}
          <Card className="shadow-lg border-0 bg-white">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b border-gray-100">
              <CardTitle className="text-xl font-bold text-gray-900 flex items-center">
                <ImageIcon className="h-6 w-6 text-purple-600 mr-2" />
                All Images ({images.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {images.length === 0 ? (
                <EmptyState
                  icon={ImageIcon}
                  title="No images uploaded yet"
                  description="Upload your first images to start training your AI vision model."
                  action={{
                    label: "Upload Your First Images",
                    onClick: () => setUploadMode(true)
                  }}
                />
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {images.map((image) => (
                    <div key={image.id} className="relative group">
                      <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                        <img
                          src={image.file_path || '/placeholder-image.jpg'}
                          alt={image.filename || 'Image'}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 rounded-lg flex items-center justify-center">
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="bg-white text-gray-900 hover:bg-gray-100"
                            onClick={() => {/* Open image in modal */}}
                          >
                            View
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="bg-red-500 text-white hover:bg-red-600"
                            onClick={() => handleDelete(image.id)}
                          >
                            <TrashIcon className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <p className="text-xs text-gray-600 mt-2 truncate">
                        {image.filename || 'Untitled'}
                      </p>
                    </div>
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
