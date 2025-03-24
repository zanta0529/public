import express from "express";
import fs from "fs/promises";
import https from "https";
import fetch from "node-fetch";
import pLimit from "p-limit";
import path from "path"; // 引入 path 模組
import { fileURLToPath } from "url"; // 引入 fileURLToPath 函數

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
    if (status === "ERROR") {
        console.error(msg);
    } else {
        console.log(msg);
    }
};

// 讀取配置檔案
const serverConfig = JSON.parse(await fs.readFile(path.resolve(`${__dirname}/server-config.json`), "utf-8"));
const appConfig = JSON.parse(await fs.readFile(path.resolve(`${__dirname}/app-config.json`), "utf-8"));

const app = express();
const port = serverConfig.port || 10000;
const limit = pLimit(serverConfig.maxProcess); // 設定同時請求的最大數量
const timeout = serverConfig.timeout || 3000; // 設定請求超時時間，預設為 3000 毫秒

// 將 'public' 文件夾中的靜態文件對外提供服務
app.use(express.static(path.join(__dirname, serverConfig.staticPath)));

// START --------------------------------------------------------------------
// 檢查網站的路由
app.get("/run-check", async (req, res) => {
    try {
        const direction = req.query.direction; // 獲取請求中的 direction 參數
        const results = await checkWebsites(appConfig, direction);
        const jsonResult = JSON.stringify(results, null, 2);

        // log("INFO", `Check results: ${jsonResult}`); // 在控制台中顯示檢查結果
        res.send(jsonResult);
    } catch (error) {
        res.status(500).send(`An error occurred: ${error.message}`);
    }
});

// 忽略 SSL 驗證（use with caution）
const agent = new https.Agent({
    rejectUnauthorized: false,
});

async function performCheck(url) {
    const timestamp = getCurrentTimestamp(); // 獲取當前時間戳
    const isHttps = url.trim().startsWith("https://"); // 檢查 URL 是否為 HTTPS 協議

    let attempts = 0; // 計數重試次數
    while (attempts <= serverConfig.retry) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout); // 使用配置的超時時間

        try {
            const validUrl = new URL(url); // Validate URL
            log("INFO", `Checking URL: ${validUrl}`); // 記錄請求的 URL

            const response = await fetch(validUrl, {
                agent: isHttps ? agent : undefined, // 根據協議選擇是否使用 HTTPS 代理
                signal: controller.signal,
            });

            clearTimeout(timeoutId); // 請求成功後清理超時
            return { url, status: response.status, message: response.statusText, timestamp };
        } catch (error) {
            clearTimeout(timeoutId); // 確保在捕獲錯誤時也清理超時
            attempts++;
            log(
                "ERROR",
                `Attempt ${attempts}: Error during performing website "${url}" checks. Error message: ${error.message}`
            );
            if (attempts > serverConfig.retry) {
                return { url, status: "ERROR", message: error.message, timestamp };
            }
            await new Promise((resolve) => setTimeout(resolve, serverConfig.retryInterval)); // 等待重試間隔
        }
    }
}

// 根據 direction 參數過濾網站
async function checkWebsites(websites, direction) {
    if (
        !Array.isArray(websites) ||
        !websites.every((site) => site && typeof site.url === "string" && typeof site.enabled === "number")
    ) {
        throw new Error("Invalid input: websites must be an array of objects with valid properties");
    }

    const checks = websites
        .filter((site) => site.enabled === 1 && (direction === "E" ? site.direction === "E" : true)) // 根據 direction 過濾
        .map(
            (site) => limit(() => performCheck(site.url)) // 使用 p-limit 來限制並發請求
        );

    try {
        return await Promise.all(checks);
    } catch (error) {
        log("ERROR", `Error during website checks: ${error.message}`);
        return [];
    }
}
// END --------------------------------------------------------------------

// 動態提供 HTML 文件的路由
app.get("/:page", (req, res) => {
    const page = req.params.page;
    const safePage = path.basename(page); // Sanitize the page parameter
    const filePath = path.join(__dirname, `${safePage}.html`);
    res.sendFile(filePath, (err) => {
        if (err) {
            res.status(err.status || 500).end(); // 如果文件不存在，返回錯誤
        }
    });
});

app.listen(port, () => {
    log("INFO", `Server running at http://localhost:${port}/`);
});
