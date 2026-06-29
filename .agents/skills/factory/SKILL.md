---
name: factory
description: 軟體工場總協調器。當使用者要求「啟動軟體工場」、「啟動軟體工場流水線」、「修改本專案功能」、「開始開發功能」或「修復問題」時優先啟用。負責啟動 3 代理人開發流水線，並自動判斷專案類型與任務複雜度。
version: 1.1.0
---

# Factory Orchestrator

## 啟動後的判斷順序

啟動時依序判斷兩件事，並在開始前顯示判斷結果讓使用者確認：

### 判斷一：專案類型

| 類型            | 條件                                        |
| --------------- | ------------------------------------------- |
| `backend-only`  | 任務只涉及 API、service、資料庫，無 UI 變動 |
| `frontend-only` | 任務只涉及元件、頁面、樣式，不需後端變動    |
| `fullstack`     | 同時需要後端 API 變動與前端 UI 實作         |

### 判斷二：任務複雜度

**Full 模式**（滿足任一）：

- 需新增或修改 API 端點
- 需資料庫 Schema 變動
- 需求描述模糊，驗收標準不明確
- 估計影響超過 3 個檔案
- 專案類型為 `fullstack`（一律走 full）

**Lite 模式**（必須同時滿足）：

- 不新增 API 端點，只修改現有邏輯
- 不變動資料庫 Schema
- 影響範圍限於 1–2 個檔案
- 需求描述清晰，預期行為可直接驗證
- 專案類型為 `backend-only` 或 `frontend-only`

---

## 啟動時的輸出格式

```
🏭 Factory 啟動
任務：[使用者描述]
專案類型：[backend-only / frontend-only / fullstack]
複雜度：[Full / Lite]
判斷依據：[1–2 個觸發條件]

繼續？（回覆「繼續」啟動，或直接修正我的判斷）
```

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
計畫文件只需包含：專案類型、驗收標準、預計異動檔案、測試清單。」

⏸ **人類審核點 1**：等待「核准計畫」。

### Phase 2：實作（核准後自動）

啟用 factory-2-builder skill。

### Phase 3：品質閘道（自動）

啟用 factory-3-qa-gate skill（完整執行，不縮減）。
⏸ **人類審核點 3**：等待確認 qa-report.md。
