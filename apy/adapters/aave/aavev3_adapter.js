import puppeteer from "puppeteer";
import AbstractAaveV3Adapter from "./abstract_aavev3_adapter.js";
import vaultConfig from "./aavev3_vault_config.js";
import log from "../../utils/log.js";

const DEFAULT_TIMEOUT = 10 * 1000;

export default class AaveV3Adapter extends AbstractAaveV3Adapter {
    constructor() {
        super(AaveV3Adapter.loadVaultConfig());
        this.initialize();
        log(`Initializing ${this.constructor.name}`); // 日誌：初始化 adapter
    }

    async initialize() {
        await this.init(); // 初始化瀏覽器
    }

    static loadVaultConfig() {
        return vaultConfig;
    }

    async init() {
        try {
            this.browser = await puppeteer.launch({ headless: true, timeout: DEFAULT_TIMEOUT });
        } catch (launchError) {
            log(`Failed to launch browser: ${launchError.message}`);
            throw launchError;
        }
    }

    async fetchConfigData(config) {
        const urlWithTimestamp = `${config.url}&_=${Date.now()}`; // 加上 timestamp 防止快取
        const maxRetries = 3; // 最大重試次數

        let attempt = 0;
        while (attempt < maxRetries) {
            try {
                const page = await this.browser.newPage();
                await page.goto(urlWithTimestamp, { waitUntil: "networkidle0", timeout: 10000 }); // 增加超時時間
                log("fetching...")
                const apy = await page.$eval(config.selector, (el) => el.textContent.trim());
                if (apy) {
                    log(`\t* [${config.platform}] Fetched APY for ${config.coin}: ${apy} (${config.chain})`);
                    const waitTime = this.getRandomWaitTime(10, 50); // 隨機等待毫秒數
                    await new Promise((resolve) => setTimeout(resolve, waitTime));
                    await page.close();
                    return {
                        platform: config.platform,
                        chain: config.chain,
                        coin: config.coin,
                        apy: apy,
                        source: config.url,
                        favorite: config.favorite || 0,
                    };
                }
            } catch (error) {
                log(`Error fetching data for ${config.coin}: ${error.message}`);
            }
            attempt++;
        }
        return null; // 返回 null 以便過濾
    }

    getRandomWaitTime(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
}