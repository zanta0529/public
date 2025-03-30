import express from "express";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import log from "./utils/log.js";
import ApyChecker from "./ApyChecker.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const serverConfig = JSON.parse(await fs.readFile(path.resolve(`${__dirname}/server-config.json`), "utf-8"));

const app = express();
const port = serverConfig.port || 10000; // 使用 server-config.json 中的設定

app.use(express.static(path.join(__dirname, serverConfig.staticPath)));

app.get("/run-check", async (req, res) => {
    try {
        const apyChecker = new ApyChecker();
        const results = await apyChecker.performCheck();
        res.json(results); // 使用 res.json 來自動設置 Content-Type
    } catch (error) {
        log.error( error.message);
        res.status(500).send(`An error occurred: ${error.message}`);
    }
});

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
    log.info(`Server running at http://localhost:${port}/`);
});
