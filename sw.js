const CACHE_NAME = "crypto-tool-cache-v1";
const urlsToCache = [
    // 代表根目錄，會快取 index 或主 HTML 檔案
    // './',
    "./crypto_manager.html", // 明確指定主檔案名稱
    "https://cdn.jsdelivr.net/npm/qrcode@1.5.1/build/qrcode.min.js",
    "https://cdn.jsdelivr.net/npm/@noble/ciphers/esm/chacha.js",
];

// 安裝事件：快取核心檔案
self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log("Opened cache and caching assets for a.html");
            return cache.addAll(urlsToCache);
        })
    );
});

// 啟用事件：清除舊版本的快取
self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log("Clearing old cache:", cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

// 攔截網路請求
self.addEventListener("fetch", (event) => {
    event.respondWith(
        caches.match(event.request).then((response) => {
            // 如果請求的資源在快取中，就從快取回應
            if (response) {
                return response;
            }
            // 否則，正常地從網路請求
            return fetch(event.request);
        })
    );
});
