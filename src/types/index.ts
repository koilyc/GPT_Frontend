// API Response Types
export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

// Pagination Types
export interface PaginationParams {
  page?: number;
  limit?: number;
  offset?: number;
  search?: string;
  sort_by?: string;
  order?: 'asc' | 'desc';
}

export interface WorkspaceListResponse {
  total_count: number;
  workspaces: Workspace[];
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

// User Types
export interface User {
  id: string;
  email: string;
  username: string;
  first_name?: string;
  last_name?: string;
  subscription_plan?: string;
  created_at: string;
  updated_at: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  username?: string;
  password: string;
  first_name?: string;
  last_name?: string;
}

// Workspace Types
export interface Workspace {
  id: number;
  name: string;
  description?: string | null;
  subscription_name?: string;
  owner_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CreateWorkspaceRequest {
  name: string;
  description?: string;
}

// Project Types
export interface Project {
  id: number;
  name: string;
  description?: string | null;
  workspace_id: number;
  type: 'classification' | 'detection' | 'segmentation';
  image_count: number;
  task_count: number;
  owned_by: number;
  dataset_id?: number | null;
  deleted_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateProjectRequest {
  name: string;
  description?: string;
  workspace_id: string;
  type: 'classification' | 'detection' | 'segmentation';
}

// Dataset Types
export interface Dataset {
  id: number;
  name: string;
  description?: string | null;
  workspace_id: number;
  project_count: number;
  project_names: string[];
  created_at: string;
  updated_at: string;
  created_by: number;
}

export interface CreateDatasetRequest {
  name: string;
  description?: string;
}

// Image Types
export interface Image {
  id: number;
  dataset_id: number;
  name: string;
  path: string;
  image_metadata?: {
    width: number;
    height: number;
    color_depth: number;
    color_channels: number;
    file_size_kb: number;
    feature_paths?: {
      image_embeddings?: string;
      high_res_features1?: string;
      high_res_features2?: string;
    };
  };
  description?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  created_by: number;
  deleted_by?: number;
  project_count?: number;
  project_names?: string[];
}

// Annotation Types
export interface Annotation {
  id: string;
  image_id: string;
  label_name: string;
  annotation_type: 'bbox' | 'polygon' | 'classification';
  coordinates?: number[];
  created_at: string;
}

// Model Types
export interface Model {
  id: string;
  name: string;
  project_id: string;
  model_type: string;
  status: 'training' | 'completed' | 'failed';
  accuracy?: number;
  created_at: string;
  model_path?: string;
}

// Training Job Types
export interface TrainingJob {
  id: number;
  name: string;
  project_id: number;
  status: 'standby' | 'running' | 'finished' | 'canceled' | 'failed';
  project_name: string;
  project_type: string;
  started_at?: string;
  finished_at?: string;
  current_progress?: number;
  created_at: string;
  updated_at: string;
  created_by: number;
  fail_reason?: string;
}

export interface TrainingJobListResponse {
  total_count: number;
  jobs: TrainingJob[];
}

export interface CreateTrainingJobRequest {
  name: string;
  project_id: number;
  aasconfig: any;
  image_splits: {
    train?: number[];
    val?: number[];
    test?: number[];
  };
}

// Subscription Types
export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  features: string[];
  max_projects: number;
  max_images: number;
}
