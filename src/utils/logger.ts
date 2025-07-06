import fs from 'fs';
import path from 'path';
import { format } from 'date-fns';
import { config } from '../config/config';

// Создаем директорию для логов, если её нет
const logDir = path.resolve(process.cwd(), 'logs');
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
}

// Создаем отдельные файлы для разных типов логов
const createLogFilePath = (prefix: string) => {
    const date = format(new Date(), 'yyyyMMdd');
    return path.join(logDir, `${prefix}_${date}.log`);
};

const infoLogPath = createLogFilePath('info');
const errorLogPath = createLogFilePath('error');
const warnLogPath = createLogFilePath('warn');
const debugLogPath = createLogFilePath('debug');
const tradeLogPath = createLogFilePath('trade');
const metricLogPath = createLogFilePath('metrics');
const bufferLogPath = createLogFilePath('buffers');

// Записываем заголовки в файлы
fs.writeFileSync(infoLogPath, `=== INFO LOGS ${new Date().toISOString()} ===\n`, { flag: 'a' });
fs.writeFileSync(errorLogPath, `=== ERROR LOGS ${new Date().toISOString()} ===\n`, { flag: 'a' });
fs.writeFileSync(warnLogPath, `=== WARNING LOGS ${new Date().toISOString()} ===\n`, { flag: 'a' });
fs.writeFileSync(debugLogPath, `=== DEBUG LOGS ${new Date().toISOString()} ===\n`, { flag: 'a' });
fs.writeFileSync(tradeLogPath, `=== TRADE LOGS ${new Date().toISOString()} ===\n`, { flag: 'a' });
fs.writeFileSync(metricLogPath, `=== METRIC LOGS ${new Date().toISOString()} ===\n`, { flag: 'a' });
fs.writeFileSync(bufferLogPath, `=== BUFFER LOGS ${new Date().toISOString()} ===\n`, { flag: 'a' });

const logger = {
    info: (message: string) => {
        const logMessage = `[INFO] ${new Date().toISOString()}: ${message}\n`;
        fs.appendFileSync(infoLogPath, logMessage);
        // Консольный вывод отключен
    },
    error: (message: string) => {
        const logMessage = `[ERROR] ${new Date().toISOString()}: ${message}\n`;
        fs.appendFileSync(errorLogPath, logMessage);
        // Консольный вывод отключен
    },
    warn: (message: string) => {
        const logMessage = `[WARN] ${new Date().toISOString()}: ${message}\n`;
        fs.appendFileSync(warnLogPath, logMessage);
        // Консольный вывод отключен
    },
    debug: (message: string) => {
        const logMessage = `[DEBUG] ${new Date().toISOString()}: ${message}\n`;
        fs.appendFileSync(debugLogPath, logMessage);
        // Консольный вывод отключен
    },
    trade: (tradeDetails: string) => {
        const logMessage = `[TRADE] ${new Date().toISOString()}: ${tradeDetails}\n`;
        fs.appendFileSync(tradeLogPath, logMessage);
        // Консольный вывод отключен
    },
    metric: (metricData: string) => {
        const logMessage = `[METRIC] ${new Date().toISOString()}: ${metricData}\n`;
        fs.appendFileSync(metricLogPath, logMessage);
        // Консольный вывод отключен
    },
    buffer: (bufferInfo: string) => {
        const logMessage = `[BUFFER] ${new Date().toISOString()}: ${bufferInfo}\n`;
        fs.appendFileSync(bufferLogPath, logMessage);
        // Консольный вывод отключен
    }
};

export default logger;