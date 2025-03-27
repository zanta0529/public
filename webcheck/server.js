import express from "express";
import fs from "fs/promises";
import https from "https";
import fetch from "node-fetch";
import pLimit from "p-limit";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const getCurrentTimestamp = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0"); // 月份從 0 開始
    const day = String(now.getDate()).padStart(2, "0");
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const seconds = String(now.getSeconds()).padStart(2, "0");
    return `${year}/${month}/${day} ${hours}:${minutes}:${seconds}`;
};

const log = (status, message) => {
    const msg = `[${getCurrentTimestamp()}] [${status}] ${message}`;
    console[status === "ERROR" ? "error" : "log"](msg);
};

const serverConfig = JSON.parse(await fs.readFile(path.resolve(`${__dirname}/server-config.json`), "utf-8"));
const appConfig = JSON.parse(await fs.readFile(path.resolve(`${__dirname}/app-config.json`), "utf-8"));

const app = express();
const port = serverConfig.port || 10000;
const limit = pLimit(serverConfig.maxProcess);
const timeout = serverConfig.timeout || 3000;

app.use(express.static(path.join(__dirname, serverConfig.staticPath)));

app.get("/run-check", async (req, res) => {
    try {
        const startTime = performance.now();
        const direction = req.query.direction;
        const results = await checkWebsites(appConfig, direction);
        const endTime = performance.now();

        const executionTime = ((endTime - startTime) / 1000).toFixed(2);
        log("INFO", `Total execution time: ${executionTime} seconds`);

        res.send(results);
    } catch (error) {
        res.status(500).send(`An error occurred: ${error.message}`);
    }
});

const agent = new https.Agent({ rejectUnauthorized: false });

const performCheck = async (url) => {
    const timestamp = getCurrentTimestamp();
    const isHttps = url.trim().startsWith("https://");
    const controller = new AbortController();

    for (let attempts = 0; attempts <= serverConfig.retry; attempts++) {
        try {
            const startTime = performance.now();
            const validUrl = new URL(url);
            const timeoutId = setTimeout(() => controller.abort(), timeout);
            const response = await fetch(validUrl, {
                agent: isHttps ? agent : undefined,
                signal: controller.signal,
            });
            clearTimeout(timeoutId);

            const executionTime = ((performance.now() - startTime) / 1000).toFixed(2);
            log("INFO", `Checking URL: ${validUrl}... [${executionTime} seconds]`);

            return { url, status: response.status, message: response.statusText, timestamp, executionTime };
        } catch (error) {
            log(
                "ERROR",
                `Attempt ${attempts + 1}: Error during performing website "${url}" checks. Error message: ${
                    error.message
                }, Stack trace: ${error.stack}`
            );
            if (attempts >= serverConfig.retry) {
                return { url, status: "ERROR", message: error.message, timestamp };
            }
            await new Promise((resolve) => setTimeout(resolve, serverConfig.retryInterval));
        }
    }
};

const checkWebsites = async (websites, direction) => {
    if (
        !Array.isArray(websites) ||
        !websites.every((site) => site && typeof site.url === "string" && typeof site.enabled === "number")
    ) {
        throw new Error("Invalid input: websites must be an array of objects with valid properties");
    }

    const results = [];
    const checks = websites
        .filter((site) => site.enabled === 1 && (direction === "E" ? site.direction === "E" : true))
        .map(async (site) => {
            try {
                const result = await limit(() => performCheck(site.url));
                results.push(result);
            } catch (error) {
                log("ERROR", `Error during website check for ${site.url}: ${error.message}`);
                results.push({ url: site.url, status: "ERROR", message: error.message });
            }
        });

    await Promise.allSettled(checks);
    return results;
};

app.get("/:page", (req, res) => {
    const safePage = path.basename(req.params.page);
    const filePath = path.join(__dirname, `${safePage}.html`);
    res.sendFile(filePath, (err) => {
        if (err) {
            res.status(err.status || 500).end();
        }
    });
});

app.listen(port, () => {
    log("INFO", `Server running at http://localhost:${port}/`);
});
