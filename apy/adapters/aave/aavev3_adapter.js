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
        const waitingTime = 3 * 1000; // 3 秒鐘

        // 創建一個數組來保存所有的請求
        const fetchPromises = this.vaultConfig.map(async (config) => {
            if (config.enabled === 0) {
                return null; // 如果禁用，返回 null
            }

            const urlWithTimestamp = `${config.url}&_=${Date.now()}`; // 加上 timestamp 防止快取
            try {
                const response = await fetch(urlWithTimestamp, { method: "GET" });
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const text = await response.text();
                const parser = new DOMParser();
                const doc = parser.parseFromString(text, "text/html");

                const apyText = await this.getAPYText(doc, config.selector, waitingTime);

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
                    log(
                        `\t* No APY found for ${config.coin} (${config.chain}) after waiting for ${
                            waitingTime / 1000
                        } second(s).`
                    );
                }
            } catch (error) {
                log(`Error fetching data for ${config.coin}: ${error.message}`);
            }
            return null; // 如果發生錯誤，返回 null
        });

        // 等待所有請求完成
        const resultsArray = await Promise.all(fetchPromises);
        // 過濾掉 null 值的結果
        return resultsArray.filter((result) => result !== null);
    }

    // 新增一個方法來獲取 APY 文本
    async getAPYText(doc, selector, waitingTime) {
        return new Promise((resolve) => {
            const observer = new MutationObserver(() => {
                const element = doc.querySelector(selector);
                if (element) {
                    resolve(element.textContent.trim());
                    observer.disconnect(); // 停止觀察
                }
            });

            // 開始觀察 doc.body 的變化
            observer.observe(doc.body, { childList: true, subtree: true });

            // 設定超時
            setTimeout(() => {
                resolve(null); // 如果超時，返回 null
                observer.disconnect(); // 停止觀察
            }, waitingTime);
        });
    }
}

export default AaveV3Adapter;

(function () {
    log("AaveV3Adapter 已加載");
})();
