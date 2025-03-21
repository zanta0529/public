import AbstractOriginProtocolAdapter from "./abstract_origin_protocol_adapter.js";
import fetch from "node-fetch"; // 引入 node-fetch
import https from "https"; // 引入 https 模組
import log from "../../utils/log.js";
import vaultConfig from "./origin_protocol_vault_config.js";

export default class OriginProtocolAdapter extends AbstractOriginProtocolAdapter {
    constructor(browser) {
        super(OriginProtocolAdapter.loadVaultConfig());
        this.browser = browser; // 儲存 browser 物件
        log(`Initializing ${this.constructor.name}`); // 日誌：初始化 adapter
    }

    static loadVaultConfig() {
        return vaultConfig;
    }

    async fetchConfigData(config) {
        const urlWithTimestamp = `${config.url}?_=${Date.now()}`; // 加上 timestamp 防止快取
        try {
            const graphQLQuery = this.getGraphQLQuery(config.selector);
            const response = await fetch(urlWithTimestamp, {
                method: "POST",
                headers: {
                    Accept: "application/json, text/plain, */*",
                    "Accept-Language": "en-US,zh;q=0.7",
                    "Cache-Control": "no-cache",
                    "Content-Type": "application/json",
                    Pragma: "no-cache",
                    Referer: "https://analytics.originprotocol.com/",
                    "Referrer-Policy": "strict-origin-when-cross-origin",
                },
                body: JSON.stringify({
                    query: graphQLQuery,
                }),
                agent: new https.Agent({
                    rejectUnauthorized: false, // 禁用 SSL 憑證驗證
                }),
            });

            if (!response.ok) {
                log(`Fetch error! status: ${response.status} for ${config.coin}`);
                return null;
            }

            const data = await response.json();
            return super.processResponseData(data, config);
        } catch (error) {
            log(`Error fetching data for ${config.coin}: ${error.message}`);
        }
        return null; // 返回 null 以便過濾
    }
}
