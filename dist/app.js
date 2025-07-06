"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("./config/config");
const exchangeService_1 = require("./services/exchangeService");
const mockExchangeService_1 = require("./services/mockExchangeService");
const ultimatePumpHunter_1 = require("./core/ultimatePumpHunter");
const logger_1 = __importDefault(require("./utils/logger"));
const startTradingBot = async () => {
    try {
        logger_1.default.info('🎯 Запуск ULTIMATE PUMP HUNTER - Максимальный винрейт и профит...');
        // В зависимости от режима выбираем реальный или тестовый сервис
        const exchangeService = config_1.config.trading.testMode
            ? new mockExchangeService_1.MockExchangeService(config_1.config.binance.apiKey, config_1.config.binance.apiSecret)
            : new exchangeService_1.ExchangeService(config_1.config.binance.apiKey, config_1.config.binance.apiSecret);
        if (config_1.config.trading.testMode) {
            logger_1.default.info('🧪 БОТ ЗАПУЩЕН В ТЕСТОВОМ РЕЖИМЕ: Все сделки виртуальные');
        }
        else {
            logger_1.default.info('💰 БОТ ЗАПУЩЕН В БОЕВОМ РЕЖИМЕ: Реальная торговля на Binance Futures');
        }
        // Создаем ULTIMATE PUMP HUNTER
        const strategy = new ultimatePumpHunter_1.UltimatePumpHunter(config_1.config.trading.initialCapital, exchangeService);
        logger_1.default.info('🚀 ULTIMATE PUMP HUNTER инициализирован');
        // ГЛАВНЫЙ ТОРГОВЫЙ ЦИКЛ
        const tradingLoop = async () => {
            try {
                await strategy.executeUltimateHunt();
            }
            catch (error) {
                logger_1.default.error(`❌ Ошибка в торговом цикле: ${error.message}`);
            }
        };
        // Запускаем цикл каждые 5 секунд (оптимально для памп-хантинга)
        setInterval(tradingLoop, 5000);
        // Расширенная статистика каждые 30 секунд
        setInterval(() => {
            const stats = strategy.getUltimateStats();
            logger_1.default.info(`📊 === ULTIMATE PUMP HUNTER СТАТИСТИКА ===`);
            logger_1.default.info(`   💰 Капитал: ${stats.equity.toFixed(2)} USDT (старт: ${stats.initialEquity})`);
            logger_1.default.info(`   🚀 Общий рост: ${stats.totalReturn.toFixed(1)}% | Мультипликатор: ${stats.growthMultiplier.toFixed(2)}x`);
            logger_1.default.info(`   📈 Дневная прибыль: ${stats.dailyReturn.toFixed(2)}%`);
            logger_1.default.info(`   🎯 Сделок: ${stats.totalTrades} | WinRate: ${(stats.winRate * 100).toFixed(1)}%`);
            logger_1.default.info(`   ⏱️ Следующая сделка через: ${Math.round(stats.nextTradeIn / 60000)} мин`);
            if (stats.compoundActive) {
                logger_1.default.info(`   📈 СЛОЖНЫЙ ПРОЦЕНТ АКТИВЕН: Увеличенные позиции`);
            }
            if (stats.consecutiveWins > 0) {
                logger_1.default.info(`   🔥 СЕРИЯ ПОБЕД: ${stats.consecutiveWins} подряд`);
            }
            if (stats.isConservativeMode) {
                logger_1.default.info(`   🛡️ КОНСЕРВАТИВНЫЙ РЕЖИМ: Просадка ${stats.currentDrawdown.toFixed(1)}%`);
            }
            if (stats.openPosition > 0) {
                logger_1.default.info(`   ⚡ АКТИВНАЯ ПОЗИЦИЯ`);
            }
        }, 30000);
        // Сброс дневной статистики в полночь
        const resetDaily = () => {
            const now = new Date();
            if (now.getHours() === 0 && now.getMinutes() === 0) {
                strategy.resetDaily();
                logger_1.default.info('🔄 Дневная статистика сброшена');
            }
        };
        setInterval(resetDaily, 60000); // Проверяем каждую минуту
        logger_1.default.info('🎯 ULTIMATE PUMP HUNTER готов к охоте за пампами!');
    }
    catch (error) {
        logger_1.default.error(`💥 Критическая ошибка запуска: ${error.message}`);
        process.exit(1);
    }
};
// Graceful shutdown
process.on('SIGINT', () => {
    logger_1.default.info('🛑 Получен сигнал остановки...');
    process.exit(0);
});
process.on('SIGTERM', () => {
    logger_1.default.info('🛑 Получен сигнал завершения...');
    process.exit(0);
});
startTradingBot();
