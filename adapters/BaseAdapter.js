export default class BaseAdapter {
    constructor(vaultConfig) {
        if (!Array.isArray(vaultConfig)) {
            throw new Error("vaultConfig must be an array.");
        }
        this.vaultConfig = vaultConfig;
    }

    async fetchData(config) {
        throw new Error("fetchData() should be implemented in subclass.");
    }

    async saveData(data) {
        console.log(`${this.constructor.name} is saving data:`, data);
    }

    // 靜態方法負責載入配置
    static loadVaultConfig() {
        throw new Error("loadVaultConfig() should be implemented in subclass.");
    }
}

// 如果需要在瀏覽器中直接使用，可以將其包裝在一個立即執行的函數中
(function () {
    // 這裡可以添加其他邏輯或初始化代碼
    console.log("BaseAdapter 已加載");
})();
