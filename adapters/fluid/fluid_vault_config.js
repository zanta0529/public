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
        favorite: 0,
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
        favorite: 1,
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
    // --------------------------------------------
    // Base
    // --------------------------------------------
    {
        enabled: 1,
        platform: "Fluid",
        chain: "Base",
        coin: "USDC",
        url: "https://api.fluid.instadapp.io/8453/tokens",
        selector: "USDC",
        source: "https://fluid.instadapp.io/stats/8453/lendings",
    },
    // --------------------------------------------
    // Polygon
    // --------------------------------------------
    {
        enabled: 1,
        platform: "Fluid",
        chain: "Polygon",
        coin: "USDC",
        url: "https://api.fluid.instadapp.io/137/tokens",
        selector: "USDC",
        source: "https://fluid.instadapp.io/stats/137/lendings",
    },
];
