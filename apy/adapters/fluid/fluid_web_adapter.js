import AbstractFluidAdapter from "./abstract_fluid_adapter.js";
import log from "../../utils/log.js"; // 引入 log 模組
import vaultConfig from "./fluid_vault_config.js";

export class FluidWebAdapter extends AbstractFluidAdapter {
    constructor() {
        super(FluidWebAdapter.loadVaultConfig());
        log(`Initializing ${this.constructor.name}`); // 日誌：初始化 adapter
    }

    static loadVaultConfig() {
        return vaultConfig;
    }

    async fetchData() {
        const fetchFunction = async (config, timestamp) => {
            // 使用 fetch 發送請求，並設置 cache control headers
            const response = await fetch(config.url + "?_=" + timestamp, {
                headers: {
                    "Cache-Control": "no-cache",
                },
            });
            return await response.json(); // 解析 JSON 數據
        };

        return await super.fetchData(fetchFunction);
    }
}

export default FluidWebAdapter;
