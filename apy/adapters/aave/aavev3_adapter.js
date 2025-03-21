import AbstractAaveV3Adapter from "./abstract_aavev3_adapter.js";
import vaultConfig from "./aavev3_vault_config.js";
import log from "../../utils/log.js";

export default class AaveV3Adapter extends AbstractAaveV3Adapter {
    constructor(browser) {
        super(AaveV3Adapter.loadVaultConfig());
        this.browser = browser; // 儲存 browser 物件
        log(`Initializing ${this.constructor.name}`); // 日誌：初始化 adapter
    }

    static loadVaultConfig() {
        return vaultConfig;
    }

    async fetchConfigData(config) {
        const urlWithTimestamp = `${config.url}&_=${Date.now()}`; // 加上 timestamp 防止快取
        const maxRetries = 3; // 最大重試次數

        let attempt = 0;
        while (attempt < maxRetries) {
            try {
                const page = await this.browser.newPage();
                await page.goto(urlWithTimestamp, { waitUntil: "networkidle0", timeout: 30000 }); // 增加超時時間

                const apyText = await page.$eval(config.selector, (el) => el.textContent.trim());

                if (apyText) {
                    log(`\t* Fetched APY for ${config.coin}: ${apyText} (${config.chain}) from ${config.url}`);
                    const waitTime = this.getRandomWaitTime(10, 50); // 隨機等待毫秒數
                    await new Promise((resolve) => setTimeout(resolve, waitTime));
                    await page.close();
                    return {
                        platform: config.platform,
                        chain: config.chain,
                        coin: config.coin,
                        apy: apyText,
                        source: config.url,
                        favorite: config.favorite || 0,
                    };
                }
            } catch (error) {}
            attempt++;
        }
        return null; // 返回 null 以便過濾
    }

    getRandomWaitTime(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
}
