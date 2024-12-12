const log = (message, display = true) => {
    const now = new Date();
    const timestamp = `${now.getFullYear()}/${now.getMonth() + 1}/${now.getDate()} ${now.toTimeString().slice(0, 8)}`;
    const logMessage = `[${timestamp}] ${message}`;

    // 顯示在控制台
    if (display) {
        console.log(logMessage);
    }

    // 顯示在網頁上
    const logContainer = document.getElementById("logContainer");
    if (logContainer) {
        const logEntry = document.createElement("div");
        logEntry.textContent = logMessage;
        logContainer.appendChild(logEntry);
    }
};

export default log;
