// sw.js

// 1. 定義快取名稱和版本
const CACHE_NAME = "travel-helper-cache-v1";

// 2. 需要被快取的檔案清單
const urlsToCache = [
    "./", // 代表根目錄，也就是 index.html
    "./index.html",
    "./style.css",
    "./script.js",
    "./locatons.js", // 注意：您的 HTML 中可能是 locations.js，請確保檔名一致
    "./manifest.json",
    "./icon-192.png",
    "./icon-512.png",
    // -- 外部資源 (CDN) --
    "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css",
    "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js",
];

// 3. Service Worker 安裝事件
self.addEventListener("install", (event) => {
    // 等待 cache 完成
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log("Opened cache");
            // 將所有在 urlsToCache 中的資源加入快取
            return cache.addAll(urlsToCache);
        })
    );
});

// 4. Service Worker 啟用事件 (用來清理舊快取)
self.addEventListener("activate", (event) => {
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    // 如果快取名稱不在白名單中，就刪除它
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

// 5. 攔截網路請求事件 (核心離線功能)
self.addEventListener("fetch", (event) => {
    event.respondWith(
        // 嘗試從快取中尋找請求的資源
        caches.match(event.request).then((response) => {
            // 如果快取中有對應的回應，就直接回傳 (快取優先)
            if (response) {
                return response;
            }

            // 如果快取中沒有，則透過網路請求
            return fetch(event.request).then((response) => {
                // 如果請求失敗，或回應不是成功的 (status 200)
                if (
                    !response ||
                    response.status !== 200 ||
                    (response.type !== "basic" && !response.url.startsWith("https://unpkg.com"))
                ) {
                    return response;
                }

                // 複製一份回應，因為 response 是 stream，只能被使用一次
                const responseToCache = response.clone();

                // 開啟快取並將新的回應存入
                caches.open(CACHE_NAME).then((cache) => {
                    cache.put(event.request, responseToCache);
                });

                return response;
            });
        })
    );
});
