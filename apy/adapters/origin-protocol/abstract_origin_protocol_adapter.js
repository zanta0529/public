// adapters/origin/abstract_origin_protocol_adapter.js
import BaseAdapter from "../BaseAdapter.js";
import log from "../../utils/log.js";

class AbstractOriginProtocolAdapter extends BaseAdapter {
    constructor(vaultConfig) {
        super(vaultConfig);
        this.responseData = null; // 儲存響應數據
    }

    async fetchData() {
        const startTime = performance.now(); // 開始計時
        const fetchPromises = this.vaultConfig
            .filter((config) => config.enabled === 1) // 過濾啟用的配置
            .map(async (config) => {
                return this.fetchConfigData(config);
            });

        const results = (await Promise.all(fetchPromises)).filter((result) => result !== null); // 過濾掉 null 值

        const endTime = performance.now(); // 結束計時
        const executionTime = ((endTime - startTime) / 1000).toFixed(2); // 計算執行時間（秒）
        log(`${this.constructor.name} executed in ${executionTime} seconds`); // 記錄執行時間

        return results;
    }

    async fetchConfigData(config) {
        throw new Error("fetchConfigData must be implemented in subclasses");
    }

    processResponseData(data, config) {
        if (data.data && data.data.oTokenDailyStatsConnection) {
            const edges = data.data.oTokenDailyStatsConnection.edges;

            if (edges && edges.length > 0) {
                const apyData = edges[0].node; // 取第一個結果

                if (apyData && apyData.apy !== undefined) {
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
                log(`\t* No data available in response for ${config.coin} (${config.chain})`);
            }
        } else {
            log("No data found in the response.");
        }
        return null; // 返回 null 以便過濾
    }
}

export default AbstractOriginProtocolAdapter;
