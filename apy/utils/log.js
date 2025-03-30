// Log levels with their corresponding colors and methods
const LOG_LEVELS = {
    ERROR: { color: '\x1b[31m', method: console.error },
    WARN: { color: '\x1b[33m', method: console.warn },
    INFO: { color: '\x1b[36m', method: console.log },
    DEBUG: { color: '\x1b[32m', method: console.log }
};

const createLogMessage = (level, message, metadata = null) => {
    const now = new Date();
    const timestamp = `${now.getFullYear()}/${now.getMonth() + 1}/${now.getDate()} ${now.toTimeString().slice(0, 8)}`;
    const reset = '\x1b[0m';
    const logLevel = LOG_LEVELS[level];
    const metadataStr = metadata ? ` ${JSON.stringify(metadata)}` : '';
    const msg = `[${timestamp}] ${logLevel.color}[${level}]${reset} ${message}${metadataStr}`;

    // Console output with colors
    logLevel.method(msg);

    // Optionally log to file (uncomment and configure as needed)
    // fs.appendFile('server.log', `[${timestamp}] [${level}] ${message}${metadataStr}\n`)
    //   .catch(err => console.error('Failed to write to log file:', err));
};

export const error = (message, metadata = null) => createLogMessage('ERROR', message, metadata);
export const warn = (message, metadata = null) => createLogMessage('WARN', message, metadata);
export const info = (message, metadata = null) => createLogMessage('INFO', message, metadata);
export const debug = (message, metadata = null) => createLogMessage('DEBUG', message, metadata);

export default {
    error,
    warn,
    info,
    debug
};