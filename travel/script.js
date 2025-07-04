document.addEventListener("DOMContentLoaded", () => {
    // --- DOM 元素選擇 (使用 const 增加穩定性) ---
    const mapElement = document.getElementById("map");
    const dateFiltersContainer = document.getElementById("date-filters");
    const categoryFiltersContainer = document.getElementById("category-filters");
    const itineraryListContainer = document.getElementById("itinerary-list");
    const panel = document.getElementById("itinerary-panel");
    const panelHandle = document.getElementById("panel-handle");

    // --- 初始化地圖 ---
    const map = L.map(mapElement).setView([51.505, -0.09], 5);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    // --- 全域變數與狀態管理 ---
    let state = {
        locations: [],
        filter: {
            date: "all",
            category: "all",
        },
    };
    const layerGroup = L.layerGroup().addTo(map);
    const categoryMapping = {
        sight: { name: "景點", color: "var(--category-sight)" },
        stay: { name: "住宿", color: "var(--category-stay)" },
        transport: { name: "交通", color: "var(--category-transport)" },
        food: { name: "餐飲", color: "var(--category-food)" },
        default: { name: "其他", color: "var(--category-default)" },
    };

    // --- 主程式入口 ---
    function main() {
        processAndValidateData(locationsData);
        if (state.locations.length > 0) {
            setupEventListeners();
            refreshUI();
            if (window.innerWidth > 768) {
                panel.classList.add("open");
                panelHandle.classList.add("open");
            } else {
                panel.classList.remove("open");
                panelHandle.classList.remove("open");
            }
        } else {
            showToast("沒有有效的行程資料可以顯示", "warning");
        }
    }

    // --- 資料處理 ---
    function processAndValidateData(rawData) {
        state.locations = rawData
            .map((item) => {
                if (
                    !item.date ||
                    !item.location ||
                    !/^\d{4}-\d{2}-\d{2}$/.test(item.date) ||
                    isNaN(new Date(item.date).getTime())
                )
                    return null;
                if (
                    !item.coordinates ||
                    item.coordinates.length !== 2 ||
                    isNaN(item.coordinates[0]) ||
                    isNaN(item.coordinates[1])
                )
                    return null;
                return {
                    ...item,
                    description: item.description || "無描述",
                    image: item.image || "",
                    category: item.category || "default",
                    id: `loc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, // More robust unique ID
                };
            })
            .filter(Boolean);
    }

    // --- UI 更新 ---
    function refreshUI() {
        const filteredLocations = getFilteredLocations();
        createFilterControls();
        createItineraryList(filteredLocations);
        drawMap(filteredLocations);
        updateStats();
    }

    function getFilteredLocations() {
        return state.locations.filter(
            (loc) =>
                (state.filter.date === "all" || loc.date === state.filter.date) &&
                (state.filter.category === "all" || loc.category === state.filter.category)
        );
    }

    // --- 高效能渲染函式 ---

    function createFilterControls() {
        // Date filters
        const uniqueDates = [...new Set(state.locations.map((loc) => loc.date))].sort();
        const dateButtonsHtml = uniqueDates
            .map(
                (date) =>
                    `<button data-date="${date}" class="${state.filter.date === date ? "active" : ""}">${date}</button>`
            )
            .join("");
        dateFiltersContainer.innerHTML = `<button data-date="all" class="${
            state.filter.date === "all" ? "active" : ""
        }">全部日期</button>${dateButtonsHtml}`;

        // Category filters
        const uniqueCategories = [...new Set(state.locations.map((loc) => loc.category))];
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

    function createItineraryList(filteredLocations) {
        if (state.locations.length === 0) {
            itineraryListContainer.innerHTML = "";
            return;
        }

        const groupedByDate = state.locations.reduce((acc, loc) => {
            if (!acc[loc.date]) acc[loc.date] = [];
            acc[loc.date].push(loc);
            return acc;
        }, {});

        const isFilteringBySingleDay = state.filter.date !== "all";

        const listHtml = Object.keys(groupedByDate)
            .sort()
            .map((date) => {
                const locationsInGroup = groupedByDate[date];
                const itemsHtml = locationsInGroup
                    .map((loc) => {
                        const filteredIndex = filteredLocations.findIndex((fLoc) => fLoc.id === loc.id);
                        if (filteredIndex === -1) return "";

                        const categoryInfo = categoryMapping[loc.category] || categoryMapping.default;
                        const itemNumber = filteredIndex + 1;

                        return `
                            <div class="location-item" data-id="${loc.id}" data-lat="${loc.coordinates[0]}" data-lng="${loc.coordinates[1]}" draggable="true">
                                <span class="location-number" style="color: ${categoryInfo.color};">${itemNumber}.</span>
                                <p>${loc.location}</p>
                                <span class="category-badge" style="background-color: ${categoryInfo.color};">${categoryInfo.name}</span>
                            </div>`;
                    })
                    .join("");

                if (!itemsHtml && !isFilteringBySingleDay) {
                    return ""; // Hide day group if it has no visible items and we are not filtering
                }

                const isCollapsed = isFilteringBySingleDay && date !== state.filter.date;
                return `
                    <div class="day-group ${isCollapsed ? "collapsed" : ""}">
                        <div class="day-header">${date}</div>
                        ${itemsHtml}
                    </div>`;
            })
            .join("");

        itineraryListContainer.innerHTML = listHtml;
    }

    /**
     * [FIXED] Draws markers and polylines on the map with the original style.
     */
    function drawMap(locationsToDraw) {
        layerGroup.clearLayers();
        if (locationsToDraw.length === 0) return;

        const bounds = L.latLngBounds();

        locationsToDraw.forEach((loc, index) => {
            const categoryInfo = categoryMapping[loc.category] || categoryMapping.default;
            // Restore original marker HTML for correct styling
            const markerIcon = L.divIcon({
                html: `<div style="background-color: ${
                    categoryInfo.color
                }; width: 28px; height: 28px; border-radius: 50%; border: 2px solid white; box-shadow: var(--shadow); display: flex; justify-content: center; align-items: center; color: white; font-size: 14px; font-weight: bold;">${
                    index + 1
                }</div>`,
                className: "custom-marker-icon", // Restore class name
                iconSize: [28, 28],
                iconAnchor: [14, 14],
            });

            const marker = L.marker(loc.coordinates, { icon: markerIcon });

            marker.bindPopup(createPopupContent(loc), { className: "custom-popup" });
            marker.isSticky = false;

            marker.on("click", function () {
                this.isSticky = true;
                this.openPopup();
            });
            marker.on("popupclose", function () {
                this.isSticky = false;
            });
            marker.on("mouseover", function () {
                this.openPopup();
            });
            marker.on("mouseout", function () {
                if (!this.isSticky) {
                    this.closePopup();
                }
            });

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

    function createPopupContent(loc) {
        const categoryInfo = categoryMapping[loc.category] || categoryMapping.default;
        return `<div class="popup-header" style="background-color: ${categoryInfo.color};"><h3>${
            loc.location
        }</h3></div>
                <div class="popup-body">
                    <div class="popup-dates">${loc.date} (${categoryInfo.name})</div>
                    <p>${loc.description}</p>
                    ${loc.image ? `<img src="${loc.image}" alt="${loc.location}">` : ""}
                </div>`;
    }

    function updateStats() {
        const uniqueDates = new Set(state.locations.map((loc) => loc.date));
        document.getElementById("stats-days").innerText = uniqueDates.size;
        document.getElementById("stats-locations").innerText = state.locations.length;

        let totalDistance = 0;
        state.locations.forEach((loc, i) => {
            if (i > 0 && loc.date === state.locations[i - 1].date) {
                totalDistance += map.distance(loc.coordinates, state.locations[i - 1].coordinates);
            }
        });
        document.getElementById("stats-distance").innerText = (totalDistance / 1000).toFixed(1);
    }

    // --- 事件監聽設定 ---
    function setupEventListeners() {
        document.getElementById("filters").addEventListener("click", (e) => {
            if (e.target.tagName !== "BUTTON") return;
            const button = e.target;
            if (button.dataset.date !== undefined) state.filter.date = button.dataset.date;
            if (button.dataset.category !== undefined) state.filter.category = button.dataset.category;
            refreshUI();
        });

        itineraryListContainer.addEventListener("click", (e) => {
            const locationItem = e.target.closest(".location-item");
            if (locationItem) {
                const lat = parseFloat(locationItem.dataset.lat);
                const lng = parseFloat(locationItem.dataset.lng);
                map.flyTo([lat, lng], 15);
                layerGroup.eachLayer((layer) => {
                    if (layer.getLatLng && layer.getLatLng().equals([lat, lng])) {
                        setTimeout(() => layer.openPopup(), 300);
                    }
                });
                return;
            }

            const dayHeader = e.target.closest(".day-header");
            if (dayHeader && dayHeader.parentElement.classList.contains("collapsed")) {
                state.filter.date = dayHeader.innerText;
                refreshUI();
            }
        });

        // Drag and drop logic
        let draggedItemId = null;
        itineraryListContainer.addEventListener("dragstart", (e) => {
            const target = e.target.closest(".location-item");
            if (target) {
                draggedItemId = target.dataset.id;
                setTimeout(() => target.classList.add("dragging"), 0);
            }
        });
        itineraryListContainer.addEventListener("dragover", (e) => e.preventDefault());
        itineraryListContainer.addEventListener("drop", (e) => {
            e.preventDefault();
            const dropTarget = e.target.closest(".location-item");
            if (dropTarget && draggedItemId && dropTarget.dataset.id !== draggedItemId) {
                const fromIndex = state.locations.findIndex((loc) => loc.id === draggedItemId);
                const toIndex = state.locations.findIndex((loc) => loc.id === dropTarget.dataset.id);
                if (fromIndex !== -1 && toIndex !== -1) {
                    const [movedItem] = state.locations.splice(fromIndex, 1);
                    state.locations.splice(toIndex, 0, movedItem);
                    refreshUI();
                }
            }
            const draggingElement = itineraryListContainer.querySelector(".dragging");
            if (draggingElement) draggingElement.classList.remove("dragging");
            draggedItemId = null;
        });
        itineraryListContainer.addEventListener("dragend", () => {
            const draggingElement = itineraryListContainer.querySelector(".dragging");
            if (draggingElement) draggingElement.classList.remove("dragging");
            draggedItemId = null;
        });

        document.getElementById("search-input").addEventListener("input", (e) => {
            const query = e.target.value.toLowerCase();
            document.querySelectorAll(".location-item").forEach((item) => {
                const locationName = item.querySelector("p").textContent.toLowerCase();
                item.style.display = locationName.includes(query) ? "flex" : "none";
            });
        });

        panelHandle.addEventListener("click", () => {
            panel.classList.toggle("open");
            panelHandle.classList.toggle("open");
            setTimeout(() => map.invalidateSize(true), 300);
        });

        document.getElementById("coord-help-toggle").addEventListener("click", (e) => {
            e.preventDefault();
            const content = document.getElementById("coord-help-content");
            content.style.display = content.style.display === "block" ? "none" : "block";
        });

        document.getElementById("export-json").addEventListener("click", () => {
            const jsonString = JSON.stringify(state.locations, null, 4);
            const blob = new Blob([jsonString], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "locations.json";
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            showToast("行程資料已匯出為 locations.json！", "success");
        });

        /**
         * [FIXED] Restored the full functionality for exporting a printable page.
         */
        document.getElementById("export-printable").addEventListener("click", () => {
            showToast("正在準備預覽頁面...", "normal");

            const statsDays = document.getElementById("stats-days").innerText;
            const statsLocations = document.getElementById("stats-locations").innerText;
            const statsDistance = document.getElementById("stats-distance").innerText;
            const statsText = `總天數: ${statsDays} 天  |  總地點: ${statsLocations} 個  |  總距離: ${statsDistance} km`;

            let tableHtml = `
                <table border="1" style="width: 100%; border-collapse: collapse; font-size: 12px;">
                    <thead>
                        <tr style="background-color: #3498db; color: white;">
                            <th style="padding: 8px;">#</th>
                            <th style="padding: 8px;">日期</th>
                            <th style="padding: 8px;">地點</th>
                            <th style="padding: 8px;">分類</th>
                            <th style="padding: 8px;">描述</th>
                        </tr>
                    </thead>
                    <tbody>`;
            state.locations.forEach((loc, index) => {
                tableHtml += `
                    <tr>
                        <td style="padding: 8px;">${index + 1}</td>
                        <td style="padding: 8px;">${loc.date}</td>
                        <td style="padding: 8px;">${loc.location}</td>
                        <td style="padding: 8px;">${categoryMapping[loc.category]?.name || "其他"}</td>
                        <td style="padding: 8px;">${loc.description}</td>
                    </tr>`;
            });
            tableHtml += `</tbody></table>`;

            const printableHtml = `
                <html>
                <head>
                    <title>我的旅遊行程 - 可列印版</title>
                    <meta charset="UTF-8">
                    <link rel="stylesheet" href="style.css">
                    <link rel="preconnect" href="https://fonts.googleapis.com">
                    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
                    <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;700&display=swap" rel="stylesheet">
                    <style>
                        body {
                            overflow-y: auto !important;
                            background-color: #ffffff;
                            font-family: 'Noto Sans TC', sans-serif; 
                            margin: 20px;
                        }
                        @media print {
                            @page { margin: 20mm; }
                            body { margin: 0; }
                            h1, p { margin-bottom: 15px; }
                            table { page-break-inside: auto; }
                            tr { page-break-inside: avoid; page-break-after: auto; }
                        }
                    </style>
                </head>
                <body>
                    <h1>我的旅遊行程</h1>
                    <p>${statsText}</p>
                    ${tableHtml}
                </body>
                </html>`;

            const newWindow = window.open();
            newWindow.document.write(printableHtml);
            newWindow.document.close();

            setTimeout(() => {
                newWindow.print();
            }, 500);
        });

        const filtersHandle = document.getElementById("filters-handle");
        const filtersContainer = document.getElementById("filters");
        filtersHandle.addEventListener("click", () => {
            filtersContainer.classList.toggle("collapsed");
            filtersHandle.classList.toggle("collapsed");
        });
    }

    // --- 工具函式 ---
    function showToast(message, type = "normal") {
        const toast = document.createElement("div");
        toast.className = `toast-message ${type}`;
        toast.innerText = message;
        document.body.appendChild(toast);
        setTimeout(() => toast.classList.add("show"), 10);
        setTimeout(() => {
            toast.classList.remove("show");
            toast.addEventListener("transitionend", () => toast.remove());
        }, 3000);
    }

    // --- 啟動程式 ---
    main();
});
