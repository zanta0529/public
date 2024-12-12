// ./adapters/beefy/beefy_vault_config.js
const beefyVaultConfig = [
    {
        enabled: 1,
        platform: "Beefy",
        chain: "Arbitrum",
        coin: "USDC",
        url: "https://api.beefy.finance/apy/breakdown",
        selector: "compound-arbitrum-usdc",
        source: "https://app.beefy.com/vault/compound-arbitrum-usdc",
    },
    {
        enabled: 1,
        platform: "Beefy",
        chain: "Ethereum",
        coin: "USDC",
        url: "https://api.beefy.finance/apy/breakdown",
        selector: "conic-usdc",
        source: "https://app.beefy.com/vault/conic-usdc",
    },
    {
        enabled: 1,
        platform: "Beefy",
        chain: "Arbitrum",
        coin: "USDC",
        url: "https://api.beefy.finance/apy/breakdown",
        selector: "stargate-v2-arb-usdc",
        source: "https://app.beefy.com/vault/stargate-v2-arb-usdc",
    },
    {
        enabled: 1,
        platform: "Beefy",
        chain: "Arbitrum",
        coin: "USDT",
        url: "https://api.beefy.finance/apy/breakdown",
        selector: "stargate-v2-arb-usdt",
        source: "https://app.beefy.com/vault/stargate-v2-arb-usdt",
    },
    {
        enabled: 1,
        platform: "Beefy",
        chain: "Ethereum",
        coin: "USDC",
        url: "https://api.beefy.finance/apy/breakdown",
        selector: "compound-mainnet-usdc",
        source: "https://app.beefy.com/vault/compound-mainnet-usdc",
    },
    {
        enabled: 1,
        platform: "Beefy",
        chain: "Ethereum",
        coin: "USDT",
        url: "https://api.beefy.finance/apy/breakdown",
        selector: "stargate-v2-eth-usdt",
        source: "https://app.beefy.com/vault/stargate-v2-eth-usdt",
    },
];

export default beefyVaultConfig;
