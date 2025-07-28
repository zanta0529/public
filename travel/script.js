document.addEventListener("DOMContentLoaded", () => {
    // ===== 1. DOM Element Selection =====
    const mapElement = document.getElementById("map");
    const itineraryPanel = document.getElementById("itinerary-panel");
    const panelHandle = document.getElementById("panel-handle");
    const itineraryListContainer = document.getElementById("itinerary-list");
    const dateFiltersContainer = document.getElementById("date-filters");
    const categoryFiltersContainer = document.getElementById("category-filters");
    // New UI Elements
    const manageItinerariesBtn = document.getElementById("manage-itineraries-btn");
    const itineraryManagerModal = document.getElementById("itinerary-manager-modal");
    const createItineraryModal = document.getElementById("create-itinerary-modal");
    const passwordPromptModal = document.getElementById("password-prompt-modal");
    const editLocationModal = document.getElementById("edit-location-modal");
    const itineraryTitleEl = document.getElementById("itinerary-title");
    const readOnlyIndicator = document.getElementById("read-only-indicator");
    const addLocationContainer = document.getElementById("add-location-container");
    const exportJsonBtn = document.getElementById("export-json");
    const exportPrintableBtn = document.getElementById("export-printable");

    // ===== 2. State Management =====
    const state = {
        currentItinerary: null, // { id, name, hash, salt, locations: [] }
        isReadOnly: true,
        filter: { date: "all", category: "all" },
        editingLocationId: null, // To track if we are adding or editing
    };
    const categoryMapping = {
        sight: { name: "景點", color: "var(--category-sight)" },
        stay: { name: "住宿", color: "var(--category-stay)" },
        transport: { name: "交通", color: "var(--category-transport)" },
        food: { name: "餐飲", color: "var(--category-food)" },
        default: { name: "其他", color: "var(--category-default)" },
    };

    // ===== 3. Leaflet Map Initialization =====
    const map = L.map(mapElement).setView([25.105497, 121.517594], 10); // Default to Taipei
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);
    const layerGroup = L.layerGroup().addTo(map);

    // ===== 4. Database (IndexedDB) Module =====
    const db = (() => {
        let dbInstance;
        const DB_NAME = "TravelItinerariesDB";
        const STORE_NAME = "itineraries";

        async function initDB() {
            return new Promise((resolve, reject) => {
                const request = indexedDB.open(DB_NAME, 1);
                request.onerror = (e) => reject("資料庫開啟失敗", e.target.error);
                request.onsuccess = (e) => {
                    dbInstance = e.target.result;
                    resolve(dbInstance);
                };
                request.onupgradeneeded = (e) => {
                    const db = e.target.result;
                    if (!db.objectStoreNames.contains(STORE_NAME)) {
                        db.createObjectStore(STORE_NAME, { keyPath: "id" });
                    }
                };
            });
        }

        async function getStore(mode = "readonly") {
            if (!dbInstance) await initDB();
            return dbInstance.transaction(STORE_NAME, mode).objectStore(STORE_NAME);
        }

        return {
            init: initDB,
            async saveItinerary(itinerary) {
                const store = await getStore("readwrite");
                return new Promise((resolve, reject) => {
                    const request = store.put(itinerary);
                    request.onsuccess = resolve;
                    request.onerror = reject;
                });
            },
            async getItineraries() {
                const store = await getStore();
                return new Promise((resolve, reject) => {
                    const request = store.getAll();
                    request.onsuccess = () => resolve(request.result);
                    request.onerror = reject;
                });
            },
            async getItineraryById(id) {
                const store = await getStore();
                return new Promise((resolve, reject) => {
                    const request = store.get(id);
                    request.onsuccess = () => resolve(request.result);
                    request.onerror = reject;
                });
            },
            async deleteItinerary(id) {
                const store = await getStore("readwrite");
                return new Promise((resolve, reject) => {
                    const request = store.delete(id);
                    request.onsuccess = resolve;
                    request.onerror = reject;
                });
            },
        };
    })();

    // ===== 5. Crypto Module (for Passwords) =====
    const cryptoUtils = (() => {
        const encoder = new TextEncoder();

        async function pbkdf2(password, salt) {
            const keyMaterial = await crypto.subtle.importKey(
                "raw",
                encoder.encode(password),
                { name: "PBKDF2" },
                false,
                ["deriveBits", "deriveKey"]
            );
            return crypto.subtle.deriveBits(
                { name: "PBKDF2", salt: salt, iterations: 100000, hash: "SHA-256" },
                keyMaterial,
                256
            );
        }

        return {
            async hashPassword(password) {
                const salt = crypto.getRandomValues(new Uint8Array(16));
                const hashBuffer = await pbkdf2(password, salt);
                const hashArray = Array.from(new Uint8Array(hashBuffer));
                const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
                return { hash: hashHex, salt };
            },
            async verifyPassword(password, salt, storedHash) {
                const hashBuffer = await pbkdf2(password, salt);
                const hashArray = Array.from(new Uint8Array(hashBuffer));
                const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
                return hashHex === storedHash;
            },
        };
    })();

    // ===== 6. UI Rendering & Update Functions =====

    function refreshUI() {
        if (!state.currentItinerary) {
            resetUI();
            return;
        }
        const locations = state.currentItinerary.locations;
        const filteredLocations = getFilteredLocations();

        // Use textContent for safety against XSS
        itineraryTitleEl.textContent = state.currentItinerary.name;

        readOnlyIndicator.classList.toggle("hidden", !state.isReadOnly);
        addLocationContainer.classList.toggle("hidden", state.isReadOnly);

        createFilterControls(locations);
        createItineraryList(locations, filteredLocations);
        drawMap(filteredLocations);
        updateStats(locations);
    }

    function resetUI() {
        itineraryTitleEl.textContent = "尚未載入行程";
        readOnlyIndicator.classList.add("hidden");
        addLocationContainer.classList.add("hidden");
        itineraryListContainer.innerHTML = '<p class="empty-message">請從「管理」建立或載入一個行程。</p>';
        dateFiltersContainer.innerHTML = "";
        categoryFiltersContainer.innerHTML = "";
        layerGroup.clearLayers();
        updateStats([]);
    }

    function getFilteredLocations() {
        if (!state.currentItinerary) return [];
        return state.currentItinerary.locations.filter(
            (loc) =>
                (state.filter.date === "all" || loc.date === state.filter.date) &&
                (state.filter.category === "all" || loc.category === state.filter.category)
        );
    }

    function createItineraryList(allLocations, filteredLocations) {
        if (allLocations.length === 0) {
            itineraryListContainer.innerHTML = state.isReadOnly
                ? '<p class="empty-message">此行程沒有任何地點。</p>'
                : '<p class="empty-message">此行程沒有任何地點，點擊下方按鈕新增第一個景點吧！</p>';
            return;
        }

        const groupedByDate = allLocations.reduce((acc, loc) => {
            if (!acc[loc.date]) acc[loc.date] = [];
            acc[loc.date].push(loc);
            return acc;
        }, {});

        const isFiltering = state.filter.date !== "all" || state.filter.category !== "all";

        const listHtml = Object.keys(groupedByDate)
            .sort()
            .map((date) => {
                const locationsInGroup = groupedByDate[date];
                const itemsHtml = locationsInGroup
                    .map((loc) => {
                        const isVisible = filteredLocations.some((fLoc) => fLoc.id === loc.id);
                        if (isFiltering && !isVisible) return "";

                        const categoryInfo = categoryMapping[loc.category] || categoryMapping.default;
                        const locationIndex = filteredLocations.findIndex((fLoc) => fLoc.id === loc.id);
                        const itemNumber = isVisible ? locationIndex + 1 : "•";

                        // Sanitize user-provided content before inserting into HTML
                        const sanitizedLocation = sanitizeHTML(loc.location);

                        return `
                    <div class="location-item" data-id="${loc.id}" draggable="${!state.isReadOnly}">
                        <span class="location-number" style="color: ${categoryInfo.color};">${itemNumber}</span>
                        <p>${sanitizedLocation}</p>
                        <span class="category-badge" style="background-color: ${categoryInfo.color};">${
                            categoryInfo.name
                        }</span>
                        ${
                            !state.isReadOnly
                                ? `
                        <div class="location-controls">
                            <button class="edit-btn" title="編輯">✏️</button>
                            <button class="delete-btn" title="刪除">🗑️</button>
                        </div>`
                                : ""
                        }
                    </div>`;
                    })
                    .join("");

                if (!itemsHtml) return "";

                return `<div class="day-group"><div class="day-header">${date}</div>${itemsHtml}</div>`;
            })
            .join("");

        itineraryListContainer.innerHTML = listHtml || '<p class="empty-message">沒有符合篩選條件的景點。</p>';
    }

    function createFilterControls(locations) {
        const uniqueDates = [...new Set(locations.map((loc) => loc.date))].sort();
        const dateButtonsHtml = uniqueDates
            .map(
                (date) =>
                    `<button data-date="${date}" class="${state.filter.date === date ? "active" : ""}">${date}</button>`
            )
            .join("");
        dateFiltersContainer.innerHTML = `<button data-date="all" class="${
            state.filter.date === "all" ? "active" : ""
        }">全部日期</button>${dateButtonsHtml}`;

        const uniqueCategories = [...new Set(locations.map((loc) => loc.category))];
        const categoryButtonsHtml = uniqueCategories
            .map((cat) => {
                const categoryInfo = categoryMapping[cat] || categoryMapping.default;
                return `<button data-category="${cat}" class="${state.filter.category === cat ? "active" : ""}">${
                    categoryInfo.name
                }</button>`;
            })
            .join("");
        categoryFiltersContainer.innerHTML = `<button data-category="all" class="${
            state.filter.category === "all" ? "active" : ""
        }">全部分類</button>${categoryButtonsHtml}`;
    }

    function drawMap(locationsToDraw) {
        layerGroup.clearLayers();
        if (locationsToDraw.length === 0) return;

        const bounds = L.latLngBounds();
        locationsToDraw.forEach((loc, index) => {
            const categoryInfo = categoryMapping[loc.category] || categoryMapping.default;
            const markerIcon = L.divIcon({
                html: `<div style="background-color: ${
                    categoryInfo.color
                }; width: 28px; height: 28px; border-radius: 50%; border: 2px solid white; box-shadow: var(--shadow); display: flex; justify-content: center; align-items: center; color: white; font-size: 14px; font-weight: bold;">${
                    index + 1
                }</div>`,
                className: "custom-marker-icon",
                iconSize: [28, 28],
                iconAnchor: [14, 14],
            });
            const marker = L.marker(loc.coordinates, { icon: markerIcon });

            // Sanitize content for the popup
            const popupContent = `<b>${sanitizeHTML(loc.location)}</b><br>${sanitizeHTML(loc.description || "無描述")}`;
            marker.bindPopup(popupContent);

            marker.addTo(layerGroup);
            bounds.extend(loc.coordinates);
        });

        for (let i = 0; i < locationsToDraw.length - 1; i++) {
            if (locationsToDraw[i].date === locationsToDraw[i + 1].date) {
                L.polyline([locationsToDraw[i].coordinates, locationsToDraw[i + 1].coordinates], {
                    color: "#3388ff",
                    weight: 3,
                    opacity: 0.7,
                }).addTo(layerGroup);
            }
        }
        if (bounds.isValid()) map.fitBounds(bounds.pad(0.2), { maxZoom: 15 });
    }

    function updateStats(locations) {
        document.getElementById("stats-days").innerText = new Set(locations.map((loc) => loc.date)).size;
        document.getElementById("stats-locations").innerText = locations.length;
        let totalDistance = 0;
        locations.forEach((loc, i) => {
            if (i > 0 && loc.date === locations[i - 1].date) {
                totalDistance += map.distance(loc.coordinates, locations[i - 1].coordinates);
            }
        });
        document.getElementById("stats-distance").innerText = (totalDistance / 1000).toFixed(1);
    }

    // ===== 7. Modal & Itinerary Management Logic =====

    function toggleModal(modal, show) {
        modal.classList.toggle("hidden", !show);
    }

    async function showItineraryManager() {
        const itineraries = await db.getItineraries();
        const listEl = document.getElementById("itinerary-manager-list");
        if (itineraries.length === 0) {
            listEl.innerHTML = "<li>尚未建立任何行程。</li>";
        } else {
            listEl.innerHTML = itineraries
                .map(
                    (it) => `
                <li class="itinerary-manager-item" data-id="${it.id}">
                    <span class="itinerary-manager-item-name">${sanitizeHTML(it.name)}</span>
                    <div class="itinerary-manager-item-actions">
                        <button class="load-btn">載入</button>
                        <button class="delete-btn">刪除</button>
                    </div>
                </li>
            `
                )
                .join("");
        }
        toggleModal(itineraryManagerModal, true);
    }

    function loadItineraryIntoUI(itinerary, isReadOnly) {
        state.currentItinerary = itinerary;
        state.isReadOnly = isReadOnly;
        state.filter = { date: "all", category: "all" }; // Reset filters
        refreshUI();
        toggleModal(itineraryManagerModal, false);
        toggleModal(passwordPromptModal, false);
    }

    async function handleSaveLocation() {
        const name = document.getElementById("location-name").value;
        const date = document.getElementById("location-date").value;
        const category = document.getElementById("location-category").value;
        const description = document.getElementById("location-description").value;
        const coordsText = document.getElementById("location-coordinates").value;

        if (!name || !date || !coordsText) {
            showToast("地點名稱、日期和座標為必填項", "error");
            return;
        }

        const coordinates = coordsText.split(",").map(Number);
        if (coordinates.length !== 2 || isNaN(coordinates[0]) || isNaN(coordinates[1])) {
            showToast("座標格式不正確", "error");
            return;
        }

        const locationData = { date, location: name, category, description, coordinates, image: "" };

        if (state.editingLocationId) {
            // Editing existing
            const index = state.currentItinerary.locations.findIndex((l) => l.id === state.editingLocationId);
            if (index > -1) {
                state.currentItinerary.locations[index] = {
                    ...state.currentItinerary.locations[index],
                    ...locationData,
                };
            }
        } else {
            // Adding new
            locationData.id = `loc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            state.currentItinerary.locations.push(locationData);
        }

        state.currentItinerary.locations.sort((a, b) => new Date(a.date) - new Date(b.date));

        await db.saveItinerary(state.currentItinerary);
        showToast("景點已儲存！", "success");
        toggleModal(editLocationModal, false);
        refreshUI();
    }

    const debouncedSearch = debounce(async () => {
        const query = document.getElementById("location-name").value;
        if (!query) return;

        const resultsContainer = document.getElementById("location-search-results");
        resultsContainer.innerHTML = "搜尋中...";

        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`,
                {
                    headers: { "User-Agent": "TravelItineraryHelper/2.1" },
                }
            );
            if (!response.ok) throw new Error("API 請求失敗");
            const results = await response.json();

            if (results.length === 0) {
                resultsContainer.innerHTML = "找不到結果";
            } else {
                resultsContainer.innerHTML = results
                    .map(
                        (r) =>
                            `<div class="search-result-item" data-lat="${r.lat}" data-lon="${r.lon}">${sanitizeHTML(
                                r.display_name
                            )}</div>`
                    )
                    .join("");
            }
        } catch (error) {
            resultsContainer.innerHTML = "搜尋時發生錯誤";
            showToast(error.message, "error");
        }
    }, 500); // 500ms debounce delay

    // ===== 8. Event Listeners =====
    function setupEventListeners() {
        document.querySelectorAll(".close-modal-btn").forEach((btn) => {
            btn.addEventListener("click", () => toggleModal(btn.closest(".modal-backdrop"), false));
        });
        manageItinerariesBtn.addEventListener("click", showItineraryManager);

        itineraryManagerModal.addEventListener("click", async (e) => {
            const target = e.target;
            const item = target.closest(".itinerary-manager-item");
            if (!item) return;
            const id = item.dataset.id;

            if (target.classList.contains("load-btn")) {
                const itinerary = await db.getItineraryById(id);
                if (!itinerary.hash) {
                    loadItineraryIntoUI(itinerary, false);
                } else {
                    toggleModal(passwordPromptModal, true);
                    passwordPromptModal.dataset.id = id;
                }
            } else if (target.classList.contains("delete-btn")) {
                const itineraryName = item.querySelector(".itinerary-manager-item-name").textContent;
                if (confirm(`確定要刪除行程 "${itineraryName}" 嗎？此操作無法復原。`)) {
                    await db.deleteItinerary(id);
                    if (state.currentItinerary && state.currentItinerary.id === id) {
                        state.currentItinerary = null;
                        resetUI();
                    }
                    showToast("行程已刪除", "success");
                    showItineraryManager();
                }
            }
        });

        document.getElementById("create-new-itinerary-btn").addEventListener("click", () => {
            toggleModal(createItineraryModal, true);
        });

        document.getElementById("import-itinerary-btn").addEventListener("click", () => {
            document.getElementById("import-file-input").click();
        });
        document.getElementById("import-file-input").addEventListener("change", (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = async (event) => {
                try {
                    const itinerary = JSON.parse(event.target.result);
                    if (!itinerary.id || !itinerary.name || !itinerary.locations) {
                        throw new Error("無效的檔案格式");
                    }
                    await db.saveItinerary(itinerary);
                    showToast(`行程 "${itinerary.name}" 已成功匯入！`, "success");
                    showItineraryManager();
                } catch (err) {
                    showToast(`匯入失敗: ${err.message}`, "error");
                }
            };
            reader.readAsText(file);
            e.target.value = "";
        });

        document.getElementById("save-new-itinerary-btn").addEventListener("click", async () => {
            const name = document.getElementById("new-itinerary-name").value;
            const password = document.getElementById("new-itinerary-password").value;
            if (!name) {
                showToast("請輸入行程名稱", "error");
                return;
            }

            const newItinerary = {
                id: `it_${Date.now()}`,
                name: name,
                createdAt: new Date().toISOString(),
                locations: [],
                hash: null,
                salt: null,
            };

            if (password) {
                const { hash, salt } = await cryptoUtils.hashPassword(password);
                newItinerary.hash = hash;
                newItinerary.salt = salt;
            }

            await db.saveItinerary(newItinerary);
            showToast("行程已建立！", "success");
            toggleModal(createItineraryModal, false);
            showItineraryManager();
        });

        document.getElementById("submit-password-btn").addEventListener("click", async () => {
            const id = passwordPromptModal.dataset.id;
            const password = document.getElementById("itinerary-password-input").value;
            const itinerary = await db.getItineraryById(id);
            const isValid = await cryptoUtils.verifyPassword(password, itinerary.salt, itinerary.hash);

            if (isValid) {
                loadItineraryIntoUI(itinerary, false);
            } else {
                showToast("密碼錯誤！", "error");
            }
            document.getElementById("itinerary-password-input").value = "";
        });

        document.getElementById("load-readonly-btn").addEventListener("click", async () => {
            const id = passwordPromptModal.dataset.id;
            const itinerary = await db.getItineraryById(id);
            loadItineraryIntoUI(itinerary, true);
        });

        document.getElementById("add-location-btn").addEventListener("click", () => {
            state.editingLocationId = null;
            document.getElementById("edit-location-title").textContent = "新增景點";

            let defaultDate = new Date().toISOString().split("T")[0];
            if (state.currentItinerary && state.currentItinerary.locations.length > 0) {
                defaultDate = state.currentItinerary.locations[state.currentItinerary.locations.length - 1].date;
            }

            document.getElementById("location-name").value = "";
            document.getElementById("location-date").value = defaultDate;
            document.getElementById("location-category").value = "sight";
            document.getElementById("location-description").value = "";
            document.getElementById("location-coordinates").value = "";
            document.getElementById("location-search-results").innerHTML = "";
            toggleModal(editLocationModal, true);
        });

        document.getElementById("save-location-btn").addEventListener("click", handleSaveLocation);
        document.getElementById("search-location-btn").addEventListener("click", debouncedSearch);

        document.getElementById("location-search-results").addEventListener("click", (e) => {
            const item = e.target.closest(".search-result-item");
            if (item) {
                document.getElementById("location-name").value = item.textContent;
                document.getElementById("location-coordinates").value = `${item.dataset.lat}, ${item.dataset.lon}`;
                document.getElementById("location-search-results").innerHTML = "";
            }
        });

        itineraryListContainer.addEventListener("click", (e) => {
            const target = e.target;
            const locationItem = target.closest(".location-item");
            if (!locationItem) return;
            const id = locationItem.dataset.id;

            if (target.closest(".edit-btn")) {
                state.editingLocationId = id;
                const loc = state.currentItinerary.locations.find((l) => l.id === id);
                document.getElementById("edit-location-title").textContent = "編輯景點";
                document.getElementById("location-name").value = loc.location;
                document.getElementById("location-date").value = loc.date;
                document.getElementById("location-category").value = loc.category;
                document.getElementById("location-description").value = loc.description;
                document.getElementById("location-coordinates").value = loc.coordinates.join(", ");
                toggleModal(editLocationModal, true);
            } else if (target.closest(".delete-btn")) {
                const locationName = locationItem.querySelector("p").textContent;
                if (confirm(`確定要刪除景點 "${locationName}" 嗎？`)) {
                    state.currentItinerary.locations = state.currentItinerary.locations.filter((l) => l.id !== id);
                    db.saveItinerary(state.currentItinerary);
                    refreshUI();
                }
            } else {
                const loc = state.currentItinerary.locations.find((l) => l.id === id);
                if (loc) map.flyTo(loc.coordinates, 15);
            }
        });

        let draggedItemId = null;
        itineraryListContainer.addEventListener("dragstart", (e) => {
            if (state.isReadOnly) return;
            const target = e.target.closest(".location-item");
            if (target) {
                draggedItemId = target.dataset.id;
                setTimeout(() => target.classList.add("dragging"), 0);
            }
        });
        itineraryListContainer.addEventListener("dragover", (e) => {
            if (state.isReadOnly || !draggedItemId) return;
            e.preventDefault();
        });
        itineraryListContainer.addEventListener("drop", (e) => {
            if (state.isReadOnly || !draggedItemId) return;
            e.preventDefault();
            const dropTarget = e.target.closest(".location-item");
            const fromIndex = state.currentItinerary.locations.findIndex((l) => l.id === draggedItemId);
            let toIndex = state.currentItinerary.locations.findIndex((l) => l.id === dropTarget?.dataset.id);

            if (fromIndex !== -1 && toIndex !== -1 && fromIndex !== toIndex) {
                const [movedItem] = state.currentItinerary.locations.splice(fromIndex, 1);
                state.currentItinerary.locations.splice(toIndex, 0, movedItem);

                const targetDate = state.currentItinerary.locations[toIndex].date;
                movedItem.date = targetDate;

                db.saveItinerary(state.currentItinerary);
                refreshUI();
            }
            draggedItemId = null;
            document.querySelector(".dragging")?.classList.remove("dragging");
        });
        itineraryListContainer.addEventListener("dragend", () => {
            draggedItemId = null;
            document.querySelector(".dragging")?.classList.remove("dragging");
        });

        document.getElementById("filters").addEventListener("click", (e) => {
            if (e.target.tagName !== "BUTTON") return;
            const button = e.target;
            if (button.dataset.date !== undefined) state.filter.date = button.dataset.date;
            if (button.dataset.category !== undefined) state.filter.category = button.dataset.category;
            refreshUI();
        });

        panelHandle.addEventListener("click", () => {
            itineraryPanel.classList.toggle("open");
            panelHandle.classList.toggle("open");
            setTimeout(() => map.invalidateSize(true), 300);
        });

        exportJsonBtn.addEventListener("click", () => {
            if (!state.currentItinerary) {
                showToast("尚未載入任何行程", "warning");
                return;
            }
            const exportableItinerary = JSON.parse(JSON.stringify(state.currentItinerary));
            delete exportableItinerary.salt;

            const jsonString = JSON.stringify(exportableItinerary, null, 4);
            const blob = new Blob([jsonString], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `${state.currentItinerary.name}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            showToast("行程資料已匯出為 JSON 檔！", "success");
        });

        exportPrintableBtn.addEventListener("click", () => {
            if (!state.currentItinerary || state.currentItinerary.locations.length === 0) {
                showToast("沒有可列印的行程資料", "warning");
                return;
            }
            showToast("正在準備預覽頁面...", "normal");

            const locations = state.currentItinerary.locations;
            const statsDays = document.getElementById("stats-days").innerText;
            const statsLocations = document.getElementById("stats-locations").innerText;
            const statsDistance = document.getElementById("stats-distance").innerText;
            const statsText = `總天數: ${statsDays} 天 | 總地點: ${statsLocations} 個 | 總距離: ${statsDistance} km`;

            let tableHtml = `
                <table border="1" style="width: 100%; border-collapse: collapse; font-size: 12px;">
                    <thead>
                        <tr style="background-color: #f2f2f2;">
                            <th style="padding: 8px;">#</th>
                            <th style="padding: 8px;">日期</th>
                            <th style="padding: 8px;">地點</th>
                            <th style="padding: 8px;">分類</th>
                            <th style="padding: 8px;">描述</th>
                        </tr>
                    </thead>
                    <tbody>`;
            locations.forEach((loc, index) => {
                tableHtml += `
                    <tr>
                        <td style="padding: 8px;">${index + 1}</td>
                        <td style="padding: 8px;">${sanitizeHTML(loc.date)}</td>
                        <td style="padding: 8px;">${sanitizeHTML(loc.location)}</td>
                        <td style="padding: 8px;">${sanitizeHTML(categoryMapping[loc.category]?.name || "其他")}</td>
                        <td style="padding: 8px;">${sanitizeHTML(loc.description)}</td>
                    </tr>`;
            });
            tableHtml += `</tbody></table>`;

            const printableHtml = `
                <html>
                <head>
                    <title>${sanitizeHTML(state.currentItinerary.name)} - 可列印版</title>
                    <meta charset="UTF-8">
                    <style>
                        body { font-family: sans-serif; margin: 20px; }
                        h1, p { margin-bottom: 15px; }
                        @media print {
                            @page { margin: 20mm; }
                            body { margin: 0; }
                            table { page-break-inside: auto; }
                            tr { page-break-inside: avoid; page-break-after: auto; }
                        }
                    </style>
                </head>
                <body>
                    <h1>${sanitizeHTML(state.currentItinerary.name)}</h1>
                    <p>${sanitizeHTML(statsText)}</p>
                    ${tableHtml}
                </body>
                </html>`;

            const newWindow = window.open();
            newWindow.document.write(printableHtml);
            newWindow.document.close();
            setTimeout(() => newWindow.print(), 500);
        });
    }

    // ===== 9. Utility Functions =====
    function showToast(message, type = "normal") {
        const toast = document.createElement("div");
        toast.className = `toast-message ${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);
        setTimeout(() => toast.classList.add("show"), 10);
        setTimeout(() => {
            toast.classList.remove("show");
            toast.addEventListener("transitionend", () => toast.remove());
        }, 3000);
    }

    function sanitizeHTML(str) {
        if (!str) return "";
        return str.replace(/[&<>"']/g, function (match) {
            return {
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#39;",
            }[match];
        });
    }

    function debounce(func, delay) {
        let timeout;
        return function (...args) {
            const context = this;
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(context, args), delay);
        };
    }

    // ===== 10. Application Initialization =====
    async function main() {
        await db.init();
        setupEventListeners();
        resetUI();
        showItineraryManager();
    }

    main();
});
