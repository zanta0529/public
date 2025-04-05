import AbstractBeefyAdapter from "./abstract_beefy_adapter.js";
import axios from "axios";
import https from "https"; // 引入 https 模組
import * as log from "../../utils/log.js";
import vaultConfig from "./beefy_vault_config.js";

export default class BeefyAdapter extends AbstractBeefyAdapter {
    constructor() {
        super(BeefyAdapter.loadVaultConfig());
        log.info(`Initializing ${this.constructor.name}`); // 日誌：初始化 adapter

        // Configure axios instance with defaults
        this.axiosInstance = axios.create({
            timeout: 10000, // 10 seconds timeout
            httpsAgent: new https.Agent({
                rejectUnauthorized: false, // 禁用 SSL 憑證驗證
            }),
            headers: {
                "Cache-Control": "no-cache", // 禁用快取
                Pragma: "no-cache", // 禁用快取
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
            }
        });
    }

    static loadVaultConfig() {
        return vaultConfig;
    }

    async fetchDataImpl(config, timestamp) {
        const url = config.url + "?_=" + timestamp;
        const cacheKey = `beefy_${config.url}`;

        return this.fetchWithRetry(
            async () => {
                log.info(`Fetching data from ${url}`);
                const startTime = performance.now();

                const response = await this.axiosInstance.get(url);

                const endTime = performance.now();
                log.info(`Fetched data from ${url} in ${((endTime - startTime) / 1000).toFixed(2)}s`);

                return response.data;
            },
            cacheKey,
            {
                retries: 2,
                delay: 2000,
                cacheTTL: 5 * 60 * 1000 // 5 minutes cache
            }
        );
    };
}
