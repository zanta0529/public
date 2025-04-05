export default class BaseAdapter {
    constructor(vaultConfig) {
        if (!Array.isArray(vaultConfig)) {
            throw new Error("vaultConfig must be an array.");
        }
        this.vaultConfig = vaultConfig;
        this.cache = new Map(); // Memory cache for API responses
        this.retryCount = 3; // Default retry count
        this.retryDelay = 1000; // Default retry delay in ms
    }

    async fetchData(config) {
        throw new Error("fetchData() should be implemented in subclass.");
    }

    async saveData(data) {
        console.log(`${this.constructor.name} is saving data:`, data);
    }

    // 靜態方法負責載入配置
    static loadVaultConfig() {
        throw new Error("loadVaultConfig() should be implemented in subclass.");
    }

    // Helper method to fetch with retry logic
    async fetchWithRetry(fetcher, cacheKey = null, options = {}) {
        const { retries = this.retryCount, delay = this.retryDelay, cacheTTL = 300000 } = options;

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
                console.warn(`Attempt ${attempt + 1}/${retries + 1} failed: ${error.message}`);
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
