---
name: factory
description: 軟體工場總協調器。當使用者要求「啟動軟體工場」、「啟動軟體工場流水線」、「修改本專案功能」、「開始開發功能」、「修復問題」、「只做測試/文件/依賴/審查」時優先啟用。負責分流任務類型、判斷風險與複雜度，並啟動 planner → builder → qa-gate 或可選輔助流程。
version: 1.2.0
---

# Factory Orchestrator

## 啟動後的判斷順序

啟動時依序判斷四件事，並在開始前顯示判斷結果讓使用者確認。

### 判斷零：任務類型

| 任務類型      | 條件                                  | 建議流程                                            |
| ------------- | ------------------------------------- | --------------------------------------------------- |
| `feature`     | 新增功能或擴充既有功能                | planner → builder → qa-gate                         |
| `bugfix`      | 修復已知錯誤、測試失敗或行為偏差      | planner → builder → qa-gate，並要求 regression test |
| `refactor`    | 不改變外部行為的內部重構              | planner → builder → qa-gate，強調 invariants        |
| `test-only`   | 只新增、修正或執行測試                | 可選輔助測試流程或內建測試流程                      |
| `docs-only`   | 只新增或修改文件                      | 可選輔助文件流程或 planner 文件流程                 |
| `dependency`  | npm 依賴、漏洞、audit、`package.json` | 可選輔助依賴流程或 npm-only 內建流程                |
| `review-only` | 只做審查、不改檔                      | 可選輔助審查流程或只讀 planner/review 流程          |

### 判斷一：專案類型

| 類型            | 條件                                                              |
| --------------- | ----------------------------------------------------------------- |
| `backend-only`  | 任務只涉及 API、service、資料庫，無 UI 變動                       |
| `frontend-only` | 任務只涉及元件、頁面、樣式，不需後端變動                          |
| `fullstack`     | 同時需要後端 API 變動與前端 UI 實作                               |
| `non-app`       | 文件、測試、依賴、工具ing、治理或純審查，不直接屬於前後端應用功能 |

### 判斷二：任務複雜度

**Full 模式**（滿足任一）：

- 需新增或修改 API 端點。
- 需資料庫 schema / migration 變動。
- 需求描述模糊，驗收標準不明確。
- 估計影響超過 3 個檔案。
- 專案類型為 `fullstack`。
- 風險等級為 `High` 或 `Critical`。

**Lite 模式**（必須同時滿足）：

- 不新增 API 端點，只修改現有邏輯。
- 不變動資料庫 schema。
- 影響範圍限於 1–2 個檔案。
- 需求描述清晰，預期行為可直接驗證。
- 專案類型為 `backend-only`、`frontend-only` 或明確低風險 `non-app`。
- 風險等級為 `Low` 或 `Medium`。

### 判斷三：風險等級

| 風險       | 條件                                                             |
| ---------- | ---------------------------------------------------------------- |
| `Low`      | 只改文案、測試、簡單純函式、局部 UI                              |
| `Medium`   | 修改服務邏輯、狀態管理、表單驗證、資料轉換                       |
| `High`     | 涉及資料庫、權限、認證、依賴升級、跨模組 API 合約                |
| `Critical` | 可能造成資料遺失、不可逆操作、secrets/auth/multi-tenant 隔離風險 |

風險等級只用於決定流程嚴謹度、停止條件與 QA 深度；不得自動觸發 archive。

---

## 啟動時的輸出格式

```text
🏭 Factory 啟動
任務：[使用者描述]
任務類型：[feature / bugfix / refactor / test-only / docs-only / dependency / review-only]
專案類型：[backend-only / frontend-only / fullstack / non-app]
複雜度：[Full / Lite]
風險等級：[Low / Medium / High / Critical]
建議流程：[planner → builder → qa-gate / optional skill handoff / read-only review]
判斷依據：[1–3 個觸發條件]

繼續？（回覆「繼續」啟動，或直接修正我的判斷）
```

---

## Artifact Policy

預設維持覆蓋模式，讀寫固定路徑：

- `.agents/context/plan.md`
- `.agents/context/api-contract.md`
- `.agents/context/build-summary.md`
- `.agents/context/qa-report.md`

不得因 Full 模式、高風險、QA Fail 或 Conditional Pass 自動建立 archive。

只有當使用者明確要求保留紀錄、建立 archive、另存本次 factory artifact，才建立：

`.agents/context/archive/YYYYMMDD-HHMM-task-slug/`

範例：`.agents/context/archive/20260706-1530-fix-login-validation/`

Archive 建立後也不得自動刪除或清理；只有使用者明確要求清理時才處理。

---

## 可選輔助流程（Soft Dependency）

Factory 可以使用 supporting skills 或專門流程，但它們是 soft dependencies，不是必要條件。

規則：

1. 若當前環境存在對應 supporting skill 或專門流程，優先載入並遵循。
2. 若不存在，使用 factory 內建 fallback 流程。
3. 不得因可選輔助流程不存在而中止任務。
4. 若可選輔助流程與專案治理文件衝突，以 `docs/PROJECT_INSTRUCTIONS.md` 與 `docs/AI_INSTRUCTIONS.md` 為準。

| 任務類型                   | 可選輔助流程                                     | Fallback                                 |
| -------------------------- | ------------------------------------------------ | ---------------------------------------- |
| `test-only` / test failure | `vitest-tester` 或等效測試流程                   | 讀 `package.json` 找測試 scripts         |
| `dependency` / audit       | `dependency-guard` 或等效依賴流程                | npm-only 手動流程                        |
| format / lint              | `auto-governance` 或等效治理流程                 | 讀 `package.json` 找 lint/format scripts |
| `docs-only`                | `generate-system-docs` 或等效文件流程            | planner 做文件分析與計畫                 |
| `review-only`              | `repository-code-review` 或等效只讀審查流程      | planner 做只讀審查                       |
| review remediation         | `repository-remediation-pipeline` 或等效修復流程 | planner → builder → qa-gate              |

---

## Full 模式流程

### Phase 0：準備

```bash
mkdir -p .agents/context
```

### Phase 1：計畫（自動）

啟用 factory-1-planner skill。
⏸ **人類審核點 1**：等待「核准計畫」。

### Phase 2：實作（核准後自動）

啟用 factory-2-builder skill。
（fullstack 時：factory-2-builder 內部序列執行後端 → 前端）

### Phase 3：品質閘道（自動）

啟用 factory-3-qa-gate skill。
⏸ **人類審核點 3**：等待確認 qa-report.md。

---

## Lite 模式流程

### Phase 1：最小計畫（自動）

啟用 factory-1-planner skill，附加指示：
「輕量任務。聚焦受影響的 1–2 個檔案，跳過全面掃描。
計畫文件仍需包含：任務類型、專案類型、複雜度、風險等級、驗收標準、不可變條件、預計異動檔案、驗證策略、測試清單。」

⏸ **人類審核點 1**：等待「核准計畫」。

### Phase 2：實作（核准後自動）

啟用 factory-2-builder skill。

### Phase 3：品質閘道（自動）

啟用 factory-3-qa-gate skill（完整執行，不縮減）。
⏸ **人類審核點 3**：等待確認 qa-report.md。

---

## Mandatory Stop Conditions

任何階段遇到以下情況，必須停止並詢問使用者：

- 需要新增、移除或升級依賴。
- 需要修改資料庫 schema、migration 或 ORM 設定。
- 需要修改 authentication / authorization / permission policy。
- 需要不可逆操作、資料刪除、重置、清空或 destructive command。
- 發現核准 plan 與實際架構不符。
- 實作範圍超出已核准 plan。
- 需要 commit、push 或重寫 git history。
- 可選輔助流程建議的做法與專案治理文件衝突。

## Pitfalls

- 不要繞過人類審核點。
- 不要 commit/push，除非使用者明確要求。
- 不要把可選輔助流程當成硬依賴。
- 不要自動建立或清理 archive。
