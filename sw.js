// sw.js

const CACHE_NAME = "crypto-manager-cache-v2";
// 需要快取的檔案列表
// 注意：我們需要快取所有透過 CDN 載入的外部資源，以確保離線時也能正常運作
const urlsToCache = [
    "./crypto_manager.html", // 代表根目錄，也就是 crypto_manager.html
    "./manifest.json",
    "./icon-192.png",
    "./icon-512.png",
    "https://cdn.jsdelivr.net/npm/qrcode@1.5.1/build/qrcode.min.js",
    "https://cdn.jsdelivr.net/npm/js-base64@3.7.7/base64.min.js",
    "https://cdn.jsdelivr.net/npm/@noble/ciphers/esm/chacha.js",
];

// Service Worker 安裝事件
self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log("Opened cache");
            return cache.addAll(urlsToCache);
        })
    );
});

// Service Worker 啟用事件 (用來清理舊快取)
self.addEventListener("activate", (event) => {
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

// 攔截網路請求事件
self.addEventListener("fetch", (event) => {
    event.respondWith(
        caches.match(event.request).then((response) => {
            // 如果快取中有對應的回應，就直接回傳
            if (response) {
                return response;
            }

            // 否則，從網路請求
            return fetch(event.request).then((response) => {
                // 如果請求失敗或不是有效的回應，則直接返回
                if (!response || response.status !== 200 || response.type !== "basic") {
                    // 對於 CDN 資源，使用 cors 模式
                    if (!response && event.request.url.startsWith("https://cdn.")) {
                        return fetch(event.request, { mode: "cors" });
                    }
                    return response;
                }

                // 複製一份回應，因為 request 和 response 都是 stream，只能被使用一次
                const responseToCache = response.clone();

                caches.open(CACHE_NAME).then((cache) => {
                    cache.put(event.request, responseToCache);
                });

                return response;
            });
        })
    );
});
