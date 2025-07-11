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
        this.MIN_CONFIDENCE = 0.88; // 88% минимальная уверенность (ПОВЫШЕНО!)
        this.TARGET_PROFIT = 0.055; // 5.5% тейк-профит (550% ROI)
        this.STOP_LOSS = 0.012; // 1.2% стоп-лосс (120% потеря)
        this.MAX_POSITION_TIME = 3 * 60 * 1000; // 3 минуты максимум
        this.MIN_PUMP_SIZE = 0.028; // 2.8% минимальный памп (ПОВЫШЕНО!)
        this.COOLDOWN_TIME = 0; // БЕЗ КУЛДАУНА - максимальная агрессивность!
        // НОВЫЕ ФИЛЬТРЫ ДЛЯ МАКСИМАЛЬНОГО КАЧЕСТВА
        this.MIN_VOLUME_SPIKE = 6.0; // Минимум 6x объем
        this.MIN_CONSECUTIVE_MOVES = 4; // Минимум 4 движения подряд
        this.MAX_DAILY_TRADES = 12; // Увеличиваем до 12 сделок в день (БЕЗ КУЛДАУНА!)
        this.MIN_TIME_BETWEEN_SAME_SYMBOL = 30 * 60 * 1000; // Сокращаем до 30 минут на тот же символ
        // СЛОЖНЫЙ ПРОЦЕНТ И МАСШТАБИРОВАНИЕ
        this.COMPOUND_THRESHOLD = 1.5; // При 150% роста увеличиваем позиции
        this.MAX_POSITION_SCALE = 0.15; // Максимум 15% при больших депозитах
        this.PROFIT_REINVEST_RATIO = 0.8; // 80% прибыли реинвестируем
        this.CONSERVATIVE_MODE_TRIGGER = 0.3; // При просадке 30% включаем консервативный режим
        // ДИНАМИЧЕСКИЕ ПАРАМЕТРЫ
        this.HOT_STREAK_BONUS = 1.3; // +30% размер при серии побед
        this.COLD_STREAK_PENALTY = 0.7; // -30% размер при серии поражений
        // СОСТОЯНИЕ БОТА
        this.isConservativeMode = false;
        this.consecutiveWins = 0;
        this.consecutiveLosses = 0;
        this.dailyPeakEquity = 0;
        this.initialEquity = 0;
        this.openPosition = null;
        this.lastTradeTime = 0;
        this.dailyStats = { trades: 0, wins: 0, totalPnL: 0 };
        this.symbolLastTrade = new Map(); // Отслеживание по символам
        this.equity = initialEquity;
        this.initialEquity = initialEquity;
        this.dailyPeakEquity = initialEquity;
        this.exchangeService = exchangeService;
        logger_1.default.info(`🎯 ULTIMATE PUMP HUNTER ЗАПУЩЕН:`);
        logger_1.default.info(`💰 Стартовый капитал: ${initialEquity} USDT`);
        logger_1.default.info(`⚡ Плечо: ${this.LEVERAGE}x | Базовая позиция: ${this.POSITION_SIZE * 100}%`);
        logger_1.default.info(`🎯 Target: ${this.TARGET_PROFIT * 100}% | Stop: ${this.STOP_LOSS * 100}%`);
        logger_1.default.info(`📈 СЛОЖНЫЙ ПРОЦЕНТ: Активен с автомасштабированием`);
        logger_1.default.info(`🚀 БЕЗ КУЛДАУНА: Максимальная агрессивность! До ${this.MAX_DAILY_TRADES} сделок в день!`);
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
            // Проверяем дневной лимит сделок
            if (this.dailyStats.trades >= this.MAX_DAILY_TRADES) {
                return;
            }
            // Проверяем кулдаун
            if (Date.now() - this.lastTradeTime < this.COOLDOWN_TIME) {
                return;
            }
            // Получаем топ криптовалют в порядке приоритета (волатильные первыми)
            const topSymbols = [
                'SOLUSDT', // #1 - Solana: Лучшая волатильность для пампов
                'AVAXUSDT', // #2 - Avalanche: Сильные импульсные движения  
                'ADAUSDT', // #3 - Cardano: Популярен, частые пампы
                'LINKUSDT', // #4 - Chainlink: Резкие движения
                'ETHUSDT', // #5 - Ethereum: Надежность + движения
                'DOTUSDT', // #6 - Polkadot: Высокая волатильность
                'BNBUSDT', // #7 - Binance Coin: Сильные движения
                'BTCUSDT' // #8 - Bitcoin: Основа рынка, крупные движения
            ];
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
                // Проверяем кулдаун для конкретного символа
                const lastSymbolTrade = this.symbolLastTrade.get(symbol) || 0;
                if (Date.now() - lastSymbolTrade < this.MIN_TIME_BETWEEN_SAME_SYMBOL) {
                    continue;
                }
                const signal = await this.analyzeUltimateSignal(symbol);
                if (signal.confidence > maxConfidence && signal.confidence >= this.MIN_CONFIDENCE) {
                    maxConfidence = signal.confidence;
                    bestSignal = { symbol, signal };
                }
            }
            catch (error) {
                // Проверяем тип ошибки
                const isNetworkError = error.code === 'ECONNRESET' ||
                    error.code === 'ETIMEDOUT' ||
                    error.code === 'EHOSTUNREACH' ||
                    error.message?.includes('read ETIMEDOUT') ||
                    error.message?.includes('read ECONNRESET') ||
                    error.message?.includes('read EHOSTUNREACH');
                if (isNetworkError) {
                    logger_1.default.warn(`🌐 Сетевая ошибка для ${symbol}: ${error.message} - пропускаем и продолжаем`);
                }
                else {
                    logger_1.default.error(`❌ Ошибка анализа сигнала для ${symbol}: ${error.message}`);
                }
                // Продолжаем к следующему символу
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
            // Расчет импульса (momentum)
            const recentMomentum = recent.slice(-3).reduce((sum, k, i) => {
                if (i === 0)
                    return sum;
                return sum + Math.abs((parseFloat(k.close) - parseFloat(recent[i - 1].close)) / parseFloat(recent[i - 1].close));
            }, 0);
            // РАСЧЕТ CONFIDENCE - МАКСИМАЛЬНО ЖЕСТКИЕ КРИТЕРИИ
            let confidence = 0;
            const strength = Math.abs(priceMove);
            // Условие 1: Очень сильное движение (повышенные требования)
            if (strength >= this.MIN_PUMP_SIZE)
                confidence += 0.3;
            else
                return { strength: 0, confidence: 0, direction: 'long', expectedMove: 0, timeframe: 0 };
            // Условие 2: Мощный объемный всплеск (ужесточено)
            if (volumeSpike >= this.MIN_VOLUME_SPIKE)
                confidence += 0.3;
            else if (volumeSpike >= 4.0)
                confidence += 0.2;
            else
                return { strength: 0, confidence: 0, direction: 'long', expectedMove: 0, timeframe: 0 };
            // Условие 3: Идеальная последовательность (обязательно)
            if (consecutiveMoves >= this.MIN_CONSECUTIVE_MOVES)
                confidence += 0.25;
            else
                return { strength: 0, confidence: 0, direction: 'long', expectedMove: 0, timeframe: 0 };
            // Условие 4: Нарастающий импульс (обязательно для высокого confidence)
            if (recentMomentum > 0.02)
                confidence += 0.15;
            else if (recentMomentum > 0.015)
                confidence += 0.1;
            else
                confidence += 0.05;
            // СУПЕР-БОНУСЫ за исключительные условия
            if (strength >= 0.04 && volumeSpike >= 10)
                confidence += 0.1; // Мега-памп
            if (consecutiveMoves === 5 && volumeSpike >= 8)
                confidence += 0.05; // Идеальная волна
            if (strength >= 0.035 && recentMomentum > 0.025)
                confidence += 0.05; // Ускорение
            return {
                strength,
                confidence: Math.min(confidence, 1.0),
                direction: priceMove > 0 ? 'long' : 'short',
                expectedMove: strength * 1.5,
                timeframe: 180 // 3 минуты
            };
        }
        catch (error) {
            // Проверяем тип ошибки - сетевые ошибки не критичны
            const isNetworkError = error.code === 'ECONNRESET' ||
                error.code === 'ETIMEDOUT' ||
                error.code === 'EHOSTUNREACH' ||
                error.message?.includes('read ETIMEDOUT') ||
                error.message?.includes('read ECONNRESET') ||
                error.message?.includes('read EHOSTUNREACH');
            if (isNetworkError) {
                // Сетевые ошибки - это временные проблемы, не критично
                logger_1.default.debug(`🌐 Временная сетевая ошибка для ${symbol}: ${error.message}`);
            }
            else {
                // Логические ошибки более серьезны
                logger_1.default.error(`❌ Ошибка анализа сигнала для ${symbol}: ${error.message}`);
            }
            // Возвращаем пустой сигнал, чтобы не прерывать работу бота
            return { strength: 0, confidence: 0, direction: 'long', expectedMove: 0, timeframe: 0 };
        }
    }
    async executeEliteTrade(best) {
        try {
            const { symbol, signal } = best;
            // Получаем текущую цену
            const currentPrice = await this.exchangeService.getCurrentPrice(symbol);
            // АДАПТИВНЫЙ РАЗМЕР ПОЗИЦИИ с учетом качества сигнала И СЛОЖНОГО ПРОЦЕНТА
            let adaptivePositionSize = this.calculateOptimalPositionSize(signal.confidence);
            // СУПЕР-АГРЕССИВНЫЙ РЕЖИМ для исключительных сигналов
            if (this.shouldUseAggressiveMode(signal)) {
                adaptivePositionSize *= 1.8; // +80% к размеру позиции
                logger_1.default.info(`⚡⚡ СУПЕР-АГРЕССИВНЫЙ РЕЖИМ: Увеличиваем позицию на 80% для исключительного сигнала!`);
            }
            const positionValue = this.equity * adaptivePositionSize;
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
            this.symbolLastTrade.set(symbol, Date.now()); // Отмечаем время торговли по символу
            this.dailyStats.trades++;
            logger_1.default.info(`🚀🚀 ЭЛИТНАЯ СДЕЛКА ОТКРЫТА:`);
            logger_1.default.info(`   ${symbol} ${signal.direction.toUpperCase()}`);
            logger_1.default.info(`   Цена: ${currentPrice.toFixed(2)}`);
            logger_1.default.info(`   Размер: ${positionValue.toFixed(2)} USDT (${this.LEVERAGE}x)`);
            logger_1.default.info(`   Покрытие: ${leveragedValue.toFixed(2)} USDT`);
            logger_1.default.info(`   Confidence: ${(signal.confidence * 100).toFixed(1)}%`);
            logger_1.default.info(`   Target: ${(dynamicTP * 100).toFixed(2)}% | Stop: ${(dynamicSL * 100).toFixed(2)}%`);
            logger_1.default.info(`   📊 Сделка ${this.dailyStats.trades}/${this.MAX_DAILY_TRADES} за сегодня`);
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
        // ПРОВЕРЯЕМ ЧАСТИЧНУЮ ФИКСАЦИЮ ПРИБЫЛИ
        if (pnl > 0) {
            const partialClosed = await this.checkPartialProfits(pos, pnl, currentPrice);
            if (partialClosed)
                return; // Если частично закрыли, выходим
        }
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
        // 4. УМНЫЙ ТРЕЙЛИНГ для максимизации прибыли
        else if (pnl >= pos.targetProfit * 0.6) {
            // Анализируем разворот и объем
            const currentSignal = await this.analyzeUltimateSignal(pos.symbol);
            const ticker24hr = await this.exchangeService.getTicker24hr(pos.symbol);
            const currentVolume = parseFloat(ticker24hr.volume);
            // Закрываем если объем падает И есть признаки разворота
            if (currentSignal.direction !== pos.side &&
                currentSignal.confidence > 0.25 &&
                currentVolume < parseFloat(ticker24hr.volume) * 0.7) {
                shouldClose = true;
                reason = `📉 SMART TRAILING: Разворот + падение объема`;
            }
        }
        // 5. ЗАЩИТА ОТ РЕЗКИХ ДВИЖЕНИЙ ПРОТИВ НАС
        else if (pnl <= -pos.stopLoss * 0.7) {
            // Быстрое закрытие если движение против нас ускоряется
            const recentSignal = await this.analyzeUltimateSignal(pos.symbol);
            if (recentSignal.direction !== pos.side && recentSignal.confidence > 0.5) {
                shouldClose = true;
                reason = `⚡ FAST EXIT: Сильное движение против`;
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
        // ПРОДВИНУТАЯ СИСТЕМА PARTIAL PROFITS
        await this.checkPartialProfits(pos, pnl, currentPrice);
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
        // Обновляем состояние бота для адаптивного управления
        this.updateBotState(pnlUSDT);
        const winRate = this.dailyStats.trades > 0 ? (this.dailyStats.wins / this.dailyStats.trades * 100) : 0;
        const totalReturn = ((this.equity - this.initialEquity) / this.initialEquity * 100);
        logger_1.default.info(`🏁 ЭЛИТНАЯ ПОЗИЦИЯ ЗАКРЫТА:`);
        logger_1.default.info(`   ${pos.symbol} ${pos.side.toUpperCase()}: ${outcome.toUpperCase()}`);
        logger_1.default.info(`   PnL: ${(leveragedPnL * 100).toFixed(2)}% (${pnlUSDT.toFixed(2)} USDT)`);
        logger_1.default.info(`   Причина: ${reason}`);
        logger_1.default.info(`   💰 Новый капитал: ${this.equity.toFixed(2)} USDT`);
        logger_1.default.info(`   📊 Сегодня: ${this.dailyStats.trades} сделок, WinRate: ${winRate.toFixed(1)}%`);
        logger_1.default.info(`   🚀 ОБЩИЙ РОСТ: ${totalReturn.toFixed(1)}% от стартового капитала`);
        if (outcome === 'win' && this.consecutiveWins >= 3) {
            logger_1.default.info(`   🔥 СЕРИЯ ПОБЕД: ${this.consecutiveWins} подряд!`);
        }
        this.openPosition = null;
    }
    // ПРОДВИНУТЫЙ РАСЧЕТ ОПТИМАЛЬНОГО РАЗМЕРА ПОЗИЦИИ
    calculateOptimalPositionSize(confidence) {
        let baseSize = this.POSITION_SIZE;
        // 1. СЛОЖНЫЙ ПРОЦЕНТ - масштабирование с ростом капитала
        const growthMultiplier = this.equity / this.initialEquity;
        if (growthMultiplier >= this.COMPOUND_THRESHOLD) {
            // При росте капитала увеличиваем максимальный размер позиции
            const compoundBonus = Math.min(growthMultiplier * 0.1, 0.07); // Максимум +7%
            baseSize += compoundBonus;
            logger_1.default.info(`📈 СЛОЖНЫЙ ПРОЦЕНТ: Рост капитала ${(growthMultiplier * 100).toFixed(1)}%, бонус к позиции: +${(compoundBonus * 100).toFixed(1)}%`);
        }
        // 2. КАЧЕСТВО СИГНАЛА - увеличиваем для супер-сигналов
        if (confidence >= 0.95) {
            baseSize *= 1.5; // +50% для исключительных сигналов
        }
        else if (confidence >= 0.92) {
            baseSize *= 1.3; // +30% для отличных сигналов
        }
        else if (confidence >= 0.90) {
            baseSize *= 1.15; // +15% для хороших сигналов
        }
        // 3. СЕРИИ ПОБЕД/ПОРАЖЕНИЙ
        if (this.consecutiveWins >= 3) {
            baseSize *= this.HOT_STREAK_BONUS; // Увеличиваем при серии побед
            logger_1.default.info(`🔥 HOT STREAK: ${this.consecutiveWins} побед подряд, увеличиваем позицию на ${((this.HOT_STREAK_BONUS - 1) * 100).toFixed(0)}%`);
        }
        else if (this.consecutiveLosses >= 2) {
            baseSize *= this.COLD_STREAK_PENALTY; // Уменьшаем при серии потерь
            logger_1.default.info(`❄️ COLD STREAK: ${this.consecutiveLosses} потерь подряд, уменьшаем позицию на ${((1 - this.COLD_STREAK_PENALTY) * 100).toFixed(0)}%`);
        }
        // 4. КОНСЕРВАТИВНЫЙ РЕЖИМ при просадке
        if (this.isConservativeMode) {
            baseSize *= 0.6; // Уменьшаем позиции при просадке
            logger_1.default.info(`🛡️ КОНСЕРВАТИВНЫЙ РЕЖИМ: Уменьшаем позицию на 40%`);
        }
        // 5. ДНЕВНОЙ ВИНРЕЙТ
        const currentWinRate = this.dailyStats.trades > 0 ? this.dailyStats.wins / this.dailyStats.trades : 1;
        if (currentWinRate < 0.6) {
            baseSize *= 0.7; // Осторожнее при низком винрейте
        }
        else if (currentWinRate > 0.9) {
            baseSize *= 1.2; // Агрессивнее при высоком винрейте
        }
        // 6. ОГРАНИЧЕНИЯ
        const maxSize = this.equity > this.initialEquity * 3 ? this.MAX_POSITION_SCALE : 0.12;
        return Math.min(Math.max(baseSize, 0.04), maxSize); // Минимум 4%, максимум 12-15%
    }
    // УПРАВЛЕНИЕ СОСТОЯНИЕМ БОТА
    updateBotState(pnlUSDT) {
        // Обновляем пиковый капитал
        if (this.equity > this.dailyPeakEquity) {
            this.dailyPeakEquity = this.equity;
        }
        // Проверяем просадку для консервативного режима
        const drawdown = (this.dailyPeakEquity - this.equity) / this.dailyPeakEquity;
        this.isConservativeMode = drawdown >= this.CONSERVATIVE_MODE_TRIGGER;
        // Обновляем серии побед/поражений
        if (pnlUSDT > 0) {
            this.consecutiveWins++;
            this.consecutiveLosses = 0;
        }
        else {
            this.consecutiveLosses++;
            this.consecutiveWins = 0;
        }
        if (this.isConservativeMode) {
            logger_1.default.warn(`⚠️ КОНСЕРВАТИВНЫЙ РЕЖИМ АКТИВЕН: Просадка ${(drawdown * 100).toFixed(1)}%`);
        }
    }
    // Расширенная статистика для мониторинга
    getUltimateStats() {
        const winRate = this.dailyStats.trades > 0 ? (this.dailyStats.wins / this.dailyStats.trades) : 0;
        const totalReturn = ((this.equity - this.initialEquity) / this.initialEquity) * 100;
        const dailyReturn = ((this.equity - this.initialEquity) / this.initialEquity) * 100; // Можно сделать дневной расчет
        const growthMultiplier = this.equity / this.initialEquity;
        const drawdown = this.dailyPeakEquity > 0 ? ((this.dailyPeakEquity - this.equity) / this.dailyPeakEquity) * 100 : 0;
        return {
            equity: this.equity,
            initialEquity: this.initialEquity,
            totalReturn: totalReturn,
            dailyPnL: this.dailyStats.totalPnL,
            totalTrades: this.dailyStats.trades,
            winRate: winRate,
            dailyReturn: dailyReturn,
            openPosition: this.openPosition ? 1 : 0,
            leverage: this.LEVERAGE,
            nextTradeIn: Math.max(0, this.COOLDOWN_TIME - (Date.now() - this.lastTradeTime)),
            // Новые метрики для сложного процента
            growthMultiplier: growthMultiplier,
            isConservativeMode: this.isConservativeMode,
            consecutiveWins: this.consecutiveWins,
            consecutiveLosses: this.consecutiveLosses,
            currentDrawdown: drawdown,
            compoundActive: growthMultiplier >= this.COMPOUND_THRESHOLD
        };
    }
    resetDaily() {
        this.dailyStats = { trades: 0, wins: 0, totalPnL: 0 };
        this.symbolLastTrade.clear(); // Сбрасываем ограничения по символам
        this.dailyPeakEquity = this.equity; // Обновляем пиковый капитал
        this.consecutiveWins = 0;
        this.consecutiveLosses = 0;
        // Сбрасываем консервативный режим если капитал восстановился
        if (this.equity >= this.dailyPeakEquity * 0.9) {
            this.isConservativeMode = false;
        }
        logger_1.default.info('📊 Ежедневная статистика сброшена');
        logger_1.default.info(`💰 Текущий капитал: ${this.equity.toFixed(2)} USDT`);
        logger_1.default.info(`🚀 Общий рост: ${(((this.equity - this.initialEquity) / this.initialEquity) * 100).toFixed(1)}%`);
    }
    // ПРОДВИНУТАЯ СИСТЕМА PARTIAL PROFITS
    async checkPartialProfits(pos, pnl, currentPrice) {
        if (pnl <= 0)
            return false;
        const targetReached = pnl / pos.targetProfit;
        // ЧАСТИЧНАЯ ФИКСАЦИЯ ПРИБЫЛИ для максимизации доходности
        if (targetReached >= 0.6 && targetReached < 0.8) {
            // При достижении 60% цели - фиксируем 30% позиции
            const partialProfit = pos.positionValue * 0.3 * pnl * this.LEVERAGE;
            this.equity += partialProfit;
            logger_1.default.info(`💎 PARTIAL PROFIT: Зафиксировали 30% позиции на ${(pnl * 100).toFixed(2)}%`);
            logger_1.default.info(`   💰 Прибыль: +${partialProfit.toFixed(2)} USDT`);
            // Подтягиваем стоп-лосс к безубытку
            pos.stopLoss = Math.min(pos.stopLoss, 0.005); // Максимум 0.5% риск
            return false; // Продолжаем держать оставшуюся позицию
        }
        if (targetReached >= 0.8 && targetReached < 1.2) {
            // При достижении 80% цели - фиксируем еще 40% позиции
            const partialProfit = pos.positionValue * 0.4 * pnl * this.LEVERAGE;
            this.equity += partialProfit;
            logger_1.default.info(`💎💎 SECOND PARTIAL: Зафиксировали еще 40% позиции`);
            logger_1.default.info(`   💰 Прибыль: +${partialProfit.toFixed(2)} USDT`);
            // Перемещаем стоп в прибыль
            pos.stopLoss = -0.01; // 1% прибыль гарантирован
            return false; // Держим последние 30% для максимума
        }
        return false;
    }
    // СУПЕР-АГРЕССИВНЫЙ РЕЖИМ для exceptional сигналов
    shouldUseAggressiveMode(signal) {
        return (signal.confidence >= 0.95 &&
            signal.strength >= 0.04 &&
            this.consecutiveWins >= 2 &&
            !this.isConservativeMode &&
            this.dailyStats.trades < this.MAX_DAILY_TRADES - 2 // Остался запас сделок
        );
    }
}
exports.UltimatePumpHunter = UltimatePumpHunter;
