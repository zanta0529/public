import AbstractOndoAdapter from "./abstract_ondo_adapter.js";
import axios from "axios";
import https from "https"; // 引入 https 模組
import log from "../../utils/log.js"; // 引入 log 模組
import vaultConfig from "./ondo_vault_config.js";

export default class OndoAdapter extends AbstractOndoAdapter {
    constructor(browser) {
        super(OndoAdapter.loadVaultConfig());
        this.browser = browser; // 儲存 browser 物件
        log(`Initializing ${this.constructor.name}`); // 日誌：初始化 adapter
    }

    static loadVaultConfig() {
        return vaultConfig;
    }

    async fetchData() {
        const fetchFunction = async (config, timestamp) => {
            // 使用 axios 並禁用 SSL 憑證驗證，且不使用快取
            const response = await axios.get(config.url + "?_=" + timestamp, {
                httpsAgent: new https.Agent({
                    rejectUnauthorized: false, // 禁用 SSL 憑證驗證
                }),
                headers: {
                    "Cache-Control": "no-cache", // 禁用快取
                    Pragma: "no-cache", // 禁用快取
                },
            });
            return response.data;
        };

        return await super.fetchData(fetchFunction);
    }
}
