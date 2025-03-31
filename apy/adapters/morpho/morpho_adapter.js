import AbstractMorphoAdapter from "./abstract_morpho_adapter.js";
import vaultConfig from "./morpho_vault_config.js";
import fetch from "node-fetch";
import https from "https";
import * as log from "../../utils/log.js";

export default class MorphoAdapter extends AbstractMorphoAdapter {
    constructor() {
        super(MorphoAdapter.loadVaultConfig());
        log.info(`Initializing ${this.constructor.name}`); // 日誌：初始化 adapter
    }

    static loadVaultConfig() {
        return vaultConfig;
    }

    async fetchDataImpl(config) {
        const response = await fetch(config.url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                query: this.getGraphQLQuery(),
                variables: this.getGraphQLVaribales(config.selector),
            }),
            agent: new https.Agent({
                rejectUnauthorized: false, // 禁用 SSL 憑證驗證
            }),
        });

        if (!response.ok) {
            log.error(`Error fetching data for ${config.coin}: ${response.statusText}`);
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data.data.vault;

        // Sample response data:
        // {
        //     "data": {
        //         "vault": {
        //             "id": "2e7f5b9d-ff73-4ddc-996e-d9dda8e03184",
        //             "address": "0xbb819D845b573B5D7C538F5b85057160cfb5f313",
        //             "name": "Morpho eUSD",
        //             "asset": {
        //                 "chain": { "id": 8453, "network": "base" },
        //                 "symbol": "eUSD",
        //                 "name": "Electronic Dollar"
        //             },
        //             "dailyApys": {
        //                 "apy": 0.011541425094546197,
        //                 "netApy": 0.0886808779162616
        //             }
        //         }
        //     }
        // }
    }
}
