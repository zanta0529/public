import express from "express";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import log from "./utils/log.js";
import ApyChecker from "./ApyChecker.js";
import compression from "compression";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import cors from "cors";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load server configuration
const serverConfig = JSON.parse(await fs.readFile(path.resolve(`${__dirname}/server-config.json`), "utf-8"));
const port = serverConfig.port || 10000;

// Initialize Express app
const app = express();

// Security and optimization middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "*"],
            connectSrc: ["'self'"]
        }
    }
}));
app.use(compression()); // Compress responses
app.use(cors()); // Enable CORS for all routes
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// Rate limiting to prevent abuse
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
    message: "Too many requests from this IP, please try again later."
});

// Apply rate limiting to API endpoints
app.use("/run-check", apiLimiter);

// Static file serving with caching
app.use(express.static(path.join(__dirname, serverConfig.staticPath), {
    maxAge: '1d', // Cache static assets for 1 day
    etag: true,
    lastModified: true
}));

// Initialize APY checker instance once
const apyChecker = new ApyChecker();

// API endpoint to run APY check
app.get("/run-check", async (req, res) => {
    const forceRefresh = req.query.force === 'true';

    try {
        // Get cache status before running check
        const cacheInfo = apyChecker.getLastRunInfo();

        // Log request info
        log.info(`APY check requested. Force refresh: ${forceRefresh}, Last run: ${cacheInfo.lastRun ? cacheInfo.lastRun.toISOString() : 'never'}`);

        // Perform check (will use cache if available and not forcing refresh)
        const results = await apyChecker.performCheck(forceRefresh);

        // Get updated cache info after the check
        const updatedCacheInfo = apyChecker.getLastRunInfo();

        // Set cache headers
        if (!forceRefresh && updatedCacheInfo.isCached) {
            const maxAge = serverConfig['cache-ttl-seconds'];
            res.setHeader('Cache-Control', `public, max-age=${maxAge}`);
            res.setHeader('Expires', new Date(Date.now() + maxAge * 1000).toUTCString());
        } else {
            res.setHeader('Cache-Control', 'no-cache');
        }

        // Send JSON response
        res.json({
            success: true,
            timestamp: new Date().toISOString(),
            cacheInfo: updatedCacheInfo,
            count: results.length,
            data: results
        });
    } catch (error) {
        log.error(`API error: ${error.message}`);
        res.status(500).json({
            success: false,
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// Health check endpoint
app.get("/health", (req, res) => {
    res.json({
        status: "ok",
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
    });
});

// HTML page routes
app.get("/:page", (req, res) => {
    const safePage = path.basename(req.params.page);
    const filePath = path.join(__dirname, `${safePage}.html`);

    res.sendFile(filePath, (err) => {
        if (err) {
            log.error(`File not found: ${filePath}, Error: ${err.message}`);
            res.status(err.status || 404).send(`Page not found: ${safePage}`);
        }
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    log.error(`Unhandled error: ${err.message}`);
    res.status(500).json({
        success: false,
        error: "Internal server error",
        timestamp: new Date().toISOString()
    });
});

// Start server
app.listen(port, () => {
    log.info(`Server running at http://localhost:${port}/`);
    log.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
