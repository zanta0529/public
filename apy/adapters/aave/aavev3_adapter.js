// adapters/aave/aavev3_adapter.js
import BaseAdapter from "../BaseAdapter.js";
import log from "../../utils/log.js"; // 引入 log 模組

// 靜態方法載入配置
import aaveV3VaultConfig from "./aavev3_vault_config.js";

export class AaveV3Adapter extends BaseAdapter {
    constructor() {
        // 使用靜態方法來載入配置
        super(AaveV3Adapter.loadVaultConfig());
    }

    // 實作靜態方法，返回 aavev3_vault_config
    static loadVaultConfig() {
        return aaveV3VaultConfig;
    }

    async fetchData() {
        const results = [];
        for (const config of this.vaultConfig) {
            if (config.enabled === 0) {
                continue;
            }

            const urlWithTimestamp = `${config.url}&_=${Date.now()}`; // 加上 timestamp 防止快取
            let apyText = "";
            try {
                const response = await fetch(urlWithTimestamp, { method: "GET" });
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const text = await response.text();

                // 使用 DOMParser 解析 HTML
                const parser = new DOMParser();
                const doc = parser.parseFromString(text, "text/html");
                const element = doc.querySelector(config.selector);

                if (element) {
                    apyText = element.textContent.trim();
                    results.push({
                        platform: config.platform,
                        chain: config.chain,
                        coin: config.coin,
                        apy: apyText,
                        source: config.url,
                    });
                    log(`\t* Fetched APY for ${config.coin}: ${apyText} (${config.chain})`);
                } else {
                    log(`\t* No APY found for ${config.coin} (${config.chain})`);
                }
            } catch (error) {
                log(`Error fetching data for ${config.coin}: ${error.message}`);
            }
        }
        return results;
    }
}

export default AaveV3Adapter;

(function () {
    log("AaveV3Adapter 已加載");
})();
