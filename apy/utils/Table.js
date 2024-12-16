// ********************************************************************************
// *** Table 元件函式
// ********************************************************************************
export class Table {
    constructor(config) {
        this.language = config.language || "cht";
        this.i18n = config.i18n || this.defaultI18n();
        this.data = config.data;
        this.columns = config.columns;
        this.container = config.container;
        this.lastUpdatedTime = new Date().toLocaleString();

        this.createFunctionalContainer(config);
        this.initializeSettings(config);
        this.render();
    }

    defaultI18n() {
        return {
            cht: {
                first: "第一頁",
                prev: "上一頁",
                next: "下一頁",
                last: "最末頁",
                page: "第 %1 頁，共 %2 頁",
                goto: "跳轉",
                noData: "目前無資料",
                search: "搜尋文字：",
                rowsPerPage: "每頁顯示筆數：",
                displayAll: "== 全部顯示 ==",
                totalRecords: "資料筆數：",
                latestUpdateTime: "最後更新時間：",
            },
            eng: {
                first: "First",
                prev: "Prev",
                next: "Next",
                last: "Last",
                page: "Page %1 of %2",
                goto: "Go To",
                noData: "No data so far",
                search: "Search: ",
                rowsPerPage: "Rows per page: ",
                displayAll: "== ALL ==",
                totalRecords: "Records: ",
                latestUpdateTime: "Last Update: ",
            },
        };
    }

    createFunctionalContainer(config) {
        const functionalContainer = document.createElement("div");
        functionalContainer.className = "ztFunctionalContainer";
        this.container.parentNode.insertBefore(functionalContainer, this.container);

        if (config.search) this.createSearchBox(functionalContainer);
        if (config.rowsPerPage) this.createRowsPerPageSelector(functionalContainer);
    }

    createSearchBox(container) {
        const spanCtrl = document.createElement("span");
        spanCtrl.innerHTML = `
        <span>${this.i18n[this.language].search}</span>
        <input type="text" class="ztSearchTerm">
    `;
        const input = spanCtrl.querySelector("input");
        let timeout;
        input.addEventListener("input", (event) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => this.setSearchTerm(event.target.value), 300); // 300ms 防抖
        });
        container.appendChild(spanCtrl);
    }

    createRowsPerPageSelector(container) {
        const spanCtrl = document.createElement("span");
        spanCtrl.innerHTML = `
        <span>${this.i18n[this.language].rowsPerPage}</span>
        <select class="ztRowsPerPage"></select>
    `;
        const select = spanCtrl.querySelector("select");
        select.addEventListener("change", (event) => this.setRowsPerPage(parseInt(event.target.value)));
        this.generateOptions(select);
        container.appendChild(spanCtrl);
    }

    initializeSettings(config) {
        this.navigatorStyle = config.navigatorStyle || 1;
        this.currentPage = 1;
        this.rowsPerPage = 10;
        this.searchTerm = "";
        this.sortColumn = this.columns.find((col) => col.defaultSortColumn)?.field || "";
        this.sortDirection = "▼";
    }

    initializeData(data) {
        this.data = data;
        this.render();
    }

    setRowsPerPage(rows) {
        this.rowsPerPage = rows;
        this.currentPage = 1;
        this.render();
    }

    setSearchTerm(term) {
        this.searchTerm = term;
        this.currentPage = 1;
        this.render();
    }

    setSort(column) {
        this.sortDirection = this.sortColumn === column ? (this.sortDirection === "▲" ? "▼" : "▲") : "▲";
        this.sortColumn = column;
        this.render();
    }

    getProcessedData() {
        if (!this.data) return [];

        return this.data
            .filter((row) =>
                Object.values(row).some(
                    (value) => value && value.toString().toLowerCase().includes(this.searchTerm.toLowerCase())
                )
            )
            .sort((a, b) => this.sortData(a, b));
    }

    sortData(a, b) {
        const aValue = a[this.sortColumn]?.toString().replace(/<[^>]*>/g, "") || "";
        const bValue = b[this.sortColumn]?.toString().replace(/<[^>]*>/g, "") || "";

        const isNumberA = !isNaN(aValue);
        const isNumberB = !isNaN(bValue);
        let result;

        if (isNumberA && isNumberB) {
            result = parseFloat(aValue) - parseFloat(bValue);
        } else {
            result = aValue.localeCompare(bValue);
        }

        return this.sortDirection === "▼" ? -result : result;
    }

    generateOptions(selectObject) {
        const options = [
            {
                value: 99999999,
                text: this.i18n[this.language].displayAll,
            },
            {
                value: 5,
                text: "5",
            },
            {
                value: 10,
                text: "10",
                default: true,
            },
            {
                value: 100,
                text: "100",
            },
        ];

        options.forEach(({ value, text, default: isDefault }) => {
            const option = new Option(text, value);
            selectObject.add(option);
            if (isDefault) {
                option.selected = true;
                this.setRowsPerPage(value);
            }
        });
    }

    render() {
        const processedData = this.getProcessedData();
        const startRow = (this.currentPage - 1) * this.rowsPerPage;
        const paginatedData = processedData.slice(startRow, startRow + this.rowsPerPage);

        const table = document.createElement("table");
        table.className = "ztTable";

        const thead = this.createTableHead();
        const tbody = this.createTableBody(paginatedData, processedData.length);
        const tfoot = this.createTableFoot(processedData.length);

        table.appendChild(thead);
        table.appendChild(tbody);
        table.appendChild(tfoot);

        const fragment = document.createDocumentFragment();
        fragment.appendChild(table);
        fragment.appendChild(this.createPaginationContainer(processedData.length));
        fragment.appendChild(this.createUpdateTimeContainer());

        this.container.innerHTML = ""; // 清空容器
        this.container.appendChild(fragment);
    }

    createTableHead() {
        const thead = document.createElement("thead");
        thead.className = "ztTableHead";
        const tr = document.createElement("tr");

        this.columns.forEach((column) => {
            const th = document.createElement("th");
            th.textContent = `${column.label} ${column.field === this.sortColumn ? this.sortDirection : ""}`;
            if (column.sortable) {
                th.style.cursor = "pointer";
                th.addEventListener("click", () => this.setSort(column.field));
            }
            tr.appendChild(th);
        });

        thead.appendChild(tr);
        return thead;
    }

    createTableBody(paginatedData, totalRecords) {
        const tbody = document.createElement("tbody");
        tbody.className = "ztTableBody";

        if (totalRecords === 0) {
            const tr = document.createElement("tr");
            tr.innerHTML = `<td class="noRecords" colspan="${this.columns.length}">${
                this.i18n[this.language].noData
            }</td>`;
            tbody.appendChild(tr);
        } else {
            paginatedData.forEach((row) => {
                const tr = document.createElement("tr");
                this.columns.forEach(({ field, align }) => {
                    const td = document.createElement("td");
                    td.className = align;
                    td.innerHTML = row[field];
                    tr.appendChild(td);
                });
                tbody.appendChild(tr);
            });
        }

        return tbody;
    }

    createTableFoot(totalRecords) {
        const tfoot = document.createElement("tfoot");
        tfoot.className = "ztTableFoot";
        const tr = document.createElement("tr");

        this.columns.forEach((column) => {
            const td = document.createElement("td");
            td.textContent = column.label;
            tr.appendChild(td);
        });

        tfoot.appendChild(tr);
        return tfoot;
    }

    createPaginationContainer(totalRecords) {
        const paginationContainer = document.createElement("div");
        paginationContainer.className = "ztPaginationContainer";

        const spanNavigator = document.createElement("span");
        spanNavigator.className = "ztPageNavigator";
        paginationContainer.appendChild(spanNavigator);

        const noData = totalRecords === 0;
        const totalPages = Math.ceil(totalRecords / this.rowsPerPage);

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

                nextPageButton.disabled = noData || this.currentPage === totalPages;
                nextPageButton.addEventListener("click", () => {
                    this.currentPage++;
                    this.render();
                });

                lastPageButton.disabled = noData || this.currentPage === totalPages;
                lastPageButton.addEventListener("click", () => {
                    this.currentPage = totalPages;
                    this.render();
                });
                break;

            case 2:
                // [按鈕樣式 2] 每一頁都有獨立按鈕
                for (let i = 1; i <= totalPages; i++) {
                    const button = document.createElement("button");
                    button.textContent = i;
                    button.disabled = noData || i === this.currentPage;
                    button.addEventListener("click", () => {
                        this.currentPage = i;
                        this.render();
                    });
                    spanNavigator.appendChild(button);
                }
                break;

            default:
                break;
        }

        // *************************************************************************************************************
        // 快速跳頁
        // *************************************************************************************************************
        const spanGoToPage = document.createElement("span");
        spanGoToPage.innerHTML = `<span class='ztPageCount'> |
        <input type="number" min="1" max="${totalPages}" value="${this.currentPage}"> / ${totalPages}
        <button>${this.i18n[this.language].goto}</button> | 
        ${this.i18n[this.language].totalRecords}${totalRecords}</span>
    `;
        paginationContainer.appendChild(spanGoToPage);

        const [gotoPageInput, gotoPageButton] = spanGoToPage.querySelectorAll("input, button");
        gotoPageButton.disabled = noData;
        gotoPageButton.addEventListener("click", () => {
            const pageNumber = parseInt(gotoPageInput.value);
            if (pageNumber >= 1 && pageNumber <= totalPages) {
                this.currentPage = pageNumber;
                this.render();
            }
        });

        return paginationContainer;
    }

    createUpdateTimeContainer() {
        const updateTimeContainer = document.createElement("div");
        updateTimeContainer.className = "ztUpdateTimeContainer";
        updateTimeContainer.textContent = this.i18n[this.language].latestUpdateTime + this.lastUpdatedTime;
        return updateTimeContainer;
    }
}

export default Table;
