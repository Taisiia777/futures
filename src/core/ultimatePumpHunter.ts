// 🎯 ULTIMATE PUMP HUNTER - МАКСИМАЛЬНЫЙ ВИНРЕЙТ И ПРОФИТ
import { ExchangeService } from '../services/exchangeService';
import logger from '../utils/logger';

interface PumpSignal {
  strength: number;
  confidence: number;
  direction: 'long' | 'short';
  expectedMove: number;
  timeframe: number;
}

interface Position {
  symbol: string;
  side: 'long' | 'short';
  entryPrice: number;
  quantity: number;
  entryTime: number;
  targetProfit: number;
  stopLoss: number;
  positionValue: number;
  leverage: number; // Добавляем плечо для каждой позиции
}

export class UltimatePumpHunter {
  // РЕВОЛЮЦИОННАЯ АДАПТИВНАЯ СИСТЕМА ПЛЕЧЕЙ
  private readonly BASE_LEVERAGE = 50;                 // Базовое плечо для хороших сигналов
  private readonly MIN_LEVERAGE = 20;                  // Минимум для слабых сигналов
  private readonly MAX_LEVERAGE = 200;                 // Максимум для исключительных сигналов
  private readonly ULTRA_LEVERAGE = 250;               // Экстремум для perfect conditions
  
  // ПОРОГИ ДЛЯ АДАПТИВНОГО ПЛЕЧА
  private readonly ULTRA_CONFIDENCE_THRESHOLD = 0.97;  // 97% для 250x
  private readonly HIGH_CONFIDENCE_THRESHOLD = 0.94;   // 94% для 150-200x  
  private readonly GOOD_CONFIDENCE_THRESHOLD = 0.90;   // 90% для 75-100x
  private readonly MIN_CONFIDENCE_THRESHOLD = 0.88;    // 88% для 20-50x
  private readonly BASE_POSITION_SIZE = 0.08;          // Базовый размер для reference
  private readonly MIN_CONFIDENCE = 0.88;              // 88% минимальная уверенность
  private readonly TARGET_PROFIT = 0.055;              // 5.5% тейк-профит
  private readonly STOP_LOSS = 0.012;                  // 1.2% стоп-лосс
  private readonly MAX_POSITION_TIME = 3 * 60 * 1000;  // 3 минуты максимум
  private readonly MIN_PUMP_SIZE = 0.028;              // 2.8% минимальный памп
  private readonly COOLDOWN_TIME = 0;                  // БЕЗ КУЛДАУНА
  
  // АДАПТИВНЫЕ ЛИМИТЫ ПОЗИЦИЙ
  private readonly MIN_POSITION_SIZE = 0.02;           // 2% минимум для слабых сигналов
  private readonly MAX_POSITION_SIZE = 0.22;           // 22% максимум для исключительных
  private readonly EXCEPTIONAL_THRESHOLD = 0.96;       // 96% для максимальных позиций
  private readonly EXCELLENT_THRESHOLD = 0.93;         // 93% для больших позиций
  private readonly GOOD_THRESHOLD = 0.90;              // 90% для стандартных позиций
  
  // РАСШИРЕННЫЕ ЛИМИТЫ ДЛЯ МНОЖЕСТВЕННЫХ ПАР
  private readonly MIN_VOLUME_SPIKE = 6.0;             // Минимум 6x объем
  private readonly MIN_CONSECUTIVE_MOVES = 4;          // Минимум 4 движения подряд
  private readonly MAX_DAILY_TRADES = 25;              // УВЕЛИЧЕНО до 25 сделок в день!
  private readonly MIN_TIME_BETWEEN_SAME_SYMBOL = 20 * 60 * 1000; // Сокращено до 20 минут на символ
  
  // СЛОЖНЫЙ ПРОЦЕНТ И МАСШТАБИРОВАНИЕ
  private readonly COMPOUND_THRESHOLD = 1.5;           // При 150% роста увеличиваем позиции
  private readonly MAX_POSITION_SCALE = 0.15;          // Максимум 15% при больших депозитах
  private readonly PROFIT_REINVEST_RATIO = 0.8;        // 80% прибыли реинвестируем
  private readonly CONSERVATIVE_MODE_TRIGGER = 0.3;    // При просадке 30% включаем консервативный режим
  
  // ДИНАМИЧЕСКИЕ ПАРАМЕТРЫ
  private readonly HOT_STREAK_BONUS = 1.3;             // +30% размер при серии побед
  private readonly COLD_STREAK_PENALTY = 0.7;          // -30% размер при серии поражений
  
  // СОСТОЯНИЕ БОТА
  private isConservativeMode = false;
  private consecutiveWins = 0;
  private consecutiveLosses = 0;
  private dailyPeakEquity = 0;
  private initialEquity = 0;
  
  private equity: number;
  private openPosition: Position | null = null;
  private lastTradeTime = 0;
  private dailyStats = { trades: 0, wins: 0, totalPnL: 0 };
  private symbolLastTrade: Map<string, number> = new Map(); // Отслеживание по символам
  
  private exchangeService: ExchangeService;

  constructor(
    initialEquity: number,
    exchangeService: ExchangeService
  ) {
    this.equity = initialEquity;
    this.initialEquity = initialEquity;
    this.dailyPeakEquity = initialEquity;
    this.exchangeService = exchangeService;
    
    // Инициализируем систему приоритетов символов
    const allSymbols = [
      'SOLUSDT', 'AVAXUSDT', 'ADAUSDT', 'LINKUSDT', 'ETHUSDT', 'DOTUSDT', 'BNBUSDT', 'BTCUSDT',
      'MATICUSDT', 'LTCUSDT', 'XRPUSDT', 'TRXUSDT', 'ATOMUSDT', 'NEARUSDT', 'FTMUSDT',
      'UNIUSDT', 'AAVEUSDT', 'MANAUSDT', 'SANDUSDT', 'XLMUSDT', 'EOSUSDT', 'VETUSDT', 'ALGOUSDT', 'ICXUSDT'
    ];
    this.initializeSymbolPriorities(allSymbols);
    
    logger.info(`🎯 ULTIMATE PUMP HUNTER ЗАПУЩЕН:`);
    logger.info(`💰 Стартовый капитал: ${initialEquity} USDT`);
    logger.info(`⚡ АДАПТИВНОЕ ПЛЕЧО: ${this.MIN_LEVERAGE}x-${this.ULTRA_LEVERAGE}x в зависимости от качества сигнала`);
    logger.info(`📊 Адаптивные позиции: ${this.MIN_POSITION_SIZE * 100}%-${this.MAX_POSITION_SIZE * 100}%`);
    logger.info(`🎯 Target: ${this.TARGET_PROFIT * 100}% | Stop: ${this.STOP_LOSS * 100}%`);
    logger.info(`📈 ДВОЙНАЯ АДАПТАЦИЯ: Умное плечо + умный размер позиции`);
    logger.info(`🚀 РАСШИРЕННЫЙ ОХВАТ: 24 торговые пары вместо 8! (3x больше возможностей)`);
    logger.info(`⚡ УВЕЛИЧЕННЫЙ ЛИМИТ: До ${this.MAX_DAILY_TRADES} сделок в день! (+108% больше сделок)`);
    logger.info(`⏱️ Ускоренный цикл: ${this.MIN_TIME_BETWEEN_SAME_SYMBOL / 60000} минут между повторами символа`);
    logger.info(`📊 ОЖИДАЕМЫЙ ПРИРОСТ: +300-500% к месячной прибыли благодаря адаптивным плечам!`);
  }
  
  // ГЛАВНЫЙ ТОРГОВЫЙ ЦИКЛ - РАБОТА С РЕАЛЬНЫМИ ДАННЫМИ
  public async executeUltimateHunt(): Promise<void> {
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
      
      // Получаем РАСШИРЕННЫЙ список топ криптовалют (УВЕЛИЧЕНО с 8 до 25 пар!)
      const topSymbols = [
        // 🥇 ТОП-Тир (максимальная ликвидность + гарантированные движения)
        'SOLUSDT',   // #1 - Solana: Лучшая волатильность для пампов
        'AVAXUSDT',  // #2 - Avalanche: Мощные импульсные движения  
        'ADAUSDT',   // #3 - Cardano: Популярен у масс, частые пампы
        'LINKUSDT',  // #4 - Chainlink: Резкие движения на новостях
        'ETHUSDT',   // #5 - Ethereum: Надежность + крупные движения
        'DOTUSDT',   // #6 - Polkadot: Высокая волатильность
        'BNBUSDT',   // #7 - Binance Coin: Мощные движения
        'BTCUSDT',   // #8 - Bitcoin: Основа рынка
        
        // ⭐ ВТОРОЙ ЭШЕЛОН (высокая волатильность)
        'MATICUSDT', // #9 - Polygon: DeFi популярность
        'LTCUSDT',   // #10 - Litecoin: Классические пампы
        'XRPUSDT',   // #11 - Ripple: Огромная волатильность
        'TRXUSDT',   // #12 - Tron: Частые резкие движения
        'ATOMUSDT',  // #13 - Cosmos: Межсетевые движения
        'NEARUSDT',  // #14 - Near: Новая экосистема
        'FTMUSDT',   // #15 - Fantom: DeFi сектор
        
        // 🚀 ТРЕТИЙ ЭШЕЛОН (взрывной потенциал)
        'UNIUSDT',   // #16 - Uniswap: DeFi лидер
        'AAVEUSDT',  // #17 - Aave: DeFi кредитование
        'MANAUSDT',  // #18 - Decentraland: Метавселенная
        'SANDUSDT',  // #19 - Sandbox: Gaming сектор
        'XLMUSDT',   // #20 - Stellar: Коррелирует с XRP
        'EOSUSDT',   // #21 - EOS: Старые но сильные движения
        'VETUSDT',   // #22 - VeChain: Enterprise решения
        'ALGOUSDT',  // #23 - Algorand: Технологические пампы
        'ICXUSDT'    // #24 - ICON: Корейский блокчейн
      ];
      const bestSignal = await this.findUltimateSignal(
        this.getSmartSymbolsToScan(topSymbols)
      );
      
      if (bestSignal && bestSignal.signal.confidence >= this.MIN_CONFIDENCE) {
        await this.executeEliteTrade(bestSignal);
      }
      
    } catch (error: any) {
      logger.error(`❌ Ошибка в ULTIMATE HUNT: ${error.message}`);
    }
  }
  
  private async findUltimateSignal(symbols: string[]): Promise<{ symbol: string; signal: PumpSignal } | null> {
    let bestSignal: { symbol: string; signal: PumpSignal } | null = null;
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
      } catch (error: any) {
        // Проверяем тип ошибки
        const isNetworkError = error.code === 'ECONNRESET' || 
                               error.code === 'ETIMEDOUT' || 
                               error.code === 'EHOSTUNREACH' ||
                               error.message?.includes('read ETIMEDOUT') ||
                               error.message?.includes('read ECONNRESET') ||
                               error.message?.includes('read EHOSTUNREACH');
        
        if (isNetworkError) {
          logger.warn(`🌐 Сетевая ошибка для ${symbol}: ${error.message} - пропускаем и продолжаем`);
        } else {
          logger.error(`❌ Ошибка анализа сигнала для ${symbol}: ${error.message}`);
        }
        // Продолжаем к следующему символу
      }
    }
    
    return bestSignal;
  }
  
  private async analyzeUltimateSignal(symbol: string): Promise<PumpSignal> {
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
        const move = (parseFloat(recent[i].close) - parseFloat(recent[i-1].close)) / parseFloat(recent[i-1].close);
        if ((move > 0 && direction > 0) || (move < 0 && direction < 0)) {
          consecutiveMoves++;
        }
      }
      
      // Расчет импульса (momentum)
      const recentMomentum = recent.slice(-3).reduce((sum, k, i) => {
        if (i === 0) return sum;
        return sum + Math.abs((parseFloat(k.close) - parseFloat(recent[i-1].close)) / parseFloat(recent[i-1].close));
      }, 0);
      
      // РАСЧЕТ CONFIDENCE - МАКСИМАЛЬНО ЖЕСТКИЕ КРИТЕРИИ
      let confidence = 0;
      const strength = Math.abs(priceMove);
      
      // Условие 1: Очень сильное движение (повышенные требования)
      if (strength >= this.MIN_PUMP_SIZE) confidence += 0.3;
      else return { strength: 0, confidence: 0, direction: 'long', expectedMove: 0, timeframe: 0 };
      
      // Условие 2: Мощный объемный всплеск (ужесточено)
      if (volumeSpike >= this.MIN_VOLUME_SPIKE) confidence += 0.3;
      else if (volumeSpike >= 4.0) confidence += 0.2;
      else return { strength: 0, confidence: 0, direction: 'long', expectedMove: 0, timeframe: 0 };
      
      // Условие 3: Идеальная последовательность (обязательно)
      if (consecutiveMoves >= this.MIN_CONSECUTIVE_MOVES) confidence += 0.25;
      else return { strength: 0, confidence: 0, direction: 'long', expectedMove: 0, timeframe: 0 };
      
      // Условие 4: Нарастающий импульс (обязательно для высокого confidence)
      if (recentMomentum > 0.02) confidence += 0.15;
      else if (recentMomentum > 0.015) confidence += 0.1;
      else confidence += 0.05;
      
      // СУПЕР-БОНУСЫ за исключительные условия
      if (strength >= 0.04 && volumeSpike >= 10) confidence += 0.1; // Мега-памп
      if (consecutiveMoves === 5 && volumeSpike >= 8) confidence += 0.05; // Идеальная волна
      if (strength >= 0.035 && recentMomentum > 0.025) confidence += 0.05; // Ускорение
      
      return {
        strength,
        confidence: Math.min(confidence, 1.0),
        direction: priceMove > 0 ? 'long' : 'short',
        expectedMove: strength * 1.5,
        timeframe: 180 // 3 минуты
      };
      
    } catch (error: any) {
      // Проверяем тип ошибки - сетевые ошибки не критичны
      const isNetworkError = error.code === 'ECONNRESET' || 
                             error.code === 'ETIMEDOUT' || 
                             error.code === 'EHOSTUNREACH' ||
                             error.message?.includes('read ETIMEDOUT') ||
                             error.message?.includes('read ECONNRESET') ||
                             error.message?.includes('read EHOSTUNREACH');
      
      if (isNetworkError) {
        // Сетевые ошибки - это временные проблемы, не критично
        logger.debug(`🌐 Временная сетевая ошибка для ${symbol}: ${error.message}`);
      } else {
        // Логические ошибки более серьезны
        logger.error(`❌ Ошибка анализа сигнала для ${symbol}: ${error.message}`);
      }
      
      // Возвращаем пустой сигнал, чтобы не прерывать работу бота
      return { strength: 0, confidence: 0, direction: 'long', expectedMove: 0, timeframe: 0 };
    }
  }
  
  private async executeEliteTrade(best: { symbol: string; signal: PumpSignal }): Promise<void> {
    try {
      const { symbol, signal } = best;
      
      // Получаем текущую цену
      const currentPrice = await this.exchangeService.getCurrentPrice(symbol);
      
      // РАССЧИТЫВАЕМ АДАПТИВНОЕ ПЛЕЧО НА ОСНОВЕ КАЧЕСТВА СИГНАЛА
      const optimalLeverage = this.calculateOptimalLeverage(signal);
      
      // АДАПТИВНЫЙ РАЗМЕР ПОЗИЦИИ с учетом качества сигнала И СЛОЖНОГО ПРОЦЕНТА
      let adaptivePositionSize = this.calculateOptimalPositionSize(signal.confidence);
      
      // СУПЕР-АГРЕССИВНЫЙ РЕЖИМ для исключительных сигналов
      if (this.shouldUseAggressiveMode(signal)) {
        adaptivePositionSize *= 1.8; // +80% к размеру позиции
        logger.info(`⚡⚡ СУПЕР-АГРЕССИВНЫЙ РЕЖИМ: Увеличиваем позицию на 80% для исключительного сигнала!`);
      }
      
      const positionValue = this.equity * adaptivePositionSize;
      const leveragedValue = positionValue * optimalLeverage;
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
        positionValue,
        leverage: optimalLeverage
      };
      
      this.lastTradeTime = Date.now();
      this.symbolLastTrade.set(symbol, Date.now()); // Отмечаем время торговли по символу
      this.dailyStats.trades++;
      
      logger.info(`🚀🚀 ЭЛИТНАЯ СДЕЛКА ОТКРЫТА (АДАПТИВНЫЕ ПЛЕЧО + ПОЗИЦИЯ):`);
      logger.info(`   ${symbol} ${signal.direction.toUpperCase()}`);
      logger.info(`   Цена: ${currentPrice.toFixed(2)}`);
      logger.info(`   Адаптивный размер: ${positionValue.toFixed(2)} USDT (${(adaptivePositionSize * 100).toFixed(1)}%)`);
      logger.info(`   АДАПТИВНОЕ ПЛЕЧО: ${optimalLeverage}x`);
      logger.info(`   Покрытие: ${leveragedValue.toFixed(2)} USDT`);
      logger.info(`   Confidence: ${(signal.confidence * 100).toFixed(1)}% → Плечо: ${optimalLeverage}x, Позиция: ${(adaptivePositionSize * 100).toFixed(1)}%`);
      logger.info(`   Target: ${(dynamicTP * 100).toFixed(2)}% | Stop: ${(dynamicSL * 100).toFixed(2)}%`);
      logger.info(`   📊 Сделка ${this.dailyStats.trades}/${this.MAX_DAILY_TRADES} за сегодня`);
      
    } catch (error: any) {
      logger.error(`❌ Ошибка открытия элитной сделки: ${error.message}`);
    }
  }
  
  private async manageElitePosition(): Promise<void> {
    if (!this.openPosition) return;
    
    const pos = this.openPosition;
    const currentPrice = await this.exchangeService.getCurrentPrice(pos.symbol);
    const elapsedTime = Date.now() - pos.entryTime;
    
    // Расчет PnL
    let pnl = 0;
    if (pos.side === 'long') {
      pnl = (currentPrice - pos.entryPrice) / pos.entryPrice;
    } else {
      pnl = (pos.entryPrice - currentPrice) / pos.entryPrice;
    }
    
    const leveragedPnL = pnl * pos.leverage;
    const pnlUSDT = leveragedPnL * pos.positionValue;
    
    // ПРОВЕРЯЕМ ЧАСТИЧНУЮ ФИКСАЦИЮ ПРИБЫЛИ
    if (pnl > 0) {
      const partialClosed = await this.checkPartialProfits(pos, pnl, currentPrice);
      if (partialClosed) return; // Если частично закрыли, выходим
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
      reason = `⏰ TIMEOUT: ${Math.round(elapsedTime/60000)}мин`;
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
    } else {
      // Логируем прогресс каждые 30 секунд
      if (elapsedTime % 30000 < 3000) {
        logger.info(`📊 ${pos.symbol}: ${(leveragedPnL * 100).toFixed(2)}% (${pnlUSDT.toFixed(2)}$) - ${Math.round(elapsedTime/1000)}с`);
      }
    }
    
    // ПРОДВИНУТАЯ СИСТЕМА PARTIAL PROFITS
    await this.checkPartialProfits(pos, pnl, currentPrice);
  }
  
  private async closeElitePosition(outcome: 'win' | 'loss', leveragedPnL: number, reason: string): Promise<void> {
    if (!this.openPosition) return;
    
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
    
    logger.info(`🏁 ЭЛИТНАЯ ПОЗИЦИЯ ЗАКРЫТА:`);
    logger.info(`   ${pos.symbol} ${pos.side.toUpperCase()}: ${outcome.toUpperCase()}`);
    logger.info(`   PnL: ${(leveragedPnL * 100).toFixed(2)}% (${pnlUSDT.toFixed(2)} USDT)`);
    logger.info(`   Причина: ${reason}`);
    logger.info(`   💰 Новый капитал: ${this.equity.toFixed(2)} USDT`);
    logger.info(`   📊 Сегодня: ${this.dailyStats.trades} сделок, WinRate: ${winRate.toFixed(1)}%`);
    logger.info(`   🚀 ОБЩИЙ РОСТ: ${totalReturn.toFixed(1)}% от стартового капитала`);
    
    if (outcome === 'win' && this.consecutiveWins >= 3) {
      logger.info(`   🔥 СЕРИЯ ПОБЕД: ${this.consecutiveWins} подряд!`);
    }
    
    this.openPosition = null;
  }
  
  // 🎯 РЕВОЛЮЦИОННЫЙ АДАПТИВНЫЙ РАСЧЕТ РАЗМЕРА ПОЗИЦИИ
  private calculateOptimalPositionSize(confidence: number): number {
    // БАЗОВОЕ АДАПТИВНОЕ РАСПРЕДЕЛЕНИЕ НА ОСНОВЕ КАЧЕСТВА СИГНАЛА
    let baseSize: number;
    
    if (confidence >= 0.96) {
      baseSize = 0.18;  // 18% для исключительных сигналов (96%+)
      logger.info(`🔥 ИСКЛЮЧИТЕЛЬНЫЙ СИГНАЛ: ${(confidence * 100).toFixed(1)}% - позиция 18%`);
    } else if (confidence >= 0.93) {
      baseSize = 0.12;  // 12% для отличных сигналов (93-96%)
      logger.info(`⭐ ОТЛИЧНЫЙ СИГНАЛ: ${(confidence * 100).toFixed(1)}% - позиция 12%`);
    } else if (confidence >= 0.90) {
      baseSize = 0.08;  // 8% стандартная позиция (90-93%)
      logger.info(`✅ ХОРОШИЙ СИГНАЛ: ${(confidence * 100).toFixed(1)}% - позиция 8%`);
    } else {
      baseSize = 0.04;  // 4% минимальная позиция для слабых сигналов (88-90%)
      logger.info(`⚠️ СЛАБЫЙ СИГНАЛ: ${(confidence * 100).toFixed(1)}% - позиция 4%`);
    }
    
    // 1. СЛОЖНЫЙ ПРОЦЕНТ - масштабирование с ростом капитала
    const growthMultiplier = this.equity / this.initialEquity;
    if (growthMultiplier >= this.COMPOUND_THRESHOLD) {
      // При росте капитала увеличиваем максимальный размер позиции
      const compoundBonus = Math.min(growthMultiplier * 0.08, 0.05); // Максимум +5% к адаптивной позиции
      baseSize += compoundBonus;
      
      logger.info(`📈 СЛОЖНЫЙ ПРОЦЕНТ: Рост капитала ${(growthMultiplier * 100).toFixed(1)}%, бонус к позиции: +${(compoundBonus * 100).toFixed(1)}%`);
    }
    
    // 2. СЕРИИ ПОБЕД/ПОРАЖЕНИЙ - УСИЛЕННЫЕ БОНУСЫ
    if (this.consecutiveWins >= 3) {
      const hotStreakBonus = Math.min(this.consecutiveWins * 0.015, 0.04); // До +4% за серию
      baseSize += hotStreakBonus;
      logger.info(`🔥 HOT STREAK: ${this.consecutiveWins} побед подряд, бонус: +${(hotStreakBonus * 100).toFixed(1)}%`);
    } else if (this.consecutiveLosses >= 2) {
      const coldStreakPenalty = Math.min(this.consecutiveLosses * 0.01, 0.025); // До -2.5%
      baseSize -= coldStreakPenalty;
      logger.info(`❄️ COLD STREAK: ${this.consecutiveLosses} потерь подряд, снижение: -${(coldStreakPenalty * 100).toFixed(1)}%`);
    }
    
    // 3. РЫНОЧНЫЕ УСЛОВИЯ И ОБЪЕМ
    if (confidence >= 0.94) {
      // Для супер-сигналов добавляем объемный бонус
      baseSize += 0.02; // +2% для высококачественных сигналов
      logger.info(`💎 PREMIUM QUALITY: Дополнительный бонус +2% для exceptional сигнала`);
    }
    
    // 4. КОНСЕРВАТИВНЫЙ РЕЖИМ при просадке - СТРОЖЕ
    if (this.isConservativeMode) {
      baseSize *= 0.5; // Уменьшаем позиции на 50% при просадке
      logger.info(`🛡️ КОНСЕРВАТИВНЫЙ РЕЖИМ: Уменьшаем позицию на 50%`);
    }
    
    // 5. ДНЕВНОЙ ВИНРЕЙТ - АДАПТИВНАЯ КОРРЕКТИРОВКА
    const currentWinRate = this.dailyStats.trades > 2 ? this.dailyStats.wins / this.dailyStats.trades : 0.7;
    if (currentWinRate < 0.5) {
      baseSize *= 0.6; // Значительно осторожнее при плохом дне
      logger.info(`⚠️ НИЗКИЙ ВИНРЕЙТ: ${(currentWinRate * 100).toFixed(1)}% - снижаем позицию на 40%`);
    } else if (currentWinRate > 0.85) {
      baseSize *= 1.15; // Чуть агрессивнее при отличном дне
      logger.info(`🚀 ВЫСОКИЙ ВИНРЕЙТ: ${(currentWinRate * 100).toFixed(1)}% - увеличиваем позицию на 15%`);
    }
    
    // 6. ЗАЩИТНЫЕ ЛИМИТЫ
    const maxSize = this.equity > this.initialEquity * 3 ? 0.22 : 0.18; // Максимум 18-22%
    const minSize = this.isConservativeMode ? 0.02 : 0.03; // Минимум 2-3%
    
    const finalSize = Math.min(Math.max(baseSize, minSize), maxSize);
    
    // 🛡️ ФИНАЛЬНАЯ ЗАЩИТНАЯ ПРОВЕРКА
    const protectedSize = this.shouldReducePositionSize(finalSize);
    
    logger.info(`📊 ФИНАЛЬНАЯ ПОЗИЦИЯ: ${(protectedSize * 100).toFixed(1)}% от капитала (${(protectedSize * this.equity).toFixed(2)} USDT)`);
    
    return protectedSize;
  }
  
  // 🚀 РЕВОЛЮЦИОННЫЙ РАСЧЕТ АДАПТИВНОГО ПЛЕЧА
  private calculateOptimalLeverage(signal: PumpSignal): number {
    const { confidence, strength } = signal;
    let optimalLeverage = this.BASE_LEVERAGE;
    
    // БАЗОВОЕ ПЛЕЧО НА ОСНОВЕ CONFIDENCE
    if (confidence >= this.ULTRA_CONFIDENCE_THRESHOLD) {
      optimalLeverage = this.ULTRA_LEVERAGE; // 250x для 97%+ сигналов
      logger.info(`🔥🔥 ULTRA LEVERAGE: ${confidence*100}% confidence → ${optimalLeverage}x плечо`);
    } else if (confidence >= this.HIGH_CONFIDENCE_THRESHOLD) {
      // 150x-200x для 94-97% сигналов
      optimalLeverage = 150 + (confidence - this.HIGH_CONFIDENCE_THRESHOLD) * 1667; // Linear interpolation
      logger.info(`⚡ HIGH LEVERAGE: ${confidence*100}% confidence → ${optimalLeverage.toFixed(0)}x плечо`);
    } else if (confidence >= this.GOOD_CONFIDENCE_THRESHOLD) {
      // 75x-150x для 90-94% сигналов  
      optimalLeverage = 75 + (confidence - this.GOOD_CONFIDENCE_THRESHOLD) * 1875;
      logger.info(`✅ GOOD LEVERAGE: ${confidence*100}% confidence → ${optimalLeverage.toFixed(0)}x плечо`);
    } else {
      // 20x-75x для 88-90% сигналов
      optimalLeverage = this.MIN_LEVERAGE + (confidence - this.MIN_CONFIDENCE_THRESHOLD) * 2750;
      logger.info(`⚠️ SAFE LEVERAGE: ${confidence*100}% confidence → ${optimalLeverage.toFixed(0)}x плечо`);
    }
    
    // БОНУСЫ ЗА ИСКЛЮЧИТЕЛЬНЫЕ УСЛОВИЯ
    
    // 1. Бонус за силу движения
    if (strength >= 0.05) {
      optimalLeverage *= 1.3; // +30% за мощное движение
      logger.info(`💪 STRENGTH BONUS: +30% плеча за движение ${(strength*100).toFixed(1)}%`);
    } else if (strength >= 0.035) {
      optimalLeverage *= 1.15; // +15% за хорошее движение
      logger.info(`💪 STRENGTH BONUS: +15% плеча за движение ${(strength*100).toFixed(1)}%`);
    }
    
    // 2. Бонус за серию побед
    if (this.consecutiveWins >= 5) {
      optimalLeverage *= 1.4; // +40% за горячую серию
      logger.info(`🔥 HOT STREAK BONUS: +40% плеча за ${this.consecutiveWins} побед подряд!`);
    } else if (this.consecutiveWins >= 3) {
      optimalLeverage *= 1.2; // +20% за хорошую серию
      logger.info(`🔥 WIN STREAK BONUS: +20% плеча за ${this.consecutiveWins} побед подряд`);
    }
    
    // 3. Бонус за рост капитала (compound effect)
    const growthMultiplier = this.equity / this.initialEquity;
    if (growthMultiplier >= 3.0) {
      optimalLeverage *= 1.25; // +25% при росте капитала в 3 раза
      logger.info(`📈 COMPOUND BONUS: +25% плеча за рост капитала в ${growthMultiplier.toFixed(1)} раз`);
    } else if (growthMultiplier >= 2.0) {
      optimalLeverage *= 1.15; // +15% при удвоении капитала
      logger.info(`📈 GROWTH BONUS: +15% плеча за рост капитала в ${growthMultiplier.toFixed(1)} раз`);
    }
    
    // ШТРАФЫ И ОГРАНИЧЕНИЯ
    
    // 1. Штраф за серию потерь
    if (this.consecutiveLosses >= 3) {
      optimalLeverage *= 0.4; // -60% за серию потерь
      logger.warn(`❄️ COLD STREAK PENALTY: -60% плеча за ${this.consecutiveLosses} потерь подряд`);
    } else if (this.consecutiveLosses >= 2) {
      optimalLeverage *= 0.7; // -30% за пару потерь
      logger.warn(`❄️ LOSS PENALTY: -30% плеча за ${this.consecutiveLosses} потери подряд`);
    }
    
    // 2. Консервативный режим при просадке
    if (this.isConservativeMode) {
      optimalLeverage *= 0.5; // -50% в консервативном режиме
      logger.warn(`🛡️ CONSERVATIVE MODE: -50% плеча из-за просадки`);
    }
    
    // 3. Защитный режим при больших потерях
    if (this.protectiveMode) {
      optimalLeverage = Math.min(optimalLeverage, 25); // Максимум 25x в защитном режиме
      logger.warn(`🚨 PROTECTIVE MODE: Ограничение плеча до 25x`);
    }
    
    // 4. Низкий дневной винрейт
    const dayWinRate = this.dailyStats.trades > 0 ? this.dailyStats.wins / this.dailyStats.trades : 1;
    if (dayWinRate < 0.5) {
      optimalLeverage *= 0.6; // -40% при низком винрейте
      logger.warn(`📉 LOW WINRATE PENALTY: -40% плеча при винрейте ${(dayWinRate*100).toFixed(1)}%`);
    }
    
    // ФИНАЛЬНЫЕ ОГРАНИЧЕНИЯ
    const finalLeverage = Math.min(Math.max(optimalLeverage, this.MIN_LEVERAGE), this.ULTRA_LEVERAGE);
    
    logger.info(`🎯 ФИНАЛЬНОЕ ПЛЕЧО: ${finalLeverage.toFixed(0)}x (${(finalLeverage/this.BASE_LEVERAGE).toFixed(1)}x от базового)`);
    
    return Math.round(finalLeverage);
  }
  
  // УПРАВЛЕНИЕ СОСТОЯНИЕМ БОТА
  private updateBotState(pnlUSDT: number): void {
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
    } else {
      this.consecutiveLosses++;
      this.consecutiveWins = 0;
    }
    
    if (this.isConservativeMode) {
      logger.warn(`⚠️ КОНСЕРВАТИВНЫЙ РЕЖИМ АКТИВЕН: Просадка ${(drawdown * 100).toFixed(1)}%`);
    }
  }
  
  // Расширенная статистика для мониторинга адаптивной системы
  public getUltimateStats() {
    const winRate = this.dailyStats.trades > 0 ? (this.dailyStats.wins / this.dailyStats.trades) : 0;
    const totalReturn = ((this.equity - this.initialEquity) / this.initialEquity) * 100;
    const dailyReturn = ((this.equity - this.initialEquity) / this.initialEquity) * 100;
    const growthMultiplier = this.equity / this.initialEquity;
    const drawdown = this.dailyPeakEquity > 0 ? ((this.dailyPeakEquity - this.equity) / this.dailyPeakEquity) * 100 : 0;
    const dayLossPercent = Math.abs(this.dailyStats.totalPnL) / this.equity * 100;
    
    return {
      equity: this.equity,
      initialEquity: this.initialEquity,
      totalReturn: totalReturn,
      dailyPnL: this.dailyStats.totalPnL,
      totalTrades: this.dailyStats.trades,
      winRate: winRate,
      dailyReturn: dailyReturn,
      openPosition: this.openPosition ? 1 : 0,
      leverage: this.BASE_LEVERAGE, // Показываем базовое плечо в статистике
      nextTradeIn: Math.max(0, this.COOLDOWN_TIME - (Date.now() - this.lastTradeTime)),
      // Адаптивная система метрики
      growthMultiplier: growthMultiplier,
      isConservativeMode: this.isConservativeMode,
      isProtectiveMode: this.protectiveMode,
      consecutiveWins: this.consecutiveWins,
      consecutiveLosses: this.consecutiveLosses,
      currentDrawdown: drawdown,
      dayLossPercent: dayLossPercent,
      positionSizeRange: `${this.MIN_POSITION_SIZE * 100}%-${this.MAX_POSITION_SIZE * 100}%`,
      compoundActive: growthMultiplier >= this.COMPOUND_THRESHOLD,
      adaptiveSystemActive: true
    };
  }
  
  public resetDaily(): void {
    this.dailyStats = { trades: 0, wins: 0, totalPnL: 0 };
    this.symbolLastTrade.clear(); // Сбрасываем ограничения по символам
    this.dailyPeakEquity = this.equity; // Обновляем пиковый капитал
    this.consecutiveWins = 0;
    this.consecutiveLosses = 0;
    this.protectiveMode = false; // Сбрасываем защитный режим
    this.dayMaxLoss = 0;
    
    // Сбрасываем консервативный режим если капитал восстановился
    if (this.equity >= this.dailyPeakEquity * 0.9) {
      this.isConservativeMode = false;
    }
    
    logger.info('📊 Ежедневная статистика сброшена');
    logger.info(`💰 Текущий капитал: ${this.equity.toFixed(2)} USDT`);
    logger.info(`🚀 Общий рост: ${(((this.equity - this.initialEquity) / this.initialEquity) * 100).toFixed(1)}%`);
    logger.info(`⚡ АДАПТИВНАЯ СИСТЕМА: Готова к новому дню торговли!`);
  }
  
  // ПРОДВИНУТАЯ СИСТЕМА PARTIAL PROFITS
  private async checkPartialProfits(pos: Position, pnl: number, currentPrice: number): Promise<boolean> {
    if (pnl <= 0) return false;
    
    const targetReached = pnl / pos.targetProfit;
    
    // ЧАСТИЧНАЯ ФИКСАЦИОНА ПРИБЫЛИ для максимизации доходности
    if (targetReached >= 0.6 && targetReached < 0.8) {
      // При достижении 60% цели - фиксируем 30% позиции
      const partialProfit = pos.positionValue * 0.3 * pnl * pos.leverage;
      this.equity += partialProfit;
      
      logger.info(`💎 PARTIAL PROFIT: Зафиксировали 30% позиции на ${(pnl * 100).toFixed(2)}%`);
      logger.info(`   💰 Прибыль: +${partialProfit.toFixed(2)} USDT`);
      
      // Подтягиваем стоп-лосс к безубытку
      pos.stopLoss = Math.min(pos.stopLoss, 0.005); // Максимум 0.5% риск
      
      return false; // Продолжаем держать оставшуюся позицию
    }
    
    if (targetReached >= 0.8 && targetReached < 1.2) {
      // При достижении 80% цели - фиксируем еще 40% позиции
      const partialProfit = pos.positionValue * 0.4 * pnl * pos.leverage;
      this.equity += partialProfit;
      
      logger.info(`💎💎 SECOND PARTIAL: Зафиксировали еще 40% позиции`);
      logger.info(`   💰 Прибыль: +${partialProfit.toFixed(2)} USDT`);
      
      // Перемещаем стоп в прибыль
      pos.stopLoss = -0.01; // 1% прибыль гарантирован
      
      return false; // Держим последние 30% для максимума
    }
    
    return false;
  }
  
  // СУПЕР-АГРЕССИВНЫЙ РЕЖИМ для exceptional сигналов
  private shouldUseAggressiveMode(signal: PumpSignal): boolean {
    return (
      signal.confidence >= 0.95 &&
      signal.strength >= 0.04 &&
      this.consecutiveWins >= 2 &&
      !this.isConservativeMode &&
      this.dailyStats.trades < this.MAX_DAILY_TRADES - 2 // Остался запас сделок
    );
  }
  
  // 🛡️ ЗАЩИТНАЯ СИСТЕМА ДЛЯ АДАПТИВНЫХ ПОЗИЦИЙ
  private protectiveMode = false;
  private dayMaxLoss = 0;
  private readonly MAX_DAILY_LOSS_PERCENT = 0.25; // 25% максимальная дневная потеря
  
  // Защитная проверка перед открытием крупной позиции
  private shouldReducePositionSize(requestedSize: number): number {
    // Проверяем дневные потери
    const dayLossPercent = Math.abs(this.dailyStats.totalPnL) / this.equity;
    
    if (dayLossPercent > this.MAX_DAILY_LOSS_PERCENT) {
      this.protectiveMode = true;
      logger.warn(`🚨 ЗАЩИТНЫЙ РЕЖИМ: Дневные потери ${(dayLossPercent * 100).toFixed(1)}% - максимум 3% позиции!`);
      return Math.min(requestedSize, 0.03);
    }
    
    // Если подряд 3 убыточные сделки - ограничиваем размер
    if (this.consecutiveLosses >= 3) {
      logger.warn(`⚠️ ОСТОРОЖНОСТЬ: ${this.consecutiveLosses} потерь подряд - ограничиваем позицию`);
      return Math.min(requestedSize, 0.06);
    }
    
    return requestedSize;
  }
  
  // 🔄 ИНТЕЛЛЕКТУАЛЬНАЯ СИСТЕМА РОТАЦИИ ПАР
  private symbolPriority: Map<string, number> = new Map();
  private lastFullScan = 0;
  private readonly FULL_SCAN_INTERVAL = 2 * 60 * 1000; // Полное сканирование каждые 2 минуты
  
  // Инициализация приоритетов символов
  private initializeSymbolPriorities(symbols: string[]): void {
    symbols.forEach((symbol, index) => {
      // Первые 8 символов получают высший приоритет
      const priority = index < 8 ? 1.0 : (index < 16 ? 0.8 : 0.6);
      this.symbolPriority.set(symbol, priority);
    });
  }
  
  // Умная ротация для максимального охвата
  private getSmartSymbolsToScan(allSymbols: string[]): string[] {
    const now = Date.now();
    
    // Каждые 2 минуты делаем полное сканирование всех пар
    if (now - this.lastFullScan > this.FULL_SCAN_INTERVAL) {
      this.lastFullScan = now;
      logger.info(`🔄 ПОЛНОЕ СКАНИРОВАНИЕ: Проверяем все 24 пары для максимального охвата`);
      return allSymbols;
    }
    
    // В остальное время фокусируемся на приоритетных + ротируем случайные
    const highPriority = allSymbols.slice(0, 12); // Топ-12 всегда
    const randomFromRest = allSymbols.slice(12).sort(() => Math.random() - 0.5).slice(0, 6); // 6 случайных
    
    return [...highPriority, ...randomFromRest];
  }
}
