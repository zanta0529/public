import AbstractMorphoAdapter from "./abstract_morpho_adapter.js";
import vaultConfig from "./morpho_vault_config.js";
import log from "../../utils/log.js";

export default class MorphoAdapter extends AbstractMorphoAdapter {
    constructor(browser) {
        super(MorphoAdapter.loadVaultConfig());
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
                await page.goto(urlWithTimestamp, { waitUntil: "networkidle0", timeout: 10000 }); // 增加超時時間

                const apy = await page.$eval(config.selector, (el) => el.textContent.trim());
                if (apy) {
                    log(
                        `\t* [${config.platform}] Fetched APY for ${config.coin}: ${apy} (${config.chain}) from ${config.vault}`
                    );
                    const waitTime = this.getRandomWaitTime(10, 50); // 隨機等待毫秒數
                    await new Promise((resolve) => setTimeout(resolve, waitTime));
                    await page.close();
                    return {
                        platform: config.platform,
                        chain: config.chain,
                        coin: config.coin,
                        apy: apy,
                        source: config.url,
                        vault: config.vault,
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
