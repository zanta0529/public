import AbstractFluidAdapter from "./abstract_fluid_adapter.js";
import axios from "axios";
import https from "https"; // 引入 https 模組
import * as log from "../../utils/log.js";
import vaultConfig from "./fluid_vault_config.js";

export default class FluidAdapter extends AbstractFluidAdapter {
    constructor() {
        super(FluidAdapter.loadVaultConfig());
        log.info(`Initializing ${this.constructor.name}`); // 日誌：初始化 adapter
    }

    static loadVaultConfig() {
        return vaultConfig;
    }

    async fetchDataImpl(config, timestamp) {
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
}