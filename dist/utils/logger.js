"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const date_fns_1 = require("date-fns");
// Создаем директорию для логов, если её нет
const logDir = path_1.default.resolve(process.cwd(), 'logs');
if (!fs_1.default.existsSync(logDir)) {
    fs_1.default.mkdirSync(logDir, { recursive: true });
}
// Создаем отдельные файлы для разных типов логов
const createLogFilePath = (prefix) => {
    const date = (0, date_fns_1.format)(new Date(), 'yyyyMMdd');
    return path_1.default.join(logDir, `${prefix}_${date}.log`);
};
const infoLogPath = createLogFilePath('info');
const errorLogPath = createLogFilePath('error');
const warnLogPath = createLogFilePath('warn');
const debugLogPath = createLogFilePath('debug');
const tradeLogPath = createLogFilePath('trade');
const metricLogPath = createLogFilePath('metrics');
const bufferLogPath = createLogFilePath('buffers');
// Записываем заголовки в файлы
fs_1.default.writeFileSync(infoLogPath, `=== INFO LOGS ${new Date().toISOString()} ===\n`, { flag: 'a' });
fs_1.default.writeFileSync(errorLogPath, `=== ERROR LOGS ${new Date().toISOString()} ===\n`, { flag: 'a' });
fs_1.default.writeFileSync(warnLogPath, `=== WARNING LOGS ${new Date().toISOString()} ===\n`, { flag: 'a' });
fs_1.default.writeFileSync(debugLogPath, `=== DEBUG LOGS ${new Date().toISOString()} ===\n`, { flag: 'a' });
fs_1.default.writeFileSync(tradeLogPath, `=== TRADE LOGS ${new Date().toISOString()} ===\n`, { flag: 'a' });
fs_1.default.writeFileSync(metricLogPath, `=== METRIC LOGS ${new Date().toISOString()} ===\n`, { flag: 'a' });
fs_1.default.writeFileSync(bufferLogPath, `=== BUFFER LOGS ${new Date().toISOString()} ===\n`, { flag: 'a' });
const logger = {
    info: (message) => {
        const logMessage = `[INFO] ${new Date().toISOString()}: ${message}\n`;
        fs_1.default.appendFileSync(infoLogPath, logMessage);
        // Консольный вывод отключен
    },
    error: (message) => {
        const logMessage = `[ERROR] ${new Date().toISOString()}: ${message}\n`;
        fs_1.default.appendFileSync(errorLogPath, logMessage);
        // Консольный вывод отключен
    },
    warn: (message) => {
        const logMessage = `[WARN] ${new Date().toISOString()}: ${message}\n`;
        fs_1.default.appendFileSync(warnLogPath, logMessage);
        // Консольный вывод отключен
    },
    debug: (message) => {
        const logMessage = `[DEBUG] ${new Date().toISOString()}: ${message}\n`;
        fs_1.default.appendFileSync(debugLogPath, logMessage);
        // Консольный вывод отключен
    },
    trade: (tradeDetails) => {
        const logMessage = `[TRADE] ${new Date().toISOString()}: ${tradeDetails}\n`;
        fs_1.default.appendFileSync(tradeLogPath, logMessage);
        // Консольный вывод отключен
    },
    metric: (metricData) => {
        const logMessage = `[METRIC] ${new Date().toISOString()}: ${metricData}\n`;
        fs_1.default.appendFileSync(metricLogPath, logMessage);
        // Консольный вывод отключен
    },
    buffer: (bufferInfo) => {
        const logMessage = `[BUFFER] ${new Date().toISOString()}: ${bufferInfo}\n`;
        fs_1.default.appendFileSync(bufferLogPath, logMessage);
        // Консольный вывод отключен
    }
};
exports.default = logger;
