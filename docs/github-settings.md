# GitHub Repository Settings Guide

本文件說明如何設定 GitHub 儲存庫的各項功能，包括自動刪除已合併的分支。

This document explains how to configure various GitHub repository features, including automatic deletion of merged branches.

## 自動刪除已合併的分支 (Automatic Branch Deletion)

### 為什麼需要這個功能？ (Why is this needed?)

當 Pull Request 被合併後，來源分支 (head branch) 通常不再需要。自動刪除這些分支可以：
- 保持儲存庫整潔
- 避免累積過多無用的分支
- 減少團隊成員的手動維護工作

After a Pull Request is merged, the source branch (head branch) is usually no longer needed. Automatically deleting these branches:
- Keeps the repository clean
- Avoids accumulating unnecessary branches
- Reduces manual maintenance work for team members

### 如何啟用 (How to Enable)

#### 方法 1: 透過 GitHub 網頁界面 (Via GitHub Web Interface)

這是最簡單的方法：

1. 前往你的 GitHub 儲存庫
2. 點擊 **Settings** (設定) 標籤
3. 在左側選單中找到 **General** (一般設定)
4. 向下捲動到 **Pull Requests** 區塊
5. 勾選 ✅ **Automatically delete head branches** (自動刪除頭部分支)
6. 設定會立即生效

步驟截圖：
```
Repository → Settings → General → Pull Requests
└─ ☑ Automatically delete head branches
```

#### 方法 2: 使用 GitHub API (Using GitHub API)

如果你需要自動化設定或管理多個儲存庫，可以使用 GitHub API：

```bash
# 需要有 repo 權限的 GitHub token
curl -X PATCH \
  -H "Accept: application/vnd.github+json" \
  -H "Authorization: Bearer YOUR_GITHUB_TOKEN" \
  -H "X-GitHub-Api-Version: 2022-11-28" \
  https://api.github.com/repos/OWNER/REPO \
  -d '{"delete_branch_on_merge":true}'
```

替換：
- `YOUR_GITHUB_TOKEN`: 你的 GitHub Personal Access Token
- `OWNER`: 儲存庫擁有者 (例如: koilyc)
- `REPO`: 儲存庫名稱 (例如: GPT_Frontend)

#### 方法 3: 使用 GitHub CLI (Using GitHub CLI)

如果你有安裝 `gh` CLI 工具：

```bash
# 啟用自動刪除分支
gh api repos/OWNER/REPO --method PATCH -f delete_branch_on_merge=true

# 檢查設定狀態
gh api repos/OWNER/REPO --jq .delete_branch_on_merge
```

### 驗證設定 (Verify Configuration)

啟用後，你可以透過以下方式驗證：

1. **建立測試 Pull Request**
   - 從 main 建立一個新分支
   - 做些小改動並提交
   - 開啟 Pull Request
   - 合併後觀察分支是否自動刪除

2. **使用 GitHub API 檢查**
   ```bash
   curl -H "Authorization: Bearer YOUR_TOKEN" \
     https://api.github.com/repos/OWNER/REPO | jq .delete_branch_on_merge
   ```
   
   如果回傳 `true`，表示功能已啟用。

3. **使用 GitHub CLI 檢查**
   ```bash
   gh api repos/OWNER/REPO --jq .delete_branch_on_merge
   ```

### 注意事項 (Important Notes)

1. **只影響合併後的分支** - 此功能只會刪除透過 Pull Request 合併的分支
2. **不會刪除預設分支** - 主分支 (如 main、master) 永遠不會被刪除
3. **不會刪除受保護的分支** - 有分支保護規則的分支不會被刪除
4. **只刪除頭部分支** - 只有 PR 的來源分支 (head branch) 會被刪除，基礎分支 (base branch) 不受影響
5. **手動合併不適用** - 如果你用 `git merge` 手動合併，此功能不會生效
6. **可以復原** - 即使分支被刪除，你仍可以從 GitHub 介面復原

### 最佳實踐 (Best Practices)

1. **團隊協作** - 確保團隊成員都了解此設定，避免誤以為分支遺失
2. **保留重要分支** - 對於需要長期保留的分支，設定分支保護規則
3. **定期清理** - 即使啟用自動刪除，仍應定期檢查是否有未合併的舊分支需要手動清理
4. **配合 PR 模板** - 建議搭配 Pull Request 模板，確保 PR 完整性

### 相關設定 (Related Settings)

你可能也想啟用這些相關的 Pull Request 設定：

- **Allow merge commits** - 允許合併提交
- **Allow squash merging** - 允許壓縮合併
- **Allow rebase merging** - 允許變基合併
- **Automatically delete head branches** - 自動刪除頭部分支 ✅
- **Allow auto-merge** - 允許自動合併

### 疑難排解 (Troubleshooting)

#### 分支沒有被自動刪除？

1. 檢查是否真的透過 GitHub Pull Request 合併
2. 確認分支不是受保護的分支
3. 檢查儲存庫設定中的選項是否已啟用
4. 確認你有足夠的權限 (需要 admin 或 maintain 權限)

#### 需要復原已刪除的分支？

1. 前往 Pull Request 頁面
2. 找到已合併的 PR
3. 在 PR 下方會看到 "Restore branch" 按鈕
4. 點擊即可復原分支

### 更多資源 (Additional Resources)

- [GitHub Docs: Managing the automatic deletion of branches](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/configuring-pull-request-merges/managing-the-automatic-deletion-of-branches)
- [GitHub API: Repository Settings](https://docs.github.com/en/rest/repos/repos#update-a-repository)

---

## 其他推薦設定 (Other Recommended Settings)

### 分支保護規則 (Branch Protection Rules)

為主要分支設定保護規則：

1. Settings → Branches → Branch protection rules
2. Add rule
3. 設定規則，例如：
   - Require a pull request before merging
   - Require approvals (建議至少 1 個)
   - Require status checks to pass
   - Require conversation resolution before merging

### Pull Request 模板 (Pull Request Template)

建立 `.github/PULL_REQUEST_TEMPLATE.md` 來標準化 PR 描述。

### Issue 模板 (Issue Templates)

在 `.github/ISSUE_TEMPLATE/` 目錄建立 issue 模板，協助使用者提供完整資訊。

---

最後更新: 2025-12-09
