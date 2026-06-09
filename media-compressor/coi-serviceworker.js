/*! coi-serviceworker v0.1.7 | MIT License | https://github.com/gzgavin/coi-serviceworker */
if (typeof window === 'undefined') {
    self.addEventListener("install", () => self.skipWaiting());
    self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));
    self.addEventListener("fetch", (event) => {
        if (event.request.cache === "only-if-cached" && event.request.mode !== "same-origin") {
            return;
        }
        event.respondWith(
            fetch(event.request)
                .then((response) => {
                    if (response.status === 0) {
                        return response;
                    }
                    const newHeaders = new Headers(response.headers);
                    newHeaders.set("Cross-Origin-Embedder-Policy", "require-corp");
                    newHeaders.set("Cross-Origin-Opener-Policy", "same-origin");
                    return new Response(response.body, {
                        status: response.status,
                        statusText: response.statusText,
                        headers: newHeaders,
                    });
                })
                .catch((e) => console.error(e))
        );
    });
} else {
    // Main thread registration and auto-reload logic
    const coi = {
        shouldRegister: () => true,
        shouldDeregister: () => false,
        doReload: () => window.location.reload(),
        quiet: false
    };

    if (coi.shouldDeregister() && 'serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then((registrations) => {
            for (let registration of registrations) {
                registration.unregister();
            }
        });
    }

    if (coi.shouldRegister() && 'serviceWorker' in navigator && !window.crossOriginIsolated) {
        navigator.serviceWorker.register(window.document.currentScript.src).then((registration) => {
            if (!coi.quiet) console.log("COI Service Worker registered", registration.scope);

            // Reload the page once active to let headers take effect
            registration.addEventListener("updatefound", () => {
                coi.doReload();
            });
            if (navigator.serviceWorker.controller) {
                coi.doReload();
            }
        }).catch((err) => {
            if (!coi.quiet) console.error("COI Service Worker registration failed", err);
        });
    }
}
