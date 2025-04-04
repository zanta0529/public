import AbstractOndoAdapter from "./abstract_ondo_adapter.js";
import axios from "axios";
import https from "https"; // 引入 https 模組
import vaultConfig from "./ondo_vault_config.js";
import { CACHE_DURATION_SECONDS } from "../../ApyChecker.js";

export default class OndoAdapter extends AbstractOndoAdapter {
    constructor() {
        super(OndoAdapter.loadVaultConfig());

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

    async fetchData() {
        return await super.fetchData(this.fetchDataImpl.bind(this));
    }

    async fetchDataImpl(config) {
        const cacheKey = `ondo_${config.url}`;

        return this.fetchWithRetry(
            async () => {
                // const startTime = performance.now();
                const response = await this.axiosInstance.get(config.url);
                // const endTime = performance.now();
                // log.info(`Fetched data from ${url} in ${((endTime - startTime) / 1000).toFixed(2)}s`);

                return response.data;
            },
            cacheKey,
            {
                retries: 2,
                delay: 2000,
                cacheTTL: CACHE_DURATION_SECONDS * 1000 // Use global cache TTL configuration
            }
        );
    }
}
