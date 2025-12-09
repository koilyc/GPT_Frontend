# 自動刪除分支功能總結 (Auto-Delete Branch Summary)

## 問題 (Problem)
> 我有辦法設定 merge 以後自動刪除 branch 嗎

## 解決方案 (Solution)

✅ **是的！GitHub 提供了內建的自動刪除分支功能。**

## 3 種設定方式 (3 Ways to Configure)

### 🎯 方式 1: 網頁界面 (最簡單) - Web Interface (Easiest)

```
1. 前往 Repository → Settings
2. 選擇 General (左側選單)
3. 找到 "Pull Requests" 區塊
4. 勾選 ✅ "Automatically delete head branches"
```

**時間: 30 秒**

---

### ⚡ 方式 2: 使用自動化腳本 - Automated Script

```bash
# 執行我們提供的腳本
./scripts/setup-github-settings.sh
```

這個腳本會：
- ✅ 檢查 GitHub CLI 是否安裝
- ✅ 顯示目前設定狀態
- ✅ 提供互動式選單
- ✅ 自動啟用所需功能

**時間: 1 分鐘**

---

### 🔧 方式 3: GitHub CLI 手動指令 - Manual CLI Command

```bash
# 取得 repo 名稱
REPO=$(gh repo view --json nameWithOwner -q .nameWithOwner)

# 啟用自動刪除
gh api repos/$REPO --method PATCH -f delete_branch_on_merge=true

# 驗證設定
gh api repos/$REPO --jq .delete_branch_on_merge
# 應該回傳: true
```

**時間: 2 分鐘**

---

## 效果示範 (How It Works)

### Before (之前):
```
1. 建立 feature branch: feature/new-feature
2. 建立 Pull Request
3. 審查並合併 PR
4. 😞 分支 feature/new-feature 仍然存在
5. 需要手動刪除分支
```

### After (啟用後):
```
1. 建立 feature branch: feature/new-feature
2. 建立 Pull Request
3. 審查並合併 PR
4. 🎉 分支 feature/new-feature 自動刪除！
5. 儲存庫保持整潔
```

---

## 檔案說明 (Files Added)

| 檔案 | 說明 | 語言 |
|------|------|------|
| `docs/github-settings.md` | 完整詳細指南 | 中英雙語 |
| `docs/QUICK_START_ZH.md` | 快速開始指南 | 中文為主 |
| `docs/AUTO_DELETE_BRANCH_SUMMARY.md` | 本檔案 - 功能總結 | 中英雙語 |
| `scripts/setup-github-settings.sh` | 自動化設定腳本 | Bash |

---

## 常見問題 (FAQ)

### Q: 會不會誤刪重要的分支？
A: 不會！此功能只會刪除：
- ✅ 透過 Pull Request 合併的分支
- ✅ 非受保護的分支
- ✅ 非預設分支 (如 main/master)

### Q: 如果不小心刪除了怎麼辦？
A: 可以輕鬆復原！
1. 前往已合併的 Pull Request 頁面
2. 點擊 "Restore branch" 按鈕
3. 分支就會恢復

### Q: 手動用 git merge 的話會自動刪除嗎？
A: 不會。只有透過 GitHub Pull Request 合併的分支才會自動刪除。

### Q: 需要什麼權限？
A: 需要 repository 的 **admin** 或 **maintain** 權限。

### Q: 這個設定會影響現有的分支嗎？
A: 不會。只影響未來合併的 Pull Request。

---

## 進階設定 (Advanced Settings)

如果你想要更完整的配置，可以同時啟用：

```bash
# 使用腳本的選項 2，會同時設定：
./scripts/setup-github-settings.sh
# 選擇選項 2

# 或手動設定所有選項：
gh api repos/$REPO --method PATCH \
  -f delete_branch_on_merge=true \
  -f allow_squash_merge=true \
  -f allow_merge_commit=true \
  -f allow_rebase_merge=true \
  -f allow_auto_merge=true
```

---

## 相關資源 (Resources)

- 📖 [完整文件](./github-settings.md)
- 🚀 [快速開始](./QUICK_START_ZH.md)
- 🔗 [GitHub 官方文件](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/configuring-pull-request-merges/managing-the-automatic-deletion-of-branches)

---

## 下一步 (Next Steps)

1. ✅ 選擇一種方式啟用自動刪除功能
2. ✅ 合併一個測試 PR 驗證功能
3. ✅ 通知團隊成員這個新設定
4. ⭐ 考慮設定分支保護規則 (見 `docs/github-settings.md`)
5. ⭐ 建立 Pull Request 模板 (見 `docs/QUICK_START_ZH.md`)

---

**建立時間**: 2025-12-09  
**最後更新**: 2025-12-09  
**狀態**: ✅ 完成
