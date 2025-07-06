"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RiskManager = void 0;
const logger_1 = __importDefault(require("../utils/logger"));
class RiskManager {
    constructor(initialEquity = 100, dailyLossLimit = 20, maxDrawdownPercent = 35, maxOpenPositions = 4, exchangeService) {
        this.dailyPnL = 0;
        this.tradingPaused = false;
        this.pauseUntil = null;
        this.initialEquity = initialEquity;
        this.currentEquity = initialEquity;
        this.highWaterMark = initialEquity;
        this.dailyLossLimit = dailyLossLimit;
        this.maxDrawdownPercent = maxDrawdownPercent;
        this.maxOpenPositions = maxOpenPositions;
        this.exchangeService = exchangeService;
        logger_1.default.info(`Риск-менеджер инициализирован: банк=${initialEquity} USDT, макс.дневной убыток=${dailyLossLimit} USDT, макс.просадка=${maxDrawdownPercent}%`);
    }
    // Обновление equity и PnL
    updateEquity(newEquity) {
        this.currentEquity = newEquity;
        // Обновляем значение дневного P&L
        this.dailyPnL = newEquity - this.initialEquity;
        // Обновляем high-water mark при новом максимуме
        if (newEquity > this.highWaterMark) {
            this.highWaterMark = newEquity;
        }
        // Проверяем условия риска
        this.checkRiskConditions();
    }
    // Расчет текущей просадки в процентах
    getCurrentDrawdown() {
        return ((this.highWaterMark - this.currentEquity) / this.highWaterMark) * 100;
    }
    // Проверка условий риска
    checkRiskConditions() {
        const drawdownPercent = this.getCurrentDrawdown();
        // Проверка на превышение дневного лимита убытка
        if (this.dailyPnL <= -this.dailyLossLimit) {
            this.pauseTradingUntilUTC00();
            logger_1.default.warn(`Торговля приостановлена до 00:00 UTC: превышен дневной лимит убытка (${this.dailyPnL.toFixed(2)} USDT)`);
        }
        // Проверка на превышение максимальной просадки
        if (drawdownPercent >= this.maxDrawdownPercent) {
            this.tradingPaused = true;
            logger_1.default.error(`Торговля остановлена: превышен лимит просадки (${drawdownPercent.toFixed(2)}%)`);
        }
    }
    // Можно ли открывать новую позицию
    async canOpenPosition() {
        // Если торговля на паузе, проверяем не истек ли срок
        if (this.tradingPaused) {
            if (this.pauseUntil && new Date() >= this.pauseUntil) {
                this.tradingPaused = false;
                this.pauseUntil = null;
            }
            else {
                return false;
            }
        }
        // Проверяем количество открытых позиций
        const openPositions = await this.exchangeService.getOpenPositions();
        if (openPositions.length >= this.maxOpenPositions) {
            logger_1.default.info(`Достигнут лимит открытых позиций: ${openPositions.length}/${this.maxOpenPositions}`);
            return false;
        }
        return true;
    }
    // Сброс дневной статистики
    resetDailyStats() {
        this.initialEquity = this.currentEquity;
        this.dailyPnL = 0;
        logger_1.default.info(`Сброс дневной статистики: новый начальный банк = ${this.initialEquity} USDT`);
    }
    // Приостановка торговли до 00:00 UTC
    pauseTradingUntilUTC00() {
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setUTCDate(now.getUTCDate() + 1);
        tomorrow.setUTCHours(0, 0, 0, 0);
        this.pauseUntil = tomorrow;
        this.tradingPaused = true;
        logger_1.default.warn(`Торговля приостановлена до ${tomorrow.toISOString()}`);
    }
    // Принудительное возобновление торговли
    resumeTrading() {
        this.tradingPaused = false;
        this.pauseUntil = null;
        logger_1.default.info('Торговля возобновлена вручную');
    }
}
exports.RiskManager = RiskManager;
