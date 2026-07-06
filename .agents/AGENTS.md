# Antigravity Agent Router Configuration

本檔案為 Google Antigravity CLI (`agy`) 的專屬客製化進入點，作用等同於根目錄 `AGENTS.md` 在 Hermes / generic coding agent 中的「薄索引 / Router」。本專案採用「單一規則庫 (Single Source of Truth)」架構，所有實質工程規範、開發守則與安全防護條款，皆統一維護在 `docs/` 下的指令檔中；本檔案只保留 Antigravity 工具層必要的路由與終端機安全設定。

## 🤖 載入與路由規則 (Routing Protocol)

當 Antigravity 代理人載入本檔案時，必須立即遵循以下路由協定：

1.  **優先加載實質規則庫**：
    在開始任何任務或分析前，請立即讀取並加載位於本專案工作區相對路徑之 [docs/AI_INSTRUCTIONS.md](../docs/AI_INSTRUCTIONS.md) 檔案。
2.  **遵守優先序 (Single Source of Truth)**：
    - **優先順序 1**：`docs/PROJECT_INSTRUCTIONS.md`（專案特定規範，最高優先。**💡 請先確認此檔案是否存在，若不存在則直接跳過此項**）
    - **優先順序 2**：`docs/AI_INSTRUCTIONS.md`（專案工程治理規範，主體規則庫）
    - **優先順序 3**：本設定檔中的路由指示與全域 Skills 底層防護。
3.  **無條件執行**：
    讀取 [docs/AI_INSTRUCTIONS.md](../docs/AI_INSTRUCTIONS.md) 後，無條件遵守其所定義的「台灣 Senior Full-Stack Architect 人設」、「System ACK 協定（最開頭輸出成功載入標籤）」、「AI Agent 工程開發協定 (Universal Engineering Protocol)」。

---

## 🛡️ 終端機執行安全防護協定 (Terminal Safety Protocol)

為嚴格規範 AI 在 CLI 終端機環境中的操作權限，確保系統狀態變更的安全性與透明度，請遵守以下底層防護：

- **限制執行 Shell (Shell Execution Restriction)**：
  - **非必要不提案執行**：優先使用環境提供的內建檔案工具（如 `read_file`, `write_file`, `replace_file_content` 等）完成日常檔案任務。若必須執行 Shell 指令（如執行測試、建置或安裝套件），應使用 `run_command` 工具發起提案，並於對話中清晰說明原因與潛在風險。
  - **提案審查機制**：所有 Shell 指令的提案執行，皆必須透過本系統 CLI 的工具審查機制（如 Approve/Reject），由使用者把關，嚴禁繞過審查。
  - **平台感知 (Platform Awareness)**：在提供任何終端機指令提案前，必須先判斷當前作業系統（Windows/Linux/Mac）與執行環境以調整正確語法。
- **最小破壞 (Destructive Commands)**：絕對禁止建議或執行不可逆、破壞性或會重置版本紀錄（如強行覆寫 Git 紀錄）的指令。
- **明確授權 (Explicit Consent)**：所有涉及系統狀態變更、套件安裝、環境變數修改的操作，必須清晰說明原因、潛在風險並徵得使用者明確同意後方可引導執行。
