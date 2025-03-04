import BaseAdapter from "../BaseAdapter.js";
import log from "../../utils/log.js"; // 引入 log 模組

export default class AbstractOndoAdapter extends BaseAdapter {
    constructor(vaultConfig) {
        super(vaultConfig);
        this.responseData = null; // 儲存響應數據
    }

    async fetchData(fetchFunction) {
        const startTime = performance.now(); // 開始計時
        const timestamp = Date.now();
        const fetchPromises = this.vaultConfig
            .filter((config) => config.enabled === 1) // 過濾啟用的配置
            .map(async (config) => {
                if (this.responseData !== null) {
                    return null;
                }

                try {
                    // 步驟1: 發送請求來抓取網頁或API資料
                    const response = await fetchFunction(config, timestamp);

                    // 步驟2: 提取資產信息，假設 response 是 HTML 內容
                    const assetData = this.extractAssetData(response, config);
                    if (assetData) {
                        // 步驟3: 提取並格式化資產信息
                        const apy = assetData.apy.toFixed(2); // 轉換為百分比並保留兩位小數
                        log(`\t* Fetched APY for ${config.coin}: ${apy}% (${config.chain})`);

                        return {
                            platform: config.platform,
                            chain: config.chain,
                            coin: config.coin,
                            apy: `${apy}%`,
                            source: config.source,
                            vault: assetData.name,
                            favorite: config.favorite || 0,
                        };
                    } else {
                        log(`\t* No asset data found for ${config.coin} (${config.chain})`);
                    }
                } catch (error) {
                    log(`Error fetching data for ${config.coin}: ${error.message}`);
                }
                return null; // 返回 null 以便過濾
            });

        // 等待所有請求完成並過濾掉 null 值
        const results = (await Promise.all(fetchPromises)).filter((result) => result !== null);

        const endTime = performance.now(); // 結束計時
        const executionTime = ((endTime - startTime) / 1000).toFixed(2); // 計算執行時間（秒）
        log(`${this.constructor.name} executed in ${executionTime} seconds`); // 記錄執行時間

        return results;
    }

    // 提取資產信息的函數
    extractAssetData(response, config) {
        // 提取包含資產信息的部分
        const regexString = `${config.selector}`; // 使用配置中的 selector
        const jsonPattern = new RegExp(regexString); // 用這個字符串創建正則表達式對象
        const jsonMatch = response.match(jsonPattern); // 使用正則匹配第一個符合條件的匹配項

        if (!jsonMatch) {
            return null; // 如果沒有匹配的資產資料，返回 null
        }

        // 處理匹配的 JSON 字符串
        try {
            // 清理 JSON 字符串
            let cleanJsonStr = jsonMatch[0]
                .replace(/\\n/g, "") // 去掉所有換行符
                .replace(/\\t/g, "") // 去掉所有制表符
                .replace(/\\r/g, "") // 去掉所有回車符
                .replace(/\\/g, ""); // 去掉所有反斜杠

            // 嘗試解析 JSON
            const assetData = JSON.parse(cleanJsonStr);

            // 如果解析成功，返回格式化的資產資料
            return {
                symbol: assetData.symbol, // 'usdy' 或 'ousg'
                name: assetData.name, // 資產名稱
                apy: parseFloat(assetData.apy), // 年化收益率（轉換為數字）
                priceUsd: parseFloat(assetData.priceUsd), // 價格（轉換為數字）
            };
        } catch (error) {
            log("Error parsing asset data: " + error.message);
            return null; // 若解析失敗，返回 null
        }
    }
}
