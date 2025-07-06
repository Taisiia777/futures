import { config } from './config/config';
import { ExchangeService } from './services/exchangeService';
import { MockExchangeService } from './services/mockExchangeService';
import { UltimatePumpHunter } from './core/ultimatePumpHunter';
import logger from './utils/logger';

const startTradingBot = async () => {
    try {
        logger.info('🎯 Запуск ULTIMATE PUMP HUNTER - Максимальный винрейт и профит...');
        
        // В зависимости от режима выбираем реальный или тестовый сервис
        const exchangeService = config.trading.testMode 
            ? new MockExchangeService(config.binance.apiKey, config.binance.apiSecret)
            : new ExchangeService(config.binance.apiKey, config.binance.apiSecret);
            
        if (config.trading.testMode) {
            logger.info('🧪 БОТ ЗАПУЩЕН В ТЕСТОВОМ РЕЖИМЕ: Все сделки виртуальные');
        } else {
            logger.info('💰 БОТ ЗАПУЩЕН В БОЕВОМ РЕЖИМЕ: Реальная торговля на Binance Futures');
        }
        
        // Создаем ULTIMATE PUMP HUNTER
        const strategy = new UltimatePumpHunter(
            config.trading.initialCapital,
            exchangeService
        );
        
        logger.info('🚀 ULTIMATE PUMP HUNTER инициализирован');
        
        // ГЛАВНЫЙ ТОРГОВЫЙ ЦИКЛ
        const tradingLoop = async () => {
            try {
                await strategy.executeUltimateHunt();
            } catch (error: any) {
                logger.error(`❌ Ошибка в торговом цикле: ${error.message}`);
            }
        };
        
        // Запускаем цикл каждые 5 секунд (оптимально для памп-хантинга)
        setInterval(tradingLoop, 5000);
        
        // Расширенная статистика каждые 30 секунд
        setInterval(() => {
            const stats = strategy.getUltimateStats();
            logger.info(`📊 === ULTIMATE PUMP HUNTER СТАТИСТИКА ===`);
            logger.info(`   💰 Капитал: ${stats.equity.toFixed(2)} USDT (старт: ${stats.initialEquity})`);
            logger.info(`   🚀 Общий рост: ${stats.totalReturn.toFixed(1)}% | Мультипликатор: ${stats.growthMultiplier.toFixed(2)}x`);
            logger.info(`   📈 Дневная прибыль: ${stats.dailyReturn.toFixed(2)}%`);
            logger.info(`   🎯 Сделок: ${stats.totalTrades} | WinRate: ${(stats.winRate * 100).toFixed(1)}%`);
            logger.info(`   ⏱️ Следующая сделка через: ${Math.round(stats.nextTradeIn / 60000)} мин`);
            
            if (stats.compoundActive) {
                logger.info(`   📈 СЛОЖНЫЙ ПРОЦЕНТ АКТИВЕН: Увеличенные позиции`);
            }
            
            if (stats.consecutiveWins > 0) {
                logger.info(`   🔥 СЕРИЯ ПОБЕД: ${stats.consecutiveWins} подряд`);
            }
            
            if (stats.isConservativeMode) {
                logger.info(`   🛡️ КОНСЕРВАТИВНЫЙ РЕЖИМ: Просадка ${stats.currentDrawdown.toFixed(1)}%`);
            }
            
            if (stats.openPosition > 0) {
                logger.info(`   ⚡ АКТИВНАЯ ПОЗИЦИЯ`);
            }
        }, 30000);
        
        // Сброс дневной статистики в полночь
        const resetDaily = () => {
            const now = new Date();
            if (now.getHours() === 0 && now.getMinutes() === 0) {
                strategy.resetDaily();
                logger.info('🔄 Дневная статистика сброшена');
            }
        };
        setInterval(resetDaily, 60000); // Проверяем каждую минуту
        
        logger.info('🎯 ULTIMATE PUMP HUNTER готов к охоте за пампами!');
        
    } catch (error: any) {
        logger.error(`💥 Критическая ошибка запуска: ${error.message}`);
        process.exit(1);
    }
};

// Graceful shutdown
process.on('SIGINT', () => {
    logger.info('🛑 Получен сигнал остановки...');
    process.exit(0);
});

process.on('SIGTERM', () => {
    logger.info('🛑 Получен сигнал завершения...');
    process.exit(0);
});

startTradingBot();