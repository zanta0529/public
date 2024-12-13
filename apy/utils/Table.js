// ********************************************************************************
// *** Table 元件函式
// ********************************************************************************
// 建立一個 Table 類別
export class Table {
    // 建構子
    constructor(config) {
        // 語言語系設定，須優先指定語系及各語言文字內容否則會出錯
        this.language = config.language ? config.language : "cht";
        this.i18n = config.i18n
            ? config.i18n
            : {
                  cht: {
                      first: "第一頁",
                      prev: "上一頁",
                      next: "下一頁",
                      last: "最末頁",
                      goto: "跳轉",
                      noData: "目前無資料",
                      search: "搜尋文字：",
                      rowsPerPage: "每頁顯示筆數：",
                      displayAll: "== 全部顯示 ==",
                      totalRecords: "資料筆數：",
                  },
                  eng: {
                      first: "First",
                      prev: "Prev",
                      next: "Next",
                      last: "Last",
                      goto: "Go To",
                      noData: "No data so far",
                      search: "Search: ",
                      rowsPerPage: "Rows per page: ",
                      displayAll: "== ALL ==",
                      totalRecords: "Records: ",
                  },
              };

        this.data = config.data;
        this.columns = config.columns;
        this.container = config.container;
        this.lastUpdatedTime = new Date().toLocaleString(); // 設置最新更新時間

        const functionalContainer = document.createElement("div");
        functionalContainer.setAttribute("class", "ztFunctionalContainer");
        this.container.parentNode.insertBefore(functionalContainer, this.container);

        // 搜尋方塊
        if (config.search) {
            const spanCtrl = document.createElement("span");
            spanCtrl.innerHTML = `
                        <span>${this.i18n[this.language].search}</span>
                        <input type="text">
                    `;

            const input = spanCtrl.querySelector("input");
            input.setAttribute("class", "ztSearchTerm");
            this.search = input;
            this.search.addEventListener("input", (event) => {
                this.setSearchTerm(event.target.value);
            });
            functionalContainer.appendChild(spanCtrl);
        }

        // 每頁顯示筆數設定
        if (config.rowsPerPage) {
            const spanCtrl = document.createElement("span");
            spanCtrl.innerHTML = `
                        <span>${this.i18n[this.language].rowsPerPage}</span>
                        <select></select>
                    `;

            const select = spanCtrl.querySelector("select");
            select.setAttribute("class", "ztRowsPerPage");
            this.rowsPerPage = select;
            this.rowsPerPage.addEventListener("change", (event) => {
                this.setRowsPerPage(parseInt(event.target.value));
            });
            this.generateOptions(this.rowsPerPage);
            functionalContainer.appendChild(spanCtrl);
        }

        this.navigatorStyle = config.navigatorStyle ? config.navigatorStyle : 1;
        this.currentPage = 1;
        this.rowsPerPage = 10;
        this.searchTerm = "";
        this.sortColumn = this.columns.find((col) => col.defaultSortColumn === true).field; // 設定預設排序欄位
        this.sortDirection = "▲";
        this.render();
    }

    // 異動表格資料
    initializeData(data) {
        this.data = data;
        this.render();
    }

    // 設置每頁顯示的行數
    setRowsPerPage(rows) {
        this.rowsPerPage = rows;
        this.currentPage = 1;
        this.render();
    }

    // 設置搜索詞
    setSearchTerm(term) {
        this.searchTerm = term;
        this.currentPage = 1;
        this.render();
    }

    // 設置排序欄位和方向，▲ 表示 asc，▼ 表示 desc
    setSort(column) {
        if (this.sortColumn === column) {
            this.sortDirection = this.sortDirection === "▲" ? "▼" : "▲";
        } else {
            this.sortColumn = column;
            this.sortDirection = "▲";
        }
        this.render();
    }

    // 獲取過濾和排序後的數據
    getProcessedData() {
        if (!this.data) {
            return [];
        }

        let data = [...this.data];
        if (this.searchTerm) {
            data = data.filter((row) =>
                Object.values(row).some(
                    (value) =>
                        value !== undefined &&
                        value !== null &&
                        value.toString().toLowerCase().includes(this.searchTerm.toLowerCase())
                )
            );
        }

        if (this.sortColumn) {
            data.sort((a, b) => {
                // 提取文本內容
                const aValue = a[this.sortColumn] ? a[this.sortColumn].toString().replace(/<[^>]*>/g, "") : "";
                const bValue = b[this.sortColumn] ? b[this.sortColumn].toString().replace(/<[^>]*>/g, "") : "";

                const isNumberA = /^-?\d{1,3}(,\d{3})*(\.\d+)?$|^-?\d+$/.test(aValue);
                const isNumberB = /^-?\d{1,3}(,\d{3})*(\.\d+)?$|^-?\d+$/.test(bValue);

                let result;
                if (isNumberA && isNumberB) {
                    result = parseFloat(aValue.replace(",", "")) - parseFloat(bValue.replace(",", ""));
                } else {
                    result = aValue.localeCompare(bValue);
                }

                if (this.sortDirection === "▼") {
                    result = -result;
                }
                return result;
            });
        }

        return data;
    }

    generateOptions(selectObject) {
        // 定義下拉選單之選項
        const options = [
            { value: 99999999, text: this.i18n[this.language].displayAll },
            { value: 5, text: "5" },
            { value: 10, text: "10", default: true },
            { value: 100, text: "100" },
        ];

        // 繪製選單選項
        options.forEach((opt) => {
            const { value, text, default: isDefault } = opt;
            const option = new Option(text, value);
            selectObject.add(option);

            if (isDefault) {
                option.selected = true;
                this.setRowsPerPage(parseInt(value));
            }
        });
    }

    // 渲染表格
    render() {
        let processedData = this.getProcessedData();
        let startRow = (this.currentPage - 1) * this.rowsPerPage;
        let endRow = startRow + this.rowsPerPage;
        let paginatedData = processedData.slice(startRow, endRow);

        const table = document.createElement("table");
        table.setAttribute("class", "ztTable");

        const thead = document.createElement("thead");
        thead.setAttribute("class", "ztTableHead");

        let tr = document.createElement("tr");

        for (const column of this.columns) {
            const th = document.createElement("th");
            th.textContent = column.label;
            if (column.field === this.sortColumn) {
                th.textContent += ` ${this.sortDirection}`;
            }
            if (column.sortable) {
                th.addEventListener("mouseover", () => {
                    th.style.cursor = "pointer";
                });
                th.addEventListener("click", () => {
                    this.setSort(column.field);
                });
            }
            tr.appendChild(th);
        }

        thead.appendChild(tr);
        table.appendChild(thead);

        const tbody = document.createElement("tbody");
        tbody.setAttribute("class", "ztTableBody");

        const noData = !processedData || processedData.length <= 0;

        if (noData) {
            // 無資料
            const tr = document.createElement("tr");
            tr.innerHTML += `<td class="noRecords" colspan="${this.columns.length + 1}">${
                this.i18n[this.language].noData
            }</td>`;
            tbody.appendChild(tr);
        } else {
            // 有資料
            paginatedData.forEach((row, i) => {
                const tr = document.createElement("tr");
                this.columns.forEach(({ field, align }) => {
                    tr.innerHTML += `<td class="${align}">${row[field]}</td>`;
                });
                tbody.appendChild(tr);
            });
        }

        table.appendChild(tbody);

        const tfoot = document.createElement("tfoot");
        tfoot.setAttribute("class", "ztTableFoot");

        tr = document.createElement("tr");

        for (const column of this.columns) {
            let td = document.createElement("td");
            td.textContent = column.label;
            tr.appendChild(td);
        }

        const paginationContainer = document.createElement("div");
        paginationContainer.setAttribute("class", "ztPaginationContainer");

        // *************************************************************************************************************
        // 按鈕樣式
        // *************************************************************************************************************
        const spanNavigator = document.createElement("span");
        spanNavigator.setAttribute("class", "ztPageNavigator");
        paginationContainer.appendChild(spanNavigator);

        switch (this.navigatorStyle) {
            case 1:
                // [按鈕樣式 1] 第一頁、上一頁、下一頁、最末頁
                spanNavigator.innerHTML = `
                            <button>${this.i18n[this.language].first}</button>
                            <button>${this.i18n[this.language].prev}</button>
                            <button>${this.i18n[this.language].next}</button>
                            <button>${this.i18n[this.language].last}</button>
                        `;

                const [firstPageButton, prevPageButton, nextPageButton, lastPageButton] =
                    spanNavigator.querySelectorAll("button");

                firstPageButton.disabled = noData || this.currentPage === 1;
                firstPageButton.addEventListener("click", () => {
                    this.currentPage = 1;
                    this.render();
                });

                prevPageButton.disabled = noData || this.currentPage === 1;
                prevPageButton.addEventListener("click", () => {
                    this.currentPage--;
                    this.render();
                });

                nextPageButton.disabled =
                    noData || this.currentPage === Math.ceil(processedData.length / this.rowsPerPage);
                nextPageButton.addEventListener("click", () => {
                    this.currentPage++;
                    this.render();
                });

                lastPageButton.disabled =
                    noData || this.currentPage === Math.ceil(processedData.length / this.rowsPerPage);
                lastPageButton.addEventListener("click", () => {
                    this.currentPage = Math.ceil(processedData.length / this.rowsPerPage);
                    this.render();
                });
                break;

            case 2:
                // [按鈕樣式 2] 每一頁都有獨立按鈕
                const pageCount = Math.ceil(processedData.length / this.rowsPerPage);
                const buttons = Array.from({ length: pageCount }, (_, i) => {
                    const button = document.createElement("button");
                    button.textContent = i + 1;
                    button.disabled = noData || i + 1 === this.currentPage;
                    button.addEventListener("click", () => {
                        this.currentPage = i + 1;
                        this.render();
                    });
                    return button;
                });
                buttons.forEach((button) => spanNavigator.appendChild(button));
                break;

            default:
                break;
        }

        // *************************************************************************************************************
        // 快速跳頁
        // *************************************************************************************************************
        const pageCount = Math.ceil(processedData.length / this.rowsPerPage);
        const spanGoToPage = document.createElement("span");
        spanGoToPage.innerHTML = `<span class='ztPageCount'> | 
                        <input type="number" min="1" max="${pageCount}" value="${this.currentPage}"> / ${pageCount}
                        <button>${this.i18n[this.language].goto}</button> | 
                        ${this.i18n[this.language].totalRecords}${processedData.length}</span>
                `;
        paginationContainer.appendChild(spanGoToPage);

        const [gotoPageInput, gotoPageButton] = spanGoToPage.querySelectorAll("input, button");
        gotoPageButton.disabled = noData;
        gotoPageButton.addEventListener("click", () => {
            const pageNumber = parseInt(gotoPageInput.value);
            if (pageNumber >= 1 && pageNumber <= pageCount) {
                this.currentPage = pageNumber;
                this.render();
            }
        });
        // *************************************************************************************************************

        tfoot.appendChild(tr);
        table.appendChild(tfoot);

        // 顯示最新更新時間
        this.lastUpdatedTime = new Date().toLocaleString();
        const updateTimeContainer = document.createElement("div");
        updateTimeContainer.setAttribute("class", "ztUpdateTime");
        updateTimeContainer.textContent = `最後更新時間：${this.lastUpdatedTime || "尚未更新"}`;

        this.container.innerHTML = ""; // 清空容器
        this.container.appendChild(table);
        this.container.appendChild(paginationContainer);
        this.container.appendChild(updateTimeContainer); // 添加更新時間顯示
    }
}

export default Table;
