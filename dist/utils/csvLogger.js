"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.csvLogger = exports.CsvLogger = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const date_fns_1 = require("date-fns");
const config_1 = require("../config/config");
class CsvLogger {
    constructor() {
        this.logDir = path_1.default.resolve(config_1.config.logging.logDir);
        if (!fs_1.default.existsSync(this.logDir)) {
            fs_1.default.mkdirSync(this.logDir, { recursive: true });
        }
    }
    logTrade(symbol, trade) {
        const date = new Date(trade.timestamp);
        const fileName = `${symbol}_${(0, date_fns_1.format)(date, 'yyyyMMdd')}.csv`;
        const filePath = path_1.default.join(this.logDir, fileName);
        // Создаем файл с заголовками если не существует
        if (!fs_1.default.existsSync(filePath)) {
            fs_1.default.writeFileSync(filePath, 'timestamp,side,qty,entry,tp/sl,exit,pnl$\n');
        }
        // Форматируем данные и записываем строку
        const line = [
            (0, date_fns_1.format)(date, 'yyyy-MM-dd HH:mm:ss'),
            trade.side,
            trade.quantity.toFixed(4),
            trade.entryPrice.toFixed(2),
            `${trade.takeProfitPrice?.toFixed(2) || '-'}/${trade.stopLossPrice?.toFixed(2) || '-'}`,
            trade.exitPrice?.toFixed(2) || '-',
            trade.pnl?.toFixed(2) || '-'
        ].join(',');
        fs_1.default.appendFileSync(filePath, line + '\n');
    }
}
exports.CsvLogger = CsvLogger;
exports.csvLogger = new CsvLogger();
