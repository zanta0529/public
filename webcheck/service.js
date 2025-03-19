import express from "express";
import fs from "fs/promises";
import https from "https";
import fetch from "node-fetch";
import pLimit from "p-limit";
import path from "path"; // 引入 path 模組
import { fileURLToPath } from "url"; // 引入 fileURLToPath 函數

const app = express();
const port = process.env.PORT || 3000;
const configFilePath = "./check-config.json";
const limit = pLimit(10); // 設定同時請求的最大數量

// 獲取當前模組的路徑
const __filename = fileURLToPath(import.meta.url); // 獲取當前文件的完整路徑
const __dirname = path.dirname(__filename); // 獲取當前文件的目錄

function getCurrentTimestamp() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0"); // 月份從 0 開始
    const day = String(now.getDate()).padStart(2, "0");
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const seconds = String(now.getSeconds()).padStart(2, "0");
    return `${year}/${month}/${day} ${hours}:${minutes}:${seconds}`;
}

const log = (status, message) => {
    const msg = `[${getCurrentTimestamp()}] [${status}] ${message}`;
    console.log(msg);
};

async function loadConfig() {
    try {
        const data = await fs.readFile(configFilePath, "utf-8");
        return JSON.parse(data);
    } catch (error) {
        console.error("Error reading config file:", error);
        return [];
    }
}

// 忽略 SSL 驗證（use with caution）
const agent = new https.Agent({
    rejectUnauthorized: false,
});

async function performCheck(url) {
    const timestamp = getCurrentTimestamp(); // 獲取當前時間戳
    try {
        const response = await fetch(url, { agent });
        return { url, status: response.status, message: response.statusText, timestamp };
    } catch (error) {
        return { url, status: "ERROR", message: error.message, timestamp };
    }
}

async function checkWebsites(websites) {
    const checks = websites
        .filter((site) => site.enabled === 1)
        .map(
            (site) => limit(() => performCheck(site.url)) // 使用 p-limit 來限制並發請求
        );
    return Promise.all(checks);
}

// 檢查網站的路由
app.get("/run-check", async (req, res) => {
    try {
        const websites = await loadConfig();
        const results = await checkWebsites(websites);
        const jsonResult = JSON.stringify(results, null, 2);

        // 將結果寫入檔案
        await fs.writeFile("./check-results.json", jsonResult, { flush: true });
        res.send("Check completed and results saved to check-results.json");
    } catch (error) {
        res.status(500).send(`An error occurred: ${error.message}`);
    }
});

// 動態提供 HTML 文件的路由
app.get("/:page", (req, res) => {
    const page = req.params.page;
    const filePath = path.join(__dirname, `${page}.html`);
    res.sendFile(filePath, (err) => {
        if (err) {
            res.status(err.status).end(); // 如果文件不存在，返回錯誤
        }
    });
});

// 提供 JSON 檔案的路由
app.get("/check-results.json", async (req, res) => {
    try {
        const data = await fs.readFile("./check-results.json", "utf-8");
        res.setHeader("Content-Type", "application/json");
        res.send(data);
    } catch (error) {
        res.status(500).send({ error: "Could not read JSON file" });
    }
});

// 提供靜態文件
app.use(express.static("public"));

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}/`);
});
