import axios from 'axios';
import type {
  User,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  UpdatePasswordRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  UserListResponse,
  Workspace,
  CreateWorkspaceRequest,
  WorkspaceListResponse,
  WorkspaceMember,
  WorkspaceMemberListResponse,
  InviteMemberRequest,
  InviteSummaryResponse,
  WorkspaceDataUsage,
  Project,
  CreateProjectRequest,
  ProjectListResponse,
  ProjectImageListResponse,
  Dataset,
  CreateDatasetRequest,
  DatasetListResponse,
  Image,
  ImageListResponse,
  ImagePresignedUrlResponse,
  Annotation,
  MultiAnnotationResponse,
  Category,
  TrainingJob,
  TrainingJobListResponse,
  CreateTrainingJobRequest,
  ModelWeightsPresignedUrlResponse,
  Notification,
  NotificationListResponse,
  QuotaResponse,
  Prediction,
  PredictionListResponse,
  Metric,
  MFASetupResponse,
  MFAStatusResponse,
  RecoveryCodesResponse,
  AutolabelModelResponse,
  AutolabelFeaturesResponse,
  SubscriptionPlan,
  PaginationParams,
  CommonQueryParams,
  ProjectQueryParams,
  WorkspaceQueryParams,
  WorkspaceMemberQueryParams,
  JobQueryParams,
  NotificationQueryParams,
  UserQueryParams,
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 second timeout
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
  // Email verification
  verifyEmail: async (email: string): Promise<void> => {
    await api.post('/api/auth/email', { email });
  },

  // Register new user
  register: async (userData: RegisterRequest): Promise<LoginResponse> => {
    const response = await api.post('/api/auth/register', userData);
    return response.data;
  },

  // Activate account with signup token
  activateAccount: async (): Promise<LoginResponse> => {
    const response = await api.post('/api/auth/activation');
    return response.data;
  },

  // Login
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    const response = await api.post('/api/auth/login', credentials);
    return response.data;
  },

  // Token-based login
  tokenLogin: async (): Promise<User> => {
    const response = await api.post('/api/auth/token-login');
    return response.data;
  },

  // Update password
  updatePassword: async (data: UpdatePasswordRequest): Promise<void> => {
    await api.patch('/api/auth/update-password', data);
  },

  // Forgot password
  forgotPassword: async (data: ForgotPasswordRequest): Promise<void> => {
    await api.post('/api/auth/forgot-password', data);
  },

  // Reset password
  resetPassword: async (data: ResetPasswordRequest): Promise<void> => {
    await api.post('/api/auth/reset-password', data);
  },

  // Logout
  logout: (): void => {
    localStorage.removeItem('access_token');
  },
};

// Account API
export const accountAPI = {
  // Get current user profile
  getProfile: async (): Promise<User> => {
    const response = await api.get('/api/accounts/profile');
    return response.data;
  },

  // Update current user profile
  updateProfile: async (data: Partial<User>): Promise<User> => {
    const response = await api.patch('/api/accounts/profile', data);
    return response.data;
  },

  // Delete own account
  deleteAccount: async (): Promise<void> => {
    await api.delete('/api/accounts/self');
  },

  // Get notification settings
  getNotificationSettings: async (): Promise<Record<string, boolean>> => {
    const response = await api.get('/api/accounts/preferences/notifications');
    return response.data;
  },

  // Update notification settings
  updateNotificationSettings: async (settings: Record<string, boolean>): Promise<Record<string, boolean>> => {
    const response = await api.patch('/api/accounts/preferences/notifications', settings);
    return response.data;
  },

  // Get EDM subscription status
  getEdmSubscription: async (): Promise<{ id: number; subscription: boolean }> => {
    const response = await api.get('/api/accounts/edm-subscription');
    return response.data;
  },

  // Update EDM subscription
  updateEdmSubscription: async (subscription: boolean): Promise<{ id: number; subscription: boolean }> => {
    const response = await api.patch('/api/accounts/edm-subscription', { subscription });
    return response.data;
  },
};

// Users API (Admin)
export const usersAPI = {
  // Get all users (admin)
  getAll: async (params?: UserQueryParams): Promise<UserListResponse> => {
    const response = await api.get('/api/users', { params });
    return response.data;
  },

  // Get user by UUID (admin)
  getById: async (uuid: string): Promise<User> => {
    const response = await api.get(`/api/users/${uuid}`);
    return response.data;
  },

  // Delete user by email (admin)
  deleteByEmail: async (email: string): Promise<void> => {
    await api.delete('/api/users', { params: { email } });
  },

  // Activate account (admin)
  activateAccount: async (email: string): Promise<void> => {
    await api.post('/api/users/activation', { email });
  },

  // Bulk activate accounts (admin)
  bulkActivateAccounts: async (emails: string[]): Promise<void> => {
    await api.post('/api/users/activation', { emails }, { headers: { 'X-API-Version': '2' } });
  },

  // Reset password (admin)
  resetPassword: async (email: string, newPassword: string): Promise<void> => {
    await api.post('/api/users/reset-password', { email, new_password: newPassword });
  },

  // Update user enabled status (admin)
  updateEnabled: async (emails: string[], enabled: boolean): Promise<void> => {
    await api.post('/api/users/enabled', { emails, enabled });
  },

  // Update user system role (admin)
  updateSystemRole: async (uuid: string, role: string): Promise<void> => {
    await api.post('/api/users/update-role', { uuid, role });
  },
};

// Workspace API
export const workspaceAPI = {
  // Get all workspaces
  getAll: async (params?: WorkspaceQueryParams): Promise<WorkspaceListResponse> => {
    const response = await api.get('/api/workspaces', { params });
    return response.data;
  },

  // Get workspaces with IT licenses (admin)
  getWithItLicenses: async (params?: CommonQueryParams & { user_uuid?: string; role?: string; subscription_name?: string; trial_used?: boolean }): Promise<any> => {
    const response = await api.get('/api/workspaces/it-licenses', { params });
    return response.data;
  },

  // Get workspace by ID
  getById: async (id: number): Promise<Workspace> => {
    const response = await api.get(`/api/workspaces/${id}`);
    return response.data;
  },

  // Create workspace
  create: async (workspace: CreateWorkspaceRequest): Promise<Workspace> => {
    const response = await api.post('/api/workspaces', workspace);
    return response.data;
  },

  // Update workspace
  update: async (id: number, workspace: Partial<CreateWorkspaceRequest>): Promise<Workspace> => {
    const response = await api.patch(`/api/workspaces/${id}`, workspace);
    return response.data;
  },

  // Delete workspace
  delete: async (id: number): Promise<void> => {
    await api.delete(`/api/workspaces/${id}`);
  },

  // Get current usage
  getCurrentUsage: async (id: number): Promise<WorkspaceDataUsage> => {
    const response = await api.get(`/api/workspaces/${id}/current_usage`);
    return response.data;
  },

  // Get members
  getMembers: async (id: number, params?: WorkspaceMemberQueryParams): Promise<WorkspaceMemberListResponse> => {
    const response = await api.get(`/api/workspaces/${id}/members`, { params });
    return response.data;
  },

  // Get my role in workspace
  getMyRole: async (id: number): Promise<{ role: string }> => {
    const response = await api.get(`/api/workspaces/${id}/my-role`);
    return response.data;
  },

  // Invite members
  inviteMembers: async (id: number, data: InviteMemberRequest): Promise<InviteSummaryResponse> => {
    const response = await api.post(`/api/workspaces/${id}/members`, data);
    return response.data;
  },

  // Update member role
  updateMemberRole: async (id: number, email: string, role: string): Promise<void> => {
    await api.patch(`/api/workspaces/${id}/members`, { email, role });
  },

  // Delete member
  deleteMember: async (id: number, email: string): Promise<void> => {
    await api.delete(`/api/workspaces/${id}/member`, { data: { email } });
  },

  // Delete invitation
  deleteInvitation: async (id: number, email: string): Promise<void> => {
    await api.delete(`/api/workspaces/${id}/invitation`, { data: { email } });
  },

  // Get invite link
  getInviteLink: async (id: number): Promise<{ invite_link: string }> => {
    const response = await api.get(`/api/workspaces/${id}/invite-link`);
    return response.data;
  },

  // Get resource limits
  getResourceLimits: async (id: number): Promise<Record<string, any>> => {
    const response = await api.get(`/api/workspaces/${id}/resource_limits`);
    return response.data;
  },

  // Get APT licenses
  getAptLicenses: async (id: number): Promise<any[]> => {
    const response = await api.get(`/api/workspaces/${id}/apt_licenses`);
    return response.data;
  },
};

// Project API
export const projectAPI = {
  // Get all projects in workspace
  getAll: async (workspaceId: number, params?: ProjectQueryParams): Promise<ProjectListResponse> => {
    const response = await api.get(`/api/workspaces/${workspaceId}/projects`, { params });
    return response.data;
  },

  // Get project by ID
  getById: async (workspaceId: number, projectId: number): Promise<Project> => {
    const response = await api.get(`/api/workspaces/${workspaceId}/projects/${projectId}`);
    return response.data;
  },

  // Create project
  create: async (workspaceId: number, project: CreateProjectRequest): Promise<Project> => {
    const response = await api.post(`/api/workspaces/${workspaceId}/projects`, project);
    return response.data;
  },

  // Update project
  update: async (workspaceId: number, projectId: number, project: Partial<CreateProjectRequest>): Promise<Project> => {
    const response = await api.patch(`/api/workspaces/${workspaceId}/projects/${projectId}`, project);
    return response.data;
  },

  // Delete project (soft delete)
  delete: async (workspaceId: number, projectId: number): Promise<void> => {
    await api.delete(`/api/workspaces/${workspaceId}/projects/${projectId}`);
  },

  // Purge project (permanent delete)
  purge: async (workspaceId: number, projectId: number): Promise<void> => {
    await api.delete(`/api/workspaces/${workspaceId}/projects/${projectId}/purge`);
  },

  // Duplicate project
  duplicate: async (workspaceId: number, projectId: number, targetWorkspaceId?: number, name?: string): Promise<Project> => {
    const response = await api.post(`/api/workspaces/${workspaceId}/projects/${projectId}/duplicate`, 
      targetWorkspaceId ? { target_workspace_id: targetWorkspaceId, name } : null
    );
    return response.data;
  },

  // Restore project
  restore: async (workspaceId: number, projectId: number, name?: string, description?: string): Promise<Project> => {
    const response = await api.post(`/api/workspaces/${workspaceId}/projects/${projectId}/restore`, { name, description });
    return response.data;
  },

  // Get project images
  getImages: async (workspaceId: number, projectId: number, params?: PaginationParams): Promise<ProjectImageListResponse> => {
    const response = await api.get(`/api/workspaces/${workspaceId}/projects/${projectId}/images`, { params });
    return response.data;
  },

  // Update project images (v1 - PATCH)
  updateImages: async (workspaceId: number, projectId: number, imageIds: number[]): Promise<void> => {
    await api.patch(`/api/workspaces/${workspaceId}/projects/${projectId}/images`, { image_ids: imageIds });
  },

  // Update project images (v2 - PUT - replace)
  replaceImages: async (workspaceId: number, projectId: number, imageIds: number[]): Promise<void> => {
    await api.put(`/api/workspaces/${workspaceId}/projects/${projectId}/images`, { image_ids: imageIds }, { headers: { 'X-API-Version': '2' } });
  },

  // Add project images (v2 - PATCH - add only)
  addImages: async (workspaceId: number, projectId: number, imageIds: number[]): Promise<void> => {
    await api.patch(`/api/workspaces/${workspaceId}/projects/${projectId}/images`, { image_ids: imageIds }, { headers: { 'X-API-Version': '2' } });
  },

  // Update ROI
  updateRoi: async (workspaceId: number, projectId: number, roi: any): Promise<Project> => {
    const response = await api.patch(`/api/workspaces/${workspaceId}/projects/${projectId}/roi`, roi);
    return response.data;
  },

  // Delete ROI
  deleteRoi: async (workspaceId: number, projectId: number): Promise<void> => {
    await api.delete(`/api/workspaces/${workspaceId}/projects/${projectId}/roi`);
  },

  // Update calibration
  updateCalibration: async (workspaceId: number, projectId: number, calibration: any): Promise<Project> => {
    const response = await api.patch(`/api/workspaces/${workspaceId}/projects/${projectId}/calibration`, calibration);
    return response.data;
  },

  // Delete calibration
  deleteCalibration: async (workspaceId: number, projectId: number): Promise<void> => {
    await api.delete(`/api/workspaces/${workspaceId}/projects/${projectId}/calibration`);
  },
};

// Dataset API
export const datasetAPI = {
  // Get all datasets in workspace
  getAll: async (workspaceId: number, params?: PaginationParams): Promise<DatasetListResponse> => {
    const response = await api.get(`/api/workspaces/${workspaceId}/datasets/`, { params });
    return response.data;
  },

  // Get dataset by ID
  getById: async (workspaceId: number, datasetId: number): Promise<Dataset> => {
    const response = await api.get(`/api/workspaces/${workspaceId}/datasets/${datasetId}`);
    return response.data;
  },

  // Create dataset
  create: async (workspaceId: number, dataset: CreateDatasetRequest): Promise<Dataset> => {
    const response = await api.post(`/api/workspaces/${workspaceId}/datasets/`, dataset);
    return response.data;
  },

  // Update dataset
  update: async (workspaceId: number, datasetId: number, dataset: Partial<CreateDatasetRequest>): Promise<Dataset> => {
    const response = await api.patch(`/api/workspaces/${workspaceId}/datasets/${datasetId}`, dataset);
    return response.data;
  },

  // Delete dataset
  delete: async (workspaceId: number, datasetId: number): Promise<void> => {
    await api.delete(`/api/workspaces/${workspaceId}/datasets/${datasetId}`);
  },

  // Duplicate dataset
  duplicate: async (workspaceId: number, datasetId: number): Promise<Dataset> => {
    const response = await api.post(`/api/workspaces/${workspaceId}/datasets/${datasetId}/duplicate`);
    return response.data;
  },
};

// Image API
export const imageAPI = {
  // Get all images in dataset
  getAll: async (workspaceId: number, datasetId: number, params?: PaginationParams): Promise<ImageListResponse> => {
    const response = await api.get(`/api/workspaces/${workspaceId}/datasets/${datasetId}/images`, { params });
    return response.data;
  },

  // Get image by ID
  getById: async (workspaceId: number, datasetId: number, imageId: number): Promise<Image> => {
    const response = await api.get(`/api/workspaces/${workspaceId}/datasets/${datasetId}/images/${imageId}`);
    return response.data;
  },

  // Upload image
  upload: async (workspaceId: number, datasetId: number, name: string, imageMetadata: any, file: File): Promise<Image> => {
    const formData = new FormData();
    formData.append('name', name);
    formData.append('image_metadata', JSON.stringify(imageMetadata));
    formData.append('image_file', file);

    const response = await api.post(`/api/workspaces/${workspaceId}/datasets/${datasetId}/images`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  // Update image
  update: async (workspaceId: number, datasetId: number, imageId: number, data: Partial<Image>): Promise<Image> => {
    const response = await api.patch(`/api/workspaces/${workspaceId}/datasets/${datasetId}/images/${imageId}`, data);
    return response.data;
  },

  // Delete image
  delete: async (workspaceId: number, datasetId: number, imageId: number): Promise<void> => {
    await api.delete(`/api/workspaces/${workspaceId}/datasets/${datasetId}/images/${imageId}`);
  },

  // Get image content presigned URL
  getContentUrl: async (workspaceId: number, datasetId: number, imageId: number): Promise<ImagePresignedUrlResponse> => {
    const response = await api.get(`/api/workspaces/${workspaceId}/datasets/${datasetId}/images/${imageId}/content`);
    return response.data;
  },

  // Get image thumbnail presigned URL
  getThumbnailUrl: async (workspaceId: number, datasetId: number, imageId: number): Promise<ImagePresignedUrlResponse> => {
    const response = await api.get(`/api/workspaces/${workspaceId}/datasets/${datasetId}/images/${imageId}/thumbnail`);
    return response.data;
  },

  // Transform image
  transform: async (workspaceId: number, datasetId: number, imageId: number, augmentation: any): Promise<string> => {
    const response = await api.post(`/api/workspaces/${workspaceId}/datasets/${datasetId}/images/${imageId}/transform`, augmentation);
    return response.data;
  },
};

// Annotation API
export const annotationAPI = {
  // Create annotation
  // data should be: { data: GeneralAnnotation[], predicted_by?: number | null }
  create: async (workspaceId: number, projectId: number, imageId: number, data: { data: any[]; predicted_by?: number | null }): Promise<Annotation> => {
    const response = await api.post(`/api/workspaces/${workspaceId}/projects/${projectId}/images/${imageId}/annotations`, data);
    return response.data;
  },

  // Get annotations by image
  getByImage: async (workspaceId: number, projectId: number, imageId: number): Promise<Annotation> => {
    const response = await api.get(`/api/workspaces/${workspaceId}/projects/${projectId}/images/${imageId}/annotations`);
    return response.data;
  },

  // Get all annotations in project
  getAllByProject: async (workspaceId: number, projectId: number, params?: PaginationParams): Promise<MultiAnnotationResponse> => {
    const response = await api.get(`/api/workspaces/${workspaceId}/projects/${projectId}/images/-/annotations`, { params });
    return response.data;
  },

  // Update annotation
  update: async (workspaceId: number, projectId: number, imageId: number, annotationId: number, data: any): Promise<Annotation> => {
    const response = await api.patch(`/api/workspaces/${workspaceId}/projects/${projectId}/images/${imageId}/annotations/${annotationId}`, data);
    return response.data;
  },

  // Delete annotation
  delete: async (workspaceId: number, projectId: number, imageId: number, annotationId: number): Promise<void> => {
    await api.delete(`/api/workspaces/${workspaceId}/projects/${projectId}/images/${imageId}/annotations/${annotationId}`);
  },
};

// Category API
export const categoryAPI = {
  // Create category
  create: async (workspaceId: number, projectId: number, data: { name: string; color: string }): Promise<Category> => {
    const payload = {
      name: data.name,
      category_metadata: {
        color: data.color
      }
    };
    const response = await api.post(`/api/workspaces/${workspaceId}/projects/${projectId}/categories`, payload);
    return response.data;
  },

  // Get all categories in project
  getAll: async (workspaceId: number, projectId: number): Promise<Category[]> => {
    const response = await api.get(`/api/workspaces/${workspaceId}/projects/${projectId}/categories`);
    return response.data;
  },

  // Get category by ID
  getById: async (workspaceId: number, projectId: number, categoryId: number): Promise<Category> => {
    const response = await api.get(`/api/workspaces/${workspaceId}/projects/${projectId}/categories/${categoryId}`);
    return response.data;
  },

  // Update category
  update: async (workspaceId: number, projectId: number, categoryId: number, data: Partial<{ name: string; color: string }>): Promise<Category> => {
    const payload: any = {};
    if (data.name) payload.name = data.name;
    if (data.color) payload.category_metadata = { color: data.color };
    const response = await api.patch(`/api/workspaces/${workspaceId}/projects/${projectId}/categories/${categoryId}`, payload);
    return response.data;
  },

  // Delete category
  delete: async (workspaceId: number, projectId: number, categoryId: number): Promise<void> => {
    await api.delete(`/api/workspaces/${workspaceId}/projects/${projectId}/categories/${categoryId}`);
  },
};

// Model Weights API
export const modelWeightsAPI = {
  // Get model presigned URL for download
  getPresignedUrl: async (workspaceId: number, projectId: number, jobId: number, framework: string): Promise<ModelWeightsPresignedUrlResponse> => {
    const response = await api.get(`/api/workspaces/${workspaceId}/projects/${projectId}/training_jobs/${jobId}/model_weights`, {
      params: { framework }
    });
    return response.data;
  },
};

// Training Job API
export const trainingJobAPI = {
  // Create training job
  create: async (workspaceId: number, projectId: number, data: CreateTrainingJobRequest): Promise<TrainingJob> => {
    const response = await api.post(`/api/workspaces/${workspaceId}/projects/${projectId}/training_jobs`, data);
    return response.data;
  },

  // Get training jobs by project
  getByProject: async (workspaceId: number, projectId: number, params?: JobQueryParams): Promise<TrainingJobListResponse> => {
    const response = await api.get(`/api/workspaces/${workspaceId}/projects/${projectId}/training_jobs`, { params });
    return response.data;
  },

  // Get training jobs by workspace (all projects)
  getByWorkspace: async (workspaceId: number, params?: JobQueryParams): Promise<TrainingJobListResponse> => {
    const response = await api.get(`/api/workspaces/${workspaceId}/projects/-/training_jobs`, { params });
    return response.data;
  },

  // Get training job by ID
  getById: async (workspaceId: number, projectId: number, jobId: number, version?: 1 | 2): Promise<TrainingJob> => {
    const headers = version === 2 ? { 'X-API-Version': '2' } : {};
    const response = await api.get(`/api/workspaces/${workspaceId}/projects/${projectId}/training_jobs/${jobId}`, { headers });
    return response.data;
  },

  // Delete training job
  delete: async (workspaceId: number, projectId: number, jobId: number): Promise<void> => {
    await api.delete(`/api/workspaces/${workspaceId}/projects/${projectId}/training_jobs/${jobId}`);
  },

  // Cancel training job
  cancel: async (workspaceId: number, projectId: number, jobId: number): Promise<TrainingJob> => {
    const response = await api.post(`/api/workspaces/${workspaceId}/projects/${projectId}/training_jobs/${jobId}/cancel`);
    return response.data;
  },

  // Update custom threshold
  updateCustomThreshold: async (workspaceId: number, projectId: number, jobId: number, customThreshold: any): Promise<TrainingJob> => {
    const response = await api.patch(`/api/workspaces/${workspaceId}/projects/${projectId}/training_jobs/${jobId}/custom_threshold`, customThreshold);
    return response.data;
  },

  // Get model configurations
  getConfigs: async (workspaceId: number, projectId: number, params?: any): Promise<any[]> => {
    const response = await api.get(`/api/workspaces/${workspaceId}/projects/${projectId}/training_jobs/configs`, { params });
    return response.data;
  },

  // Create issue report
  createIssue: async (workspaceId: number, projectId: number, jobId: number, issueDescription: string): Promise<void> => {
    await api.post(`/api/workspaces/${workspaceId}/projects/${projectId}/training_jobs/${jobId}/issues`, { issue_description: issueDescription });
  },
};

// Notification API
export const notificationAPI = {
  // Get notifications
  getAll: async (params?: NotificationQueryParams, version?: 1 | 2): Promise<NotificationListResponse> => {
    const headers = version === 2 ? { 'X-API-Version': '2' } : {};
    const response = await api.get('/api/notifications', { params, headers });
    return response.data;
  },

  // Mark one notification as read
  markAsRead: async (notificationId: number): Promise<Notification> => {
    const response = await api.patch(`/api/notifications/${notificationId}`);
    return response.data;
  },

  // Mark all notifications as read
  markAllAsRead: async (): Promise<number[]> => {
    const response = await api.patch('/api/notifications/mark-all-read');
    return response.data;
  },

  // Get unread count
  getUnreadCount: async (): Promise<number> => {
    const response = await api.get('/api/notifications/unread-count');
    return response.data;
  },

  // Send admin notification (admin only)
  sendAdminNotification: async (data: { event_id: string; payload: any; page_info?: any }): Promise<void> => {
    await api.post('/api/notifications', data);
  },
};

// Quota API
export const quotaAPI = {
  // Get workspace member quotas
  getMemberQuotas: async (workspaceId: number): Promise<QuotaResponse> => {
    const response = await api.get(`/api/quotas/workspace/${workspaceId}/members`);
    return response.data;
  },

  // Get training job quotas
  getTrainingJobQuotas: async (workspaceId: number, startDate?: string, endDate?: string): Promise<QuotaResponse> => {
    const response = await api.get(`/api/quotas/workspace/${workspaceId}/training_jobs`, {
      params: { start_date: startDate, end_date: endDate }
    });
    return response.data;
  },

  // Get image quotas
  getImageQuotas: async (workspaceId: number): Promise<QuotaResponse> => {
    const response = await api.get(`/api/quotas/workspace/${workspaceId}/images`);
    return response.data;
  },

  // Get all workspace quotas
  getAllQuotas: async (workspaceId: number, resourceType?: string): Promise<QuotaResponse[]> => {
    const response = await api.get(`/api/quotas/workspace/${workspaceId}`, {
      params: { resource_type: resourceType }
    });
    return response.data;
  },
};

// Prediction API
export const predictionAPI = {
  // Get predictions by training job
  getByTrainingJob: async (workspaceId: number, projectId: number, trainingJobId: number): Promise<PredictionListResponse> => {
    const response = await api.get(`/api/workspaces/${workspaceId}/projects/${projectId}/training_jobs/${trainingJobId}/predictions`);
    return response.data;
  },
};

// Metrics API
export const metricsAPI = {
  // Get training metrics
  getTrainingMetrics: async (workspaceId: number, projectId: number, trainingJobId: number, metrics: string[]): Promise<Metric[]> => {
    const response = await api.get(`/api/workspaces/${workspaceId}/projects/${projectId}/training_jobs/${trainingJobId}/metrics`, {
      params: { metrics }
    });
    return response.data;
  },
};

// MFA API
export const mfaAPI = {
  // Setup MFA
  setup: async (): Promise<MFASetupResponse> => {
    const response = await api.post('/api/auth/mfa/setup');
    return response.data;
  },

  // Activate MFA
  activate: async (code: string): Promise<RecoveryCodesResponse> => {
    const response = await api.post('/api/auth/mfa/activate', { mfa_code: code });
    return response.data;
  },

  // Verify MFA for login
  verifyLogin: async (email: string, password: string, code: string, recoveryCode?: string): Promise<LoginResponse> => {
    const response = await api.post('/api/auth/mfa/verify-login', { 
      email, 
      password,
      mfa_code: code, 
      recovery_code: recoveryCode 
    });
    return response.data;
  },

  // Generate new recovery codes
  generateRecoveryCodes: async (password: string): Promise<RecoveryCodesResponse> => {
    const response = await api.post('/api/auth/mfa/recovery-codes', { password });
    return response.data;
  },

  // Disable MFA
  disable: async (password: string): Promise<void> => {
    await api.delete('/api/auth/mfa', { data: { password } });
  },

  // Get MFA status
  getStatus: async (): Promise<MFAStatusResponse> => {
    const response = await api.get('/api/auth/mfa/status');
    return response.data;
  },
};

// Autolabel API
export const autolabelAPI = {
  // Download model
  downloadModel: async (): Promise<AutolabelModelResponse> => {
    const response = await api.get('/api/autolabel/download_model');
    return response.data;
  },

  // Get image features
  getImageFeatures: async (workspaceId: number, datasetId: number, imageId: number): Promise<AutolabelFeaturesResponse> => {
    const response = await api.get(`/api/autolabel/workspaces/${workspaceId}/datasets/${datasetId}/images/${imageId}/feature`);
    return response.data;
  },

  // Calculate features
  calculateFeatures: async (workspaceId: number, datasetId: number, imageIdList: number[]): Promise<any> => {
    const response = await api.post(`/api/autolabel/workspaces/${workspaceId}/datasets/${datasetId}/calculate_feature`, {
      image_id_list: imageIdList
    });
    return response.data;
  },
};

// Export default API instance
export default api;
