const CACHE_NAME = 'crypto-tool-cache-v1';
const urlsToCache = [
    './', // 代表根目錄，會快取 index 或主 HTML 檔案
    './crypto_manager.html', // 明確指定主檔案名稱
    'https://cdn.jsdelivr.net/npm/qrcode@1.5.1/build/qrcode.min.js',
    'https://cdn.jsdelivr.net/npm/@noble/ciphers/esm/chacha.js'
];

// 安裝 Service Worker 時，快取核心檔案
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Opened cache and caching core assets');
                return cache.addAll(urlsToCache);
            })
    );
});

// 攔截網路請求
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // 如果快取中找到對應的回應，就直接回傳
                if (response) {
                    return response;
                }
                // 如果快取中沒有，就透過網路去請求
                return fetch(event.request);
            })
    );
});