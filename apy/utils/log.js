const log = (message, isError = false) => {
    const now = new Date();
    const timestamp = `${now.getFullYear()}/${now.getMonth() + 1}/${now.getDate()} ${now.toTimeString().slice(0, 8)}`;
    const logMessage = `[${timestamp}] ${message}`;

    const logEntry = document.createElement("div");
    logEntry.textContent = logMessage;
    logEntry.style.color = isError ? "red" : "black";
    logContainer.appendChild(logEntry);
    logContainer.scrollTop = logContainer.scrollHeight; // 自動滾動到最新日誌
};

export default log;
