import BaseAdapter from "../BaseAdapter.js";
import log from "../../utils/log.js"; // 引入 log 模組

// 靜態方法載入配置
import beefyVaultConfig from "./beefy_vault_config.js";

let JSON_RESPONSE = "";

export class BeefyAdapter extends BaseAdapter {
    constructor() {
        // 使用靜態方法來載入配置
        super(BeefyAdapter.loadVaultConfig());
    }

    // 實作靜態方法，返回 beefy_vault_config
    static loadVaultConfig() {
        return beefyVaultConfig;
    }

    async fetchData() {
        const results = [];
        for (const config of this.vaultConfig) {
            if (config.enabled === 0) {
                // 跳過禁用的配置
                continue;
            }

            try {
                if (!JSON_RESPONSE) {
                    const urlWithTimestamp = `${config.url}?_=${Date.now()}`; // 加上 timestamp 防止快取

                    // 使用 fetch 發送請求
                    const response = await fetch(urlWithTimestamp);

                    // 檢查響應是否成功
                    if (!response.ok) {
                        throw new Error("網絡響應不是 OK");
                    }

                    // 處理回應資料
                    JSON_RESPONSE = await response.json(); // 解析 JSON 數據
                }

                // 找出與 selector 匹配的 key
                const apyData = JSON_RESPONSE[config.selector];

                if (apyData && apyData.totalApy !== undefined) {
                    // 取出 totalApy 並轉換成百分比格式
                    const apy = (apyData.totalApy * 100).toFixed(2); // 轉為百分比並保留兩位小數
                    results.push({
                        platform: config.platform,
                        chain: config.chain,
                        coin: config.coin,
                        apy: `${apy}%`,
                        source: config.source,
                        vault: config.selector, // Beefy Finance 特有屬性
                    });
                    log(`\t* Fetched APY for ${config.coin}: ${apy}% (${config.chain}), vault: ${config.selector}`);
                } else {
                    log(`\t* No APY found for ${config.coin} (${config.chain})(${config.selector})`);
                }
            } catch (error) {
                log(`Error fetching data for ${config.coin}: ${error.message}`);
            }
        }
        return results;
    }
}

export default BeefyAdapter;

(function () {
    log("BeefyAdapter 已加載");
})();
