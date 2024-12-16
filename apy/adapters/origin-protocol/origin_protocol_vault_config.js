// ./adapters/origin/ousd_vault_config.js
const originProtocolVaultConfig = [
    {
        enabled: 1,
        platform: "Origin Protocol",
        chain: "Ethereum",
        coin: "OUSD",
        url: "https://origin.squids.live/origin-squid:prod/api/graphql",
        selector: "0x2a8e1e676ec238d8a992307b495b45b3feaa5e86",
        source: "https://analytics.originprotocol.com/ousd/poy/",
    },
    {
        enabled: 1,
        platform: "Origin Protocol",
        chain: "Ethereum",
        coin: "OETH",
        url: "https://origin.squids.live/origin-squid:prod/api/graphql",
        selector: "0x856c4efb76c1d1ae02e20ceb03a2a6a08b0b8dc3",
        source: "https://analytics.originprotocol.com/oeth/poy/",
    },
    {
        enabled: 1,
        platform: "Origin Protocol",
        chain: "Base",
        coin: "Super OETH",
        url: "https://origin.squids.live/origin-squid:prod/api/graphql",
        selector: "0xdbfefd2e8460a6ee4955a68582f85708baea60a3",
        source: "https://analytics.originprotocol.com/super/poy/",
    },
];

export default originProtocolVaultConfig;
