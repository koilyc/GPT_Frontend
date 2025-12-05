import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ImageIcon, 
  UploadIcon, 
  XIcon, 
  TrashIcon, 
  DownloadIcon, 
  ZoomInIcon,
  GridIcon,
  ListIcon,
  FilterIcon,
  ArrowLeftIcon
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { LoadingState } from '../ui/LoadingState';
import { EmptyState } from '../ui/EmptyState';
import { StatCard } from '../ui/StatCard';
import { Pagination } from '../ui/Pagination';
import { Layout } from '../layout/Layout';
import { Breadcrumb } from '../ui/Breadcrumb';
import { datasetAPI, imageAPI, workspaceAPI } from '../../api';
import type { Dataset, Workspace } from '../../types';

interface DatasetImage {
  id: number;
  filename: string;
  url: string;
  size: number;
  dimensions: { width: number; height: number };
  uploadDate: string;
}

export const DatasetDetailPage: React.FC = () => {
  const { workspaceId, datasetId } = useParams<{ workspaceId: string; datasetId: string }>();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Component state
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [dataset, setDataset] = useState<Dataset | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [allImages, setAllImages] = useState<DatasetImage[]>([]); // Store all images
  const [images, setImages] = useState<DatasetImage[]>([]); // Current page images
  const [uploading, setUploading] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedImage, setSelectedImage] = useState<DatasetImage | null>(null);
  const [filter, setFilter] = useState('');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(12); // 基於 lg: 4 cols * 3 rows
  const [totalCount, setTotalCount] = useState(0);
  const [totalImages, setTotalImages] = useState(0); // For stats display

  // Grid 配置用於智能分頁
  const gridConfig = {
    cols: { sm: 2, md: 3, lg: 4, xl: 6 }
  };

  // Load dataset data and images
  useEffect(() => {
    const loadDataset = async () => {
      if (!datasetId || !workspaceId) return;
      
      try {
        setIsLoading(true);
        
        // Load workspace and dataset info first
        const [workspaceData, datasetData] = await Promise.all([
          workspaceAPI.getById(parseInt(workspaceId)),
          datasetAPI.getById(workspaceId, parseInt(datasetId))
        ]);
        setWorkspace(workspaceData);
        setDataset(datasetData);
        
        // Load all images by fetching multiple pages if needed
        let allImages: any[] = [];
        let offset = 0;
        const limit = 100; // Max allowed by API
        let hasMore = true;
        
        while (hasMore) {
          const imagesData = await imageAPI.getAll(workspaceId, parseInt(datasetId), {
            limit,
            offset
          });
          
          console.log('API Response:', imagesData);
          
          if (offset === 0) {
            setTotalImages(imagesData.total_count || 0);
          }
          
          // Handle different response formats (API returns "Images" with capital I)
          const imagesList = Array.isArray(imagesData.Images) 
            ? imagesData.Images 
            : Array.isArray(imagesData.images) 
              ? imagesData.images 
              : Array.isArray(imagesData) 
                ? imagesData 
                : [];
          
          allImages = [...allImages, ...imagesList];
          
          // Check if we have more images to fetch
          hasMore = imagesList.length === limit && allImages.length < (imagesData.total_count || 0);
          offset += limit;
        }
        
        // Get presigned URLs for each image (using thumbnail for better performance)
        const imageUrlPromises = allImages.map(async (img) => {
          try {
            const urlData = await imageAPI.getThumbnailUrl(workspaceId, parseInt(datasetId), img.id);
            return {
              id: img.id,
              filename: img.name,
              url: urlData.presigned_url,
              size: img.image_metadata?.file_size_kb ? img.image_metadata.file_size_kb * 1024 : 0,
              dimensions: { 
                width: img.image_metadata?.width || 0, 
                height: img.image_metadata?.height || 0 
              },
              uploadDate: img.created_at
            };
          } catch (error) {
            console.error(`Failed to get URL for image ${img.id}:`, error);
            // Fallback to basic info without URL
            return {
              id: img.id,
              filename: img.name,
              url: '', // Empty URL for failed cases
              size: img.image_metadata?.file_size_kb ? img.image_metadata.file_size_kb * 1024 : 0,
              dimensions: { 
                width: img.image_metadata?.width || 0, 
                height: img.image_metadata?.height || 0 
              },
              uploadDate: img.created_at
            };
          }
        });
        
        const formattedImages = await Promise.all(imageUrlPromises);
        setAllImages(formattedImages);
        
      } catch (error) {
        console.error('Error loading dataset:', error);
        setDataset(null);
        setAllImages([]);
        setTotalImages(0);
      } finally {
        setIsLoading(false);
      }
    };

    loadDataset();
  }, [datasetId, workspaceId]); // Remove pagination dependencies since we're doing client-side pagination

  // Client-side filtering and pagination
  useEffect(() => {
    if (!allImages.length) {
      setImages([]);
      setTotalCount(0);
      return;
    }

    // Apply search filter
    const filteredImages = filter 
      ? allImages.filter(img => 
          img.filename.toLowerCase().includes(filter.toLowerCase())
        )
      : allImages;

    setTotalCount(filteredImages.length);

    // Apply pagination
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedImages = filteredImages.slice(startIndex, endIndex);

    setImages(paginatedImages);
  }, [allImages, currentPage, pageSize, filter]);

  if (isLoading) {
    return (
      <Layout>
        <LoadingState />
      </Layout>
    );
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0 || !workspaceId || !datasetId) return;

    setUploading(true);
    
    try {
      // Helper function to extract image metadata
      const getImageMetadata = (file: File): Promise<any> => {
        return new Promise((resolve, reject) => {
          const img = new Image();
          img.onload = () => {
            // Calculate file size in KB
            const fileSizeKb = Math.ceil(file.size / 1024);
            
            // Assume RGB (3 channels) for most images, RGBA (4 channels) if needed
            const colorChannels = 3;
            const colorDepth = 8; // 8 bits per channel is standard
            
            resolve({
              width: img.width,
              height: img.height,
              color_depth: colorDepth,
              color_channels: colorChannels,
              file_size_kb: fileSizeKb
            });
          };
          img.onerror = () => reject(new Error('Failed to load image'));
          img.src = URL.createObjectURL(file);
        });
      };

      // Upload images one by one with metadata
      const uploadPromises = Array.from(files).map(async (file) => {
        const metadata = await getImageMetadata(file);
        return imageAPI.upload(workspaceId, parseInt(datasetId), file.name, metadata, file);
      });
      
      await Promise.all(uploadPromises);
      
      // Reload all images to see new uploads
      const imagesData = await imageAPI.getAll(workspaceId, parseInt(datasetId), {
        limit: 100 // Use max allowed limit
      });
      setTotalImages(imagesData.total_count);
      
      // Get presigned URLs for each image (API returns "Images" with capital I, using thumbnail for better performance)
      const imagesList = imagesData.Images || imagesData.images || [];
      const imageUrlPromises = imagesList.map(async (img) => {
        try {
          const urlData = await imageAPI.getThumbnailUrl(workspaceId, parseInt(datasetId), img.id);
          return {
            id: img.id,
            filename: img.name,
            url: urlData.presigned_url,
            size: img.image_metadata?.file_size_kb ? img.image_metadata.file_size_kb * 1024 : 0,
            dimensions: { 
              width: img.image_metadata?.width || 0, 
              height: img.image_metadata?.height || 0 
            },
            uploadDate: img.created_at
          };
        } catch (error) {
          console.error(`Failed to get URL for uploaded image ${img.id}:`, error);
          // Fallback without URL
          return {
            id: img.id,
            filename: img.name,
            url: '',
            size: img.image_metadata?.file_size_kb ? img.image_metadata.file_size_kb * 1024 : 0,
            dimensions: { 
              width: img.image_metadata?.width || 0, 
              height: img.image_metadata?.height || 0 
            },
            uploadDate: img.created_at
          };
        }
      });
      
      const formattedImages = await Promise.all(imageUrlPromises);
      setAllImages(formattedImages);
    } catch (error) {
      console.error('Upload failed:', error);
      alert('上傳失敗，請重試');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDeleteImage = async (imageId: number) => {
    if (!workspaceId || !datasetId) return;
    
    if (confirm('確定要刪除這張圖片嗎？')) {
      try {
        await imageAPI.delete(workspaceId, parseInt(datasetId), imageId);
        // Remove from all images and let the effect update the current page
        setAllImages(prev => prev.filter(img => img.id !== imageId));
        setTotalImages(prev => prev - 1);
      } catch (error) {
        console.error('Delete failed:', error);
        alert('刪除失敗，請重試');
      }
    }
  };

  const handleDownloadImage = (image: DatasetImage) => {
    const link = document.createElement('a');
    link.href = image.url;
    link.download = image.filename;
    link.click();
  };

  // Pagination handlers
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setCurrentPage(1); // Reset to first page when page size changes
  };

  // Search handler with debounce effect
  const handleSearchChange = (searchTerm: string) => {
    setFilter(searchTerm);
    setCurrentPage(1); // Reset to first page when searching
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Calculate stats from all images, not just current page
  const totalSize = allImages.reduce((sum, img) => sum + img.size, 0);

  if (isLoading) {
    return (
      <Layout>
        <LoadingState message="Loading dataset..." />
      </Layout>
    );
  }

  if (!dataset) {
    return (
      <Layout>
        <EmptyState
          icon={ImageIcon}
          title="Dataset not found"
          description="The dataset you're looking for doesn't exist or you don't have access to it."
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
                  { label: workspace?.name || 'Workspace', href: `/workspaces/${workspaceId}` },
                  { label: dataset.name, active: true }
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
                  {dataset.name} 📸
                </h1>
                <p className="text-lg text-gray-600 dark:text-gray-400">
                  {dataset.description || 'Manage and browse dataset images'}
                </p>
              </div>
              <div className="flex space-x-3">
                <Button 
                  variant="outline"
                  onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                  className="px-4 py-2"
                >
                  {viewMode === 'grid' ? <ListIcon className="h-4 w-4" /> : <GridIcon className="h-4 w-4" />}
                </Button>
                <Button 
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  <UploadIcon className="h-5 w-5 mr-2" />
                  {uploading ? 'Uploading...' : 'Upload Images'}
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <StatCard
              title="Total Images"
              value={totalImages}
              icon={ImageIcon}
              iconColor="text-white"
              iconBgColor="bg-blue-500"
            />
            <StatCard
              title="Storage Used"
              value={formatFileSize(totalSize)}
              icon={UploadIcon}
              iconColor="text-white"
              iconBgColor="bg-green-500"
            />
            <StatCard
              title="Avg Resolution"
              value={allImages.length > 0 ? 
                `${Math.round(allImages.reduce((sum, img) => sum + img.dimensions.width, 0) / allImages.length)}x${Math.round(allImages.reduce((sum, img) => sum + img.dimensions.height, 0) / allImages.length)}` 
                : 'N/A'
              }
              icon={ZoomInIcon}
              iconColor="text-white"
              iconBgColor="bg-purple-500"
            />
            <StatCard
              title="Last Upload"
              value={allImages.length > 0 ? 'Today' : 'Never'}
              icon={UploadIcon}
              iconColor="text-white"
              iconBgColor="bg-orange-500"
            />
          </div>

          {/* Controls */}
          <Card className="mb-8 shadow-lg border-0 bg-white">
            <CardContent className="p-4">
              <div className="flex items-center space-x-4">
                <div className="flex-1">
                  <Input
                    placeholder="Search images by filename..."
                    value={filter}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    className="w-full"
                  />
                </div>
                <Button variant="outline" className="px-4 py-2">
                  <FilterIcon className="h-4 w-4 mr-2" />
                  Filter
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
          />

          {/* Images Grid/List */}
          <Card className="shadow-lg border-0 bg-white dark:bg-gray-800">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-b border-gray-100 dark:border-gray-700">
              <CardTitle className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center">
                <ImageIcon className="h-6 w-6 text-blue-600 dark:text-blue-400 mr-2" />
                Images ({images.length} of {totalCount})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {images.length === 0 ? (
                <EmptyState
                  icon={ImageIcon}
                  title={totalImages === 0 ? "No images uploaded" : "No images match your search"}
                  description={totalImages === 0 ? 
                    "Upload your first images to start building your dataset." :
                    "Try adjusting your search terms or clearing the filter."
                  }
                  action={totalImages === 0 ? {
                    label: "Upload Your First Images",
                    onClick: () => fileInputRef.current?.click()
                  } : undefined}
                />
              ) : viewMode === 'grid' ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                  {images.map((image) => (
                    <div 
                      key={image.id} 
                      className="group relative bg-gray-100 rounded-lg overflow-hidden aspect-square hover:shadow-lg transition-all duration-200"
                    >
                      <img
                        src={image.url}
                        alt={image.filename}
                        className="w-full h-full object-cover cursor-pointer"
                        onClick={() => setSelectedImage(image)}
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-600"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedImage(image);
                            }}
                          >
                            <ZoomInIcon className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-600"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDownloadImage(image);
                            }}
                          >
                            <DownloadIcon className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="bg-white text-red-600 hover:bg-red-50"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteImage(image.id);
                            }}
                          >
                            <TrashIcon className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 text-white p-2 text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <p className="truncate">{image.filename}</p>
                        <p>{image.dimensions.width}x{image.dimensions.height}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {images.map((image) => (
                    <div 
                      key={image.id}
                      className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                    >
                      <img
                        src={image.url}
                        alt={image.filename}
                        className="w-16 h-16 object-cover rounded-lg mr-4 cursor-pointer"
                        onClick={() => setSelectedImage(image)}
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{image.filename}</h4>
                        <p className="text-sm text-gray-500">
                          {image.dimensions.width}x{image.dimensions.height} • {formatFileSize(image.size)}
                        </p>
                        <p className="text-xs text-gray-400">
                          Uploaded {new Date(image.uploadDate).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedImage(image)}
                        >
                          <ZoomInIcon className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDownloadImage(image)}
                        >
                          <DownloadIcon className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 hover:bg-red-50"
                          onClick={() => handleDeleteImage(image.id)}
                        >
                          <TrashIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
            
            {/* Pagination */}
            {allImages.length > 0 && (
              <Pagination
                currentPage={currentPage}
                totalCount={totalCount}
                pageSize={pageSize}
                onPageChange={handlePageChange}
                onPageSizeChange={handlePageSizeChange}
                gridConfig={gridConfig}
              />
            )}
          </Card>
        </div>

        {/* Image Preview Modal */}
        {selectedImage && (
          <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
            <div className="relative max-w-4xl max-h-full">
              <Button
                className="absolute top-4 right-4 bg-black bg-opacity-50 text-white hover:bg-opacity-70 z-10"
                onClick={() => setSelectedImage(null)}
              >
                <XIcon className="h-6 w-6" />
              </Button>
              <img
                src={selectedImage.url}
                alt={selectedImage.filename}
                className="max-w-full max-h-full object-contain rounded-lg"
              />
              <div className="absolute bottom-4 left-4 bg-black bg-opacity-70 text-white p-4 rounded-lg">
                <h3 className="font-semibold">{selectedImage.filename}</h3>
                <p className="text-sm">
                  {selectedImage.dimensions.width}x{selectedImage.dimensions.height} • {formatFileSize(selectedImage.size)}
                </p>
                <p className="text-xs opacity-75">
                  Uploaded {new Date(selectedImage.uploadDate).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default DatasetDetailPage;
