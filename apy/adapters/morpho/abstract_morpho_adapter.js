import BaseAdapter from "../BaseAdapter.js";
import log from "../../utils/log.js"; // 引入 log 模組

export default class AbstractMorphoAdapter extends BaseAdapter {
    constructor(vaultConfig) {
        super(vaultConfig);
        this.responseData = null; // 儲存響應數據
    }

    async fetchData(fetchFunction) {
        const startTime = performance.now(); // 開始計時
        const fetchPromises = this.vaultConfig
            .filter((config) => config.enabled === 1) // 過濾啟用的配置
            .map(async (config) => {
                if (this.responseData !== null) {
                    return null;
                }

                try {
                    const responseData = await fetchFunction(config);
                    if (responseData && responseData.dailyApy !== undefined) {
                        const apy = (responseData.dailyApy * 100).toFixed(2); // 轉為百分比並保留兩位小數
                        log(`\t* Fetched APY for ${config.coin}: ${apy}% (${config.chain}), vault: ${config.vault}`);
                        return {
                            platform: config.platform,
                            chain: config.chain,
                            coin: config.coin,
                            apy: `${apy}%`,
                            source: config.source,
                            vault: config.vault,
                            favorite: config.favorite || 0,
                        };
                    } else {
                        log(`\t* No APY found for ${config.coin} (${config.chain})(${config.vault})`);
                    }
                } catch (error) {
                    log(`Error fetching data for ${config.coin}: ${error.message}`);
                }
                return null; // 返回 null 以便過濾
            });

        const results = (await Promise.all(fetchPromises)).filter((result) => result !== null); // 過濾掉 null 值

        const endTime = performance.now(); // 結束計時
        const executionTime = ((endTime - startTime) / 1000).toFixed(2); // 計算執行時間（秒）
        log(`${this.constructor.name} executed in ${executionTime} seconds`); // 記錄執行時間

        return results;
    }
}
