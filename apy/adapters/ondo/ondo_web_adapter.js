// adapters/ondo/ondo_web_adapter.js
import AbstractOndoAdapter from "./abstract_ondo_adapter.js";
import log from "../../utils/log.js"; // 引入 log 模組
import ondoVaultConfig from "./ondo_vault_config.js";

export class OndoWebAdapter extends AbstractOndoAdapter {
    constructor() {
        super(OndoWebAdapter.loadVaultConfig());
        log(`Initializing ${this.constructor.name}`);
    }

    static loadVaultConfig() {
        return ondoVaultConfig;
    }

    async fetchData() {
        const fetchFunction = async (config, timestamp) => {
            try {
                // 使用 fetch 發送請求
                const response = await fetch(config.url + "?_=" + timestamp, {
                    method: "GET",
                    headers: {
                        "Cache-Control": "no-cache", // 禁用快取
                        Pragma: "no-cache", // 禁用快取
                    },
                });

                // 檢查響應是否成功
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                // 解析 JSON 數據
                const data = await response.json();
                return data;
            } catch (error) {
                console.error("Error fetching data:", error); // 在瀏覽器中使用 console.error
                throw error;
            }
        };

        return await super.fetchData(fetchFunction);
    }
}

export default OndoWebAdapter;
