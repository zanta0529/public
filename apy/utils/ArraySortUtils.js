class ArraySortUtils {
    // 根據 APY 排序 (降序)
    static sortByApy(data) {
        return data.sort((a, b) => {
            return parseFloat(b.apy) - parseFloat(a.apy); // 降序排列
        });
    }

    // 根據 Platform 排序
    static sortByPlatform(data) {
        return data.sort((a, b) => {
            if (a.platform < b.platform) return -1;
            if (a.platform > b.platform) return 1;
            return 0;
        });
    }

    // 根據 Blockchain (chain) 排序
    static sortByBlockchain(data) {
        return data.sort((a, b) => {
            if (a.chain < b.chain) return -1;
            if (a.chain > b.chain) return 1;
            return 0;
        });
    }

    // 根據 Coin 排序
    static sortByCoin(data) {
        return data.sort((a, b) => {
            if (a.coin < b.coin) return -1;
            if (a.coin > b.coin) return 1;
            return 0;
        });
    }

    // 根據 Coin 過濾資料
    static filterByCoin(data, coin) {
        return data.filter((item) => item.coin === coin);
    }
}

export default ArraySortUtils;
