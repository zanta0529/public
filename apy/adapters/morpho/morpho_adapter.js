import AbstractMorphoAdapter from "./abstract_morpho_adapter.js";
import vaultConfig from "./morpho_vault_config.js";
import axios from "axios";
import https from "https";
import * as log from "../../utils/log.js";

export default class MorphoAdapter extends AbstractMorphoAdapter {
    constructor() {
        super(MorphoAdapter.loadVaultConfig());
        log.info(`Initializing ${this.constructor.name}`); // 日誌：初始化 adapter

        // Configure axios instance with defaults
        this.axiosInstance = axios.create({
            timeout: 10000, // 10 seconds timeout
            httpsAgent: new https.Agent({
                rejectUnauthorized: false, // 禁用 SSL 憑證驗證
            }),
            headers: {
                "Content-Type": "application/json",
                "Cache-Control": "no-cache",
                Pragma: "no-cache",
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
            }
        });
    }

    static loadVaultConfig() {
        return vaultConfig;
    }

    async fetchDataImpl(config) {
        const cacheKey = `morpho_${config.url}_${config.selector}`;

        return this.fetchWithRetry(
            async () => {
                log.info(`Fetching data from ${config.url} for ${config.coin}`);
                const startTime = performance.now();

                const response = await this.axiosInstance.post(config.url, {
                    query: this.getGraphQLQuery(),
                    variables: this.getGraphQLVaribales(config.selector)
                });

                const endTime = performance.now();
                log.info(`Fetched data from ${config.url} in ${((endTime - startTime) / 1000).toFixed(2)}s`);

                if (response.status !== 200) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                return response.data.data.vault;
            },
            cacheKey,
            {
                retries: 2,
                delay: 2000,
                cacheTTL: 5 * 60 * 1000 // 5 minutes cache
            }
        );
    }
}
