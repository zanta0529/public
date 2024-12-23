// adapters/aave/abstract_aavev3_adapter.js
import BaseAdapter from "../BaseAdapter.js";
import log from "../../utils/log.js";

class AbstractAaveV3Adapter extends BaseAdapter {
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
}

export default AbstractAaveV3Adapter;
