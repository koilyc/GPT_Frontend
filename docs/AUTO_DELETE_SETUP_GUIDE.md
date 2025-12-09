# 設定自動刪除分支 - 圖文教學 (Visual Setup Guide)

## 📋 目錄 (Table of Contents)

1. [方法一：網頁界面設定](#方法一網頁界面設定) ⭐ 推薦
2. [方法二：使用自動化腳本](#方法二使用自動化腳本)
3. [方法三：使用 GitHub CLI](#方法三使用-github-cli)
4. [驗證設定](#驗證設定)

---

## 方法一：網頁界面設定

### 步驟 1: 前往儲存庫設定頁面

```
https://github.com/koilyc/GPT_Frontend
                    ↓
           點擊 "Settings" 標籤
```

**位置**: 在儲存庫頁面最上方的標籤列中

### 步驟 2: 找到 Pull Requests 設定

```
Settings 頁面
    ├─ General (左側選單) ← 點這裡
    ├─ Branches
    ├─ Actions
    └─ ...

向下捲動到 "Pull Requests" 區塊
```

### 步驟 3: 啟用自動刪除功能

在 **Pull Requests** 區塊中，找到並勾選：

```
Pull Requests
├─ ☐ Allow merge commits
├─ ☐ Allow squash merging
├─ ☐ Allow rebase merging
├─ ☑ Automatically delete head branches  ← 勾選這個！
└─ ☐ Allow auto-merge
```

✅ **完成！** 設定立即生效，不需要儲存或確認。

---

## 方法二：使用自動化腳本

### 前置需求

確保已安裝 GitHub CLI：

```bash
# 檢查是否已安裝
gh --version

# 如果未安裝，前往安裝：
# https://cli.github.com/
```

### 執行腳本

```bash
# 1. 進入專案目錄
cd /path/to/GPT_Frontend

# 2. 執行設定腳本
./scripts/setup-github-settings.sh
```

### 腳本執行畫面

```
GitHub Repository Settings Setup
==================================

Repository: koilyc/GPT_Frontend

Current Settings:
----------------
Auto-delete branches: false
Allow squash merge: true
Allow merge commit: true
Allow rebase merge: true
Allow auto-merge: false

What would you like to configure?
1) Enable automatic branch deletion after merge (推薦)
2) Configure all recommended PR settings
3) View current settings only (already shown above)
4) Exit

Enter your choice (1-4): 1
```

選擇 **1** 啟用自動刪除分支功能。

---

## 方法三：使用 GitHub CLI

### 一行指令設定

```bash
# 取得儲存庫資訊並啟用自動刪除
gh api repos/koilyc/GPT_Frontend --method PATCH \
  -f delete_branch_on_merge=true
```

### 分步驟操作

```bash
# 1. 檢查目前設定
gh api repos/koilyc/GPT_Frontend --jq .delete_branch_on_merge
# 輸出: false (表示未啟用)

# 2. 啟用自動刪除
gh api repos/koilyc/GPT_Frontend --method PATCH \
  -f delete_branch_on_merge=true

# 3. 再次確認
gh api repos/koilyc/GPT_Frontend --jq .delete_branch_on_merge
# 輸出: true (表示已啟用) ✅
```

---

## 驗證設定

### 方法 A: 測試 Pull Request

```
1. 建立測試分支
   git checkout -b test/auto-delete
   
2. 做一些改動
   echo "test" > test.txt
   git add test.txt
   git commit -m "Test auto delete"
   
3. 推送並建立 PR
   git push origin test/auto-delete
   # 在 GitHub 上建立 Pull Request
   
4. 合併 PR
   # 在 GitHub 上點擊 "Merge pull request"
   
5. 觀察結果
   ✅ 分支 test/auto-delete 應該自動消失
```

### 方法 B: 使用 CLI 檢查

```bash
# 檢查設定狀態
gh api repos/koilyc/GPT_Frontend --jq '{
  delete_branch_on_merge,
  allow_squash_merge,
  allow_merge_commit,
  allow_rebase_merge,
  allow_auto_merge
}'
```

預期輸出：
```json
{
  "delete_branch_on_merge": true,  ← 應該是 true
  "allow_squash_merge": true,
  "allow_merge_commit": true,
  "allow_rebase_merge": true,
  "allow_auto_merge": false
}
```

---

## 🎯 快速決策樹

```
需要設定自動刪除分支？
        │
        ├─ 有安裝 GitHub CLI？
        │       │
        │       ├─ 是 → 使用方法二或方法三 (1分鐘)
        │       │       ↓
        │       │   ./scripts/setup-github-settings.sh
        │       │
        │       └─ 否 → 使用方法一 (30秒)
        │               ↓
        │           Settings → General → Pull Requests
        │               ↓
        │           勾選 "Automatically delete head branches"
        │
        └─ 完成！✅
```

---

## 🔍 常見問題快速解答

### Q: 設定後馬上生效嗎？
**A**: 是的！立即生效，不需要重啟或等待。

### Q: 會影響現有的分支嗎？
**A**: 不會。只影響未來透過 PR 合併的分支。

### Q: 可以復原已刪除的分支嗎？
**A**: 可以！在已合併的 PR 頁面有 "Restore branch" 按鈕。

### Q: 主分支 (main) 會被刪除嗎？
**A**: 不會！預設分支和受保護的分支永遠不會被刪除。

### Q: 需要什麼權限？
**A**: 需要 repository 的 admin 或 maintain 權限。

---

## 📚 相關文件

- 📖 [完整設定文件](./github-settings.md) - 詳細說明和進階選項
- 🚀 [快速開始指南](./QUICK_START_ZH.md) - 快速參考
- 📝 [功能總結](./AUTO_DELETE_BRANCH_SUMMARY.md) - 概覽和 FAQ

---

## 💡 提示

- ✅ 啟用後，記得通知團隊成員
- ✅ 考慮同時設定分支保護規則
- ✅ 建立 Pull Request 模板提高效率
- ✅ 定期檢查是否有未合併的舊分支

---

**最後更新**: 2025-12-09  
**維護者**: GitHub Copilot  
**問題回報**: [開啟 Issue](https://github.com/koilyc/GPT_Frontend/issues)
