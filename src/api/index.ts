import axios from 'axios';
import type {
  User,
  LoginRequest,
  RegisterRequest,
  Workspace,
  CreateWorkspaceRequest,
  Project,
  CreateProjectRequest,
  Dataset,
  CreateDatasetRequest,
  Image,
  Annotation,
  Model,
  TrainingJob,
  TrainingJobListResponse,
  CreateTrainingJobRequest,
  SubscriptionPlan,
  PaginationParams,
  WorkspaceListResponse
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://devaptservice.japaneast.cloudapp.azure.com';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 second timeout
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: async (credentials: LoginRequest): Promise<{ access_token: string; token_type: string }> => {
    const response = await api.post('/api/auth/login', {
      email: credentials.email,
      password: credentials.password,
    });
    return response.data;
  },

  register: async (userData: RegisterRequest): Promise<User> => {
    const response = await api.post('/api/auth/register', userData);
    return response.data;
  },

  logout: async (): Promise<void> => {
    await api.post('/api/auth/logout');
    localStorage.removeItem('access_token');
  },
};

// Workspace API
export const workspaceAPI = {
  getAll: async (params?: PaginationParams): Promise<WorkspaceListResponse> => {
    const searchParams = new URLSearchParams();
    
    // Convert page to offset for the API (backend expects offset, not page)
    if (params?.page && params?.limit) {
      const offset = (params.page - 1) * params.limit;
      searchParams.append('offset', offset.toString());
    }
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.search) searchParams.append('keyword', params.search);
    if (params?.sort_by) searchParams.append('order_by', params.sort_by);
    if (params?.order === 'desc') searchParams.append('desc', 'true');
    
    const queryString = searchParams.toString();
    const url = queryString ? `/api/workspaces?${queryString}` : '/api/workspaces';
    
    const response = await api.get(url);
    return {
      total_count: response.data.total_count || 0,
      workspaces: response.data.workspaces || []
    };
  },

  getById: async (id: string): Promise<Workspace> => {
    const response = await api.get(`/api/workspaces/${id}`);
    return response.data;
  },

  create: async (workspace: CreateWorkspaceRequest): Promise<Workspace> => {
    const response = await api.post('/api/workspaces', workspace);
    return response.data;
  },

  update: async (id: string, workspace: Partial<CreateWorkspaceRequest>): Promise<Workspace> => {
    const response = await api.put(`/api/workspaces/${id}`, workspace);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/api/workspaces/${id}`);
  },
};

// Project API
export const projectAPI = {
  getAll: async (workspaceId: string): Promise<Project[]> => {
    const response = await api.get(`/api/workspaces/${workspaceId}/projects`);
    return response.data.projects || [];
  },

  getById: async (workspaceId: string, projectId: string): Promise<Project> => {
    const response = await api.get(`/api/workspaces/${workspaceId}/projects/${projectId}`);
    return response.data;
  },

  create: async (workspaceId: string, project: CreateProjectRequest): Promise<Project> => {
    const response = await api.post(`/api/workspaces/${workspaceId}/projects`, project);
    return response.data;
  },

  update: async (workspaceId: string, projectId: string, project: Partial<CreateProjectRequest>): Promise<Project> => {
    const response = await api.put(`/api/workspaces/${workspaceId}/projects/${projectId}`, project);
    return response.data;
  },

  delete: async (workspaceId: string, projectId: string): Promise<void> => {
    await api.delete(`/api/workspaces/${workspaceId}/projects/${projectId}`);
  },
};

// Dataset API
export const datasetAPI = {
  getAll: async (): Promise<Dataset[]> => {
    const response = await api.get('/api/datasets');
    return response.data.datasets || [];
  },

  getByWorkspace: async (workspaceId: string): Promise<Dataset[]> => {
    const response = await api.get(`/api/workspaces/${workspaceId}/datasets/`);
    return response.data.datasets || [];
  },

  getById: async (workspaceId: string, datasetId: number): Promise<Dataset> => {
    const response = await api.get(`/api/workspaces/${workspaceId}/datasets/${datasetId}`);
    return response.data;
  },

  create: async (workspaceId: string, dataset: CreateDatasetRequest): Promise<Dataset> => {
    const response = await api.post(`/api/workspaces/${workspaceId}/datasets/`, dataset);
    return response.data;
  },

  update: async (workspaceId: string, datasetId: number, dataset: Partial<CreateDatasetRequest>): Promise<Dataset> => {
    const response = await api.put(`/api/workspaces/${workspaceId}/datasets/${datasetId}`, dataset);
    return response.data;
  },

  delete: async (workspaceId: string, datasetId: number): Promise<void> => {
    await api.delete(`/api/workspaces/${workspaceId}/datasets/${datasetId}`);
  },

  // Dataset Images API
  getImages: async (workspaceId: string, datasetId: number, params?: PaginationParams): Promise<{ total_count: number; Images: Image[] }> => {
    const queryParams = new URLSearchParams();
    
    // Convert page to offset for the API (backend expects offset, not page)
    if (params?.page && params?.limit) {
      const offset = (params.page - 1) * params.limit;
      queryParams.append('offset', offset.toString());
    }
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.search) queryParams.append('keyword', params.search);
    if (params?.sort_by) queryParams.append('order_by', params.sort_by);
    if (params?.order === 'desc') queryParams.append('desc', 'true');
    
    const url = `/api/workspaces/${workspaceId}/datasets/${datasetId}/images${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await api.get(url);
    return response.data;
  },

  uploadImages: async (workspaceId: string, datasetId: number, files: FileList): Promise<Image[]> => {
    const formData = new FormData();
    Array.from(files).forEach(file => {
      formData.append('files', file);
    });

    const response = await api.post(`/api/workspaces/${workspaceId}/datasets/${datasetId}/images`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  deleteImage: async (workspaceId: string, datasetId: number, imageId: number): Promise<void> => {
    await api.delete(`/api/workspaces/${workspaceId}/datasets/${datasetId}/images/${imageId}`);
  },

  // Get image presigned URL
  getImageUrl: async (workspaceId: string, datasetId: number, imageId: number): Promise<{ presigned_url: string }> => {
    const response = await api.get(`/api/workspaces/${workspaceId}/datasets/${datasetId}/images/${imageId}/content`);
    return response.data;
  },

  // Get single image details (includes presigned URL in path field)
  getImage: async (workspaceId: string, datasetId: number, imageId: number): Promise<Image> => {
    const response = await api.get(`/api/workspaces/${workspaceId}/datasets/${datasetId}/images/${imageId}`);
    return response.data;
  },
};

// Image API (for projects)
export const imageAPI = {
  getAll: async (projectId: string): Promise<Image[]> => {
    const response = await api.get(`/projects/${projectId}/images`);
    return response.data;
  },

  upload: async (projectId: string, files: FileList): Promise<Image[]> => {
    const formData = new FormData();
    Array.from(files).forEach(file => {
      formData.append('files', file);
    });

    const response = await api.post(`/projects/${projectId}/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  delete: async (imageId: string): Promise<void> => {
    await api.delete(`/images/${imageId}`);
  },
};

// Annotation API
export const annotationAPI = {
  getByImage: async (imageId: string): Promise<Annotation[]> => {
    const response = await api.get(`/images/${imageId}/annotations`);
    return response.data;
  },

  create: async (annotation: Omit<Annotation, 'id' | 'created_at'>): Promise<Annotation> => {
    const response = await api.post('/api/annotations', annotation);
    return response.data;
  },

  update: async (id: string, annotation: Partial<Annotation>): Promise<Annotation> => {
    const response = await api.put(`/api/annotations/${id}`, annotation);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/api/annotations/${id}`);
  },
};

// Model API
export const modelAPI = {
  getAll: async (projectId: string): Promise<Model[]> => {
    const response = await api.get(`/api/projects/${projectId}/models`);
    return response.data;
  },

  train: async (projectId: string, modelConfig: any): Promise<Model> => {
    const response = await api.post(`/api/projects/${projectId}/train`, modelConfig);
    return response.data;
  },

  predict: async (modelId: string, imageId: string): Promise<any> => {
    const response = await api.post(`/models/${modelId}/predict`, { image_id: imageId });
    return response.data;
  },

  delete: async (modelId: string): Promise<void> => {
    await api.delete(`/api/models/${modelId}`);
  },
};

// Training Job API
export const trainingJobAPI = {
  // Get all training jobs for a workspace
  getByWorkspace: async (workspaceId: number, params?: {
    keyword?: string;
    offset?: number;
    limit?: number;
    order_by?: string;
    desc?: boolean;
    job_status?: string[];
  }): Promise<TrainingJobListResponse> => {
    const response = await api.get(`/api/workspaces/${workspaceId}/projects/-/training_jobs`, {
      params
    });
    return response.data;
  },

  // Get training jobs for a specific project
  getByProject: async (workspaceId: number, projectId: number, params?: {
    keyword?: string;
    offset?: number;
    limit?: number;
    order_by?: string;
    desc?: boolean;
    job_status?: string[];
  }): Promise<TrainingJobListResponse> => {
    const response = await api.get(`/api/workspaces/${workspaceId}/projects/${projectId}/training_jobs`, {
      params
    });
    return response.data;
  },

  // Get a specific training job
  getById: async (workspaceId: number, projectId: number, jobId: number): Promise<TrainingJob> => {
    const response = await api.get(`/api/workspaces/${workspaceId}/projects/${projectId}/training_jobs/${jobId}`);
    return response.data;
  },

  // Create a new training job
  create: async (workspaceId: number, projectId: number, jobData: CreateTrainingJobRequest): Promise<TrainingJob> => {
    const response = await api.post(`/api/workspaces/${workspaceId}/projects/${projectId}/training_jobs`, jobData);
    return response.data;
  },

  // Cancel a training job
  cancel: async (workspaceId: number, projectId: number, jobId: number): Promise<TrainingJob> => {
    const response = await api.post(`/api/workspaces/${workspaceId}/projects/${projectId}/training_jobs/${jobId}/cancel`);
    return response.data;
  },

  // Delete a training job
  delete: async (workspaceId: number, projectId: number, jobId: number): Promise<void> => {
    await api.delete(`/api/workspaces/${workspaceId}/projects/${projectId}/training_jobs/${jobId}`);
  },
};

// Subscription API
export const subscriptionAPI = {
  getPlans: async (): Promise<SubscriptionPlan[]> => {
    const response = await api.get('/api/subscription/plans');
    return response.data;
  },

  getCurrentPlan: async (): Promise<SubscriptionPlan> => {
    const response = await api.get('/api/subscription/current');
    return response.data;
  },

  subscribe: async (planId: string): Promise<any> => {
    const response = await api.post('/api/subscription/subscribe', { plan_id: planId });
    return response.data;
  },
};
