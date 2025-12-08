import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeftIcon, 
  TagIcon, 
  SaveIcon, 
  TrashIcon,
  ZoomInIcon,
  ZoomOutIcon,
  RotateCwIcon,
  SquareIcon,
  PenToolIcon,
  MousePointerIcon
} from 'lucide-react';
import { Layout } from '../layout/Layout';
import { Button } from '../ui/Button';
import { Card, CardContent } from '../ui/Card';
import { LoadingState } from '../ui/LoadingState';
import { projectAPI, imageAPI, categoryAPI, annotationAPI } from '../../api';
import type { Project, Image, Category, GeneralAnnotation, Annotation } from '../../types';

type ToolType = 'select' | 'bbox' | 'polygon';

interface BBox {
  x: number;
  y: number;
  width: number;
  height: number;
  categoryId: number;
}

interface PolygonAnnotation {
  points: [number, number][];
  categoryId: number;
}

export const AnnotationPage: React.FC = () => {
  const { workspaceId, projectId } = useParams<{ workspaceId: string; projectId: string }>();
  const navigate = useNavigate();
  
  const [project, setProject] = useState<Project | null>(null);
  const [images, setImages] = useState<Image[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [currentImage, setCurrentImage] = useState<Image | null>(null);
  const [imageUrl, setImageUrl] = useState<string>('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Annotation state
  const [annotations, setAnnotations] = useState<Annotation | null>(null);
  const [currentTool, setCurrentTool] = useState<ToolType>('select');
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentBBox, setCurrentBBox] = useState<Partial<BBox> | null>(null);
  const [currentPolygon, setCurrentPolygon] = useState<[number, number][]>([]);
  const [bboxes, setBboxes] = useState<BBox[]>([]);
  const [polygons, setPolygons] = useState<PolygonAnnotation[]>([]);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    loadData();
  }, [workspaceId, projectId]);

  useEffect(() => {
    if (images.length > 0 && currentImageIndex < images.length) {
      setCurrentImage(images[currentImageIndex]);
      loadImageUrl(images[currentImageIndex].id);
      loadAnnotations(images[currentImageIndex].id);
    }
  }, [currentImageIndex, images]);

  useEffect(() => {
    if (imageUrl && canvasRef.current) {
      drawCanvas();
    }
  }, [imageUrl, bboxes, polygons, currentBBox, currentPolygon, scale]);

  const loadData = async () => {
    if (!workspaceId || !projectId) return;
    
    try {
      setLoading(true);
      const [projectData, imagesData, categoriesData] = await Promise.all([
        projectAPI.getById(parseInt(workspaceId), parseInt(projectId)),
        projectAPI.getImages(parseInt(workspaceId), parseInt(projectId), { limit: 100 }),
        categoryAPI.getAll(parseInt(workspaceId), parseInt(projectId))
      ]);
      
      setProject(projectData);
      setImages(imagesData.images || []);
      setCategories(Array.isArray(categoriesData) ? categoriesData : []);
      
      if (categoriesData.length > 0) {
        setSelectedCategoryId(categoriesData[0].id);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadImageUrl = async (imageId: number) => {
    if (!workspaceId || !projectId) return;
    
    try {
      const urlData = await imageAPI.getImageUrl(parseInt(workspaceId), parseInt(projectId), imageId);
      setImageUrl(urlData.url);
    } catch (error) {
      console.error('Failed to load image URL:', error);
    }
  };

  const loadAnnotations = async (imageId: number) => {
    if (!workspaceId || !projectId) return;
    
    try {
      const annotationData = await annotationAPI.getByImage(
        parseInt(workspaceId), 
        parseInt(projectId), 
        imageId
      );
      setAnnotations(annotationData);
      
      // Parse existing annotations
      const newBboxes: BBox[] = [];
      const newPolygons: PolygonAnnotation[] = [];
      
      if (annotationData && annotationData.data) {
        annotationData.data.forEach((ann: GeneralAnnotation) => {
          if (ann.data.type === 'bbox' && ann.data.bbox) {
            const [x, y, width, height] = ann.data.bbox;
            newBboxes.push({ x, y, width, height, categoryId: ann.category_id });
          } else if (ann.data.type === 'polygon' && ann.data.points) {
            newPolygons.push({ 
              points: ann.data.points as [number, number][], 
              categoryId: ann.category_id 
            });
          }
        });
      }
      
      setBboxes(newBboxes);
      setPolygons(newPolygons);
    } catch (error) {
      console.error('Failed to load annotations:', error);
      setAnnotations(null);
      setBboxes([]);
      setPolygons([]);
    }
  };

  const drawCanvas = () => {
    const canvas = canvasRef.current;
    const img = imageRef.current;
    if (!canvas || !img || !imageUrl) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size to match image
    canvas.width = img.naturalWidth * scale;
    canvas.height = img.naturalHeight * scale;

    // Draw image
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    // Draw existing bboxes
    bboxes.forEach((bbox) => {
      const category = categories.find(c => c.id === bbox.categoryId);
      const color = category?.category_metadata?.color || '#FF0000';
      
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.strokeRect(
        bbox.x * scale, 
        bbox.y * scale, 
        bbox.width * scale, 
        bbox.height * scale
      );
      
      // Draw label
      ctx.fillStyle = color;
      ctx.fillRect(bbox.x * scale, bbox.y * scale - 20, 100, 20);
      ctx.fillStyle = 'white';
      ctx.font = '12px Arial';
      ctx.fillText(category?.name || 'Unknown', bbox.x * scale + 5, bbox.y * scale - 5);
    });

    // Draw existing polygons
    polygons.forEach((polygon) => {
      const category = categories.find(c => c.id === polygon.categoryId);
      const color = category?.category_metadata?.color || '#FF0000';
      
      if (polygon.points.length > 0) {
        ctx.strokeStyle = color;
        ctx.fillStyle = color + '33'; // Add transparency
        ctx.lineWidth = 2;
        
        ctx.beginPath();
        ctx.moveTo(polygon.points[0][0] * scale, polygon.points[0][1] * scale);
        for (let i = 1; i < polygon.points.length; i++) {
          ctx.lineTo(polygon.points[i][0] * scale, polygon.points[i][1] * scale);
        }
        ctx.closePath();
        ctx.stroke();
        ctx.fill();
        
        // Draw points
        polygon.points.forEach(([x, y]) => {
          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.arc(x * scale, y * scale, 4, 0, 2 * Math.PI);
          ctx.fill();
        });
      }
    });

    // Draw current bbox being drawn
    if (currentBBox && currentBBox.x !== undefined && currentBBox.y !== undefined && 
        currentBBox.width !== undefined && currentBBox.height !== undefined) {
      const category = categories.find(c => c.id === selectedCategoryId);
      const color = category?.category_metadata?.color || '#FF0000';
      
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.strokeRect(
        currentBBox.x * scale, 
        currentBBox.y * scale, 
        currentBBox.width * scale, 
        currentBBox.height * scale
      );
      ctx.setLineDash([]);
    }

    // Draw current polygon being drawn
    if (currentPolygon.length > 0) {
      const category = categories.find(c => c.id === selectedCategoryId);
      const color = category?.category_metadata?.color || '#FF0000';
      
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      
      ctx.beginPath();
      ctx.moveTo(currentPolygon[0][0] * scale, currentPolygon[0][1] * scale);
      for (let i = 1; i < currentPolygon.length; i++) {
        ctx.lineTo(currentPolygon[i][0] * scale, currentPolygon[i][1] * scale);
      }
      ctx.stroke();
      ctx.setLineDash([]);
      
      // Draw points
      currentPolygon.forEach(([x, y]) => {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x * scale, y * scale, 4, 0, 2 * Math.PI);
        ctx.fill();
      });
    }
  };

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (currentTool === 'select') return;
    if (!selectedCategoryId) {
      alert('Please select a category first');
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / scale;
    const y = (e.clientY - rect.top) / scale;

    if (currentTool === 'bbox') {
      setIsDrawing(true);
      setCurrentBBox({ x, y, width: 0, height: 0, categoryId: selectedCategoryId });
    } else if (currentTool === 'polygon') {
      setCurrentPolygon([...currentPolygon, [x, y]]);
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (currentTool !== 'bbox' || !isDrawing || !currentBBox) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / scale;
    const y = (e.clientY - rect.top) / scale;

    setCurrentBBox({
      ...currentBBox,
      width: x - (currentBBox.x || 0),
      height: y - (currentBBox.y || 0)
    });
  };

  const handleCanvasMouseUp = () => {
    if (currentTool !== 'bbox' || !isDrawing || !currentBBox) return;

    setIsDrawing(false);
    
    if (currentBBox.width !== undefined && currentBBox.height !== undefined &&
        Math.abs(currentBBox.width) > 5 && Math.abs(currentBBox.height) > 5) {
      setBboxes([...bboxes, currentBBox as BBox]);
    }
    
    setCurrentBBox(null);
  };

  const handleFinishPolygon = () => {
    if (currentPolygon.length >= 3 && selectedCategoryId) {
      setPolygons([...polygons, { points: currentPolygon, categoryId: selectedCategoryId }]);
      setCurrentPolygon([]);
    }
  };

  const handleSaveAnnotations = async () => {
    if (!workspaceId || !projectId || !currentImage) return;

    try {
      const annotationData: GeneralAnnotation[] = [];

      // Add bboxes
      bboxes.forEach(bbox => {
        annotationData.push({
          category_id: bbox.categoryId,
          data: {
            type: 'bbox',
            bbox: [bbox.x, bbox.y, bbox.width, bbox.height]
          }
        });
      });

      // Add polygons
      polygons.forEach(polygon => {
        annotationData.push({
          category_id: polygon.categoryId,
          data: {
            type: 'polygon',
            points: polygon.points
          }
        });
      });

      await annotationAPI.create(
        parseInt(workspaceId),
        parseInt(projectId),
        currentImage.id,
        { data: annotationData }
      );

      alert('Annotations saved successfully!');
    } catch (error) {
      console.error('Failed to save annotations:', error);
      alert('Failed to save annotations');
    }
  };

  const handleClearAll = () => {
    if (confirm('Are you sure you want to clear all annotations?')) {
      setBboxes([]);
      setPolygons([]);
      setCurrentBBox(null);
      setCurrentPolygon([]);
    }
  };

  const handleNextImage = () => {
    if (currentImageIndex < images.length - 1) {
      setCurrentImageIndex(currentImageIndex + 1);
    }
  };

  const handlePrevImage = () => {
    if (currentImageIndex > 0) {
      setCurrentImageIndex(currentImageIndex - 1);
    }
  };

  if (loading) {
    return (
      <Layout>
        <LoadingState message="Loading annotation tool..." />
      </Layout>
    );
  }

  if (!project || categories.length === 0) {
    return (
      <Layout>
        <div className="p-8">
          <Card>
            <CardContent className="p-6">
              <p className="text-center text-gray-600">
                {!project ? 'Project not found' : 'Please create categories before annotating images'}
              </p>
              <div className="flex justify-center mt-4">
                <Button onClick={() => navigate(`/workspaces/${workspaceId}/projects/${projectId}`)}>
                  Go Back to Project
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 shadow-sm">
          <div className="max-w-full mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Button
                  variant="outline"
                  onClick={() => navigate(`/workspaces/${workspaceId}/projects/${projectId}`)}
                >
                  <ArrowLeftIcon className="h-4 w-4 mr-2" />
                  Back to Project
                </Button>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{project.name} - Annotation</h1>
                  <p className="text-sm text-gray-600">
                    Image {currentImageIndex + 1} of {images.length}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  onClick={handlePrevImage}
                  disabled={currentImageIndex === 0}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  onClick={handleNextImage}
                  disabled={currentImageIndex >= images.length - 1}
                >
                  Next
                </Button>
                <Button
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={handleSaveAnnotations}
                >
                  <SaveIcon className="h-4 w-4 mr-2" />
                  Save
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex h-[calc(100vh-80px)]">
          {/* Sidebar */}
          <div className="w-80 bg-white border-r border-gray-200 overflow-y-auto">
            <div className="p-4 space-y-4">
              {/* Tools */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Tools</h3>
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    variant={currentTool === 'select' ? 'default' : 'outline'}
                    className="w-full"
                    onClick={() => setCurrentTool('select')}
                  >
                    <MousePointerIcon className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={currentTool === 'bbox' ? 'default' : 'outline'}
                    className="w-full"
                    onClick={() => setCurrentTool('bbox')}
                  >
                    <SquareIcon className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={currentTool === 'polygon' ? 'default' : 'outline'}
                    className="w-full"
                    onClick={() => setCurrentTool('polygon')}
                  >
                    <PenToolIcon className="h-4 w-4" />
                  </Button>
                </div>
                {currentTool === 'polygon' && currentPolygon.length > 0 && (
                  <Button
                    className="w-full mt-2 bg-green-600 hover:bg-green-700 text-white"
                    onClick={handleFinishPolygon}
                  >
                    Finish Polygon ({currentPolygon.length} points)
                  </Button>
                )}
              </div>

              {/* Categories */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Categories</h3>
                <div className="space-y-1">
                  {categories.map(category => (
                    <button
                      key={category.id}
                      className={`w-full text-left px-3 py-2 rounded flex items-center space-x-2 ${
                        selectedCategoryId === category.id
                          ? 'bg-blue-100 border border-blue-500'
                          : 'bg-gray-50 hover:bg-gray-100 border border-gray-200'
                      }`}
                      onClick={() => setSelectedCategoryId(category.id)}
                    >
                      <div
                        className="w-4 h-4 rounded"
                        style={{ backgroundColor: category.category_metadata?.color || '#3B82F6' }}
                      />
                      <span className="text-sm font-medium">{category.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Annotations List */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-gray-700">Annotations</h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleClearAll}
                  >
                    <TrashIcon className="h-3 w-3 mr-1" />
                    Clear All
                  </Button>
                </div>
                <div className="space-y-1 text-sm text-gray-600">
                  <p>Bounding Boxes: {bboxes.length}</p>
                  <p>Polygons: {polygons.length}</p>
                </div>
              </div>

              {/* Zoom Controls */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Zoom</h3>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setScale(Math.max(0.1, scale - 0.1))}
                  >
                    <ZoomOutIcon className="h-4 w-4" />
                  </Button>
                  <span className="text-sm text-gray-600 min-w-[60px] text-center">
                    {Math.round(scale * 100)}%
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setScale(Math.min(3, scale + 0.1))}
                  >
                    <ZoomInIcon className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setScale(1)}
                  >
                    Reset
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Canvas Area */}
          <div className="flex-1 overflow-auto bg-gray-100 p-4">
            <div className="flex items-center justify-center min-h-full">
              {imageUrl ? (
                <div className="relative">
                  <img
                    ref={imageRef}
                    src={imageUrl}
                    alt="Annotation target"
                    className="hidden"
                    onLoad={drawCanvas}
                  />
                  <canvas
                    ref={canvasRef}
                    className="border border-gray-300 shadow-lg bg-white cursor-crosshair"
                    onMouseDown={handleCanvasMouseDown}
                    onMouseMove={handleCanvasMouseMove}
                    onMouseUp={handleCanvasMouseUp}
                  />
                </div>
              ) : (
                <div className="text-center text-gray-500">
                  <p>No image to display</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};
