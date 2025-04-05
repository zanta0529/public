import puppeteer from "puppeteer";
import AbstractAaveV3Adapter from "./abstract_aavev3_adapter.js";
import vaultConfig from "./aavev3_vault_config.js";
import * as log from "../../utils/log.js";
import { DEFAULT_TIMEOUT as GLOBAL_DEFAULT_TIMEOUT, CACHE_DURATION_SECONDS } from "../../ApyChecker.js";

const DEFAULT_TIMEOUT = 10 * 1000; // Keep local timeout for puppeteer operations

export default class AaveV3Adapter extends AbstractAaveV3Adapter {
    constructor() {
        super(AaveV3Adapter.loadVaultConfig());

        // Browser configuration will be initialized lazily
        this.browser = null;
        this.browserInitPromise = null;
    }

    static loadVaultConfig() {
        return vaultConfig;
    }

    // Lazy initialization of the browser
    async getBrowser() {
        if (this.browser) {
            return this.browser;
        }

        if (!this.browserInitPromise) {
            this.browserInitPromise = this.initBrowser();
        }

        return this.browserInitPromise;
    }

    async initBrowser() {
        try {
            log.info("Initializing headless browser");
            const startTime = performance.now();

            this.browser = await puppeteer.launch({
                headless: "new", // Use new headless mode for better performance
                timeout: DEFAULT_TIMEOUT,
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-accelerated-2d-canvas',
                    '--disable-gpu',
                    '--window-size=1920x1080',
                ]
            });

            const endTime = performance.now();
            log.info(`Browser initialized in ${((endTime - startTime) / 1000).toFixed(2)}s`);

            return this.browser;
        } catch (launchError) {
            log.error(`Failed to launch browser: ${launchError.message}`);
            throw launchError;
        }
    }

    async fetchConfigData(config) {
        const cacheKey = `aavev3_${config.url}_${config.selector}`;

        return this.fetchWithRetry(
            async () => {
                // const startTime = performance.now();
                const browser = await this.getBrowser();
                const page = await browser.newPage();

                // Set user agent and other browser options
                await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
                await page.setViewport({ width: 1920, height: 1080 });

                // Add URL timestamp to avoid caching
                const urlWithTimestamp = `${config.url}?_=${Date.now()}`;

                // Navigate with better error handling
                await page.goto(urlWithTimestamp, {
                    waitUntil: "networkidle0",
                    timeout: DEFAULT_TIMEOUT
                });

                // Extract APY data
                const apy = await page.$eval(config.selector, (el) => el.textContent.trim());

                // Close the page to free resources
                await page.close();

                // const endTime = performance.now();
                // log.info(`Fetched data for ${config.coin} in ${((endTime - startTime) / 1000).toFixed(2)}s`);

                if (!apy) {
                    throw new Error(`No APY data found for ${config.coin}`);
                }

                return {
                    platform: config.platform,
                    chain: config.chain,
                    coin: config.coin,
                    apy: apy,
                    source: config.url,
                    favorite: config.favorite || 0,
                };
            },
            cacheKey,
            {
                retries: 2,
                delay: 2000,
                cacheTTL: CACHE_DURATION_SECONDS * 1000 // Use global cache TTL configuration
            }
        );
    }

    // Clean up resources when done
    async close() {
        if (this.browser) {
            await this.browser.close();
            this.browser = null;
            this.browserInitPromise = null;
        }
    }
}