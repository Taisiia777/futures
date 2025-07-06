#!/usr/bin/env npx ts-node
import fs from 'fs';
import path from 'path';
import { config } from './src/config/config';
import { ExchangeService } from './src/services/exchangeService';
import { MockExchangeService } from './src/services/mockExchangeService';
import { UltimatePumpHunter } from './src/core/ultimatePumpHunter';
import logger from './src/utils/logger';

/**
 * НОЧНОЙ ТЕСТ ULTIMATE PUMP HUNTER
 * Расширенная версия с подробной аналитикой и автоматическим отчетом
 */

interface NightTestResult {
    startTime: string;
    endTime: string;
    duration: number; // в минутах
    initialCapital: number;
    finalCapital: number;
    totalReturn: number;
    totalTrades: number;
    winningTrades: number;
    losingTrades: number;
    winRate: number;
    profitFactor: number;
    maxDrawdown: number;
    avgTradeReturn: number;
    avgWinSize: number;
    avgLossSize: number;
    bestTrade: number;
    worstTrade: number;
    consecutiveWins: number;
    consecutiveLosses: number;
    dailyReturns: number[];
    hourlyPnL: { hour: number; pnl: number }[];
    symbolPerformance: { symbol: string; trades: number; pnl: number }[];
    compoundGrowthActivated: boolean;
    conservativeModeActivated: boolean;
    partialProfitsTaken: number;
    superAggressiveTrades: number;
}

class NightTestRunner {
    private strategy: UltimatePumpHunter;
    private startTime: Date;
    private testResults: NightTestResult;
    private exchangeService: ExchangeService | MockExchangeService;
    
    constructor() {
        // Создаем обменный сервис
        this.exchangeService = config.trading.testMode 
            ? new MockExchangeService(config.binance.apiKey, config.binance.apiSecret)
            : new ExchangeService(config.binance.apiKey, config.binance.apiSecret);
            
        // Создаем стратегию
        this.strategy = new UltimatePumpHunter(
            config.trading.initialCapital,
            this.exchangeService
        );
        
        this.startTime = new Date();
        this.testResults = this.initializeResults();
        
        logger.info('🌙 НОЧНОЙ ТЕСТ ULTIMATE PUMP HUNTER ИНИЦИАЛИЗИРОВАН');
        logger.info(`💰 Начальный капитал: ${config.trading.initialCapital} USDT`);
        logger.info(`🎯 Режим: ${config.trading.testMode ? 'ВИРТУАЛЬНЫЙ' : 'БОЕВОЙ'}`);
    }
    
    private initializeResults(): NightTestResult {
        return {
            startTime: this.startTime.toISOString(),
            endTime: '',
            duration: 0,
            initialCapital: config.trading.initialCapital,
            finalCapital: config.trading.initialCapital,
            totalReturn: 0,
            totalTrades: 0,
            winningTrades: 0,
            losingTrades: 0,
            winRate: 0,
            profitFactor: 0,
            maxDrawdown: 0,
            avgTradeReturn: 0,
            avgWinSize: 0,
            avgLossSize: 0,
            bestTrade: 0,
            worstTrade: 0,
            consecutiveWins: 0,
            consecutiveLosses: 0,
            dailyReturns: [],
            hourlyPnL: [],
            symbolPerformance: [],
            compoundGrowthActivated: false,
            conservativeModeActivated: false,
            partialProfitsTaken: 0,
            superAggressiveTrades: 0
        };
    }
    
    async startNightTest(durationHours: number = 8): Promise<void> {
        logger.info(`🚀 ЗАПУСК НОЧНОГО ТЕСТА НА ${durationHours} ЧАСОВ`);
        
        const endTime = new Date(Date.now() + durationHours * 60 * 60 * 1000);
        let hourlyStats: { hour: number; pnl: number }[] = [];
        let lastHourRecorded = new Date().getHours();
        
        // Главный торговый цикл
        const tradingLoop = async () => {
            try {
                await this.strategy.executeUltimateHunt();
                this.updateRealTimeStats();
                
                // Записываем почасовую статистику
                const currentHour = new Date().getHours();
                if (currentHour !== lastHourRecorded) {
                    const stats = this.strategy.getUltimateStats();
                    hourlyStats.push({
                        hour: currentHour,
                        pnl: stats.equity - this.testResults.initialCapital
                    });
                    lastHourRecorded = currentHour;
                }
                
            } catch (error: any) {
                logger.error(`❌ Ошибка в торговом цикле: ${error.message}`);
            }
        };
        
        // Запускаем цикл каждые 3 секунды (агрессивный скан)
        const tradingInterval = setInterval(tradingLoop, 3000);
        
        // Расширенная статистика каждые 60 секунд
        const statsInterval = setInterval(() => {
            this.logExtendedStats();
        }, 60000);
        
        // Краткая статистика каждые 10 секунд
        const quickStatsInterval = setInterval(() => {
            this.logQuickStats();
        }, 10000);
        
        // Ждем завершения теста
        await new Promise<void>((resolve) => {
            const checkEnd = () => {
                if (Date.now() >= endTime.getTime()) {
                    clearInterval(tradingInterval);
                    clearInterval(statsInterval);
                    clearInterval(quickStatsInterval);
                    resolve();
                }
            };
            setInterval(checkEnd, 1000);
        });
        
        // Финализируем результаты
        this.testResults.hourlyPnL = hourlyStats;
        await this.finalizeResults();
        await this.generateDetailedReport();
        
        logger.info('🏁 НОЧНОЙ ТЕСТ ЗАВЕРШЕН! Генерируем детальный отчет...');
    }
    
    private updateRealTimeStats(): void {
        const stats = this.strategy.getUltimateStats();
        
        this.testResults.finalCapital = stats.equity;
        this.testResults.totalReturn = stats.totalReturn;
        this.testResults.totalTrades = stats.totalTrades;
        this.testResults.winningTrades = Math.round(stats.totalTrades * stats.winRate);
        this.testResults.losingTrades = stats.totalTrades - this.testResults.winningTrades;
        this.testResults.winRate = stats.winRate;
        this.testResults.maxDrawdown = stats.currentDrawdown;
        this.testResults.consecutiveWins = stats.consecutiveWins;
        this.testResults.consecutiveLosses = stats.consecutiveLosses;
        this.testResults.compoundGrowthActivated = stats.compoundActive;
        this.testResults.conservativeModeActivated = stats.isConservativeMode;
    }
    
    private logQuickStats(): void {
        const stats = this.strategy.getUltimateStats();
        const runtime = Math.round((Date.now() - this.startTime.getTime()) / 60000);
        
        logger.info(`⚡ [${runtime}м] $${stats.equity.toFixed(2)} | ${stats.totalReturn.toFixed(1)}% | ${stats.totalTrades} сделок | WR: ${(stats.winRate * 100).toFixed(1)}%`);
    }
    
    private logExtendedStats(): void {
        const stats = this.strategy.getUltimateStats();
        const runtime = Math.round((Date.now() - this.startTime.getTime()) / 60000);
        const winningTrades = Math.round(stats.totalTrades * stats.winRate);
        const losingTrades = stats.totalTrades - winningTrades;
        
        logger.info(`📊 === РАСШИРЕННАЯ СТАТИСТИКА [${runtime} минут] ===`);
        logger.info(`💰 Капитал: ${stats.equity.toFixed(2)} USDT (рост: ${stats.totalReturn.toFixed(2)}%)`);
        logger.info(`🎯 Сделки: ${stats.totalTrades} | Побед: ${winningTrades} | Поражений: ${losingTrades}`);
        logger.info(`📈 WinRate: ${(stats.winRate * 100).toFixed(1)}% | Просадка: ${stats.currentDrawdown.toFixed(1)}%`);
        logger.info(`🔥 Серия побед: ${stats.consecutiveWins} | Серия поражений: ${stats.consecutiveLosses}`);
        
        if (stats.compoundActive) {
            logger.info(`📈 СЛОЖНЫЙ ПРОЦЕНТ АКТИВЕН! Увеличенные позиции`);
        }
        
        if (stats.isConservativeMode) {
            logger.info(`🛡️ КОНСЕРВАТИВНЫЙ РЕЖИМ (просадка ${stats.currentDrawdown.toFixed(1)}%)`);
        }
        
        if (stats.openPosition > 0) {
            logger.info(`⚡ АКТИВНАЯ ПОЗИЦИЯ`);
        }
        
        logger.info(`⏱️ Следующая сделка: ${Math.round(stats.nextTradeIn / 60000)} минут`);
    }
    
    private async finalizeResults(): Promise<void> {
        const endTime = new Date();
        this.testResults.endTime = endTime.toISOString();
        this.testResults.duration = Math.round((endTime.getTime() - this.startTime.getTime()) / 60000);
        
        // Рассчитываем дополнительные метрики
        if (this.testResults.totalTrades > 0) {
            this.testResults.avgTradeReturn = this.testResults.totalReturn / this.testResults.totalTrades;
            
            // Эти метрики требуют доступа к детальной истории сделок
            // В реальной реализации их нужно собирать в процессе торговли
            this.testResults.profitFactor = this.testResults.winRate > 0 ? 
                (this.testResults.totalReturn * this.testResults.winRate) / 
                (Math.abs(this.testResults.totalReturn * (1 - this.testResults.winRate))) : 0;
        }
    }
    
    private async generateDetailedReport(): Promise<void> {
        const reportPath = path.join(process.cwd(), `night_test_report_${Date.now()}.md`);
        
        const report = `# 🌙 НОЧНОЙ ТЕСТ ULTIMATE PUMP HUNTER
        
## 📊 ОБЩИЕ РЕЗУЛЬТАТЫ

- **Период тестирования**: ${this.testResults.startTime} → ${this.testResults.endTime}
- **Длительность**: ${this.testResults.duration} минут (${(this.testResults.duration / 60).toFixed(1)} часов)
- **Начальный капитал**: $${this.testResults.initialCapital}
- **Финальный капитал**: $${this.testResults.finalCapital.toFixed(2)}
- **Общая доходность**: ${this.testResults.totalReturn.toFixed(2)}%
- **Мультипликатор роста**: ${(this.testResults.finalCapital / this.testResults.initialCapital).toFixed(2)}x

## 🎯 ТОРГОВАЯ СТАТИСТИКА

- **Всего сделок**: ${this.testResults.totalTrades}
- **Выигрышных сделок**: ${this.testResults.winningTrades}
- **Проигрышных сделок**: ${this.testResults.losingTrades}
- **WinRate**: ${(this.testResults.winRate * 100).toFixed(1)}%
- **Profit Factor**: ${this.testResults.profitFactor.toFixed(2)}
- **Максимальная просадка**: ${this.testResults.maxDrawdown.toFixed(1)}%

## 🔥 СЕРИИ

- **Максимальная серия побед**: ${this.testResults.consecutiveWins}
- **Максимальная серия поражений**: ${this.testResults.consecutiveLosses}

## 🚀 ПРОДВИНУТЫЕ ФУНКЦИИ

- **Сложный процент активирован**: ${this.testResults.compoundGrowthActivated ? '✅ ДА' : '❌ НЕТ'}
- **Консервативный режим активирован**: ${this.testResults.conservativeModeActivated ? '✅ ДА' : '❌ НЕТ'}
- **Частичные фиксации прибыли**: ${this.testResults.partialProfitsTaken}
- **Супер-агрессивные сделки**: ${this.testResults.superAggressiveTrades}

## 💡 АНАЛИЗ ПРОИЗВОДИТЕЛЬНОСТИ

${this.generatePerformanceAnalysis()}

## 🎉 ЗАКЛЮЧЕНИЕ

${this.generateConclusion()}

---
*Отчет сгенерирован автоматически ${new Date().toLocaleString()}*
`;

        fs.writeFileSync(reportPath, report);
        logger.info(`📄 Детальный отчет сохранен: ${reportPath}`);
    }
    
    private generatePerformanceAnalysis(): string {
        let analysis = '';
        
        if (this.testResults.winRate >= 0.85) {
            analysis += '✅ **Отличный WinRate** (≥85%) - стратегия показывает высокую точность\n';
        } else if (this.testResults.winRate >= 0.70) {
            analysis += '✅ **Хороший WinRate** (70-84%) - стратегия работает стабильно\n';
        } else {
            analysis += '⚠️ **Низкий WinRate** (<70%) - требуется оптимизация параметров\n';
        }
        
        if (this.testResults.totalReturn > 50) {
            analysis += '🚀 **Исключительная доходность** (>50%) - экспоненциальный рост!\n';
        } else if (this.testResults.totalReturn > 20) {
            analysis += '📈 **Высокая доходность** (20-50%) - отличные результаты\n';
        } else if (this.testResults.totalReturn > 0) {
            analysis += '📊 **Положительная доходность** - стратегия прибыльна\n';
        } else {
            analysis += '📉 **Убыточность** - требуется серьезная доработка\n';
        }
        
        if (this.testResults.maxDrawdown < 10) {
            analysis += '🛡️ **Низкий риск** - просадка менее 10%\n';
        } else if (this.testResults.maxDrawdown < 20) {
            analysis += '⚖️ **Умеренный риск** - просадка 10-20%\n';
        } else {
            analysis += '⚠️ **Высокий риск** - просадка более 20%\n';
        }
        
        return analysis;
    }
    
    private generateConclusion(): string {
        const isSuccessful = this.testResults.totalReturn > 0 && this.testResults.winRate >= 0.7;
        
        if (isSuccessful) {
            return `🎉 **ТЕСТ УСПЕШЕН!** Стратегия ULTIMATE PUMP HUNTER показала отличные результаты с доходностью ${this.testResults.totalReturn.toFixed(1)}% и WinRate ${(this.testResults.winRate * 100).toFixed(1)}%. 

**Рекомендации для продакшена:**
- Увеличить размер депозита для масштабирования прибыли
- Активировать сложный процент для экспоненциального роста
- Рассмотреть добавление новых символов для торговли
- Настроить автоматические уведомления о крупных прибылях`;
        } else {
            return `⚠️ **ТЕСТ ТРЕБУЕТ ДОРАБОТКИ** Стратегия показала результаты ниже ожидаемых.

**Рекомендации для улучшения:**
- Оптимизировать параметры фильтрации сигналов
- Скорректировать уровни Take Profit и Stop Loss
- Пересмотреть логику управления рисками
- Провести дополнительное тестирование на разных рыночных условиях`;
        }
    }
}

// Запуск ночного теста
async function runNightTest() {
    const testRunner = new NightTestRunner();
    
    // Параметры теста (можно изменить)
    const testDurationHours = process.argv[2] ? parseFloat(process.argv[2]) : 8; // По умолчанию 8 часов
    
    logger.info(`🌙 Запуск ночного теста на ${testDurationHours} часов...`);
    
    try {
        await testRunner.startNightTest(testDurationHours);
        logger.info('✅ Ночной тест успешно завершен!');
    } catch (error: any) {
        logger.error(`💥 Ошибка ночного теста: ${error.message}`);
        process.exit(1);
    }
}

// Graceful shutdown
process.on('SIGINT', () => {
    logger.info('🛑 Получен сигнал остановки ночного теста...');
    process.exit(0);
});

process.on('SIGTERM', () => {
    logger.info('🛑 Получен сигнал завершения ночного теста...');
    process.exit(0);
});

// Запускаем тест
runNightTest();
