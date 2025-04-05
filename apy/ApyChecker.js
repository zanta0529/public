import appConfig from "./app-config.js";
import * as log from "./utils/log.js";
import ArraySortUtils from "./utils/ArraySortUtils.js";
import { fileURLToPath } from "url";
import { promises as fs } from "fs";
import path from "path";
import NodeCache from "node-cache";
import fs_sync from "fs";

// 將 import.meta.url 轉換為文件系統路徑
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read server config synchronously
const serverConfigPath = path.join(__dirname, 'server-config.json');
const serverConfig = JSON.parse(fs_sync.readFileSync(serverConfigPath, 'utf8'));

// Global cache configuration
export const DEFAULT_TIMEOUT = 5 * 1000;
export const CACHE_DURATION_SECONDS = serverConfig["cache-ttl-seconds"] || 300; // Default to 5 minutes if not specified
export const CACHE_DURATION = CACHE_DURATION_SECONDS; // For backward compatibility
export const CACHE_CHECK_PERIOD = 120; // Cache check period in seconds
export const DEFAULT_RETRY_COUNT = 3;
export const DEFAULT_RETRY_DELAY = 1000; // in milliseconds

export default class ApyChecker {
    constructor() {
        // Initialize cache with global TTL configuration
        this.cache = new NodeCache({
            stdTTL: CACHE_DURATION_SECONDS,
            checkperiod: CACHE_CHECK_PERIOD
        });
        this.lastRunTime = null;
        this.lastResults = null;

        log.info(`Initialized ApyChecker with cache TTL: ${CACHE_DURATION_SECONDS} seconds`);
    }

    formatOutput(result) {
        if (!result || !result.coin || !result.apy || !result.chain || !result.platform) {
            log.error("Invalid result data");
            return;
        }
        const { coin, apy, chain, platform, vault } = result;
        const msg = vault
            ? `${coin} ==> apy: ${apy} | chain: ${chain} | platform: ${platform} | vault: ${vault}`
            : `${coin} ==> apy: ${apy} | chain: ${chain} | platform: ${platform}`;
        log.info(msg);
    }

    async performCheck(forceRefresh = false) {
        // Return cached results if available and not forcing refresh
        const cacheKey = 'last_apy_results';
        if (!forceRefresh && this.cache.has(cacheKey)) {
            log.info("Returning cached APY results");
            return this.cache.get(cacheKey);
        }

        const startTime = performance.now();
        log.info("★★★ Program started");
        const results = [];

        try {
            log.info("Checking available adapters...");
            const enabledAdapters = appConfig.adapters.filter(({ enabled }) => enabled === 1);
            log.info(`Enabled adapters: ${enabledAdapters.map(({ name }) => name).join(", ")}`);

            // Process adapters in parallel with timeout protection
            const fetchPromises = enabledAdapters.map(async ({ name, adapter }) => {
                const adapterStartTime = performance.now();
                try {
                    const adapterInstance = new adapter();
                    // Add timeout protection to each adapter
                    const timeoutPromise = new Promise((_, reject) =>
                        setTimeout(() => reject(new Error(`Adapter ${name} timed out after ${DEFAULT_TIMEOUT}ms`)),
                            DEFAULT_TIMEOUT)
                    );

                    // Race the adapter fetch against timeout
                    const data = await Promise.race([
                        adapterInstance.fetchData(),
                        timeoutPromise
                    ]);

                    const adapterEndTime = performance.now();
                    log.info(`Adapter ${name} completed in ${((adapterEndTime - adapterStartTime) / 1000).toFixed(2)}s`);
                    return data;
                } catch (adapterError) {
                    log.warn(`Adapter ${name} failed: ${adapterError.message}`);
                    return []; // 返回空陣列以避免 Promise.all 失敗
                }
            });

            // Use Promise.allSettled instead of Promise.all for better error handling
            const fetchedResultsSettled = await Promise.allSettled(fetchPromises);

            // Process results, including those that succeeded
            fetchedResultsSettled.forEach(promise => {
                if (promise.status === 'fulfilled' && Array.isArray(promise.value)) {
                    results.push(...promise.value);
                }
            });

            log.info(`Fetched ${results.length} APY records`);

            // Save results to cache
            const sortedResults = ArraySortUtils.sortByApy(results);
            this.cache.set(cacheKey, sortedResults);
            this.lastRunTime = new Date();
            this.lastResults = sortedResults;

            // Save results to a JSON file for backup
            // await this.saveResultsToFile(sortedResults);

        } catch (error) {
            log.error(`Error in performCheck: ${error.message}`);
            // If we have previous results, return those in case of failure
            if (this.lastResults) {
                log.warn("Returning last successful results due to error");
                return this.lastResults;
            }
        } finally {
            const endTime = performance.now();
            const executionTime = ((endTime - startTime) / 1000).toFixed(2);
            log.info(`★★★ Program finished in ${executionTime} seconds.`);
        }

        return this.lastResults || [];
    }

    async saveResultsToFile(results) {
        try {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const filePath = path.join(__dirname, 'data', `apy_results_${timestamp}.json`);

            // Ensure data directory exists
            await fs.mkdir(path.join(__dirname, 'data'), { recursive: true });

            // Write results to file
            await fs.writeFile(filePath, JSON.stringify(results, null, 2));
            log.info(`Results saved to ${filePath}`);
        } catch (error) {
            log.error(`Failed to save results to file: ${error.message}`);
        }
    }

    getLastRunInfo() {
        const cacheKey = 'last_apy_results';
        const isCached = this.cache.has(cacheKey);
        const expiresAt = this.lastRunTime ? new Date(this.lastRunTime.getTime() + CACHE_DURATION * 1000) : null;

        return {
            lastRun: this.lastRunTime,
            recordCount: this.lastResults ? this.lastResults.length : 0,
            expiresAt: expiresAt,
            isCached: isCached
        };
    }
}

// 檢查是否為主模組
if (__filename === process.argv[1]) {
    const apyChecker = new ApyChecker();
    apyChecker
        .performCheck()
        .then((results) => {
            log.info("檢查結果:");
            if (results.length === 0) {
                log.warn("沒有獲取到任何結果。");
            } else {
                results.forEach((result) => apyChecker.formatOutput(result));
            }
        })
        .catch((error) => {
            log.error("檢查失敗: " + error.message);
        });
}
