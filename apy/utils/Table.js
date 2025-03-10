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
                inputKeyword: "請輸入關鍵字",
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
                inputKeyword: "Please input keyword",
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
        <input type="text" class="ztSearchTerm" placeholder="${this.i18n[this.language].inputKeyword}" />
    `;
        const input = spanCtrl.querySelector("input");
        let timeout;
        input.addEventListener("input", (event) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => this.setSearchTerm(event.target.value), 500); // 500ms 防抖
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
        this.sortColumn = (this.columns && this.columns.find((col) => col.defaultSortColumn)?.field) || "";
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
            { value: 99999999, text: this.i18n[this.language].displayAll },
            { value: 5, text: "5" },
            { value: 10, text: "10", default: true },
            { value: 100, text: "100" },
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

        const fragment = document.createDocumentFragment();

        const table = document.createElement("table");
        table.className += "ztTable";

        const thead = this.createTableHead();
        const tbody = this.createTableBody(paginatedData, processedData.length);
        const tfoot = this.createTableFoot(processedData.length);

        table.appendChild(thead);
        table.appendChild(tbody);
        table.appendChild(tfoot);

        fragment.appendChild(table);
        fragment.appendChild(this.createPaginationContainer(processedData.length));

        // 清空舊的表格和分頁物件
        this.resetAll();

        this.container.appendChild(fragment);
    }

    resetAll() {
        const oldTable = this.container.querySelector("table.ztTable");
        const oldPagination = this.container.querySelector("div.ztPaginationContainer");
        if (oldTable) this.container.removeChild(oldTable);
        if (oldPagination) this.container.removeChild(oldPagination);
    }

    clearData() {
        this.data = [];
        this.render();
    }

    createTableHead() {
        const thead = document.createElement("thead");
        thead.className += "ztTableHead";
        const tr = document.createElement("tr");

        // 新增 row number 欄位
        const rowNum = document.createElement("th");
        rowNum.innerText = "#"; // 使用 innerText 以避免 XSS
        tr.appendChild(rowNum);

        this.columns.forEach((column) => {
            const th = document.createElement("th");
            th.innerText = `${column.label} ${column.field === this.sortColumn ? this.sortDirection : ""}`;
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
        tbody.className += "ztTableBody";

        if (totalRecords === 0) {
            const tr = document.createElement("tr");
            const tdNoRecords = document.createElement("td");
            tdNoRecords.className += "noRecords";
            tdNoRecords.colSpan = this.columns.length + 1; // 設置 colspan
            tdNoRecords.innerText = this.i18n[this.language].noData; // 使用 innerText 以避免 XSS
            tr.appendChild(tdNoRecords);
            tbody.appendChild(tr);
        } else {
            paginatedData.forEach((row, index) => {
                const tr = document.createElement("tr");
                const rowNum = document.createElement("td");
                rowNum.className += "alignCenter";
                rowNum.innerText = (this.currentPage - 1) * this.rowsPerPage + index + 1;
                tr.appendChild(rowNum);

                this.columns.forEach(({ field, align }) => {
                    const td = document.createElement("td");
                    td.className = align;
                    td.innerHTML = row[field]; // 如果需要 HTML，保持 innerHTML
                    tr.appendChild(td);
                });
                tbody.appendChild(tr);
            });
        }

        return tbody;
    }

    createTableFoot() {
        const tfoot = document.createElement("tfoot");
        tfoot.className += "ztTableFoot";
        const tr = document.createElement("tr");

        // 新增 row number 欄位
        const rowNum = document.createElement("td");
        rowNum.innerText = "#"; // 使用 innerText 以避免 XSS
        tr.appendChild(rowNum);

        this.columns.forEach((column) => {
            const td = document.createElement("td");
            td.innerText = column.label; // 使用 innerText 以避免 XSS
            tr.appendChild(td);
        });

        tfoot.appendChild(tr);
        return tfoot;
    }

    createPaginationContainer(totalRecords) {
        const paginationContainer = document.createElement("div");
        paginationContainer.className += "ztPaginationContainer";

        const spanNavigator = document.createElement("span");
        spanNavigator.className += "ztPageNavigator";
        paginationContainer.appendChild(spanNavigator);

        const noData = totalRecords === 0;
        const totalPages = Math.ceil(totalRecords / this.rowsPerPage);

        switch (this.navigatorStyle) {
            case 1:
                this.createNavigatorButtons(spanNavigator, noData, totalPages);
                break;
            case 2:
                this.createPageButtons(spanNavigator, noData, totalPages);
                break;
            default:
                break;
        }

        // 快速跳頁
        const spanGoToPage = document.createElement("span");
        const pageCount = document.createElement("span");
        pageCount.className += "ztPageCount";

        // 創建輸入框
        const inputPage = document.createElement("input");
        inputPage.type = "number";
        inputPage.className += "ztPageInput";
        inputPage.min = 1;
        inputPage.max = totalPages;
        inputPage.value = this.currentPage;

        // 創建按鈕
        const buttonGoTo = document.createElement("button");
        buttonGoTo.innerText = this.i18n[this.language].goto; // 使用 innerText 以避免 XSS

        // 創建總記錄數的顯示
        const totalRecordsText = document.createElement("span");
        totalRecordsText.innerText = `${this.i18n[this.language].totalRecords}${totalRecords}`; // 使用 innerText 以避免 XSS

        // 將所有元素添加到 pageCount 中
        pageCount.appendChild(document.createTextNode(" | "));
        pageCount.appendChild(inputPage);
        pageCount.appendChild(document.createTextNode(` / ${totalPages}`));
        pageCount.appendChild(buttonGoTo);
        pageCount.appendChild(document.createTextNode(" | "));
        pageCount.appendChild(totalRecordsText);

        // 將 pageCount 添加到 spanGoToPage
        spanGoToPage.appendChild(pageCount);

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

    createNavigatorButtons(spanNavigator, noData, totalPages) {
        const buttonFirst = document.createElement("button");
        buttonFirst.innerText = this.i18n[this.language].first;

        const buttonPrev = document.createElement("button");
        buttonPrev.innerText = this.i18n[this.language].prev;

        const buttonNext = document.createElement("button");
        buttonNext.innerText = this.i18n[this.language].next;

        const buttonLast = document.createElement("button");
        buttonLast.innerText = this.i18n[this.language].last;

        // 將按鈕添加到 spanNavigator
        spanNavigator.appendChild(buttonFirst);
        spanNavigator.appendChild(buttonPrev);
        spanNavigator.appendChild(buttonNext);
        spanNavigator.appendChild(buttonLast);

        buttonFirst.disabled = noData || this.currentPage === 1;
        buttonFirst.addEventListener("click", () => {
            this.currentPage = 1;
            this.render();
        });

        buttonPrev.disabled = noData || this.currentPage === 1;
        buttonPrev.addEventListener("click", () => {
            this.currentPage--;
            this.render();
        });

        buttonNext.disabled = noData || this.currentPage === totalPages;
        buttonNext.addEventListener("click", () => {
            this.currentPage++;
            this.render();
        });

        buttonLast.disabled = noData || this.currentPage === totalPages;
        buttonLast.addEventListener("click", () => {
            this.currentPage = totalPages;
            this.render();
        });
    }

    createPageButtons(spanNavigator, noData, totalPages) {
        for (let i = 1; i <= totalPages; i++) {
            const button = document.createElement("button");
            button.innerText = i.toString();
            button.disabled = noData || i === this.currentPage;
            button.addEventListener("click", () => {
                this.currentPage = i;
                this.render();
            });
            spanNavigator.appendChild(button);
        }
    }
}

export default Table;
