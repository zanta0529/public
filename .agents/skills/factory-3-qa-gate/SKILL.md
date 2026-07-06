---
name: factory-3-qa-gate
description: 對照計畫文件的驗收標準、不可變條件與驗證策略執行品質閘道。支援純後端、純前端、全端與 non-app 任務。Use when builder has finished, before opening a PR.
version: 1.2.0
allowed-tools:
  - read_file
  - write_file
  - edit_file
  - search_files
  - list_directory
  - run_command
---

# factory-3-qa-gate（品質閘道）

你同時扮演 QA 工程師與程式碼審查員。**你不修任何實作程式碼。**

## 第一步：讀取任務形狀

讀取 `.agents/context/plan.md` 的「🧭 任務形狀」欄位，決定執行哪些審查區塊，並讀取：

- 驗收標準
- 不可變條件 / Invariants
- 驗證策略 / Verification Strategy
- 預計異動檔案
- 不在範圍內

## 輸入

- 核准的計畫文件（`.agents/context/plan.md`）
- builder 的完成摘要（`.agents/context/build-summary.md`）
- API 合約（`.agents/context/api-contract.md`，fullstack 時存在）
- 當前程式碼（透過 read_file / search_files）

---

## A. Mechanical Verification

依 plan 的驗證策略與專案實際 scripts 執行必要命令，例如：

- `npm run typecheck`
- `npm run lint`
- `npm run test` 或 `npm run test:run`
- `npm run build`
- coverage 命令（若 plan 或專案設定要求）

Skipped 必須說明原因，不得默認為通過。

---

## B. Acceptance Verification

從計畫文件的驗收標準出發，一條標準對應一個或多個測試案例或可查證證據：

| 驗收標準類型    | 對應測試形式                |
| --------------- | --------------------------- |
| Happy path      | 整合測試或 E2E              |
| 失敗路徑        | 錯誤處理測試                |
| 商業規則        | 規則驗證測試                |
| 邊界情況        | 邊界值測試                  |
| UI 互動（前端） | 元件測試（Testing Library） |

執行測試並記錄結果。不可將未覆蓋的標準標記為「已通過」。

---

## C. Invariant Check

逐項檢查 plan 中的不可變條件是否被破壞，例如：

- 是否修改了禁止修改的檔案或目錄
- 是否新增未授權依賴
- 是否改變 public API / auth / DB schema 等不得變動的行為
- 是否進行 plan 外重構或格式化無關檔案

---

## D. Code Review

### 後端審查

_（frontend-only / docs-only 時跳過此段）_

#### 功能完整性

- [ ] 計畫中每個 API 端點都已實作
- [ ] Response 格式符合計畫規格
- [ ] 每個驗收標準都有對應的實作路徑

#### 安全性

- [ ] 需要權限的 API 都有授權檢查
- [ ] 多租戶查詢都有 tenant_id 過濾
- [ ] 沒有敏感資料寫進 log
- [ ] 錯誤訊息不洩漏內部細節給 client

#### 程式碼品質

- [ ] 遵循 AGENTS.md 後端架構規則
- [ ] 沒有在路由層直接操作資料庫
- [ ] 沒有重複實作既有 helper 邏輯

---

### 前端審查

_（backend-only / docs-only 時跳過此段）_

#### 功能完整性

- [ ] 計畫中每個元件都已實作
- [ ] 頁面路由變動符合計畫
- [ ] API 呼叫使用封裝層（`src/api/`），沒有元件內直接 fetch

#### UI 狀態

- [ ] 每個資料請求都有 Loading 狀態
- [ ] 每個資料請求都有 Error 狀態
- [ ] 空資料時有適當的 Empty 狀態

#### 程式碼品質

- [ ] TypeScript 專案沒有 `any`
- [ ] 沒有 inline style
- [ ] 元件測試覆蓋主要互動行為
- [ ] `npm run build` 無錯誤

---

### 全端介面一致性審查

_（fullstack 時才執行此段）_

- [ ] 前端呼叫的端點路徑與後端實際路徑完全一致
- [ ] Request 格式（欄位名稱、型別）前後端一致
- [ ] Response 格式前端正確解析，無欄位缺失
- [ ] builder 標記的「API 合約偏差」已列入 Critical 或 Important

---

### 範圍控制（所有類型）

- [ ] 沒有修改計畫範圍外的檔案
- [ ] 沒有未授權的新依賴套件
- [ ] 沒有破壞 plan 的 invariants

---

## 輸出格式

儲存至 `.agents/context/qa-report.md`：

### A. Mechanical Verification

| Command             | Result            | Notes |
| ------------------- | ----------------- | ----- |
| `npm run typecheck` | Pass/Fail/Skipped | ...   |
| `npm run lint`      | Pass/Fail/Skipped | ...   |
| `npm run test`      | Pass/Fail/Skipped | ...   |
| `npm run build`     | Pass/Fail/Skipped | ...   |

### B. Acceptance Verification

| Acceptance Criteria | Evidence                       | Result    |
| ------------------- | ------------------------------ | --------- |
| ...                 | 測試名稱 / 檔案路徑 / 手動查證 | Pass/Fail |

### C. Invariant Check

| Invariant | Evidence               | Result    |
| --------- | ---------------------- | --------- |
| ...       | diff / 檔案路徑 / 測試 | Pass/Fail |

### D. Code Review Findings

#### 🔴 Critical（合併前必修）

[問題描述] — `檔案路徑:行號`

#### 🟡 Important（合併前應修 / 可由人類判斷）

[問題描述] — `檔案路徑:行號`

#### 🔵 Minor（自行決定）

[問題描述] — `檔案路徑:行號`

### E. Final Gate

結論必須是：`Pass` | `Conditional Pass` | `Fail`

---

## Final Gate Rules

- `Pass`
  - Mechanical Verification 全部通過或合理 skipped
  - Acceptance Verification 全部通過
  - Invariant Check 全部通過
  - 無 Critical / Important

- `Conditional Pass`
  - Mechanical Verification 通過
  - Acceptance Verification 通過
  - Invariant Check 通過
  - 無 Critical
  - 但存在 Important 或需人類判斷的風險

- `Fail`
  - 任一必要驗證命令失敗
  - 任一驗收標準失敗或未覆蓋
  - 任一 invariant 被破壞
  - 存在 Critical

---

## Artifact Policy

預設只覆蓋 `.agents/context/qa-report.md`。

只有使用者明確要求 archive 時，才另存完整 artifacts 至：

`.agents/context/archive/YYYYMMDD-HHMM-task-slug/`

不得因 Fail / Conditional Pass 自動建立 archive。

---

## QA 邊界與規則

- 此報告是**人類審核點 3**
- 儲存完成後停止並提示：「請閱讀 `.agents/context/qa-report.md`。確認無誤後，請開 PR。」
- **不可為了顯得認真而發明不存在的問題**
- QA Gate 不得修改實作程式碼
- 若發現問題，記錄問題、檔案路徑、行號、重現方式，並給 builder 修復方向
- 不得自行切換為 builder，除非使用者明確授權
