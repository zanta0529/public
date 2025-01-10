// adapters/origin-protocol/origin_protocol_web_adapter.js
import AbstractOriginProtocolAdapter from "./abstract_origin_protocol_adapter.js";
import log from "../../utils/log.js";
import originProtocolVaultConfig from "./origin_protocol_vault_config.js";

export class OriginProtocolWebAdapter extends AbstractOriginProtocolAdapter {
    constructor() {
        super(OriginProtocolWebAdapter.loadVaultConfig());
        log(`Initializing ${this.constructor.name}`); // 日誌：初始化 adapter
    }

    static loadVaultConfig() {
        return originProtocolVaultConfig;
    }

    async fetchConfigData(config) {
        const proxyUrl = "https://cors-anywhere.herokuapp.com/";
        const urlWithProxy = `${proxyUrl}${config.url}`; // 使用原始 URL

        try {
            const graphQLQuery = this.getGraphQLQuery(config.selector);
            const response = await fetch(urlWithProxy, {
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
            });

            if (!response.ok) {
                log(`HTTP error! status: ${response.status} for ${config.coin}`);
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
export default OriginProtocolWebAdapter;
