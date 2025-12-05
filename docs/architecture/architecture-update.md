# Frontend Architecture Update Summary

## Overview
已完成對 GPT_Frontend 的全面更新，使其與後端 API 的所有 routers 完全同步。

## 更新內容

### 1. 類型定義 (Types) - `src/types/index.ts`

#### 新增/更新的類型：

**核心類型改進：**
- `User` - 更新為包含 UUID、MFA、系統角色等完整欄位
- `LoginResponse` - 新增登入回應類型
- `RegisterRequest` - 完整註冊請求（包含隱私、授權同意）
- `UpdatePasswordRequest`, `ForgotPasswordRequest`, `ResetPasswordRequest` - 密碼管理

**工作區 (Workspace) 相關：**
- `Workspace` - 完整的工作區資料結構
- `WorkspaceMember` - 成員資訊
- `WorkspaceMemberListResponse` - 成員列表回應
- `InviteMemberRequest` - 邀請成員請求
- `InviteSummaryResponse` - 邀請結果摘要
- `WorkspaceDataUsage` - 使用量統計

**專案 (Project) 相關：**
- `ProjectType` - 專案類型（anomaly、classification、segmentation、object_detection、oriented_object_detection）
- `Project` - 完整專案資料（包含 ROI、calibration）
- `ProjectListResponse` - 專案列表回應
- `ProjectImageListResponse` - 專案圖片列表
- `ProjectImage` - 專案圖片關聯

**資料集 (Dataset) 相關：**
- `Dataset` - 完整資料集結構
- `DatasetListResponse` - 資料集列表回應

**圖片 (Image) 相關：**
- `ImageMetadata` - 圖片元數據
- `Image` - 完整圖片資訊
- `ImageListResponse` - 圖片列表回應
- `ImagePresignedUrlResponse` - 預簽名 URL 回應

**標註 (Annotation) 相關：**
- `AnnotationData` - 標註數據結構
- `Annotation` - 完整標註資訊
- `MultiAnnotationResponse` - 多個標註回應

**類別 (Category)：**
- `Category` - 標註類別

**訓練任務 (Training Job) 相關：**
- `JobStatus` - 任務狀態類型
- `TrainingJob` - 完整訓練任務資訊
- `TrainingJobListResponse` - 訓練任務列表
- `CreateTrainingJobRequest` - 建立訓練任務請求
- `JobQueryParams` - 任務查詢參數

**通知 (Notification) 相關：**
- `Notification` - 通知資訊
- `NotificationListResponse` - 通知列表

**配額 (Quota) 相關：**
- `QuotaResponse` - 配額資訊

**其他：**
- `Prediction`, `PredictionListResponse` - 預測結果
- `Metric` - 訓練指標
- `MFASetupResponse`, `MFAStatusResponse`, `RecoveryCodesResponse` - MFA 多因素認證
- `AutolabelModelResponse`, `AutolabelFeaturesResponse` - 自動標註
- `SubscriptionPlan` - 訂閱方案
- `ModelWeightsPresignedUrlResponse` - 模型權重下載

### 2. API 定義 (API) - `src/api/index.ts`

#### 新增/更新的 API 模組：

**1. Authentication API (`authAPI`)**
- 電子郵件驗證
- 用戶註冊
- 帳戶啟用
- 登入/Token 登入
- 密碼管理（更新、忘記、重置）

**2. Account API (`accountAPI`)**
- 個人資料管理
- 通知設定
- EDM 訂閱管理

**3. Users API (`usersAPI`)** - 管理員功能
- 用戶 CRUD 操作
- 批量帳戶啟用
- 密碼重置
- 啟用/停用帳戶
- 系統角色管理

**4. Workspace API (`workspaceAPI`)**
- 工作區 CRUD
- 使用量與限制查詢
- 成員管理（邀請、更新角色、刪除）
- 邀請連結
- APT 授權

**5. Project API (`projectAPI`)**
- 專案 CRUD
- 專案複製與還原
- 永久刪除（purge）
- 專案圖片管理
- ROI 管理
- 校準（Calibration）管理

**6. Dataset API (`datasetAPI`)**
- 資料集 CRUD
- 資料集複製

**7. Image API (`imageAPI`)**
- 圖片 CRUD
- 圖片上傳
- 取得圖片/縮圖 URL
- 圖片轉換

**8. Annotation API (`annotationAPI`)**
- 標註 CRUD
- 按圖片/專案查詢標註

**9. Category API (`categoryAPI`)**
- 類別 CRUD

**10. Training Job API (`trainingJobAPI`)**
- 訓練任務 CRUD
- 取消訓練任務
- 自定義閾值更新
- 模型配置查詢
- 問題回報

**11. Model Weights API (`modelWeightsAPI`)**
- 模型權重下載 URL

**12. Prediction API (`predictionAPI`)**
- 預測結果查詢

**13. Metrics API (`metricsAPI`)**
- 訓練指標查詢

**14. Notification API (`notificationAPI`)**
- 通知管理
- 標記已讀
- 未讀數量

**15. Quota API (`quotaAPI`)**
- 成員配額
- 訓練任務配額
- 圖片配額
- 所有配額查詢

**16. MFA API (`mfaAPI`)**
- MFA 設定與啟用
- 登入驗證
- 恢復代碼
- 停用 MFA

**17. Autolabel API (`autolabelAPI`)**
- 模型下載
- 特徵提取
- 批量特徵計算

### 3. Hooks - `src/hooks/`

#### 新增的 Hooks：

**`useNotifications.ts`**
- 通知列表管理
- 標記已讀功能
- 未讀數量追蹤

**`useCategories.ts`**
- 類別 CRUD 操作
- 類別列表管理

**`useAnnotations.ts`**
- 單一圖片標註管理
- 專案所有標註查詢
- 標註 CRUD 操作

**`useImages.ts`**
- 圖片列表管理
- 圖片上傳
- 圖片 CRUD 操作
- 取得圖片 URL

**`useAccount.ts`**
- 個人資料管理
- 通知設定管理

**`useQuotas.ts`**
- 工作區配額查詢
- 成員配額
- 訓練任務配額

#### 更新的 `hooks/index.ts`
重新組織並匯出所有 hooks，分類為：
- Workspace hooks
- Project hooks
- Dataset hooks
- Image hooks
- Training job hooks
- Annotation hooks
- Category hooks
- Account hooks
- Notification hooks
- Quota hooks
- UI hooks

### 4. 文檔

**[API Reference](../api/api-reference.md)** - 完整的 API 文檔
- 所有 API 端點的詳細說明
- 請求/回應格式
- 參數說明
- 使用範例
- 常見類型定義
- 使用注意事項

## 架構改進

### 1. 類型安全性
- 所有 API 呼叫都有完整的 TypeScript 類型定義
- 枚舉類型用於狀態和角色（JobStatus、ProjectType、WorkspaceRoleEnum）
- 嚴格的介面定義確保資料一致性

### 2. 程式碼組織
- API 按功能模組化（auth、workspace、project 等）
- Hooks 與相應的 API 模組對應
- 清晰的檔案結構和命名規範

### 3. 錯誤處理
- 統一的錯誤處理機制
- 401 錯誤自動重定向到登入頁面
- 所有 hooks 都包含 error state

### 4. 狀態管理
- Loading states 用於 UI 回饋
- 自動重新抓取功能
- 樂觀更新支援（某些操作）

### 5. API 版本控制
- 支援多版本 API（透過 X-API-Version header）
- 向後兼容性考量

## 使用範例

### 1. 使用 Authentication
```typescript
import { authAPI } from '@/api';

// Login
const response = await authAPI.login({ email, password });
localStorage.setItem('access_token', response.access_token);

// Register
const registerResponse = await authAPI.register({
  email,
  password,
  first_name,
  last_name,
  agree_privacy: true,
  agree_license: true,
  agree_edm: false
});
```

### 2. 使用 Workspace Hook
```typescript
import { useWorkspaces } from '@/hooks';

function WorkspaceList() {
  const { workspaces, loading, error, refetch } = useWorkspaces({ limit: 10 });
  
  if (loading) return <LoadingState />;
  if (error) return <ErrorState error={error} />;
  
  return (
    <div>
      {workspaces.map(workspace => (
        <WorkspaceCard key={workspace.id} workspace={workspace} />
      ))}
    </div>
  );
}
```

### 3. 使用 Training Jobs
```typescript
import { trainingJobAPI } from '@/api';

// Create training job
const job = await trainingJobAPI.create(workspaceId, projectId, {
  name: 'My Training Job',
  aasconfig: { /* ... */ },
  image_splits: {
    train: [1, 2, 3],
    val: [4, 5]
  }
});

// Cancel training job
await trainingJobAPI.cancel(workspaceId, projectId, jobId);
```

### 4. 使用 Annotations
```typescript
import { useAnnotations } from '@/hooks';

function AnnotationEditor({ workspaceId, projectId, imageId }) {
  const {
    annotation,
    loading,
    createAnnotation,
    updateAnnotation,
    deleteAnnotation
  } = useAnnotations(workspaceId, projectId, imageId);
  
  // Create new annotation
  const handleCreate = async (data) => {
    await createAnnotation(data);
  };
  
  // Update existing annotation
  const handleUpdate = async (annotationId, data) => {
    await updateAnnotation(annotationId, data);
  };
}
```

### 5. 使用 Notifications
```typescript
import { useNotifications } from '@/hooks';

function NotificationBell() {
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead
  } = useNotifications({ read_at: 'exclude' });
  
  return (
    <div>
      <Badge count={unreadCount}>
        <BellIcon />
      </Badge>
      <NotificationList
        notifications={notifications}
        onMarkAsRead={markAsRead}
        onMarkAllAsRead={markAllAsRead}
      />
    </div>
  );
}
```

## API 端點對應

### 完整後端路由覆蓋：

✅ `/api/auth/*` - 認證相關
✅ `/api/accounts/*` - 帳戶管理
✅ `/api/users/*` - 用戶管理（管理員）
✅ `/api/workspaces/*` - 工作區管理
✅ `/api/workspaces/{id}/projects/*` - 專案管理
✅ `/api/workspaces/{id}/datasets/*` - 資料集管理
✅ `/api/workspaces/{id}/datasets/{id}/images/*` - 圖片管理
✅ `/api/workspaces/{id}/projects/{id}/images/{id}/annotations/*` - 標註管理
✅ `/api/workspaces/{id}/projects/{id}/categories/*` - 類別管理
✅ `/api/workspaces/{id}/projects/{id}/training_jobs/*` - 訓練任務
✅ `/api/workspaces/{id}/projects/{id}/training_jobs/{id}/model_weights` - 模型權重
✅ `/api/workspaces/{id}/projects/{id}/training_jobs/{id}/predictions` - 預測
✅ `/api/workspaces/{id}/projects/{id}/training_jobs/{id}/metrics` - 指標
✅ `/api/notifications/*` - 通知
✅ `/api/quotas/*` - 配額
✅ `/api/auth/mfa/*` - MFA 多因素認證
✅ `/api/autolabel/*` - 自動標註

## 測試建議

### 1. API 整合測試
- 測試所有 API 端點的連接性
- 驗證請求/回應格式
- 測試錯誤處理

### 2. Hook 測試
- 測試 loading states
- 測試 error handling
- 測試資料更新邏輯

### 3. 類型檢查
- 執行 TypeScript 編譯檢查
- 確保沒有類型錯誤

## 遷移指南

### 從舊版 API 遷移：

1. **更新匯入路徑**：
   ```typescript
   // 舊的
   import { workspaceAPI } from '../api';
   
   // 新的（相同，但有更多功能）
   import { workspaceAPI } from '../api';
   ```

2. **更新類型定義**：
   ```typescript
   // 舊的
   interface User {
     id: string;
     email: string;
   }
   
   // 新的
   interface User {
     id: number;  // 改為 number
     uuid: string; // 新增 UUID
     email: string;
     mfa_enabled: boolean; // 新增欄位
     // ... 更多欄位
   }
   ```

3. **更新 API 呼叫**：
   ```typescript
   // 舊的
   const workspaces = await workspaceAPI.getAll();
   
   // 新的（支援更多參數）
   const response = await workspaceAPI.getAll({
     limit: 10,
     offset: 0,
     keyword: 'search term',
     role_types: ['manager', 'member']
   });
   const workspaces = response.workspaces;
   ```

## 未來改進建議

1. **快取策略**：實作 React Query 或 SWR 來改善資料快取和同步
2. **WebSocket 支援**：用於即時通知和訓練任務狀態更新
3. **離線支援**：實作 Service Worker 用於離線功能
4. **批次操作**：新增批次 API 呼叫功能
5. **效能優化**：實作虛擬滾動用於大型列表

## 總結

此次更新實現了：
- ✅ 100% 後端 API 覆蓋率
- ✅ 完整的 TypeScript 類型定義
- ✅ 模組化和可維護的架構
- ✅ 豐富的 React Hooks
- ✅ 完整的 API 文檔

前端架構現在已與後端完全同步，並提供了強大的類型安全性和開發體驗。
