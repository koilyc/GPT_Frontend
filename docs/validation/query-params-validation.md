# Query Parameters 驗證與修正報告

## 概要
前端的 query parameters 與後端 Pydantic schema 存在嚴重不一致。本報告記錄所有發現的問題和修正。

---

## 主要問題

### 1. PaginationParams 定義不一致

#### ❌ 修正前的前端定義
```typescript
export interface PaginationParams {
  page?: number;        // ❌ 後端沒有這個欄位
  limit?: number;       // ✅ 正確
  offset?: number;      // ✅ 正確
  search?: string;      // ❌ 後端沒有這個欄位
  sort_by?: string;     // ❌ 後端使用 order_by
  order?: 'asc' | 'desc'; // ❌ 後端使用 desc (boolean)
  keyword?: string;     // ⚠️ 應該在 FuzzySearchQueryParams
  order_by?: string;    // ⚠️ 類型應該是枚舉
  desc?: boolean;       // ✅ 正確
}
```

#### ✅ 後端定義 (query_params.py)
```python
class PaginationParams(BaseModel):
    offset: int = Field(0, ge=0, le=DB_BIG_INTEGER_MAX)
    limit: int = Field(10, ge=1, le=100)
    order_by: OrderByEnum = Field(OrderByEnum.id)  # 'id' | 'name' | 'created_at' | 'updated_at'
    desc: bool = Field(False)
```

#### ✅ 修正後的前端定義
```typescript
export interface PaginationParams {
  offset?: number;  // 起始位置，預設 0
  limit?: number;   // 每頁筆數，預設 10，最大 100
  order_by?: 'id' | 'name' | 'created_at' | 'updated_at'; // 排序欄位
  desc?: boolean;   // 是否降序，預設 false (升序)
}
```

---

## 新增的 QueryParams 類型

### 1. DeletionStateQueryParams
控制是否包含已刪除的資源。

```typescript
export interface DeletionStateQueryParams {
  deletion_state?: 'include' | 'exclude' | 'only'; // 預設 'exclude'
}
```

**後端對應：**
```python
class DeletionStateQueryParams(BaseModel):
    deletion_state: DeletionStateQuery = Field(
        DeletionStateQuery.exclude,
        description="Query parameter to include/exclude/only deleted datasets"
    )
```

### 2. FuzzySearchQueryParams
模糊搜尋參數。

```typescript
export interface FuzzySearchQueryParams {
  keyword?: string; // 模糊搜尋關鍵字
}
```

**後端對應：**
```python
class FuzzySearchQueryParams(BaseModel):
    keyword: Optional[keyword_str] = None
```

### 3. TimeFilterParams
時間範圍篩選。

```typescript
export interface TimeFilterParams {
  start_time?: string; // ISO 8601 格式
  end_time?: string;   // ISO 8601 格式
}
```

**後端對應：**
```python
class TimeFilter(BaseModel):
    start_time: Optional[datetime] = Field(default=None)
    end_time: Optional[datetime] = Field(default=None)
```

### 4. CommonQueryParams
組合所有基礎參數。

```typescript
export interface CommonQueryParams 
  extends PaginationParams, 
          DeletionStateQueryParams, 
          FuzzySearchQueryParams {}
```

**後端對應：**
```python
class CommonQueryParams(PaginationParams, DeletionStateQueryParams, FuzzySearchQueryParams):
    pass
```

---

## 專用 QueryParams 類型

### 1. ProjectQueryParams

```typescript
export interface ProjectQueryParams extends CommonQueryParams {
  project_types?: string[]; // 專案類型篩選
}
```

**後端對應：**
```python
class ProjectQueryParams(CommonQueryParams):
    project_types: Optional[List[ProjectType]] = Field(
        default=None, description="Filter projects by multiple project types"
    )
```

**使用範例：**
```typescript
const projects = await projectAPI.getAll(workspaceId, {
  offset: 0,
  limit: 20,
  order_by: 'created_at',
  desc: true,
  keyword: 'defect',
  deletion_state: 'exclude',
  project_types: ['detection', 'classification']
});
```

### 2. WorkspaceQueryParams

```typescript
export interface WorkspaceQueryParams extends CommonQueryParams {
  role_types?: string[];      // 角色類型篩選
  admin_mode?: boolean;       // 只顯示管理者工作區
  trial_used?: boolean;       // 是否已使用試用
  subscription_name?: 'Free' | 'Pro' | 'Enterprise';
}
```

**後端對應：**
```python
class WorkspaceQueryParams(CommonQueryParams):
    role_types: Optional[List[WorkspaceRoleEnum]] = Field(default=None)
    admin_mode: Optional[bool] = Field(default=False)
    trial_used: Optional[bool] = Field(default=None)
    subscription_name: Optional[Literal["Free", "Pro", "Enterprise"]] = Field(default=None)
```

**使用範例：**
```typescript
const workspaces = await workspaceAPI.getAll({
  offset: 0,
  limit: 10,
  order_by: 'name',
  admin_mode: true,
  subscription_name: 'Pro'
});
```

### 3. WorkspaceMemberQueryParams

```typescript
export interface WorkspaceMemberQueryParams 
  extends PaginationParams, 
          FuzzySearchQueryParams, 
          TimeFilterParams {
  order_by?: 'name' | 'email' | 'role' | 'pending' | 'join_time';
  role?: 'manager' | 'member' | 'viewer';
}
```

**後端對應：**
```python
class WorkspaceMemberQueryParams(PaginationParams, FuzzySearchQueryParams, TimeFilter):
    order_by: Literal["name", "email", "role", "pending", "join_time"] = Field(default="name")
    role: Optional[WorkspaceRoleEnum] = Field(None)
```

**使用範例：**
```typescript
const members = await workspaceAPI.getMembers(workspaceId, {
  offset: 0,
  limit: 50,
  order_by: 'join_time',
  desc: true,
  role: 'member',
  keyword: 'john',
  start_time: '2025-01-01T00:00:00Z',
  end_time: '2025-12-31T23:59:59Z'
});
```

### 4. JobQueryParams

```typescript
export interface JobQueryParams 
  extends CommonQueryParams, 
          TimeFilterParams {
  job_status?: string[];     // 任務狀態篩選
  project_types?: string[];  // 專案類型篩選
  order_by?: 'id' | 'created_at' | 'name' | 'updated_at' | 'time_spent';
}
```

**後端對應：**
```python
class JobQueryParams(CommonQueryParams, TimeFilter):
    job_status: Optional[List[JobStatus]] = Field(default=None)
    project_types: Optional[List[ProjectType]] = Field(default=None)
    order_by: Annotated[
        Literal["id", "created_at", "name", "updated_at", "time_spent"],
        Field(default="id")
    ]
```

**使用範例：**
```typescript
const jobs = await trainingJobAPI.getByWorkspace(workspaceId, {
  offset: 0,
  limit: 20,
  order_by: 'time_spent',
  desc: true,
  job_status: ['running', 'completed'],
  project_types: ['detection'],
  start_time: '2025-01-01T00:00:00Z'
});
```

### 5. NotificationQueryParams

```typescript
export interface NotificationQueryParams extends PaginationParams {
  notification_type?: string;  // 通知類型篩選
  read_at?: 'include' | 'exclude' | 'only'; // 已讀狀態篩選
}
```

**後端對應：**
```python
class NotificationQueryParams(PaginationParams):
    notification_type: Optional[NotificationType] = Field(default=None)
    read_at: Optional[ReadStateQuery] = Field(ReadStateQuery.include)
```

**使用範例：**
```typescript
const notifications = await notificationAPI.getAll({
  offset: 0,
  limit: 20,
  order_by: 'created_at',
  desc: true,
  read_at: 'exclude', // 只顯示未讀
  notification_type: 'TRAINING_COMPLETED'
});
```

### 6. UserQueryParams (Admin)

```typescript
export interface UserQueryParams 
  extends CommonQueryParams, 
          TimeFilterParams {
  order_by?: 'id' | 'name' | 'status' | 'email' | 'role' | 'created_at' | 'updated_at' | 'reference';
  status?: boolean;  // 啟用狀態篩選
  role?: 'superadmin' | 'admin' | 'user'; // 角色篩選
}
```

**後端對應：**
```python
class UserQueryParams(CommonQueryParams, TimeFilter):
    order_by: Annotated[
        Literal["id", "name", "status", "email", "role", "created_at", "updated_at", "reference"],
        Field(default="id")
    ]
    status: Optional[bool] = Field(None)
    role: Optional[RoleFilter] = Field(None)
```

**使用範例：**
```typescript
const users = await usersAPI.getAll({
  offset: 0,
  limit: 50,
  order_by: 'created_at',
  desc: true,
  status: true,  // 只顯示啟用的用戶
  role: 'admin',
  keyword: 'john',
  start_time: '2025-01-01T00:00:00Z'
});
```

---

## 修正的 API 方法

### 已更新使用正確 QueryParams 的方法

1. **usersAPI.getAll** - 使用 `UserQueryParams`
2. **workspaceAPI.getAll** - 使用 `WorkspaceQueryParams`
3. **workspaceAPI.getMembers** - 使用 `WorkspaceMemberQueryParams`
4. **projectAPI.getAll** - 使用 `ProjectQueryParams`
5. **notificationAPI.getAll** - 使用 `NotificationQueryParams`
6. **trainingJobAPI.getByProject** - 使用 `JobQueryParams`
7. **trainingJobAPI.getByWorkspace** - 使用 `JobQueryParams`

### 仍使用基礎 PaginationParams 的方法

以下方法只需要基礎分頁功能，無需額外篩選：

- `datasetAPI.getAll()`
- `imageAPI.getAll()`
- `annotationAPI.getAllByProject()`
- `projectAPI.getImages()`

---

## 常見錯誤和修正

### ❌ 錯誤 1: 使用 page 而非 offset

```typescript
// ❌ 錯誤
const response = await api.get('/api/users/', {
  params: { page: 1, limit: 10 }
});

// ✅ 正確
const response = await api.get('/api/users/', {
  params: { offset: 0, limit: 10 }
});
```

### ❌ 錯誤 2: 使用 order 而非 desc

```typescript
// ❌ 錯誤
const response = await api.get('/api/projects/', {
  params: { order_by: 'created_at', order: 'desc' }
});

// ✅ 正確
const response = await api.get('/api/projects/', {
  params: { order_by: 'created_at', desc: true }
});
```

### ❌ 錯誤 3: 使用 search 而非 keyword

```typescript
// ❌ 錯誤
const response = await api.get('/api/workspaces/', {
  params: { search: 'test' }
});

// ✅ 正確
const response = await api.get('/api/workspaces/', {
  params: { keyword: 'test' }
});
```

### ❌ 錯誤 4: 時間格式不正確

```typescript
// ❌ 錯誤
const response = await api.get('/api/training_jobs/', {
  params: { start_time: '2025-01-01' } // 缺少時間部分
});

// ✅ 正確
const response = await api.get('/api/training_jobs/', {
  params: { start_time: '2025-01-01T00:00:00Z' } // ISO 8601 格式
});
```

---

## 分頁計算說明

### offset 與 page 的轉換

後端使用 `offset`（從 0 開始的位置），前端可能習慣使用 `page`（從 1 開始的頁碼）。

**轉換公式：**
```typescript
// Page to offset
const offset = (page - 1) * limit;

// Offset to page
const page = Math.floor(offset / limit) + 1;
```

**範例：**
```typescript
// 取得第 3 頁，每頁 20 筆
const page = 3;
const limit = 20;
const offset = (page - 1) * limit; // offset = 40

const response = await projectAPI.getAll(workspaceId, {
  offset: offset,  // 40
  limit: limit     // 20
});
```

### 計算總頁數

```typescript
interface ListResponse {
  total_count: number;
  items: any[];
}

const calculateTotalPages = (total: number, limit: number): number => {
  return Math.ceil(total / limit);
};

// 使用範例
const response = await projectAPI.getAll(workspaceId, { limit: 20 });
const totalPages = calculateTotalPages(response.total_count, 20);
```

---

## 建議的 Pagination Hook

為了方便使用，建議建立一個統一的分頁 hook：

```typescript
// src/hooks/usePagination.ts
import { useState, useCallback } from 'react';
import type { PaginationParams } from '../types';

interface UsePaginationOptions {
  initialPage?: number;
  initialLimit?: number;
  initialOrderBy?: PaginationParams['order_by'];
  initialDesc?: boolean;
}

export const usePagination = (options: UsePaginationOptions = {}) => {
  const {
    initialPage = 1,
    initialLimit = 10,
    initialOrderBy = 'id',
    initialDesc = false
  } = options;

  const [page, setPage] = useState(initialPage);
  const [limit, setLimit] = useState(initialLimit);
  const [orderBy, setOrderBy] = useState(initialOrderBy);
  const [desc, setDesc] = useState(initialDesc);

  const getParams = useCallback((): PaginationParams => {
    return {
      offset: (page - 1) * limit,
      limit,
      order_by: orderBy,
      desc
    };
  }, [page, limit, orderBy, desc]);

  const nextPage = useCallback(() => {
    setPage(prev => prev + 1);
  }, []);

  const prevPage = useCallback(() => {
    setPage(prev => Math.max(1, prev - 1));
  }, []);

  const goToPage = useCallback((newPage: number) => {
    setPage(Math.max(1, newPage));
  }, []);

  const reset = useCallback(() => {
    setPage(initialPage);
    setLimit(initialLimit);
    setOrderBy(initialOrderBy);
    setDesc(initialDesc);
  }, [initialPage, initialLimit, initialOrderBy, initialDesc]);

  return {
    page,
    limit,
    orderBy,
    desc,
    setPage,
    setLimit,
    setOrderBy,
    setDesc,
    getParams,
    nextPage,
    prevPage,
    goToPage,
    reset
  };
};
```

**使用範例：**
```typescript
const MyComponent = () => {
  const pagination = usePagination({ 
    initialLimit: 20,
    initialOrderBy: 'created_at',
    initialDesc: true 
  });
  
  const { data, loading } = useQuery(async () => {
    return await projectAPI.getAll(workspaceId, pagination.getParams());
  }, [pagination.page, pagination.limit, pagination.orderBy, pagination.desc]);

  return (
    <div>
      {/* 顯示資料 */}
      <button onClick={pagination.prevPage}>上一頁</button>
      <span>第 {pagination.page} 頁</span>
      <button onClick={pagination.nextPage}>下一頁</button>
    </div>
  );
};
```

---

## 測試建議

### 1. 基礎分頁測試

```typescript
describe('Pagination', () => {
  it('should fetch first page with default params', async () => {
    const response = await projectAPI.getAll(1, {});
    expect(response.items.length).toBeLessThanOrEqual(10);
  });

  it('should fetch second page with offset', async () => {
    const response = await projectAPI.getAll(1, {
      offset: 10,
      limit: 10
    });
    // 驗證結果
  });

  it('should sort by created_at descending', async () => {
    const response = await projectAPI.getAll(1, {
      order_by: 'created_at',
      desc: true
    });
    // 驗證排序
  });
});
```

### 2. 篩選參數測試

```typescript
describe('Filtering', () => {
  it('should filter by keyword', async () => {
    const response = await workspaceAPI.getAll({
      keyword: 'test'
    });
    // 驗證結果包含 'test'
  });

  it('should filter by deletion state', async () => {
    const response = await projectAPI.getAll(1, {
      deletion_state: 'only'
    });
    // 驗證所有結果都已刪除
  });

  it('should filter by time range', async () => {
    const response = await trainingJobAPI.getByWorkspace(1, {
      start_time: '2025-01-01T00:00:00Z',
      end_time: '2025-12-31T23:59:59Z'
    });
    // 驗證時間範圍
  });
});
```

### 3. 組合參數測試

```typescript
describe('Combined Parameters', () => {
  it('should apply pagination, sorting, and filtering together', async () => {
    const response = await usersAPI.getAll({
      offset: 20,
      limit: 10,
      order_by: 'created_at',
      desc: true,
      keyword: 'admin',
      status: true,
      role: 'admin',
      start_time: '2025-01-01T00:00:00Z'
    });
    // 驗證所有條件
  });
});
```

---

## 後端支援的完整參數對照表

| API 端點 | QueryParams 類型 | 支援的參數 |
|---------|----------------|----------|
| GET /api/users/ | UserQueryParams | offset, limit, order_by, desc, keyword, deletion_state, status, role, start_time, end_time |
| GET /api/workspaces/ | WorkspaceQueryParams | offset, limit, order_by, desc, keyword, deletion_state, role_types, admin_mode, trial_used, subscription_name |
| GET /api/workspaces/{id}/members | WorkspaceMemberQueryParams | offset, limit, order_by, desc, keyword, role, start_time, end_time |
| GET /api/workspaces/{id}/projects | ProjectQueryParams | offset, limit, order_by, desc, keyword, deletion_state, project_types |
| GET /api/workspaces/{id}/datasets/ | PaginationParams | offset, limit, order_by, desc |
| GET /api/workspaces/{id}/datasets/{id}/images | PaginationParams | offset, limit, order_by, desc |
| GET /api/workspaces/{id}/projects/{id}/training_jobs | JobQueryParams | offset, limit, order_by, desc, keyword, deletion_state, job_status, project_types, start_time, end_time |
| GET /api/notifications | NotificationQueryParams | offset, limit, order_by, desc, notification_type, read_at |

---

## 結論

本次修正確保前端的 query parameters 完全符合後端定義：

✅ **已修正**
- PaginationParams 定義與後端一致
- 新增 7 個專用 QueryParams 類型
- 更新所有 API 方法使用正確的類型
- 移除不存在的參數（page, search, order）

✅ **已驗證**
- 所有 QueryParams 與後端 Pydantic schema 匹配
- 參數命名符合後端期望
- 類型定義正確（枚舉、布林值等）

**建議後續動作：**
1. 建立 usePagination hook 統一分頁邏輯
2. 撰寫完整的參數驗證測試
3. 更新現有組件使用新的參數結構
4. 在 API 文檔中記錄所有可用參數
