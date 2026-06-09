// coi-serviceworker.js - 只在主執行緒運行，負責註冊 PWA 的 sw.js 並在需要時重新整理網頁以套用 COI
if (typeof window !== "undefined") {
    const coi = {
        shouldRegister: () => !window.__TAURI__ && !window.__TAURI_INTERNALS__,
        shouldDeregister: () => false,
        doReload: () => window.location.reload(),
        quiet: false,
    };

    if (coi.shouldDeregister() && "serviceWorker" in navigator) {
        navigator.serviceWorker.getRegistrations().then((registrations) => {
            for (let registration of registrations) {
                registration.unregister();
            }
        });
    }

    if (coi.shouldRegister() && "serviceWorker" in navigator) {
        // 透過 currentScript 的 src 計算出 sw.js 的絕對路徑，以適應不同的 base path 部署
        const swUrl = window.document.currentScript.src.replace("coi-serviceworker.js", "sw.js");

        navigator.serviceWorker
            .register(swUrl)
            .then((registration) => {
                if (!coi.quiet) console.log("PWA & COI Service Worker registered", registration.scope);

                // 只有在 !window.crossOriginIsolated 時才需要重載網頁以套用 headers
                if (!window.crossOriginIsolated) {
                    registration.addEventListener("updatefound", () => {
                        const newWorker = registration.installing;
                        if (newWorker) {
                            newWorker.addEventListener("statechange", () => {
                                if (newWorker.state === "activated") {
                                    if (!coi.quiet) console.log("Service Worker activated, reloading page for COI...");
                                    coi.doReload();
                                }
                            });
                        }
                    });

                    if (navigator.serviceWorker.controller) {
                        if (!coi.quiet)
                            console.log("Service Worker controller already exists, reloading page for COI...");
                        coi.doReload();
                    }
                }
            })
            .catch((err) => {
                if (!coi.quiet) console.error("Service Worker registration failed", err);
            });
    }
}
