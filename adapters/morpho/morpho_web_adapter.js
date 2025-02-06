import AbstractMorphoAdapter from "./abstract_morpho_adapter.js";
import log from "../../utils/log.js";
import vaultConfig from "./morpho_vault_config.js";

export class MorphoWebAdapter extends AbstractMorphoAdapter {
    constructor() {
        // 使用靜態方法來載入配置
        super(MorphoWebAdapter.loadVaultConfig());
        log(`Initializing ${this.constructor.name}`); // 日誌：初始化 adapter
    }

    static loadVaultConfig() {
        return vaultConfig;
    }

    async fetchData() {
        const fetchFunction = async (config) => {
            // 使用 fetch 發送請求，並設置 cache control headers
            const response = await fetch(config.url, {
                headers: {
                    "Cache-Control": "no-cache",
                },
            });

            // 假設你要查找的 address
            const targetAddress = config.selector;

            // FIXME 從回應中提取出 vaults.items 陣列
            const vaults = response.data.data.vaults.items;

            // 使用 find 方法找出符合條件的物件
            const foundVault = vaults.find((vault) => vault.address.toLowerCase() === targetAddress.toLowerCase());
            return foundVault;
        };

        return await super.fetchData(fetchFunction);
    }
}

export default MorphoWebAdapter;
