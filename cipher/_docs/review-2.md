以下是針對文件中 **AAD（Authenticated Additional Data）設計與流程**的審查與分析，並檢視是否符合業界標準做法：

---

## **1. AAD 概念與業界慣例**

* **AAD 的定位**：在 AEAD（Authenticated Encryption with Associated Data）模式下，AAD 是一段不被加密、但其完整性會被驗證的資料，通常用於保護加密元資料（如版本號、演算法名稱、協議標記等），防止密文解密時被竄改。
* **業界標準做法**：

  1. **JWE (JSON Web Encryption)** 與 **TLS AEAD 實作**都會將協議版本、加密參數（如 alg、enc）等元資料納入 AAD。
  2. 常見的 AAD 構造方法是：

     * 將協議頭（Header 或固定格式的 Metadata）以 **緊湊 JSON 或序列化字串**的形式作為 AAD。
     * 避免包含敏感資訊（如金鑰或 salt）。
  3. **AES-GCM**與**ChaCha20-Poly1305** 的標準實作皆允許開發者提供自訂 AAD。

---

## **2. 文件中 AAD 規則的分析**

### **2.3 章節核心特點**

1. **AAD 的構造**

   * 以 **緊湊 JSON**（不含空白）為格式，且 UTF-8 編碼。
   * 只包含非敏感的 KDF 參數（排除 `salt`），並加入 `version` 及 `encryption.name`。
   * Null 或 undefined 參數會被刪除，確保序列化後的字串可重現性。

2. **範例 AAD 結構**

   * 例如 `{"version":2,"keyDerivation":{"name":"Argon2id","iterations":4,"memory":65536,"parallelism":4},"encryptionName":"AES-GCM"}`。
   * 該 AAD 僅保護「協議標識與非敏感參數」，不會外洩鹽值與明文資訊。

3. **用途**

   * 用來保護整個加密格式（`version`、`encryptionName` 與 KDF 參數），確保密文無法被「降級攻擊」（例如竄改成較弱的演算法或不同版本格式）。

---

## **3. 與業界標準的比較**

* **正面觀察**：

  1. **安全設計合理**：

     * 不將 `salt` 納入 AAD 是合理的，因為 `salt` 會隨密文公開，不需要完整性保護。
     * 僅保護版本號與演算法名稱，可防止攻擊者篡改加密元資料，這與 JWE 中保護 `alg` 和 `enc` 標記的概念相符。
  2. **序列化一致性**：

     * 使用 `JSON.stringify(obj)` 並移除 undefined/null 屬性，確保重現性，這點對跨語言相容很關鍵，符合業界 AEAD 實作中「定義一致序列化」的原則。
  3. **格式清晰**：

     * AAD 為 JSON 子集，與最終密文分離，便於調試與驗證。

* **可能偏離標準的部分**：

  1. **未採 JWE 或 COSE**：

     * 若與外部系統整合，可能需要額外轉換，因為目前主流是 JWE（JOSE 標準）或 COSE 格式。
  2. **AAD 嚴格依賴 JSON**：

     * JSON 解析在不同語言環境中可能因序列化細節不同而出錯（例如屬性排序問題），雖然 `JSON.stringify()` 預設維持鍵順序，但沒有明確規範「鍵排序」是否固定，這可能造成跨平台驗證失敗。
  3. **缺少 AAD 完整定義文檔（如 Schema）**：

     * 若未規範 JSON key 的固定順序，第三方實作仍有出錯風險。

---

## **4. 建議調整**

1. **明確規範 AAD Key 順序**：

   * 例如強制 `version → keyDerivation → encryptionName` 順序，避免跨語言 JSON 編碼差異造成 MAC 驗證失敗。
2. **可考慮使用 JWS/JWE 標準結構**：

   * 雖然目前設計合理，但若要與業界系統互通，考慮將 AAD 定義對齊 JWE Protected Header。
3. **提供 AAD 測試向量**：

   * 為不同場景（Argon2id/AES、PBKDF2/ChaCha20）提供官方 JSON → UTF-8 byte 範例，幫助第三方開發者驗證一致性。

---

## **5. 結論**

* **該 AAD 設計符合 AEAD 模式的安全基本原則**，與業界標準（如 JWE 的 Header 受保護機制）理念一致，屬於合理且安全的自訂實作。
* **唯一潛在風險**是 JSON 序列化的跨語言一致性問題，建議補充更嚴謹的序列化規範與測試向量，以確保長期相容性。

---

### **Rethink**

* 是否有遺漏「AAD 不應包含敏感資訊」的安全檢查？→ 文件已明確指出不含 `salt`，合理。
* 是否有必要補充「AEAD Tag 驗證失敗的 fallback」風險？→ 文件已有 `2.4` 回溯相容性說明。
* 是否需要補強 JSON 鍵順序的規範？→ 這是最值得補強的地方，我會建議增加排序規則。

---

要不要我 **幫你列出一份「AAD 兼容測試向量範例集（含 UTF-8 byte hex dump）」**？這樣可以檢驗第三方解密器的 AAD 重建是否完全一致。
