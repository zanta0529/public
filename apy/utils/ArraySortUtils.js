class ArraySortUtils {
    // 快取已排序的結果
    static cache = {
        apy: new Map(),
        platform: new Map(),
        blockchain: new Map(),
        coin: new Map()
    };

    // 生成快取鍵
    static _generateCacheKey(data) {
        // 使用資料長度和前三筆資料的值來生成快取鍵
        if (!data || data.length === 0) return 'empty';
        return `${data.length}_${JSON.stringify(data.slice(0, 3))}`;
    }

    // 清除快取
    static clearCache() {
        Object.values(this.cache).forEach(cache => cache.clear());
    }

    // 根據 APY 排序 (降序) - 使用優化的數值排序
    static sortByApy(data) {
        if (!data || data.length === 0) return [];

        const cacheKey = this._generateCacheKey(data);
        if (this.cache.apy.has(cacheKey)) {
            return [...this.cache.apy.get(cacheKey)]; // 返回快取的副本
        }

        // 預先解析所有 APY 值，避免在排序過程中重複解析
        const parsedData = data.map(item => ({
            ...item,
            _parsedApy: parseFloat(item.apy)
        }));

        const result = parsedData.sort((a, b) => {
            // 使用預先解析的值進行比較
            return isNaN(a._parsedApy) ? -1 :
                isNaN(b._parsedApy) ? 1 :
                    b._parsedApy - a._parsedApy; // 降序排列
        }).map(item => {
            // 移除臨時的解析值
            const { _parsedApy, ...rest } = item;
            return rest;
        });

        // 儲存結果到快取
        this.cache.apy.set(cacheKey, [...result]);
        return result;
    }

    // 根據 Platform 排序 - 使用本地化比較
    static sortByPlatform(data) {
        if (!data || data.length === 0) return [];

        const cacheKey = this._generateCacheKey(data);
        if (this.cache.platform.has(cacheKey)) {
            return [...this.cache.platform.get(cacheKey)]; // 返回快取的副本
        }

        const result = [...data].sort((a, b) => {
            return (a.platform || '').localeCompare(b.platform || '', undefined, { sensitivity: 'base' });
        });

        // 儲存結果到快取
        this.cache.platform.set(cacheKey, [...result]);
        return result;
    }

    // 根據 Blockchain (chain) 排序 - 使用本地化比較
    static sortByBlockchain(data) {
        if (!data || data.length === 0) return [];

        const cacheKey = this._generateCacheKey(data);
        if (this.cache.blockchain.has(cacheKey)) {
            return [...this.cache.blockchain.get(cacheKey)]; // 返回快取的副本
        }

        const result = [...data].sort((a, b) => {
            return (a.chain || '').localeCompare(b.chain || '', undefined, { sensitivity: 'base' });
        });

        // 儲存結果到快取
        this.cache.blockchain.set(cacheKey, [...result]);
        return result;
    }

    // 根據 Coin 排序 - 使用本地化比較
    static sortByCoin(data) {
        if (!data || data.length === 0) return [];

        const cacheKey = this._generateCacheKey(data);
        if (this.cache.coin.has(cacheKey)) {
            return [...this.cache.coin.get(cacheKey)]; // 返回快取的副本
        }

        const result = [...data].sort((a, b) => {
            return (a.coin || '').localeCompare(b.coin || '', undefined, { sensitivity: 'base' });
        });

        // 儲存結果到快取
        this.cache.coin.set(cacheKey, [...result]);
        return result;
    }

    // 根據多個欄位排序
    static sortByMultipleFields(data, fields) {
        if (!data || data.length === 0 || !fields || fields.length === 0) return data;

        return [...data].sort((a, b) => {
            for (const field of fields) {
                const { name, direction = 'asc' } = field;
                let comparison;

                if (name === 'apy') {
                    const aValue = parseFloat(a[name]);
                    const bValue = parseFloat(b[name]);
                    comparison = isNaN(aValue) ? -1 : isNaN(bValue) ? 1 : aValue - bValue;
                } else {
                    comparison = (a[name] || '').localeCompare(b[name] || '', undefined, { sensitivity: 'base' });
                }

                if (comparison !== 0) {
                    return direction === 'desc' ? -comparison : comparison;
                }
            }
            return 0;
        });
    }

    // 根據 Coin 過濾資料 - 使用 Set 優化查詢效率
    static filterByCoin(data, coin) {
        if (!data || !coin) return data;
        return data.filter((item) => item.coin === coin);
    }

    // 根據多個條件過濾資料
    static filterByMultipleConditions(data, conditions) {
        if (!data || !conditions) return data;

        return data.filter(item => {
            for (const [field, value] of Object.entries(conditions)) {
                if (Array.isArray(value)) {
                    // 如果值是陣列，檢查項目的欄位值是否在陣列中
                    if (!value.includes(item[field])) return false;
                } else {
                    // 否則直接比較值
                    if (item[field] !== value) return false;
                }
            }
            return true;
        });
    }
}

export default ArraySortUtils;
