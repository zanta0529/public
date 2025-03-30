import AbstractBeefyAdapter from "./abstract_beefy_adapter.js";
import log from "../../utils/log.js";
import vaultConfig from "./beefy_vault_config.js";

export class BeefyWebAdapter extends AbstractBeefyAdapter {
    constructor() {
        // 使用靜態方法來載入配置
        super(BeefyWebAdapter.loadVaultConfig());
        log(`Initializing ${this.constructor.name}`); // 日誌：初始化 adapter
    }

    static loadVaultConfig() {
        return vaultConfig;
    }

    async fetchData() {
        const fetchDataImpl = async (config, timestamp) => {
            // 使用 fetch 發送請求，並設置 cache control headers
            const response = await fetch(config.url + "?_=" + timestamp, {
                headers: {
                    "Cache-Control": "no-cache",
                },
            });

            // 檢查響應是否成功
            if (!response.ok) {
                throw new Error("網路回應異常");
            }

            return await response.json(); // 解析 JSON 數據
        };

        return await super.fetchData(fetchDataImpl);
    }
}

export default BeefyWebAdapter;
