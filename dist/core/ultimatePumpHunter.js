"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UltimatePumpHunter = void 0;
const logger_1 = __importDefault(require("../utils/logger"));
class UltimatePumpHunter {
    constructor(initialEquity, exchangeService) {
        // БОЕВЫЕ ПАРАМЕТРЫ - МАКСИМАЛЬНАЯ СЕЛЕКТИВНОСТЬ
        this.LEVERAGE = 100; // Максимальное плечо
        this.POSITION_SIZE = 0.08; // 8% капитала на сделку
        this.MIN_CONFIDENCE = 0.85; // 85% минимальная уверенность
        this.TARGET_PROFIT = 0.05; // 5% тейк-профит (500% ROI)
        this.STOP_LOSS = 0.015; // 1.5% стоп-лосс (150% потеря)
        this.MAX_POSITION_TIME = 3 * 60 * 1000; // 3 минуты максимум
        this.MIN_PUMP_SIZE = 0.025; // 2.5% минимальный памп
        this.COOLDOWN_TIME = 45 * 60 * 1000; // 45 минут между сделками
        this.openPosition = null;
        this.lastTradeTime = 0;
        this.dailyStats = { trades: 0, wins: 0, totalPnL: 0 };
        this.equity = initialEquity;
        this.exchangeService = exchangeService;
        logger_1.default.info(`🎯 ULTIMATE PUMP HUNTER ЗАПУЩЕН:`);
        logger_1.default.info(`💰 Капитал: ${initialEquity} USDT`);
        logger_1.default.info(`⚡ Плечо: ${this.LEVERAGE}x | Позиция: ${this.POSITION_SIZE * 100}%`);
        logger_1.default.info(`🎯 Target: ${this.TARGET_PROFIT * 100}% | Stop: ${this.STOP_LOSS * 100}%`);
        logger_1.default.info(`⏱️ Кулдаун: ${this.COOLDOWN_TIME / 60000} минут между сделками`);
    }
    // ГЛАВНЫЙ ТОРГОВЫЙ ЦИКЛ - РАБОТА С РЕАЛЬНЫМИ ДАННЫМИ
    async executeUltimateHunt() {
        try {
            // Управляем открытой позицией
            if (this.openPosition) {
                await this.manageElitePosition();
                return;
            }
            // Проверяем кулдаун
            if (Date.now() - this.lastTradeTime < this.COOLDOWN_TIME) {
                return;
            }
            // Получаем топ криптовалют и ищем пампы
            const topSymbols = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT', 'ADAUSDT', 'DOTUSDT', 'LINKUSDT', 'LTCUSDT'];
            const bestSignal = await this.findUltimateSignal(topSymbols);
            if (bestSignal && bestSignal.signal.confidence >= this.MIN_CONFIDENCE) {
                await this.executeEliteTrade(bestSignal);
            }
        }
        catch (error) {
            logger_1.default.error(`❌ Ошибка в ULTIMATE HUNT: ${error.message}`);
        }
    }
    async findUltimateSignal(symbols) {
        let bestSignal = null;
        let maxConfidence = 0;
        for (const symbol of symbols) {
            try {
                const signal = await this.analyzeUltimateSignal(symbol);
                if (signal.confidence > maxConfidence && signal.confidence >= this.MIN_CONFIDENCE) {
                    maxConfidence = signal.confidence;
                    bestSignal = { symbol, signal };
                }
            }
            catch (error) {
                logger_1.default.error(`⚠️ Ошибка анализа ${symbol}: ${error.message}`);
            }
        }
        return bestSignal;
    }
    async analyzeUltimateSignal(symbol) {
        try {
            // Получаем данные свечей за последние 30 минут (1m интервал)
            const klines = await this.exchangeService.getKlines(symbol, '1m', 30);
            if (klines.length < 20) {
                return { strength: 0, confidence: 0, direction: 'long', expectedMove: 0, timeframe: 0 };
            }
            // Анализируем последние 6 свечей vs предыдущие 6
            const recent = klines.slice(-6);
            const baseline = klines.slice(-12, -6);
            // Цена и объем
            const recentAvgPrice = recent.reduce((sum, k) => sum + parseFloat(k.close), 0) / recent.length;
            const baselineAvgPrice = baseline.reduce((sum, k) => sum + parseFloat(k.close), 0) / baseline.length;
            const priceMove = (recentAvgPrice - baselineAvgPrice) / baselineAvgPrice;
            const recentAvgVolume = recent.reduce((sum, k) => sum + parseFloat(k.volume), 0) / recent.length;
            const baselineAvgVolume = baseline.reduce((sum, k) => sum + parseFloat(k.volume), 0) / baseline.length;
            const volumeSpike = recentAvgVolume / baselineAvgVolume;
            // Проверяем последовательность движения
            let consecutiveMoves = 0;
            const direction = priceMove > 0 ? 1 : -1;
            for (let i = 1; i < recent.length; i++) {
                const move = (parseFloat(recent[i].close) - parseFloat(recent[i - 1].close)) / parseFloat(recent[i - 1].close);
                if ((move > 0 && direction > 0) || (move < 0 && direction < 0)) {
                    consecutiveMoves++;
                }
            }
            // РАСЧЕТ CONFIDENCE - ЖЕСТКИЕ КРИТЕРИИ
            let confidence = 0;
            const strength = Math.abs(priceMove);
            // Условие 1: Сильное движение
            if (strength >= this.MIN_PUMP_SIZE)
                confidence += 0.35;
            // Условие 2: Объемный всплеск
            if (volumeSpike >= 5.0)
                confidence += 0.3;
            else if (volumeSpike >= 3.0)
                confidence += 0.2;
            // Условие 3: Последовательность
            if (consecutiveMoves >= 4)
                confidence += 0.25;
            else if (consecutiveMoves >= 3)
                confidence += 0.15;
            // Условие 4: Импульс нарастает
            const recentMomentum = recent.slice(-3).reduce((sum, k, i) => {
                if (i === 0)
                    return sum;
                return sum + Math.abs((parseFloat(k.close) - parseFloat(recent[i - 1].close)) / parseFloat(recent[i - 1].close));
            }, 0);
            if (recentMomentum > 0.015)
                confidence += 0.1;
            return {
                strength,
                confidence: Math.min(confidence, 1.0),
                direction: priceMove > 0 ? 'long' : 'short',
                expectedMove: strength * 1.5,
                timeframe: 180 // 3 минуты
            };
        }
        catch (error) {
            logger_1.default.error(`❌ Ошибка анализа сигнала для ${symbol}: ${error.message}`);
            return { strength: 0, confidence: 0, direction: 'long', expectedMove: 0, timeframe: 0 };
        }
    }
    async executeEliteTrade(best) {
        try {
            const { symbol, signal } = best;
            // Получаем текущую цену
            const currentPrice = await this.exchangeService.getCurrentPrice(symbol);
            // РАЗМЕР ПОЗИЦИИ с учетом сложного процента
            const positionValue = this.equity * this.POSITION_SIZE;
            const leveragedValue = positionValue * this.LEVERAGE;
            const quantity = leveragedValue / currentPrice;
            // ДИНАМИЧЕСКИЕ TP/SL на основе силы сигнала
            const dynamicTP = this.TARGET_PROFIT * (1 + signal.strength * 2); // Больше сила = больше цель
            const dynamicSL = this.STOP_LOSS * (2 - signal.confidence); // Больше уверенности = меньше стоп
            this.openPosition = {
                symbol,
                side: signal.direction,
                entryPrice: currentPrice,
                quantity,
                entryTime: Date.now(),
                targetProfit: dynamicTP,
                stopLoss: dynamicSL,
                positionValue
            };
            this.lastTradeTime = Date.now();
            this.dailyStats.trades++;
            logger_1.default.info(`🚀🚀 ЭЛИТНАЯ СДЕЛКА ОТКРЫТА:`);
            logger_1.default.info(`   ${symbol} ${signal.direction.toUpperCase()}`);
            logger_1.default.info(`   Цена: ${currentPrice.toFixed(2)}`);
            logger_1.default.info(`   Размер: ${positionValue.toFixed(2)} USDT (${this.LEVERAGE}x)`);
            logger_1.default.info(`   Покрытие: ${leveragedValue.toFixed(2)} USDT`);
            logger_1.default.info(`   Confidence: ${(signal.confidence * 100).toFixed(1)}%`);
            logger_1.default.info(`   Target: ${(dynamicTP * 100).toFixed(2)}% | Stop: ${(dynamicSL * 100).toFixed(2)}%`);
        }
        catch (error) {
            logger_1.default.error(`❌ Ошибка открытия элитной сделки: ${error.message}`);
        }
    }
    async manageElitePosition() {
        if (!this.openPosition)
            return;
        const pos = this.openPosition;
        const currentPrice = await this.exchangeService.getCurrentPrice(pos.symbol);
        const elapsedTime = Date.now() - pos.entryTime;
        // Расчет PnL
        let pnl = 0;
        if (pos.side === 'long') {
            pnl = (currentPrice - pos.entryPrice) / pos.entryPrice;
        }
        else {
            pnl = (pos.entryPrice - currentPrice) / pos.entryPrice;
        }
        const leveragedPnL = pnl * this.LEVERAGE;
        const pnlUSDT = leveragedPnL * pos.positionValue;
        // УМНЫЕ УСЛОВИЯ ЗАКРЫТИЯ
        let shouldClose = false;
        let reason = '';
        // 1. Достигнута цель
        if (pnl >= pos.targetProfit) {
            shouldClose = true;
            reason = `🎯 TARGET HIT: ${(pnl * 100).toFixed(2)}%`;
        }
        // 2. Стоп-лосс
        else if (pnl <= -pos.stopLoss) {
            shouldClose = true;
            reason = `🛑 STOP LOSS: ${(pnl * 100).toFixed(2)}%`;
        }
        // 3. Таймаут
        else if (elapsedTime > this.MAX_POSITION_TIME) {
            shouldClose = true;
            reason = `⏰ TIMEOUT: ${Math.round(elapsedTime / 60000)}мин`;
        }
        // 4. ТРЕЙЛИНГ для больших прибылей
        else if (pnl >= pos.targetProfit * 0.7) {
            // Анализируем разворот
            const currentSignal = await this.analyzeUltimateSignal(pos.symbol);
            if (currentSignal.direction !== pos.side && currentSignal.confidence > 0.3) {
                shouldClose = true;
                reason = `📉 REVERSAL DETECTED`;
            }
        }
        if (shouldClose) {
            await this.closeElitePosition(pnl > 0 ? 'win' : 'loss', leveragedPnL, reason);
        }
        else {
            // Логируем прогресс каждые 30 секунд
            if (elapsedTime % 30000 < 3000) {
                logger_1.default.info(`📊 ${pos.symbol}: ${(leveragedPnL * 100).toFixed(2)}% (${pnlUSDT.toFixed(2)}$) - ${Math.round(elapsedTime / 1000)}с`);
            }
        }
    }
    async closeElitePosition(outcome, leveragedPnL, reason) {
        if (!this.openPosition)
            return;
        const pos = this.openPosition;
        const pnlUSDT = leveragedPnL * pos.positionValue;
        // Обновляем капитал (СЛОЖНЫЙ ПРОЦЕНТ)
        this.equity += pnlUSDT;
        this.dailyStats.totalPnL += pnlUSDT;
        if (outcome === 'win') {
            this.dailyStats.wins++;
        }
        const winRate = this.dailyStats.trades > 0 ? (this.dailyStats.wins / this.dailyStats.trades * 100) : 0;
        logger_1.default.info(`🏁 ЭЛИТНАЯ ПОЗИЦИЯ ЗАКРЫТА:`);
        logger_1.default.info(`   ${pos.symbol} ${pos.side.toUpperCase()}: ${outcome.toUpperCase()}`);
        logger_1.default.info(`   PnL: ${(leveragedPnL * 100).toFixed(2)}% (${pnlUSDT.toFixed(2)} USDT)`);
        logger_1.default.info(`   Причина: ${reason}`);
        logger_1.default.info(`   Новый капитал: ${this.equity.toFixed(2)} USDT`);
        logger_1.default.info(`   📊 Сегодня: ${this.dailyStats.trades} сделок, WinRate: ${winRate.toFixed(1)}%`);
        this.openPosition = null;
    }
    // Статистика для мониторинга
    getUltimateStats() {
        const winRate = this.dailyStats.trades > 0 ? (this.dailyStats.wins / this.dailyStats.trades) : 0;
        const dailyReturn = ((this.equity - 100) / 100) * 100;
        return {
            equity: this.equity,
            dailyPnL: this.dailyStats.totalPnL,
            totalTrades: this.dailyStats.trades,
            winRate: winRate,
            dailyReturn: dailyReturn,
            openPosition: this.openPosition ? 1 : 0,
            leverage: this.LEVERAGE,
            nextTradeIn: Math.max(0, this.COOLDOWN_TIME - (Date.now() - this.lastTradeTime))
        };
    }
    resetDaily() {
        this.dailyStats = { trades: 0, wins: 0, totalPnL: 0 };
    }
}
exports.UltimatePumpHunter = UltimatePumpHunter;
