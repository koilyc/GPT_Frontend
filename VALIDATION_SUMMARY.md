# 前後端 API Schema 驗證完成報告

## 執行日期
2025年

## 驗證範圍
本次驗證涵蓋 `GPT_Frontend` 前端與 `backendservice/apt_app` 後端之間的所有 API 介面，確保：
1. TypeScript 類型定義與 Pydantic BaseModel 完全一致
2. API 請求 payload 結構正確
3. 欄位命名符合後端期望（snake_case）
4. 必要欄位都已包含
5. 嵌套物件結構正確

---

## 修正摘要

### 已修正的問題（5項）

#### 1. ✅ RegisterRequest - 新增必要欄位
**檔案：** `src/types/index.ts`
- 新增 `birthday: string` (必要)
- 新增 `usage_type: string` (必要)
- 新增 `phone_country_code`, `phone_number`, `phone_extension`
- 新增 `company`, `department`, `industry`, `occupation`, `region`, `referral_person`
- 新增 `ui_language?: string`

#### 2. ✅ Category API - 修正 category_metadata 結構
**檔案：** `src/types/index.ts`, `src/api/index.ts`, `src/hooks/useCategories.ts`
- 類型定義改用 `category_metadata: CategoryMetadata` 物件
- API create 方法自動包裝 `color` 到 `category_metadata`
- API update 方法支援 `color` 參數並自動轉換
- useCategories hook 更新參數類型

#### 3. ✅ MFA API - 修正欄位命名
**檔案：** `src/types/index.ts`, `src/api/index.ts`
- MFASetupResponse 使用 `otp_uri` 代替 `qr_code`
- activate 方法使用 `mfa_code` 代替 `code`
- verifyLogin 方法新增 `password` 參數並使用 `mfa_code`

#### 4. ✅ Annotation - 修正 predicted_by 位置
**檔案：** `src/types/index.ts`, `src/api/index.ts`
- 將 `predicted_by` 從 `GeneralAnnotation` 移到 `Annotation` 層級
- 建立獨立的 `GeneralAnnotation` 介面
- API create 方法明確標註參數結構

#### 5. ✅ TrainingJob - 新增 project_id 和 ImageSplits
**檔案：** `src/types/index.ts`
- 建立 `ImageSplits` 介面
- 在 `CreateTrainingJobRequest` 中新增 `project_id: number`
- 明確定義 `image_splits: ImageSplits` 類型

---

## 驗證通過的模組（14項）

以下模組的前端實作與後端 Pydantic schema 完全一致，無需修正：

### 1. ✅ Auth API (部分)
- `LoginRequest` - 正確
- `UpdatePasswordRequest` - 正確
- `ForgotPasswordRequest` - 正確
- `ResetPasswordRequest` - 正確

### 2. ✅ User API
- `UserPatchRequest` - 正確
- `UserNotificationChannelSetting` - 正確
- `EdmSubscriptionUpdateRequest` - 正確

### 3. ✅ Workspace API
- `WorkspacePostRequest` - 正確
- `WorkspacePatchRequest` - 正確
- `InviteMemberListRequest` - 正確
- `UpdateWorkspaceMemberRequest` - 正確

### 4. ✅ Project API
- `ProjectPostRequest` - 正確
- `ProjectPatchRequest` - 正確
- `ProjectImagePatchRequest` - 正確

### 5. ✅ Dataset API
- `DatasetPostRequest` - 正確
- `DatasetPatchRequest` - 正確

### 6. ✅ Image API
- `ImagePostRequest` - 正確 (包含 ImageMetadata)
- `ImagePatchRequest` - 正確
- presigned URL 請求 - 正確

### 7. ✅ Model Weights API
- `ModelWeightsPresignedUrlResponse` - 正確

### 8. ✅ Prediction API
- 查詢方法 - 正確

### 9. ✅ Metrics API
- `getTrainingMetrics` - 正確

### 10. ✅ Notification API
- `NotificationResponse` - 正確
- `NotificationListResponse` - 正確
- `AdminSendNotificationRequest` - 正確
- 標記已讀方法 - 正確

### 11. ✅ Quota API
- `QuotaResponse` - 正確
- 所有查詢方法 - 正確

### 12. ✅ Autolabel API
- `AutolabelGetModelResponse` - 正確
- `AutolabelGetFeaturesResponse` - 正確
- `CalculateFeaturesRequest` - 正確

### 13. ✅ Account API
- 個人資料更新 - 正確
- 通知設定 - 正確
- EDM 訂閱 - 正確

### 14. ✅ Users API (Admin)
- 所有管理功能 - 正確

---

## 檔案修改清單

### 修改的檔案（3個）

1. **src/types/index.ts**
   - 更新 `RegisterRequest` 介面
   - 新增 `CategoryMetadata` 介面
   - 更新 `Category` 介面
   - 新增 `GeneralAnnotation` 介面
   - 更新 `Annotation` 介面
   - 更新 `MFASetupResponse` 介面
   - 新增 `ImageSplits` 介面
   - 更新 `CreateTrainingJobRequest` 介面

2. **src/api/index.ts**
   - 修正 `categoryAPI.create()` 實作
   - 修正 `categoryAPI.update()` 實作
   - 修正 `mfaAPI.activate()` 實作
   - 修正 `mfaAPI.verifyLogin()` 實作
   - 更新 `annotationAPI.create()` 註解

3. **src/hooks/useCategories.ts**
   - 更新 `updateCategory` 參數類型

### 新增的檔案（2個）

1. **VALIDATION_REPORT.md**
   - 完整的驗證報告
   - 詳細的修正說明
   - 測試建議和示例

2. **VALIDATION_SUMMARY.md** (本檔案)
   - 驗證總結
   - 快速參考

---

## 測試檢查清單

### 高優先級測試

#### 1. 註冊流程
```typescript
// 測試完整註冊資料
const registerData: RegisterRequest = {
  email: 'newuser@example.com',
  password: 'SecurePass123!',
  first_name: 'Test',
  last_name: 'User',
  birthday: '1990-01-15', // ⚠️ 必要欄位
  usage_type: 'PERSONAL',  // ⚠️ 必要欄位
  agree_privacy: true,
  agree_license: true,
  agree_edm: false,
  ui_language: 'zh-TW'
};
await authAPI.register(registerData);
```

#### 2. Category 操作
```typescript
// 建立類別
const category = await categoryAPI.create(1, 1, {
  name: 'Defect Type A',
  color: '#FF5733' // ⚠️ API 內部會包裝成 category_metadata
});

// 更新顏色
await categoryAPI.update(1, 1, category.id, {
  color: '#33FF57' // ⚠️ API 內部會包裝成 category_metadata
});
```

#### 3. MFA 流程
```typescript
// 1. 設定 MFA
const setup = await mfaAPI.setup();
console.log(setup.otp_uri);  // ⚠️ 改為 otp_uri
console.log(setup.secret);

// 2. 啟用 MFA
await mfaAPI.activate('123456'); // ⚠️ 內部使用 mfa_code

// 3. MFA 登入
await mfaAPI.verifyLogin(
  'user@example.com',
  'password',        // ⚠️ 新增必要參數
  '123456'          // ⚠️ 內部使用 mfa_code
);
```

#### 4. Annotation 建立
```typescript
// 建立標註
await annotationAPI.create(1, 1, 100, {
  data: [ // ⚠️ 結構更改
    {
      category_id: 1,
      data: {
        type: 'bbox',
        bbox: [10, 20, 100, 150]
      }
    }
  ],
  predicted_by: null // ⚠️ 在這一層，不在 GeneralAnnotation 內
});
```

#### 5. Training Job 建立
```typescript
// 建立訓練任務
await trainingJobAPI.create(1, 1, {
  name: 'Training Job 1',
  project_id: 1, // ⚠️ 必要欄位
  aasconfig: { /* config */ },
  image_splits: { // ⚠️ 使用 ImageSplits 類型
    train: [1, 2, 3],
    val: [4, 5],
    test: [6]
  }
});
```

### 中優先級測試

- [ ] 使用者個人資料更新
- [ ] 工作區成員邀請
- [ ] 專案複製功能
- [ ] 資料集圖片上傳
- [ ] 通知標記已讀
- [ ] 配額查詢

### 低優先級測試

- [ ] Autolabel 功能
- [ ] 系統管理員功能
- [ ] 模型權重下載
- [ ] 預測結果查詢

---

## 錯誤排查指南

### 422 Unprocessable Entity

**可能原因：**
1. 缺少必要欄位（如 `birthday`, `usage_type`）
2. 欄位型別不正確
3. 嵌套物件結構錯誤（如 `category_metadata`）
4. 欄位命名錯誤（如 `code` vs `mfa_code`）

**排查步驟：**
```typescript
// 1. 檢查請求 payload
console.log('Request payload:', JSON.stringify(payload, null, 2));

// 2. 對照後端 Pydantic schema
// 查看 backendservice/apt_app/apt_app/payloads/ 對應檔案

// 3. 檢查必要欄位
// 後端會返回詳細的驗證錯誤訊息
```

### 401 Unauthorized

**可能原因：**
- Token 已過期
- Token 無效
- 未登入

**解決方案：**
```typescript
// 檢查 token 是否存在
const token = localStorage.getItem('access_token');
if (!token) {
  // 導向登入頁
  window.location.href = '/login';
}
```

### 403 Forbidden

**可能原因：**
- 權限不足
- 資源不屬於當前用戶/工作區

**解決方案：**
- 檢查用戶角色和權限
- 確認資源 ID 正確

---

## API 版本控制

部分 API 支援版本控制，透過 `X-API-Version` header 指定：

```typescript
// V2 API 範例
const response = await api.get('/api/endpoint', {
  headers: { 'X-API-Version': '2' }
});
```

**支援版本控制的 API：**
- Notification API (v1/v2)
- Training Job API (v1/v2)
- Project Images API (v1/v2)

---

## 資料型別對照

### Python ↔ TypeScript

| Python Type | TypeScript Type | 備註 |
|------------|----------------|------|
| `str` | `string` | |
| `int` | `number` | |
| `float` | `number` | |
| `bool` | `boolean` | |
| `datetime` | `string` | ISO 8601 格式 |
| `date` | `string` | YYYY-MM-DD 格式 |
| `Optional[T]` | `T \| undefined` | |
| `List[T]` | `T[]` | |
| `Dict[str, T]` | `Record<string, T>` | |
| `EmailStr` | `string` | 需符合 email 格式 |
| `SecretStr` | `string` | 敏感資訊 |

---

## 最佳實踐建議

### 1. 使用 TypeScript 嚴格模式
```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "strictNullChecks": true,
    "noImplicitAny": true
  }
}
```

### 2. 統一錯誤處理
```typescript
// 建立統一的 API 錯誤類型
export interface APIError {
  status: number;
  message: string;
  detail?: any;
}

// 在 axios interceptor 中處理
api.interceptors.response.use(
  response => response,
  error => {
    const apiError: APIError = {
      status: error.response?.status || 500,
      message: error.response?.data?.message || 'Unknown error',
      detail: error.response?.data?.detail
    };
    return Promise.reject(apiError);
  }
);
```

### 3. 使用列舉類型
```typescript
// 定義常數為列舉
export enum UsageType {
  PERSONAL = 'PERSONAL',
  BUSINESS = 'BUSINESS'
}

export enum UILanguage {
  EN_US = 'en-US',
  ZH_TW = 'zh-TW',
  ZH_CN = 'zh-CN',
  JA_JP = 'ja-JP'
}

// 使用
const data: RegisterRequest = {
  // ...
  usage_type: UsageType.PERSONAL,
  ui_language: UILanguage.ZH_TW
};
```

### 4. 建立自動化測試
```typescript
// 使用 Vitest 或 Jest
describe('Category API', () => {
  it('should create category with correct payload structure', async () => {
    const mockData = { name: 'Test', color: '#FF0000' };
    const result = await categoryAPI.create(1, 1, mockData);
    
    expect(result.category_metadata).toBeDefined();
    expect(result.category_metadata.color).toBe('#FF0000');
  });
});
```

---

## 維護建議

### 定期檢查（每月）
1. 檢查後端 API 變更
2. 更新前端類型定義
3. 執行完整測試套件
4. 更新文檔

### 版本更新時
1. 比對 Pydantic schema 變更
2. 更新對應的 TypeScript 類型
3. 檢查 breaking changes
4. 更新 API 文檔

### CI/CD 整合
```yaml
# .github/workflows/api-validation.yml
name: API Schema Validation
on: [push, pull_request]
jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Run API tests
        run: npm run test:api
      - name: Type check
        run: npm run type-check
```

---

## 聯絡資訊

如有任何問題或發現新的不一致之處，請：
1. 建立 Issue 並標記 `api-schema`
2. 聯繫後端團隊確認 schema 定義
3. 更新本文檔和 VALIDATION_REPORT.md

---

## 結論

本次驗證成功完成前後端 API schema 的全面檢查和修正：

✅ **5 個關鍵問題已修正**
- RegisterRequest
- Category API
- MFA API  
- Annotation API
- Training Job API

✅ **14 個模組驗證通過**
- Auth, User, Workspace, Project, Dataset, Image
- Model Weights, Prediction, Metrics, Notification
- Quota, Autolabel, Account, Users (Admin)

✅ **Query 參數完全重構**
- PaginationParams: 從 page/search/sort_by/order 改為 offset/keyword/order_by/desc
- 新增 11 個專用 QueryParams 類型
- 修復 3 個 TypeScript 編譯錯誤

✅ **9 個檔案已更新**
- types/index.ts (新增所有 QueryParams 類型)
- api/index.ts (更新 7 個 API 方法)
- hooks/useWorkspaces.ts (完整重構)
- hooks/useNotifications.ts
- hooks/useProjects.ts
- hooks/useDatasets.ts
- hooks/useWorkspaceDetail.ts
- hooks/useTrainingJobs.ts
- hooks/useCategories.ts

✅ **2 個組件已修復**
- WorkspacePage.tsx (參數 & 排序邏輯)
- DashboardPage.tsx (參數)

✅ **3 個文檔已建立**
- VALIDATION_REPORT.md
- VALIDATION_SUMMARY.md
- QUERY_PARAMS_VALIDATION.md

**前端現在完全符合後端 Pydantic schema 和 query 參數要求，可以進行全面測試和部署。**
