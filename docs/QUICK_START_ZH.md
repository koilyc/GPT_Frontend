# 快速開始指南 (Quick Start Guide)

## 如何啟用 Merge 後自動刪除分支

### 最簡單的方法 (3 步驟)

1. **前往儲存庫設定**
   - 開啟你的 GitHub 儲存庫頁面
   - 點擊上方的 `Settings` (設定) 標籤

2. **找到 Pull Requests 設定**
   - 在左側選單選擇 `General`
   - 向下捲動找到 `Pull Requests` 區塊

3. **啟用自動刪除**
   - 勾選 ✅ `Automatically delete head branches`
   - 完成！設定會立即生效

### 使用自動化腳本 (推薦給開發者)

如果你有安裝 GitHub CLI (`gh`)，可以執行：

```bash
# 執行設定腳本
./scripts/setup-github-settings.sh
```

或者直接使用指令：

```bash
# 啟用自動刪除分支
gh api repos/$(gh repo view --json nameWithOwner -q .nameWithOwner) \
  --method PATCH -f delete_branch_on_merge=true
```

### 驗證設定

合併一個測試 Pull Request，觀察分支是否自動刪除。

或使用指令檢查：

```bash
gh api repos/OWNER/REPO --jq .delete_branch_on_merge
```

回傳 `true` 表示已啟用。

### 更多資訊

詳細說明請參考：[docs/github-settings.md](./github-settings.md)

---

## 其他常用設定

### Pull Request 合併選項

在同一個設定頁面，你還可以設定：

- ✅ **Allow merge commits** - 允許一般合併
- ✅ **Allow squash merging** - 允許壓縮合併 (推薦)
- ✅ **Allow rebase merging** - 允許變基合併
- ✅ **Allow auto-merge** - 允許自動合併

### 分支保護規則

保護重要分支 (如 `main`)：

1. Settings → Branches → Add branch protection rule
2. 設定分支名稱模式 (例如: `main`)
3. 勾選需要的保護選項：
   - ✅ Require a pull request before merging
   - ✅ Require approvals (建議至少 1 個)
   - ✅ Require status checks to pass before merging
   - ✅ Require conversation resolution before merging

### 建立 Pull Request 模板

在 `.github/PULL_REQUEST_TEMPLATE.md` 建立模板：

```markdown
## 變更說明 (Description)

請描述這個 PR 的內容

## 變更類型 (Type of Change)

- [ ] Bug 修復
- [ ] 新功能
- [ ] 破壞性變更
- [ ] 文件更新

## 測試 (Testing)

- [ ] 已測試過本地運作
- [ ] 已新增/更新測試
- [ ] 所有測試通過

## 檢查清單 (Checklist)

- [ ] 程式碼遵循專案風格
- [ ] 已更新相關文件
- [ ] 沒有產生新的警告
```

---

## 需要協助？

- 📖 查看完整文件: [docs/github-settings.md](./github-settings.md)
- 🐛 回報問題: [開啟 Issue](https://github.com/koilyc/GPT_Frontend/issues)
- 💬 討論: [Discussions](https://github.com/koilyc/GPT_Frontend/discussions)

---

最後更新: 2025-12-09
