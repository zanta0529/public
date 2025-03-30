import BaseAdapter from "../BaseAdapter.js";
import * as log from "../../utils/log.js";

export default class AbstractFluidAdapter extends BaseAdapter {
    constructor(vaultConfig) {
        super(vaultConfig);
        this.responseData = null; // 儲存響應數據
    }

    async fetchData() {
        const startTime = performance.now(); // 開始計時
        const timestamp = Date.now();
        const fetchPromises = this.vaultConfig
            .filter((config) => config.enabled === 1) // 過濾啟用的配置
            .map(async (config) => {
                if (this.responseData !== null) {
                    return null;
                }

                try {
                    const response = await this.fetchDataImpl(config, timestamp);
                    const assetsData = response.data.find((asset) => asset.asset.symbol === `${config.selector}`);
                    if (assetsData) {
                        const apy = (assetsData.totalRate / 100).toFixed(2);
                        log.info(`\t* [${config.platform}] Fetched APY for ${config.coin}: ${apy}% (${config.chain}), vault: ${config.selector}`);
                        return {
                            platform: config.platform,
                            chain: config.chain,
                            coin: config.coin,
                            apy: `${apy}%`,
                            source: config.source,
                            favorite: config.favorite || 0,
                        };
                    } else {
                        log.warn(`\t* No APY found for ${config.coin} (${config.chain})(${config.selector})`);
                    }
                } catch (error) {
                    log.error(`Error fetching data for ${config.coin}: ${error.message}`);
                }
                return null; // 返回 null 以便過濾
            });

        const results = (await Promise.all(fetchPromises)).filter((result) => result !== null); // 過濾掉 null 值

        const endTime = performance.now(); // 結束計時
        const executionTime = ((endTime - startTime) / 1000).toFixed(2); // 計算執行時間（秒）
        log.info(`${this.constructor.name} executed in ${executionTime} seconds`); // 記錄執行時間

        return results;
    }
}