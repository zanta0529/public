// script.js (修正列表編號與增加收合功能)

document.addEventListener("DOMContentLoaded", () => {
    // --- DOM 元素選擇 ---
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

    function main() {
        processAndValidateData(locationsData);
        if (state.locations.length > 0) {
            setupEventListeners();
            refreshUI();
            if (window.innerWidth > 768) {
                panel.classList.add("open");
            } else {
                panel.classList.remove("open");
            }
        } else {
            showToast("沒有有效的行程資料可以顯示", "warning");
        }
    }

    function processAndValidateData(rawData) {
        state.locations = rawData
            .map((item, index) => {
                if (
                    !item.date ||
                    !item.location ||
                    !/^\d{4}-\d{2}-\d{2}$/.test(item.date) ||
                    isNaN(new Date(item.date).getTime())
                ) {
                    return null;
                }
                if (
                    !item.coordinates ||
                    item.coordinates.length !== 2 ||
                    isNaN(item.coordinates[0]) ||
                    isNaN(item.coordinates[1])
                ) {
                    return null;
                }
                return {
                    ...item,
                    description: item.description || "無描述",
                    image: item.image || "",
                    category: item.category || "default",
                    id: `loc_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
                };
            })
            .filter(Boolean);
    }

    function refreshUI() {
        createFilterControls();
        const filteredLocations = getFilteredLocations();
        // 將 filteredLocations 傳遞給 createItineraryList
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

    function createFilterControls() {
        const dates = [...new Set(state.locations.map((loc) => loc.date))].sort();
        dateFiltersContainer.innerHTML = `<button data-date="all" class="${
            state.filter.date === "all" ? "active" : ""
        }">全部日期</button>`;
        dates.forEach((date) => {
            dateFiltersContainer.innerHTML += `<button data-date="${date}" class="${
                state.filter.date === date ? "active" : ""
            }">${date}</button>`;
        });
        const categories = [...new Set(state.locations.map((loc) => loc.category))];
        categoryFiltersContainer.innerHTML = `<button data-category="all" class="${
            state.filter.category === "all" ? "active" : ""
        }">全部分類</button>`;
        categories.forEach((cat) => {
            const categoryInfo = categoryMapping[cat] || categoryMapping.default;
            categoryFiltersContainer.innerHTML += `<button data-category="${cat}" class="${
                state.filter.category === cat ? "active" : ""
            }">${categoryInfo.name}</button>`;
        });
    }

    // ================================================================
    // REVISED: createItineraryList Function
    // ================================================================
    function createItineraryList(filteredLocations) {
        itineraryListContainer.innerHTML = "";

        // 根據篩選結果來決定編號，而非全域編號
        let visibleIndex = 1;

        const groupedByDate = state.locations.reduce((acc, loc) => {
            if (!acc[loc.date]) acc[loc.date] = [];
            acc[loc.date].push(loc);
            return acc;
        }, {});

        const isFilteringBySingleDay = state.filter.date !== "all";

        Object.keys(groupedByDate)
            .sort()
            .forEach((date) => {
                const dayGroup = document.createElement("div");
                dayGroup.className = "day-group";

                const dayHeader = document.createElement("div");
                dayHeader.className = "day-header";
                dayHeader.innerText = date;
                dayGroup.appendChild(dayHeader);

                // 如果是單日篩選，且目前日期不是被選中的日期，則收合
                if (isFilteringBySingleDay && date !== state.filter.date) {
                    dayGroup.classList.add("collapsed");
                }

                groupedByDate[date].forEach((loc) => {
                    // 只有在篩選結果中的地點才顯示
                    if (filteredLocations.some((filteredLoc) => filteredLoc.id === loc.id)) {
                        const item = document.createElement("div");
                        item.className = "location-item";
                        item.dataset.id = loc.id;
                        item.dataset.lat = loc.coordinates[0];
                        item.dataset.lng = loc.coordinates[1];
                        item.setAttribute("draggable", true);
                        const categoryInfo = categoryMapping[loc.category] || categoryMapping.default;
                        // 使用 visibleIndex 進行編號
                        item.innerHTML = ` <span class="location-number" style="color: ${
                            categoryInfo.color
                        };">${visibleIndex++}.</span> <p>${
                            loc.location
                        }</p> <span class="category-badge" style="background-color: ${categoryInfo.color};">${
                            categoryInfo.name
                        }</span> `;
                        dayGroup.appendChild(item);
                    }
                });

                // 如果群組中除了標題外沒有其他子項目(因為被篩選掉了)，則不顯示該群組
                if (dayGroup.children.length > 1) {
                    itineraryListContainer.appendChild(dayGroup);
                } else if (!isFilteringBySingleDay) {
                    // 如果不是單日篩選，但某一天所有行程都被分類篩選掉了，則不顯示該天空白的日期
                } else {
                    itineraryListContainer.appendChild(dayGroup); // 如果是單日篩選，要顯示被收合的日期
                }
            });
    }

    function drawMap(locationsToDraw) {
        layerGroup.clearLayers();
        if (locationsToDraw.length === 0) return;
        const bounds = L.latLngBounds();
        let visibleIndex = 1; // 地圖標記也從1開始
        locationsToDraw.forEach((loc) => {
            const categoryInfo = categoryMapping[loc.category] || categoryMapping.default;
            const marker = L.marker(loc.coordinates, {
                icon: L.divIcon({
                    html: `<div style="background-color: ${
                        categoryInfo.color
                    }; width: 28px; height: 28px; border-radius: 50%; border: 2px solid white; box-shadow: var(--shadow); display: flex; justify-content: center; align-items: center; color: white; font-size: 14px; font-weight: bold;">${visibleIndex++}</div>`,
                    className: "custom-marker-icon",
                    iconSize: [28, 28],
                    iconAnchor: [14, 14],
                }),
            }).bindPopup(createPopupContent(loc), { className: "custom-popup" });
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
        return `<div class="popup-header" style="background-color: ${categoryInfo.color};"> <h3>${
            loc.location
        }</h3> </div> <div class="popup-body"> <div class="popup-dates">${loc.date} (${categoryInfo.name})</div> <p>${
            loc.description
        }</p> ${loc.image ? `<img src="${loc.image}" alt="${loc.location}">` : ""} </div>`;
    }

    function updateStats() {
        document.getElementById("stats-days").innerText = [...new Set(state.locations.map((loc) => loc.date))].length;
        document.getElementById("stats-locations").innerText = state.locations.length;
        let totalDistance = 0;
        for (let i = 0; i < state.locations.length - 1; i++) {
            if (state.locations[i].date === state.locations[i + 1].date) {
                totalDistance += map.distance(state.locations[i].coordinates, state.locations[i + 1].coordinates);
            }
        }
        document.getElementById("stats-distance").innerText = (totalDistance / 1000).toFixed(1);
    }

    function setupEventListeners() {
        document.getElementById("filters").addEventListener("click", (e) => {
            if (e.target.tagName === "BUTTON") {
                if (e.target.dataset.date !== undefined) state.filter.date = e.target.dataset.date;
                if (e.target.dataset.category !== undefined) state.filter.category = e.target.dataset.category;
                refreshUI();
            }
        });

        // ================================================================
        // REVISED: Itinerary List Click Listener
        // ================================================================
        itineraryListContainer.addEventListener("click", (e) => {
            const locationItem = e.target.closest(".location-item");
            const dayHeader = e.target.closest(".day-header");

            // 點擊行程項目
            if (locationItem) {
                const lat = parseFloat(locationItem.dataset.lat);
                const lng = parseFloat(locationItem.dataset.lng);
                map.flyTo([lat, lng], 15);
                layerGroup.eachLayer((layer) => {
                    if (layer instanceof L.Marker && layer.getLatLng().equals([lat, lng])) {
                        setTimeout(() => layer.openPopup(), 300);
                    }
                });
                return; // 結束執行
            }

            // 點擊收合的日期標題
            if (dayHeader && dayHeader.parentElement.classList.contains("collapsed")) {
                const date = dayHeader.innerText;
                state.filter.date = date; // 將篩選器設定為該日期
                refreshUI(); // 重新整理UI
            }
        });

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
                const [movedItem] = state.locations.splice(fromIndex, 1);
                state.locations.splice(toIndex, 0, movedItem);
                refreshUI();
            }
            document.querySelector(".dragging")?.classList.remove("dragging");
            draggedItemId = null;
        });
        itineraryListContainer.addEventListener("dragend", () => {
            document.querySelector(".dragging")?.classList.remove("dragging");
            draggedItemId = null;
        });

        document.getElementById("search-input").addEventListener("input", (e) => {
            const query = e.target.value.toLowerCase();
            document.querySelectorAll(".location-item").forEach((item) => {
                item.style.display = item.querySelector("p").textContent.toLowerCase().includes(query)
                    ? "flex"
                    : "none";
            });
        });

        panelHandle.addEventListener("click", () => {
            panel.classList.toggle("open");
            setTimeout(() => map.invalidateSize(true), 300);
        });

        document.getElementById("coord-help-toggle").addEventListener("click", (e) => {
            e.preventDefault();
            document.getElementById("coord-help-content").style.display =
                document.getElementById("coord-help-content").style.display === "block" ? "none" : "block";
        });

        document.getElementById("export-json").addEventListener("click", () => {
            const jsonString = JSON.stringify(state.locations, null, 4);
            const blob = new Blob([jsonString], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "locations.json";
            a.click();
            URL.revokeObjectURL(url);
            showToast("行程資料已匯出為 locations.json！", "success");
        });

        // 匯出可列印頁面的按鈕事件
        document.getElementById("export-printable").addEventListener("click", () => {
            showToast("正在準備預覽頁面...", "normal");
            const statsDays = document.getElementById("stats-days").innerText;
            const statsLocations = document.getElementById("stats-locations").innerText;
            const statsDistance = document.getElementById("stats-distance").innerText;
            const statsText = `總天數: ${statsDays} 天  |  總地點: ${statsLocations} 個  |  總距離: ${statsDistance} km`;
            let tableHtml = `<table border="1" style="width: 100%; border-collapse: collapse; font-size: 12px;"><thead><tr style="background-color: #3498db; color: white;"><th style="padding: 8px;">#</th><th style="padding: 8px;">日期</th><th style="padding: 8px;">地點</th><th style="padding: 8px;">分類</th><th style="padding: 8px;">描述</th></tr></thead><tbody>`;
            state.locations.forEach((loc, index) => {
                tableHtml += `<tr><td style="padding: 8px;">${index + 1}</td><td style="padding: 8px;">${
                    loc.date
                }</td><td style="padding: 8px;">${loc.location}</td><td style="padding: 8px;">${
                    categoryMapping[loc.category]?.name || "其他"
                }</td><td style="padding: 8px;">${loc.description}</td></tr>`;
            });
            tableHtml += `</tbody></table>`;
            const printableHtml = `<html><head><title>我的旅遊行程 - 可列印版</title><meta charset="UTF-8"><link rel="stylesheet" href="style.css"><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;700&display=swap" rel="stylesheet"><style>body { font-family: 'Noto Sans TC', sans-serif; margin: 20px; } @media print { @page { margin: 20mm; } body { margin: 0; } h1, p { margin-bottom: 15px; } table { page-break-inside: auto; } tr { page-break-inside: avoid; page-break-after: auto; } }</style></head><body><h1>我的旅遊行程</h1><p>${statsText}</p>${tableHtml}</body></html>`;
            const newWindow = window.open();
            newWindow.document.write(printableHtml);
            newWindow.document.close();
            setTimeout(() => {
                newWindow.print();
            }, 500);
        });
    }

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

    main();
});
