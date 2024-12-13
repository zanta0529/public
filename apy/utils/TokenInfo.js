// ./utils/TokenInfo.js

import log from "./log.js";

export class TokenInfo {
    static tokens = [
        {
            symbol: "USDC",
            contract: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
            icon: "https://etherscan.io/token/images/usdc_ofc_32.svg",
        },
        {
            symbol: "USDT",
            contract: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
            icon: "https://etherscan.io/token/images/tethernew_32.svg",
        },
        {
            symbol: "OUSD",
            contract: "0x2a8e1e676ec238d8a992307b495b45b3feaa5e86",
            icon: "https://etherscan.io/token/images/origindollar_32.png",
        },
        {
            symbol: "OETH",
            contract: "0x856c4efb76c1d1ae02e20ceb03a2a6a08b0b8dc3",
            icon: "https://etherscan.io/token/images/originoeth_32.png",
        },
        {
            symbol: "Super OETH",
            contract: "0xdbfefd2e8460a6ee4955a68582f85708baea60a3",
            icon: "https://basescan.org/token/images/superoeth_base_32.png",
        },
    ];

    // 獲取所有代幣的符號列表
    static getTokenSymbolList() {
        return this.tokens.map((token) => token.symbol);
    }

    // 根據符號獲取代幣的合約地址
    static getTokenContract(symbol) {
        const token = this.tokens.find((token) => token.symbol === symbol);
        return token ? token.contract : null; // 如果找到，返回合約地址，否則返回 null
    }

    // 根據符號獲取代幣的圖標 URL
    static getTokenIconUrl(symbol) {
        const token = this.tokens.find((token) => token.symbol === symbol);
        return token ? token.icon : null; // 如果找到，返回圖標 URL，否則返回 null
    }
}

export default TokenInfo;

(function () {
    log("TokenInfo 已加載");
})();
