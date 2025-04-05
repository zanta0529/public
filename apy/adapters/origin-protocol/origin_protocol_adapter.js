import AbstractOriginProtocolAdapter from "./abstract_origin_protocol_adapter.js";
import axios from "axios";
import https from "https";
import * as log from "../../utils/log.js";
import vaultConfig from "./origin_protocol_vault_config.js";
import { CACHE_DURATION_SECONDS } from "../../ApyChecker.js";

export default class OriginProtocolAdapter extends AbstractOriginProtocolAdapter {
    constructor() {
        super(OriginProtocolAdapter.loadVaultConfig());

        // Configure axios instance with defaults
        this.axiosInstance = axios.create({
            timeout: 10000, // 10 seconds timeout
            httpsAgent: new https.Agent({
                rejectUnauthorized: false, // 禁用 SSL 憑證驗證
            }),
            headers: {
                Accept: "application/json, text/plain, */*",
                "Accept-Language": "en-US,zh;q=0.7",
                "Cache-Control": "no-cache",
                "Content-Type": "application/json",
                Pragma: "no-cache",
                Referer: "https://analytics.originprotocol.com/",
                "Referrer-Policy": "strict-origin-when-cross-origin",
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
            }
        });
    }

    static loadVaultConfig() {
        return vaultConfig;
    }

    async fetchDataImpl(config) {
        const cacheKey = `origin_protocol_${config.url}_${config.selector}`;

        return this.fetchWithRetry(
            async () => {
                // const startTime = performance.now();
                const graphQLQuery = this.getGraphQLQuery(config.selector);
                const response = await this.axiosInstance.post(config.url, {
                    query: graphQLQuery
                });

                // const endTime = performance.now();
                // log.info(`Fetched data from ${config.url} in ${((endTime - startTime) / 1000).toFixed(2)}s`);

                if (response.status !== 200) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                return super.processResponseData(response.data, config);
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
