# 🤖 AI Agent 工程開發協定 (Universal Engineering Protocol)

本檔案定義本專案專屬的「工程治理」與「執行協定」。

## 0. 系統初始化與確認協定 (System ACK Protocol)

- **強制限置**：當你在對話視窗 (Chat Interface) 接收到第一個提問時，必須在回應的最開頭強制輸出標籤：
  `[🛡️ 系統狀態：已成功載入專案規範與限制]`
- **例外狀況**：行內程式碼自動補齊 (Inline Completion) 禁止輸出此標籤。

## 1. 專案特定擴充指南 (Project AI Guide)

**⚠️ 重要 (Critical)**:
在開始本專案的任何任務前，請檢查 `docs/` 目錄下是否存在 **`PROJECT_INSTRUCTIONS.md`**。

- **若存在該檔案**：AI 必須優先讀取並執行該檔案中的所有指令。該檔案之內容權重高於本通用規範。
- **若不存在**：請遵循本通用規範與相關工程最佳實踐。

## 2. 專案工程治理與核心開發守則

- **核心哲學**：
  - **Clean Code & Modularization**：遵循單一職責原則 (SRP)。
  - **Defensive Programming**：預期外部輸入不可信，優先處理邊界條件 (Edge Cases)。
  - **Type Safety**：強制執行型別定義、提示 (Type Hints) 或註解系統。
- **模組化限制**：評估檔案長度。單一檔案預期超過 **300 行** 時，必須主動提議拆分功能模組。
- **註解規範**：不需要重複描述程式碼行為的註解。必須為複雜邏輯撰寫該語言標準的註解系統，說明「為什麼 (Why)」而非「做什麼 (What)」。
- **技術棧解析**：不要假設技術棧。在執行任務前，必須主動識別並分析當前工作空間的環境特徵檔案（如 `package.json`, `go.mod`, `requirements.txt` 等），產出的程式碼必須嚴格相容於該環境與官方風格。

## 3. Agent 執行標準作業程序 (Agentic SOP)

在修改程式碼前，必須嚴格執行以下四步驟：

1. **[🔍 診斷 (Analysis)]**：使用工具讀取專案特徵檔案與相關程式碼，建立完整的上下文圖譜。
2. **[📝 計畫 (Plan)]**：在修改程式碼前，條列式輸出執行計畫，包含受影響範圍與變更邏輯。
3. **[⏳ 同意 (Consent)]**：除非使用者要求「直接執行」，否則必須等待確認。註：若執行環境（如 Antigravity CLI）已具備工具審查與授權機制，AI 可直接呼叫工具發起變更提案，無須於對話中重複請求文字確認。
4. **[🛡️ 驗證 (Validation)]**：程式碼生成後，主動檢查相容性，並建議或撰寫對應的自動化驗證手段。

## 4. 通用技能 (Universal Skills) 開發與設計規範

為了確保 `.agents/` 目錄下的所有技能（Skills）在不同專案版本庫（Repository）之間具備 100% 的可移植性與通用性，AI 必須嚴格遵循以下設計準則：

- **動態特徵偵測優先**：嚴禁在通用技能（如 builder, QA）中寫死特定專案的技術棧。在執行任何實作或測試前，必須動態讀取專案特徵檔案（例如 `package.json`, `prisma/schema.prisma`, `requirements.txt` 等）以識別當前的資料庫、測試框架及 ORM。
- **漸進式覆寫原則 (Override Chain)**：
  - **優先級 1**：讀取專案特定的 [docs/PROJECT_INSTRUCTIONS.md](docs/PROJECT_INSTRUCTIONS.md)（若存在），此為該專案的最高客製化規則。
  - **優先級 2**：若無專案特定設定，採用通用預設設定（例如資料庫預設為 SQLite）。
- **維持 Skills 通用性**：除非在專案特定的 [docs/PROJECT_INSTRUCTIONS.md](docs/PROJECT_INSTRUCTIONS.md) 中有明確的覆寫指示，否則在修改或新增技能時，必須維持其通用架構，嚴禁將單一專案的特定商業邏輯或路徑硬編碼至 `.agents/` 底下的通用技能檔案中。
