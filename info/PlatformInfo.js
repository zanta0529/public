import log from "../utils/log.js";

export class PlatformInfo {
    static platforms = [
        {
            id: "Aave",
            website: "https://app.aave.com/markets/",
            icon: "https://cryptologos.cc/logos/aave-aave-logo.svg",
        },
        {
            id: "Beefy Finance",
            website: "https://app.beefy.com/",
            icon: "https://app.beefy.com/favicon.ico",
        },
        {
            id: "Fluid",
            website: "https://fluid.instadapp.io/",
            icon: "https://fluid.instadapp.io/icons/favicon-32x32.png",
        },
        {
            id: "Origin Protocol",
            website: "0x856c4efb76c1d1ae02e20ceb03a2a6a08b0b8dc3",
            icon: "https://www.originprotocol.com/favicon.ico",
        },
        {
            id: "Morpho",
            website: "https://app.morpho.org/",
            icon: "https://pbs.twimg.com/profile_images/1712024635590455296/ksuEkiF7_400x400.jpg",
        },
        {
            id: "Euler",
            website: "https://www.euler.finance/",
            icon: "https://www.euler.finance/favicon.ico",
        },
        {
            id: "Ondo Finance",
            website: "https://ondo.finance/",
            icon: "https://ondo.finance/icon.svg",
        },
    ];

    // 獲取所有支援平台列表
    static getPlatformList() {
        return this.platforms.map((patform) => patform.id);
    }

    // 根據 id 獲取平台圖示 URL
    static getPlatformIconUrl(id) {
        const iconUrl = this.platforms.find((platform) => platform.id === id);
        return iconUrl ? iconUrl.icon : null; // 如果找到，返回圖標 URL，否則返回 null
    }
}

export default PlatformInfo;

log("PlatformInfo 已加載");
