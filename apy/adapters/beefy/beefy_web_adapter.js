// adapters/beefy/beefy_web_adapter.js
import BaseAdapter from "../BaseAdapter.js";
import log from "../../utils/log.js"; // 引入 log 模組

// 靜態方法載入配置
import beefyVaultConfig from "./beefy_vault_config.js";

export class BeefyWebAdapter extends BaseAdapter {
    constructor() {
        // 使用靜態方法來載入配置
        super(BeefyWebAdapter.loadVaultConfig());
    }

    // 實作靜態方法，返回 beefy_vault_config
    static loadVaultConfig() {
        return beefyVaultConfig;
    }

    async fetchData() {
        // 創建一個數組來保存所有的請求
        const fetchPromises = this.vaultConfig.map(async (config) => {
            if (config.enabled === 0) {
                return null; // 如果禁用，返回 null
            }

            try {
                // 使用 fetch 發送請求，並設置 cache control headers
                const response = await fetch(config.url, {
                    headers: {
                        "Cache-Control": "no-cache",
                    },
                });

                // 檢查響應是否成功
                if (!response.ok) {
                    throw new Error("網路回應異常");
                }

                // 處理回應資料
                const responseData = await response.json(); // 解析 JSON 數據
                // 確保 responseData 是一個對象
                if (typeof responseData !== "object" || responseData === null) {
                    throw new Error("無效的回應數據");
                }

                // 找出與 selector 匹配的 key
                const apyData = responseData[config.selector];

                if (apyData && apyData.totalApy !== undefined) {
                    // 取出 totalApy 並轉換成百分比格式
                    const apy = (apyData.totalApy * 100).toFixed(2); // 轉為百分比並保留兩位小數
                    log(`\t* Fetched APY for ${config.coin}: ${apy}% (${config.chain}), vault: ${config.selector}`);
                    return {
                        platform: config.platform,
                        chain: config.chain,
                        coin: config.coin,
                        apy: `${apy}%`,
                        source: config.source,
                        vault: config.selector, // Beefy Finance 特有屬性
                    };
                } else {
                    log(`\t* No APY found for ${config.coin} (${config.chain})(${config.selector})`);
                }
            } catch (error) {
                log(`\t* Error fetching data for ${config.coin}: ${error.message}`);
            }
            return null; // 如果發生錯誤，返回 null
        });

        // 等待所有請求完成
        const resultsArray = await Promise.all(fetchPromises);
        // 過濾掉 null 值的結果
        return resultsArray.filter((result) => result !== null);
    }
}

export default BeefyWebAdapter;

log("BeefyWebAdapter 已加載");
