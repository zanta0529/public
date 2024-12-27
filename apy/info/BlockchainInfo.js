// ./info/BlockchainInfo.js

import log from "../utils/log.js";

export class BlockchainInfo {
    static chains = [
        {
            symbol: "Ethereum",
            explorer: "https://etherscan.io",
            icon: "https://s2.coinmarketcap.com/static/img/coins/64x64/1027.png",
        },
        {
            symbol: "Arbitrum",
            explorer: "https://etherscan.io",
            icon: "https://s2.coinmarketcap.com/static/img/coins/64x64/11841.png",
        },
        {
            symbol: "Base",
            explorer: "https://etherscan.io",
            icon: "https://assets.coingecko.com/asset_platforms/images/131/small/base-network.png",
        },
        {
            symbol: "Polygon",
            explorer: "https://etherscan.io",
            icon: "https://s2.coinmarketcap.com/static/img/coins/64x64/3890.png",
        },
        {
            symbol: "Avalanche",
            explorer: "https://etherscan.io",
            icon: "https://s2.coinmarketcap.com/static/img/coins/64x64/5805.png",
        },
        {
            symbol: "Optimism",
            explorer: "https://etherscan.io",
            icon: "https://s2.coinmarketcap.com/static/img/coins/64x64/11840.png",
        },
        {
            symbol: "BSC",
            explorer: "https://etherscan.io",
            icon: "https://s2.coinmarketcap.com/static/img/coins/64x64/1839.png",
        },
    ];

    // 獲取所有區塊鏈的符號列表
    static getChainList() {
        return this.chains.map((chain) => chain.symbol);
    }

    // 根據符號獲取區塊鏈的瀏覽地址
    static getChainExplorer(symbol) {
        const chain = this.chains.find((chain) => chain.symbol === symbol);
        return chain ? chain.explorer : null; // 如果找到，返回瀏覽器地址，否則返回 null
    }

    // 根據符號獲取區塊鏈的圖標 URL
    static getChainIconUrl(symbol) {
        const chain = this.chains.find((chain) => chain.symbol === symbol);
        return chain ? chain.icon : null; // 如果找到，返回圖標 URL，否則返回 null
    }
}

export default BlockchainInfo;

log("BlockchainInfo 已加載");
