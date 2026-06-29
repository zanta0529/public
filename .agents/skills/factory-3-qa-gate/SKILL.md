---
name: factory-3-qa-gate
description: 對照計畫文件的驗收標準撰寫驗收測試，審查實作完整性與安全性。支援純後端、純前端、全端三種專案類型。Use when builder has finished, before opening a PR.
version: 1.1.0
allowed-tools:
  - read_file
  - write_file
  - edit_file
  - search_files
  - list_directory
  - run_command
---

# factory-3-qa-gate（品質閘道）

你同時扮演 QA 工程師與程式碼審查員。**你不修任何東西。**

## 第一步：讀取專案類型

讀取 `.agents/context/plan.md` 的「🏷️ 專案類型」欄位，
決定執行哪些審查區塊。

## 輸入

- 核准的計畫文件（`.agents/context/plan.md`）
- builder 的完成摘要（`.agents/context/build-summary.md`）
- API 合約（`.agents/context/api-contract.md`，fullstack 時存在）
- 當前程式碼（透過 read_file / search_files）

---

## Phase 1：驗收測試

從計畫文件的驗收標準出發，一條標準對應一個（或多個）測試案例：

| 驗收標準類型    | 對應測試形式                |
| --------------- | --------------------------- |
| Happy path      | 整合測試或 E2E              |
| 失敗路徑        | 錯誤處理測試                |
| 商業規則        | 規則驗證測試                |
| 邊界情況        | 邊界值測試                  |
| UI 互動（前端） | 元件測試（Testing Library） |

執行測試並記錄結果。不可將未覆蓋的標準標記為「已通過」。

---

## Phase 2：後端審查

_（frontend-only 時跳過此段）_

### 功能完整性

- [ ] 計畫中每個 API 端點都已實作
- [ ] Response 格式符合計畫規格
- [ ] 每個驗收標準都有對應的實作路徑

### 安全性

- [ ] 需要權限的 API 都有授權檢查
- [ ] 多租戶查詢都有 tenant_id 過濾
- [ ] 沒有敏感資料寫進 log
- [ ] 錯誤訊息不洩漏內部細節給 client

### 程式碼品質

- [ ] 遵循 AGENTS.md 後端架構規則
- [ ] 沒有在路由層直接操作資料庫
- [ ] 沒有重複實作既有 helper 邏輯

---

## Phase 3：前端審查

_（backend-only 時跳過此段）_

### 功能完整性

- [ ] 計畫中每個元件都已實作
- [ ] 頁面路由變動符合計畫
- [ ] API 呼叫使用封裝層（`src/api/`），沒有元件內直接 fetch

### UI 狀態

- [ ] 每個資料請求都有 Loading 狀態
- [ ] 每個資料請求都有 Error 狀態
- [ ] 空資料時有適當的 Empty 狀態

### 程式碼品質

- [ ] TypeScript 專案沒有 `any`
- [ ] 沒有 inline style
- [ ] 元件測試覆蓋主要互動行為
- [ ] `npm run build` 無錯誤

---

## Phase 4：全端介面一致性審查

_（fullstack 時才執行此段）_

- [ ] 前端呼叫的端點路徑與後端實際路徑完全一致
- [ ] Request 格式（欄位名稱、型別）前後端一致
- [ ] Response 格式前端正確解析，無欄位缺失
- [ ] builder 標記的「API 合約偏差」已列入 Critical 或 Important

---

## 範圍控制（所有類型）

- [ ] 沒有修改計畫範圍外的檔案
- [ ] 沒有未授權的新依賴套件

---

## 輸出格式

儲存至 `.agents/context/qa-report.md`：

### ✅ 通過的驗收標準

（每條標準 + 對應測試案例名稱）

### ❌ 失敗的驗收標準

（每條標準 + 失敗訊息 + 建議回退給 builder 的修復方向）

### 🔴 Critical（合併前必修）

[問題描述] — `檔案路徑:行號`

### 🟡 Important（合併前應修）

[問題描述] — `檔案路徑:行號`

### 🔵 Minor（自行決定）

[問題描述] — `檔案路徑:行號`

### ✅ 最終結論

- 通過：「品質閘道通過，可開 PR。」
- 未通過：「品質閘道未通過。Critical 問題清單：[列出]，請回退 builder 修復。」

---

## 規則

- 此報告是**人類審核點 3**
- 儲存完成後停止並提示：「請閱讀 `.agents/context/qa-report.md`。確認無誤後，請開 PR。」
- **不可為了顯得認真而發明不存在的問題**
