import puppeteer from "puppeteer";
import appConfig from "./app-config.js";
import log from "./utils/log.js";
import ArraySortUtils from "./utils/ArraySortUtils.js";
import { fileURLToPath } from "url";
// import { dirname, join } from "path";

// 將 import.meta.url 轉換為文件系統路徑
const __filename = fileURLToPath(import.meta.url);
// const __dirname = dirname(__filename);

const DEFAULT_TIMEOUT = 5 * 1000;

export default class ApyChecker {
    formatOutput(result) {
        if (!result || !result.coin || !result.apy || !result.chain || !result.platform) {
            log("Invalid result data");
            return;
        }
        const { coin, apy, chain, platform, vault } = result;
        const msg = vault
            ? `${coin} ==> apy: ${apy} | chain: ${chain} | platform: ${platform} | vault: ${vault}`
            : `${coin} ==> apy: ${apy} | chain: ${chain} | platform: ${platform}`;
        log(msg);
    }

    async performCheck() {
        log("\n★★★ Program started.");
        let browser;
        try {
            browser = await puppeteer.launch({ headless: true, timeout: DEFAULT_TIMEOUT });
        } catch (launchError) {
            log(`Failed to launch browser: ${launchError.message}`);
            throw launchError;
        }
        const results = [];

        try {
            log("Checking available adapters...");
            const enabledAdapters = appConfig.adapters.filter(({ enabled }) => enabled === 1);
            log(`Enabled adapters: ${enabledAdapters.map(({ name }) => name).join(", ")}`);

            const fetchPromises = enabledAdapters.map(async ({ name, adapter }) => {
                const adapterInstance = new adapter();
                try {
                    return await adapterInstance.fetchData();
                } catch (adapterError) {
                    log(`Adapter ${name} failed: ${adapterError.message}`);
                    return []; // 返回空陣列以避免 Promise.all 失敗
                }
            });

            const fetchedResults = await Promise.all(fetchPromises);
            if (Array.isArray(fetchedResults)) {
                results.push(...fetchedResults.flat());
            } else {
                log("Fetched results is not an array.");
            }
            log(`Fetched results: ${JSON.stringify(results)}`); // 添加日誌
        } finally {
            try {
                await browser.close(); // 確保關閉瀏覽器
            } catch (closeError) {
                log(`Error closing browser: ${closeError.message}`);
            }
        }

        const finalData = ArraySortUtils.sortByApy(results);
        log("\n★★★ Program finished.");
        return finalData;
    }
}

// 檢查是否為主模組
if (__filename === process.argv[1]) {
    const apyChecker = new ApyChecker();
    apyChecker
        .performCheck()
        .then((results) => {
            log("檢查結果:");
            if (results.length === 0) {
                log("沒有獲取到任何結果。");
            } else {
                results.forEach((result) => apyChecker.formatOutput(result));
            }
        })
        .catch((error) => {
            console.error("發生錯誤:", error.message);
            log("檢查失敗: " + error.message, true);
        });
}
