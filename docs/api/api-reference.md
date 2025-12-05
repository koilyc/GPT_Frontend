# GPT Frontend API Documentation

This document provides a comprehensive overview of all available API endpoints in the GPT Frontend application, organized by feature area.

## Table of Contents

1. [Authentication & Authorization](#authentication--authorization)
2. [Account Management](#account-management)
3. [User Management](#user-management)
4. [Workspace Management](#workspace-management)
5. [Project Management](#project-management)
6. [Dataset Management](#dataset-management)
7. [Image Management](#image-management)
8. [Annotation Management](#annotation-management)
9. [Category Management](#category-management)
10. [Training Jobs](#training-jobs)
11. [Model Weights](#model-weights)
12. [Predictions](#predictions)
13. [Metrics](#metrics)
14. [Notifications](#notifications)
15. [Quotas](#quotas)
16. [Multi-Factor Authentication](#multi-factor-authentication)
17. [Autolabel](#autolabel)

## Authentication & Authorization

### Auth API (`authAPI`)

#### Email Verification
- `verifyEmail(email: string): Promise<void>`
  - Verify if email is available for registration
  - POST `/api/auth/email`

#### Register
- `register(userData: RegisterRequest): Promise<LoginResponse>`
  - Register a new user account
  - POST `/api/auth/register`

#### Activate Account
- `activateAccount(): Promise<LoginResponse>`
  - Activate account using signup token
  - POST `/api/auth/activation`

#### Login
- `login(credentials: LoginRequest): Promise<LoginResponse>`
  - Authenticate user with email and password
  - POST `/api/auth/login`

#### Token Login
- `tokenLogin(): Promise<User>`
  - Authenticate using JWT token
  - POST `/api/auth/token-login`

#### Password Management
- `updatePassword(data: UpdatePasswordRequest): Promise<void>`
  - Update current user's password
  - PATCH `/api/auth/update-password`

- `forgotPassword(data: ForgotPasswordRequest): Promise<void>`
  - Request password reset email
  - POST `/api/auth/forgot-password`

- `resetPassword(data: ResetPasswordRequest): Promise<void>`
  - Reset password using reset token
  - POST `/api/auth/reset-password`

#### Logout
- `logout(): void`
  - Clear local authentication token

## Account Management

### Account API (`accountAPI`)

#### Profile
- `getProfile(): Promise<User>`
  - Get current user profile
  - GET `/api/accounts/profile`

- `updateProfile(data: Partial<User>): Promise<User>`
  - Update current user profile
  - PATCH `/api/accounts/profile`

- `deleteAccount(): Promise<void>`
  - Delete own account
  - DELETE `/api/accounts/self`

#### Notification Settings
- `getNotificationSettings(): Promise<Record<string, boolean>>`
  - Get notification preferences
  - GET `/api/accounts/preferences/notifications`

- `updateNotificationSettings(settings: Record<string, boolean>): Promise<Record<string, boolean>>`
  - Update notification preferences
  - PATCH `/api/accounts/preferences/notifications`

#### EDM Subscription
- `getEdmSubscription(): Promise<{ id: number; subscription: boolean }>`
  - GET `/api/accounts/edm-subscription`

- `updateEdmSubscription(subscription: boolean): Promise<{ id: number; subscription: boolean }>`
  - PATCH `/api/accounts/edm-subscription`

## User Management

### Users API (`usersAPI`) - Admin Only

#### User CRUD
- `getAll(params?: PaginationParams): Promise<UserListResponse>`
  - Get all users (admin)
  - GET `/api/users/`

- `getById(uuid: string): Promise<User>`
  - Get user by UUID (admin)
  - GET `/api/users/{uuid}`

- `deleteByEmail(email: string): Promise<void>`
  - Delete user by email (admin)
  - DELETE `/api/users/`

#### Account Management
- `activateAccount(email: string): Promise<void>`
  - Activate user account (admin)
  - POST `/api/users/activation` (v1)

- `bulkActivateAccounts(emails: string[]): Promise<void>`
  - Bulk activate accounts (admin)
  - POST `/api/users/activation` (v2)

- `resetPassword(email: string, newPassword: string): Promise<void>`
  - Reset user password (admin)
  - POST `/api/users/reset-password`

- `updateEnabled(emails: string[], enabled: boolean): Promise<void>`
  - Enable/disable user accounts (admin)
  - POST `/api/users/enabled`

- `updateSystemRole(uuid: string, role: string): Promise<void>`
  - Update user system role (admin)
  - POST `/api/users/update-role`

## Workspace Management

### Workspace API (`workspaceAPI`)

#### Workspace CRUD
- `getAll(params?: PaginationParams & WorkspaceFilters): Promise<WorkspaceListResponse>`
  - Get all workspaces
  - GET `/api/workspaces`
  - Filters: `role_types`, `subscription_name`, `trial_used`, `admin_mode`

- `getById(id: number): Promise<Workspace>`
  - Get workspace by ID
  - GET `/api/workspaces/{id}`

- `create(workspace: CreateWorkspaceRequest): Promise<Workspace>`
  - Create new workspace
  - POST `/api/workspaces`

- `update(id: number, workspace: Partial<CreateWorkspaceRequest>): Promise<Workspace>`
  - Update workspace
  - PATCH `/api/workspaces/{id}`

- `delete(id: number): Promise<void>`
  - Delete workspace (soft delete)
  - DELETE `/api/workspaces/{id}`

#### Usage & Limits
- `getCurrentUsage(id: number): Promise<WorkspaceDataUsage>`
  - Get workspace current usage
  - GET `/api/workspaces/{id}/current_usage`

- `getResourceLimits(id: number): Promise<Record<string, any>>`
  - Get workspace resource limits
  - GET `/api/workspaces/{id}/resource_limits`

#### Member Management
- `getMembers(id: number, params?: PaginationParams): Promise<WorkspaceMemberListResponse>`
  - Get workspace members
  - GET `/api/workspaces/{id}/members`

- `getMyRole(id: number): Promise<{ role: string }>`
  - Get current user's role in workspace
  - GET `/api/workspaces/{id}/my-role`

- `inviteMembers(id: number, data: InviteMemberRequest): Promise<InviteSummaryResponse>`
  - Invite members to workspace
  - POST `/api/workspaces/{id}/members`

- `updateMemberRole(id: number, email: string, role: string): Promise<void>`
  - Update member role
  - PATCH `/api/workspaces/{id}/members`

- `deleteMember(id: number, email: string): Promise<void>`
  - Remove member from workspace
  - DELETE `/api/workspaces/{id}/member`

- `deleteInvitation(id: number, email: string): Promise<void>`
  - Cancel pending invitation
  - DELETE `/api/workspaces/{id}/invitation`

- `getInviteLink(id: number): Promise<{ invite_link: string }>`
  - Get workspace invite link
  - GET `/api/workspaces/{id}/invite-link`

#### Licenses
- `getAptLicenses(id: number): Promise<any[]>`
  - Get APT licenses for workspace
  - GET `/api/workspaces/{id}/apt_licenses`

## Project Management

### Project API (`projectAPI`)

#### Project CRUD
- `getAll(workspaceId: number, params?: ProjectQueryParams): Promise<ProjectListResponse>`
  - Get all projects in workspace
  - GET `/api/workspaces/{workspaceId}/projects`
  - Filters: `project_types`, `deletion_state`

- `getById(workspaceId: number, projectId: number): Promise<Project>`
  - Get project by ID
  - GET `/api/workspaces/{workspaceId}/projects/{projectId}`

- `create(workspaceId: number, project: CreateProjectRequest): Promise<Project>`
  - Create new project
  - POST `/api/workspaces/{workspaceId}/projects`

- `update(workspaceId: number, projectId: number, project: Partial<CreateProjectRequest>): Promise<Project>`
  - Update project
  - PATCH `/api/workspaces/{workspaceId}/projects/{projectId}`

- `delete(workspaceId: number, projectId: number): Promise<void>`
  - Soft delete project
  - DELETE `/api/workspaces/{workspaceId}/projects/{projectId}`

- `purge(workspaceId: number, projectId: number): Promise<void>`
  - Permanently delete project
  - DELETE `/api/workspaces/{workspaceId}/projects/{projectId}/purge`

#### Project Operations
- `duplicate(workspaceId: number, projectId: number, targetWorkspaceId?: number, name?: string): Promise<Project>`
  - Duplicate project
  - POST `/api/workspaces/{workspaceId}/projects/{projectId}/duplicate`

- `restore(workspaceId: number, projectId: number, name?: string, description?: string): Promise<Project>`
  - Restore deleted project
  - POST `/api/workspaces/{workspaceId}/projects/{projectId}/restore`

#### Project Images
- `getImages(workspaceId: number, projectId: number, params?: PaginationParams): Promise<ProjectImageListResponse>`
  - Get images in project
  - GET `/api/workspaces/{workspaceId}/projects/{projectId}/images`

- `updateImages(workspaceId: number, projectId: number, imageIds: number[]): Promise<void>`
  - Update project images (v1)
  - PATCH `/api/workspaces/{workspaceId}/projects/{projectId}/images`

- `replaceImages(workspaceId: number, projectId: number, imageIds: number[]): Promise<void>`
  - Replace all project images (v2)
  - PUT `/api/workspaces/{workspaceId}/projects/{projectId}/images` (v2)

- `addImages(workspaceId: number, projectId: number, imageIds: number[]): Promise<void>`
  - Add images to project (v2)
  - PATCH `/api/workspaces/{workspaceId}/projects/{projectId}/images` (v2)

#### ROI & Calibration
- `updateRoi(workspaceId: number, projectId: number, roi: any): Promise<Project>`
  - Update project ROI
  - PATCH `/api/workspaces/{workspaceId}/projects/{projectId}/roi`

- `deleteRoi(workspaceId: number, projectId: number): Promise<void>`
  - Delete project ROI
  - DELETE `/api/workspaces/{workspaceId}/projects/{projectId}/roi`

- `updateCalibration(workspaceId: number, projectId: number, calibration: any): Promise<Project>`
  - Update project calibration
  - PATCH `/api/workspaces/{workspaceId}/projects/{projectId}/calibration`

- `deleteCalibration(workspaceId: number, projectId: number): Promise<void>`
  - Delete project calibration
  - DELETE `/api/workspaces/{workspaceId}/projects/{projectId}/calibration`

## Dataset Management

### Dataset API (`datasetAPI`)

#### Dataset CRUD
- `getAll(workspaceId: number, params?: PaginationParams): Promise<DatasetListResponse>`
  - Get all datasets in workspace
  - GET `/api/workspaces/{workspaceId}/datasets/`

- `getById(workspaceId: number, datasetId: number): Promise<Dataset>`
  - Get dataset by ID
  - GET `/api/workspaces/{workspaceId}/datasets/{datasetId}`

- `create(workspaceId: number, dataset: CreateDatasetRequest): Promise<Dataset>`
  - Create new dataset
  - POST `/api/workspaces/{workspaceId}/datasets/`

- `update(workspaceId: number, datasetId: number, dataset: Partial<CreateDatasetRequest>): Promise<Dataset>`
  - Update dataset
  - PATCH `/api/workspaces/{workspaceId}/datasets/{datasetId}`

- `delete(workspaceId: number, datasetId: number): Promise<void>`
  - Delete dataset
  - DELETE `/api/workspaces/{workspaceId}/datasets/{datasetId}`

- `duplicate(workspaceId: number, datasetId: number): Promise<Dataset>`
  - Duplicate dataset
  - POST `/api/workspaces/{workspaceId}/datasets/{datasetId}/duplicate`

## Image Management

### Image API (`imageAPI`)

#### Image CRUD
- `getAll(workspaceId: number, datasetId: number, params?: PaginationParams): Promise<ImageListResponse>`
  - Get all images in dataset
  - GET `/api/workspaces/{workspaceId}/datasets/{datasetId}/images`

- `getById(workspaceId: number, datasetId: number, imageId: number): Promise<Image>`
  - Get image by ID
  - GET `/api/workspaces/{workspaceId}/datasets/{datasetId}/images/{imageId}`

- `upload(workspaceId: number, datasetId: number, name: string, imageMetadata: any, file: File): Promise<Image>`
  - Upload new image
  - POST `/api/workspaces/{workspaceId}/datasets/{datasetId}/images`

- `update(workspaceId: number, datasetId: number, imageId: number, data: Partial<Image>): Promise<Image>`
  - Update image metadata
  - PATCH `/api/workspaces/{workspaceId}/datasets/{datasetId}/images/{imageId}`

- `delete(workspaceId: number, datasetId: number, imageId: number): Promise<void>`
  - Delete image
  - DELETE `/api/workspaces/{workspaceId}/datasets/{datasetId}/images/{imageId}`

#### Image URLs
- `getContentUrl(workspaceId: number, datasetId: number, imageId: number): Promise<ImagePresignedUrlResponse>`
  - Get image content presigned URL
  - GET `/api/workspaces/{workspaceId}/datasets/{datasetId}/images/{imageId}/content`

- `getThumbnailUrl(workspaceId: number, datasetId: number, imageId: number): Promise<ImagePresignedUrlResponse>`
  - Get image thumbnail presigned URL
  - GET `/api/workspaces/{workspaceId}/datasets/{datasetId}/images/{imageId}/thumbnail`

#### Image Transformation
- `transform(workspaceId: number, datasetId: number, imageId: number, augmentation: any): Promise<string>`
  - Apply image transformation
  - POST `/api/workspaces/{workspaceId}/datasets/{datasetId}/images/{imageId}/transform`

## Annotation Management

### Annotation API (`annotationAPI`)

#### Annotation CRUD
- `create(workspaceId: number, projectId: number, imageId: number, data: any): Promise<Annotation>`
  - Create annotation
  - POST `/api/workspaces/{workspaceId}/projects/{projectId}/images/{imageId}/annotations`

- `getByImage(workspaceId: number, projectId: number, imageId: number): Promise<Annotation>`
  - Get annotations for specific image
  - GET `/api/workspaces/{workspaceId}/projects/{projectId}/images/{imageId}/annotations`

- `getAllByProject(workspaceId: number, projectId: number, params?: PaginationParams): Promise<MultiAnnotationResponse>`
  - Get all annotations in project
  - GET `/api/workspaces/{workspaceId}/projects/{projectId}/images/-/annotations`

- `update(workspaceId: number, projectId: number, imageId: number, annotationId: number, data: any): Promise<Annotation>`
  - Update annotation
  - PATCH `/api/workspaces/{workspaceId}/projects/{projectId}/images/{imageId}/annotations/{annotationId}`

- `delete(workspaceId: number, projectId: number, imageId: number, annotationId: number): Promise<void>`
  - Delete annotation
  - DELETE `/api/workspaces/{workspaceId}/projects/{projectId}/images/{imageId}/annotations/{annotationId}`

## Category Management

### Category API (`categoryAPI`)

#### Category CRUD
- `create(workspaceId: number, projectId: number, data: { name: string; color: string }): Promise<Category>`
  - Create category
  - POST `/api/workspaces/{workspaceId}/projects/{projectId}/categories`

- `getAll(workspaceId: number, projectId: number): Promise<Category[]>`
  - Get all categories in project
  - GET `/api/workspaces/{workspaceId}/projects/{projectId}/categories`

- `getById(workspaceId: number, projectId: number, categoryId: number): Promise<Category>`
  - Get category by ID
  - GET `/api/workspaces/{workspaceId}/projects/{projectId}/categories/{categoryId}`

- `update(workspaceId: number, projectId: number, categoryId: number, data: Partial<Category>): Promise<Category>`
  - Update category
  - PATCH `/api/workspaces/{workspaceId}/projects/{projectId}/categories/{categoryId}`

- `delete(workspaceId: number, projectId: number, categoryId: number): Promise<void>`
  - Delete category
  - DELETE `/api/workspaces/{workspaceId}/projects/{projectId}/categories/{categoryId}`

## Training Jobs

### Training Job API (`trainingJobAPI`)

#### Training Job CRUD
- `create(workspaceId: number, projectId: number, data: CreateTrainingJobRequest): Promise<TrainingJob>`
  - Create training job
  - POST `/api/workspaces/{workspaceId}/projects/{projectId}/training_jobs`

- `getByProject(workspaceId: number, projectId: number, params?: JobQueryParams): Promise<TrainingJobListResponse>`
  - Get training jobs by project
  - GET `/api/workspaces/{workspaceId}/projects/{projectId}/training_jobs`

- `getByWorkspace(workspaceId: number, params?: JobQueryParams): Promise<TrainingJobListResponse>`
  - Get training jobs across all projects in workspace
  - GET `/api/workspaces/{workspaceId}/projects/-/training_jobs`

- `getById(workspaceId: number, projectId: number, jobId: number, version?: 1 | 2): Promise<TrainingJob>`
  - Get training job by ID
  - GET `/api/workspaces/{workspaceId}/projects/{projectId}/training_jobs/{jobId}`

- `delete(workspaceId: number, projectId: number, jobId: number): Promise<void>`
  - Delete training job
  - DELETE `/api/workspaces/{workspaceId}/projects/{projectId}/training_jobs/{jobId}`

#### Training Job Operations
- `cancel(workspaceId: number, projectId: number, jobId: number): Promise<TrainingJob>`
  - Cancel running training job
  - POST `/api/workspaces/{workspaceId}/projects/{projectId}/training_jobs/{jobId}/cancel`

- `updateCustomThreshold(workspaceId: number, projectId: number, jobId: number, customThreshold: any): Promise<TrainingJob>`
  - Update custom threshold
  - PATCH `/api/workspaces/{workspaceId}/projects/{projectId}/training_jobs/{jobId}/custom_threshold`

#### Configuration & Support
- `getConfigs(workspaceId: number, projectId: number, params?: any): Promise<any[]>`
  - Get model configurations
  - GET `/api/workspaces/{workspaceId}/projects/{projectId}/training_jobs/configs`

- `createIssue(workspaceId: number, projectId: number, jobId: number, issueDescription: string): Promise<void>`
  - Report issue with training job
  - POST `/api/workspaces/{workspaceId}/projects/{projectId}/training_jobs/{jobId}/issues`

## Model Weights

### Model Weights API (`modelWeightsAPI`)

- `getPresignedUrl(workspaceId: number, projectId: number, jobId: number, framework: string): Promise<ModelWeightsPresignedUrlResponse>`
  - Get model weights download URL
  - GET `/api/workspaces/{workspaceId}/projects/{projectId}/training_jobs/{jobId}/model_weights`
  - Framework options: `onnx`, `openvino`, etc.

## Predictions

### Prediction API (`predictionAPI`)

- `getByTrainingJob(workspaceId: number, projectId: number, trainingJobId: number): Promise<PredictionListResponse>`
  - Get predictions for training job
  - GET `/api/workspaces/{workspaceId}/projects/{projectId}/training_jobs/{trainingJobId}/predictions`

## Metrics

### Metrics API (`metricsAPI`)

- `getTrainingMetrics(workspaceId: number, projectId: number, trainingJobId: number, metrics: string[]): Promise<Metric[]>`
  - Get training metrics
  - GET `/api/workspaces/{workspaceId}/projects/{projectId}/training_jobs/{trainingJobId}/metrics`

## Notifications

### Notification API (`notificationAPI`)

#### Notification Management
- `getAll(params?: PaginationParams & { read_at?: string }, version?: 1 | 2): Promise<NotificationListResponse>`
  - Get all notifications
  - GET `/api/notifications`

- `markAsRead(notificationId: number): Promise<Notification>`
  - Mark notification as read
  - PATCH `/api/notifications/{notificationId}`

- `markAllAsRead(): Promise<number[]>`
  - Mark all notifications as read
  - PATCH `/api/notifications/mark-all-read`

- `getUnreadCount(): Promise<number>`
  - Get unread notification count
  - GET `/api/notifications/unread-count`

#### Admin Functions
- `sendAdminNotification(data: { event_id: string; payload: any; page_info?: any }): Promise<void>`
  - Send admin notification (admin only)
  - POST `/api/notifications`

## Quotas

### Quota API (`quotaAPI`)

- `getMemberQuotas(workspaceId: number): Promise<QuotaResponse>`
  - Get workspace member quotas
  - GET `/api/quotas/workspace/{workspaceId}/members`

- `getTrainingJobQuotas(workspaceId: number, startDate?: string, endDate?: string): Promise<QuotaResponse>`
  - Get training job quotas
  - GET `/api/quotas/workspace/{workspaceId}/training_jobs`

- `getImageQuotas(workspaceId: number): Promise<QuotaResponse>`
  - Get image quotas
  - GET `/api/quotas/workspace/{workspaceId}/images`

- `getAllQuotas(workspaceId: number, resourceType?: string): Promise<QuotaResponse[]>`
  - Get all workspace quotas
  - GET `/api/quotas/workspace/{workspaceId}`

## Multi-Factor Authentication

### MFA API (`mfaAPI`)

#### MFA Setup
- `setup(): Promise<MFASetupResponse>`
  - Initialize MFA setup (get QR code)
  - POST `/api/auth/mfa/setup`

- `activate(code: string): Promise<RecoveryCodesResponse>`
  - Activate MFA with verification code
  - POST `/api/auth/mfa/activate`

#### MFA Authentication
- `verifyLogin(email: string, code: string, recoveryCode?: string): Promise<LoginResponse>`
  - Verify MFA code during login
  - POST `/api/auth/mfa/verify-login`

#### MFA Management
- `generateRecoveryCodes(password: string): Promise<RecoveryCodesResponse>`
  - Generate new recovery codes
  - POST `/api/auth/mfa/recovery-codes`

- `disable(password: string): Promise<void>`
  - Disable MFA
  - DELETE `/api/auth/mfa/`

- `getStatus(): Promise<MFAStatusResponse>`
  - Check MFA status
  - GET `/api/auth/mfa/status`

## Autolabel

### Autolabel API (`autolabelAPI`)

- `downloadModel(): Promise<AutolabelModelResponse>`
  - Get autolabel model download URL
  - GET `/api/autolabel/download_model`

- `getImageFeatures(workspaceId: number, datasetId: number, imageId: number): Promise<AutolabelFeaturesResponse>`
  - Get image feature embeddings
  - GET `/api/autolabel/workspaces/{workspaceId}/datasets/{datasetId}/images/{imageId}/feature`

- `calculateFeatures(workspaceId: number, datasetId: number, imageIdList: number[]): Promise<any>`
  - Calculate features for multiple images
  - POST `/api/autolabel/workspaces/{workspaceId}/datasets/{datasetId}/calculate_feature`

## Common Types

### Pagination Parameters
```typescript
interface PaginationParams {
  page?: number;
  limit?: number;
  offset?: number;
  search?: string;
  sort_by?: string;
  order?: 'asc' | 'desc';
  keyword?: string;
  order_by?: string;
  desc?: boolean;
}
```

### Project Types
- `anomaly` - Anomaly detection
- `classification` - Image classification
- `segmentation` - Semantic segmentation
- `object_detection` - Object detection
- `oriented_object_detection` - Oriented bounding box detection

### Job Status
- `standby` - Waiting to start
- `running` - Currently training
- `finished` - Completed successfully
- `canceled` - Manually canceled
- `failed` - Failed with error

### Workspace Roles
- `manager` - Full access
- `member` - Standard access
- `viewer` - Read-only access

## Notes

1. All API calls require authentication via Bearer token (except registration and login)
2. Token should be stored in localStorage with key 'access_token'
3. Most endpoints support pagination via `offset` and `limit` parameters
4. Use `keyword` parameter for search/filter functionality
5. API versioning is handled via `X-API-Version` header when needed
6. Error responses follow standard HTTP status codes
7. All dates are in ISO 8601 format
8. File uploads use multipart/form-data content type
