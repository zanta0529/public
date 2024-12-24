// adapters/ondo/ondo_vault_config.js
const ondoVaultConfig = [
    // --------------------------------------------
    // USDY
    // --------------------------------------------
    {
        enabled: 1,
        platform: "Ondo Finance",
        chain: "Ethereum",
        coin: "USDY",
        url: "https://ondo.finance/usdy",
        selector: "19:{\\\"symbol\\\":\\\"usdy\\\".*?}",
        source: "https://ondo.finance/usdy",
    },
    // --------------------------------------------
    // OUSG
    // --------------------------------------------
    {
        enabled: 1,
        platform: "Ondo Finance",
        chain: "Ethereum",
        coin: "OUSG",
        url: "https://ondo.finance/ousg",
        selector: "25:{\\\"symbol\\\":\\\"ousg\\\".*?}",
        source: "https://ondo.finance/ousg",
    },
];

export default ondoVaultConfig;
