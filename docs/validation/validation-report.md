# Frontend-Backend Validation Report

## 概要
本文檔記錄了前端 API 呼叫與後端 Pydantic schema 的驗證結果和所有修正。

## 日期
2025年執行完整驗證與修正

---

## 主要修正項目

### 1. 註冊 API (RegisterRequest)

#### 問題
前端類型缺少必要欄位，不符合後端 Pydantic schema。

#### 後端 Schema (auth.py)
```python
class RegisterRequest(BaseModel):
    email: EmailStr
    password: Optional[SecretStr] = None  # OAuth users may not have password
    first_name: str
    last_name: str
    phone_country_code: Optional[str] = None
    phone_number: Optional[str] = None
    phone_extension: Optional[str] = None
    birthday: date  # REQUIRED
    company: Optional[str] = None
    department: Optional[str] = None
    industry: Optional[str] = None
    occupation: Optional[str] = None
    region: Optional[str] = None
    referral_person: Optional[str] = None
    usage_type: UserUsageType  # REQUIRED (PERSONAL/BUSINESS)
    agree_privacy: bool = True
    agree_license: bool = True
    agree_edm: bool = True
    ui_language: Optional[UILanguage] = None  # en-US, zh-TW, zh-CN, ja-JP
```

#### 修正後的前端類型
```typescript
export interface RegisterRequest {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone_country_code?: string;
  phone_number?: string;
  phone_extension?: string;
  birthday: string; // YYYY-MM-DD format - REQUIRED
  company?: string;
  department?: string;
  industry?: string;
  occupation?: string;
  region?: string;
  referral_person?: string;
  usage_type: string; // 'PERSONAL' or 'BUSINESS' - REQUIRED
  agree_privacy: boolean;
  agree_license: boolean;
  agree_edm: boolean;
  ui_language?: string; // 'en-US', 'zh-TW', 'zh-CN', 'ja-JP'
}
```

---

### 2. Category API

#### 問題
後端使用 `category_metadata` 物件包裝 `color` 欄位，但前端直接發送 `color`。

#### 後端 Schema (categories.py)
```python
class CategoryMetadata(BaseModel):
    color: str = Field(..., pattern=r'^#[0-9A-Fa-f]{6}$')

class CategoryPostRequest(BaseModel):
    name: str
    category_metadata: CategoryMetadata
```

#### 修正後的前端實作

**類型定義：**
```typescript
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
```

**API 實作：**
```typescript
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
}

// Update category
update: async (workspaceId: number, projectId: number, categoryId: number, data: Partial<{ name: string; color: string }>): Promise<Category> => {
  const payload: any = {};
  if (data.name) payload.name = data.name;
  if (data.color) payload.category_metadata = { color: data.color };
  const response = await api.patch(`/api/workspaces/${workspaceId}/projects/${projectId}/categories/${categoryId}`, payload);
  return response.data;
}
```

---

### 3. MFA API

#### 問題
欄位名稱不匹配：
- 後端使用 `mfa_code`，前端使用 `code`
- 後端返回 `otp_uri`，前端期望 `qr_code`
- `verify-login` 缺少 `password` 欄位

#### 後端 Schema (mfa.py)
```python
class MFASetupResponse(BaseModel):
    otp_uri: str  # OTP provisioning URI for QR code generation
    secret: str   # Plaintext TOTP secret for manual entry

class BaseMFARequest(BaseModel):
    mfa_code: str = Field(..., min_length=6, max_length=6)
    password: Optional[SecretStr] = None

class VerifyMFARequest(BaseModel):
    email: EmailStr
    password: SecretStr
    mfa_code: str = Field(..., min_length=6, max_length=6)
    recovery_code: Optional[str] = None
```

#### 修正後的前端實作

**類型定義：**
```typescript
export interface MFASetupResponse {
  otp_uri: string; // OTP provisioning URI for QR code
  secret: string;  // Plaintext TOTP secret for manual entry
}
```

**API 實作：**
```typescript
// Activate MFA
activate: async (code: string): Promise<RecoveryCodesResponse> => {
  const response = await api.post('/api/auth/mfa/activate', { mfa_code: code });
  return response.data;
}

// Verify MFA for login
verifyLogin: async (email: string, password: string, code: string, recoveryCode?: string): Promise<LoginResponse> => {
  const response = await api.post('/api/auth/mfa/verify-login', { 
    email, 
    password,
    mfa_code: code, 
    recovery_code: recoveryCode 
  });
  return response.data;
}
```

---

### 4. Annotation API

#### 問題
`predicted_by` 欄位位置錯誤：應在 `Annotation` 層級，而非 `GeneralAnnotation` 內的 `data` 層級。

#### 後端 Schema (annotations.py)
```python
class GeneralAnnotation(BaseModel):
    category_id: int
    data: Dict[str, Any]  # Contains type, points, bbox, obb

class AnnotationPostRequest(BaseModel):
    data: List[GeneralAnnotation]
    predicted_by: Optional[int] = None  # null=label, 0=SAM, other=job_id

class AnnotationResponse(BaseModel):
    id: int
    project_id: int
    image_id: int
    predicted_by: Optional[int] = None
    data: List[GeneralAnnotation]
    # ... other fields
```

#### 修正後的前端類型
```typescript
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
```

**API 實作：**
```typescript
// Create annotation
// data should be: { data: GeneralAnnotation[], predicted_by?: number | null }
create: async (workspaceId: number, projectId: number, imageId: number, data: { data: any[]; predicted_by?: number | null }): Promise<Annotation> => {
  const response = await api.post(`/api/workspaces/${workspaceId}/projects/${projectId}/images/${imageId}/annotations`, data);
  return response.data;
}
```

---

### 5. Training Job API

#### 問題
前端類型缺少 `project_id` 欄位（雖然在路徑中，但後端 schema 也要求在 body 中）。

#### 後端 Schema (training_jobs.py)
```python
class ImageSplits(BaseModel):
    train: List[int]
    val: List[int]
    test: Optional[List[int]] = []

class TrainingJobPostRequest(BaseModel):
    name: str
    project_id: int  # REQUIRED in body
    aasconfig: AASConfig
    image_splits: ImageSplits
```

#### 修正後的前端類型
```typescript
export interface ImageSplits {
  train: number[];
  val: number[];
  test?: number[];
}

export interface CreateTrainingJobRequest {
  name: string;
  project_id: number; // REQUIRED
  aasconfig: any; // AASConfig object
  image_splits: ImageSplits;
}
```

---

### 6. Image API (已正確)

#### 後端 Schema (images.py)
```python
class ImageMetadata(BaseModel):
    width: int
    height: int
    channel: int
    quality: Optional[int] = None
    unit: Optional[str] = None
    ppmm: Optional[float] = None

class ImagePostRequest(BaseModel):
    name: str
    image_metadata: ImageMetadata
    created_by: int
```

前端實作已正確匹配此 schema。

---

## 驗證清單

### ✅ 已修正
- [x] RegisterRequest - 新增所有必要欄位 (birthday, usage_type 等)
- [x] Category - 使用 category_metadata 物件
- [x] MFA - 修正欄位名稱 (otp_uri, mfa_code)
- [x] Annotation - 修正 predicted_by 位置
- [x] TrainingJob - 新增 project_id 欄位
- [x] useCategories hook - 更新參數類型

### ✅ 已驗證正確
- [x] Image API - ImageMetadata 結構正確
- [x] User API - 各種 PATCH 請求結構正確
- [x] Workspace API - 邀請和更新請求正確
- [x] Project API - 建立和更新請求正確
- [x] Dataset API - 基本 CRUD 操作正確
- [x] Notification API - 查詢和更新正確
- [x] Quota API - 查詢參數正確
- [x] Model Weights API - presigned URL 回應正確
- [x] Autolabel API - 請求和回應結構正確

---

## 測試建議

### 1. 註冊流程測試
```typescript
// 測試完整註冊
await authAPI.register({
  email: 'test@example.com',
  password: 'SecurePass123',
  first_name: 'John',
  last_name: 'Doe',
  birthday: '1990-01-01', // REQUIRED
  usage_type: 'PERSONAL',  // REQUIRED
  agree_privacy: true,
  agree_license: true,
  agree_edm: true,
  ui_language: 'en-US'
});
```

### 2. Category 操作測試
```typescript
// 建立 category
const category = await categoryAPI.create(workspaceId, projectId, {
  name: 'Defect',
  color: '#FF0000'
});

// 更新 color
await categoryAPI.update(workspaceId, projectId, category.id, {
  color: '#00FF00'
});
```

### 3. MFA 流程測試
```typescript
// Setup MFA
const mfaSetup = await mfaAPI.setup();
// mfaSetup.otp_uri 可用於生成 QR code
// mfaSetup.secret 可用於手動輸入

// Activate MFA
await mfaAPI.activate(code); // 使用 mfa_code

// Login with MFA
await mfaAPI.verifyLogin(email, password, mfaCode);
```

### 4. Annotation 建立測試
```typescript
// 建立 annotation
await annotationAPI.create(workspaceId, projectId, imageId, {
  data: [
    {
      category_id: 1,
      data: {
        type: 'bbox',
        bbox: [10, 20, 100, 200]
      }
    }
  ],
  predicted_by: null // Manual label
});
```

---

## 前後端對照表

| 功能模組 | 前端檔案 | 後端檔案 | 狀態 |
|---------|---------|---------|------|
| 認證 | types/index.ts, api/index.ts | payloads/auth.py | ✅ 已修正 |
| 用戶 | types/index.ts, api/index.ts | payloads/user.py | ✅ 正確 |
| 工作區 | types/index.ts, api/index.ts | payloads/workspaces.py | ✅ 正確 |
| 專案 | types/index.ts, api/index.ts | payloads/projects.py | ✅ 正確 |
| 資料集 | types/index.ts, api/index.ts | payloads/dataset.py | ✅ 正確 |
| 影像 | types/index.ts, api/index.ts | payloads/images.py | ✅ 正確 |
| 標註 | types/index.ts, api/index.ts | payloads/annotations.py | ✅ 已修正 |
| 類別 | types/index.ts, api/index.ts, hooks/useCategories.ts | payloads/categories.py | ✅ 已修正 |
| 訓練任務 | types/index.ts, api/index.ts | payloads/training_jobs.py | ✅ 已修正 |
| MFA | types/index.ts, api/index.ts | payloads/mfa.py | ✅ 已修正 |
| 通知 | types/index.ts, api/index.ts | payloads/notifications.py | ✅ 正確 |
| 配額 | types/index.ts, api/index.ts | routers/quotas.py | ✅ 正確 |
| 模型權重 | types/index.ts, api/index.ts | payloads/model_weights.py | ✅ 正確 |
| 自動標註 | types/index.ts, api/index.ts | payloads/autolabel.py | ✅ 正確 |

---

## 常見錯誤和解決方案

### 422 Unprocessable Entity
**原因：** 請求 payload 不符合 Pydantic schema

**排查步驟：**
1. 檢查必要欄位是否都有提供
2. 檢查欄位名稱是否正確（snake_case）
3. 檢查嵌套物件結構是否正確
4. 檢查資料型別是否匹配

**示例：**
```typescript
// ❌ 錯誤：直接發送 color
await categoryAPI.create(workspaceId, projectId, {
  name: 'Defect',
  color: '#FF0000'  // 後端期望 category_metadata.color
});

// ✅ 正確：使用 category_metadata
// API 內部會自動轉換為正確格式
await categoryAPI.create(workspaceId, projectId, {
  name: 'Defect',
  color: '#FF0000'  // API 會包裝成 { category_metadata: { color: '#FF0000' } }
});
```

### 401 Unauthorized
**原因：** Token 過期或無效

**解決方案：**
```typescript
// 在 axios interceptor 中處理
api.interceptors.response.use(
  response => response,
  async error => {
    if (error.response?.status === 401) {
      // 嘗試重新登入或導向登入頁
      authAPI.logout();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

---

## 後續改進建議

### 1. 自動化驗證
建議建立自動化測試，確保前端類型與後端 schema 保持同步：
- 使用 OpenAPI/Swagger 自動生成 TypeScript 類型
- 建立端到端測試驗證每個 API 端點
- 在 CI/CD 中加入 schema 驗證步驟

### 2. 類型安全增強
```typescript
// 使用更嚴格的類型
type UsageType = 'PERSONAL' | 'BUSINESS';
type UILanguage = 'en-US' | 'zh-TW' | 'zh-CN' | 'ja-JP';

export interface RegisterRequest {
  // ...
  usage_type: UsageType;
  ui_language?: UILanguage;
}
```

### 3. 錯誤處理改進
```typescript
// 建立統一的錯誤處理類型
export interface APIError {
  status: number;
  message: string;
  details?: Record<string, any>;
}

// 在 API 呼叫中使用
try {
  await authAPI.register(data);
} catch (error) {
  const apiError = error as APIError;
  if (apiError.status === 422) {
    // 顯示驗證錯誤
    console.error('Validation errors:', apiError.details);
  }
}
```

### 4. 文檔維護
- 定期更新 [API Reference](../api/api-reference.md)
- 記錄每次 API 變更
- 維護變更日誌（CHANGELOG.md）

---

## 結論

本次驗證和修正確保了前端 API 呼叫完全符合後端 Pydantic schema 的要求。主要修正包括：

1. **RegisterRequest** - 新增所有必要的註冊欄位
2. **Category API** - 修正為使用 category_metadata 物件結構
3. **MFA API** - 統一欄位命名（mfa_code, otp_uri）並新增必要的 password 欄位
4. **Annotation API** - 修正 predicted_by 欄位的位置
5. **TrainingJob API** - 新增 project_id 和 ImageSplits 類型

所有修正都已實作並更新到相關的類型定義、API 模組和 React hooks 中。建議進行完整的集成測試以確保所有功能正常運作。
