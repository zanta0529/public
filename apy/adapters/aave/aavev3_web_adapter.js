import AbstractAaveV3Adapter from "./abstract_aavev3_adapter.js";
import log from "../../utils/log.js"; // 引入 log 模組
import vaultConfig from "./aavev3_vault_config.js";

export class AaveV3WebAdapter extends AbstractAaveV3Adapter {
    constructor() {
        // 使用靜態方法來載入配置
        super(AaveV3WebAdapter.loadVaultConfig());
        log(`Initializing ${this.constructor.name}`); // 日誌：初始化 adapter
    }

    static loadVaultConfig() {
        return vaultConfig;
    }

    async fetchConfigData(config) {
        const urlWithTimestamp = `${config.url}&_=${Date.now()}`; // 加上 timestamp 防止快取
        try {
            const response = await fetch(urlWithTimestamp, { method: "GET" });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const text = await response.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(text, "text/html");

            const apyText = await this.getAPYText(doc, config.selector);

            if (apyText) {
                log(`\t* Fetched APY for ${config.coin}: ${apyText} (${config.chain})`);
                return {
                    platform: config.platform,
                    chain: config.chain,
                    coin: config.coin,
                    apy: apyText,
                    source: config.url,
                };
            } else {
                log(`\t* No APY found for ${config.coin} (${config.chain}).`);
            }
        } catch (error) {
            log(`Error fetching data for ${config.coin}: ${error.message}`);
        }
        return null; // 如果發生錯誤，返回 null
    }

    async getAPYText(doc, selector) {
        const element = doc.querySelector(selector);
        return element ? element.textContent.trim() : null;
    }
}

export default AaveV3WebAdapter;
