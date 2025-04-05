import { CACHE_DURATION_SECONDS, DEFAULT_RETRY_COUNT, DEFAULT_RETRY_DELAY } from "../ApyChecker.js";
import * as log from "../utils/log.js";

export default class BaseAdapter {
    constructor(vaultConfig) {
        if (!Array.isArray(vaultConfig)) {
            throw new Error("vaultConfig must be an array.");
        }
        this.vaultConfig = vaultConfig;
        this.cache = new Map(); // Memory cache for API responses
        this.retryCount = DEFAULT_RETRY_COUNT; // Use global retry count
        this.retryDelay = DEFAULT_RETRY_DELAY; // Use global retry delay in ms

        log.info(`${this.constructor.name} initialized with cache TTL: ${CACHE_DURATION_SECONDS} seconds`);
    }

    async fetchData(config) {
        throw new Error("fetchData() should be implemented in subclass.");
    }

    async saveData(data) {
        log.info(`${this.constructor.name} is saving data:`, data);
    }

    // 靜態方法負責載入配置
    static loadVaultConfig() {
        throw new Error("loadVaultConfig() should be implemented in subclass.");
    }

    // Helper method to fetch with retry logic
    async fetchWithRetry(fetcher, cacheKey = null, options = {}) {
        const {
            retries = this.retryCount,
            delay = this.retryDelay,
            cacheTTL = CACHE_DURATION_SECONDS * 1000 // Convert seconds to milliseconds
        } = options;

        // Check cache first if cacheKey is provided
        if (cacheKey && this.cache.has(cacheKey)) {
            const cachedData = this.cache.get(cacheKey);
            if (Date.now() < cachedData.expiry) {
                return cachedData.data;
            }
            // Cache expired, remove it
            this.cache.delete(cacheKey);
        }

        let lastError;
        for (let attempt = 0; attempt <= retries; attempt++) {
            try {
                // Wait before retrying (not on first attempt)
                if (attempt > 0) {
                    await new Promise(resolve => setTimeout(resolve, delay * attempt));
                }

                const data = await fetcher();

                // Cache the result if cacheKey is provided
                if (cacheKey) {
                    this.cache.set(cacheKey, {
                        data,
                        expiry: Date.now() + cacheTTL
                    });
                }

                return data;
            } catch (error) {
                lastError = error;
                log.warn(`Attempt ${attempt + 1}/${retries + 1} failed: ${error.message}`);
            }
        }

        throw lastError || new Error("All retry attempts failed");
    }

    // Helper to clean expired cache entries
    cleanCache() {
        const now = Date.now();
        for (const [key, value] of this.cache.entries()) {
            if (now > value.expiry) {
                this.cache.delete(key);
            }
        }
    }
}
