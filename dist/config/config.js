"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
// Загружаем переменные окружения из .env файла
dotenv_1.default.config({ path: path_1.default.resolve(process.cwd(), '.env') });
// Основные параметры
exports.config = {
    // API биржи
    binance: {
        apiKey: process.env.BIN_KEY || '',
        apiSecret: process.env.BIN_SEC || '',
        testnet: process.env.TESTNET === 'true'
    },
    // Параметры капитала
    trading: {
        initialCapital: 100, // 100 USDT начальный капитал
        positionSizePercent: 0.1, // 10% от equity на каждую сделку
        maxLeverage: 50, // Максимальное плечо
        maxOpenPositions: 4, // Макс. количество открытых позиций
        dailyLossLimitUsdt: 20, // Дневной лимит убытка в USDT
        maxDrawdownPercent: 35, // Макс. просадка от high water mark в %
        autoReinvest: true, // Автоматический реинвест прибыли
        testMode: process.env.TEST_MODE === 'true' // Тестовый режим на виртуальных деньгах
    },
    // Символы для торговли
    symbols: ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT', 'MATICUSDT'],
    // Параметры логирования
    logging: {
        logLevel: process.env.LOG_LEVEL || 'info',
        logToConsole: true,
        logToFile: true,
        logDir: path_1.default.resolve(process.cwd(), 'logs')
    },
    // Параметры метрик
    metrics: {
        enabled: true,
        port: process.env.METRICS_PORT ? parseInt(process.env.METRICS_PORT) : 9090
    }
};
exports.default = exports.config;
