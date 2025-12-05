// API Response Types
export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

// Pagination Types
// 基礎分頁參數 - 符合後端 PaginationParams
export interface PaginationParams {
  offset?: number;  // 起始位置，預設 0
  limit?: number;   // 每頁筆數，預設 10，最大 100
  order_by?: 'id' | 'name' | 'created_at' | 'updated_at'; // 排序欄位
  desc?: boolean;   // 是否降序，預設 false (升序)
}

// 刪除狀態查詢參數
export interface DeletionStateQueryParams {
  deletion_state?: 'include' | 'exclude' | 'only'; // 預設 'exclude'
}

// 模糊搜尋查詢參數
export interface FuzzySearchQueryParams {
  keyword?: string; // 模糊搜尋關鍵字
}

// 時間範圍篩選參數
export interface TimeFilterParams {
  start_time?: string; // ISO 8601 格式
  end_time?: string;   // ISO 8601 格式
}

// 通用查詢參數 (組合所有基礎參數)
export interface CommonQueryParams extends PaginationParams, DeletionStateQueryParams, FuzzySearchQueryParams {}

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
  id: number;
  uuid: string;
  email: string;
  first_name?: string;
  last_name?: string;
  full_name?: string;
  is_enabled: boolean;
  edm_subscription: boolean;
  mfa_enabled: boolean;
  activated_at?: string | null;
  role?: string;
  system_role_id?: number | null;
  created_at: string;
  updated_at: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  activated_at?: string | null;
}

export interface RegisterRequest {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone_country_code?: string;
  phone_number?: string;
  phone_extension?: string;
  birthday: string; // YYYY-MM-DD format
  company?: string;
  department?: string;
  industry?: string;
  occupation?: string;
  region?: string;
  referral_person?: string;
  usage_type: string; // 'PERSONAL' or 'BUSINESS'
  agree_privacy: boolean;
  agree_license: boolean;
  agree_edm: boolean;
  ui_language?: string; // 'en-US', 'zh-TW', 'zh-CN', 'ja-JP'
}

export interface UserListResponse {
  total_count: number;
  users: User[];
}

export interface UpdatePasswordRequest {
  old_password: string;
  new_password: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  new_password: string;
}

// Workspace Types
export interface Workspace {
  id: number;
  name: string;
  description?: string | null;
  subscription_name?: string;
  subscription_id?: number;
  owned_by: number;
  member_count?: number;
  trial_used?: boolean;
  manager_name?: string;
  manager_uuid?: string;
  created_date?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
}

export interface CreateWorkspaceRequest {
  name: string;
  description?: string;
}

export interface WorkspaceMember {
  name: string;
  email: string;
  role: 'manager' | 'member' | 'viewer';
  pending: boolean;
  is_owner: boolean;
  join_time: string;
}

export interface WorkspaceMemberListResponse {
  total_count: number;
  members: WorkspaceMember[];
}

export interface InviteMemberRequest {
  email_list: string[];
  role: 'manager' | 'member' | 'viewer';
}

export interface InviteSummaryResponse {
  success: string[];
  failed: string[];
}

export interface WorkspaceDataUsage {
  current_usage: number;
  total_available: number;
}

// Project Types
export type ProjectType = 'anomaly' | 'classification' | 'segmentation' | 'object_detection' | 'oriented_object_detection';

export interface Project {
  id: number;
  name: string;
  description?: string | null;
  workspace_id: number;
  type: ProjectType;
  image_count: number;
  task_count: number;
  annotation_count: number;
  owned_by: number;
  dataset_id?: number | null;
  roi?: {
    is_enabled: boolean;
    x: number;
    y: number;
    width: number;
    height: number;
  } | null;
  calibration?: {
    value: number;
    unit: string;
  } | null;
  deleted_at?: string | null;
  created_at: string;
  updated_at: string;
  last_activity_at?: string;
}

export interface CreateProjectRequest {
  name: string;
  description?: string;
  type: ProjectType;
  dataset_id?: number | null;
}

export interface ProjectListResponse {
  total_count: number;
  projects: Project[];
}

export interface ProjectImageListResponse {
  total_count: number;
  Images: ProjectImage[];
}

export interface ProjectImage {
  id: number;
  project_id: number;
  image_id: number;
  created_by: number;
  created_at: string;
}

// Dataset Types
export interface Dataset {
  id: number;
  name: string;
  description?: string | null;
  workspace_id: number;
  project_count?: number;
  project_names?: string[];
  created_at: string;
  updated_at: string;
  created_by: number;
  deleted_at?: string | null;
}

export interface CreateDatasetRequest {
  name: string;
  description?: string;
}

export interface DatasetListResponse {
  total_count: number;
  datasets: Dataset[];
}

// Image Types
export interface ImageMetadata {
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
}

export interface Image {
  id: number;
  dataset_id: number;
  workspace_id: number;
  name: string;
  path: string;
  thumbnail_path?: string;
  image_metadata: ImageMetadata;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
  created_by: number;
  deleted_by?: number | null;
  project_count?: number;
  project_names?: string[];
  created_user_first_name?: string;
  created_user_last_name?: string;
}

export interface ImageListResponse {
  total_count: number;
  Images: Image[];
}

export interface ImagePresignedUrlResponse {
  presigned_url: string;
}

// Annotation Types
export interface GeneralAnnotation {
  category_id: number;
  data: {
    type: 'bbox' | 'polygon' | 'obb' | 'classification';
    points?: number[][];
    bbox?: [number, number, number, number];
    obb?: number[];
  };
}

export interface Annotation {
  id: number;
  project_id: number;
  image_id: number;
  predicted_by?: number | null; // null = label, 0 = SAM, other = job_id
  data: GeneralAnnotation[];
  created_by: number;
  created_at: string;
  updated_at?: string;
  deleted_at?: string | null;
  deleted_by?: number | null;
}

export interface MultiAnnotationResponse {
  total_count: number;
  annotations: Annotation[];
}

// Category Types
export interface CategoryMetadata {
  color: string; // Hex color code like #FF0000
}

export interface Category {
  id: number;
  project_id?: number;
  name: string;
  category_metadata: CategoryMetadata;
  created_at: string;
  updated_at?: string;
  deleted_at?: string | null;
  created_by?: number;
  deleted_by?: number | null;
}

// Model Types
export interface ModelWeightsPresignedUrlResponse {
  presigned_url: string;
}

// Training Job Types
export type JobStatus = 'standby' | 'running' | 'finished' | 'canceled' | 'failed';

export interface TrainingJob {
  id: number;
  name: string;
  project_id: number;
  status: JobStatus;
  project_name: string;
  project_type: ProjectType;
  aasconfig: any;
  image_splits: {
    train: number[];
    val: number[];
    test?: number[];
  };
  training_progress?: any[];
  custom_threshold?: any;
  started_at?: string | null;
  finished_at?: string | null;
  current_progress?: number;
  estimated_time?: number;
  created_at: string;
  updated_at: string;
  created_by: number;
  deleted_at?: string | null;
  deleted_by?: number | null;
  fail_reason?: string | null;
}

export interface TrainingJobListResponse {
  total_count: number;
  jobs: TrainingJob[];
}

export interface ImageSplits {
  train: number[];
  val: number[];
  test?: number[];
}

export interface CreateTrainingJobRequest {
  name: string;
  project_id: number;
  aasconfig: any; // AASConfig object
  image_splits: ImageSplits;
}

// 專案查詢參數
export interface ProjectQueryParams extends CommonQueryParams {
  project_types?: string[]; // 專案類型篩選
}

// 工作區查詢參數
export interface WorkspaceQueryParams extends CommonQueryParams {
  role_types?: string[];      // 角色類型篩選
  admin_mode?: boolean;       // 只顯示管理者工作區
  trial_used?: boolean;       // 是否已使用試用
  subscription_name?: 'Free' | 'Pro' | 'Enterprise'; // 訂閱方案篩選
}

// 工作區成員查詢參數
export interface WorkspaceMemberQueryParams extends Omit<PaginationParams, 'order_by'>, FuzzySearchQueryParams, TimeFilterParams {
  order_by?: 'name' | 'email' | 'role' | 'pending' | 'join_time';
  role?: 'manager' | 'member' | 'viewer'; // 角色篩選
}

// 訓練任務查詢參數
export interface JobQueryParams extends Omit<CommonQueryParams, 'order_by'>, TimeFilterParams {
  job_status?: string[];     // 任務狀態篩選
  project_types?: string[];  // 專案類型篩選
  order_by?: 'id' | 'created_at' | 'name' | 'updated_at' | 'time_spent';
}

// 通知查詢參數
export interface NotificationQueryParams extends PaginationParams {
  notification_type?: string;  // 通知類型篩選
  read_at?: 'include' | 'exclude' | 'only'; // 已讀狀態篩選，預設 'include'
}

// 用戶查詢參數 (管理員用)
export interface UserQueryParams extends Omit<CommonQueryParams, 'order_by'>, TimeFilterParams {
  order_by?: 'id' | 'name' | 'status' | 'email' | 'role' | 'created_at' | 'updated_at' | 'reference';
  status?: boolean;  // 啟用狀態篩選
  role?: 'superadmin' | 'admin' | 'user'; // 角色篩選
}

// Subscription Types
export interface SubscriptionPlan {
  id: number;
  name: string;
  description?: string | null;
  price?: number;
  resource_limits: {
    workspace_members?: number;
    model_download?: boolean;
    [key: string]: any;
  };
  created_at: string;
  updated_at: string;
}

// Notification Types
export interface Notification {
  id: number;
  user_id?: number;
  type?: string;
  event_name: string;
  message: Record<string, any>;
  page_info?: any;
  read_at?: string | null;
  created_at: string;
  // Legacy fields for backward compatibility
  event?: string;
  payload?: any;
}

export interface NotificationListResponse {
  total_count: number;
  unread_count?: number;
  notifications: Notification[];
}

// Quota Types
export interface QuotaResponse {
  resource_type?: string;
  current: number;
  limit: number;
  subscription_start_date?: string;
  subscription_end_date?: string;
}

// Prediction Types
export interface Prediction {
  id: number;
  training_job_id: number;
  project_id: number;
  image_id: number;
  prediction_data: any;
  created_at: string;
}

export interface PredictionListResponse {
  Predictions: Prediction[];
}

// Metrics Types
export interface Metric {
  name: string;
  values: number[];
  steps?: number[];
}

// MFA Types
export interface MFASetupResponse {
  otp_uri: string; // OTP provisioning URI for QR code
  secret: string; // Plaintext TOTP secret for manual entry
}

export interface MFAStatusResponse {
  mfa_enabled: boolean;
}

export interface RecoveryCodesResponse {
  recovery_codes: string[];
}

// Autolabel Types
export interface AutolabelModelResponse {
  model_presigned_url: string;
}

export interface AutolabelFeaturesResponse {
  image_embeddings?: string;
  high_res_features1?: string;
  high_res_features2?: string;
}
