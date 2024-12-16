// adapters/origin-protocol/origin_protocol_web_adapter.js
import BaseAdapter from "../BaseAdapter.js"; // 引入基本適配器
import log from "../../utils/log.js"; // 引入 log 模組

// 靜態方法載入配置
import originProtocolVaultConfig from "./origin_protocol_vault_config.js";

// 用來儲存 GraphQL 回應的全域變數
let JSON_RESPONSE = "";

export class OriginProtocolWebAdapter extends BaseAdapter {
    constructor(browser) {
        super(OriginProtocolWebAdapter.loadVaultConfig());
        this.browser = browser; // 儲存 browser 物件
    }

    // 靜態方法，返回 originProtocolVaultConfig
    static loadVaultConfig() {
        return originProtocolVaultConfig;
    }

    async fetchData() {
        log("Fetching data from Origin Protocol...");

        // 創建一個數組來保存所有的請求
        const fetchPromises = this.vaultConfig.map(async (config) => {
            if (config.enabled === 0) {
                return null; // 如果禁用，返回 null
            }

            try {
                const proxyUrl = "https://cors-anywhere.herokuapp.com/";
                const urlWithTimestamp = `${proxyUrl}${config.url}?_=${Date.now()}`; // 加上 timestamp 防止快取

                // 使用 fetch 發送 POST 請求，並設置 HTTP headers 和 body
                const response = await fetch(urlWithTimestamp, {
                    method: "POST",
                    headers: {
                        Accept: "application/json, text/plain, */*",
                        "Accept-Language": "zh-TW,zh;q=0.7",
                        "Cache-Control": "no-cache",
                        "Content-Type": "application/json",
                        Pragma: "no-cache",
                        Referer: "https://analytics.originprotocol.com/",
                        "Referrer-Policy": "strict-origin-when-cross-origin",
                    },
                    body: JSON.stringify({
                        query: ` 
                                query MyQuery {
                                    oTokenDailyStatsConnection(
                                        orderBy: timestamp_DESC,
                                        where: {otoken_eq: "${config.selector}"},
                                        first: 1) {
                                            edges {
                                                node {
                                                    apy
                                                    date
                                                    otoken
                                                }
                                            }
                                    }
                                }
                            `,
                    }),
                });

                // 等待回應並解析為 JSON
                const data = await response.json();

                // 檢查回應的完整資料結構
                if (data.data && data.data.oTokenDailyStatsConnection) {
                    JSON_RESPONSE = data.data.oTokenDailyStatsConnection.edges;
                } else {
                    log("No data found in the response.");
                    return null; // 返回 null 以便後面過濾
                }

                // 確保 JSON_RESPONSE 存在並且是有效的資料
                if (JSON_RESPONSE && JSON_RESPONSE.length > 0) {
                    // 根據 config.selector 查找對應的 APY
                    const apyData = JSON_RESPONSE[0].node; // 假設這裡取的是第一個結果

                    if (apyData && apyData.apy !== undefined) {
                        // 取出 apy 並轉換為百分比格式
                        const apy = (apyData.apy * 100).toFixed(2); // 轉換為百分比並保留兩位小數
                        log(`\t* Fetched APY for ${config.coin}: ${apy}% (${config.chain})`);
                        return {
                            platform: config.platform,
                            chain: config.chain,
                            coin: config.coin,
                            apy: `${apy}%`, // 格式化為百分比
                            source: config.source,
                        };
                    } else {
                        log(`\t* No APY found for ${config.coin} (${config.chain})`);
                    }
                } else {
                    log(`\t* No data available in JSON_RESPONSE for ${config.coin} (${config.chain})`);
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
}

export default OriginProtocolWebAdapter;

(function () {
    log("OriginProtocolWebAdapter 已加載");
})();
