import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeftIcon, ZoomInIcon, ZoomOutIcon } from 'lucide-react';
import { Layout } from '../layout/Layout';
import { Button } from '../ui/Button';
import { Card, CardContent } from '../ui/Card';
import { LoadingState } from '../ui/LoadingState';
import { projectAPI, categoryAPI, annotationAPI, imageAPI } from '../../api';
import type { Project, Category, ProjectImage } from '../../types';

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

interface RotatedBoxAnnotation {
  xtl: number;
  ytl: number;
  xbr: number;
  ybr: number;
  rotation: number;
  categoryId: number;
}

interface MaskAnnotation {
  rle: string;
  left: number;
  top: number;
  width: number;
  height: number;
  categoryId: number;
}

const hexToRgb = (hex: string): [number, number, number] => {
  const normalized = hex.replace('#', '');
  if (normalized.length !== 6) return [255, 0, 0];
  const r = Number.parseInt(normalized.slice(0, 2), 16);
  const g = Number.parseInt(normalized.slice(2, 4), 16);
  const b = Number.parseInt(normalized.slice(4, 6), 16);
  if ([r, g, b].some((n) => Number.isNaN(n))) return [255, 0, 0];
  return [r, g, b];
};

const decodeCompressedRleCounts = (encoded: string): number[] => {
  const counts: number[] = [];
  let p = 0;
  let m = 0;

  while (p < encoded.length) {
    let x = 0;
    let k = 0;
    let more = true;

    while (more) {
      const c = encoded.charCodeAt(p) - 48;
      p += 1;
      x |= (c & 0x1f) << (5 * k);
      more = (c & 0x20) !== 0;
      k += 1;
      if (!more && (c & 0x10) !== 0) {
        x |= -1 << (5 * k);
      }
    }

    if (m > 2) {
      x += counts[m - 2];
    }
    counts.push(x);
    m += 1;
  }

  return counts;
};

const decodeMaskRle = (encoded: string, width: number, height: number): Uint8Array => {
  const counts = decodeCompressedRleCounts(encoded);
  const total = width * height;
  const mask = new Uint8Array(total);

  let idx = 0;
  let value = 0;
  for (const count of counts) {
    if (!Number.isFinite(count) || count <= 0) {
      value = 1 - value;
      continue;
    }

    const end = Math.min(total, idx + count);
    if (value === 1) {
      mask.fill(1, idx, end);
    }
    idx = end;
    value = 1 - value;
    if (idx >= total) break;
  }

  return mask;
};

const IMAGE_BATCH_SIZE = 100;
const IMAGE_PREFETCH_THRESHOLD = 5;

export const AnnotationPage: React.FC = () => {
  const { workspaceId, projectId } = useParams<{ workspaceId: string; projectId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [project, setProject] = useState<Project | null>(null);
  const [images, setImages] = useState<ProjectImage[]>([]);
  const [imagesTotalCount, setImagesTotalCount] = useState(0);
  const [loadingMoreImages, setLoadingMoreImages] = useState(false);
  const [jumpIndexInput, setJumpIndexInput] = useState('');
  const [jumpImageIdInput, setJumpImageIdInput] = useState('');
  const [jumpingToImage, setJumpingToImage] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imageUrl, setImageUrl] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const [bboxes, setBboxes] = useState<BBox[]>([]);
  const [rotatedBoxes, setRotatedBoxes] = useState<RotatedBoxAnnotation[]>([]);
  const [polygons, setPolygons] = useState<PolygonAnnotation[]>([]);
  const [masks, setMasks] = useState<MaskAnnotation[]>([]);
  const [tagCategoryIds, setTagCategoryIds] = useState<number[]>([]);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const [fitScale, setFitScale] = useState(1);
  const [zoomScale, setZoomScale] = useState(1);
  const scale = fitScale * zoomScale;

  const currentImage = images[currentImageIndex] || null;
  const imagesRef = useRef<ProjectImage[]>([]);
  const imagesTotalCountRef = useRef(0);

  useEffect(() => {
    imagesRef.current = images;
  }, [images]);

  useEffect(() => {
    imagesTotalCountRef.current = imagesTotalCount;
  }, [imagesTotalCount]);

  const loadData = useCallback(async () => {
    if (!workspaceId || !projectId) return;

    try {
      setLoading(true);
      const [projectData, categoriesData] = await Promise.all([
        projectAPI.getById(parseInt(workspaceId, 10), parseInt(projectId, 10)),
        categoryAPI.getAll(parseInt(workspaceId, 10), parseInt(projectId, 10)),
      ]);

      setProject(projectData);
      setCategories(Array.isArray(categoriesData) ? categoriesData : []);

      const imagesData = await projectAPI.getImages(
        parseInt(workspaceId, 10),
        parseInt(projectId, 10),
        { limit: IMAGE_BATCH_SIZE, offset: 0 },
      );

      const initialBatch = imagesData.Images || [];
      setImages(initialBatch);
      setImagesTotalCount(imagesData.total_count || initialBatch.length);
    } catch (error) {
      console.error('Failed to load annotation viewer data:', error);
    } finally {
      setLoading(false);
    }
  }, [workspaceId, projectId]);

  const loadMoreImages = useCallback(async (): Promise<boolean> => {
    if (!workspaceId || !projectId || loadingMoreImages) return false;
    const loadedCount = imagesRef.current.length;
    if (loadedCount >= imagesTotalCountRef.current) return false;

    try {
      setLoadingMoreImages(true);
      const imagesData = await projectAPI.getImages(
        parseInt(workspaceId, 10),
        parseInt(projectId, 10),
        { limit: IMAGE_BATCH_SIZE, offset: loadedCount },
      );

      const batch = imagesData.Images || [];
      if (batch.length === 0) return false;

      let hasAppended = false;

      setImages((prev) => {
        const existingIds = new Set(prev.map((img) => img.id));
        const dedupedBatch = batch.filter((img) => !existingIds.has(img.id));
        if (dedupedBatch.length === 0) {
          imagesRef.current = prev;
          return prev;
        }

        hasAppended = true;
        const merged = [...prev, ...dedupedBatch];
        imagesRef.current = merged;
        return merged;
      });
      const nextTotalCount = imagesData.total_count || imagesTotalCountRef.current;
      setImagesTotalCount(nextTotalCount);
      imagesTotalCountRef.current = nextTotalCount;

      return hasAppended;
    } catch (error) {
      console.error('Failed to load more images:', error);
      return false;
    } finally {
      setLoadingMoreImages(false);
    }
  }, [workspaceId, projectId, loadingMoreImages]);

  const findImageIndexById = useCallback((imageId: number) => {
    return imagesRef.current.findIndex((img) => img.id === imageId || img.image_id === imageId);
  }, []);

  const ensureLoadedUpToIndex = useCallback(async (targetIndex: number) => {
    let safetyCounter = 0;
    while (
      imagesRef.current.length <= targetIndex &&
      imagesRef.current.length < imagesTotalCountRef.current &&
      safetyCounter < 50
    ) {
      const appended = await loadMoreImages();
      if (!appended) break;
      safetyCounter += 1;
    }
  }, [loadMoreImages]);

  const handleJumpToIndex = useCallback(async () => {
    const requestedIndex = Number(jumpIndexInput);
    const totalCount = imagesTotalCountRef.current || imagesRef.current.length;
    if (!Number.isFinite(requestedIndex) || requestedIndex < 1 || requestedIndex > totalCount) return;

    setJumpingToImage(true);
    try {
      const targetIndex = requestedIndex - 1;
      await ensureLoadedUpToIndex(targetIndex);
      if (targetIndex < imagesRef.current.length) {
        setCurrentImageIndex(targetIndex);
      }
    } finally {
      setJumpingToImage(false);
    }
  }, [jumpIndexInput, ensureLoadedUpToIndex]);

  const handleJumpToImageId = useCallback(async () => {
    const requestedId = Number(jumpImageIdInput);
    if (!Number.isFinite(requestedId) || requestedId <= 0) return;

    setJumpingToImage(true);
    try {
      let targetIndex = findImageIndexById(requestedId);
      let safetyCounter = 0;
      while (targetIndex < 0 && imagesRef.current.length < imagesTotalCountRef.current && safetyCounter < 50) {
        const appended = await loadMoreImages();
        if (!appended) break;
        targetIndex = findImageIndexById(requestedId);
        safetyCounter += 1;
      }

      if (targetIndex >= 0) {
        setCurrentImageIndex(targetIndex);
      }
    } finally {
      setJumpingToImage(false);
    }
  }, [jumpImageIdInput, findImageIndexById, loadMoreImages]);

  const loadImageUrl = useCallback(async (image: ProjectImage) => {
    if (!workspaceId || !image?.id || !image?.dataset_id) {
      setImageUrl('');
      return;
    }

    try {
      const urlResponse = await imageAPI.getContentUrl(parseInt(workspaceId, 10), image.dataset_id, image.id);
      setImageUrl(urlResponse.presigned_url || '');
    } catch (error) {
      console.error('Failed to load image content URL, fallback to path:', error);
      setImageUrl(image.path || '');
    }
  }, [workspaceId]);

  const loadAnnotations = useCallback(async (imageId: number) => {
    if (!workspaceId || !projectId) return;

    try {
      const annotationData = await annotationAPI.getByImage(
        parseInt(workspaceId, 10),
        parseInt(projectId, 10),
        imageId,
      );

      const newBboxes: BBox[] = [];
      const newRotatedBoxes: RotatedBoxAnnotation[] = [];
      const newPolygons: PolygonAnnotation[] = [];
      const newMasks: MaskAnnotation[] = [];
      const newTags: number[] = [];

      const rawAnnotations = Array.isArray(annotationData?.data) ? annotationData.data : [];

      rawAnnotations.forEach((ann: any) => {
        if (!ann || typeof ann !== 'object') return;

        const categoryId = Number(ann.category_id);
        if (!Number.isFinite(categoryId)) return;

        const annData = ann.data && typeof ann.data === 'object' ? ann.data : ann;
        const annType = annData?.type_ ?? annData?.type;

        if (annType === 'tag') {
          newTags.push(categoryId);
          return;
        }

        if (annType === 'box') {
          const xtl = Number(annData.xtl);
          const ytl = Number(annData.ytl);
          const xbr = Number(annData.xbr);
          const ybr = Number(annData.ybr);
          if ([xtl, ytl, xbr, ybr].every((n) => Number.isFinite(n)) && xbr > xtl && ybr > ytl) {
            newBboxes.push({ x: xtl, y: ytl, width: xbr - xtl, height: ybr - ytl, categoryId });
          }
          return;
        }

        if (annType === 'rotated_box') {
          const xtl = Number(annData.xtl);
          const ytl = Number(annData.ytl);
          const xbr = Number(annData.xbr);
          const ybr = Number(annData.ybr);
          const rotation = Number(annData.rotation ?? 0);
          if ([xtl, ytl, xbr, ybr, rotation].every((n) => Number.isFinite(n)) && xbr > xtl && ybr > ytl) {
            newRotatedBoxes.push({ xtl, ytl, xbr, ybr, rotation, categoryId });
          }
          return;
        }

        if (annType === 'polygon' && Array.isArray(annData.points)) {
          const points = annData.points
            .filter((p: any) => Array.isArray(p) && p.length >= 2)
            .map((p: any) => [Number(p[0]), Number(p[1])] as [number, number])
            .filter(([x, y]: [number, number]) => Number.isFinite(x) && Number.isFinite(y));
          if (points.length >= 3) {
            newPolygons.push({ points, categoryId });
          }
          return;
        }

        if (annType === 'mask' && typeof annData.rle === 'string') {
          const left = Number(annData.left ?? 0);
          const top = Number(annData.top ?? 0);
          const width = Number(annData.width ?? 0);
          const height = Number(annData.height ?? 0);
          if ([left, top, width, height].every((n) => Number.isFinite(n)) && width > 0 && height > 0) {
            newMasks.push({ rle: annData.rle, left, top, width, height, categoryId });
          }
        }
      });

      setBboxes(newBboxes);
      setRotatedBoxes(newRotatedBoxes);
      setPolygons(newPolygons);
      setMasks(newMasks);
      setTagCategoryIds(Array.from(new Set(newTags)));
    } catch (error) {
      console.error('Failed to load annotations:', error);
      setBboxes([]);
      setRotatedBoxes([]);
      setPolygons([]);
      setMasks([]);
      setTagCategoryIds([]);
    }
  }, [workspaceId, projectId]);

  const isCategoryVisible = useCallback((categoryId: number) => {
    return selectedCategoryId === null || selectedCategoryId === categoryId;
  }, [selectedCategoryId]);

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imageRef.current;
    if (!canvas || !img || !imageUrl) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = img.naturalWidth * scale;
    canvas.height = img.naturalHeight * scale;

    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    bboxes.forEach((bbox) => {
      if (!isCategoryVisible(bbox.categoryId)) return;
      const category = categories.find((c) => c.id === bbox.categoryId);
      const color = category?.category_metadata?.color || '#FF0000';

      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.strokeRect(bbox.x * scale, bbox.y * scale, bbox.width * scale, bbox.height * scale);

      ctx.fillStyle = color;
      ctx.fillRect(bbox.x * scale, bbox.y * scale - 20, 120, 20);
      ctx.fillStyle = 'white';
      ctx.font = '12px Arial';
      ctx.fillText(category?.name || `Category ${bbox.categoryId}`, bbox.x * scale + 5, bbox.y * scale - 5);
    });

    polygons.forEach((polygon) => {
      if (!isCategoryVisible(polygon.categoryId)) return;
      if (polygon.points.length < 3) return;

      const category = categories.find((c) => c.id === polygon.categoryId);
      const color = category?.category_metadata?.color || '#FF0000';

      ctx.strokeStyle = color;
      ctx.fillStyle = `${color}33`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(polygon.points[0][0] * scale, polygon.points[0][1] * scale);
      for (let i = 1; i < polygon.points.length; i++) {
        ctx.lineTo(polygon.points[i][0] * scale, polygon.points[i][1] * scale);
      }
      ctx.closePath();
      ctx.stroke();
      ctx.fill();
    });

    rotatedBoxes.forEach((rotBox) => {
      if (!isCategoryVisible(rotBox.categoryId)) return;
      const category = categories.find((c) => c.id === rotBox.categoryId);
      const color = category?.category_metadata?.color || '#FF0000';

      const cx = ((rotBox.xtl + rotBox.xbr) / 2) * scale;
      const cy = ((rotBox.ytl + rotBox.ybr) / 2) * scale;
      const w = (rotBox.xbr - rotBox.xtl) * scale;
      const h = (rotBox.ybr - rotBox.ytl) * scale;
      const angleRad = (rotBox.rotation * Math.PI) / 180;

      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(angleRad);
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.strokeRect(-w / 2, -h / 2, w, h);
      ctx.restore();
    });

    masks.forEach((maskAnn) => {
      if (!isCategoryVisible(maskAnn.categoryId)) return;
      const category = categories.find((c) => c.id === maskAnn.categoryId);
      const color = category?.category_metadata?.color || '#FF0000';
      const [r, g, b] = hexToRgb(color);

      const binaryMask = decodeMaskRle(maskAnn.rle, maskAnn.width, maskAnn.height);
      const offscreen = document.createElement('canvas');
      offscreen.width = maskAnn.width;
      offscreen.height = maskAnn.height;
      const offCtx = offscreen.getContext('2d');
      if (!offCtx) return;

      const imgData = offCtx.createImageData(maskAnn.width, maskAnn.height);
      for (let y = 0; y < maskAnn.height; y++) {
        for (let x = 0; x < maskAnn.width; x++) {
          const fortranIdx = y + x * maskAnn.height;
          if (binaryMask[fortranIdx] !== 1) continue;
          const rgbaIdx = (y * maskAnn.width + x) * 4;
          imgData.data[rgbaIdx] = r;
          imgData.data[rgbaIdx + 1] = g;
          imgData.data[rgbaIdx + 2] = b;
          imgData.data[rgbaIdx + 3] = 90;
        }
      }
      offCtx.putImageData(imgData, 0, 0);
      ctx.drawImage(offscreen, maskAnn.left * scale, maskAnn.top * scale, maskAnn.width * scale, maskAnn.height * scale);
    });
  }, [imageUrl, scale, bboxes, polygons, rotatedBoxes, masks, categories, isCategoryVisible]);

  const recomputeFitScale = useCallback(() => {
    const img = imageRef.current;
    const container = canvasContainerRef.current;
    if (!img || !container || !img.naturalWidth || !img.naturalHeight) return;

    const horizontalPadding = 24;
    const verticalPadding = 24;
    const availableWidth = Math.max(120, container.clientWidth - horizontalPadding);
    const availableHeight = Math.max(120, container.clientHeight - verticalPadding);

    const widthScale = availableWidth / img.naturalWidth;
    const heightScale = availableHeight / img.naturalHeight;
    const nextFitScale = Math.max(0.05, Math.min(widthScale, heightScale));

    setFitScale(nextFitScale);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (!currentImage) return;
    loadImageUrl(currentImage);
    loadAnnotations(currentImage.id);
  }, [currentImage, loadImageUrl, loadAnnotations]);

  useEffect(() => {
    const requestedImageId = Number(searchParams.get('imageId'));
    if (!requestedImageId || images.length === 0) return;

    const targetIndex = images.findIndex((img) => img.id === requestedImageId || img.image_id === requestedImageId);
    if (targetIndex >= 0) {
      setCurrentImageIndex(targetIndex);
    }
  }, [images, searchParams]);

  useEffect(() => {
    if (currentImageIndex >= images.length - IMAGE_PREFETCH_THRESHOLD && images.length < imagesTotalCount) {
      void loadMoreImages();
    }
  }, [currentImageIndex, images.length, imagesTotalCount, loadMoreImages]);

  useEffect(() => {
    const requestedImageId = Number(searchParams.get('imageId'));
    if (!requestedImageId || images.length === 0) return;

    const found = images.some((img) => img.id === requestedImageId || img.image_id === requestedImageId);
    if (!found && images.length < imagesTotalCount) {
      void loadMoreImages();
    }
  }, [images, imagesTotalCount, searchParams, loadMoreImages]);

  const loadedProgressPercent = imagesTotalCount > 0
    ? Math.min(100, Math.round((images.length / imagesTotalCount) * 100))
    : 100;

  useEffect(() => {
    if (imageUrl && canvasRef.current) {
      drawCanvas();
    }
  }, [imageUrl, scale, drawCanvas]);

  useEffect(() => {
    setZoomScale(1);
  }, [currentImage?.id]);

  useEffect(() => {
    const handleResize = () => recomputeFitScale();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [recomputeFitScale]);

  const handleImageLoad = () => {
    recomputeFitScale();
  };

  const handleNextImage = async () => {
    if (currentImageIndex < images.length - 1) {
      setCurrentImageIndex(currentImageIndex + 1);
      return;
    }

    if (images.length < imagesTotalCount) {
      const previousLoadedCount = images.length;
      await loadMoreImages();
      setCurrentImageIndex((prev) => (prev === previousLoadedCount - 1 ? prev + 1 : prev));
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
        <LoadingState message="Loading annotation viewer..." />
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
                {!project ? 'Project not found' : 'No categories found for this project.'}
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
      <div className="flex flex-col h-full bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm flex-shrink-0">
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
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{project.name} - Annotation Viewer</h1>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Image {images.length === 0 ? 0 : currentImageIndex + 1} of {imagesTotalCount || images.length}
                    {loadingMoreImages ? ' (loading more...)' : ''}
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
                  disabled={currentImageIndex >= (imagesTotalCount || images.length) - 1}
                >
                  Next
                </Button>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-1 lg:grid-cols-2 gap-2">
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={1}
                  max={imagesTotalCount || undefined}
                  value={jumpIndexInput}
                  onChange={(e) => setJumpIndexInput(e.target.value)}
                  placeholder={`Go to # (1-${imagesTotalCount || images.length || 1})`}
                  className="h-9"
                />
                <Button
                  variant="outline"
                  onClick={() => void handleJumpToIndex()}
                  disabled={jumpingToImage || loadingMoreImages}
                >
                  Go
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={1}
                  value={jumpImageIdInput}
                  onChange={(e) => setJumpImageIdInput(e.target.value)}
                  placeholder="Go to image ID"
                  className="h-9"
                />
                <Button
                  variant="outline"
                  onClick={() => void handleJumpToImageId()}
                  disabled={jumpingToImage || loadingMoreImages}
                >
                  Go
                </Button>
              </div>
            </div>

            <div className="mt-3">
              <div className="h-2 w-full rounded bg-gray-200 dark:bg-gray-700 overflow-hidden">
                <div
                  className="h-full bg-blue-500 transition-all duration-300"
                  style={{ width: `${loadedProgressPercent}%` }}
                />
              </div>
              <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                Loaded {images.length} / {imagesTotalCount || images.length} images ({loadedProgressPercent}%)
              </p>
            </div>

            <div className="mt-3 text-xs text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/20 border border-amber-300 dark:border-amber-700 rounded px-3 py-2">
              Viewer mode is enabled. This page only displays existing annotations for the current image.
            </div>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          <div className="w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
            <div className="p-4 space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Categories Filter</h3>
                <div className="space-y-1">
                  <button
                    className={`w-full text-left px-3 py-2 rounded ${
                      selectedCategoryId === null
                        ? 'bg-blue-100 dark:bg-blue-900/30 border border-blue-500'
                        : 'bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-600'
                    }`}
                    onClick={() => setSelectedCategoryId(null)}
                  >
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">All Categories</span>
                  </button>
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      className={`w-full text-left px-3 py-2 rounded flex items-center space-x-2 ${
                        selectedCategoryId === category.id
                          ? 'bg-blue-100 dark:bg-blue-900/30 border border-blue-500'
                          : 'bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-600'
                      }`}
                      onClick={() => setSelectedCategoryId(category.id)}
                    >
                      <div
                        className="w-4 h-4 rounded"
                        style={{ backgroundColor: category.category_metadata?.color || '#3B82F6' }}
                      />
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{category.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Annotations Summary</h3>
                <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                  <p>Bounding Boxes: {bboxes.length}</p>
                  <p>Rotated Boxes: {rotatedBoxes.length}</p>
                  <p>Polygons: {polygons.length}</p>
                  <p>Masks: {masks.length}</p>
                  <p>Tags: {tagCategoryIds.length}</p>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Zoom</h3>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setZoomScale((prev) => Math.max(0.2, prev / 1.15))}
                  >
                    <ZoomOutIcon className="h-4 w-4" />
                  </Button>
                  <span className="text-sm text-gray-600 dark:text-gray-400 min-w-[60px] text-center">
                    {Math.round(scale * 100)}%
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setZoomScale((prev) => Math.min(8, prev * 1.15))}
                  >
                    <ZoomInIcon className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setZoomScale(1);
                      recomputeFitScale();
                    }}
                  >
                    Reset
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-auto bg-gradient-to-br from-gray-100 to-gray-50 dark:from-gray-900 dark:to-gray-800 p-4">
            <div ref={canvasContainerRef} className="flex items-center justify-center min-h-full">
              {imageUrl ? (
                <div className="relative">
                  <img
                    ref={imageRef}
                    src={imageUrl}
                    alt="Annotation target"
                    className="hidden"
                    onLoad={handleImageLoad}
                  />
                  <canvas
                    ref={canvasRef}
                    className="border border-gray-300 shadow-lg bg-white"
                  />
                </div>
              ) : (
                <div className="text-center text-gray-500 dark:text-gray-400">
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
