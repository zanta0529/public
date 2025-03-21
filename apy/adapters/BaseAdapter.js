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
