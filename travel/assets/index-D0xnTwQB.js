(function () {
  const s = document.createElement("link").relList;
  if (s && s.supports && s.supports("modulepreload")) return;
  for (const r of document.querySelectorAll('link[rel="modulepreload"]')) l(r);
  new MutationObserver((r) => {
    for (const m of r)
      if (m.type === "childList")
        for (const h of m.addedNodes)
          h.tagName === "LINK" && h.rel === "modulepreload" && l(h);
  }).observe(document, { childList: !0, subtree: !0 });
  function a(r) {
    const m = {};
    return (
      r.integrity && (m.integrity = r.integrity),
      r.referrerPolicy && (m.referrerPolicy = r.referrerPolicy),
      r.crossOrigin === "use-credentials"
        ? (m.credentials = "include")
        : r.crossOrigin === "anonymous"
          ? (m.credentials = "omit")
          : (m.credentials = "same-origin"),
      m
    );
  }
  function l(r) {
    if (r.ep) return;
    r.ep = !0;
    const m = a(r);
    fetch(r.href, m);
  }
})();
function E(t) {
  return t
    ? t
        .toString()
        .replace(
          /[&<>"']/g,
          (s) =>
            ({
              "&": "&amp;",
              "<": "&lt;",
              ">": "&gt;",
              '"': "&quot;",
              "'": "&#39;",
            })[s],
        )
    : "";
}
function G(t, s) {
  let a;
  return function (...l) {
    const r = this;
    (clearTimeout(a), (a = setTimeout(() => t.apply(r, l), s)));
  };
}
class J {
  dbInstance = null;
  DB_NAME = "TravelItinerariesDB_v3";
  STORE_NAME = "itineraries";
  async init() {
    return this.dbInstance
      ? this.dbInstance
      : new Promise((s, a) => {
          const l = indexedDB.open(this.DB_NAME, 1);
          ((l.onerror = (r) => a("資料庫開啟失敗", r.target.error)),
            (l.onsuccess = (r) => {
              ((this.dbInstance = r.target.result), s(this.dbInstance));
            }),
            (l.onupgradeneeded = (r) => {
              const m = r.target.result;
              m.objectStoreNames.contains(this.STORE_NAME) ||
                m.createObjectStore(this.STORE_NAME, { keyPath: "id" });
            }));
        });
  }
  async getStore(s = "readonly") {
    return (
      this.dbInstance || (await this.init()),
      this.dbInstance
        .transaction(this.STORE_NAME, s)
        .objectStore(this.STORE_NAME)
    );
  }
  async saveItinerary(s) {
    const a = await this.getStore("readwrite");
    return new Promise((l, r) => {
      const m = a.put(s);
      ((m.onsuccess = l), (m.onerror = r));
    });
  }
  async deleteItinerary(s) {
    const a = await this.getStore("readwrite");
    return new Promise((l, r) => {
      const m = a.delete(s);
      ((m.onsuccess = l), (m.onerror = r));
    });
  }
  async getItineraries() {
    const s = await this.getStore();
    return new Promise((a, l) => {
      const r = s.getAll();
      ((r.onsuccess = () => a(r.result)), (r.onerror = l));
    });
  }
  async getItineraryById(s) {
    const a = await this.getStore();
    return new Promise((l, r) => {
      const m = a.get(s);
      ((m.onsuccess = () => l(m.result)), (m.onerror = r));
    });
  }
}
let I = {},
  b = {},
  B,
  H,
  k,
  P;
const U = {
    sight: { name: "景點", color: "var(--category-sight)" },
    stay: { name: "住宿", color: "var(--category-stay)" },
    transport: { name: "交通", color: "var(--category-transport)" },
    food: { name: "餐飲", color: "var(--category-food)" },
    default: { name: "其他", color: "var(--category-default)" },
  },
  i = {
    init(t) {
      ((I = t.elements),
        (b = t.globalState),
        (B = t.map),
        (H = t.tileLayer),
        (k = t.layerGroup),
        (P = t.getFilteredLocations));
    },
    toggleModal(t, s) {
      t && t.classList.toggle("hidden", !s);
    },
    showToast(t, s = "normal") {
      const a = document.createElement("div");
      ((a.className = `toast-message ${s}`),
        (a.textContent = t),
        document.body.appendChild(a),
        setTimeout(() => a.classList.add("show"), 10),
        setTimeout(() => {
          (a.classList.remove("show"),
            a.addEventListener("transitionend", () => a.remove()));
        }, 3e3));
    },
    updateAuthUI() {
      const { userInfo: t, guestInfo: s, manageBtn: a, userEmail: l } = I,
        { firebaseUser: r, appMode: m } = b;
      (m === "cloud" && r
        ? ((l.textContent = r.email),
          t.classList.remove("hidden"),
          s.classList.add("hidden"),
          (a.disabled = !1))
        : (t.classList.add("hidden"),
          s.classList.remove("hidden"),
          (a.disabled = !1)),
        m === "local" && s.classList.add("hidden"));
    },
    createItineraryList(t, s) {
      const { itineraryListContainer: a } = I;
      if (b.appMode === "cloud" && !b.firebaseUser && t.length > 0) return;
      if (t.length === 0) {
        a.innerHTML =
          '<p class="empty-message">此行程沒有任何地點，點擊下方按鈕新增第一個景點吧！</p>';
        return;
      }
      const l = t.reduce(
          (h, c) => (h[c.date] || (h[c.date] = []), h[c.date].push(c), h),
          {},
        ),
        r = b.filter.date !== "all" || b.filter.category !== "all",
        m = Object.keys(l)
          .sort()
          .map((h) => {
            const e = l[h]
              .map(($) => {
                const x = s.some((T) => T.id === $.id);
                if (r && !x) return "";
                const C = U[$.category] || U.default,
                  A = s.findIndex((T) => T.id === $.id),
                  j = x ? A + 1 : "•",
                  O = E($.location);
                return `<div class="location-item" data-id="${$.id}" draggable="true"><span class="location-number" style="color: ${C.color};">${j}</span><p>${O}</p><span class="category-badge" style="background-color: ${C.color};">${C.name}</span>
                            <div class="location-controls">
                                <button class="edit-btn" title="編輯">✏️</button>
                                <button class="delete-btn" title="刪除">🗑️</button>
                            </div>
                        </div>`;
              })
              .join("");
            return e
              ? `<div class="day-group"><div class="day-header">${h}</div>${e}</div>`
              : "";
          })
          .join("");
      a.innerHTML =
        m || '<p class="empty-message">沒有符合篩選條件的景點。</p>';
    },
    createFilterControls(t) {
      const { dateFiltersContainer: s, categoryFiltersContainer: a } = I,
        r = [...new Set(t.map((c) => c.date))]
          .sort()
          .map(
            (c) =>
              `<button data-date="${c}" class="${b.filter.date === c ? "active" : ""}">${c}</button>`,
          )
          .join("");
      s.innerHTML = `<button data-date="all" class="${b.filter.date === "all" ? "active" : ""}">全部日期</button>${r}`;
      const h = [...new Set(t.map((c) => c.category))]
        .map((c) => {
          const e = U[c] || U.default;
          return `<button data-category="${c}" class="${b.filter.category === c ? "active" : ""}">${e.name}</button>`;
        })
        .join("");
      a.innerHTML = `<button data-category="all" class="${b.filter.category === "all" ? "active" : ""}">全部分類</button>${h}`;
    },
    refreshUI() {
      if (!b.currentItinerary) return this.resetUI();
      const t = b.currentItinerary.locations,
        s = P();
      ((I.itineraryTitleEl.textContent = b.currentItinerary.name),
        I.addLocationContainer.classList.toggle("hidden", !b.currentItinerary),
        this.createFilterControls(t),
        this.createItineraryList(t, s),
        this.drawMap(s),
        this.updateStats(t));
    },
    resetUI() {
      let t = "請從「管理」建立或載入一個行程";
      (b.appMode === "cloud" &&
        !b.firebaseUser &&
        (t = "請先登入以管理您的行程"),
        (I.itineraryTitleEl.textContent = "尚未載入行程"),
        I.addLocationContainer.classList.add("hidden"),
        (I.itineraryListContainer.innerHTML = `<p class="empty-message">${t}</p>`),
        (I.dateFiltersContainer.innerHTML = ""),
        (I.categoryFiltersContainer.innerHTML = ""),
        k && k.clearLayers(),
        this.updateStats([]));
    },
    drawMap(t) {
      if (!B || (k.clearLayers(), t.length === 0)) return;
      const s = L.latLngBounds();
      t.forEach((a, l) => {
        const r = U[a.category] || U.default,
          m = L.divIcon({
            html: `<div style="background-color: ${r.color}; width: 28px; height: 28px; border-radius: 50%; border: 2px solid white; box-shadow: var(--shadow); display: flex; justify-content: center; align-items: center; color: white; font-size: 14px; font-weight: bold;">${l + 1}</div>`,
            className: "custom-marker-icon",
            iconSize: [28, 28],
            iconAnchor: [14, 14],
          }),
          h = L.marker(a.coordinates, { icon: m }),
          c = `<b>${E(a.location)}</b><br>${E(a.description || "無描述")}`;
        (h.bindPopup(c), h.addTo(k), s.extend(a.coordinates));
      });
      for (let a = 0; a < t.length - 1; a++)
        t[a].date === t[a + 1].date &&
          L.polyline([t[a].coordinates, t[a + 1].coordinates], {
            color: "#3388ff",
            weight: 3,
            opacity: 0.7,
          }).addTo(k);
      s.isValid() && B.fitBounds(s.pad(0.2), { maxZoom: 15 });
    },
    updateStats(t) {
      ((I.statsDays.innerText = new Set(t.map((a) => a.date)).size),
        (I.statsLocations.innerText = t.length));
      let s = 0;
      (B &&
        t.forEach((a, l) => {
          l > 0 &&
            a.date === t[l - 1].date &&
            (s += B.distance(a.coordinates, t[l - 1].coordinates));
        }),
        (I.statsDistance.innerText = (s / 1e3).toFixed(1)));
    },
    showOfflineWarning(t) {
      const {
        offlineWarningBanner: s,
        appContainer: a,
        searchLocationBtn: l,
      } = I;
      (s.classList.toggle("hidden", !t),
        a.classList.toggle("offline", t),
        t
          ? (document.documentElement.style.setProperty(
              "--primary-color",
              "#e67e22",
            ),
            l && ((l.disabled = !0), (l.title = "離線模式下無法使用搜尋功能")))
          : (document.documentElement.style.setProperty(
              "--primary-color",
              "#3498db",
            ),
            l && ((l.disabled = !1), (l.title = ""))),
        this.handleMapOfflineState(t));
    },
    handleMapOfflineState(t) {
      B &&
        (I.mapOfflinePlaceholder.classList.toggle("hidden", !t),
        t ? B.hasLayer(H) && B.removeLayer(H) : B.hasLayer(H) || H.addTo(B));
    },
  };
function V() {
  {
    console.warn("Google Analytics Measurement ID 尚未設定。");
    return;
  }
}
document.addEventListener("DOMContentLoaded", () => {
  const t = new J(),
    s = {
      apiKey: "AIzaSyCavD0SHOLcQBwjJJ3aCGCY7Po-t4QR31k",
      authDomain: "travel-itinerary-helper.firebaseapp.com",
      projectId: "travel-itinerary-helper",
      storageBucket: "travel-itinerary-helper.firebasestorage.app",
      messagingSenderId: "853427118697",
      appId: "1:853427118697:web:c2d4520a4fc565b98438f8",
      measurementId: void 0,
    };
  let a, l, r, m, h;
  const c = {
      mapElement: document.getElementById("map"),
      itineraryPanel: document.getElementById("itinerary-panel"),
      panelHandle: document.getElementById("panel-handle"),
      itineraryListContainer: document.getElementById("itinerary-list"),
      dateFiltersContainer: document.getElementById("date-filters"),
      categoryFiltersContainer: document.getElementById("category-filters"),
      itineraryTitleEl: document.getElementById("itinerary-title"),
      addLocationContainer: document.getElementById("add-location-container"),
      mapOfflinePlaceholder: document.getElementById("map-offline-placeholder"),
      filters: document.getElementById("filters"),
      filtersHandle: document.getElementById("filters-handle"),
      coordinatesWarning: document.getElementById("coordinates-warning"),
      userInfo: document.getElementById("user-info"),
      guestInfo: document.getElementById("guest-info"),
      manageBtn: document.getElementById("manage-itineraries-btn"),
      userEmail: document.getElementById("user-email"),
      statsDays: document.getElementById("stats-days"),
      statsLocations: document.getElementById("stats-locations"),
      statsDistance: document.getElementById("stats-distance"),
      offlineWarningBanner: document.getElementById("offline-warning-banner"),
      appContainer: document.getElementById("app-container"),
      searchLocationBtn: document.getElementById("search-location-btn"),
    },
    e = {
      appMode: "cloud",
      firebaseUser: null,
      currentItinerary: null,
      filter: { date: "all", category: "all" },
      editingLocationId: null,
    };
  async function $() {
    try {
      (firebase.initializeApp(s),
        (a = firebase.auth()),
        (l = firebase.firestore()),
        await a.getRedirectResult(),
        (e.appMode = "cloud"),
        console.log("Firebase connected. Running in Cloud Mode."),
        a.onAuthStateChanged((g) => {
          ((e.firebaseUser = g),
            i.updateAuthUI(),
            i.resetUI(),
            g
              ? i.showToast(`歡迎, ${g.email}!`, "success")
              : i.showToast("您已登出"));
        }));
    } catch (g) {
      (console.error("Firebase connection failed:", g),
        (e.appMode = "local"),
        console.log("Running in Local Mode."),
        i.updateAuthUI(),
        i.resetUI(),
        i.showOfflineWarning(!0),
        setTimeout(T, 100));
    }
  }
  async function x() {
    if (!e.currentItinerary) return;
    if ((e.currentItinerary.dataSource || "local") === "cloud") {
      if (e.appMode !== "cloud" || !e.firebaseUser)
        return i.showToast(
          "無法儲存雲端行程，請檢查網路連線並重新整理",
          "error",
        );
      await l
        .collection("itineraries")
        .doc(e.currentItinerary.id)
        .set(e.currentItinerary, { merge: !0 });
    } else await t.saveItinerary(e.currentItinerary);
    i.showToast("行程已儲存！", "success");
  }
  async function C(g, f) {
    if (f === "cloud") {
      if (!e.firebaseUser) return i.showToast("請先登入", "error");
      await l.collection("itineraries").doc(g).delete();
    } else await t.deleteItinerary(g);
  }
  function A() {
    return e.currentItinerary
      ? e.currentItinerary.locations.filter(
          (g) =>
            (e.filter.date === "all" || g.date === e.filter.date) &&
            (e.filter.category === "all" || g.category === e.filter.category),
        )
      : [];
  }
  async function j() {
    if (!e.currentItinerary) return;
    const g = document.getElementById("location-name").value,
      f = document.getElementById("location-date").value,
      o = document.getElementById("location-category").value,
      n = document.getElementById("location-description").value,
      d = document.getElementById("location-coordinates").value;
    if (!g || !f || !d)
      return i.showToast("地點名稱、日期和座標為必填項", "error");
    const u = d.split(",").map(Number);
    if (u.length !== 2 || isNaN(u[0]) || isNaN(u[1]))
      return i.showToast("座標格式不正確", "error");
    const y = {
      date: f,
      location: g,
      category: o,
      description: n,
      coordinates: u,
    };
    if (e.editingLocationId) {
      const p = e.currentItinerary.locations.findIndex(
        (w) => w.id === e.editingLocationId,
      );
      p > -1 &&
        (e.currentItinerary.locations[p] = {
          ...e.currentItinerary.locations[p],
          ...y,
        });
    } else
      ((y.id = `loc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`),
        e.currentItinerary.locations.push(y));
    e.currentItinerary.locations.sort(
      (p, w) => new Date(p.date) - new Date(w.date),
    );
    try {
      (await x(),
        i.showToast("景點已儲存！", "success"),
        i.toggleModal(document.getElementById("edit-location-modal"), !1),
        i.refreshUI());
    } catch (p) {
      i.showToast(`儲存失敗: ${p.message}`, "error");
    }
  }
  const O = G(async () => {
    const g = document.getElementById("location-name").value;
    if (!g) return;
    const f = document.getElementById("location-search-results");
    f.innerHTML = "搜尋中...";
    try {
      const o = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(g)}&limit=5`,
        { headers: { "User-Agent": "TravelItineraryHelper/3.0" } },
      );
      if (!o.ok) throw new Error("API 請求失敗");
      const n = await o.json();
      n.length === 0
        ? (f.innerHTML = "找不到結果")
        : (f.innerHTML = n
            .map(
              (d) =>
                `<div class="search-result-item" data-lat="${d.lat}" data-lon="${d.lon}">${E(d.display_name)}</div>`,
            )
            .join(""));
    } catch (o) {
      ((f.innerHTML = "搜尋時發生錯誤"), i.showToast(o.message, "error"));
    }
  }, 500);
  function D(g, f) {
    ((g.dataSource = f),
      (e.currentItinerary = g),
      (e.filter = { date: "all", category: "all" }),
      i.refreshUI(),
      i.toggleModal(document.getElementById("itinerary-manager-modal"), !1));
  }
  async function T() {
    const g = document.getElementById("itinerary-manager-list");
    ((g.innerHTML = "<li>讀取中...</li>"),
      i.toggleModal(document.getElementById("itinerary-manager-modal"), !0));
    let f = "";
    if (e.appMode === "cloud" && e.firebaseUser) {
      f += "<h3>雲端行程</h3>";
      try {
        const d = (
          await l
            .collection("itineraries")
            .where("ownerId", "==", e.firebaseUser.uid)
            .orderBy("createdAt", "desc")
            .get()
        ).docs.map((u) => ({ id: u.id, ...u.data() }));
        d.length > 0
          ? (f += d
              .map(
                (
                  u,
                ) => `<li class="itinerary-manager-item" data-id="${u.id}" data-name="${E(u.name)}" data-source="cloud">
                                    <span class="itinerary-manager-item-name">${E(u.name)}</span>
                                    <div class="itinerary-manager-item-actions">
                                        <button class="load-btn">載入</button>
                                        <button class="delete-btn">刪除</button>
                                    </div>
                                </li>`,
              )
              .join(""))
          : (f += "<li>無雲端行程</li>");
      } catch (n) {
        ((f += "<li>讀取雲端行程失敗</li>"), console.error(n));
      }
    }
    const o =
      e.appMode === "local" ? "<h3>本地行程</h3>" : "<h3>離線/本地行程</h3>";
    f += o;
    try {
      const n = await t.getItineraries();
      n.length > 0
        ? (f += n
            .map(
              (
                d,
              ) => `<li class="itinerary-manager-item" data-id="${d.id}" data-name="${E(d.name)}" data-source="local">
                                <span class="itinerary-manager-item-name">${E(d.name)}</span>
                                <div class="itinerary-manager-item-actions">
                                    <button class="load-btn">載入</button>
                                    ${e.appMode === "cloud" && e.firebaseUser ? '<button class="upload-btn">上傳至雲端</button>' : ""}
                                    <button class="delete-btn">刪除</button>
                                </div>
                            </li>`,
            )
            .join(""))
        : (f += "<li>無本地行程</li>");
    } catch (n) {
      ((f += "<li>讀取本地行程失敗</li>"), console.error(n));
    }
    g.innerHTML = f;
  }
  function R() {
    (document
      .querySelectorAll(".close-modal-btn")
      .forEach((o) =>
        o.addEventListener("click", () =>
          i.toggleModal(o.closest(".modal-backdrop"), !1),
        ),
      ),
      document
        .getElementById("show-login-btn")
        .addEventListener("click", () =>
          i.toggleModal(document.getElementById("login-modal"), !0),
        ),
      document
        .getElementById("logout-btn")
        .addEventListener("click", () => a.signOut()),
      document
        .getElementById("login-btn")
        .addEventListener("click", async () => {
          const o = document.getElementById("login-email").value,
            n = document.getElementById("login-password").value;
          if (!o || !n) return i.showToast("請輸入電子郵件和密碼", "warning");
          try {
            (await a.signInWithEmailAndPassword(o, n),
              i.toggleModal(document.getElementById("login-modal"), !1));
          } catch (d) {
            i.showToast(`登入失敗: ${d.message}`, "error");
          }
        }),
      document
        .getElementById("manage-itineraries-btn")
        .addEventListener("click", T),
      document
        .getElementById("itinerary-manager-list")
        .addEventListener("click", async (o) => {
          const n = o.target,
            d = n.closest(".itinerary-manager-item");
          if (!d) return;
          const u = d.dataset.id,
            y = d.dataset.source,
            p = d.dataset.name;
          if (n.classList.contains("load-btn")) {
            let w;
            if (y === "cloud") {
              const v = await l.collection("itineraries").doc(u).get();
              w = { id: v.id, ...v.data() };
            } else w = await t.getItineraryById(u);
            w && D(w, y);
          } else if (n.classList.contains("delete-btn"))
            confirm(
              `確定要從 ${y === "cloud" ? "雲端" : "本機"} 刪除行程 "${p}" 嗎？`,
            ) &&
              (await C(u, y),
              e.currentItinerary && e.currentItinerary.id === u && i.resetUI(),
              i.showToast("行程已刪除", "success"),
              T());
          else if (n.classList.contains("upload-btn")) {
            if (!e.firebaseUser)
              return i.showToast("請先登入才能上傳", "error");
            const w = await t.getItineraryById(u);
            if (!w) return i.showToast("找不到本地行程", "error");
            const v = {
              ...w,
              ownerId: e.firebaseUser.uid,
              createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            };
            (delete v.hash,
              delete v.salt,
              await l.collection("itineraries").doc(v.id).set(v),
              i.showToast("行程已成功上傳至雲端！", "success"),
              confirm("上傳成功，要刪除這台電腦上的本地副本嗎？") &&
                (await C(u, "local")),
              T());
          }
        }),
      document
        .getElementById("create-new-itinerary-btn")
        .addEventListener("click", () => {
          ((document.getElementById("new-itinerary-name").value = ""),
            i.toggleModal(
              document.getElementById("create-itinerary-modal"),
              !0,
            ));
        }),
      document
        .getElementById("save-new-itinerary-btn")
        .addEventListener("click", async () => {
          const o = document.getElementById("new-itinerary-name").value;
          if (!o) return i.showToast("請輸入行程名稱", "error");
          if (e.appMode === "local" || !e.firebaseUser) {
            const n = {
              id: `local_${Date.now()}`,
              name: o,
              locations: [],
              createdAt: new Date().toISOString(),
            };
            (await t.saveItinerary(n),
              D(n, "local"),
              i.showToast("本地行程已建立!", "success"));
          } else {
            const n = {
                name: o,
                ownerId: e.firebaseUser.uid,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                locations: [],
              },
              d = await l.collection("itineraries").add(n);
            (D({ id: d.id, ...n }, "cloud"),
              i.showToast("雲端行程已建立!", "success"));
          }
          (i.toggleModal(document.getElementById("create-itinerary-modal"), !1),
            i.toggleModal(
              document.getElementById("itinerary-manager-modal"),
              !1,
            ));
        }),
      document
        .getElementById("add-location-btn")
        .addEventListener("click", () => {
          ((e.editingLocationId = null),
            (document.getElementById("edit-location-title").textContent =
              "新增景點"));
          let o = new Date().toISOString().split("T")[0];
          (e.currentItinerary.locations.length > 0 &&
            (o =
              e.currentItinerary.locations[
                e.currentItinerary.locations.length - 1
              ].date),
            (document.getElementById("location-name").value = ""),
            (document.getElementById("location-date").value = o),
            (document.getElementById("location-category").value = "sight"),
            (document.getElementById("location-description").value = ""),
            (document.getElementById("location-coordinates").value = ""),
            (document.getElementById("location-search-results").innerHTML = ""),
            c.coordinatesWarning.classList.add("hidden"),
            i.toggleModal(document.getElementById("edit-location-modal"), !0));
        }),
      document.getElementById("save-location-btn").addEventListener("click", j),
      document
        .getElementById("search-location-btn")
        .addEventListener("click", O),
      document
        .getElementById("location-coordinates")
        .addEventListener("input", () => {
          c.coordinatesWarning.classList.remove("hidden");
        }),
      document
        .getElementById("location-search-results")
        .addEventListener("click", (o) => {
          const n = o.target.closest(".search-result-item");
          n &&
            ((document.getElementById("location-name").value = n.textContent),
            (document.getElementById("location-coordinates").value =
              `${n.dataset.lat}, ${n.dataset.lon}`),
            (document.getElementById("location-search-results").innerHTML = ""),
            c.coordinatesWarning.classList.add("hidden"));
        }),
      c.itineraryListContainer.addEventListener("click", (o) => {
        if (
          (e.appMode === "cloud" && !e.firebaseUser && !e.currentItinerary) ||
          !e.currentItinerary
        )
          return;
        const n = o.target,
          d = n.closest(".location-item");
        if (!d) return;
        const u = d.dataset.id,
          y = e.currentItinerary.locations.find((p) => p.id === u);
        n.closest(".edit-btn")
          ? ((e.editingLocationId = u),
            (document.getElementById("edit-location-title").textContent =
              "編輯景點"),
            (document.getElementById("location-name").value = y.location),
            (document.getElementById("location-date").value = y.date),
            (document.getElementById("location-category").value = y.category),
            (document.getElementById("location-description").value =
              y.description),
            (document.getElementById("location-coordinates").value =
              y.coordinates.join(", ")),
            (document.getElementById("location-search-results").innerHTML = ""),
            c.coordinatesWarning.classList.add("hidden"),
            i.toggleModal(document.getElementById("edit-location-modal"), !0))
          : n.closest(".delete-btn")
            ? confirm(`確定要刪除景點 "${y.location}" 嗎？`) &&
              ((e.currentItinerary.locations =
                e.currentItinerary.locations.filter((p) => p.id !== u)),
              x().then(() => i.refreshUI()))
            : y && r.flyTo(y.coordinates, 15);
      }));
    let g = null;
    (c.itineraryListContainer.addEventListener("dragstart", (o) => {
      if (!e.currentItinerary) return;
      const n = o.target.closest(".location-item");
      n &&
        ((g = n.dataset.id), setTimeout(() => n.classList.add("dragging"), 0));
    }),
      c.itineraryListContainer.addEventListener("dragover", (o) => {
        g && o.preventDefault();
      }),
      c.itineraryListContainer.addEventListener("drop", (o) => {
        if (!g) return;
        o.preventDefault();
        const n = o.target.closest(".location-item"),
          d = e.currentItinerary.locations.findIndex((y) => y.id === g);
        let u = e.currentItinerary.locations.findIndex(
          (y) => y.id === n?.dataset.id,
        );
        if (d !== -1 && u !== -1 && d !== u) {
          const [y] = e.currentItinerary.locations.splice(d, 1);
          (e.currentItinerary.locations.splice(u, 0, y),
            (y.date = e.currentItinerary.locations[u].date),
            x().then(() => i.refreshUI()));
        }
        ((g = null),
          document.querySelector(".dragging")?.classList.remove("dragging"));
      }),
      c.itineraryListContainer.addEventListener("dragend", () => {
        ((g = null),
          document.querySelector(".dragging")?.classList.remove("dragging"));
      }),
      c.filters.addEventListener("click", (o) => {
        if (o.target.tagName !== "BUTTON") return;
        const n = o.target;
        (n.dataset.date !== void 0 && (e.filter.date = n.dataset.date),
          n.dataset.category !== void 0 &&
            (e.filter.category = n.dataset.category),
          i.refreshUI());
      }),
      c.panelHandle.addEventListener("click", () => {
        (c.itineraryPanel.classList.toggle("open"),
          c.panelHandle.classList.toggle("open"),
          r && setTimeout(() => r.invalidateSize(!0), 300));
      }),
      c.filtersHandle.addEventListener("click", () => {
        (c.filters.classList.toggle("collapsed"),
          c.filtersHandle.classList.toggle("collapsed"));
      }),
      document.getElementById("export-json").addEventListener("click", () => {
        if (!e.currentItinerary) return i.showToast("尚未載入行程", "warning");
        const o = JSON.stringify(e.currentItinerary, null, 4),
          n = new Blob([o], { type: "application/json" }),
          d = URL.createObjectURL(n),
          u = document.createElement("a");
        ((u.href = d),
          (u.download = `${e.currentItinerary.name}.json`),
          document.body.appendChild(u),
          u.click(),
          document.body.removeChild(u),
          URL.revokeObjectURL(d));
      }),
      document
        .getElementById("export-printable")
        .addEventListener("click", () => {
          if (!e.currentItinerary || e.currentItinerary.locations.length === 0)
            return i.showToast("沒有可列印的行程資料", "warning");
          const { name: o, locations: n } = e.currentItinerary;
          i.showToast("正在準備預覽頁面...", "normal");
          const d = n.reduce(
              (M, S) => ((M[S.date] = M[S.date] || []), M[S.date].push(S), M),
              {},
            ),
            u = c.statsDays.innerText,
            y = c.statsLocations.innerText,
            p = c.statsDistance.innerText,
            w = `總天數: ${u} 天 | 總地點: ${y} 個 | 總距離: ${p} km`;
          let v =
              '<table border=1 style="width:100%;border-collapse:collapse;font-size:12px;border-color:#ccc"><thead><tr style=background-color:#f2f2f2><th style="padding:8px;width:40px">#</th><th style=padding:8px>地點</th><th style="padding:8px;width:80px">分類</th><th style=padding:8px>描述</th></tr></thead><tbody>',
            z = 1;
          for (const M of Object.keys(d).sort()) {
            const S = new Date(M).toLocaleDateString("zh-TW", {
              weekday: "long",
            });
            v += `<tr style="background-color:#e9ecef;font-weight:bold"><td colspan=4 style="padding:10px;border-left:none;border-right:none">${M} (${S})</td></tr>`;
            for (const N of d[M]) {
              const W = {
                sight: { name: "景點" },
                stay: { name: "住宿" },
                transport: { name: "交通" },
                food: { name: "餐飲" },
                default: { name: "其他" },
              };
              v += `<tr><td style="padding:8px;text-align:center">${z++}</td><td style=padding:8px>${E(N.location)}</td><td style=padding:8px>${E(W[N.category]?.name || "其他")}</td><td style=padding:8px>${E(N.description)}</td></tr>`;
            }
          }
          v += "</tbody></table>";
          const _ = `<html><head><title>${E(o)} - 可列印版</title><meta charset=UTF-8><style>body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;margin:20px}h1{color:#2c3e50}p{color:#333}table{border:1px solid #ccc}th,td{border:1px solid #ccc}@media print{@page{margin:20mm}body{margin:0;-webkit-print-color-adjust:exact;print-color-adjust:exact}h1,p{margin-bottom:15px}table{page-break-inside:auto}tr{page-break-inside:avoid;page-break-after:auto}}</style></head><body><h1>${E(o)}</h1><p>${E(w)}</p>${v}</body></html>`,
            F = window.open();
          (F.document.write(_),
            F.document.close(),
            setTimeout(() => F.print(), 500));
        }));
    const f = document.getElementById("json-file-input");
    (document
      .getElementById("load-from-json-btn")
      .addEventListener("click", () => {
        f.click();
      }),
      f.addEventListener("change", (o) => {
        const n = o.target.files[0];
        if (!n) return;
        const d = new FileReader();
        ((d.onload = async (u) => {
          try {
            const y = u.target.result,
              p = JSON.parse(y);
            if (!p || !p.id || !p.name || !Array.isArray(p.locations))
              throw new Error("檔案內容並非有效的行程格式。");
            (delete p.ownerId,
              (p.dataSource = "local"),
              await t.saveItinerary(p),
              i.showToast("行程已成功從 JSON 載入！", "success"),
              T());
          } catch (y) {
            (console.error("載入 JSON 失敗:", y),
              i.showToast(`載入失敗: ${y.message}`, "error"));
          } finally {
            o.target.value = null;
          }
        }),
          (d.onerror = () => {
            (i.showToast("讀取檔案時發生錯誤", "error"),
              (o.target.value = null));
          }),
          d.readAsText(n));
      }));
  }
  function q() {
    ((r = L.map(c.mapElement).setView([25.105497, 121.517594], 10)),
      (m = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(r)),
      (h = L.layerGroup().addTo(r)),
      (L.Control.Copyright = L.Control.extend({
        onAdd: function (o) {
          const n = L.DomUtil.create("div", "leaflet-control-copyright");
          return (
            (n.innerHTML = `&copy; <span id="currentYear"></span> Zanta's Utilities`),
            L.DomEvent.disableClickPropagation(n),
            n
          );
        },
        onRemove: function (o) {},
      })),
      new L.Control.Copyright({ position: "bottomleft" }).addTo(r),
      (document.getElementById("currentYear").textContent =
        new Date().getFullYear()),
      i.init({
        elements: c,
        globalState: e,
        map: r,
        tileLayer: m,
        layerGroup: h,
        getFilteredLocations: A,
      }),
      R(),
      $(),
      ["test", "development"].includes("production") || V());
  }
  q();
});
