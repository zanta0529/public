export default [
    // --------------------------------------------
    // Ethereum
    // --------------------------------------------
    {
        enabled: 1,
        platform: "Fluid",
        chain: "Ethereum",
        coin: "USDC",
        url: "https://api.fluid.instadapp.io/1/tokens",
        selector: "USDC",
        source: "https://fluid.instadapp.io/stats/1/lendings",
    },
    {
        enabled: 1,
        platform: "Fluid",
        chain: "Ethereum",
        coin: "USDT",
        url: "https://api.fluid.instadapp.io/1/tokens",
        selector: "USDT",
        source: "https://fluid.instadapp.io/stats/1/lendings",
    },
    // --------------------------------------------
    // Arbitrum
    // --------------------------------------------
    {
        enabled: 1,
        platform: "Fluid",
        chain: "Arbitrum",
        coin: "USDC",
        url: "https://api.fluid.instadapp.io/42161/tokens",
        selector: "USDC",
        source: "https://fluid.instadapp.io/stats/42161/lendings",
    },
    {
        enabled: 1,
        platform: "Fluid",
        chain: "Arbitrum",
        coin: "USDT",
        url: "https://api.fluid.instadapp.io/42161/tokens",
        selector: "USDT",
        source: "https://fluid.instadapp.io/stats/42161/lendings",
    },
];
